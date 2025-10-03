import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries, getContactProjects } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CRM PROJECTS API CALLED ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('CRM Admin User:', process.env.CRM_ADMIN_USER || 'NOT_SET');
    console.log('CRM Admin Pass:', process.env.CRM_ADMIN_PASS ? 'SET' : 'NOT_SET');
    console.log('CRM Base URL:', process.env.CRM_BASE_URL || 'NOT_SET');
    console.log('Request URL:', request.url);
    console.log('Cache-Busting Params:', request.nextUrl.searchParams.toString());
    
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');
    const projectId = searchParams.get('project_id');
    console.log('Contact ID from query params:', contactId);
    console.log('Project ID from query params:', projectId);
    
    // Get session ID with timeout and retry logic
    let sessionId: string;
    try {
      console.log('Attempting to get session ID...');
      sessionId = await getSessionId();
      console.log('Session ID obtained successfully:', sessionId ? 'YES' : 'NO');
    } catch (sessionError) {
      console.error('Failed to get session ID:', sessionError);
      console.error('Session error details:', {
        message: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        stack: sessionError instanceof Error ? sessionError.stack : 'No stack trace'
      });
      
      // Check if it's a connection timeout error
      if (sessionError instanceof Error && (
        sessionError.message.includes('ETIMEDOUT') || 
        sessionError.message.includes('timeout') ||
        sessionError.message.includes('ECONNREFUSED') ||
        sessionError.message.includes('ENOTFOUND')
      )) {
        console.log('Returning connection error response');
        return NextResponse.json({
          success: false,
          error: 'CRM server is currently unavailable. Please try again later.',
          errorType: 'CONNECTION_ERROR',
          projects: [],
          count: 0,
          debug: {
            environment: process.env.NODE_ENV,
            crmUserSet: !!process.env.CRM_ADMIN_USER,
            crmPassSet: !!process.env.CRM_ADMIN_PASS,
            crmBaseUrlSet: !!process.env.CRM_BASE_URL
          }
        }, { status: 503 }); // Service Unavailable
      }
      
      throw sessionError;
    }
    
    // Fetch projects from CRM with timeout handling
    let projectEntries: any[];
    try {
      console.log('Fetching projects from CRM...');
      console.log('Session ID length:', sessionId?.length);
      console.log('Module: icesc_project_suggestions');
      
      // Fallback to the working approach: fetch all projects and filter by contact
      // The get_relationships method is causing connection timeouts
      console.log('CRM get_relationships method is causing timeouts, falling back to get_entries + filtering');
      console.log('Contact ID for filtering:', contactId);
      
      if (!contactId && !projectId) {
        console.log('No contact ID or project ID provided, returning empty array for security');
        return NextResponse.json({
          success: true,
          count: 0,
          contact_id: null,
          project_id: null,
          projects: [],
          message: 'No contact ID or project ID provided'
        });
      }
      
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
          'budget_icesco',
          'budget_member_state',
          'budget_sponsorship',
          'date_start',
          'date_end',
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
          'delivery_modality',
          'geographic_scope',
          'project_type',
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
          'document_c',
          'documents_icesc_project_suggestions_1_name',
          'assigned_user_id',
          'assigned_user_name',
          'created_by',
          'created_by_name',
          'modified_user_id',
          'modified_by_name'
        ],
        '', // No query filter
        100, // Max 100 projects
        [
          {
            name: 'contacts_icesc_project_suggestions_1',
            value: ['id', 'name', 'email', 'phone']
          }
        ] // Include contact relationship data
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
    
    console.log('Projects fetched successfully from CRM:', projectEntries.length);
    console.log('Sample project:', projectEntries[0] ? {
      id: projectEntries[0].id,
      name: projectEntries[0].name,
      status: projectEntries[0].status
    } : 'No projects found');
    
        // LOG ALL PROJECTS WITH ALL RELATIONSHIP DATA
        console.log('=== COMPREHENSIVE PROJECT DATA LOG ===');
        projectEntries.forEach((entry: any, index: number) => {
          console.log(`\n--- PROJECT ${index + 1}: ${entry.id} ---`);
          console.log('Project Name:', entry.name);
          console.log('Project Status:', entry.status_c);
          console.log('Created By:', entry.created_by);
          console.log('Created By Name:', entry.created_by_name);
          
          // Log relationship data instead of form fields
          console.log('--- RELATIONSHIP DATA ---');
          if (entry.link_list && entry.link_list.contacts_icesc_project_suggestions_1) {
            entry.link_list.contacts_icesc_project_suggestions_1.forEach((contact: any, contactIndex: number) => {
              console.log(`  Contact ${contactIndex + 1}:`);
              console.log(`    ID: ${contact.id?.value || contact.id}`);
              console.log(`    Name: ${contact.name?.value || contact.name}`);
              console.log(`    Email: ${contact.email?.value || contact.email}`);
            });
          } else {
            console.log('  No relationship data found');
          }
      
      // Log all available fields
      console.log('All Project Fields:');
      Object.keys(entry).forEach(key => {
        if (key !== 'name_value_list' && key !== 'link_list') {
          console.log(`  ${key}:`, entry[key]);
        }
      });
      
      // Log name_value_list if it exists
      if (entry.name_value_list) {
        console.log('Name Value List:');
        Object.values(entry.name_value_list).forEach((field: any) => {
          console.log(`  ${field.name}:`, field.value);
        });
      }
      
      // Log link_list if it exists
      if (entry.link_list) {
        console.log('Link List:');
        Object.keys(entry.link_list).forEach(linkName => {
          console.log(`  ${linkName}:`, entry.link_list[linkName]);
        });
      } else {
        console.log('No link_list found for this project');
      }
    });
    
    // LOG RELATIONSHIP DATA
    console.log('\n=== RELATIONSHIP DATA LOG ===');
    if (projectEntries.length > 0 && projectEntries[0].link_list && projectEntries[0].link_list.contacts_icesc_project_suggestions_1) {
      const contactData = projectEntries[0].link_list.contacts_icesc_project_suggestions_1;
      console.log('Relationship Data Found:');
      contactData.forEach((contact: any, index: number) => {
        console.log(`  Contact ${index + 1}:`);
        console.log(`    ID: ${contact.id}`);
        console.log(`    Name: ${contact.name?.value || contact.name}`);
        console.log(`    Email: ${contact.email?.value || contact.email}`);
        console.log(`    Phone: ${contact.phone?.value || contact.phone}`);
      });
    } else {
      console.log('No relationship data found in projects');
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
          
            const subserviceResponse = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
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

    // Filter projects by contact ID or fetch specific project
    let filteredProjects = processedProjects;
    console.log('🔍 Debug - contactId:', contactId, 'projectId:', projectId);
    
    if (contactId) {
      console.log(`Filtering ${processedProjects.length} projects by contact ID: ${contactId}`);
      
      // Filter projects based on the contact ID in relationships
      filteredProjects = processedProjects.filter((entry: any) => {
        console.log(`\n--- CHECKING PROJECT: ${entry.id} ---`);
        console.log(`Project Name: "${entry.name}"`);
        console.log(`Created By: "${entry.created_by}"`);
        console.log(`Contact Name: "${entry.contacts_icesc_project_suggestions_1_name}"`);
        
        // Check if the project was created by the contact
        if (entry.created_by === contactId) {
          console.log(`✅ CREATED BY MATCH: Project ${entry.id} was created by contact ${contactId}`);
          return true;
        }
        
        // Check if the contact ID appears in the relationship data
        if (entry.link_list && entry.link_list.contacts_icesc_project_suggestions_1) {
          const contactData = entry.link_list.contacts_icesc_project_suggestions_1;
          for (const contact of contactData) {
            const contactIdFromRel = contact.id?.value || contact.id;
            const contactName = contact.name?.value || contact.name;
            
            console.log(`  - Checking relationship contact: ${contactName} (ID: ${contactIdFromRel})`);
            
            if (contactIdFromRel === contactId) {
              console.log(`✅ RELATIONSHIP MATCH: Project ${entry.id} has relationship with contact ${contactId}`);
              return true;
            }
          }
        }
        
        console.log(`❌ NO MATCH: Project ${entry.id} does not belong to contact ${contactId}`);
        return false;
      });
      
      console.log(`Filtered to ${filteredProjects.length} projects for contact ${contactId}`);
      
      // If no projects found, return empty array (security: don't show other users' projects)
      if (filteredProjects.length === 0) {
        console.log('⚠️ No projects found for contact ID, returning empty array for security');
        return NextResponse.json({
          success: true,
          count: 0,
          contact_id: contactId,
          projects: [],
          message: 'No projects found for this contact'
        });
      }
    } else if (projectId) {
      // If project ID provided, fetch specific project
      console.log(`🔍 Fetching specific project: ${projectId}`);
      console.log(`📊 Available projects: ${processedProjects.length}`);
      console.log(`📋 Project IDs: ${processedProjects.map(p => p.id).join(', ')}`);
      
      // Find the specific project by ID
      const specificProject = processedProjects.find((p: any) => p.id === projectId);
      if (specificProject) {
        filteredProjects = [specificProject];
        console.log(`✅ Found specific project: ${specificProject.name}`);
      } else {
        console.log(`❌ Project ${projectId} not found in ${processedProjects.length} available projects`);
        filteredProjects = [];
      }
    } else {
      console.log('No contact ID or project ID provided, returning empty array for security');
      console.log('Debug - contactId:', contactId, 'projectId:', projectId);
      filteredProjects = [];
    }

    // Transform the data (subservice data is already fetched above)
    const transformedProjects = filteredProjects.map((entry: any) => {
      
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
        
        // Contact information - include both form fields and relationship data
        contact_id: (() => {
          // Check for contact relationship data in link_list first
          if (entry.link_list && entry.link_list.contacts_icesc_project_suggestions_1) {
            const contactData = entry.link_list.contacts_icesc_project_suggestions_1;
            if (contactData.length > 0) {
              const contactRecord = contactData[0];
              // The contact data structure has id as { name: 'id', value: 'actual-id' }
              if (contactRecord.id && contactRecord.id.value) {
                return contactRecord.id.value;
              } else if (contactRecord.id) {
                return contactRecord.id;
              }
            }
          }
          
          // Fallback to other contact fields
          const hasValidContactRelationship = entry.contacts_icesc_project_suggestions_1 && 
                                            entry.contacts_icesc_project_suggestions_1.trim() !== '';
          return hasValidContactRelationship ? 
                 entry.contacts_icesc_project_suggestions_1 : 
                 entry.created_by || '';
        })(),
        
        // Contact form fields for display
        contact_name: entry.contact_name || '',
        contact_email: entry.contact_email || '',
        contact_phone: entry.contact_phone || '',
        contact_role: entry.contact_role || '',
        
        // Account information
        account_id: entry.accounts_icesc_project_suggestions_1 || '',
        account_name: entry.accounts_icesc_project_suggestions_1_name || '',
        
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
        
        // Document fields
        document_c: entry.document_c || '',
        documents_icesc_project_suggestions_1_name: entry.documents_icesc_project_suggestions_1_name || '',
        
        // Parse files from document fields if they exist
        files: (() => {
          const documentPaths = entry.document_c || '';
          const documentNames = entry.documents_icesc_project_suggestions_1_name || '';
          
          if (!documentPaths || !documentNames) {
            return [];
          }
          
          // Split the semicolon-separated values
          const paths = documentPaths.split('; ').filter(path => path.trim());
          const names = documentNames.split('; ').filter(name => name.trim());
          
          // Create file objects from the paths and names
          return paths.map((path, index) => {
            const name = names[index] || `Document ${index + 1}`;
            // Extract filename from path for display
            const fileName = path.split('\\').pop() || path.split('/').pop() || name;
            
            return {
              name: fileName,
              fileName: fileName,
              filePath: path,
              size: 0, // Size not available from CRM
              type: 'application/octet-stream' // Default type
            };
          });
        })(),
        
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
      count: transformedProjects.length,
      message: contactId ? `Found ${transformedProjects.length} projects for contact ${contactId}` : 'No contact ID provided',
      contact_id: contactId,
      export_info: {
        export_date: new Date().toISOString(),
        total_projects: transformedProjects.length,
        includes_relationships: true,
        includes_subservices: true,
        filtered_by_contact: !!contactId
      }
    };
    
    console.log('=== CRM PROJECTS API RESULT ===');
    console.log('Success:', result.success);
    console.log('Count:', result.count);
    console.log('Contact ID used for filtering:', contactId);
    console.log('Projects sample:', result.projects.slice(0, 2).map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      contact_id: p.contact_id,
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
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      }
    });
    
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


