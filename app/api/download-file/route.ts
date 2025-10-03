import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    // Clean the file path - remove \public\ prefix if present
    let cleanPath = filePath;
    if (cleanPath.startsWith('\\public\\')) {
      cleanPath = cleanPath.replace('\\public\\', '');
    } else if (cleanPath.startsWith('/public/')) {
      cleanPath = cleanPath.replace('/public/', '');
    }
    
    // Ensure the path starts with public/
    if (!cleanPath.startsWith('public/')) {
      cleanPath = `public/${cleanPath}`;
    }
    
    // Construct the full file path
    const fullPath = join(process.cwd(), cleanPath);
    
    console.log('📥 Download request:', {
      originalPath: filePath,
      cleanPath,
      fullPath
    });
    
    // Read the file
    const fileBuffer = await readFile(fullPath);
    
    // Extract filename from path
    const fileName = cleanPath.split('/').pop() || 'document';
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    
    // Check if it's a file not found error
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
