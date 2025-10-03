import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    console.log('🔍 Download API - Raw filePath from query:', filePath);
    
    if (!filePath) {
      console.log('❌ Download API - No file path provided');
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    // Clean the file path - remove \public\ prefix if present
    let cleanPath = filePath;
    if (cleanPath.startsWith('\\public\\')) {
      cleanPath = cleanPath.replace('\\public\\', '');
    } else if (cleanPath.startsWith('/public/')) {
      cleanPath = cleanPath.replace('/public/', '');
    }
    
    // Handle the case where the path might be malformed
    // If it starts with _uploads_, it might be a malformed path
    if (cleanPath.startsWith('_uploads_')) {
      console.log('⚠️ Download API - Detected malformed path starting with _uploads_');
      // Try to reconstruct the proper path
      const fileName = cleanPath.split('_').pop(); // Get the last part after the last underscore
      if (fileName) {
        cleanPath = `uploads/${fileName}`;
        console.log('🔧 Download API - Reconstructed path:', cleanPath);
      }
    }
    
    // Ensure the path starts with public/
    if (!cleanPath.startsWith('public/')) {
      cleanPath = `public/${cleanPath}`;
    }
    
    // Construct the full file path
    const fullPath = join(process.cwd(), cleanPath);
    
    console.log('📥 Download API - Processing:', {
      originalPath: filePath,
      cleanPath,
      fullPath
    });
    
     // Check if file exists before trying to read it
     try {
       const fileBuffer = await readFile(fullPath);
       
       // Extract filename from path
       const fileName = cleanPath.split('/').pop() || 'document';
       
       console.log('✅ Download API - File found and read successfully:', fileName);
       
       // Return the file with appropriate headers
       return new NextResponse(fileBuffer, {
         headers: {
           'Content-Type': 'application/octet-stream',
           'Content-Disposition': `attachment; filename="${fileName}"`,
           'Content-Length': fileBuffer.length.toString(),
         },
       });
     } catch (fileError) {
       console.error('❌ Download API - File not found at path:', fullPath);
       
       // List available files for debugging
       const fs = require('fs');
       const uploadsDir = join(process.cwd(), 'public/uploads');
       try {
         const availableFiles = fs.readdirSync(uploadsDir);
         console.log('📁 Download API - Available files in uploads folder:', availableFiles);
       } catch (dirError) {
         console.error('❌ Download API - Could not read uploads directory:', dirError);
       }
       
       throw fileError; // Re-throw the original error
     }
    
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
