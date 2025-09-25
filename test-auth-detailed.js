const axios = require('axios');

async function testDetailedAuth() {
  console.log('🔍 Testing Detailed Authentication');
  console.log('==================================');
  
  const restEndpoint = 'https://crm.icesco.org/service/v4_1/rest.php';
  
  // Test different authentication methods
  const authMethods = [
    {
      name: 'Method 1: portal/Portal@2025 with MyApp',
      data: {
        user_auth: { 
          user_name: "portal", 
          password: "Portal@2025" 
        },
        application_name: "MyApp",
      }
    },
    {
      name: 'Method 2: portal/Portal@2025 with ICESCO Portal',
      data: {
        user_auth: { 
          user_name: "portal", 
          password: "Portal@2025" 
        },
        application_name: "ICESCO Portal",
      }
    },
    {
      name: 'Method 3: admin credentials (if different)',
      data: {
        user_auth: { 
          user_name: "admin", 
          password: "admin" 
        },
        application_name: "MyApp",
      }
    }
  ];
  
  for (const method of authMethods) {
    console.log(`\n🧪 Testing: ${method.name}`);
    try {
      const loginData = JSON.stringify(method.data);
      
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
      
      console.log('   Response Status:', response.status);
      console.log('   Response Data:', JSON.stringify(response.data, null, 2));
      
      if (response.data?.id) {
        console.log('   ✅ SUCCESS! Session ID:', response.data.id);
        
        // Test logout
        const logoutData = JSON.stringify({ session: response.data.id });
        await axios.post(
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
        console.log('   ✅ Logout successful');
        break; // Stop testing if we found a working method
        
      } else {
        console.log('   ❌ Failed:', response.data?.description || 'Unknown error');
      }
      
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      if (error.response) {
        console.log('   Response:', error.response.data);
      }
    }
  }
}

testDetailedAuth();
