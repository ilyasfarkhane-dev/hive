import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Check Project Fields ===');
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Get module fields to see what's available
    const fieldsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'get_module_fields',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions'
        }),
      }),
    });
    
    const fieldsResult = await fieldsResponse.json();
    console.log('Fields result:', fieldsResult);
    
    // Get a sample project to see what fields are actually populated
    const sampleResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'get_entry_list',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          select_fields: ['id', 'name'],
          max_results: 1
        }),
      }),
    });
    
    const sampleResult = await sampleResponse.json();
    console.log('Sample project result:', sampleResult);
    
    return NextResponse.json({
      success: true,
      fields: fieldsResult,
      sample: sampleResult
    });
    
  } catch (error) {
    console.error('Check project fields error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


