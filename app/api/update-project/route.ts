import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';
import { mapProjectDataToCRM } from '@/utils/crmFieldMapping';

const CRM_BASE_URL = 'https://crm.icesco.org';

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
    
    // Validate required fields - check if this is a draft
    const isDraft = projectData.status === 'Draft';
    
    if (!isDraft) {
      // For non-drafts, validate all required fields
      const requiredFields = [
        'id', 'name', 'description', 'strategic_goal', 'pillar', 'service', 'sub_service',
        'contact_name', 'contact_email', 'contact_phone', 'session_id'
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

    // Use proper CRM field mapping (same as submit)
    console.log('=== DEBUG: Creating CRM field mapping ===');
    const crmData = mapProjectDataToCRM(projectData);
    
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
    
    // Include all fields for updates - don't filter out important fields
    const filteredCrmData = crmData;
    console.log('=== DEBUG: Using all mapped fields ===');
    console.log('Total fields:', crmData.length);
    console.log('Field names:', crmData.map(f => f.name));
    
    // Additional validation - ensure all values are clean
    filteredCrmData.forEach(field => {
      if (field.value === '' || field.value === null || field.value === undefined) {
        field.value = '';
      }
      // Ensure string values are trimmed
      if (typeof field.value === 'string') {
        field.value = field.value.trim();
      }
    });
    
    console.log('=== DEBUG: Cleaned field values ===');
    console.log('Cleaned fields:', filteredCrmData.map(f => ({ name: f.name, value: f.value, type: typeof f.value })));

    console.log('=== DEBUG: Mapped CRM data ===');
    console.log('CRM data length:', crmData.length);
    console.log('CRM data:', JSON.stringify(crmData, null, 2));

    // Try the same structure as submit method, but add id to name_value_list at the beginning
    const updateData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      name_value_list: [
        { name: 'id', value: projectData.id },
        ...filteredCrmData
      ],
    };
    
    console.log('=== DEBUG: Final update data ===');
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    console.log('CRM Base URL:', CRM_BASE_URL);
    console.log('Target URL:', `${CRM_BASE_URL}/service/v4_1/rest.php`);
    console.log('Project ID being updated:', projectData.id);
    console.log('Project ID type:', typeof projectData.id);
    console.log('Project ID length:', projectData.id?.length);
    
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

    // First, let's verify the project exists by getting it
    console.log('=== DEBUG: Verifying project exists ===');
    try {
      const verifyData = {
        session: sessionId,
        module_name: 'icesc_project_suggestions',
        id: projectData.id,
        select_fields: ['id', 'name']
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
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.text();
        console.log('=== DEBUG: Project verification result ===');
        console.log('Verify response:', verifyResult);
        
        if (verifyResult.includes('"id":"' + projectData.id + '"')) {
          console.log('✅ Project exists and can be updated');
        } else {
          console.log('❌ Project not found or verification failed');
        }
      } else {
        console.log('❌ Project verification failed with status:', verifyResponse.status);
      }
    } catch (verifyError) {
      console.log('❌ Project verification error:', verifyError);
    }
    
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
              
              // Set contact relationship if contact_id is provided
              if (projectData.contact_id) {
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
                        related_ids: [projectData.contact_id]
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
                } catch (contactError) {
                  console.error('Error setting contact relationship:', contactError);
                }
              } else {
                console.log('No contact ID provided, skipping contact relationship');
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
