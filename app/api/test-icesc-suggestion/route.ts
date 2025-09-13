import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Testing icesc_suggestion Module ===');
    
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    // Test creating a record in icesc_suggestion module
    const testData = {
      session: sessionId,
      module_name: 'icesc_suggestion',
      name_value_list: [
        { name: 'name', value: 'Test Suggestion' },
        { name: 'description', value: 'Testing icesc_suggestion module' },
        // Try setting relationship fields for icesc_suggestion with correct subservice ID
        { name: 'ms_subservice_icesc_suggestion_1ms_subservice_ida', value: 'ms_subservice_icesc_project_suggestions_1' },
        { name: 'contacts_icesc_suggestion_1contacts_ida', value: '30b63613-1e46-c183-7e0c-68bdff000a8a' },
        { name: 'accounts_icesc_suggestion_1accounts_ida', value: 'default' }
      ]
    };
    
    console.log('Test data for icesc_suggestion:', testData);
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'set_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(testData),
      }),
    });
    
    const result = await response.json();
    console.log('icesc_suggestion creation result:', result);
    
    if (result.id && result.id !== '-1') {
      // Try to get the created record to see if relationships are populated
      const getResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_entry',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({
            session: sessionId,
            module_name: 'icesc_suggestion',
            id: result.id,
            select_fields: [
              'id',
              'name',
              'ms_subservice_icesc_suggestion_1_name',
              'contacts_icesc_suggestion_1_name',
              'accounts_icesc_suggestion_1_name'
            ]
          }),
        }),
      });
      
      const getResult = await getResponse.json();
      console.log('Retrieved icesc_suggestion record:', getResult);
      
      return NextResponse.json({
        success: true,
        createdRecord: result,
        retrievedRecord: getResult,
        message: 'Test completed for icesc_suggestion module'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create record',
        message: 'Failed to create record in icesc_suggestion module'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Test icesc_suggestion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Test failed for icesc_suggestion module'
    }, { status: 500 });
  }
}
