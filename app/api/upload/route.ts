import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('Upload request received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });
    
    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file properties
    if (!file.name || file.size === 0) {
      console.log('Invalid file properties:', {
        hasName: !!file.name,
        name: file.name,
        size: file.size
      });
      return NextResponse.json({ error: 'Invalid file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename with proper extension handling
    const timestamp = Date.now();
    const fileName = file.name || 'unknown_file';
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const filename = `project_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the URL path
    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      filename,
      url: fileUrl,
      size: file.size,
      type: file.type,
      originalName: file.name
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' }, 
      { status: 500 }
    );
  }
}
