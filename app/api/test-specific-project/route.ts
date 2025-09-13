import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Test Specific Project ===');
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Get the specific project you mentioned
    const projectId = '8aee0b61-cf2d-ff6b-72de-68c47f67270b';
    
    const projectResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'get_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          id: projectId,
          select_fields: [
            'id', 'name', 'description',
            'ms_subservice_icesc_project_suggestions_1_name',
            'ms_subservice_icesc_project_suggestions_1ms_subservice_ida',
            'contacts_icesc_project_suggestions_1_name',
            'contacts_icesc_project_suggestions_1contacts_ida',
            'accounts_icesc_project_suggestions_1_name',
            'accounts_icesc_project_suggestions_1accounts_ida'
          ]
        }),
      }),
    });
    
    const projectResult = await projectResponse.json();
    console.log('Project result:', projectResult);
    
    return NextResponse.json({
      success: true,
      project: projectResult
    });
    
  } catch (error) {
    console.error('Test specific project error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



