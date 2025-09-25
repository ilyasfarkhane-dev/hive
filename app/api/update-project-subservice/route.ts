import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Update Project Subservice API Called ===');
    const { projectId, subserviceName, subserviceId, subserviceCode } = await request.json();
    
    if (!projectId || !subserviceName) {
      return NextResponse.json({
        success: false,
        error: 'Project ID and Subservice Name are required'
      }, { status: 400 });
    }

    console.log('Project ID:', projectId);
    console.log('Subservice Name:', subserviceName);
    console.log('Subservice ID:', subserviceId);
    console.log('Subservice Code:', subserviceCode);

    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);

    // Update the project with subservice data
    const updateData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: [
        { name: 'id', value: projectId },
        { name: 'subservices.name', value: subserviceName },
        { name: 'subservices', value: subserviceName },
        { name: 'subservice_name', value: subserviceName },
        { name: 'sub_service', value: subserviceName }
      ]
    };

    // Add optional fields if provided
    if (subserviceId) {
      updateData.name_value_list.push({ name: 'subservice_id', value: subserviceId });
      updateData.name_value_list.push({ name: 'sub_service_id', value: subserviceId });
    }
    if (subserviceCode) {
      updateData.name_value_list.push({ name: 'subservice_code', value: subserviceCode });
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const response = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'set_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(updateData),
      }),
    });

    console.log('Update response status:', response.status);
    const data = await response.json();
    console.log('Update response data:', data);

    if (data.id && data.id !== '-1') {
      return NextResponse.json({
        success: true,
        message: 'Project subservice updated successfully',
        projectId: data.id
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.description || 'Failed to update project subservice',
        details: data
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Update project subservice error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update project subservice: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
