import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Test Account Relationship ===');
    
    const { recordId, accountId } = await request.json();
    console.log('Record ID:', recordId);
    console.log('Account ID:', accountId);
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Test setting account relationship
    console.log('=== STEP 1: Setting Account Relationship ===');
    const accountResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'set_relationship',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          module_id: recordId,
          link_field_name: 'accounts_icesc_project_suggestions_1',
          related_ids: [accountId]
        }),
      }),
    });
    
    const accountResult = await accountResponse.json();
    console.log('Account relationship result:', accountResult);
    
    // Verify the relationship was set
    console.log('=== STEP 2: Verifying Account Relationship ===');
    const verifyResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'get_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          id: recordId,
          select_fields: [
            'id', 'name', 'description',
            'accounts_icesc_project_suggestions_1_name'
          ]
        }),
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('Verification result:', verifyResult);
    
    return NextResponse.json({
      success: true,
      recordId: recordId,
      accountId: accountId,
      relationshipResult: accountResult,
      verification: verifyResult,
      message: 'Account relationship test completed'
    });
    
  } catch (error) {
    console.error('Account relationship test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}



