import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    // Get session ID with timeout and retry logic
    let sessionId: string;
    try {
      sessionId = await getSessionId();
    } catch (sessionError) {
      console.error('Failed to get session ID:', sessionError);
      
      // Check if it's a connection timeout error
      if (sessionError instanceof Error && (
        sessionError.message.includes('ETIMEDOUT') || 
        sessionError.message.includes('timeout') ||
        sessionError.message.includes('ECONNREFUSED') ||
        sessionError.message.includes('ENOTFOUND')
      )) {
        return NextResponse.json({
          success: false,
          error: 'CRM server is currently unavailable. Please try again later.',
          errorType: 'CONNECTION_ERROR',
          projects: [],
          count: 0
        }, { status: 503 }); // Service Unavailable
      }
      
      throw sessionError;
    }
    
    // Fetch projects from CRM with timeout handling
    let projectEntries: any[];
    try {
      projectEntries = await getModuleEntries(
        sessionId,
        'icesc_project_suggestions',
        [
          'id',
          'name',
          'description',
          'project_brief',
          'problem_statement',
          'rationale_impact',
          'strategic_goal',
          'strategic_goal_id',
          'pillar',
          'pillar_id',
          'service',
          'service_id',
          'subservices',
          'subservices.name',
          'subservices_name',
          'subservice',
          'subservice_name',
          'subservice_id',
          'subservice_code',
          'ms_subservice_icesc_project_suggestions_1_name',
          'ms_subservice_icesc_project_suggestions_1_id',
          'ms_subservice_icesc_project_suggestions_1_code',
          'status_c',
          'date_entered',
          'date_modified',
          'contact_name',
          'contact_email',
          'contact_phone',
          'contact_role',
          'contact_id',
          'budget_icesco',
          'budget_member_state',
          'budget_sponsorship',
          'date_start',
          'date_end',
          'frequency',
          'frequency_duration',
          'project_frequency',
          'beneficiaries',
          'beneficiaries_c',
          'other_beneficiaries',
          'partner1',
          'partner2',
          'partner3',
          'partner4',
          'partner5',
          'institutions',
          'delivery_modality',
          'geographic_scope',
          'convening_method',
          'project_type',
          'convening_method_c',
          'project_type_c',
          'project_type_other',
          'milestones1',
          'milestones2',
          'milestones3',
          'milestones4',
          'milestones5',
          'expected_outputs',
          'kpis1',
          'kpis2',
          'kpis3',
          'kpis4',
          'kpis5',
          'comments',
          'assigned_user_id',
          'assigned_user_name',
          'created_by',
          'created_by_name',
          'modified_user_id',
          'modified_by_name'
        ],
        '', // No specific query
        100, // Max 100 projects
        [] // We'll fetch relationships separately using get_relationships // Include subservice relationship
      );
    } catch (fetchError) {
      console.error('Failed to fetch project entries:', fetchError);
      
      // Check if it's a connection timeout error
      if (fetchError instanceof Error && (
        fetchError.message.includes('ETIMEDOUT') || 
        fetchError.message.includes('timeout') ||
        fetchError.message.includes('ECONNREFUSED') ||
        fetchError.message.includes('ENOTFOUND')
      )) {
        return NextResponse.json({
          success: false,
          error: 'CRM server is currently unavailable. Please try again later.',
          errorType: 'CONNECTION_ERROR',
          projects: [],
          count: 0
        }, { status: 503 }); // Service Unavailable
      }
      
      throw fetchError;
    }
    
    
    // Fetch subservice relationships for each project with retry logic
    const projectsWithSubservices = await Promise.allSettled(
      projectEntries.map(async (entry: any) => {
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt}/${maxRetries} for project ${entry.id}`);
            
            // Fetch subservice relationship for this project with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
            const subserviceResponse = await fetch('http://3.145.21.11/service/v4_1/rest.php', {
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
                  module_id: entry.id,
                  link_field_name: 'ms_subservice_icesc_project_suggestions_1',
                  related_module_query: '',
                  related_fields: ['id', 'name', 'code', 'title'],
                  related_module_link_name_to_fields_array: [],
                  deleted: 0
                }),
              }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            const subserviceData = await subserviceResponse.json();
            console.log(`Subservice data for project ${entry.id} (attempt ${attempt}):`, subserviceData);

            // Extract subservice information
            let subserviceInfo = {
              sub_service: '',
              sub_service_id: '',
              subservice_code: '',
              subservice_name: ''
            };

            if (subserviceData.entry_list && subserviceData.entry_list.length > 0) {
              const subservice = subserviceData.entry_list[0];
              subserviceInfo = {
                sub_service: subservice.name_value_list?.name?.value || subservice.name || subservice.code || subservice.title || '',
                sub_service_id: subservice.name_value_list?.id?.value || subservice.id || '',
                subservice_code: subservice.name_value_list?.code?.value || subservice.code || subservice.name || '',
                subservice_name: subservice.name_value_list?.name?.value || subservice.name || subservice.title || ''
              };
              console.log(`✅ Found subservice for project ${entry.id} (attempt ${attempt}):`, subserviceInfo);
              
              // Success! Return the data
              return {
                ...entry,
                ...subserviceInfo
              };
            } else {
              console.log(`❌ No subservice found for project ${entry.id} (attempt ${attempt}) - entry_list:`, subserviceData.entry_list);
              
              // Try to get subservice data from direct fields as fallback
              const directSubserviceId = entry.ms_subservice_icesc_project_suggestions_1_id;
              const directSubserviceName = entry.ms_subservice_icesc_project_suggestions_1_name;
              
              if (directSubserviceId || directSubserviceName) {
                console.log(`🔄 Using direct fields as fallback for project ${entry.id} (attempt ${attempt}):`, {
                  directSubserviceId,
                  directSubserviceName
                });
                
                subserviceInfo = {
                  sub_service: directSubserviceName || '',
                  sub_service_id: directSubserviceId || '',
                  subservice_code: directSubserviceName || '',
                  subservice_name: directSubserviceName || ''
                };
                
                // Success with fallback! Return the data
                return {
                  ...entry,
                  ...subserviceInfo
                };
              }
            }
            
            // If we get here, no subservice was found, but no error occurred
            // Continue to next attempt if we have retries left
            if (attempt < maxRetries) {
              console.log(`⏳ No subservice found, retrying... (${attempt}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
            
            // All attempts failed, return empty data
            console.log(`❌ All attempts failed for project ${entry.id}, returning empty subservice data`);
            return {
              ...entry,
              sub_service: '',
              sub_service_id: '',
              subservice_code: '',
              subservice_name: ''
            };
            
          } catch (error) {
            lastError = error;
            console.error(`❌ Error fetching subservice for project ${entry.id} (attempt ${attempt}):`, error);
            console.error(`Error details:`, {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error),
              cause: error instanceof Error ? error.cause : undefined
            });
            
            // If this is not the last attempt, wait and retry
            if (attempt < maxRetries) {
              console.log(`⏳ Error occurred, retrying... (${attempt}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
            
            // All attempts failed, return empty data
            console.error(`❌ All attempts failed for project ${entry.id}, returning empty subservice data`);
            return {
              ...entry,
              sub_service: '',
              sub_service_id: '',
              subservice_code: '',
              subservice_name: ''
            };
          }
        }
      })
    );

    // Process the results from Promise.allSettled
    const processedProjects = projectsWithSubservices.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Project ${projectEntries[index].id} failed:`, result.reason);
        return {
          ...projectEntries[index],
          sub_service: '',
          sub_service_id: '',
          subservice_code: '',
          subservice_name: ''
        };
      }
    });

    // Transform the data (subservice data is already fetched above)
    const transformedProjects = processedProjects.map((entry: any) => {
      
      return {
        id: entry.id || '',
        name: entry.name || '',
        description: entry.description || '',
        project_brief: entry.project_brief || '',
        problem_statement: entry.problem_statement || '',
        rationale_impact: entry.rationale_impact || '',
        
        // Strategic information
        strategic_goal: entry.strategic_goal || '',
        strategic_goal_id: entry.strategic_goal_id || '',
        pillar: entry.pillar || '',
        pillar_id: entry.pillar_id || '',
        service: entry.service || '',
        service_id: entry.service_id || '',
        
        // Subservice data from relationship
        sub_service: entry.sub_service || '',
        sub_service_id: entry.sub_service_id || '',
        subservice_code: entry.subservice_code || '',
        subservice_name: entry.subservice_name || '',
        
        // Status and dates
        status: entry.status_c || 'Draft',
        created_at: entry.date_entered || '',
        date_entered: entry.date_entered || '',
        date_modified: entry.date_modified || '',
        
        // Contact information
        contact_name: entry.contact_name || '',
        contact_email: entry.contact_email || '',
        contact_phone: entry.contact_phone || '',
        contact_role: entry.contact_role || '',
        contact_id: entry.contact_id || '',
        
        // Budget
        budget_icesco: parseFloat(entry.budget_icesco) || 0,
        budget_member_state: parseFloat(entry.budget_member_state) || 0,
        budget_sponsorship: parseFloat(entry.budget_sponsorship) || 0,
        
        // Timeline
        start_date: entry.date_start || '',
        end_date: entry.date_end || '',
        frequency: entry.frequency || '',
        frequency_duration: entry.frequency_duration || '',
        project_frequency: entry.project_frequency || '',
        
        // Additional fields
        beneficiaries: (() => {
          // Handle multienum field format (separated by ^,^)
          let beneficiariesValue = entry.beneficiaries || entry.beneficiaries_c || '';
          
          if (typeof beneficiariesValue === 'string') {
            // Split by ^,^ separator and filter out empty values
            return beneficiariesValue.split('^,^').filter(b => b && b.trim() !== '');
          } else if (Array.isArray(beneficiariesValue)) {
            return beneficiariesValue;
          }
          
          return [];
        })(),
        other_beneficiaries: entry.other_beneficiaries || '',
        partners: (() => {
          // Combine individual partner fields into an array
          const partnerFields = [
            entry.partner1,
            entry.partner2,
            entry.partner3,
            entry.partner4,
            entry.partner5
          ];
          return partnerFields.filter(partner => partner && partner.trim() !== '');
        })(),
        institutions: Array.isArray(entry.institutions) ? entry.institutions : [],
        delivery_modality: entry.delivery_modality || '',
        geographic_scope: entry.geographic_scope || '',
        convening_method: entry.convening_method || entry.convening_method_c || '',
        project_type: entry.project_type || entry.project_type_c || '',
        project_type_other: entry.project_type_other || '',
        milestones: (() => {
          // Combine individual milestone fields into an array
          const milestoneFields = [
            entry.milestones1,
            entry.milestones2,
            entry.milestones3,
            entry.milestones4,
            entry.milestones5
          ];
          return milestoneFields.filter(milestone => milestone && milestone.trim() !== '');
        })(),
        expected_outputs: entry.expected_outputs || '',
        kpis: (() => {
          // Combine individual KPI fields into an array
          const kpiFields = [
            entry.kpis1,
            entry.kpis2,
            entry.kpis3,
            entry.kpis4,
            entry.kpis5
          ];
          return kpiFields.filter(kpi => kpi && kpi.trim() !== '');
        })(),
        comments: entry.comments || '',
        
        // CRM specific fields
        assigned_user_id: entry.assigned_user_id || '',
        assigned_user_name: entry.assigned_user_name || '',
        created_by: entry.created_by || '',
        created_by_name: entry.created_by_name || '',
        modified_user_id: entry.modified_user_id || '',
        modified_by_name: entry.modified_by_name || '',
      };
    });
    
    
    const result = {
      success: true,
      projects: transformedProjects,
      count: transformedProjects.length
    };
    
    console.log('=== CRM PROJECTS API RESULT ===');
    console.log('Success:', result.success);
    console.log('Count:', result.count);
    console.log('Projects sample:', result.projects.slice(0, 2).map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      sub_service: p.sub_service,
      sub_service_id: p.sub_service_id,
      subservices: p.sub_service || [],
      subservice: p.sub_service || '',
      subservice_code: p.sub_service || '',
      subservice_id: p.sub_service_id || ''
    })));
    
    // Log raw CRM data to see what fields actually exist
    console.log('=== RAW CRM DATA SAMPLE ===');
    if (projectEntries.length > 0) {
      const rawEntry = projectEntries[0];
      console.log('Raw entry keys:', Object.keys(rawEntry));
      console.log('Full raw entry structure:', JSON.stringify(rawEntry, null, 2));
      console.log('Raw entry link_list:', rawEntry.link_list);
      
      // Debug beneficiaries field specifically
      console.log('=== BENEFICIARIES FIELD DEBUG ===');
      console.log('beneficiaries field:', rawEntry.beneficiaries);
      console.log('beneficiaries type:', typeof rawEntry.beneficiaries);
      console.log('beneficiaries_c field:', rawEntry.beneficiaries_c);
      console.log('beneficiaries_c type:', typeof rawEntry.beneficiaries_c);
      console.log('================================');
      
      if (rawEntry.link_list) {
        console.log('Available link_list keys:', Object.keys(rawEntry.link_list));
        
        // Check for the specific subservice relationship
        if (rawEntry.link_list.ms_subservice_icesc_project_suggestions_1) {
          console.log('Subservice relationship data found:', rawEntry.link_list.ms_subservice_icesc_project_suggestions_1);
          console.log('Subservice relationship type:', typeof rawEntry.link_list.ms_subservice_icesc_project_suggestions_1);
          console.log('Subservice relationship length:', Array.isArray(rawEntry.link_list.ms_subservice_icesc_project_suggestions_1) ? rawEntry.link_list.ms_subservice_icesc_project_suggestions_1.length : 'not an array');
        } else {
          console.log('No ms_subservice_icesc_project_suggestions_1 relationship found');
        }
        
        // Check for other possible subservice relationships
        Object.keys(rawEntry.link_list).forEach(key => {
          console.log(`All relationship keys: ${key}`, rawEntry.link_list[key]);
          if (key.toLowerCase().includes('subservice') || key.toLowerCase().includes('service')) {
            console.log(`Found potential subservice relationship: ${key}`, rawEntry.link_list[key]);
          }
        });
      } else {
        console.log('No link_list found in raw entry');
      }
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in CRM projects API route:', error);
    
    // Determine error type and appropriate response
    let errorMessage = 'Failed to fetch projects';
    let statusCode = 500;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || 
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND')) {
        errorMessage = 'CRM server is currently unavailable. Please try again later.';
        statusCode = 503;
        errorType = 'CONNECTION_ERROR';
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'Authentication with CRM failed. Please contact support.';
        statusCode = 401;
        errorType = 'AUTH_ERROR';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType: errorType,
      projects: [],
      count: 0
    }, { status: statusCode });
  }
}


