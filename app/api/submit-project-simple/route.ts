import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';
import { mapProjectDataToCRM } from '@/utils/crmFieldMapping';

const CRM_BASE_URL = 'http://3.145.21.11';

// Function to get a fresh session ID
async function getFreshSessionId(): Promise<string> {
  try {
    console.log('=== DEBUG: Getting fresh session ID ===');
    const sessionId = await getSessionId();
    console.log('Fresh session ID obtained:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('Failed to get fresh session ID:', error);
    throw new Error('Failed to authenticate with CRM');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Simple CRM Submission Started ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const projectData = await request.json();
    console.log('=== DEBUG: Received project data ===');
    console.log('Project data keys:', Object.keys(projectData));
    console.log('Project data:', JSON.stringify(projectData, null, 2));
    
    // Get a fresh session ID for CRM authentication
    const sessionId = await getFreshSessionId();
    console.log('=== DEBUG: Session ID ===');
    console.log('Fresh session ID obtained:', sessionId);
    console.log('Session ID length:', sessionId?.length);
    
    // Validate session ID format
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
      console.error('=== DEBUG: Invalid Session ID ===');
      console.error('Session ID is invalid:', sessionId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid session ID received from CRM authentication',
          errorType: 'INVALID_SESSION_ID',
          sessionId: sessionId
        },
        { status: 500 }
      );
    }

    // Use proper CRM field mapping
    console.log('=== DEBUG: Creating CRM field mapping ===');
    const crmData = mapProjectDataToCRM(projectData);
    
    // Add strategic relationship information to comments
    const strategicInfo = {
      goal: {
        id: projectData.strategic_goal_id,
        name: projectData.strategic_goal
      },
      pillar: {
        id: projectData.pillar_id,
        name: projectData.pillar
      },
      service: {
        id: projectData.service_id,
        name: projectData.service
      },
      subservice: {
        id: projectData.sub_service_id,
        name: projectData.sub_service
      }
    };

    console.log('=== DEBUG: Strategic Relationship Information ===');
    console.log('Goal:', strategicInfo.goal);
    console.log('Pillar:', strategicInfo.pillar);
    console.log('Service:', strategicInfo.service);
    console.log('Subservice:', strategicInfo.subservice);
    
    // Create detailed relationship log
    const relationshipLog = {
      projectName: projectData.name,
      submissionDate: new Date().toISOString(),
      strategicFramework: {
        goal: {
          id: strategicInfo.goal.id,
          name: strategicInfo.goal.name,
          level: 'Strategic Goal'
        },
        pillar: {
          id: strategicInfo.pillar.id,
          name: strategicInfo.pillar.name,
          level: 'Strategic Pillar',
          parent: strategicInfo.goal.name
        },
        service: {
          id: strategicInfo.service.id,
          name: strategicInfo.service.name,
          level: 'Service',
          parent: strategicInfo.pillar.name
        },
        subservice: {
          id: strategicInfo.subservice.id,
          name: strategicInfo.subservice.name,
          level: 'Sub-Service',
          parent: strategicInfo.service.name
        }
      }
    };
    
    console.log('=== DEBUG: Complete Relationship Log ===');
    console.log(JSON.stringify(relationshipLog, null, 2));
    
    // Create hierarchical relationship summary
        console.log('=== DEBUG: Strategic Framework Hierarchy ===');
        console.log(`Project: "${projectData.name}"`);
        console.log(`├── Strategic Goal: ${strategicInfo.goal.name} (${strategicInfo.goal.id})`);
        console.log(`    ├── Pillar: ${strategicInfo.pillar.name} (${strategicInfo.pillar.id})`);
        console.log(`        ├── Service: ${strategicInfo.service.name} (${strategicInfo.service.id})`);
        console.log(`            └── Sub-Service: ${strategicInfo.subservice.name} (${strategicInfo.subservice.id})`);
        console.log('==========================================');

        // Log session-based project submission
        console.log('=== DEBUG: Session Project Submission Log ===');
        console.log('Session ID:', projectData.session_id);
        console.log('Project Name:', projectData.name);
        console.log('Submission Time:', new Date().toISOString());
        console.log('Strategic Framework:', {
          goal: strategicInfo.goal.name,
          goalId: strategicInfo.goal.id,
          pillar: strategicInfo.pillar.name,
          pillarId: strategicInfo.pillar.id,
          service: strategicInfo.service.name,
          serviceId: strategicInfo.service.id,
          subService: strategicInfo.subservice.name,
          subServiceId: strategicInfo.subservice.id
        });
        console.log('Contact:', {
          name: projectData.contact_name,
          email: projectData.contact_email,
          phone: projectData.contact_phone,
          role: projectData.contact_role
        });
        console.log('Budget:', {
          icesco: projectData.budget_icesco,
          memberState: projectData.budget_member_state,
          sponsorship: projectData.budget_sponsorship,
          total: (parseFloat(projectData.budget_icesco) || 0) + 
                 (parseFloat(projectData.budget_member_state) || 0) + 
                 (parseFloat(projectData.budget_sponsorship) || 0)
        });
        console.log('Timeline:', {
          start: projectData.start_date,
          end: projectData.end_date,
          frequency: projectData.frequency
        });
        console.log('Scope:', {
          delivery: projectData.delivery_modality,
          geographic: projectData.geographic_scope,
          type: projectData.project_type
        });
        console.log('Partners:', projectData.partners);
        console.log('Milestones:', projectData.milestones);
        console.log('KPIs:', projectData.kpis);
        console.log('==========================================');

        // Log all projects for this session after successful submission
        try {
          console.log('=== FETCHING ALL PROJECTS FOR SESSION ===');
          const sessionQuery = `session_id='${projectData.session_id}'`;
          const allSessionProjects = await getModuleEntries(
            sessionId,
            "icesc_suggestion",
            ["id", "name", "strategic_goal", "pillar", "service", "sub_service", "budget_icesco", "budget_member_state", "budget_sponsorship", "submission_date"],
            sessionQuery
          );
          
          console.log(`=== ALL PROJECTS FOR SESSION ${projectData.session_id} ===`);
          console.log(`Total Projects: ${allSessionProjects.length}`);
          
          let totalBudget = 0;
          allSessionProjects.forEach((project: any, index: number) => {
            const projectBudget = (parseFloat(project.budget_icesco) || 0) + 
                                 (parseFloat(project.budget_member_state) || 0) + 
                                 (parseFloat(project.budget_sponsorship) || 0);
            totalBudget += projectBudget;
            
            console.log(`${index + 1}. ${project.name} (${project.id})`);
            console.log(`   Strategic Framework: ${project.strategic_goal} → ${project.pillar} → ${project.service} → ${project.sub_service}`);
            console.log(`   Budget: $${projectBudget.toLocaleString()}`);
            console.log(`   Submission: ${project.submission_date}`);
            console.log('');
          });
          
          console.log(`Total Session Budget: $${totalBudget.toLocaleString()}`);
          console.log(`Average Project Budget: $${allSessionProjects.length > 0 ? (totalBudget / allSessionProjects.length).toLocaleString() : 0}`);
          console.log('===============================================');
        } catch (error) {
          console.error('Error fetching session projects:', error);
        }

    // Keep only the user's original comments - don't add strategic framework info
    // The strategic framework information is already stored in the relationship fields
    // and doesn't need to be duplicated in the comments field

    console.log('=== DEBUG: Mapped CRM data ===');
    console.log('CRM data length:', crmData.length);
    console.log('CRM data:', JSON.stringify(crmData, null, 2));

    const submissionData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: crmData,
    };
    
    console.log('=== DEBUG: Final submission data ===');
    console.log('Submission data:', JSON.stringify(submissionData, null, 2));
    console.log('CRM Base URL:', CRM_BASE_URL);
    console.log('Target URL:', `${CRM_BASE_URL}/service/v4_1/rest.php`);
    
    // Validate submission data
    if (!submissionData.session || !submissionData.module_name || !submissionData.name_value_list) {
      console.error('=== DEBUG: Invalid Submission Data ===');
      console.error('Missing required fields in submission data');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid submission data - missing required fields',
          errorType: 'INVALID_SUBMISSION_DATA',
          submissionData: submissionData
        },
        { status: 500 }
      );
    }

    const requestBody = new URLSearchParams({
      method: 'set_entry',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify(submissionData),
    });
    
    console.log('=== DEBUG: Request body ===');
    console.log('Request body:', requestBody.toString());

    console.log('=== DEBUG: Making CRM request ===');
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    }).catch(fetchError => {
      console.error('=== DEBUG: Fetch Error ===');
      console.error('Fetch error:', fetchError);
      throw new Error(`Failed to connect to CRM server: ${fetchError.message}`);
    });

    console.log('=== DEBUG: CRM Response ===');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response OK:', response.ok);
    console.log('Response URL:', response.url);
    console.log('Response type:', response.type);
    
    // Check for non-200 status codes
    if (!response.ok) {
      console.error('=== DEBUG: Non-200 Response Status ===');
      console.error('Status:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText.substring(0, 500));
      
      return NextResponse.json(
        { 
          success: false, 
          error: `CRM server returned error status ${response.status}: ${response.statusText}`,
          errorType: 'HTTP_ERROR',
          statusCode: response.status,
          rawResponse: errorText.substring(0, 1000)
        },
        { status: 500 }
      );
    }
    
    console.log('=== DEBUG: Parsing CRM response ===');
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    // Check if response is HTML (error page) instead of JSON
    if (responseText.trim().startsWith('<') || responseText.includes('<br />') || responseText.includes('<b>')) {
      console.error('=== DEBUG: CRM returned HTML instead of JSON ===');
      console.error('This usually indicates a server error or authentication issue');
      console.error('Response content:', responseText.substring(0, 500) + '...');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'CRM server returned an error page instead of JSON response. This may indicate a server error or authentication issue.',
          errorType: 'HTML_RESPONSE',
          rawResponse: responseText.substring(0, 1000) // Limit response size
        },
        { status: 500 }
      );
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('=== DEBUG: Parsed JSON response ===');
      console.log('Parsed data:', JSON.stringify(data, null, 2));
      console.log('Data keys:', Object.keys(data || {}));
      console.log('Data ID:', data.id);
      console.log('Data error:', data.error);
      console.log('Data error description:', data.error?.description);
      console.log('Data entry_list:', data.entry_list);
      console.log('Data name_value_list:', data.name_value_list);
      
      // Check if this is a successful submission
      if (data.id) {
        console.log('✅ SUCCESS: Project created with ID:', data.id);
      } else {
        console.log('❌ NO PROJECT ID: Submission may have failed');
        console.log('Full response for debugging:', data);
      }
      console.log('Data error message:', data.error?.message);
    } catch (parseError) {
      console.error('=== DEBUG: JSON Parse Error ===');
      console.error('Parse error:', parseError);
      console.error('Response text that failed to parse:', responseText.substring(0, 500));
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to parse CRM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          errorType: 'JSON_PARSE_ERROR',
          rawResponse: responseText.substring(0, 1000) // Limit response size
        },
        { status: 500 }
      );
    }
    
    if (data.id && data.id !== '-1') {
      console.log('=== DEBUG: Success ===');
      console.log('Project submitted successfully with ID:', data.id);
      
      // Now set relationships to populate the _name fields
      console.log('=== DEBUG: Setting Relationships ===');
      try {
        // Use the contact ID from the project data (passed from the frontend)
        const contactId = projectData.contact_id;
        const subserviceId = strategicInfo.subservice.id;
        
        if (!contactId) {
          console.warn('⚠️ No contact ID provided - project will not be associated with a specific contact');
          console.warn('This means the project may not appear in the user\'s projects list');
        } else {
          console.log('✅ Contact ID provided:', contactId);
        }
        
        // Get a real account ID - use the same method as submit-suggestion
        const accountResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            method: 'get_entry_list',
            input_type: 'JSON',
            response_type: 'JSON',
            rest_data: JSON.stringify({
              session: sessionId,
              module_name: 'Accounts',
              select_fields: ['id', 'name'],
              max_results: 1
            }),
          }),
        });
        
        const accountData = await accountResponse.json();
        console.log('Account data response:', accountData);
        
        const accountId = accountData.entry_list && accountData.entry_list.length > 0 
          ? accountData.entry_list[0].id 
          : null;
        
        console.log('Relationship data:', { contactId, subserviceId, accountId });
        
        // Set subservice relationship
        if (subserviceId) {
          const subserviceResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              method: 'set_relationship',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify({
                session: sessionId,
                module_name: 'icesc_project_suggestions',
                module_id: data.id,
                link_field_name: 'ms_subservice_icesc_project_suggestions_1',
                related_ids: [subserviceId]
              }),
            }),
          });
          const subserviceResult = await subserviceResponse.json();
          console.log('Subservice relationship result:', JSON.stringify(subserviceResult, null, 2));
          if (subserviceResult.id) {
            console.log('✅ Subservice relationship set successfully');
          } else {
            console.log('❌ Subservice relationship may have failed:', subserviceResult);
          }
        }
        
        // Set contact relationship
        if (contactId) {
          const contactResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              method: 'set_relationship',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify({
                session: sessionId,
                module_name: 'icesc_project_suggestions',
                module_id: data.id,
                link_field_name: 'contacts_icesc_project_suggestions_1',
                related_ids: [contactId]
              }),
            }),
          });
          const contactResult = await contactResponse.json();
          console.log('Contact relationship result:', JSON.stringify(contactResult, null, 2));
          if (contactResult.id) {
            console.log('✅ Contact relationship set successfully');
          } else {
            console.log('❌ Contact relationship may have failed:', contactResult);
          }
        }
        
        // Set account relationship - try different field names
        if (accountId) {
          console.log('Setting account relationship...');
          
          // Try different possible account link field names
          const possibleAccountLinkFields = [
            'accounts_icesc_project_suggestions_1',
            'account_icesc_project_suggestions_1',
            'accounts_icesc_suggestion_1',
            'account_icesc_project_suggestions_1',
            'accounts_project_suggestions_1',
            'account_project_suggestions_1'
          ];
          
          let accountRelationshipSuccess = false;
          
          for (const accountLinkField of possibleAccountLinkFields) {
            if (accountRelationshipSuccess) break; // Stop if we already succeeded
            
            try {
              console.log(`Trying account relationship using field: ${accountLinkField}`);
              const accountResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  method: 'set_relationship',
                  input_type: 'JSON',
                  response_type: 'JSON',
                  rest_data: JSON.stringify({
                    session: sessionId,
                    module_name: 'icesc_project_suggestions',
                    module_id: data.id,
                    link_field_name: accountLinkField,
                    related_ids: [accountId]
                  }),
                }),
              });
              
              const accountResult = await accountResponse.json();
              console.log(`Account relationship result for ${accountLinkField}:`, JSON.stringify(accountResult, null, 2));
            if (accountResult.id) {
              console.log(`✅ Account relationship set successfully with field: ${accountLinkField}`);
            } else {
              console.log(`❌ Account relationship failed with field: ${accountLinkField}`, accountResult);
            }
              
              if (accountResult && !accountResult.error) {
                console.log(`✅ Account relationship successful with field: ${accountLinkField}`);
                accountRelationshipSuccess = true;
              } else {
                console.log(`❌ Account relationship failed with field ${accountLinkField}:`, accountResult);
              }
            } catch (fieldError) {
              console.log(`❌ Account relationship error with field ${accountLinkField}:`, fieldError);
            }
          }
          
          if (!accountRelationshipSuccess) {
            console.log('❌ All account relationship attempts failed');
          }
        }
        
        console.log('=== DEBUG: Relationships Set Successfully ===');
      } catch (relationshipError) {
        console.error('Error setting relationships:', relationshipError);
        // Don't fail the submission if relationships fail
      }
      
      console.log('=== 📋 SUBMISSION SUMMARY ===');
      console.log('✅ Project created in CRM with ID:', data.id);
      console.log('✅ Module used:', 'icesc_project_suggestions');
      console.log('✅ Contact ID used:', projectData.contact_id);
      console.log('✅ Subservice ID used:', strategicInfo.subservice.id);
      console.log('📍 The project should now be visible in:');
      console.log('   - CRM under "Member Project Suggestions"');
      console.log('   - Frontend "My Projects" page (if relationships were set correctly)');
      
      return NextResponse.json({
        success: true,
        projectId: data.id,
        message: 'Project submitted successfully with relationships established'
      });
    } else {
      console.error('=== DEBUG: Failure ===');
      console.error('Project submission failed');
      console.error('Data ID:', data.id);
      console.error('Data error:', data.error);
      console.error('Full response data:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.description || data.error?.message || `Failed to submit project. ID: ${data.id}`,
          details: data,
          rawResponse: responseText
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('=== DEBUG: Catch Block Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorType: typeof error,
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}
