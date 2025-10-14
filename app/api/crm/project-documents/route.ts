import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'https://crm.icesco.org';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    console.log('=== Fetching documents for project ===');
    console.log('Project ID:', projectId);

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Get fresh session ID
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);

    // Fetch documents relationship for the project
    const relationshipData = {
      session: sessionId,
      module_name: 'icesc_project_suggestions',
      module_id: projectId,
      link_field_name: 'documents_icesc_project_suggestions_1',
      related_module_query: '',
      related_fields: ['id', 'document_name', 'filename', 'file_ext', 'file_mime_type', 'description', 'status_id', 'active_date'],
      related_module_link_name_to_fields_array: [],
      deleted: 0,
      order_by: '',
      offset: 0,
      limit: 100
    };

    console.log('Fetching documents relationship...');
    console.log('Relationship data:', JSON.stringify(relationshipData, null, 2));

    const response = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_relationships',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify(relationshipData)
      })
    });

    if (!response.ok) {
      console.error('CRM API error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `CRM API error: ${response.status} ${response.statusText}`
      }, { status: 500 });
    }

    const responseText = await response.text();
    console.log('CRM response received');
    console.log('Response length:', responseText.length);
    console.log('Response (first 1000 chars):', responseText.substring(0, 1000));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse CRM response:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      return NextResponse.json({
        success: false,
        error: 'Failed to parse CRM response',
        rawResponse: responseText.substring(0, 1000)
      }, { status: 500 });
    }

    console.log('Parsed CRM response:', JSON.stringify(data, null, 2));

    // Extract documents from the relationship response
    const documents: any[] = [];
    
    if (data.entry_list && Array.isArray(data.entry_list)) {
      console.log(`Found ${data.entry_list.length} document(s) in relationship`);
      
      for (const entry of data.entry_list) {
        const doc: any = {
          id: entry.id || entry.name_value_list?.id?.value
        };

        // Extract all fields from name_value_list
        if (entry.name_value_list) {
          for (const [key, field] of Object.entries(entry.name_value_list)) {
            if (typeof field === 'object' && field !== null && 'value' in field) {
              doc[key] = (field as any).value;
            }
          }
        }

        documents.push(doc);
        console.log('Processed document:', doc);
      }
    } else {
      console.log('No documents found in relationship or unexpected response structure');
    }

    return NextResponse.json({
      success: true,
      projectId: projectId,
      documentCount: documents.length,
      documents: documents,
      rawResponse: data
    });

  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

