import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';
import { mapProjectDataToCRM, validateProjectData } from '@/utils/crmFieldMapping';

const CRM_BASE_URL = 'https://crm.icesco.org';

// Function to get a fresh session ID
async function getFreshSessionId(): Promise<string> {
  try {
    
    const sessionId = await getSessionId();
    return sessionId;
  } catch (error) {
    console.error('Failed to get fresh session ID:', error);
    throw new Error('Failed to authenticate with CRM');
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const projectData = await request.json();
    
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

   
    const crmData = mapProjectDataToCRM(projectData);
    console.log('=== DEBUG: CRM Data after mapping ===');
    console.log('CRM data fields:', crmData.map(field => ({ name: field.name, value: field.value })));
    console.log('Account fields in CRM data:', crmData.filter(field => 
      field.name.includes('account') || field.name.includes('icesc_project_suggestions_1')
    ));
    console.log('=====================================');
    
    // Try to get account ID if we have account name but no ID
    if (projectData.account_name && !projectData.account_id) {
   
      // Try with retries
      const maxRetries = 2;
      let accountFound = false;
      
      for (let retry = 0; retry < maxRetries && !accountFound; retry++) {
        if (retry > 0) {
         
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
           
            if (accountData.entry_list && accountData.entry_list.length > 0) {
            
              // Find exact match first
              let exactMatch = accountData.entry_list.find((account: any) => {
                const accountName = account.name_value_list?.name?.value || account.name_value_list?.name || '';
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
      
      // Add account name field
      if (projectData.account_name) {
        crmData.push({
          name: 'accounts_icesc_project_suggestions_1_name',
          value: projectData.account_name
        });
       
        // Also try to clear any default value by setting it to empty first
        crmData.push({
          name: 'accounts_icesc_project_suggestions_1_name',
          value: '' // Clear the field first
        });
       
        // Then set the correct value
        crmData.push({
          name: 'accounts_icesc_project_suggestions_1_name',
          value: projectData.account_name
        });
        }
      
      // Add account ID field (even if empty, we need to set the relationship)
      crmData.push({
        name: 'accounts_icesc_project_suggestions_1',
        value: projectData.account_id || ''
      });
      
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
    
   
    
   
        // Log all projects for this session after successful submission
        try {
         
          const sessionQuery = `session_id='${projectData.session_id}'`;
          const allSessionProjects = await getModuleEntries(
            sessionId,
            "icesc_suggestion",
            ["id", "name", "strategic_goal", "pillar", "service", "sub_service", "budget_icesco", "budget_member_state", "budget_sponsorship", "submission_date"],
            sessionQuery
          );
          
       
          let totalBudget = 0;
          allSessionProjects.forEach((project: any, index: number) => {
            const projectBudget = (parseFloat(project.budget_icesco) || 0) + 
                                 (parseFloat(project.budget_member_state) || 0) + 
                                 (parseFloat(project.budget_sponsorship) || 0);
            totalBudget += projectBudget;
            
           
          });
          
        
        } catch (error) {
          console.error('Error fetching session projects:', error);
        }

    
    const submissionData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: crmData,
    };
    
   
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
    
    const responseText = await response.text();
    
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
        
       
      } catch (relationshipError) {
        console.error('Error setting relationships:', relationshipError);
        // Don't fail the submission if relationships fail
      }
      
    
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
