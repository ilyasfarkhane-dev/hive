import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Session Only Test ===');
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      message: 'Session test completed'
    });
    
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


