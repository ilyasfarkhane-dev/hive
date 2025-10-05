import { NextRequest, NextResponse } from 'next/server';
import { getAzureDownloadURL, getAzureFileInfo } from '@/services/azureService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fullPath = searchParams.get('fullPath');
    
    console.log('🔐 Get File URL API - Full Path:', fullPath);
    
    if (!fullPath) {
      console.log('❌ Get File URL API - No full path provided');
      return NextResponse.json({ error: 'fullPath is required' }, { status: 400 });
    }

    try {
      // Verify the file exists and get info
      const fileInfo = await getAzureFileInfo(fullPath);
      
      console.log('✅ File found:', {
        name: fileInfo.name,
        fullPath: fileInfo.fullPath,
        size: fileInfo.size,
        contentType: fileInfo.contentType
      });

      // Generate download URL
      const downloadURL = await getAzureDownloadURL(fullPath);

      console.log('🔐 Generated download URL for full path:', fullPath);

      return NextResponse.json({ 
        url: downloadURL,
        fullPath: fullPath,
        filename: fileInfo.name || fullPath.split('/').pop()
      });

    } catch (error) {
      console.error('❌ Error generating download URL:', error);
      return NextResponse.json({ 
        error: 'File not found or inaccessible',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Get File URL API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

