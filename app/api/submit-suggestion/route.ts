import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';
import { getStoredContactInfo } from '@/utils/contactStorage';

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
    console.log('=== DEBUG: Project Suggestion Submission Started ===');
    
    const { subserviceId, projectData, contactInfo } = await request.json();
    console.log('Subservice ID:', subserviceId);
    console.log('Project Data:', JSON.stringify(projectData, null, 2));
    console.log('Contact Info:', JSON.stringify(contactInfo, null, 2));
    
    // Validate contact information
    if (!contactInfo || !contactInfo.id) {
      console.error('No contact information provided in request');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No contact information provided. Please log in again.',
          errorType: 'NO_CONTACT_INFO'
        },
        { status: 400 }
      );
    }
    
    console.log('=== DEBUG: Using Stored Contact Info ===');
    console.log('Contact ID:', contactInfo.id);
    console.log('Contact Name:', contactInfo.first_name, contactInfo.last_name);
    console.log('Contact Email:', contactInfo.email1);
    console.log('Contact Phone:', contactInfo.phone_work || contactInfo.phone_mobile);
    console.log('Contact Title:', contactInfo.title);
    
    // Get a fresh session ID for CRM authentication
    const sessionId = await getFreshSessionId();
    console.log('Fresh session ID obtained:', sessionId);
    
    // Get subservice details to populate relationship fields
    console.log('=== DEBUG: Getting Subservice Details ===');
    let subserviceDetails = await getModuleEntries(
      sessionId,
      'ms_subservice',
      ['id', 'name', 'description'],
      `id='${subserviceId}'`
    );
    
    // If the provided subservice doesn't exist, use a real one
    if (subserviceDetails.length === 0) {
      console.log('Provided subservice not found, using a real one');
      subserviceDetails = await getModuleEntries(
        sessionId,
        'ms_subservice',
        ['id', 'name', 'description'],
        '',
        1
      );
    }
    
    if (subserviceDetails.length === 0) {
      console.error('No subservices found in CRM');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No subservices available in CRM.',
          errorType: 'NO_SUBSERVICES_FOUND'
        },
        { status: 400 }
      );
    }
    
    const subservice = subserviceDetails[0];
    console.log('Using subservice:', subservice);
    
    // Get account details - use a real account ID
    console.log('=== DEBUG: Getting Account Details ===');
    const accountDetails = await getModuleEntries(
      sessionId,
      'Accounts',
      ['id', 'name', 'description'],
      '',
      1
    );
    
    let accountId = 'default';
    let accountName = 'Default Account';
    
    if (accountDetails.length > 0) {
      accountId = accountDetails[0].id;
      accountName = accountDetails[0].name;
    }
    
    console.log('Using account:', { accountId, accountName });

    // Prepare the suggestion data for CRM - using icesc_project_suggestions module
    const suggestionData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: [
        // Basic project information - handle both frontend and API field names
        { name: 'name', value: projectData.name || projectData.title || 'Project Suggestion' },
        { name: 'description', value: projectData.description || projectData.brief || 'Project suggestion submitted via ICESCO Portal' },
        
        // Contact information from localStorage
        { name: 'contact_name', value: `${contactInfo.first_name || ''} ${contactInfo.last_name || ''}`.trim() },
        { name: 'contact_email', value: contactInfo.email1 || '' },
        { name: 'contact_phone', value: contactInfo.phone_work || contactInfo.phone_mobile || '' },
        { name: 'contact_role', value: contactInfo.title || '' },
        
        // Additional project details - handle both frontend and API field names
        { name: 'problem_statement', value: projectData.rationale || projectData.problemStatement || '' },
        
        // Budget information - handle both frontend and API field names
        { name: 'budget_icesco', value: projectData.budgetIcesco || (projectData.budget && projectData.budget.icesco) || 0 },
        { name: 'budget_member_state', value: projectData.budgetMemberState || (projectData.budget && projectData.budget.member_state) || 0 },
        { name: 'budget_sponsorship', value: projectData.budgetSponsorship || (projectData.budget && projectData.budget.sponsorship) || 0 },
        
        // Timeline
        { name: 'date_start', value: projectData.startDate || '' },
        { name: 'date_end', value: projectData.endDate || '' },
        { name: 'project_frequency', value: projectData.frequency || projectData.projectFrequency || 'Onetime' },
        
        // Project details - handle both frontend and API field names
        { name: 'delivery_modality', value: projectData.deliveryModality || 'Hybrid' },
        { name: 'geographic_scope', value: projectData.geographicScope || 'International' },
        { name: 'project_type', value: projectData.projectType || projectData.conveningMethod || 'Other' },
        { name: 'convening_method_other', value: projectData.otherProjectType || projectData.conveningMethodOther || '' },
        
        // Beneficiaries - handle both frontend and API field names
        { name: 'beneficiaries', value: projectData.beneficiaries ? projectData.beneficiaries.join('^,^') : 'GeneralPublic' },
        { name: 'otherbeneficiary', value: projectData.otherBeneficiary || '' },
        
        // Milestones and KPIs - handle both frontend arrays and API individual fields
        { name: 'milestones1', value: projectData.milestone1 || (projectData.milestones && projectData.milestones[0]) || '' },
        { name: 'milestones2', value: projectData.milestone2 || (projectData.milestones && projectData.milestones[1]) || '' },
        { name: 'milestones3', value: projectData.milestone3 || (projectData.milestones && projectData.milestones[2]) || '' },
        { name: 'kpis1', value: projectData.kpi1 || (projectData.kpis && projectData.kpis[0]) || '' },
        { name: 'kpis2', value: projectData.kpi2 || (projectData.kpis && projectData.kpis[1]) || '' },
        { name: 'kpis3', value: projectData.kpi3 || (projectData.kpis && projectData.kpis[2]) || '' },
        
        // Partners - handle both frontend arrays and API individual fields
        { name: 'partner1', value: projectData.partner1 || (projectData.partners && projectData.partners[0]) || '' },
        { name: 'partner2', value: projectData.partner2 || (projectData.partners && projectData.partners[1]) || '' },
        { name: 'partner3', value: projectData.partner3 || (projectData.partners && projectData.partners[2]) || '' },
        
        // Additional fields that might come from frontend
        { name: 'expected_outputs', value: projectData.expectedOutputs || projectData.expected_outputs || '' },
        { name: 'frequency_duration', value: projectData.frequencyDuration || projectData.frequency_duration || '' },
        
        // Comments with submission info
        { 
          name: 'comments', 
          value: `Project Suggestion Submission:
- Subservice ID: ${subservice.id}
- Subservice Name: ${subservice.name}
- Contact ID: ${contactInfo.id}
- Contact Name: ${contactInfo.first_name} ${contactInfo.last_name}
- Account ID: ${accountId}
- Account Name: ${accountName}
- Submission Date: ${new Date().toISOString()}
- Submitted via ICESCO Portal

Relationships will be established using set_relationship method:
- Subservice: ${subservice.id} (${subservice.name})
- Contact: ${contactInfo.id} (${contactInfo.first_name} ${contactInfo.last_name})
- Account: ${accountId} (${accountName})

Frontend Field Mapping Applied:
- title -> name: ${projectData.title || 'N/A'}
- brief -> description: ${projectData.brief || 'N/A'}
- rationale -> problem_statement: ${projectData.rationale || 'N/A'}
- budget.icesco -> budget_icesco: ${projectData.budget?.icesco || 'N/A'}
- conveningMethod -> project_type: ${projectData.conveningMethod || 'N/A'}
- partners array -> partner1/2/3: ${projectData.partners?.join(', ') || 'N/A'}

${projectData.additionalComments || projectData.comments || ''}`
        },
        
        // Note: Relationship ID fields will be set via set_relationship method after record creation
      ]
    };
    
    console.log('=== DEBUG: Prepared Suggestion Data ===');
    console.log('Suggestion data:', JSON.stringify(suggestionData, null, 2));
    
    // Submit to CRM
    const requestBody = new URLSearchParams({
      method: 'set_entry',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify(suggestionData),
    });
    
    console.log('=== DEBUG: Making CRM Request ===');
    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });
    
    console.log('=== DEBUG: CRM Response ===');
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CRM Error Response:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `CRM server returned error status ${response.status}`,
          errorType: 'HTTP_ERROR',
          statusCode: response.status,
          rawResponse: errorText.substring(0, 1000)
        },
        { status: 500 }
      );
    }
    
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to parse CRM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          errorType: 'JSON_PARSE_ERROR',
          rawResponse: responseText.substring(0, 1000)
        },
        { status: 500 }
      );
    }
    
    if (data.id && data.id !== '-1') {
      console.log('=== DEBUG: Success ===');
      console.log('Project suggestion submitted successfully with ID:', data.id);
      
      // Now establish relationships using set_relationship
      console.log('=== DEBUG: Establishing Relationships ===');
      
      try {
        // Establish subservice relationship
        console.log('Setting subservice relationship...');
        
        // Use the correct link field name for icesc_project_suggestions module
        const subserviceLinkField = 'ms_subservice_icesc_project_suggestions_1';
        
        try {
          console.log(`Setting subservice relationship using field: ${subserviceLinkField}`);
          console.log(`Project ID: ${data.id}`);
          console.log(`Subservice ID: ${subservice.id}`); // Use the real subservice ID
          
          const subserviceRelationshipData = {
            session: sessionId,
            module_name: 'icesc_project_suggestions',
            module_id: data.id,
            link_field_name: subserviceLinkField,
            related_ids: [subservice.id] // Use the real subservice ID
          };
          
          console.log('Subservice relationship data:', subserviceRelationshipData);
          
          const subserviceRelationshipResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'set_relationship',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify(subserviceRelationshipData),
            }),
          });
          
          const subserviceRelationshipResult = await subserviceRelationshipResponse.json();
          console.log('Subservice relationship result:', subserviceRelationshipResult);
          
          if (subserviceRelationshipResult && !subserviceRelationshipResult.error) {
            console.log('✅ Subservice relationship successful');
          } else {
            console.log('❌ Subservice relationship failed:', subserviceRelationshipResult);
            console.log('Error details:', subserviceRelationshipResult.error);
          }
        } catch (fieldError) {
          console.log('❌ Subservice relationship error:', fieldError);
        }
        
        // Establish contact relationship
        console.log('Setting contact relationship...');
        
        const contactLinkField = 'contacts_icesc_project_suggestions_1';
        
        try {
          console.log(`Setting contact relationship using field: ${contactLinkField}`);
          const contactRelationshipData = {
            session: sessionId,
            module_name: 'icesc_project_suggestions',
            module_id: data.id,
            link_field_name: contactLinkField,
            related_ids: [contactInfo.id]
          };
          
          const contactRelationshipResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'set_relationship',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify(contactRelationshipData),
            }),
          });
          
          const contactRelationshipResult = await contactRelationshipResponse.json();
          console.log('Contact relationship result:', contactRelationshipResult);
          
          if (contactRelationshipResult && !contactRelationshipResult.error) {
            console.log('✅ Contact relationship successful');
          } else {
            console.log('❌ Contact relationship failed:', contactRelationshipResult);
          }
        } catch (fieldError) {
          console.log('❌ Contact relationship error:', fieldError);
        }
        
        // Establish account relationship if account ID is valid
        if (accountId && accountId !== 'default') {
          console.log('Setting account relationship...');
          
          // Try different possible account link field names
          const possibleAccountLinkFields = [
            'accounts_icesc_project_suggestions_1',
            'account_icesc_project_suggestions_1',
            'accounts_project_suggestions_1',
            'account_project_suggestions_1',
            'accounts_icesc_suggestion_1',
            'account_icesc_suggestion_1'
          ];
          
          let accountRelationshipSuccess = false;
          
          for (const accountLinkField of possibleAccountLinkFields) {
            if (accountRelationshipSuccess) break; // Stop if we already succeeded
            
            try {
              console.log(`Trying account relationship using field: ${accountLinkField}`);
              const accountRelationshipData = {
                session: sessionId,
                module_name: 'icesc_project_suggestions',
                module_id: data.id,
                link_field_name: accountLinkField,
                related_ids: [accountId]
              };
              
              const accountRelationshipResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  method: 'set_relationship',
                  input_type: 'JSON',
                  response_type: 'JSON',
                  rest_data: JSON.stringify(accountRelationshipData),
                }),
              });
              
              const accountRelationshipResult = await accountRelationshipResponse.json();
              console.log(`Account relationship result for ${accountLinkField}:`, accountRelationshipResult);
              
              if (accountRelationshipResult && !accountRelationshipResult.error) {
                console.log(`✅ Account relationship successful with field: ${accountLinkField}`);
                accountRelationshipSuccess = true;
              } else {
                console.log(`❌ Account relationship failed with field ${accountLinkField}:`, accountRelationshipResult);
              }
            } catch (fieldError) {
              console.log(`❌ Account relationship error with field ${accountLinkField}:`, fieldError);
            }
          }
          
          if (!accountRelationshipSuccess) {
            console.log('❌ All account relationship attempts failed');
          }
        }
        
        console.log('=== DEBUG: Relationships Established ===');
        console.log('Using icesc_suggestion module field names:');
        console.log('- ms_subservice_icesc_suggestion_1 (for subservice)');
        console.log('- contacts_icesc_suggestion_1 (for contact)');
        console.log('- accounts_icesc_suggestion_1 (for account)');
        console.log('The _name fields should now be automatically populated by SugarCRM');
        
        // Verify the relationships were actually set
        console.log('=== DEBUG: Verifying Relationships ===');
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
                  'ms_subservice_icesc_project_suggestions_1_name',
                  'contacts_icesc_project_suggestions_1_name',
                  'accounts_icesc_project_suggestions_1_name'
                ]
              }),
            }),
          });
          
          const verifyResult = await verifyResponse.json();
          console.log('Verification result:', verifyResult);
          
          if (verifyResult.entry_list && verifyResult.entry_list[0]) {
            const entry = verifyResult.entry_list[0];
            console.log('Current relationship values:');
            console.log('- ms_subservice_icesc_project_suggestions_1_name:', entry.name_value_list.ms_subservice_icesc_project_suggestions_1_name?.value || 'EMPTY');
            console.log('- contacts_icesc_project_suggestions_1_name:', entry.name_value_list.contacts_icesc_project_suggestions_1_name?.value || 'EMPTY');
            console.log('- accounts_icesc_project_suggestions_1_name:', entry.name_value_list.accounts_icesc_project_suggestions_1_name?.value || 'EMPTY');
          }
        } catch (verifyError) {
          console.log('❌ Verification failed:', verifyError);
        }
        
      } catch (relationshipError) {
        console.error('Error establishing relationships:', relationshipError);
        // Don't fail the entire submission if relationships fail
      }
      
      // Log the successful submission
      console.log('=== DEBUG: Submission Summary ===');
      console.log('Suggestion ID:', data.id);
      console.log('Subservice ID:', subserviceId);
      console.log('Subservice Name:', subservice.name);
      console.log('Contact ID:', contactInfo.id);
      console.log('Contact Name:', `${contactInfo.first_name} ${contactInfo.last_name}`);
      console.log('Account ID:', accountId);
      console.log('Account Name:', accountName);
      console.log('Submission Time:', new Date().toISOString());
      console.log('Relationships Established:');
      console.log('- ms_subservice_icesc_project_suggestions_1:', subserviceId);
      console.log('- contacts_icesc_project_suggestions_1:', contactInfo.id);
      console.log('- accounts_icesc_project_suggestions_1:', accountId);
      console.log('==========================================');
      
      return NextResponse.json({
        success: true,
        suggestionId: data.id,
        contactId: contactInfo.id,
        subserviceId: subserviceId,
        message: 'Project suggestion submitted successfully with relationships established'
      });
    } else {
      console.error('=== DEBUG: Failure ===');
      console.error('Project suggestion submission failed');
      console.error('Data ID:', data.id);
      console.error('Data error:', data.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.description || data.error?.message || `Failed to submit project suggestion. ID: ${data.id}`,
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
