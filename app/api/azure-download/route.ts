import { NextRequest, NextResponse } from 'next/server';
import { getAzureDownloadURL, getAzureFileInfo } from '@/services/azureService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fullPath = searchParams.get('fullPath');
    
    console.log('☁️ Azure Download API - Full Path:', fullPath);
    
    if (!fullPath) {
      console.log('❌ Azure Download API - No full path provided');
      return NextResponse.json({ error: 'Full path is required' }, { status: 400 });
    }

    try {
      // Get file information
      const fileInfo = await getAzureFileInfo(fullPath);
      
      console.log('✅ File found:', {
        name: fileInfo.name,
        fullPath: fileInfo.fullPath,
        size: fileInfo.size,
        contentType: fileInfo.contentType
      });
      
      // Get download URL
      const downloadURL = await getAzureDownloadURL(fullPath);
      
      console.log('🔗 Generated download URL for path:', fullPath);
      
      // Try to fetch the file content
      try {
        const response = await fetch(downloadURL);
        
        if (response.ok) {
          const fileBuffer = await response.arrayBuffer();
          const filename = fileInfo.name || fullPath.split('/').pop() || 'document';
          
          console.log('✅ File fetched successfully:', {
            filename,
            size: fileBuffer.byteLength,
            contentType: fileInfo.contentType
          });
          
          return new NextResponse(fileBuffer as BodyInit, {
            headers: {
              'Content-Type': fileInfo.contentType || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': fileBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=3600',
            },
          });
        } else {
          console.log('❌ File fetch failed:', response.status, response.statusText);
          return NextResponse.json({
            error: 'File access failed',
            message: 'Unable to access the file. Please try again.',
            downloadURL: downloadURL
          }, { status: response.status });
        }
      } catch (fetchError) {
        console.log('❌ File fetch error:', fetchError);
        return NextResponse.json({
          error: 'File access error',
          message: 'Unable to access the file.',
          downloadURL: downloadURL
        }, { status: 500 });
      }
      
    } catch (apiError) {
      console.error('❌ Azure API error:', apiError);
      
      return NextResponse.json({ 
        error: 'File not found or inaccessible',
        details: apiError instanceof Error ? apiError.message : 'Unknown error'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Azure Download API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


