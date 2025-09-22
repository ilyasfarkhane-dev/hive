import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Create Subservice API Called ===');
    const { name, code, description } = await request.json();
    
    if (!name || !code) {
      return NextResponse.json({
        success: false,
        error: 'Name and code are required'
      }, { status: 400 });
    }

    console.log('Subservice data:', { name, code, description });

    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);

    // Create the subservice
    const subserviceData = {
      session: sessionId,
      module_name: 'ms_subservice',
      name_value_list: [
        { name: 'name', value: name },
        { name: 'code', value: code },
        { name: 'description', value: description || '' }
      ]
    };

    console.log('Subservice data:', JSON.stringify(subserviceData, null, 2));

    const response = await fetch('http://3.145.21.11/service/v4_1/rest.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'set_entry',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(subserviceData),
      }),
    });

    console.log('Subservice response status:', response.status);
    const data = await response.json();
    console.log('Subservice response data:', data);

    if (data.id && data.id !== '-1') {
      return NextResponse.json({
        success: true,
        subserviceId: data.id,
        message: 'Subservice created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.description || 'Failed to create subservice',
        details: data
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Create subservice error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to create subservice: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
