import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Checking available CRM modules ===');

    // Get session first
    const sessionResponse = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'login',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          user_auth: {
            user_name: 'nchaouki',
            password: 'Icesco2030@',
          },
          application_name: 'RestClient',
        }),
      }),
    });

    const sessionResult = await sessionResponse.json();
    const sessionId = sessionResult.id;
    console.log('Session ID:', sessionId);

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get CRM session'
      });
    }

    // Get available modules
    const modulesResponse = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'get_available_modules',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
        }),
      }),
    });

    const modulesResult = await modulesResponse.json();
    console.log('Available modules:', modulesResult);

    // Look for suggestion-related modules
    const suggestionModules = Object.keys(modulesResult.modules || {}).filter(key => 
      key.toLowerCase().includes('suggest') || 
      key.toLowerCase().includes('project') ||
      key.toLowerCase().includes('icesc')
    );

    console.log('Suggestion/Project related modules:', suggestionModules);

    // Also try to get entries from different possible module names
    const possibleModules = [
      'icesc_suggestion',
      'icesc_project_suggestions', 
      'member_project_suggestions',
      'project_suggestions',
      'suggestions'
    ];

    const moduleData: Record<string, any> = {};

    for (const moduleName of possibleModules) {
      try {
        console.log(`Testing module: ${moduleName}`);
        
        const testResponse = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
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
              module_name: moduleName,
              select_fields: ['id', 'name'],
              max_results: 5
            }),
          }),
        });

        const testResult = await testResponse.json();
        console.log(`Module ${moduleName} result:`, testResult);
        
        if (testResult.entry_list) {
          moduleData[moduleName] = {
            count: testResult.entry_list.length,
            entries: testResult.entry_list.map((entry: any) => ({
              id: entry.name_value_list?.id?.value,
              name: entry.name_value_list?.name?.value
            }))
          };
        } else {
          moduleData[moduleName] = {
            error: testResult.description || 'No entries found'
          };
        }
      } catch (error) {
        console.error(`Error testing module ${moduleName}:`, error);
        moduleData[moduleName] = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      success: true,
      availableModules: modulesResult.modules,
      suggestionModules,
      moduleData
    });

  } catch (error) {
    console.error('Error in debug modules:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

