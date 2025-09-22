import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getSessionId();
    
    return NextResponse.json({
      success: true,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
