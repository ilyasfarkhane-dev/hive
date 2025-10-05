import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { sanitizeFileName } from '@/utils/fileUtils';
import { getAzureDownloadURL, getAzureFileInfo } from '@/services/azureService';

// Dynamic fuzzy matching function for file names
function createDynamicMatcher(coreFileName: string, candidateFile: string): boolean {
  if (!coreFileName || !candidateFile) return false;
  
  // Normalize both strings for comparison
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedCore = normalize(coreFileName);
  const normalizedCandidate = normalize(candidateFile);
  
  // If normalized strings are identical, it's a perfect match
  if (normalizedCore === normalizedCandidate) return true;
  
  // Check if core filename is contained in candidate (simple substring match)
  if (normalizedCandidate.includes(normalizedCore)) return true;
  
  // Check if candidate is contained in core filename (reverse substring match)
  if (normalizedCore.includes(normalizedCandidate)) return true;
  
  // Fuzzy matching: calculate similarity ratio
  const similarity = calculateSimilarity(normalizedCore, normalizedCandidate);
  
  // Consider it a match if similarity is above 70%
  return similarity > 0.7;
}

// Calculate similarity between two strings using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    console.log('🔍 Download API - Raw filePath from query:', filePath);
    
    if (!filePath) {
      console.log('❌ Download API - No file path provided');
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Check if this is an Azure Storage path or Cloudinary URL
    if (filePath.includes('hive-documents/') || filePath.startsWith('https://res.cloudinary.com/') || filePath.includes('/')) {
      console.log('☁️ Download API - Azure/Cloudinary reference detected');
      
      try {
        let fullPath: string;
        
        if (filePath.startsWith('https://res.cloudinary.com/')) {
          // This is still a Cloudinary URL - handle as before for backward compatibility
          console.log('☁️ Legacy Cloudinary URL detected, redirecting to cloudinary-download API');
          return NextResponse.redirect(`${request.nextUrl.origin}/api/cloudinary-download?publicId=${encodeURIComponent(filePath)}`, 302);
        } else if (filePath.startsWith('https://') && filePath.includes('.blob.core.windows.net/')) {
          // Azure Storage URL - extract the path
          const match = filePath.match(/\/[^\/]+\/(.+?)(?:\?.*)?$/);
          if (match) {
            fullPath = decodeURIComponent(match[1]);
          } else {
            throw new Error('Invalid Azure Storage URL');
          }
        } else {
          // Treat as Azure Storage path directly
          fullPath = filePath;
        }
        
        console.log('🔄 Getting download URL for Azure path:', fullPath);
        
        // Get download URL from our API
        const downloadUrlResponse = await fetch(`${request.nextUrl.origin}/api/getFileUrl?fullPath=${encodeURIComponent(fullPath)}`);
        
        if (!downloadUrlResponse.ok) {
          console.error('❌ Failed to get download URL:', downloadUrlResponse.status, downloadUrlResponse.statusText);
          return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
        }
        
        const downloadUrlData = await downloadUrlResponse.json();
        
        if (!downloadUrlData.url) {
          console.error('❌ No URL in download URL response:', downloadUrlData);
          return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
        }
        
        console.log('🔐 Got download URL, redirecting to:', downloadUrlData.url);
        
        // Redirect to the download URL
        return NextResponse.redirect(downloadUrlData.url, 302);
        
      } catch (error) {
        console.error('❌ Error accessing Azure file:', error);
        
        // Fallback: try to proxy the file directly if it's a URL
        if (filePath.startsWith('http')) {
          try {
            console.log('🔄 Fallback: attempting direct proxy...');
            const response = await fetch(filePath);
            
            if (!response.ok) {
              console.error('❌ Fallback proxy failed:', response.status, response.statusText);
              return NextResponse.json({ error: 'File not found or inaccessible' }, { status: 404 });
            }
            
            // Get file content and metadata
            const fileBuffer = await response.arrayBuffer();
            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            
            // Extract filename from URL
            const urlParts = filePath.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            const filename = lastPart.split('?')[0] || 'document';
            
            console.log('✅ Fallback proxy successful:', { filename, contentType, size: fileBuffer.byteLength });
            
            // Return the file with appropriate headers
            return new NextResponse(fileBuffer as BodyInit, {
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileBuffer.byteLength.toString(),
              },
            });
            
          } catch (fallbackError) {
            console.error('❌ Fallback proxy also failed:', fallbackError);
            return NextResponse.json({ error: 'Failed to access file' }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: 'File not found or inaccessible' }, { status: 404 });
        }
      }
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
     
     // Handle paths that start with public/uploads/ (direct access)
     if (cleanPath.startsWith('public/uploads/')) {
       cleanPath = cleanPath.replace('public/uploads/', 'uploads/');
       console.log('🔧 Download API - Converted public/uploads to uploads:', cleanPath);
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
     
     // Handle email prefixes in filenames (common issue with CRM)
     if (cleanPath.includes('@') && cleanPath.includes('_')) {
       console.log('⚠️ Download API - Detected email prefix in filename');
       // Try to extract the actual filename by removing email prefix
       const parts = cleanPath.split('_');
       if (parts.length > 2) {
         // Remove the first part (email) and keep the rest
         const fileName = parts.slice(1).join('_');
         cleanPath = `uploads/${fileName}`;
         console.log('🔧 Download API - Removed email prefix, new path:', cleanPath);
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
          // Extract the core filename (without email prefix and timestamp)
          const coreFileName = fileName?.replace(/^[^_]*_\d+_/, '').replace(/[^a-z0-9_.-]/gi, '_') || '';
          
          console.log('🔍 Download API - Matching logic:', {
            fileName: fileName,
            coreFileName: coreFileName,
            file: file,
            coreFileNameInFile: file.includes(coreFileName),
            exactCoreMatch: file === coreFileName
          });
          
          // Dynamic fuzzy matching algorithm
          return createDynamicMatcher(coreFileName, file);
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
         } else {
           console.log('🔍 Download API - No matching files found for:', fileName);
           console.log('🔍 Download API - Available files:', availableFiles);
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
