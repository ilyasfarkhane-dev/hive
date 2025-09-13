import { NextRequest, NextResponse } from 'next/server';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Getting Fresh Session ID ===');
    
    // Try to get a fresh session ID using a simple login
    const authData = {
      user_auth: {
        user_name: 'admin', // Try common admin username
        password: 'admin',  // Try common admin password
      },
      application_name: 'ICESCO Portal',
    };
    
    console.log('Trying authentication with:', authData);
    
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'login',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(authData),
      }),
    });

    console.log('Auth response status:', response.status);
    const data = await response.json();
    console.log('Auth response:', data);
    
    if (data.id) {
      return NextResponse.json({
        success: true,
        sessionId: data.id,
        message: 'Fresh session obtained'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.description || 'Authentication failed',
        response: data
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}


