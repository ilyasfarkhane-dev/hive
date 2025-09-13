import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Frontend Submission Test ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Check if contactInfo is provided
    const { subserviceId, projectData, contactInfo } = body;
    
    if (!contactInfo) {
      return NextResponse.json({
        success: false,
        error: 'No contactInfo provided in request',
        receivedData: body
      });
    }
    
    if (!contactInfo.id) {
      return NextResponse.json({
        success: false,
        error: 'No contact ID in contactInfo',
        contactInfo: contactInfo
      });
    }
    
    // Simulate a successful response
    return NextResponse.json({
      success: true,
      message: 'Frontend submission test successful',
      receivedData: {
        subserviceId: subserviceId,
        projectData: projectData,
        contactInfo: contactInfo
      }
    });
    
  } catch (error) {
    console.error('Frontend submission test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}



