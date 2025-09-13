import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Minimal Relationship Test ===');
    
    const { subserviceId, contactId } = await request.json();
    console.log('Subservice ID:', subserviceId);
    console.log('Contact ID:', contactId);
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Create a simple record first
    console.log('=== STEP 1: Creating Record ===');
    const createData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: [
        { name: 'name', value: 'Minimal Relationship Test' },
        { name: 'description', value: 'Testing minimal relationship establishment' },
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
    
    if (!createResult.id || createResult.id === '-1') {
      return NextResponse.json({
        success: false,
        error: 'Failed to create record',
        details: createResult
      });
    }
    
    const recordId = createResult.id;
    console.log('Record created with ID:', recordId);
    
    // Try to set subservice relationship
    console.log('=== STEP 2: Setting Subservice Relationship ===');
    const subserviceRelData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      module_id: recordId,
      link_field_name: 'ms_subservice_icesc_project_suggestions_1',
      related_ids: [subserviceId]
    };
    
    console.log('Subservice relationship data:', subserviceRelData);
    
    const subserviceRelResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'set_relationship',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(subserviceRelData),
      }),
    });
    
    const subserviceRelResult = await subserviceRelResponse.json();
    console.log('Subservice relationship result:', subserviceRelResult);
    
    return NextResponse.json({
      success: true,
      recordId: recordId,
      subserviceRelationship: subserviceRelResult,
      message: 'Minimal relationship test completed'
    });
    
  } catch (error) {
    console.error('Minimal relationship test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


