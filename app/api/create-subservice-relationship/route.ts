import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Create Subservice Relationship API Called ===');
    const { projectId, subserviceId, reverse } = await request.json();
    
    if (!projectId || !subserviceId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID and Subservice ID are required'
      }, { status: 400 });
    }

    console.log('Project ID:', projectId);
    console.log('Subservice ID:', subserviceId);
    console.log('Reverse relationship:', reverse);

    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);

    // Create the relationship - try both directions
    let relationshipData;
    
    if (reverse) {
      // Create relationship FROM subservice TO project
      relationshipData = {
        session: sessionId,
        module_name: 'ms_subservice',
        module_id: subserviceId,
        link_field_name: 'ms_subservice_icesc_project_suggestions_1',
        related_ids: [projectId]
      };
    } else {
      // Create relationship FROM project TO subservice (default)
      relationshipData = {
        session: sessionId,
        module_name: 'icesc_project_suggestions',
        module_id: projectId,
        link_field_name: 'ms_subservice_icesc_project_suggestions_1',
        related_ids: [subserviceId]
      };
    }

    console.log('Relationship data:', JSON.stringify(relationshipData, null, 2));

    const response = await fetch('http://3.145.21.11/service/v4_1/rest.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'set_relationship',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(relationshipData),
      }),
    });

    console.log('Relationship response status:', response.status);
    const data = await response.json();
    console.log('Relationship response data:', data);

    if (data.created && data.created > 0) {
      return NextResponse.json({
        success: true,
        message: 'Subservice relationship created successfully',
        created: data.created
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.description || 'Failed to create subservice relationship',
        details: data
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Create relationship error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to create subservice relationship: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
