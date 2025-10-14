import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { sanitizeFileName, generateUniqueFileName } from '@/utils/fileUtils';
import { uploadToAzure, AzureUploadResult } from '@/services/azureService';
import { logToFile, logError } from '@/utils/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userEmail = formData.get('userEmail') as string || 'unknown';
    const projectId = formData.get('projectId') as string || null;
    
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('User email from formData:', userEmail);
    console.log('Project ID from formData:', projectId);
    console.log('Number of files:', files.length);
    console.log('First file type:', files[0]?.constructor?.name);
    console.log('First file instanceof File:', files[0] instanceof File);
    console.log('========================');
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
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

      console.log('=== UPLOADING TO AZURE ===');
      console.log('Original filename:', file.name);
      console.log('File size:', file.size);
      console.log('File type (from browser):', file.type);
      console.log('File extension:', path.extname(file.name).toLowerCase());
      console.log('User email:', userEmail);
      console.log('Azure config check:', {
        hasAccount: !!process.env.AZURE_STORAGE_ACCOUNT,
        hasContainer: !!process.env.AZURE_STORAGE_CONTAINER,
        hasSasToken: !!process.env.AZURE_STORAGE_SAS_TOKEN,
        accountName: process.env.AZURE_STORAGE_ACCOUNT || 'NOT_SET',
        containerName: process.env.AZURE_STORAGE_CONTAINER || 'NOT_SET'
      });
      console.log('==============================');

      try {
        // Upload to Azure
        console.log('🔄 Calling uploadToAzure with file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          constructor: file.constructor.name
        });
        
        console.log('🔄 About to call uploadToAzure function...');
        
        // Use projectId for folder name if provided, otherwise fall back to email
        const folderName = projectId 
          ? `hive-documents/${projectId}` 
          : `hive-documents/${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        console.log('📁 Upload folder:', folderName);
        
        const azureResult: AzureUploadResult = await uploadToAzure(file, {
          folder: folderName,
          metadata: {
            originalName: file.name,
            userEmail: userEmail,
            projectId: projectId || 'unknown',
            uploadedAt: new Date().toISOString()
          }
        });
        console.log('🔄 uploadToAzure completed successfully');

        console.log('✅ File uploaded to Azure successfully:', {
          fileName: azureResult.fileName,
          downloadURL: azureResult.downloadURL,
          fullPath: azureResult.fullPath,
          originalName: azureResult.originalName
        });

        uploadedFiles.push({
          originalName: file.name,
          fileName: azureResult.fileName,
          filePath: azureResult.fullPath, // Store full path
          downloadURL: azureResult.downloadURL, // Store download URL
          size: file.size,
          type: file.type,
        });

      } catch (azureError) {
        console.error('❌ Azure upload failed, falling back to local storage:', azureError);
        const errorInfo = {
          message: azureError instanceof Error ? azureError.message : 'Unknown error',
          stack: azureError instanceof Error ? azureError.stack : undefined,
          name: azureError instanceof Error ? azureError.name : undefined,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        };
        console.error('❌ Azure error details:', errorInfo);
        logError('❌ Azure upload failed, falling back to local storage', errorInfo);
        
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

        uploadedFiles.push({
          originalName: file.name,
          fileName: uniqueFileName,
          filePath: `/uploads/${uniqueFileName}`,
          size: file.size,
          type: file.type,
          isLocalFallback: true
        });
      }
    }

    // Check if any files were stored locally instead of Azure
    const localFiles = uploadedFiles.filter(file => file.isLocalFallback);
    const azureFiles = uploadedFiles.filter(file => !file.isLocalFallback);
    
    let message = `Successfully uploaded ${uploadedFiles.length} file(s)`;
    if (localFiles.length > 0) {
      message += ` (${localFiles.length} stored locally, ${azureFiles.length} in Azure)`;
      console.warn(`⚠️ WARNING: ${localFiles.length} files were stored locally instead of Azure. Check Azure configuration.`);
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message,
      warnings: localFiles.length > 0 ? [
        `${localFiles.length} files were stored locally instead of Azure. Please configure Azure Storage environment variables for proper document URL generation.`
      ] : undefined
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}


