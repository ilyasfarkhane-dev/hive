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
    
    // For now, let's just get all projects and filter them
    // We'll improve the filtering later
    console.log('=== STEP 1: Fetching All Projects from CRM ===');
    
    // Get projects from CRM with timeout
    console.log('=== STEP 2: Fetching Projects from CRM ===');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    try {
      const projectsResponse = await fetch(`${CRM_BASE_URL}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
        body: new URLSearchParams({
          method: 'get_entry_list',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify({
            session: sessionId,
            module_name: 'icesc_project_suggestions',
            select_fields: [], // Empty array means get all fields
            max_results: 100
          }),
        }),
      });
      
      clearTimeout(timeoutId);
      
      if (!projectsResponse.ok) {
        throw new Error(`CRM API responded with status: ${projectsResponse.status}`);
      }
      
      const projectsResult = await projectsResponse.json();
      console.log('Projects result:', projectsResult);
      
      if (!projectsResult.entry_list) {
      return NextResponse.json({
        success: true,
        projects: [],
        message: 'No projects found'
      });
    }
    
    // For now, return all projects (we'll add proper filtering later)
    console.log('=== STEP 3: Processing All Projects ===');
    const contactProjects = [];
    
    for (const project of projectsResult.entry_list) {
      const projectData = project.name_value_list;
      
      // Get relationship information
      const projectContactName = projectData.contacts_icesc_project_suggestions_1_name?.value;
      const projectContactId = projectData.contacts_icesc_project_suggestions_1contacts_ida?.value;
      const accountName = projectData.accounts_icesc_project_suggestions_1_name?.value;
      const accountId = projectData.accounts_icesc_project_suggestions_1accounts_ida?.value;
      
      // Get subservice information from relationships
      let subserviceName = '';
      let subserviceId = '';
      
      try {
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
              link_field_name: 'ms_subservice_icesc_project_suggestions_1',
              related_module_query: '',
              related_fields: ['id', 'name'],
              related_module_link_name_to_fields_array: [],
              deleted: 0
            }),
          }),
        });
        
        const relationshipsResult = await relationshipsResponse.json();
        console.log(`Relationships for project ${projectData.id?.value}:`, relationshipsResult);
        
        if (relationshipsResult.entry_list && relationshipsResult.entry_list.length > 0) {
          subserviceId = relationshipsResult.entry_list[0].id;
          const nameValue = relationshipsResult.entry_list[0].name_value_list?.name;
          subserviceName = typeof nameValue === 'object' ? nameValue.value : nameValue || '';
        }
      } catch (relationshipError) {
        console.error(`Error getting relationships for project ${projectData.id?.value}:`, relationshipError);
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
        contact_id: projectContactId || '',
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
    
    console.log(`Found ${contactProjects.length} projects from CRM`);
    
      return NextResponse.json({
        success: true,
        projects: contactProjects,
        total: contactProjects.length,
        message: `Retrieved ${contactProjects.length} projects from CRM`
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
