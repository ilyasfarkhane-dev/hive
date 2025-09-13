import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Verify Relationships Test ===');
    
    const { recordId } = await request.json();
    console.log('Record ID:', recordId);
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Verify the relationships
    console.log('=== STEP 1: Verifying Relationships ===');
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
            'id', 'name',
            'ms_subservice_icesc_project_suggestions_1_name',
            'contacts_icesc_project_suggestions_1_name',
            'accounts_icesc_project_suggestions_1_name'
          ]
        }),
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('Verification result:', verifyResult);
    
    return NextResponse.json({
      success: true,
      verification: verifyResult,
      message: 'Verify relationships test completed'
    });
    
  } catch (error) {
    console.error('Verify relationships test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


