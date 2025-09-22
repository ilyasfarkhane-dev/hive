const axios = require('axios');

async function testSubservices() {
  try {
    // First, get a session ID
    const loginData = JSON.stringify({
      user_auth: { 
        user_name: "portal", 
        password: "Portal@2025" 
      },
      application_name: "MyApp",
    });

    const loginResp = await axios.post(
      "http://3.145.21.11/service/v4_1/rest.php",
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

    if (!loginResp.data?.id) {
      throw new Error('Login failed');
    }

    const sessionId = loginResp.data.id;
    console.log('Session ID:', sessionId);

    // Try to get subservices
    const subserviceData = JSON.stringify({
      session: sessionId,
      module_name: "ms_subservice",
      query: "",
      order_by: "",
      offset: 0,
      select_fields: ["id", "name", "code"],
      max_results: 5
    });

    const subserviceResp = await axios.post(
      "http://3.145.21.11/service/v4_1/rest.php",
      new URLSearchParams({
        method: "get_entry_list",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: subserviceData,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      }
    );

    console.log('Subservices response:', JSON.stringify(subserviceResp.data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSubservices();
