const axios = require('axios');

async function testRelationship() {
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
      "https://crm.icesco.org/service/v4_1/rest.php",
      new URLSearchParams({
        method: "login",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: loginData,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000
      }
    );

    if (!loginResp.data?.id) {
      throw new Error('Login failed');
    }

    const sessionId = loginResp.data.id;
    console.log('Session ID:', sessionId);

    // Get a project ID
    const projectData = JSON.stringify({
      session: sessionId,
      module_name: "icesc_project_suggestions",
      query: "",
      order_by: "",
      offset: 0,
      select_fields: ["id", "name"],
      max_results: 1
    });

    const projectResp = await axios.post(
      "https://crm.icesco.org/service/v4_1/rest.php",
      new URLSearchParams({
        method: "get_entry_list",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: projectData,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000
      }
    );

    if (projectResp.data.entry_list && projectResp.data.entry_list.length > 0) {
      const projectId = projectResp.data.entry_list[0].id;
      console.log('Project ID:', projectId);

      // Try to get relationships for this project
      const relationshipData = JSON.stringify({
        session: sessionId,
        module_name: "icesc_project_suggestions",
        module_id: projectId,
        link_field_name: "ms_subservice_icesc_project_suggestions_1",
        related_module_query: "",
        related_fields: ["id", "name", "code"],
        related_module_link_name_to_fields_array: [],
        deleted: 0
      });

      const relationshipResp = await axios.post(
        "https://crm.icesco.org/service/v4_1/rest.php",
        new URLSearchParams({
          method: "get_relationships",
          input_type: "JSON",
          response_type: "JSON",
          rest_data: relationshipData,
        }).toString(),
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000
        }
      );

      console.log('Relationship response:', JSON.stringify(relationshipResp.data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRelationship();
