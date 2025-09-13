import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: List Accounts Test ===');
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Get all accounts
    console.log('=== STEP 1: Getting All Accounts ===');
    const accounts = await getModuleEntries(
      sessionId,
      'Accounts',
      ['id', 'name', 'description'],
      '',
      10
    );
    
    console.log('Accounts found:', accounts.length);
    console.log('Accounts:', accounts);
    
    return NextResponse.json({
      success: true,
      accounts: accounts,
      count: accounts.length,
      message: 'List accounts test completed'
    });
    
  } catch (error) {
    console.error('List accounts test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


