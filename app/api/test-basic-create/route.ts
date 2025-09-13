import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Basic Create Test ===');
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Create a simple record
    const createData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: [
        { name: 'name', value: 'Basic Create Test' },
        { name: 'description', value: 'Testing basic record creation' },
        { name: 'contact_name', value: 'Test Contact' },
        { name: 'contact_email', value: 'test@example.com' },
        { name: 'contact_phone', value: '123456789' },
        { name: 'contact_role', value: 'Test Role' },
        { name: 'problem_statement', value: 'Test problem statement' },
        { name: 'beneficiaries', value: 'GeneralPublic' },
        { name: 'delivery_modality', value: 'Hybrid' },
        { name: 'geographic_scope', value: 'International' },
        { name: 'project_type', value: 'Other' },
        { name: 'project_frequency', value: 'Onetime' },
        { name: 'budget_icesco', value: 1000 },
        { name: 'budget_sponsorship', value: 500 }
      ]
    };
    
    console.log('Create data:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'set_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(createData),
      }),
    });
    
    const createResult = await createResponse.json();
    console.log('Create result:', createResult);
    
    return NextResponse.json({
      success: true,
      result: createResult,
      message: 'Basic create test completed'
    });
    
  } catch (error) {
    console.error('Basic create test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


