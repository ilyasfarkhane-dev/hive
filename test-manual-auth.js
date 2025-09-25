const axios = require('axios');

async function testManualAuth() {
  console.log('🔍 Testing Manual Authentication');
  console.log('================================');
  
  // Use the exact values from .env file
  const CRM_CONFIG = {
    baseUrl: 'https://crm.icesco.org',
    username: 'portal',
    password: 'Portal@2025',
    application: 'ICESCO Portal',
  };
  
  console.log('Config:', {
    baseUrl: CRM_CONFIG.baseUrl,
    username: CRM_CONFIG.username,
    password: '***',
    application: CRM_CONFIG.application,
  });
  
  try {
    const restEndpoint = `${CRM_CONFIG.baseUrl}/service/v4_1/rest.php`;
    
    const loginData = JSON.stringify({
      user_auth: { 
        user_name: CRM_CONFIG.username, 
        password: CRM_CONFIG.password 
      },
      application_name: CRM_CONFIG.application,
    });

    console.log('\n🧪 Testing authentication...');
    console.log('Endpoint:', restEndpoint);

    const response = await axios.post(
      restEndpoint,
      new URLSearchParams({
        method: "login",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: loginData,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      }
    );
    
    console.log('\nResponse:');
    console.log('  Status:', response.status);
    console.log('  Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.id) {
      console.log('\n✅ SUCCESS! Authentication working');
      console.log('Session ID:', response.data.id);
      
      // Test a simple API call
      console.log('\n🧪 Testing API call...');
      const testData = JSON.stringify({
        session: response.data.id,
        module_name: 'Accounts',
        query: '',
        order_by: 'name',
        offset: 0,
        select_fields: ['id', 'name'],
        max_results: 5
      });
      
      const apiResponse = await axios.post(
        restEndpoint,
        new URLSearchParams({
          method: "get_entry_list",
          input_type: "JSON",
          response_type: "JSON",
          rest_data: testData,
        }).toString(),
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 15000
        }
      );
      
      console.log('API Response Status:', apiResponse.status);
      console.log('API Response Data:', JSON.stringify(apiResponse.data, null, 2));
      
    } else {
      console.log('\n❌ Authentication failed');
      console.log('This suggests the credentials might be incorrect or the CRM server has different authentication requirements.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testManualAuth();
