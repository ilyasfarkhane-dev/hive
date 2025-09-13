import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Listing Available Modules ===');
    
    const sessionId = await getSessionId();
    console.log('Session ID obtained:', sessionId);
    
    // Get list of available modules
    const modulesResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_available_modules',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId
        }),
      }),
    });
    
    const modulesResult = await modulesResponse.json();
    console.log('Available modules result:', modulesResult);
    
    // Filter for modules that might be related to suggestions/projects
    const suggestionModules: any[] = [];
    if (modulesResult.modules) {
      Object.keys(modulesResult.modules).forEach(moduleName => {
        if (moduleName.toLowerCase().includes('suggestion') || 
            moduleName.toLowerCase().includes('project') ||
            moduleName.toLowerCase().includes('icesc')) {
          suggestionModules.push({
            name: moduleName,
            label: modulesResult.modules[moduleName]
          });
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      allModules: modulesResult.modules || {},
      suggestionRelatedModules: suggestionModules,
      message: 'Available modules retrieved'
    });
    
  } catch (error) {
    console.error('List modules error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list modules'
    }, { status: 500 });
  }
}


