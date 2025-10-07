const axios = require('axios');
const crypto = require('crypto');

// CRM Configuration
const CRM_BASE_URL = 'https://crm.icesco.org';
const CRM_USER = 'portal';
const CRM_PASS = 'Portal@2025';
const CRM_URL = `${CRM_BASE_URL}/service/v4_1/rest.php`;

async function login() {
  const hashedPassword = crypto.createHash('md5').update(CRM_PASS).digest('hex');
  
  const response = await axios.post(CRM_URL, {
    method: "login",
    input_type: "JSON",
    response_type: "JSON",
    rest_data: JSON.stringify({
      user_auth: {
        user_name: CRM_USER,
        password: hashedPassword,
      },
      application_name: 'MyApp',
    }),
  });
  
  return response.data.id;
}

async function debugDataStructure() {
  try {
    console.log('🔐 Logging into CRM...');
    const sessionId = await login();
    console.log('✅ Login successful');
    
    console.log('📋 Fetching sample subservices to debug structure...');
    const response = await axios.post(CRM_URL, {
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "ms_subservice",
        query: "",
        order_by: "name",
        offset: 0,
        select_fields: [
          "id",
          "name",
          "name_ar_c",
          "name_fr_c",
          "description",
          "description_subservice",
          "description_subservice_ar_c",
          "description_subservice_fr_c"
        ],
        link_name_to_fields_array: [{
          name: "ms_service_ms_subservice_1",
          value: ["id", "name", "code", "title"]
        }],
        max_results: 3, // Only get 3 records for debugging
        deleted: 0,
      }),
    });

    console.log('Response status:', response.status);
    console.log('\n=== FULL RESPONSE STRUCTURE ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.entry_list && response.data.entry_list.length > 0) {
      console.log('\n=== FIRST ENTRY DETAILED ===');
      const firstEntry = response.data.entry_list[0];
      console.log('Entry keys:', Object.keys(firstEntry));
      console.log('name_value_list type:', typeof firstEntry.name_value_list);
      console.log('name_value_list keys:', firstEntry.name_value_list ? Object.keys(firstEntry.name_value_list) : 'null');
      console.log('link_list type:', typeof firstEntry.link_list);
      console.log('link_list keys:', firstEntry.link_list ? Object.keys(firstEntry.link_list) : 'null');
      
      if (firstEntry.link_list && firstEntry.link_list.ms_service_ms_subservice_1) {
        console.log('ms_service_ms_subservice_1 type:', typeof firstEntry.link_list.ms_service_ms_subservice_1);
        console.log('ms_service_ms_subservice_1 length:', firstEntry.link_list.ms_service_ms_subservice_1.length);
        console.log('ms_service_ms_subservice_1[0]:', firstEntry.link_list.ms_service_ms_subservice_1[0]);
      } else {
        console.log('No ms_service_ms_subservice_1 relationship found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugDataStructure();















