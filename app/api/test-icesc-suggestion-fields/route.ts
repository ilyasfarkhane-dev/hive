import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Getting icesc_suggestion Module Fields ===');
    
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    // Get module fields for icesc_suggestion
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
          module_name: 'icesc_suggestion'
        }),
      }),
    });
    
    const moduleFieldsResult = await moduleFieldsResponse.json();
    console.log('icesc_suggestion module fields result:', moduleFieldsResult);
    
    // Extract relationship fields
    const relationshipFields: Array<{
      name: string;
      type: string;
      label: string;
      required: number;
      options?: any;
    }> = [];
    
    if (moduleFieldsResult.module_fields) {
      Object.entries(moduleFieldsResult.module_fields).forEach(([fieldName, fieldInfo]: [string, any]) => {
        if (fieldName.includes('_name') || fieldName.includes('_c') || fieldName.includes('relationship') || fieldName.includes('icesc_suggestion')) {
          relationshipFields.push({
            name: fieldName,
            type: fieldInfo.type,
            label: fieldInfo.label,
            required: fieldInfo.required,
            options: fieldInfo.options
          });
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      moduleFields: moduleFieldsResult,
      relationshipFields: relationshipFields,
      message: 'icesc_suggestion module fields retrieved'
    });
    
  } catch (error) {
    console.error('Get icesc_suggestion fields error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get icesc_suggestion module fields'
    }, { status: 500 });
  }
}



