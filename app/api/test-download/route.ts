import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { readdir } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testPath = searchParams.get('path') || 'demo@icesco.org_1759498131436_ILYAS_FARKHANE.pdf (2).pdf';
    
    const uploadsDir = join(process.cwd(), 'public/uploads');
    const availableFiles = await readdir(uploadsDir);
    
    console.log('🔍 Test Download - Testing path:', testPath);
    console.log('🔍 Test Download - Available files:', availableFiles);
    
    // Try to find matching files
    const matches = availableFiles.filter(file => {
      // Remove email prefix and special characters for comparison
      const cleanTestPath = testPath.replace(/^[^_]*_/, '').replace(/[^a-z0-9_.-]/gi, '_');
      const cleanFileName = file.replace(/[^a-z0-9_.-]/gi, '_');
      
      return file.includes('ILYAS_FARKHANE') || 
             file.includes('1759498131436') ||
             cleanFileName.includes(cleanTestPath) ||
             file.includes(testPath.replace(/[^a-z0-9_.-]/gi, '_'));
    });
    
    console.log('🔍 Test Download - Matches found:', matches);
    
    if (matches.length > 0) {
      const filePath = join(uploadsDir, matches[0]);
      console.log('✅ Test Download - Found file:', filePath);
      
      try {
        const fileBuffer = await readFile(filePath);
        
        return new NextResponse(fileBuffer as BodyInit, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${matches[0]}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      } catch (error) {
        console.error('❌ Test Download - Error reading file:', error);
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'File not found',
      testPath: testPath,
      availableFiles: availableFiles,
      matches: matches,
      uploadsDir: uploadsDir
    }, { status: 404 });
    
  } catch (error) {
    console.error('❌ Test Download - Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';








