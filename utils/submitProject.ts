// Simple project submission function - no hooks, no complexity
export const submitProject = async (projectData: any) => {
  try {
    // Get contact info from localStorage
    const contactInfo = typeof window !== 'undefined' ? localStorage.getItem('contactInfo') : null;
    
    if (!contactInfo) {
      throw new Error('No contact info found. Please log in again.');
    }

    const contact = JSON.parse(contactInfo);
    
    // Prepare data for API (submit-project-simple expects specific fields)
    const currentDate = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearDate = nextYear.toISOString().split('T')[0];
    
    const dataToSend = {
      // BASIC FIELDS (using field names that match CRM validation)
      name: projectData.title || 'Project Proposal',
      description: projectData.description || '', // ✅ Use your actual data, no fallback
      problem_statement: projectData.problem_statement || '', // ✅ Use your actual data, no fallback
      status: 'Published', // ✅ Fixed: use 'status' not 'status_c'
      
      // BENEFICIARIES
      beneficiaries: projectData.beneficiaries || ['GeneralPublic'],
      other_beneficiaries: projectData.otherbeneficiary || '',
      
      // IMPLEMENTATION & BUDGET (using field names that match CRM validation)
      start_date: projectData.start_date || currentDate, // ✅ Fixed: use 'start_date' not 'date_start'
      end_date: projectData.end_date || nextYearDate, // ✅ Fixed: use 'end_date' not 'date_end'
      budget_icesco: projectData.budget_icesco || 0,
      budget_member_state: projectData.budget_member_state || 0,
      budget_sponsorship: projectData.budget_sponsorship || 0,
      frequency: projectData.project_frequency || 'Onetime', // ✅ Fixed: use 'frequency' not 'project_frequency'
      frequency_duration: projectData.frequency_duration || '',
      
      // PARTNERS & COLLABORATION
      partner1: projectData.partner1 || '',
      partner2: projectData.partner2 || '',
      partner3: projectData.partner3 || '',
      partner4: projectData.partner4 || '',
      partner5: projectData.partner5 || '',
      
      // PROJECT SCOPE & MODALITY
      delivery_modality: projectData.delivery_modality || 'Physical',
      geographic_scope: projectData.geographic_scope || 'National',
      project_type: projectData.project_type || 'Training',
      convening_method_other: projectData.convening_method_other || '',
      expected_outputs: projectData.expected_outputs || '',
      
      // MONITORING & EVALUATION
      milestones1: projectData.milestones1 || '',
      milestones2: projectData.milestones2 || '',
      milestones3: projectData.milestones3 || '',
      milestones4: projectData.milestones4 || '',
      milestones5: projectData.milestones5 || '',
      kpis1: projectData.kpis1 || '',
      kpis2: projectData.kpis2 || '',
      kpis3: projectData.kpis3 || '',
      kpis4: projectData.kpis4 || '',
      kpis5: projectData.kpis5 || '',
      
      // PROJECT CONTACT INFORMATION
      contact_name: projectData.contact_name || contact.name || '',
      contact_phone: projectData.contact_phone || contact.phone || '',
      contact_email: projectData.contact_email || contact.email || '',
      contact_role: projectData.contact_role || contact.role || '',
      
      // COMMENTS
      comments: projectData.comments || '',
      
      // RELATIONSHIP DATA (for setting relationships)
      contact_id: contact.id,
      account_id: contact.account_id || null,
      sub_service_id: projectData.sub_service_id || null
    };

    console.log('Submitting project with data:', dataToSend);

    // Call the API
    const response = await fetch('/api/submit-project-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Project submitted successfully:', result);
      return { success: true, projectId: result.projectId, message: result.message };
    } else {
      console.error('❌ Project submission failed:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('Project submission error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
