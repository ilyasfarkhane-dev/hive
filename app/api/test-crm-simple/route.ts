import { NextRequest, NextResponse } from 'next/server';

const CRM_BASE_URL = 'http://3.145.21.11';
const TEST_SESSION_ID = 'e8iehu2utbd7emvbvoc4oq17la';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Testing CRM Connection ===');
    console.log('CRM Base URL:', CRM_BASE_URL);
    console.log('Test Session ID:', TEST_SESSION_ID);
    
    // Test 1: Basic connection
    console.log('=== DEBUG: Test 1 - Basic Connection ===');
    try {
      const testUrl = `${CRM_BASE_URL}/service/v4_1/rest.php`;
      console.log('Testing URL:', testUrl);
      
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
      
      console.log('Connection test status:', response.status);
      console.log('Connection test headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Connection test response:', responseText);
      
      if (response.ok) {
        console.log('✅ Basic connection successful');
      } else {
        console.log('❌ Basic connection failed');
      }
    } catch (connError) {
      console.error('❌ Connection test failed:', connError);
    }
    
    // Test 2: Session validation
    console.log('=== DEBUG: Test 2 - Session Validation ===');
    try {
      const sessionData = {
        session: TEST_SESSION_ID,
        module_name: 'icesc_project_suggestions',
        name_value_list: []
      };
      
      console.log('Session validation data:', JSON.stringify(sessionData, null, 2));
      
      const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_module_fields',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(sessionData),
        }),
      });
      
      console.log('Session test status:', response.status);
      const responseText = await response.text();
      console.log('Session test response:', responseText);
      
      if (response.ok) {
        console.log('✅ Session validation successful');
      } else {
        console.log('❌ Session validation failed');
      }
    } catch (sessionError) {
      console.error('❌ Session validation failed:', sessionError);
    }
    
    // Test 3: Simple entry creation
    console.log('=== DEBUG: Test 3 - Simple Entry Creation ===');
    try {
      const entryData = {
        session: TEST_SESSION_ID,
        module_name: 'icesc_project_suggestions',
        name_value_list: [
          { name: 'name', value: 'Debug Test Project' },
          { name: 'description', value: 'This is a debug test' },
          { name: 'contact_name', value: 'Debug Contact' },
          { name: 'contact_email', value: 'debug@test.com' },
          { name: 'contact_phone', value: '1234567890' },
          { name: 'contact_role', value: 'Debug Role' }
        ]
      };
      
      console.log('Entry creation data:', JSON.stringify(entryData, null, 2));
      
      const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_entry',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(entryData),
        }),
      });
      
      console.log('Entry creation status:', response.status);
      const responseText = await response.text();
      console.log('Entry creation response:', responseText);
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        if (data.id && data.id !== '-1') {
          console.log('✅ Entry creation successful, ID:', data.id);
        } else {
          console.log('❌ Entry creation failed:', data.error);
        }
      } else {
        console.log('❌ Entry creation failed with status:', response.status);
      }
    } catch (entryError) {
      console.error('❌ Entry creation failed:', entryError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug tests completed - check server logs for details'
    });
    
  } catch (error) {
    console.error('=== DEBUG: Test Error ===');
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}


