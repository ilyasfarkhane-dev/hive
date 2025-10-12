import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { sanitizeFileName, generateUniqueFileName } from '@/utils/fileUtils';
import { uploadToAzure, deleteFromAzure, extractPathFromAzureURL, AzureUploadResult } from '@/services/azureService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userEmail = formData.get('userEmail') as string || 'unknown';
    const oldDocumentUrl = formData.get('oldDocumentUrl') as string;
    
    console.log('=== DOCUMENT REPLACEMENT DEBUG ===');
    console.log('User email from formData:', userEmail);
    console.log('Number of files:', files.length);
    console.log('Old document URL:', oldDocumentUrl);
    console.log('First file type:', files[0]?.constructor?.name);
    console.log('First file instanceof File:', files[0] instanceof File);
    console.log('========================');
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Take only the first file (single document replacement)
    const file = files[0];

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `File ${file.name} exceeds 10MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.xlsx', '.pptx'];
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `File type ${fileExtension} is not allowed` },
        { status: 400 }
      );
    }

    console.log('=== REPLACING DOCUMENT IN AZURE ===');
    console.log('Original filename:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    console.log('User email:', userEmail);
    console.log('Old document URL:', oldDocumentUrl);
    console.log('Azure config check:', {
      hasAccount: !!process.env.AZURE_STORAGE_ACCOUNT,
      hasContainer: !!process.env.AZURE_STORAGE_CONTAINER,
      hasSasToken: !!process.env.AZURE_STORAGE_SAS_TOKEN,
      accountName: process.env.AZURE_STORAGE_ACCOUNT || 'NOT_SET',
      containerName: process.env.AZURE_STORAGE_CONTAINER || 'NOT_SET'
    });
    console.log('==============================');

    let uploadResult: AzureUploadResult | null = null;
    let deleteResult = false;

    try {
      // First, upload the new file to Azure
      console.log('🔄 Uploading new file to Azure...');
      uploadResult = await uploadToAzure(file, {
        folder: 'hive-documents', // Single shared folder for all documents
        metadata: {
          originalName: file.name,
          userEmail: userEmail,
          uploadedAt: new Date().toISOString(),
          replacedOldDocument: oldDocumentUrl || 'none'
        }
      });
      console.log('✅ New file uploaded successfully:', uploadResult);

      // Then, delete the old file from Azure if URL is provided
      if (oldDocumentUrl && oldDocumentUrl.trim()) {
        console.log('🗑️ Deleting old document from Azure...');
        console.log('🔍 Original old document URL:', oldDocumentUrl);
        
        // Clean up the URL first (decode HTML entities)
        const cleanedUrl = oldDocumentUrl
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        
        console.log('🔍 Cleaned old document URL:', cleanedUrl);
        console.log('🔍 URL validation:', {
          isComplete: cleanedUrl.includes('sig='),
          hasSignature: cleanedUrl.includes('sig='),
          urlLength: cleanedUrl.length,
          endsWithSignature: cleanedUrl.endsWith('%3D') || cleanedUrl.endsWith('='),
          containsAllParams: cleanedUrl.includes('sv=') && cleanedUrl.includes('ss=') && cleanedUrl.includes('sig=')
        });
        
        // Extract the file path from the old URL
        const oldFilePath = extractPathFromAzureURL(cleanedUrl);
        if (oldFilePath) {
          console.log('📁 Old file path extracted:', oldFilePath);
          deleteResult = await deleteFromAzure(oldFilePath);
          if (deleteResult) {
            console.log('✅ Old document deleted successfully');
          } else {
            console.log('⚠️ Failed to delete old document, but new document uploaded successfully');
          }
        } else {
          console.log('⚠️ Could not extract file path from old URL:', cleanedUrl);
          console.log('🔍 URL analysis:', {
            hasBlobCore: cleanedUrl.includes('.blob.core.windows.net'),
            hasContainer: cleanedUrl.includes('/input/'),
            urlLength: cleanedUrl.length,
            firstPart: cleanedUrl.substring(0, 100),
            lastPart: cleanedUrl.substring(Math.max(0, cleanedUrl.length - 100))
          });
        }
      } else {
        console.log('ℹ️ No old document URL provided, skipping deletion');
      }

      const result = {
        success: true,
        file: {
          originalName: file.name,
          fileName: uploadResult.fileName,
          filePath: uploadResult.fullPath,
          downloadURL: uploadResult.downloadURL,
          size: file.size,
          type: file.type,
        },
        oldDocumentDeleted: deleteResult,
        oldDocumentUrl: oldDocumentUrl
      };

      console.log('✅ Document replacement completed successfully:', result);

      return NextResponse.json(result);

    } catch (azureError) {
      console.error('❌ Azure operation failed, falling back to local storage:', azureError);
      console.error('❌ Azure error details:', {
        message: azureError instanceof Error ? azureError.message : 'Unknown error',
        stack: azureError instanceof Error ? azureError.stack : undefined,
        name: azureError instanceof Error ? azureError.name : undefined
      });
      
      // Check if it's a configuration error
      if (azureError instanceof Error && azureError.message.includes('Azure Storage configuration missing')) {
        console.error('🚨 CRITICAL: Azure Storage is not configured! Please set these environment variables:');
        console.error('   - AZURE_STORAGE_ACCOUNT');
        console.error('   - AZURE_STORAGE_CONTAINER');
        console.error('   - AZURE_STORAGE_SAS_TOKEN');
        console.error('   Without these, documents will be stored locally instead of Azure.');
      }
      
      // Fallback to local storage if Azure fails
      const safeFileName = sanitizeFileName(file.name);
      const uniqueFileName = generateUniqueFileName(file.name);
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, uniqueFileName);

      console.log('=== FALLBACK TO LOCAL STORAGE ===');
      console.log('Original filename:', file.name);
      console.log('Safe filename:', safeFileName);
      console.log('Final filename:', uniqueFileName);
      console.log('Full path:', filePath);
      console.log('==================================');

      // Convert File to Buffer and save locally
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer as any);
      
      console.log('✅ File saved locally as fallback:', uniqueFileName);

      return NextResponse.json({
        success: true,
        file: {
          originalName: file.name,
          fileName: uniqueFileName,
          filePath: `/uploads/${uniqueFileName}`,
          size: file.size,
          type: file.type,
          isLocalFallback: true
        },
        oldDocumentDeleted: false,
        oldDocumentUrl: oldDocumentUrl,
        warnings: ['Document was stored locally instead of Azure. Check Azure configuration.']
      });
    }

  } catch (error) {
    console.error('Document replacement error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to replace document' },
      { status: 500 }
    );
  }
}
