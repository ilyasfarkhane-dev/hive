import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { sanitizeFileName } from '@/utils/fileUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crmFilePath = searchParams.get('crmPath');
    
    const uploadsDir = join(process.cwd(), 'public/uploads');
    const availableFiles = await readdir(uploadsDir);
    
    let analysis: any = {
      crmFilePath: crmFilePath,
      uploadsDirectory: uploadsDir,
      totalFilesOnServer: availableFiles.length,
      availableFiles: availableFiles,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV
    };
    
    if (crmFilePath) {
      // Extract filename from CRM path
      const fileName = crmFilePath.split('/').pop() || crmFilePath.split('\\').pop();
      const sanitizedFileName = sanitizeFileName(fileName || '');
      
      // Try to find matching files
      const exactMatches = availableFiles.filter(file => file === fileName);
      const sanitizedMatches = availableFiles.filter(file => file === sanitizedFileName);
      const timestampMatches = availableFiles.filter(file => {
        const timestamp = fileName?.split('_')[0] || '';
        return file.startsWith(timestamp.substring(0, 10));
      });
      const partialMatches = availableFiles.filter(file => {
        const originalName = fileName?.split('_').slice(1).join('_') || '';
        const sanitizedOriginal = sanitizeFileName(originalName);
        return file.includes(sanitizedOriginal);
      });
      
      analysis = {
        ...analysis,
        fileName: fileName,
        sanitizedFileName: sanitizedFileName,
        exactMatches: exactMatches,
        sanitizedMatches: sanitizedMatches,
        timestampMatches: timestampMatches,
        partialMatches: partialMatches,
        allMatches: Array.from(new Set([...exactMatches, ...sanitizedMatches, ...timestampMatches, ...partialMatches]))
      };
    }
    
    return NextResponse.json({
      success: true,
      ...analysis
    });
    
  } catch (error) {
    console.error('❌ Debug File Paths API - Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
