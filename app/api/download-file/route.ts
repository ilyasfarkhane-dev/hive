import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { sanitizeFileName } from '@/utils/fileUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    console.log('🔍 Download API - Raw filePath from query:', filePath);
    
    if (!filePath) {
      console.log('❌ Download API - No file path provided');
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
     // Clean the file path - handle different path formats
     let cleanPath = filePath;
     
     // Handle Windows-style paths with backslashes
     if (cleanPath.startsWith('\\public\\')) {
       cleanPath = cleanPath.replace('\\public\\', '');
     } else if (cleanPath.startsWith('/public/')) {
       cleanPath = cleanPath.replace('/public/', '');
     }
     
     // Handle paths that start with /uploads/ (new format)
     if (cleanPath.startsWith('/uploads/')) {
       cleanPath = cleanPath.substring(1); // Remove leading slash
       console.log('🔧 Download API - Removed leading slash:', cleanPath);
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
      fullPath,
      processCwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform
    });
    
     // Check if file exists before trying to read it
     try {
       const fileBuffer = await readFile(fullPath);
       
       // Extract filename from path
       const fileName = cleanPath.split('/').pop() || 'document';
       
       console.log('✅ Download API - File found and read successfully:', fileName);
       
       // Return the file with appropriate headers
       return new NextResponse(fileBuffer as BodyInit, {
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
         console.log('🔍 Download API - Checking uploads directory:', uploadsDir);
         const availableFiles = fs.readdirSync(uploadsDir);
         console.log('📁 Download API - Available files in uploads folder:', availableFiles);
         
         // Check if the specific file exists with different naming patterns
         const fileName = fullPath.split('/').pop() || fullPath.split('\\').pop();
         console.log('🔍 Download API - Looking for file:', fileName);
         
         // Sanitize the filename to match how files are stored on server
         
         const sanitizedFileName = sanitizeFileName(fileName || '');
         console.log('🔍 Download API - Sanitized filename:', sanitizedFileName);
         
         const matchingFiles = availableFiles.filter((file: string) => {
           // Check by timestamp (first part before underscore)
           const timestamp = fileName?.split('_')[0] || '';
           // Check by sanitized filename
           const sanitizedOriginalName = fileName?.split('_').slice(1).join('_') || '';
           const sanitizedOriginalNameClean = sanitizeFileName(sanitizedOriginalName);
           
           return file.includes(timestamp) || 
                  file.includes(sanitizedOriginalNameClean) ||
                  file.includes(sanitizedFileName);
         });
         console.log('🔍 Download API - Potentially matching files:', matchingFiles);
         
         // If we found matching files, try the first one
         if (matchingFiles.length > 0) {
           const fallbackPath = join(uploadsDir, matchingFiles[0]);
           console.log('🔄 Download API - Trying fallback file:', fallbackPath);
           
           try {
             const fallbackBuffer = await readFile(fallbackPath);
             const fallbackFileName = matchingFiles[0];
             
             console.log('✅ Download API - Fallback file found and read successfully:', fallbackFileName);
             
             return new NextResponse(fallbackBuffer as BodyInit, {
               headers: {
                 'Content-Type': 'application/octet-stream',
                 'Content-Disposition': `attachment; filename="${fallbackFileName}"`,
                 'Content-Length': fallbackBuffer.length.toString(),
               },
             });
           } catch (fallbackError) {
             console.error('❌ Download API - Fallback file also failed:', fallbackError);
           }
         }
         
       } catch (dirError) {
         console.error('❌ Download API - Could not read uploads directory:', dirError);
         console.error('❌ Download API - Directory path:', uploadsDir);
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
