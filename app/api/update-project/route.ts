import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';
import { mapProjectDataToCRM } from '@/utils/crmFieldMapping';
import { getAzureDownloadURL } from '@/services/azureService';

const CRM_BASE_URL = 'https://crm.icesco.org';

// Function to create documents in CRM and link them to project
async function createAndLinkDocuments(
  sessionId: string, 
  projectId: string, 
  documentPaths: string, 
  documentNames: string
): Promise<void> {
  try {
    console.log('=== Creating and linking documents for update ===');
    console.log('Project ID:', projectId);
    console.log('Document paths:', documentPaths);
    console.log('Document names:', documentNames);
    
    // Split document paths and names
    const paths = documentPaths.split('; ').filter(path => path.trim());
    const names = documentNames.split('; ').filter(name => name.trim());
    
    if (paths.length !== names.length) {
      console.error('Mismatch between document paths and names count');
      return;
    }
    
    const documentIds: string[] = [];
    
    // Create each document record
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i].trim();
      const name = names[i].trim();
      
      console.log(`Creating document ${i + 1}: ${name} at ${path}`);
      
      const documentData = {
        session: sessionId,
        module_name: 'Documents',
        name_value_list: [
          { name: 'document_name', value: name },
          { name: 'description', value: `Document uploaded for project: ${projectId}` },
          { name: 'status_id', value: 'Active' },
          { name: 'active_date', value: new Date().toISOString().split('T')[0] }
        ]
      };
      
      const createResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          method: 'set_entry',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(documentData)
        }),
      });
      
      const createResponseText = await createResponse.text();
      console.log(`Document creation response for ${name}:`, createResponseText);
      
      let createResult;
      if (createResponseText.trim()) {
        createResult = JSON.parse(createResponseText);
      }
      
      if (createResult && createResult.id) {
        documentIds.push(createResult.id);
        console.log(`✅ Document created with ID: ${createResult.id}`);
      } else {
        console.error(`❌ Failed to create document: ${name}`, createResult);
      }
    }
    
    // Link all documents to the project
    if (documentIds.length > 0) {
      console.log('Linking documents to project:', documentIds);
      
      const linkResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          method: 'set_relationship',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({
            session: sessionId,
            module_name: 'icesc_project_suggestions',
            module_id: projectId,
            link_field_name: 'documents_icesc_project_suggestions_1',
            related_ids: documentIds
          }),
        }),
      });
      
      const linkResponseText = await linkResponse.text();
      console.log('Document linking response:', linkResponseText);
      
      let linkResult;
      if (linkResponseText.trim()) {
        linkResult = JSON.parse(linkResponseText);
      }
      
      if (linkResult && linkResult.created === documentIds.length) {
        console.log(`✅ Successfully linked ${documentIds.length} documents to project`);
      } else {
        console.error('❌ Failed to link documents to project:', linkResult);
      }
    }
    
    console.log('=== Document creation and linking completed for update ===');
  } catch (error) {
    console.error('Error creating and linking documents for update:', error);
  }
}

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
    console.log('=== DEBUG: CRM Update Started ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
    const projectData = await request.json();
    console.log('=== DEBUG: Received project data for update ===');
    console.log('Project data keys:', Object.keys(projectData));
    console.log('Project data:', JSON.stringify(projectData, null, 2));
    
    // Validate project ID is present
    if (!projectData.id) {
      console.error('❌ No project ID provided in request');
      return NextResponse.json({
        success: false,
        error: 'Project ID is required for updates'
      }, { status: 400 });
    }
    
    console.log('✅ Project ID validated:', projectData.id);
    
    // Validate required fields - check if this is a draft
    const isDraft = projectData.status === 'Draft';
    
    if (!isDraft) {
      // For non-drafts, validate essential fields only
      // Contact fields are optional since they're stored in related Contact record
      const requiredFields = [
        'id', 'name', 'description', 'strategic_goal', 'pillar', 'service', 'sub_service',
        'session_id'
      ];

      const missingFields = requiredFields.filter(field => !projectData[field as keyof typeof projectData]);
      
      if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required fields: ${missingFields.join(', ')}` 
          },
          { status: 400 }
        );
      }
      
      // Validate contact_id is present (contact info is in related record)
      if (!projectData.contact_id) {
        console.log('Missing contact_id for project update');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Missing required field: contact_id' 
          },
          { status: 400 }
        );
      }
    } else {
      // For drafts, only validate essential fields
      if (!projectData.id || !projectData.name || !projectData.session_id) {
        console.log('Missing essential fields for draft update:', { 
          id: !!projectData.id, 
          name: !!projectData.name, 
          session_id: !!projectData.session_id 
        });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Missing essential fields: id, name and session_id are required for draft updates' 
          },
          { status: 400 }
        );
      }
    }
    
    // Get a fresh session ID from CRM (admin credentials) 
    console.log('=== DEBUG: Getting fresh session ID from CRM ===');
    let sessionId: string;
    try {
      sessionId = await getSessionId();
      console.log('✅ Fresh session ID obtained:', sessionId ? `${sessionId.substring(0, 10)}...` : 'none');
      console.log('Session ID length:', sessionId?.length);
    } catch (sessionError) {
      console.error('❌ Failed to get session ID:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to authenticate with CRM: ' + (sessionError instanceof Error ? sessionError.message : 'Unknown error')
      }, { status: 500 });
    }
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to authenticate with CRM - no session ID returned'
      }, { status: 500 });
    }
    
    // Remove old session_id from projectData to avoid sending it as a field
    delete projectData.session_id;
    console.log('✅ Removed old session_id from project data');
    
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

    // Use proper CRM field mapping (same as submit)
    console.log('=== DEBUG: Creating CRM field mapping ===');
    
    // Convert document paths to Azure URLs before mapping to CRM
    if (projectData.documents_icesc_project_suggestions_1_name) {
      console.log('🔄 Converting document paths to Azure URLs...');
      const documentPaths = projectData.documents_icesc_project_suggestions_1_name.split('; ').filter((path: string) => path.trim());
      const azureUrls: string[] = [];
      
      for (const path of documentPaths) {
        try {
          if (path.includes('hive-documents/') && !path.startsWith('https://')) {
            console.log(`Converting document path to Azure URL: ${path}`);
            const azureUrl = await getAzureDownloadURL(path);
            
            // The getAzureDownloadURL should already return URL with SAS token
            // since the Azure client is initialized with SAS token
            azureUrls.push(azureUrl);
            console.log(`✅ Converted to Azure URL with SAS token: ${azureUrl}`);
          } else if (path.startsWith('https://res.cloudinary.com/')) {
            // Keep Cloudinary URLs as-is
            azureUrls.push(path);
            console.log(`✅ Keeping Cloudinary URL: ${path}`);
          } else if (path.startsWith('https://') && path.includes('blob.core.windows.net')) {
            // Already a full Azure URL, use as-is
            azureUrls.push(path);
            console.log(`✅ Using existing Azure URL: ${path}`);
          } else {
            // For other formats, use as-is
            azureUrls.push(path);
            console.log(`⚠️ Using path as-is: ${path}`);
          }
        } catch (urlError) {
          console.error(`❌ Failed to convert document path: ${path}`, urlError);
          azureUrls.push(path); // Fall back to original path
        }
      }
      
      // Update the project data with full Azure URLs
      const finalUrls = azureUrls.join('; ');
      
      // Store full URLs in the document fields
      projectData.documents_icesc_project_suggestions_1_name = finalUrls;
      projectData.document_c = finalUrls;
      
      console.log('✅ Updated document fields with full Azure URLs');
      console.log('📏 Total length of URLs:', finalUrls.length, 'characters');
      console.log('🔗 Final URLs:', finalUrls);
    }
    
    // Process individual document fields (document1_c, document2_c, document3_c, document4_c)
    // These come from the draft save which already uploaded the files
    console.log('📄 Checking individual document fields in project data...');
    for (let i = 1; i <= 4; i++) {
      const crmField = `document${i}_c`;
      if (projectData[crmField]) {
        console.log(`✅ Found ${crmField}:`, projectData[crmField]);
        // Field already has the URL, just ensure it's in the data
      } else {
        console.log(`📄 No data for ${crmField}`);
      }
    }
    
    const crmData = mapProjectDataToCRM(projectData);
    
    // Debug logging for partners, milestones, and KPIs
    console.log('🔍 DEBUG - Project Data Partners:', projectData.partners);
    console.log('🔍 DEBUG - Project Data Milestones:', projectData.milestones);
    console.log('🔍 DEBUG - Project Data KPIs:', projectData.kpis);
    console.log('🔍 DEBUG - CRM Data after mapping:', crmData);
    
    // Fix phone number length (max 15 characters for better compatibility)
    crmData.forEach(field => {
      if (field.name === 'contact_phone' && typeof field.value === 'string') {
        if (field.value.length > 15) {
          field.value = field.value.substring(0, 15);
          console.log('Truncated phone number to:', field.value);
        }
        // Also remove any non-numeric characters except + and -
        field.value = field.value.replace(/[^\d+\-]/g, '');
      }
    });
    
    // Filter out problematic fields that cause CRM 500 errors
    // Keep only essential, safe fields for updates
    const allowedFields = [
      'name',
      'description', 
      'project_brief',
      'problem_statement1_c',
      'rationale_impact',
      'beneficiaries',
      'budget_icesco',
      'budget_member_state',
      'budget_sponsorship',
      'date_start',
      'date_end',
      'project_frequency',
      'frequency_duration',
      'partner1', 'partner2', 'partner3', 'partner4', 'partner5',
      'delivery_modality',
      'geographic_scope',
      'project_type',
      'convening_method',
      'convening_method_other',
      'expected_outputs',
      'milestones1', 'milestones2', 'milestones3', 'milestones4', 'milestones5',
      'kpis1', 'kpis2', 'kpis3', 'kpis4', 'kpis5',
      'comments',
      'status_c',
      'sub_service_id',
      'sub_service',
      'otherbeneficiary',
      // Contact fields (stored in project record)
      'contact_name',
      'contact_email',
      'contact_phone',
      'contact_role',
      'contact_id',
      // Document fields
      'document_c',
      'documents_icesc_project_suggestions_1_name',
      'document1_c',
      'document2_c',
      'document3_c',
      'document4_c'
    ];
    
    // Keep contact fields and document fields even if empty (to allow clearing them)
    const contactFields = ['contact_name', 'contact_email', 'contact_phone', 'contact_role', 'contact_id'];
    const documentFields = ['document_c', 'documents_icesc_project_suggestions_1_name', 'document1_c', 'document2_c', 'document3_c', 'document4_c'];
    
    const filteredCrmData = crmData.filter(field => {
      if (!allowedFields.includes(field.name)) return false;
      
      // Always include contact fields and document fields (even if empty to allow clearing)
      if (contactFields.includes(field.name) || documentFields.includes(field.name)) {
        return field.value !== null && field.value !== undefined;
      }
      
      // For other fields, exclude empty values
      return field.value !== '' && field.value !== null && field.value !== undefined;
    });
    console.log('=== DEBUG: Filtered CRM fields ===');
    console.log('Total fields:', filteredCrmData.length);
    console.log('Field names:', filteredCrmData.map(f => f.name));
    
    // Log document fields specifically
    const docFieldsInUpdate = filteredCrmData.filter(f => f.name.includes('document'));
    console.log('📄 Document fields in CRM update:', docFieldsInUpdate.map(f => ({
      name: f.name,
      value: f.value ? (f.value.length > 50 ? `${f.value.substring(0, 50)}...` : f.value) : 'EMPTY',
      isEmpty: f.value === ''
    })));
    
    // Additional validation - ensure all values are clean
    filteredCrmData.forEach(field => {
      // For document fields, preserve empty strings to allow clearing
      if (documentFields.includes(field.name)) {
        if (field.value === '' || field.value === null || field.value === undefined) {
          field.value = ''; // Keep as empty string to clear in CRM
          console.log(`🗑️ Document field ${field.name} will be cleared in CRM (set to empty string)`);
        } else if (typeof field.value === 'string') {
          field.value = field.value.trim();
        }
      } else {
        // For non-document fields
        if (field.value === '' || field.value === null || field.value === undefined) {
          field.value = '';
        }
        // Ensure string values are trimmed
        if (typeof field.value === 'string') {
          field.value = field.value.trim();
        }
      }
    });
    
    console.log('=== DEBUG: Cleaned field values ===');
    console.log('Cleaned fields:', filteredCrmData.map(f => ({ name: f.name, value: f.value, type: typeof f.value })));

    console.log('=== DEBUG: Mapped CRM data ===');
    console.log('CRM data length:', crmData.length);
    console.log('CRM data:', JSON.stringify(crmData, null, 2));

    // Use the SAME format as submit-project-simple (id in name_value_list, not at root)
    const updateData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: [
        { name: 'id', value: projectData.id },  // ID inside name_value_list (same as submit)
        ...filteredCrmData
      ]
    };
    
    console.log('=== DEBUG: Final update data ===');
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    console.log('CRM Base URL:', CRM_BASE_URL);
    console.log('Target URL:', `${CRM_BASE_URL}/service/v4_1/rest.php`);
    console.log('Project ID being updated:', projectData.id);
    console.log('Project ID type:', typeof projectData.id);
    console.log('Project ID length:', projectData.id?.length);
    
    // Log document fields in the final request
    const docFieldsInFinalRequest = updateData.name_value_list.filter((f: any) => f.name.includes('document'));
    console.log('📄 Document fields in FINAL CRM request:', docFieldsInFinalRequest.map((f: any) => ({
      name: f.name,
      value: f.value || 'EMPTY_STRING',
      valueLength: f.value ? f.value.length : 0,
      isEmpty: f.value === '',
      isNull: f.value === null,
      isUndefined: f.value === undefined
    })));
    
    // Validate update data
    if (!updateData.session || !updateData.module_name || !updateData.name_value_list) {
      console.error('=== DEBUG: Invalid Update Data ===');
      console.error('Missing required fields in update data');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid update data - missing required fields',
          errorType: 'INVALID_UPDATE_DATA',
          updateData: updateData
        },
        { status: 500 }
      );
    }

    const requestBody = new URLSearchParams({
      method: 'set_entry',
      input_type: 'JSON',
      response_type: 'JSON',
      rest_data: JSON.stringify(updateData),
    });
    
    console.log('=== DEBUG: Request body ===');
    console.log('Request body:', requestBody.toString());
    
    // Decode and log the actual rest_data being sent
    const restDataParam = requestBody.get('rest_data');
    if (restDataParam) {
      try {
        const parsedRestData = JSON.parse(restDataParam);
        console.log('=== DEBUG: Decoded rest_data ===');
        console.log(JSON.stringify(parsedRestData, null, 2));
      } catch (e) {
        console.log('Could not parse rest_data:', e);
      }
    }

    // Skip verification - get_entry seems to have issues with this CRM
    // Proceed directly with update using set_entry
    console.log('⚠️ Skipping verification, proceeding directly with update');
    
    console.log('=== DEBUG: Making CRM request ===');
    
    // Retry logic for connection timeouts
    let response;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} to update project in CRM...`);
        
        response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: requestBody,
          // Add longer timeout for slow CRM server
          signal: AbortSignal.timeout(60000), // 60 second timeout
        });
        
        console.log(`Attempt ${attempt} successful - Response status: ${response.status}`);
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000; // 2s, 4s, 6s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('All retry attempts failed');
    }

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
      console.error('Error response length:', errorText.length);
      console.error('Error response:', errorText.substring(0, 1000));
      console.error('Error response (full):', errorText);
      
      // Try to parse as JSON to see if there's a structured error
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error JSON:', errorJson);
      } catch (e) {
        console.error('Error response is not JSON');
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `CRM server returned error status ${response.status}: ${response.statusText}. ${errorText ? 'Error: ' + errorText.substring(0, 200) : 'No error message provided.'}`,
          errorType: 'HTTP_ERROR',
          statusCode: response.status,
          rawResponse: errorText || '(empty response)'
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
      
      // Check if this is a successful update
      if (data.id) {
        console.log('✅ SUCCESS: Project updated with ID:', data.id);
      } else {
        console.log('❌ NO PROJECT ID: Update may have failed');
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
              console.log('Project updated successfully with ID:', data.id);
              console.log('Full CRM response data:', JSON.stringify(data, null, 2));
              
              // Set contact relationship (same as submit-project-simple)
              // Don't try to update the Contact record - just maintain the relationship
              const contactIdToLink = projectData.contact_id || (typeof window === 'undefined' && projectData.contact?.id);
              
              console.log('=== DEBUG: Contact Relationship ===');
              console.log('Contact ID from projectData:', projectData.contact_id);
              console.log('Contact ID to link:', contactIdToLink);
              
              if (contactIdToLink) {
                console.log('=== DEBUG: Setting Contact Relationship ===');
                try {
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
                        related_ids: [contactIdToLink]
                      }),
                    }),
                  });
                  const contactResult = await contactResponse.json();
                  console.log('Contact relationship result:', JSON.stringify(contactResult, null, 2));
                  if (contactResult.created === 1 || contactResult.created === 0) {
                    console.log('✅ Contact relationship set successfully');
                  } else {
                    console.log('⚠️ Contact relationship response:', contactResult);
                  }
                } catch (contactError) {
                  console.error('Error setting contact relationship:', contactError);
                }
              } else {
                console.log('⚠️ No contact ID available to link');
              }
              
              // Create and link documents if any
              if (projectData.document_c && projectData.documents_icesc_project_suggestions_1_name) {
                await createAndLinkDocuments(sessionId, data.id, projectData.document_c, projectData.documents_icesc_project_suggestions_1_name);
              }
              
              // Verify the update by fetching the project again
              console.log('=== DEBUG: Verifying update by fetching project ===');
              try {
                const verifyData = {
                  session: sessionId,
                  module_name: 'icesc_project_suggestions',
                  id: projectData.id,
                  select_fields: ['id', 'name', 'description', 'contact_name', 'contact_email', 'contact_phone']
                };
                
                const verifyResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    method: 'get_entry',
                    input_type: 'JSON',
                    response_type: 'JSON',
                    rest_data: JSON.stringify(verifyData),
                  }),
                  signal: AbortSignal.timeout(30000),
                });
                
                if (verifyResponse.ok) {
                  const verifyResult = await verifyResponse.text();
                  console.log('=== DEBUG: Verification result ===');
                  console.log('Verification response:', verifyResult);
                  
                  try {
                    const verifyData = JSON.parse(verifyResult);
                    console.log('=== DEBUG: Parsed verification data ===');
                    console.log('Verification data:', JSON.stringify(verifyData, null, 2));
                  } catch (parseError) {
                    console.log('Could not parse verification response as JSON');
                  }
                } else {
                  console.log('Verification failed with status:', verifyResponse.status);
                }
              } catch (verifyError) {
                console.log('Verification error:', verifyError);
              }
              
              return NextResponse.json({
                success: true,
                projectId: data.id,
                message: 'Project updated successfully',
                crmResponse: data
              });
            } else {
      console.error('=== DEBUG: Failure ===');
      console.error('Project update failed');
      console.error('Data ID:', data.id);
      console.error('Data error:', data.error);
      console.error('Full response data:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.description || data.error?.message || `Failed to update project. ID: ${data.id}`,
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
