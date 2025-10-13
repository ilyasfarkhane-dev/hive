import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';
import { mapProjectDataToCRM, validateProjectData } from '@/utils/crmFieldMapping';
import { getAzureDownloadURL } from '@/services/azureService';

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
    
    
    // CLEANUP: Remove document URLs from text fields if they were added by old code
    const cleanTextField = (text: string | undefined): string => {
      if (!text) return '';
      
      // Remove patterns like "Document URL: https://..."
      let cleaned = text
        .replace(/Document URL:\s*https?:\/\/[^\s\n]+/gi, '')
        .replace(/Full Document URL:\s*https?:\/\/[^\s\n]+/gi, '')
        .replace(/Project document uploaded via Hive platform\s*/gi, '')
        .trim();
      
      // Remove empty lines
      cleaned = cleaned.replace(/\n\n+/g, '\n').trim();
      
      return cleaned;
    };
    
    // Clean all text fields
    if (projectData.description) {
      const original = projectData.description;
      projectData.description = cleanTextField(projectData.description);
      if (original !== projectData.description) {
        console.log('🧹 Cleaned description field - removed document URL');
      }
    }
    
    if (projectData.problem_statement1_c) {
      const original = projectData.problem_statement1_c1_c;
      projectData.problem_statement1_c1_c = cleanTextField(projectData.problem_statement1_c1_c);
     
    }
    
    if (projectData.expected_outputs) {
      const original = projectData.expected_outputs;
      projectData.expected_outputs = cleanTextField(projectData.expected_outputs);
      
    }
    
    if (projectData.comments) {
      const original = projectData.comments;
      projectData.comments = cleanTextField(projectData.comments);
     
    }
    
   
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

 

    // Convert document paths to Azure URLs before mapping to CRM
    console.log('📄 Checking for documents in project data:', {
      documents_icesc_project_suggestions_1_name: projectData.documents_icesc_project_suggestions_1_name,
      document_c: projectData.document_c,
      supporting_documents: projectData.supporting_documents,
      hasDocuments: !!(projectData.documents_icesc_project_suggestions_1_name || projectData.document_c)
    });
    
    if (projectData.documents_icesc_project_suggestions_1_name) {
      console.log('🔄 Converting document paths to Azure URLs...');
      const documentPaths = projectData.documents_icesc_project_suggestions_1_name.split('; ').filter((path: string) => path.trim());
      const azureUrls: string[] = [];
      
      for (const path of documentPaths) {
        try {
          if (path.includes('hive-documents/') && !path.startsWith('https://')) {
            console.log(`Converting document path to Azure URL: ${path}`);
            const azureUrl = await getAzureDownloadURL(path);
            azureUrls.push(azureUrl);
            console.log(`✅ Converted to Azure URL with SAS token: ${azureUrl}`);
          } else if (path.startsWith('https://res.cloudinary.com/')) {
            azureUrls.push(path);
            console.log(`✅ Keeping Cloudinary URL: ${path}`);
          } else if (path.startsWith('https://') && path.includes('blob.core.windows.net')) {
            azureUrls.push(path);
            console.log(`✅ Using existing Azure URL: ${path}`);
          } else {
            azureUrls.push(path);
            console.log(`⚠️ Using path as-is: ${path}`);
          }
        } catch (urlError) {
          console.error(`❌ Failed to convert document path: ${path}`, urlError);
          azureUrls.push(path); // Fall back to original path
        }
      }
      const finalUrls = azureUrls.join('; ');
      projectData.documents_icesc_project_suggestions_1_name = finalUrls;
      projectData.document_c = finalUrls;
      
      // Also set alternative document fields that might work better in CRM forms
      projectData.document_name_c = finalUrls;
      projectData.document_url_c = finalUrls;
      projectData.document_name = finalUrls;
      projectData.document_url = finalUrls;
      
    } else {
      console.log('⚠️ No document fields found in project data');
    }
   
    const crmData = mapProjectDataToCRM(projectData);
   
    
    // Debug: Check if document fields are in CRM data
    const documentFields = crmData.filter(field => 
      field.name.includes('document') || field.name.includes('documents_icesc')
    );

    
 
   
    
   
    
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
    
    
    if (projectData.document_c || projectData.documents_icesc_project_suggestions_1_name) {
      const documentUrl = projectData.document_c || projectData.documents_icesc_project_suggestions_1_name;
      
      // For now, just set the document_c field (URL field)
      crmData.push({
        name: 'document_c',
        value: documentUrl
      });
      
      // Store document info for later Document record creation
      projectData._documentInfo = {
        url: documentUrl,
        name: documentUrl.split('/').pop() || 'uploaded_document',
        description: 'Project document uploaded via Hive platform'
      };
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

   
    
   
   
    
   
    
    const submissionData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: crmData,
    };
    
  
    
   
    // Validate submission data
    if (!submissionData.session || !submissionData.module_name || !submissionData.name_value_list) {
     
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
    console.log('🔍 DEBUG: CRM Response received:');
    console.log('Response status:', response.status);
    console.log('Response text length:', responseText.length);
    console.log('Response text (first 1000 chars):', responseText.substring(0, 1000));
    
    // Parse and log the full response to see all fields
    try {
      const responseData = JSON.parse(responseText);
      console.log('🔍 DEBUG: Parsed CRM Response:');
      console.log('Project ID:', responseData.id);
      console.log('Entry list fields:', Object.keys(responseData.entry_list || {}));
      
      // Check specifically for document fields
      const entryList = responseData.entry_list || {};
      console.log('🔍 DEBUG: Document fields in CRM response:');
      Object.keys(entryList).forEach(fieldName => {
        if (fieldName.includes('document')) {
          console.log(`  ${fieldName}: ${entryList[fieldName].value}`);
        }
      });
      
      // Check for any field that might contain our document URL
      console.log('🔍 DEBUG: Looking for document URL in all fields:');
      const documentUrl = 'https://hivestorage2025.blob.core.windows.net/input/hive-documents/demo_icesco_org/1759748401369_licence.pdf';
      Object.keys(entryList).forEach(fieldName => {
        const fieldValue = entryList[fieldName].value;
        if (typeof fieldValue === 'string' && fieldValue.includes('hivestorage2025.blob.core.windows.net')) {
          console.log(`  ✅ Found document URL in field: ${fieldName} = ${fieldValue}`);
        }
      });
      
      // List all fields to see what's available
      console.log('🔍 DEBUG: All fields returned by CRM:');
      Object.keys(entryList).forEach(fieldName => {
        console.log(`  ${fieldName}: ${entryList[fieldName].value}`);
      });
      
      // Fetch and display complete project details with documents
      if (responseData.id) {
        console.log('🔍 DEBUG: Fetching complete project details from CRM...');
        try {
          const projectDetailsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'get_entry',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify({
                session: sessionId,
                module_name: 'icesc_project_suggestions',
                id: responseData.id,
                select_fields: [
                  'id',
                  'name',
                  'document_c',
                  'documents_icesc_project_suggestions_1_name',
                  'document_name_c',
                  'document_url_c',
                  'document_name',
                  'document_url',
                  'status_c',
                  'budget_icesco',
                  'budget_member_state',
                  'budget_sponsorship',
                  'strategic_goal',
                  'pillar',
                  'service',
                  'sub_service',
                  'account_name',
                  'contact_id',
                  'session_id'
                ]
              })
            })
          });
          
          if (projectDetailsResponse.ok) {
            const projectDetailsText = await projectDetailsResponse.text();
            const projectDetails = JSON.parse(projectDetailsText);
            
            console.log('📋 COMPLETE PROJECT DETAILS WITH DOCUMENTS:');
            console.log('==========================================');
            console.log('Project ID:', projectDetails.entry_list?.id?.value);
            console.log('Project Name:', projectDetails.entry_list?.name?.value);
            console.log('Status:', projectDetails.entry_list?.status_c?.value);
            console.log('Account:', projectDetails.entry_list?.account_name?.value);
            console.log('Strategic Framework:', {
              goal: projectDetails.entry_list?.strategic_goal?.value,
              pillar: projectDetails.entry_list?.pillar?.value,
              service: projectDetails.entry_list?.service?.value,
              sub_service: projectDetails.entry_list?.sub_service?.value
            });
            console.log('Budget:', {
              icesco: projectDetails.entry_list?.budget_icesco?.value,
              member_state: projectDetails.entry_list?.budget_member_state?.value,
              sponsorship: projectDetails.entry_list?.budget_sponsorship?.value
            });
            console.log('📄 DOCUMENT FIELDS:');
            console.log('  document_c:', projectDetails.entry_list?.document_c?.value || 'EMPTY');
            console.log('  documents_icesc_project_suggestions_1_name:', projectDetails.entry_list?.documents_icesc_project_suggestions_1_name?.value || 'EMPTY');
            console.log('  document_name_c:', projectDetails.entry_list?.document_name_c?.value || 'EMPTY');
            console.log('  document_url_c:', projectDetails.entry_list?.document_url_c?.value || 'EMPTY');
            console.log('  document_name:', projectDetails.entry_list?.document_name?.value || 'EMPTY');
            console.log('  document_url:', projectDetails.entry_list?.document_url?.value || 'EMPTY');
            console.log('==========================================');
          } else {
            console.error('❌ Failed to fetch project details:', projectDetailsResponse.status);
          }
        } catch (fetchError) {
          console.error('❌ Error fetching project details:', fetchError);
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse CRM response:', parseError);
    }
    
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
      
      // Document already set in initial creation - skip redundant updates
      if (false && projectData._documentInfo) {
        console.log('🔗 SKIPPED: Document already set in initial creation');
        console.log('🔍 Full Azure URL being sent:', projectData._documentInfo.url);
        console.log('🔍 URL length:', projectData._documentInfo.url.length);
        console.log('🔍 URL exceeds 255 chars:', projectData._documentInfo.url.length > 255);
        try {
          const directUpdateData = {
            session: sessionId,
            module_name: 'icesc_project_suggestions',
            name_value_list: [
              {
                name: 'id',
                value: data.id
              },
              {
                name: 'document_c',
                value: projectData._documentInfo.url
              },
              {
                name: 'documents_icesc_project_suggestions_1_name',
                value: projectData._documentInfo.name || 'document'
              }
            ]
          };

          const directUpdateResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'set_entry',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify(directUpdateData),
            }),
          });

          if (directUpdateResponse.ok) {
            const directUpdateText = await directUpdateResponse.text();
            console.log('✅ Relationship field set directly with Azure URL');
            console.log('🔍 Direct update response:', directUpdateText);
            
            // Verify what was actually stored
            console.log('🔍 Verifying what was actually stored...');
            try {
              const verifyResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  method: 'get_entry',
                  input_type: 'JSON',
                  response_type: 'JSON',
                  rest_data: JSON.stringify({
                    session: sessionId,
                    module_name: 'icesc_project_suggestions',
                    id: data.id,
                    select_fields: [
                      'id',
                      'name',
                      'documents_icesc_project_suggestions_1_name',
                      'document_c',
                      'comments',
                      'description',
                      'problem_statement1_c1_c',
                      'expected_outputs'
                    ]
                  }),
                }),
              });

              if (verifyResponse.ok) {
                const verifyText = await verifyResponse.text();
                const verifyData = JSON.parse(verifyText);
                console.log('🔍 What was actually stored:');
                console.log('  documents_icesc_project_suggestions_1_name:', verifyData.entry_list?.documents_icesc_project_suggestions_1_name?.value || 'EMPTY');
                console.log('  document_c:', verifyData.entry_list?.document_c?.value || 'EMPTY');
                console.log('  comments:', verifyData.entry_list?.comments?.value || 'EMPTY');
                console.log('  description:', verifyData.entry_list?.description?.value || 'EMPTY');
                console.log('  problem_statement1_c:', verifyData.entry_list?.problem_statement1_c?.value || 'EMPTY');
                console.log('  expected_outputs:', verifyData.entry_list?.expected_outputs?.value || 'EMPTY');
              }
            } catch (verifyError) {
              console.error('❌ Error verifying stored values:', verifyError);
            }
          } else {
            console.error('❌ Failed to set relationship field directly:', directUpdateResponse.status);
            const errorText = await directUpdateResponse.text();
            console.error('🔍 Error response:', errorText);
          }
        } catch (directUpdateError) {
          console.error('❌ Error setting relationship field directly:', directUpdateError);
        }
      }

      // Skip Document record creation - not needed, document URL already in document_c field
      let documentId = null;
      if (false && projectData._documentInfo) {
        try {
          console.log('📄 SKIPPED: Document record creation not needed');
          const documentData = {
            session: sessionId,
            module_name: 'Documents',
            name_value_list: [
              {
                name: 'document_name',
                value: projectData._documentInfo.name
              },
              {
                name: 'description',
                value: projectData._documentInfo.description
              },
              {
                name: 'status_id',
                value: 'Active'
              },
              {
                name: 'category_id',
                value: 'Project Documents'
              }
            ]
          };

          const documentResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'set_entry',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify(documentData),
            }),
          });

          if (documentResponse.ok) {
            const documentResponseText = await documentResponse.text();
            const documentResponseData = JSON.parse(documentResponseText);
            documentId = documentResponseData.id;
            console.log('✅ Document record created successfully with ID:', documentId);
            
            // Now link the document to the project using multiple approaches
            if (documentId) {
              console.log('🔗 Linking Document to Project...');
              
              // Approach 1: Try set_relationship with correct field name
              const linkData = {
                session: sessionId,
                module_name: 'Documents',
                module_id: documentId,
                link_field_name: 'documents_icesc_project_suggestions_1',
                related_ids: [data.id]
              };

              const linkResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  method: 'set_relationship',
                  input_type: 'JSON',
                  response_type: 'JSON',
                  rest_data: JSON.stringify(linkData),
                }),
              });

              if (linkResponse.ok) {
                console.log('✅ Document successfully linked to Project via set_relationship');
              } else {
                console.error('❌ Failed to link Document to Project via set_relationship:', linkResponse.status);
                
                // Approach 2: Try updating the project record directly with the full Azure URL
                console.log('🔗 Trying alternative approach - updating project record with full Azure URL...');
                const updateProjectData = {
                  session: sessionId,
                  module_name: 'icesc_project_suggestions',
                  name_value_list: [
                    {
                      name: 'id',
                      value: data.id
                    },
                    {
                      name: 'documents_icesc_project_suggestions_1_name',
                      value: projectData._documentInfo.url
                    }
                  ]
                };

                const updateResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    method: 'set_entry',
                    input_type: 'JSON',
                    response_type: 'JSON',
                    rest_data: JSON.stringify(updateProjectData),
                  }),
                });

                if (updateResponse.ok) {
                  console.log('✅ Document ID successfully set in project record');
                } else {
                  console.error('❌ Failed to update project record with document ID:', updateResponse.status);
                  
                  // Approach 3: Try with the relationship field ID format
                  console.log('🔗 Trying with relationship field ID format...');
                  const updateProjectData2 = {
                    session: sessionId,
                    module_name: 'icesc_project_suggestions',
                    name_value_list: [
                      {
                        name: 'id',
                        value: data.id
                      },
                      {
                        name: 'documents_icesc_project_suggestions_1',
                        value: documentId
                      }
                    ]
                  };

                  const updateResponse2 = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      method: 'set_entry',
                      input_type: 'JSON',
                      response_type: 'JSON',
                      rest_data: JSON.stringify(updateProjectData2),
                    }),
                  });

                  if (updateResponse2.ok) {
                    console.log('✅ Document ID successfully set in project record via relationship field');
                  } else {
                    console.error('❌ Failed with relationship field ID format:', updateResponse2.status);
                    
                    // Approach 4: Try with full Azure URL instead of document name/ID
                    console.log('🔗 Trying with full Azure URL in relationship field...');
                    const updateProjectData3 = {
                      session: sessionId,
                      module_name: 'icesc_project_suggestions',
                      name_value_list: [
                        {
                          name: 'id',
                          value: data.id
                        },
                        {
                          name: 'documents_icesc_project_suggestions_1_name',
                          value: projectData._documentInfo.url
                        }
                      ]
                    };

                    const updateResponse3 = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      body: new URLSearchParams({
                        method: 'set_entry',
                        input_type: 'JSON',
                        response_type: 'JSON',
                        rest_data: JSON.stringify(updateProjectData3),
                      }),
                    });

                    if (updateResponse3.ok) {
                      console.log('✅ Document name successfully set in project record');
                    } else {
                      console.error('❌ All linking approaches failed');
                    }
                  }
                }
              }
              
              // Verify the relationship was established by fetching the project details
              if (documentId) {
                console.log('🔍 Verifying relationship establishment...');
                try {
                  const verifyResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      method: 'get_entry',
                      input_type: 'JSON',
                      response_type: 'JSON',
                      rest_data: JSON.stringify({
                        session: sessionId,
                        module_name: 'icesc_project_suggestions',
                        id: data.id,
                        select_fields: [
                          'id',
                          'name',
                          'documents_icesc_project_suggestions_1_name',
                          'documents_icesc_project_suggestions_1'
                        ]
                      }),
                    }),
                  });

                  if (verifyResponse.ok) {
                    const verifyText = await verifyResponse.text();
                    const verifyData = JSON.parse(verifyText);
                    console.log('🔍 Relationship verification result:');
                    console.log('  documents_icesc_project_suggestions_1_name:', verifyData.entry_list?.documents_icesc_project_suggestions_1_name?.value || 'EMPTY');
                    console.log('  documents_icesc_project_suggestions_1:', verifyData.entry_list?.documents_icesc_project_suggestions_1?.value || 'EMPTY');
                  }
                } catch (verifyError) {
                  console.error('❌ Error verifying relationship:', verifyError);
                }
              }
            }
          } else {
            console.error('❌ Failed to create Document record:', documentResponse.status);
          }
        } catch (documentError) {
          console.error('❌ Error creating Document record:', documentError);
          // Don't fail the submission if document creation fails
        }
      }
      
    
      return NextResponse.json({
        success: true,
        projectId: data.id,
        message: 'Project submitted successfully with relationships established',
        documentId: documentId
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
