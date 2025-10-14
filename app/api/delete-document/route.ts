import { NextRequest, NextResponse } from 'next/server';
import { deleteFromAzure, extractPathFromAzureURL } from '@/services/azureService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { documentUrl } = await request.json();
    
    console.log('=== DOCUMENT DELETION API CALLED ===');
    console.log('Document URL:', documentUrl);
    
    if (!documentUrl) {
      return NextResponse.json(
        { success: false, error: 'No document URL provided' },
        { status: 400 }
      );
    }
    
    // Clean up the URL first (decode HTML entities)
    const cleanedUrl = documentUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    console.log('🔍 Cleaned document URL:', cleanedUrl);
    console.log('🔍 URL validation:', {
      isComplete: cleanedUrl.includes('sig='),
      hasSignature: cleanedUrl.includes('sig='),
      urlLength: cleanedUrl.length,
      endsWithSignature: cleanedUrl.endsWith('%3D') || cleanedUrl.endsWith('='),
      containsAllParams: cleanedUrl.includes('sv=') && cleanedUrl.includes('ss=') && cleanedUrl.includes('sig=')
    });
    
    // Extract the file path from the URL
    const filePath = extractPathFromAzureURL(cleanedUrl);
    
    if (!filePath) {
      console.log('❌ Could not extract file path from URL');
      return NextResponse.json(
        { success: false, error: 'Could not extract file path from URL' },
        { status: 400 }
      );
    }
    
    console.log('📁 Extracted file path:', filePath);
    
    // Delete the file from Azure
    const deleteResult = await deleteFromAzure(filePath);
    
    if (deleteResult) {
      console.log('✅ Document deleted successfully from Azure');
      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully',
        filePath: filePath
      });
    } else {
      console.log('❌ Failed to delete document from Azure');
      return NextResponse.json(
        { success: false, error: 'Failed to delete document from Azure storage' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}


