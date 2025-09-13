import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Check Field Names ===');
    
    const { recordId } = await request.json();
    console.log('Record ID:', recordId);
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Get all fields for the record
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
          select_fields: [] // Empty to get all fields
        }),
      }),
    });
    
    const fieldResult = await fieldResponse.json();
    console.log('Field result:', fieldResult);
    
    // Extract all field names that contain 'account' or 'contact' or 'subservice'
    const allFields = fieldResult.entry_list?.[0]?.name_value_list || {};
    const relevantFields = Object.keys(allFields).filter(fieldName => 
      fieldName.toLowerCase().includes('account') || 
      fieldName.toLowerCase().includes('contact') || 
      fieldName.toLowerCase().includes('subservice')
    );
    
    console.log('Relevant fields:', relevantFields);
    
    return NextResponse.json({
      success: true,
      recordId: recordId,
      allFields: Object.keys(allFields),
      relevantFields: relevantFields,
      fieldValues: relevantFields.reduce((acc, field) => {
        acc[field] = allFields[field]?.value || 'EMPTY';
        return acc;
      }, {} as Record<string, string>),
      message: 'Field names check completed'
    });
    
  } catch (error) {
    console.error('Field names check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}



