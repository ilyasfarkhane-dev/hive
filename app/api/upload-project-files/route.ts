import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { sanitizeFileName, generateUniqueFileName } from '@/utils/fileUtils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 UPLOAD-PROJECT-FILES API CALLED');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const projectId = formData.get('projectId') as string;
    const userEmail = formData.get('userEmail') as string || 'unknown';
    
    console.log('=== PROJECT FILE UPLOAD DEBUG ===');
    console.log('Project ID:', projectId);
    console.log('User email:', userEmail);
    console.log('Number of files:', files.length);
    console.log('Files details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    console.log('===============================');
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
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

      // Generate filename with timestamp and original filename
      // Sanitize filename by removing/replacing special characters
      const safeFileName = sanitizeFileName(file.name);
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = path.join(uploadsDir, uniqueFileName);

      console.log('=== SAVING PROJECT FILE ===');
      console.log('Original filename:', file.name);
      console.log('Safe filename:', safeFileName);
      console.log('Final filename:', uniqueFileName);
      console.log('Full path:', filePath);
      console.log('===========================');

      // Convert File to Buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer as any); // Type assertion: Buffer is compatible with writeFile
      
      console.log('✅ Project file saved successfully:', uniqueFileName);

      uploadedFiles.push({
        originalName: file.name,
        fileName: uniqueFileName,
        filePath: `/uploads/${uniqueFileName}`,
        size: file.size,
        type: file.type,
        projectId: projectId,
        userEmail: userEmail,
        uploadedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s) for project ${projectId}`,
    });
  } catch (error) {
    console.error('Project file upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload project files' },
      { status: 500 }
    );
  }
}
