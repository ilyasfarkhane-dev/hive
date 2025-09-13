import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Get Contact Projects ===');
    
    const { contactId } = await request.json();
    console.log('Contact ID:', contactId);
    
    if (!contactId) {
      return NextResponse.json({
        success: false,
        error: 'Contact ID is required'
      }, { status: 400 });
    }
    
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Use get_relationships to get projects for the specific contact
    console.log('=== STEP 1: Getting Projects via Contact Relationship ===');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    try {
      // First, get the contact's related projects using the relationship
      const relationshipsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
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
            related_fields: [], // Get all fields
            related_module_link_name_to_fields_array: [],
            deleted: 0,
            max_results: 100
          }),
        }),
      });
      
      clearTimeout(timeoutId);
      
      if (!relationshipsResponse.ok) {
        throw new Error(`CRM Relationships API responded with status: ${relationshipsResponse.status}`);
      }
      
      const relationshipsText = await relationshipsResponse.text();
      console.log('=== RAW CRM RELATIONSHIPS RESPONSE ===');
      console.log('Response status:', relationshipsResponse.status);
      console.log('Response headers:', Object.fromEntries(relationshipsResponse.headers.entries()));
      console.log('Raw response text:', relationshipsText.substring(0, 500), '...');
      
      let relationshipsResult;
      try {
        relationshipsResult = JSON.parse(relationshipsText);
        console.log('=== PARSED RELATIONSHIPS RESULT ===');
        console.log('Contact ID:', contactId);
        console.log('Relationship field used: contacts_icesc_project_suggestions_1');
        console.log('Relationships result:', relationshipsResult);
        console.log('Number of related projects found:', relationshipsResult.entry_list?.length || 0);
      } catch (parseError) {
        console.error('Failed to parse relationships response as JSON:', parseError);
        console.error('This likely means the CRM returned an error page instead of JSON');
        
        // Fallback to the old approach - get all projects and filter
        console.log('=== FALLBACK: Using old filtering approach ===');
        return await getProjectsWithOldFiltering(contactId, sessionId);
      }
      
      if (!relationshipsResult.entry_list || relationshipsResult.entry_list.length === 0) {
        console.log('No projects found for this contact via relationship');
        return NextResponse.json({
          success: true,
          projects: [],
          total: 0,
          contactId: contactId,
          message: `No projects found for contact ${contactId}`
        });
      }
      
      // Now get detailed information for each project
      console.log('=== STEP 2: Getting Detailed Project Information ===');
      const projectIds = relationshipsResult.entry_list.map((entry: any) => entry.id);
      console.log('Project IDs to fetch details for:', projectIds);
      
      // Get full project details for each ID with explicit field selection
      const projectsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          method: 'get_entry_list',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({
            session: sessionId,
            module_name: 'icesc_project_suggestions',
            query: `icesc_project_suggestions.id IN ('${projectIds.join("','")}')`,
            select_fields: [
              'id', 'name', 'description', 'problem_statement',
              'beneficiaries', 'beneficiaries_c', 'target_beneficiaries',
              'partners', 'partners_c', 'collaborating_partners',
              'partner1', 'partner2', 'partner3', 'partner4', 'partner5',
              'delivery_modality', 'delivery_method', 'modality',
              'geographic_scope', 'geographic_coverage', 'scope',
              'project_type', 'convening_method', 'category',
              'budget_icesco', 'budget_icesco_c', 'icesco_budget',
              'budget_member_state', 'budget_member_c', 'member_budget',
              'budget_sponsorship', 'budget_sponsor_c', 'sponsor_budget',
              'frequency', 'project_frequency', 'frequency_c',
              'date_start', 'start_date', 'project_start',
              'date_end', 'end_date', 'project_end',
              'expected_outputs', 'outputs', 'deliverables',
              'milestones', 'milestones_c', 'milestones_list',
              'milestones1', 'milestones2', 'milestones3', 'milestones4', 'milestones5',
              'kpis', 'kpis_c', 'key_performance_indicators',
              'kpis1', 'kpis2', 'kpis3', 'kpis4', 'kpis5',
              'contact_name', 'contact_person', 'primary_contact',
              'contact_email', 'email', 'primary_email',
              'contact_phone', 'phone', 'primary_phone',
              'contact_role', 'position', 'role_c',
              'comments', 'notes', 'remarks',
              'date_entered', 'date_modified', 'status',
              'created_by', 'created_by_name', 'modified_by_name'
            ],
            max_results: 100
          }),
        }),
      });
      
      clearTimeout(timeoutId);
      
      if (!projectsResponse.ok) {
        throw new Error(`CRM API responded with status: ${projectsResponse.status}`);
      }
      
      const projectsResult = await projectsResponse.json();
      console.log('=== CRM QUERY RESULT ===');
      console.log('Module queried: icesc_project_suggestions');
      console.log('Projects result:', projectsResult);
      console.log('Number of projects found:', projectsResult.entry_list?.length || 0);
      
      if (projectsResult.entry_list && projectsResult.entry_list.length > 0) {
        console.log('First project sample:', {
          id: projectsResult.entry_list[0].name_value_list?.id?.value,
          name: projectsResult.entry_list[0].name_value_list?.name?.value,
          allFields: Object.keys(projectsResult.entry_list[0].name_value_list || {})
        });
        
        // Debug: Show all field values for the first project
        const firstProject = projectsResult.entry_list[0].name_value_list;
        console.log('=== FIRST PROJECT FIELD VALUES ===');
        Object.keys(firstProject).forEach(field => {
          const value = firstProject[field]?.value;
          if (value && value !== '' && value !== '0') {
            console.log(`${field}: ${value}`);
          }
        });
      }
      
      if (!projectsResult.entry_list) {
      return NextResponse.json({
        success: true,
        projects: [],
        message: 'No projects found'
      });
    }
    
    // Process projects - no filtering needed since we got them via relationship
    console.log('=== STEP 3: Processing Projects (Already Filtered by Relationship) ===');
    const contactProjects = [];
    
    for (const project of projectsResult.entry_list) {
      const projectData = project.name_value_list;
      
      console.log(`Processing project ${projectData.id?.value} - already belongs to contact ${contactId}`);
      
      // Get contact information from relationship fields
      let projectContactName = undefined;
      const possibleContactNameFields = [
        'contacts_icesc_project_suggestions_1_name',
        'contacts_icesc_project_suggestions_1name',
        'contact_name',
        'contact_name_c'
      ];
      
      for (const field of possibleContactNameFields) {
        if (projectData[field]?.value) {
          projectContactName = projectData[field].value;
          break;
        }
      }
      const accountName = projectData.accounts_icesc_project_suggestions_1_name?.value;
      const accountId = projectData.accounts_icesc_project_suggestions_1accounts_ida?.value;
      
      // Get subservice information from relationships
      let subserviceName = '';
      let subserviceId = '';
      
      console.log(`=== GETTING SUBSERVICE FOR PROJECT ${projectData.id?.value} ===`);
      console.log('Available project fields:', Object.keys(projectData));
      
      // First, check if we have the subservice relationship ID field
      const subserviceIdFields = [
        'ms_subservice_icesc_project_suggestions_1ms_subservice_ida',
        'ms_subservice_icesc_project_suggestions_1_ida',
        'ms_subservice_icesc_project_suggestions_1subservices_ida',
        'subservice_id_c',
        'subservice_id'
      ];
      
      let subserviceIdFromField = undefined;
      for (const field of subserviceIdFields) {
        if (projectData[field]?.value) {
          subserviceIdFromField = projectData[field].value;
          console.log(`Found subservice ID in field ${field}: ${subserviceIdFromField}`);
          break;
        }
      }
      
      if (subserviceIdFromField) {
        subserviceId = subserviceIdFromField;
        console.log(`Using subservice ID from field: ${subserviceId}`);
      }
      
      // Also try get_relationships approach with multiple possible field names
      const possibleLinkFieldNames = [
        'ms_subservice_icesc_project_suggestions_1',
        'ms_subservice_icesc_project_suggestions_1subservices',
        'subservices_icesc_project_suggestions_1',
        'ms_subservice_icesc_project_suggestions_1subservices_ida'
      ];
      
      for (const linkFieldName of possibleLinkFieldNames) {
        try {
          console.log(`Trying relationship field: ${linkFieldName}`);
          const relationshipsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              method: 'get_relationships',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify({
                session: sessionId,
                module_name: 'icesc_project_suggestions',
                module_id: projectData.id?.value,
                link_field_name: linkFieldName,
                related_module_query: '',
                related_fields: ['id', 'name', 'code', 'title'],
                related_module_link_name_to_fields_array: [],
                deleted: 0
              }),
            }),
          });
          
          const relationshipsResult = await relationshipsResponse.json();
          console.log(`Subservice relationships for project ${projectData.id?.value} using field ${linkFieldName}:`, relationshipsResult);
          
          if (relationshipsResult.entry_list && relationshipsResult.entry_list.length > 0) {
            const subserviceEntry = relationshipsResult.entry_list[0];
            subserviceId = subserviceEntry.id;
            
            // Try to get name from different possible locations
            if (subserviceEntry.name_value_list?.name) {
              const nameValue = subserviceEntry.name_value_list.name;
              subserviceName = typeof nameValue === 'object' ? nameValue.value : nameValue || '';
            } else if (subserviceEntry.name_value_list?.title) {
              const titleValue = subserviceEntry.name_value_list.title;
              subserviceName = typeof titleValue === 'object' ? titleValue.value : titleValue || '';
            } else if (subserviceEntry.name) {
              subserviceName = subserviceEntry.name;
            }
            
            console.log(`✅ Found subservice via relationships using field ${linkFieldName}: ID=${subserviceId}, Name=${subserviceName}`);
            break; // Exit the loop since we found the subservice
          } else {
            console.log(`❌ No subservice relationships found for project ${projectData.id?.value} using field ${linkFieldName}`);
          }
        } catch (relationshipError) {
          console.error(`Error getting subservice relationships for project ${projectData.id?.value} using field ${linkFieldName}:`, relationshipError);
        }
      }
      
      if (!subserviceId) {
        console.log(`⚠️ No subservice found for project ${projectData.id?.value} using any relationship field`);
      }
      
      // Combine multiple partner fields into array
      const partners = [];
      for (let i = 1; i <= 5; i++) {
        const partner = projectData[`partner${i}`]?.value;
        if (partner && partner.trim()) {
          partners.push(partner.trim());
        }
      }
      
      // Combine multiple milestone fields into array
      const milestones = [];
      for (let i = 1; i <= 5; i++) {
        const milestone = projectData[`milestones${i}`]?.value;
        if (milestone && milestone.trim()) {
          milestones.push(milestone.trim());
        }
      }
      
      // Combine multiple KPI fields into array
      const kpis = [];
      for (let i = 1; i <= 5; i++) {
        const kpi = projectData[`kpis${i}`]?.value;
        if (kpi && kpi.trim()) {
          kpis.push(kpi.trim());
        }
      }
      
      // Debug: Log what fields are available in the project data
      console.log(`=== PROJECT ${projectData.id?.value} FIELD DEBUG ===`);
      console.log('Available fields:', Object.keys(projectData));
      console.log('Key field values:');
      console.log('- beneficiaries:', projectData.beneficiaries?.value);
      console.log('- partners array:', partners);
      console.log('- delivery_modality:', projectData.delivery_modality?.value);
      console.log('- geographic_scope:', projectData.geographic_scope?.value);
      console.log('- project_type:', projectData.project_type?.value);
      console.log('- budget_icesco:', projectData.budget_icesco?.value);
      console.log('- budget_member_state:', projectData.budget_member_state?.value);
      console.log('- budget_sponsorship:', projectData.budget_sponsorship?.value);
      console.log('- contact_name:', projectData.contact_name?.value);
      console.log('- contact_email:', projectData.contact_email?.value);
      console.log('- contact_phone:', projectData.contact_phone?.value);
      console.log('- contact_role:', projectData.contact_role?.value);
      
      // Include all projects with comprehensive data
      contactProjects.push({
        id: projectData.id?.value,
        name: projectData.name?.value || 'Untitled Project',
        description: projectData.description?.value || '',
        problem_statement: projectData.problem_statement?.value || '',
        budget_icesco: projectData.budget_icesco?.value || 0,
        budget_member_state: projectData.budget_member_state?.value || 0,
        budget_sponsorship: projectData.budget_sponsorship?.value || 0,
        start_date: projectData.date_start?.value || '',
        end_date: projectData.date_end?.value || '',
        frequency: projectData.project_frequency?.value || '',
        frequency_duration: projectData.frequency_duration?.value || '',
        delivery_modality: projectData.delivery_modality?.value || '',
        geographic_scope: projectData.geographic_scope?.value || '',
        project_type: projectData.project_type?.value || '',
        convening_method_other: projectData.convening_method_other?.value || '',
        beneficiaries: projectData.beneficiaries?.value || '',
        other_beneficiary: projectData.otherbeneficiary?.value || '',
        partners: partners,
        milestones: milestones,
        expected_outputs: projectData.expected_outputs?.value || '',
        kpis: kpis,
        contact_name: projectData.contact_name?.value || projectContactName || '',
        contact_email: projectData.contact_email?.value || '',
        contact_phone: projectData.contact_phone?.value || '',
        contact_role: projectData.contact_role?.value || '',
        comments: projectData.comments?.value || '',
        subservice_name: subserviceName || '',
        subservice_id: subserviceId || '',
        contact_id: contactId, // Use the requesting contact ID since we got projects via relationship
        account_name: accountName || '',
        account_id: accountId || '',
        created_at: projectData.date_entered?.value || '',
        modified_at: projectData.date_modified?.value || '',
        created_by: projectData.created_by?.value || '',
        created_by_name: projectData.created_by_name?.value || '',
        modified_by_name: projectData.modified_by_name?.value || '',
        status: projectData.status?.value || 'published',
        source: 'crm'
      });
    }
    
    console.log(`Found ${contactProjects.length} projects for contact ${contactId} from CRM`);
    
      console.log('=== FINAL API RESPONSE ===');
      console.log('Found', contactProjects.length, 'projects for contact', contactId, 'from CRM');
      console.log('Projects being returned:', contactProjects.map(p => ({ id: p.id, name: p.name })));
      
      return NextResponse.json({
        success: true,
        projects: contactProjects,
        total: contactProjects.length,
        contactId: contactId,
        message: `Retrieved ${contactProjects.length} projects for contact ${contactId} from CRM`
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('CRM API fetch error:', fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Request timeout - CRM is taking too long to respond',
          timeout: true
        }, { status: 408 });
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Get contact projects error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Fallback function using the old filtering approach
async function getProjectsWithOldFiltering(contactId: string, sessionId: string) {
  const CRM_BASE_URL = 'http://3.145.21.11';
  
  console.log('=== FALLBACK: Getting all projects and filtering manually ===');
  
  try {
    const projectsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        method: 'get_entry_list',
        input_type: 'JSON',
        response_type: 'JSON',
        rest_data: JSON.stringify({
          session: sessionId,
          module_name: 'icesc_project_suggestions',
          select_fields: [
            'id', 'name', 'description', 'problem_statement',
            'beneficiaries', 'beneficiaries_c', 'target_beneficiaries',
            'partners', 'partners_c', 'collaborating_partners',
            'partner1', 'partner2', 'partner3', 'partner4', 'partner5',
            'delivery_modality', 'delivery_method', 'modality',
            'geographic_scope', 'geographic_coverage', 'scope',
            'project_type', 'convening_method', 'category',
            'budget_icesco', 'budget_icesco_c', 'icesco_budget',
            'budget_member_state', 'budget_member_c', 'member_budget',
            'budget_sponsorship', 'budget_sponsor_c', 'sponsor_budget',
            'frequency', 'project_frequency', 'frequency_c',
            'date_start', 'start_date', 'project_start',
            'date_end', 'end_date', 'project_end',
            'expected_outputs', 'outputs', 'deliverables',
            'milestones', 'milestones_c', 'milestones_list',
            'milestones1', 'milestones2', 'milestones3', 'milestones4', 'milestones5',
            'kpis', 'kpis_c', 'key_performance_indicators',
            'kpis1', 'kpis2', 'kpis3', 'kpis4', 'kpis5',
            'contact_name', 'contact_person', 'primary_contact',
            'contact_email', 'email', 'primary_email',
            'contact_phone', 'phone', 'primary_phone',
            'contact_role', 'position', 'role_c',
            'comments', 'notes', 'remarks',
            'date_entered', 'date_modified', 'status',
            'created_by', 'created_by_name', 'modified_by_name',
            // Explicitly request relationship ID fields
            'contacts_icesc_project_suggestions_1contacts_ida',
            'contacts_icesc_project_suggestions_1_ida',
            'ms_subservice_icesc_project_suggestions_1ms_subservice_ida',
            'ms_subservice_icesc_project_suggestions_1_ida',
            'ms_subservice_icesc_project_suggestions_1subservices_ida',
            'accounts_icesc_project_suggestions_1accounts_ida'
          ],
          max_results: 100
        }),
      }),
    });
    
    if (!projectsResponse.ok) {
      throw new Error(`CRM API responded with status: ${projectsResponse.status}`);
    }
    
    const projectsResult = await projectsResponse.json();
    console.log('=== FALLBACK: Got all projects, now filtering ===');
    console.log('Total projects found:', projectsResult.entry_list?.length || 0);
    
    if (!projectsResult.entry_list) {
      return NextResponse.json({
        success: true,
        projects: [],
        total: 0,
        contactId: contactId,
        message: `No projects found for contact ${contactId}`
      });
    }
    
    // Filter projects by contact relationship
    const contactProjects = [];
    
    for (const project of projectsResult.entry_list) {
      const projectData = project.name_value_list;
      
      // Try multiple possible contact relationship field names
      const possibleContactIdFields = [
        'contacts_icesc_project_suggestions_1contacts_ida',
        'contacts_icesc_project_suggestions_1_ida',
        'contacts_icesc_project_suggestions_1contacts_idb',
        'contacts_icesc_project_suggestions_1_idb',
        'contact_id_c',
        'contact_id'
      ];
      
      let projectContactId = undefined;
      
      // DEBUG: Check relationship for each project to find the correct contact association
      console.log(`=== DEBUGGING PROJECT ${projectData.id?.value} ===`);
      
      // First, check if relationship ID fields are now present
      const relationshipIdFields = Object.keys(projectData).filter(key => key.endsWith('_ida') || key.endsWith('_idb'));
      console.log(`Project ${projectData.id?.value} relationship ID fields:`, relationshipIdFields);
      
      relationshipIdFields.forEach(field => {
        if (projectData[field]?.value) {
          console.log(`  ${field}: ${projectData[field].value}`);
        }
      });
      
      // Try to get the relationship for this project using get_relationships
      console.log(`=== GETTING RELATIONSHIPS FOR PROJECT ${projectData.id?.value} ===`);
      try {
        const projectRelationshipsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            method: 'get_relationships',
            input_type: 'JSON',
            response_type: 'JSON',
            rest_data: JSON.stringify({
              session: sessionId,
              module_name: 'icesc_project_suggestions',
              module_id: projectData.id?.value,
              link_field_name: 'contacts_icesc_project_suggestions_1',
              related_module_query: '',
              related_fields: ['id', 'first_name', 'last_name'],
              related_module_link_name_to_fields_array: [],
              deleted: 0
            }),
          }),
        });
        
        const projectRelationshipsResult = await projectRelationshipsResponse.json();
        console.log(`Project ${projectData.id?.value} relationships result:`, projectRelationshipsResult);
        
        if (projectRelationshipsResult.entry_list && projectRelationshipsResult.entry_list.length > 0) {
          const relatedContactId = projectRelationshipsResult.entry_list[0].id;
          console.log(`🎯 Project ${projectData.id?.value} is related to contact ${relatedContactId}`);
          console.log(`🎯 Requesting contact is: ${contactId}`);
          console.log(`🎯 Match: ${relatedContactId === contactId ? 'YES' : 'NO'}`);
          
          if (relatedContactId === contactId) {
            console.log(`✅ Project ${projectData.id?.value} belongs to the requesting contact!`);
            projectContactId = relatedContactId;
          } else {
            console.log(`❌ Project ${projectData.id?.value} belongs to different contact: ${relatedContactId}`);
          }
        } else {
          console.log(`⚠️ No relationships found for project ${projectData.id?.value}`);
        }
      } catch (relationshipError) {
        console.error(`Error getting relationships for project ${projectData.id?.value}:`, relationshipError);
      }
      
      for (const field of possibleContactIdFields) {
        if (projectData[field]?.value) {
          projectContactId = projectData[field].value;
          console.log(`Project ${projectData.id?.value}: Found contact ID ${projectContactId} in field ${field}`);
          break;
        }
      }
      
      // Only include projects that belong to the requesting contact
      if (projectContactId === contactId) {
        console.log(`✅ Including project ${projectData.id?.value} - belongs to contact ${contactId}`);
        
        // Get subservice information for fallback projects too
        let subserviceName = '';
        let subserviceId = '';
        
        console.log(`=== FALLBACK: GETTING SUBSERVICE FOR PROJECT ${projectData.id?.value} ===`);
        
        // Try get_relationships approach with multiple possible field names
        const possibleLinkFieldNames = [
          'ms_subservice_icesc_project_suggestions_1',
          'ms_subservice_icesc_project_suggestions_1subservices',
          'subservices_icesc_project_suggestions_1',
          'ms_subservice_icesc_project_suggestions_1subservices_ida'
        ];
        
        for (const linkFieldName of possibleLinkFieldNames) {
          try {
            console.log(`Fallback: Trying relationship field: ${linkFieldName}`);
            const relationshipsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                method: 'get_relationships',
                input_type: 'JSON',
                response_type: 'JSON',
                rest_data: JSON.stringify({
                  session: sessionId,
                  module_name: 'icesc_project_suggestions',
                  module_id: projectData.id?.value,
                  link_field_name: linkFieldName,
                  related_module_query: '',
                  related_fields: ['id', 'name', 'code', 'title'],
                  related_module_link_name_to_fields_array: [],
                  deleted: 0
                }),
              }),
            });
            
            const relationshipsResult = await relationshipsResponse.json();
            console.log(`Fallback: Subservice relationships for project ${projectData.id?.value} using field ${linkFieldName}:`, relationshipsResult);
            
            if (relationshipsResult.entry_list && relationshipsResult.entry_list.length > 0) {
              const subserviceEntry = relationshipsResult.entry_list[0];
              subserviceId = subserviceEntry.id;
              
              // Try to get name from different possible locations
              if (subserviceEntry.name_value_list?.name) {
                const nameValue = subserviceEntry.name_value_list.name;
                subserviceName = typeof nameValue === 'object' ? nameValue.value : nameValue || '';
              } else if (subserviceEntry.name_value_list?.title) {
                const titleValue = subserviceEntry.name_value_list.title;
                subserviceName = typeof titleValue === 'object' ? titleValue.value : titleValue || '';
              } else if (subserviceEntry.name) {
                subserviceName = subserviceEntry.name;
              }
              
              console.log(`✅ Fallback: Found subservice via relationships using field ${linkFieldName}: ID=${subserviceId}, Name=${subserviceName}`);
              break; // Exit the loop since we found the subservice
            } else {
              console.log(`❌ Fallback: No subservice relationships found for project ${projectData.id?.value} using field ${linkFieldName}`);
            }
          } catch (relationshipError) {
            console.error(`Fallback: Error getting subservice relationships for project ${projectData.id?.value} using field ${linkFieldName}:`, relationshipError);
          }
        }
        
        // Debug: Log what fields are available in the fallback project data
        console.log(`=== FALLBACK PROJECT ${projectData.id?.value} FIELD DEBUG ===`);
        console.log('Available fields:', Object.keys(projectData));
        console.log('Key field values:');
        console.log('- beneficiaries:', projectData.beneficiaries?.value);
        console.log('- delivery_modality:', projectData.delivery_modality?.value);
        console.log('- geographic_scope:', projectData.geographic_scope?.value);
        console.log('- project_type:', projectData.project_type?.value);
        console.log('- budget_icesco:', projectData.budget_icesco?.value);
        console.log('- budget_member_state:', projectData.budget_member_state?.value);
        console.log('- budget_sponsorship:', projectData.budget_sponsorship?.value);
        console.log('- contact_name:', projectData.contact_name?.value);
        console.log('- contact_email:', projectData.contact_email?.value);
        console.log('- contact_phone:', projectData.contact_phone?.value);
        console.log('- contact_role:', projectData.contact_role?.value);
        
        // Get basic project info
        contactProjects.push({
          id: projectData.id?.value,
          name: projectData.name?.value || 'Untitled Project',
          description: projectData.description?.value || '',
          problem_statement: projectData.problem_statement?.value || '',
          budget_icesco: projectData.budget_icesco?.value || 0,
          budget_member_state: projectData.budget_member_state?.value || 0,
          budget_sponsorship: projectData.budget_sponsorship?.value || 0,
          start_date: projectData.date_start?.value || '',
          end_date: projectData.date_end?.value || '',
          frequency: projectData.project_frequency?.value || '',
          delivery_modality: projectData.delivery_modality?.value || '',
          geographic_scope: projectData.geographic_scope?.value || '',
          project_type: projectData.project_type?.value || '',
          beneficiaries: projectData.beneficiaries?.value || '',
          contact_name: projectData.contact_name?.value || '',
          contact_email: projectData.contact_email?.value || '',
          contact_phone: projectData.contact_phone?.value || '',
          contact_role: projectData.contact_role?.value || '',
          subservice_name: subserviceName || '',
          subservice_id: subserviceId || '',
          contact_id: contactId,
          created_at: projectData.date_entered?.value || '',
          status: projectData.status?.value || 'published',
          source: 'crm'
        });
      } else if (projectContactId) {
        console.log(`❌ Skipping project ${projectData.id?.value} - belongs to contact ${projectContactId}, not ${contactId}`);
      } else {
        console.log(`⚠️ Skipping project ${projectData.id?.value} - no contact relationship found`);
      }
    }
    
    console.log(`=== FALLBACK RESULT: Found ${contactProjects.length} projects for contact ${contactId} ===`);
    
    return NextResponse.json({
      success: true,
      projects: contactProjects,
      total: contactProjects.length,
      contactId: contactId,
      message: `Retrieved ${contactProjects.length} projects for contact ${contactId} (using fallback filtering)`
    });
    
  } catch (error) {
    console.error('Fallback filtering error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve projects using fallback method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
