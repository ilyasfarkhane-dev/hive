import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

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

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Relationship Field Discovery ===');
    
    const sessionId = await getFreshSessionId();
    console.log('Fresh session ID obtained:', sessionId);
    
    // Get module fields for icesc_project_suggestions
    console.log('=== DEBUG: Getting Module Fields for icesc_project_suggestions ===');
    const moduleFieldsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_module_fields',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions'
        }),
      }),
    });
    
    // Also get module fields for icesc_suggestion to compare
    console.log('=== DEBUG: Getting Module Fields for icesc_suggestion ===');
    const icescSuggestionFieldsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_module_fields',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_suggestion'
        }),
      }),
    });
    
    const moduleFieldsResult = await moduleFieldsResponse.json();
    console.log('icesc_project_suggestions fields result:', moduleFieldsResult);
    
    const icescSuggestionFieldsResult = await icescSuggestionFieldsResponse.json();
    console.log('icesc_suggestion fields result:', icescSuggestionFieldsResult);
    
    // Extract relationship fields
    const relationshipFields: Array<{
      name: string;
      type: string;
      source?: string;
      label: string;
      required: number;
      options?: any;
    }> = [];
    if (moduleFieldsResult && moduleFieldsResult.module_fields) {
      Object.entries(moduleFieldsResult.module_fields).forEach(([fieldName, fieldInfo]: [string, any]) => {
        if (fieldName.includes('_name') || fieldName.includes('_c') || fieldName.includes('relationship')) {
          relationshipFields.push({
            name: fieldName,
            type: fieldInfo.type,
            source: fieldInfo.source,
            label: fieldInfo.label,
            required: fieldInfo.required,
            options: fieldInfo.options
          });
        }
      });
    }
    
    console.log('=== DEBUG: Relationship Fields Found ===');
    console.log('Relationship fields:', relationshipFields);
    
    // Also try to get existing project suggestions to see what fields are populated
    console.log('=== DEBUG: Getting Existing Project Suggestions ===');
    const existingProjects = await getModuleEntries(
      sessionId,
      'icesc_project_suggestions',
      [
        'id', 'name', 'description',
        'ms_subservice_icesc_suggestion_1',
        'ms_subservice_icesc_suggestion_1_name',
        'accounts_icesc_suggestion_1',
        'accounts_icesc_suggestion_1_name',
        'contacts_icesc_suggestion_1',
        'contacts_icesc_suggestion_1_name',
        'sub_service_id',
        'sub_service',
        'contact_id',
        'contact_name'
      ],
      '',
      5
    );
    
    console.log('Existing projects:', existingProjects);
    
    // Try to get relationship links for the module
    console.log('=== DEBUG: Getting Module Relationships ===');
    const relationshipsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_relationships',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          module_id: '',
          link_field_name: '',
          related_module_query: '',
          related_fields: ['id', 'name'],
          related_module_link_name_to_fields_array: [],
          deleted: 0
        }),
      }),
    });
    
    const relationshipsResult = await relationshipsResponse.json();
    console.log('Relationships result:', relationshipsResult);
    
    // Test set_relationship method with a sample project
    let relationshipTestResult = null;
    if (existingProjects && existingProjects.length > 0) {
      const testProject = existingProjects[0];
      console.log('=== DEBUG: Testing set_relationship with project:', testProject.id);
      
      // Test subservice relationship
      try {
        const testRelationshipData = {
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          module_id: testProject.id,
          link_field_name: 'ms_subservice_icesc_suggestion_1',
          related_ids: ['test-subservice-id']
        };
        
        console.log('Testing relationship data:', testRelationshipData);
        
        const testRelationshipResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            method: 'set_relationship',
            input_type: 'JSON',
            response_type: 'JSON',
            rest_data: JSON.stringify(testRelationshipData),
          }),
        });
        
        const testRelationshipResult = await testRelationshipResponse.json();
        console.log('Test relationship result:', testRelationshipResult);
        
        relationshipTestResult = {
          method: 'set_relationship',
          field: 'ms_subservice_icesc_suggestion_1',
          result: testRelationshipResult,
          success: !testRelationshipResult.error,
          error: testRelationshipResult.error
        };
      } catch (testError) {
        console.error('Test relationship error:', testError);
        relationshipTestResult = {
          method: 'set_relationship',
          field: 'ms_subservice_icesc_suggestion_1',
          error: testError instanceof Error ? testError.message : 'Unknown error',
          success: false
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      icescProjectSuggestionsFields: moduleFieldsResult,
      icescSuggestionFields: icescSuggestionFieldsResult,
      relationshipFields: relationshipFields,
      existingProjects: existingProjects,
      relationships: relationshipsResult,
      relationshipTest: relationshipTestResult,
      message: 'Relationship field discovery and test completed - comparing both modules'
    });
    
  } catch (error) {
    console.error('=== DEBUG: Relationship Discovery Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Relationship discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorType: typeof error,
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}
