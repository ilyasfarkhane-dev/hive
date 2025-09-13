import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const crmUrl = process.env.CRM_BASE_URL || 'http://3.145.21.11';
    const testUrl = `${crmUrl}/service/v4_1/rest.php`;
    
    console.log('Testing connection to:', testUrl);
    
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_server_info',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({}),
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.text();
      console.log('Response data:', data);
      
      return NextResponse.json({
        success: true,
        status: response.status,
        url: testUrl,
        response: data,
        message: 'Connection test completed'
      });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Connection failed',
        url: testUrl
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}


