import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Simple Test API ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Simple test successful',
      receivedData: body
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


