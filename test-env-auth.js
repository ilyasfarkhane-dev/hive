const axios = require('axios');

// Load environment variables (simulate what Next.js does)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testWithEnvVars() {
  console.log('🔍 Testing with Environment Variables');
  console.log('====================================');
  
  const CRM_CONFIG = {
    baseUrl: process.env.CRM_BASE_URL || 'https://crm.icesco.org',
    username: process.env.CRM_USERNAME || 'portal',
    password: process.env.CRM_PASSWORD || 'Portal@2025',
    application: process.env.CRM_APPLICATION || 'ICESCO Portal',
  };
  
  console.log('Environment Variables:');
  console.log('  CRM_BASE_URL:', process.env.CRM_BASE_URL);
  console.log('  CRM_USERNAME:', process.env.CRM_USERNAME);
  console.log('  CRM_PASSWORD:', process.env.CRM_PASSWORD ? '***' : 'undefined');
  console.log('  CRM_APPLICATION:', process.env.CRM_APPLICATION);
  
  console.log('\nResolved Config:');
  console.log('  baseUrl:', CRM_CONFIG.baseUrl);
  console.log('  username:', CRM_CONFIG.username);
  console.log('  password:', '***');
  console.log('  application:', CRM_CONFIG.application);
  
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
    console.log('Login Data:', JSON.stringify({
      user_auth: { 
        user_name: CRM_CONFIG.username, 
        password: '***' 
      },
      application_name: CRM_CONFIG.application,
    }, null, 2));

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
      console.log('\n✅ SUCCESS! Authentication working with environment variables');
      console.log('Session ID:', response.data.id);
    } else {
      console.log('\n❌ Authentication failed with environment variables');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testWithEnvVars();
