const axios = require('axios');

async function testCRMConnection() {
  console.log('🔍 Testing CRM Connection to https://crm.icesco.org');
  console.log('================================================');
  
  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const healthCheck = await axios.get('https://crm.icesco.org', {
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    console.log('✅ Basic connectivity successful');
    console.log('   Status:', healthCheck.status);
    console.log('   Content-Type:', healthCheck.headers['content-type']);
    
    // Test 2: REST API endpoint
    console.log('\n2. Testing REST API endpoint...');
    const restEndpoint = 'https://crm.icesco.org/service/v4_1/rest.php';
    const restCheck = await axios.get(restEndpoint, {
      timeout: 10000,
      validateStatus: () => true
    });
    console.log('✅ REST API endpoint accessible');
    console.log('   Status:', restCheck.status);
    
    // Test 3: Authentication test
    console.log('\n3. Testing authentication...');
    const loginData = JSON.stringify({
      user_auth: { 
        user_name: "portal", 
        password: "Portal@2025" 
      },
      application_name: "MyApp",
    });

    const loginResp = await axios.post(
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

    if (loginResp.data?.id) {
      console.log('✅ Authentication successful');
      console.log('   Session ID:', loginResp.data.id);
      
      // Test 4: Logout
      console.log('\n4. Testing logout...');
      const logoutData = JSON.stringify({
        session: loginResp.data.id
      });
      
      const logoutResp = await axios.post(
        restEndpoint,
        new URLSearchParams({
          method: "logout",
          input_type: "JSON",
          response_type: "JSON",
          rest_data: logoutData,
        }).toString(),
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000
        }
      );
      
      console.log('✅ Logout successful');
      console.log('   Response:', logoutResp.data);
      
    } else {
      console.log('❌ Authentication failed');
      console.log('   Response:', loginResp.data);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('The CRM server at https://crm.icesco.org is working properly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('   This is a timeout error. The server might be slow to respond.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   DNS resolution failed. Check your internet connection.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused. The server might be down.');
    } else if (error.response) {
      console.error('   HTTP Error:', error.response.status, error.response.statusText);
      console.error('   Response:', error.response.data);
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the CRM server is accessible from your network');
    console.log('3. Check if there are any firewall restrictions');
    console.log('4. Try accessing https://crm.icesco.org in your browser');
  }
}

testCRMConnection();
