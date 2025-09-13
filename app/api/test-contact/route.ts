import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Contact Test ===');
    
    const { contactId } = await request.json();
    console.log('Contact ID:', contactId);
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Try to get contact information
    console.log('=== STEP 1: Getting Contact Information ===');
    const contactDetails = await getModuleEntries(
      sessionId,
      'Contacts',
      ['id', 'first_name', 'last_name', 'email1'],
      `id='${contactId}'`
    );
    
    console.log('Contact details:', contactDetails);
    
    return NextResponse.json({
      success: true,
      contactDetails: contactDetails,
      message: 'Contact test completed'
    });
    
  } catch (error) {
    console.error('Contact test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}



