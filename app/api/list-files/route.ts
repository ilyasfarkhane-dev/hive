import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = join(process.cwd(), 'public/uploads');
    
    console.log('🔍 List Files API - Checking uploads directory:', uploadsDir);
    
    const files = await readdir(uploadsDir);
    
    console.log('📁 List Files API - Found files:', files);
    
    return NextResponse.json({
      success: true,
      uploadsDirectory: uploadsDir,
      files: files,
      count: files.length,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV,
      processCwd: process.cwd()
    });
    
  } catch (error) {
    console.error('❌ List Files API - Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      uploadsDirectory: join(process.cwd(), 'public/uploads'),
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV,
      processCwd: process.cwd()
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
