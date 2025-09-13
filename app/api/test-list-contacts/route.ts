import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: List Contacts Test ===');
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Get all contacts
    console.log('=== STEP 1: Getting All Contacts ===');
    const contacts = await getModuleEntries(
      sessionId,
      'Contacts',
      ['id', 'first_name', 'last_name', 'email1'],
      '',
      10
    );
    
    console.log('Contacts found:', contacts.length);
    console.log('Contacts:', contacts);
    
    return NextResponse.json({
      success: true,
      contacts: contacts,
      count: contacts.length,
      message: 'List contacts test completed'
    });
    
  } catch (error) {
    console.error('List contacts test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


