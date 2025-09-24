import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';
import { mapProjectDataToCRM, validateProjectData } from '@/utils/crmFieldMapping';

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
    
    // Validate project data - use different validation for drafts
    const isDraft = projectData.status === 'Draft';
    const validation = validateProjectData(projectData, isDraft);
    
    if (!validation.valid) {
      console.log('Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: `Validation failed: ${validation.errors.join(', ')}`,
          errorType: 'VALIDATION_ERROR',
          errors: validation.errors
        },
        { status: 400 }
      );
    }
    console.log('Project data validation passed');
    
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
    console.log('=== DEBUG: Account Information ===');
    console.log('Account ID from projectData:', projectData.account_id);
    console.log('Account name from projectData:', projectData.account_name);
    console.log('Account ID type:', typeof projectData.account_id);
    console.log('Account name type:', typeof projectData.account_name);
    console.log('Account ID length:', projectData.account_id?.length);
    console.log('Account name length:', projectData.account_name?.length);
    console.log('Full projectData object:', JSON.stringify(projectData, null, 2));
    console.log('================================');
    const crmData = mapProjectDataToCRM(projectData);
    console.log('=== DEBUG: CRM Data after mapping ===');
    console.log('CRM data fields:', crmData.map(field => ({ name: field.name, value: field.value })));
    console.log('Account fields in CRM data:', crmData.filter(field => 
      field.name.includes('account') || field.name.includes('icesc_project_suggestions_1')
    ));
    console.log('=====================================');
    
    // Try to get account ID if we have account name but no ID
    if (projectData.account_name && !projectData.account_id) {
      console.log('=== DEBUG: Trying to get account ID by name ===');
      console.log('Searching for account name:', projectData.account_name);
      console.log('Account name length:', projectData.account_name.length);
      console.log('Account name type:', typeof projectData.account_name);
      
      // Try with retries
      const maxRetries = 2;
      let accountFound = false;
      
      for (let retry = 0; retry < maxRetries && !accountFound; retry++) {
        if (retry > 0) {
          console.log(`Retry attempt ${retry + 1}/${maxRetries} for account search...`);
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        try {
          // Try multiple search approaches
          const searchQueries = [
            `name='${projectData.account_name.replace(/'/g, "\\'")}'`, // Exact match
            `name LIKE '%${projectData.account_name.replace(/'/g, "\\'")}%'`, // Partial match
            `name LIKE '${projectData.account_name.replace(/'/g, "\\'")}%'`, // Starts with
          ];
        
        for (let i = 0; i < searchQueries.length && !accountFound; i++) {
          console.log(`Trying search query ${i + 1}:`, searchQueries[i]);
          
          try {
            const accountResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                method: 'get_entry_list',
                input_type: 'JSON',
                response_type: 'JSON',
                rest_data: JSON.stringify({
                  session: sessionId,
                  module_name: 'Accounts',
                  query: searchQueries[i],
                  select_fields: ['id', 'name'],
                  max_results: 20
                }),
              }),
              // Add timeout and retry configuration
              signal: AbortSignal.timeout(15000), // 15 second timeout
            });
          
            const accountData = await accountResponse.json();
            console.log(`Account search response ${i + 1}:`, accountData);
            
            if (accountData.entry_list && accountData.entry_list.length > 0) {
              console.log(`Found ${accountData.entry_list.length} accounts with query ${i + 1}`);
              
              // Find exact match first
              let exactMatch = accountData.entry_list.find((account: any) => {
                const accountName = account.name_value_list?.name?.value || account.name_value_list?.name || '';
                console.log(`Comparing: "${accountName}" === "${projectData.account_name}"`);
                return accountName === projectData.account_name;
              });
              
              if (exactMatch) {
                projectData.account_id = exactMatch.id;
                console.log('✅ Found exact account ID:', projectData.account_id);
                accountFound = true;
              } else {
                // Try case-insensitive match
                let caseInsensitiveMatch = accountData.entry_list.find((account: any) => {
                  const accountName = account.name_value_list?.name?.value || account.name_value_list?.name || '';
                  return accountName.toLowerCase() === projectData.account_name.toLowerCase();
                });
                
                if (caseInsensitiveMatch) {
                  projectData.account_id = caseInsensitiveMatch.id;
                  console.log('✅ Found case-insensitive account ID:', projectData.account_id);
                  accountFound = true;
                } else {
                  console.log('No exact match found, trying next query...');
                }
              }
            } else {
              console.log(`No results with query ${i + 1}`);
            }
          } catch (fetchError: any) {
            console.error(`Error with search query ${i + 1}:`, fetchError);
            if (fetchError?.name === 'TimeoutError' || fetchError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
              console.log(`Timeout with query ${i + 1}, trying next query...`);
            } else {
              console.log(`Other error with query ${i + 1}, trying next query...`);
            }
          }
        }
        
          if (!accountFound) {
            console.log('❌ No account found with any search method for name:', projectData.account_name);
            console.log('⚠️ Will proceed without account ID - CRM may handle relationship by name');
          }
        } catch (error) {
          console.error('Error searching for account:', error);
        }
      }
    }

    // Manually add account fields if they exist
    if (projectData.account_name || projectData.account_id) {
      console.log('=== DEBUG: Adding account fields manually ===');
      console.log('Adding account name:', projectData.account_name);
      console.log('Adding account ID:', projectData.account_id);
      console.log('=== DEBUG: Full projectData for account fields ===');
      console.log('projectData.account_name:', projectData.account_name);
      console.log('projectData.account_id:', projectData.account_id);
      console.log('typeof account_name:', typeof projectData.account_name);
      console.log('account_name length:', projectData.account_name?.length);
      
      // Add account name field
      if (projectData.account_name) {
        crmData.push({
          name: 'accounts_icesc_project_suggestions_1_name',
          value: projectData.account_name
        });
        console.log('Added accounts_icesc_project_suggestions_1_name:', projectData.account_name);
        
        // Also try to clear any default value by setting it to empty first
        crmData.push({
          name: 'accounts_icesc_project_suggestions_1_name',
          value: '' // Clear the field first
        });
        console.log('Cleared accounts_icesc_project_suggestions_1_name field');
        
        // Then set the correct value
        crmData.push({
          name: 'accounts_icesc_project_suggestions_1_name',
          value: projectData.account_name
        });
        console.log('Set accounts_icesc_project_suggestions_1_name to:', projectData.account_name);
      }
      
      // Add account ID field (even if empty, we need to set the relationship)
      crmData.push({
        name: 'accounts_icesc_project_suggestions_1',
        value: projectData.account_id || ''
      });
      console.log('Added accounts_icesc_project_suggestions_1:', projectData.account_id || '');
      
      // Also try to add the account name to other possible fields
      if (projectData.account_name) {
        const possibleAccountFields = [
          'account_name',
          'account_name_c',
          'accounts_name',
          'ms_accounts_icesc_project_suggestions_1_name'
        ];
        
        possibleAccountFields.forEach(fieldName => {
          crmData.push({
            name: fieldName,
            value: projectData.account_name
          });
          console.log(`Added ${fieldName}:`, projectData.account_name);
        });
      }
      
      console.log('Account fields added to CRM data');
    }
    
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
          role: projectData.contact_role,
          id: projectData.contact_id
        });
        
        console.log('=== CONTACT FIELD VALIDATION ===');
        console.log('Contact name present:', !!projectData.contact_name);
        console.log('Contact email present:', !!projectData.contact_email);
        console.log('Contact phone present:', !!projectData.contact_phone);
        console.log('Contact role present:', !!projectData.contact_role);
        console.log('Contact ID present:', !!projectData.contact_id);
        console.log('================================');
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
        
        // Get account ID from localStorage (passed via projectData)
        let accountId = projectData.account_id;
        console.log('Using account_id from localStorage (projectData):', accountId);
        console.log('Account name from projectData:', projectData.account_name);
        
        // If no account ID from localStorage, but we have account name, search for it
        if (!accountId && projectData.account_name) {
          console.log('No account ID from localStorage, but have account name. Searching for account by name...');
          try {
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
                  query: `name='${projectData.account_name.replace(/'/g, "\\'")}'`,
                  select_fields: ['id', 'name'],
                  max_results: 1
                }),
              }),
            });
            
            const accountData = await accountResponse.json();
            console.log('Account search by name response:', accountData);
            
            if (accountData.entry_list && accountData.entry_list.length > 0) {
              accountId = accountData.entry_list[0].id;
              console.log('✅ Found account ID by name:', accountId);
            } else {
              console.log('❌ No account found with name:', projectData.account_name);
            }
          } catch (error) {
            console.error('Error searching for account by name:', error);
          }
        }
        
        // If still no account ID, skip the relationship (don't use random fallback)
        if (!accountId) {
          console.log('⚠️ No account ID available, skipping account relationship to avoid using wrong account');
        }
        
        console.log('Relationship data:', { contactId, subserviceId, accountId });
        console.log('Account name being used:', projectData.account_name);
        console.log('Account ID being used for relationship:', accountId);
        
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
          const subserviceResponseText = await subserviceResponse.text();
          console.log('Subservice relationship response:', subserviceResponseText);
          
          let subserviceResult;
          if (subserviceResponseText.trim()) {
            subserviceResult = JSON.parse(subserviceResponseText);
          } else {
            console.log('Empty response for subservice relationship');
            subserviceResult = { error: 'Empty response' };
          }
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
          const contactResponseText = await contactResponse.text();
          console.log('Contact relationship response:', contactResponseText);
          
          let contactResult;
          if (contactResponseText.trim()) {
            contactResult = JSON.parse(contactResponseText);
          } else {
            console.log('Empty response for contact relationship');
            contactResult = { error: 'Empty response' };
          }
          console.log('Contact relationship result:', JSON.stringify(contactResult, null, 2));
          if (contactResult.id) {
            console.log('✅ Contact relationship set successfully');
          } else {
            console.log('❌ Contact relationship may have failed:', contactResult);
          }
        }
        
        // Set account relationship - try different field names (only if we have a valid account ID)
        if (accountId && accountId !== '') {
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
              console.log('Setting account relationship with account ID:', accountId);
              console.log('Account name for relationship:', projectData.account_name);
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
              
              const accountResponseText = await accountResponse.text();
              console.log(`Account relationship response for ${accountLinkField}:`, accountResponseText);
              
              let accountResult;
              if (accountResponseText.trim()) {
                accountResult = JSON.parse(accountResponseText);
              } else {
                console.log(`Empty response for account relationship field: ${accountLinkField}`);
                continue;
              }
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
