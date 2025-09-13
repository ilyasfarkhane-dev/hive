import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Test Account Field Names ===');
    
    const { recordId } = await request.json();
    console.log('Record ID:', recordId);
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Test different account field names
    const possibleFieldNames = [
      'accounts_icesc_project_suggestions_1_name',
      'account_icesc_project_suggestions_1_name',
      'accounts_project_suggestions_1_name',
      'account_project_suggestions_1_name',
      'accounts_icesc_suggestion_1_name',
      'account_icesc_suggestion_1_name'
    ];
    
    const fieldResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
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
          select_fields: possibleFieldNames
        }),
      }),
    });
    
    const fieldResult = await fieldResponse.json();
    console.log('Field result:', fieldResult);
    
    // Check which fields have values
    const entry = fieldResult.entry_list?.[0];
    const fieldValues: Record<string, string> = {};
    
    if (entry?.name_value_list) {
      possibleFieldNames.forEach(fieldName => {
        const value = entry.name_value_list[fieldName]?.value || 'EMPTY';
        fieldValues[fieldName] = value;
        console.log(`${fieldName}: ${value}`);
      });
    }
    
    // Also try to get all fields to see what's actually available
    const allFieldsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
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
          select_fields: []
        }),
      }),
    });
    
    const allFieldsResult = await allFieldsResponse.json();
    const allFieldNames = allFieldsResult.entry_list?.[0]?.name_value_list ? Object.keys(allFieldsResult.entry_list[0].name_value_list) : [];
    const accountRelatedFields = allFieldNames.filter(name => name.toLowerCase().includes('account'));
    
    return NextResponse.json({
      success: true,
      recordId: recordId,
      possibleFieldNames: possibleFieldNames,
      fieldValues: fieldValues,
      allFieldNames: allFieldNames,
      accountRelatedFields: accountRelatedFields,
      message: 'Account field names test completed'
    });
    
  } catch (error) {
    console.error('Account field names test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


