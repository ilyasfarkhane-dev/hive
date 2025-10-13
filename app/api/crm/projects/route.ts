import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries, getContactProjects } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');
    const projectId = searchParams.get('project_id');
    
    // Get fresh session ID from CRM instead of using localStorage
    console.log('🔐 Getting fresh session ID from CRM...');
    const sessionId = await getSessionId();
   
    if (!sessionId) {
      console.log('❌ Failed to get session ID from CRM');
      return NextResponse.json({
        success: false,
        error: 'Failed to authenticate with CRM',
        errorType: 'AUTH_ERROR',
        projects: [],
        count: 0
      }, { status: 401 });
    }
    
    // Validate contact ID is provided
    if (!contactId && !projectId) {
      console.log('❌ No contact ID or project ID provided');
        return NextResponse.json({
          success: false,
        error: 'Contact ID or Project ID is required',
        errorType: 'MISSING_PARAMETERS',
          projects: [],
        count: 0
      }, { status: 400 });
    }
    
    // Fetch projects using appropriate method based on parameters
    let projectEntries: any[] = [];
    try {
      
      // If project ID is provided, fetch single project using get_entry
      if (projectId) {
    
        
        const response = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
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
              id: projectId,
              select_fields: [
                'id',
                'name',
                'description',
                'project_brief',
                'problem_statement',
                'problem_statement1_c',
                'rationale_impact',
                'status_c',
                'date_entered',
                'date_modified',
                'beneficiaries',
                'beneficiaries_c',
                'otherbeneficiary',
                'documents_icesc_project_suggestions_1_name',
                'document_c',
                'date_start',
                'date_end',
                'project_frequency',
                'currency_id',
                'frequency_duration',
                'partner1',
                'partner2',
                'partner3',
                'partner4',
                'partner5',
                'delivery_modality',
                'project_type',
                'geographic_scope',
                'convening_method',
                'convening_method_other',
                'expected_outputs',
                'milestones1',
                'milestones2',
                'milestones3',
                'milestones4',
                'milestones5',
                'kpis1',
                'kpis2',
                'kpis3',
                'kpis4',
                'kpis5',
                'comments',
                'budget_icesco',
                'budget_member_state',
                'budget_sponsorship',
                'contact_name',
                'contact_email',
                'contact_phone',
                'contact_role',
                'strategic_goal',
                'strategic_goal_id',
                'pillar',
                'pillar_id',
                'service',
                'service_id',
                'ms_subservice_icesc_project_suggestions_1_name',
                'ms_subservice_icesc_project_suggestions_1_id',
                'ms_subservice_icesc_project_suggestions_1_code'
              ],
              link_name_to_fields_array: [
                {
                  name: 'contacts_icesc_project_suggestions_1',
                  value: ['id', 'name', 'first_name', 'last_name', 'email', 'email1', 'phone_mobile', 'phone_work', 'title']
                },
                {
                  name: 'ms_subservice_icesc_project_suggestions_1',
                  value: ['id', 'name', 'code', 'title']
                }
              ]
            }),
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`CRM API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // get_entry returns a single object, not an array
        if (data.id) {
          projectEntries = [data]; // Wrap in array for consistent processing
        } else if (data.entry_list) {
          projectEntries = data.entry_list;
        } else {
          projectEntries = [];
        }
      }
      // Otherwise, fetch projects by contact ID using get_relationships
      else if (contactId) {
        
        const response = await fetch('https://crm.icesco.org/service/v4_1/rest.php', {
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
              module_name: 'Contacts',
              module_id: contactId,
              link_field_name: 'contacts_icesc_project_suggestions_1',
              related_module_query: '',
              related_fields: [
          'id',
          'name',
          'description',
          'project_brief',
          'problem_statement',
          'problem_statement1_c',
          'rationale_impact',
          'status_c',
          'date_entered',
          'date_modified',
              'beneficiaries',
              'beneficiaries_c',
              'otherbeneficiary',
              'documents_icesc_project_suggestions_1_name',
              'document_c',
          'date_start',
          'date_end',
              'project_frequency',
              'currency_id',
          'frequency_duration',
          'partner1',
          'partner2',
          'partner3',
          'partner4',
          'partner5',
          'delivery_modality',
              'project_type',
          'geographic_scope',
              'convening_method',
              'convening_method_other',
              'expected_outputs',
          'milestones1',
          'milestones2',
          'milestones3',
          'milestones4',
          'milestones5',
          'kpis1',
          'kpis2',
          'kpis3',
          'kpis4',
          'kpis5',
          'comments',
              'budget_icesco',
              'budget_member_state',
              'budget_sponsorship',
              'contact_name',
              'contact_email',
              'contact_phone',
              'contact_role',
              'strategic_goal',
              'strategic_goal_id',
              'pillar',
              'pillar_id',
              'service',
              'service_id',
              'ms_subservice_icesc_project_suggestions_1_name',
              'ms_subservice_icesc_project_suggestions_1_id',
              'ms_subservice_icesc_project_suggestions_1_code'
            ],
            related_module_link_name_to_fields_array: [
              {
                name: 'ms_subservice_icesc_project_suggestions_1',
                value: ['id', 'name', 'code', 'title']
              }
            ],
            deleted: 0,
            limit: 100
          }),
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`CRM API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we got data
        if (!data.entry_list || data.entry_list.length === 0) {
          return NextResponse.json({
            success: true,
            count: 0,
            contact_id: contactId,
            projects: [],
            message: 'No projects found for this contact'
          });
        }
        
        projectEntries = data.entry_list || [];
      }
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
    
    // Helper function to extract value from name_value_list format
    const getValue = (entry: any, fieldName: string): any => {
      if (entry.name_value_list && entry.name_value_list[fieldName]) {
        const field = entry.name_value_list[fieldName];
        // If it has a value property, return that
        if (field.value !== undefined) {
          return field.value;
        }
        // If it's an object with name and value, return the value
        if (field.name && field.value !== undefined) {
          return field.value;
        }
        // Otherwise return the field itself (might be a primitive)
        if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
          return field;
        }
        // If it's still an object, return empty string to avoid rendering errors
        return '';
      }
      return entry[fieldName] || '';
    };
    
    // Process projects and extract subservice data
    const processedProjects = projectEntries.map((entry: any) => {
            let subserviceInfo = {
              sub_service: '',
              sub_service_id: '',
              subservice_code: '',
              subservice_name: ''
            };

      // Extract contact data from link_list
      let contactInfo = {
        contact_id: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_role: ''
      };

      // Log the full entry structure for debugging
    
      
      if (entry.link_list && entry.link_list.ms_subservice_icesc_project_suggestions_1) {
        const subserviceData = entry.link_list.ms_subservice_icesc_project_suggestions_1;
       
        if (subserviceData.length > 0) {
          const subservice = subserviceData[0];
        
          
          // The relationship data comes as an array of objects with link_value
          // Structure: [{ link_value: { id: {...}, name: {...}, code: {...} } }]
          
          const extractValue = (field: any): string => {
            if (!field) return '';
            if (typeof field === 'string') return field;
            // Check for link_value structure
            if (field.link_value) {
              if (typeof field.link_value === 'string') return field.link_value;
              if (field.link_value.value) return field.link_value.value;
            }
            if (field.value) return field.value;
            if (field.name && field.value !== undefined) return field.value;
            return '';
          };
          
          // Check if it's in link_value format
          const linkValue = subservice.link_value || subservice;
          
          const subId = extractValue(linkValue.id) || (linkValue.id?.value) || '';
          const subName = extractValue(linkValue.name) || (linkValue.name?.value) || extractValue(linkValue.title) || (linkValue.title?.value) || '';
          const subCode = extractValue(linkValue.code) || (linkValue.code?.value) || '';
          
          subserviceInfo = {
            sub_service: subName || subCode || '',
            sub_service_id: subId || '',
            subservice_code: subCode || subName || '',
            subservice_name: subName || subCode || ''
          };
          
        } else {
          console.log(`  ⚠️ Empty subservice array in link_list`);
        }
      } else {
        console.log(`  ⚠️ No link_list, using direct fields`);
        
        // Get from direct fields - these contain the subservice code (like "1.1.3.1")
        const directCode = getValue(entry, 'ms_subservice_icesc_project_suggestions_1_name');
        const directId = getValue(entry, 'ms_subservice_icesc_project_suggestions_1_id');
        const directCodeValue = getValue(entry, 'ms_subservice_icesc_project_suggestions_1_code');
        
      
        // Check if we have a valid code (format: X.X.X.X)
        const codeValue = (directCodeValue && directCodeValue.trim()) || (directCode && directCode.trim());
        
        if (codeValue && /^\d+\.\d+\.\d+\.\d+$/.test(codeValue)) {
          // We have a valid subservice code!
          subserviceInfo = {
            sub_service: codeValue,  // Use the code as the name (will be looked up by hierarchy)
            sub_service_id: directId || codeValue, // Use ID if available, otherwise use code
            subservice_code: codeValue,
            subservice_name: codeValue
          };
        } else if (codeValue) {
          // We have some value but it's not in the expected format
          subserviceInfo = {
            sub_service: codeValue,
            sub_service_id: directId || '',
            subservice_code: codeValue,
            subservice_name: codeValue
          };
          console.log(`  ⚠️ Subservice value found but format unexpected:`, codeValue);
        } else {
          console.log(`  ❌ No subservice data found`);
        }
      }
      
      // Extract contact information from link_list
      console.log(`  👤 Checking for contact relationship...`);
        if (entry.link_list && entry.link_list.contacts_icesc_project_suggestions_1) {
          const contactData = entry.link_list.contacts_icesc_project_suggestions_1;
        console.log(`  👤 Contact relationship found! Count:`, contactData.length);
        
        if (contactData.length > 0) {
          const contact = contactData[0];
          console.log(`  👤 First contact:`, contact);
          
          const extractContactValue = (field: any): string => {
            if (!field) return '';
            if (typeof field === 'string') return field;
            if (field.link_value) {
              if (typeof field.link_value === 'string') return field.link_value;
              if (field.link_value.value) return String(field.link_value.value);
            }
            if (field.value !== undefined) return String(field.value);
            if (field.name && field.value !== undefined) return String(field.value);
            return '';
          };
          
          const linkValue = contact.link_value || contact;
          
          // Extract each field carefully and ensure they're strings
          const contactId = extractContactValue(linkValue.id);
          const contactName = extractContactValue(linkValue.name) || extractContactValue(linkValue.first_name);
          const contactEmail = extractContactValue(linkValue.email) || extractContactValue(linkValue.email1);
          const contactPhone = extractContactValue(linkValue.phone_mobile) || extractContactValue(linkValue.phone_work);
          const contactRole = extractContactValue(linkValue.title);
          
          contactInfo = {
            contact_id: contactId || '',
            contact_name: contactName || '',
            contact_email: contactEmail || '',
            contact_phone: contactPhone || '',
            contact_role: contactRole || ''
          };
          
          console.log(`  ✅ Extracted contact info:`, contactInfo);
        }
      } else {
        console.log(`  ⚠️ No contact link_list, using direct fields`);
        
        // Fallback to direct contact fields if available
        // Ensure all values are strings
        contactInfo = {
          contact_id: String(getValue(entry, 'contact_id') || ''),
          contact_name: String(getValue(entry, 'contact_name') || ''),
          contact_email: String(getValue(entry, 'contact_email') || ''),
          contact_phone: String(getValue(entry, 'contact_phone') || ''),
          contact_role: String(getValue(entry, 'contact_role') || '')
        };
      }
      
      // Flatten the name_value_list structure for easier access
      const flattenedEntry: any = { id: entry.id };
      
      if (entry.name_value_list) {
        Object.keys(entry.name_value_list).forEach(key => {
          const field = entry.name_value_list[key];
          // Ensure we extract the actual value, not an object
          if (field && typeof field === 'object' && field.value !== undefined) {
            flattenedEntry[key] = field.value;
          } else if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
            flattenedEntry[key] = field;
          } else {
            // If it's still an object or null/undefined, set to empty string
            flattenedEntry[key] = field || '';
          }
        });
      }
      
      // Preserve link_list
      if (entry.link_list) {
        flattenedEntry.link_list = entry.link_list;
      }
      
      return {
        ...flattenedEntry,
        ...subserviceInfo,
        ...contactInfo
      };
    });
    

    // No filtering needed - get_relationships already returned only this contact's projects
    const filteredProjects = processedProjects;

    // Transform the data (subservice data is already fetched above)
    const transformedProjects = filteredProjects.map((entry: any) => {
      
      return {
        id: entry.id || '',
        name: entry.name || '',
        description: entry.description || '',
        project_brief: entry.project_brief || '',
        problem_statement1_c: entry.problem_statement1_c || '',
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
        
        // Contact information - since we used get_relationships, the contact_id is the one we queried with
        contact_id: contactId || entry.created_by || '',
        
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
          const paths = documentPaths.split('; ').filter((path: string) => path.trim());
          const names = documentNames.split('; ').filter((name: string) => name.trim());
          
          // Create file objects from the paths and names
          return paths.map((path: string, index: number) => {
            const name = names[index] || `Document ${index + 1}`;
            // Extract filename from path for display
            const fileName = path.split('\\').pop() || path.split('/').pop() || name;
            
            // Check if the path is already a full Azure URL with SAS token
            const isAzureUrl = path.includes('blob.core.windows.net') && path.includes('sv=');
            
            return {
              name: fileName,
              fileName: fileName,
              filePath: path,
              downloadURL: isAzureUrl ? path : '', // Use the path as downloadURL if it's already a full Azure URL
              url: isAzureUrl ? path : '', // Also set url field for compatibility
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


