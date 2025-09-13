import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

// Get fresh session ID for CRM authentication
async function getFreshSessionId(): Promise<string> {
  try {
    const sessionId = await getSessionId();
    return sessionId;
  } catch (error) {
    console.error('Failed to get fresh session ID:', error);
    throw new Error('Failed to authenticate with CRM');
  }
}

// Get all projects submitted by a specific session_id
export async function GET(request: NextRequest) {
  try {
    console.log('=== Session Projects API ===');
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const action = searchParams.get('action') || 'list';
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Session ID:', sessionId);
    console.log('Action:', action);
    
    const crmSessionId = await getFreshSessionId();
    console.log('CRM Session ID obtained:', crmSessionId);
    
    switch (action) {
      case 'list':
        return await getProjectsBySession(crmSessionId, sessionId);
      
      case 'count':
        return await getProjectCountBySession(crmSessionId, sessionId);
      
      case 'statistics':
        return await getSessionStatistics(crmSessionId, sessionId);
      
      case 'export':
        return await exportSessionProjects(crmSessionId, sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: list, count, statistics, or export' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Session Projects API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to access session projects: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Get all projects submitted by a specific session_id
async function getProjectsBySession(crmSessionId: string, sessionId: string) {
  console.log('Getting projects for session:', sessionId);
  
  // Query projects by session_id
  const query = `session_id='${sessionId}'`;
  
  const projects = await getModuleEntries(
    crmSessionId, 
    "icesc_project_suggestions", 
    [
      "id", 
      "name", 
      "description", 
      "strategic_goal_id", 
      "strategic_goal",
      "pillar_id", 
      "pillar",
      "service_id", 
      "service",
      "sub_service_id", 
      "sub_service",
      "contact_name",
      "contact_email",
      "contact_phone",
      "contact_role",
      "budget_icesco",
      "budget_member_state",
      "budget_sponsorship",
      "date_start",
      "date_end",
      "project_frequency",
      "delivery_modality",
      "geographic_scope",
      "project_type",
      "beneficiaries",
      "partner1",
      "partner2",
      "partner3",
      "partner4",
      "partner5",
      "milestones1",
      "milestones2",
      "milestones3",
      "milestones4",
      "milestones5",
      "kpis1",
      "kpis2",
      "kpis3",
      "kpis4",
      "kpis5",
      "expected_outputs",
      "comments",
      "session_id",
      "language",
      "submission_date"
    ],
    query
  );

  console.log('=== DEBUG: Projects Retrieved ===');
  console.log('Projects count:', projects.length);
  console.log('Projects data:', JSON.stringify(projects, null, 2));
  
  console.log(`Found ${projects.length} projects for session ${sessionId}`);
  
  // Handle case where no projects are found
  if (!projects || projects.length === 0) {
    console.log('No projects found for session:', sessionId);
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      sessionId: sessionId,
      message: 'No projects found for this session',
      timestamp: new Date().toISOString()
    });
  }
  
  // Transform projects to include calculated fields
  const transformedProjects = projects.map((project: any) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    strategicFramework: {
      goal: {
        id: project.strategic_goal_id,
        name: project.strategic_goal
      },
      pillar: {
        id: project.pillar_id,
        name: project.pillar
      },
      service: {
        id: project.service_id,
        name: project.service
      },
      subService: {
        id: project.sub_service_id,
        name: project.sub_service
      }
    },
    contact: {
      name: project.contact_name,
      email: project.contact_email,
      phone: project.contact_phone,
      role: project.contact_role
    },
    budget: {
      icesco: project.budget_icesco,
      memberState: project.budget_member_state,
      sponsorship: project.budget_sponsorship,
      total: (parseFloat(project.budget_icesco) || 0) + 
             (parseFloat(project.budget_member_state) || 0) + 
             (parseFloat(project.budget_sponsorship) || 0)
    },
    timeline: {
      start: project.date_start,
      end: project.date_end,
      frequency: project.project_frequency
    },
    scope: {
      delivery: project.delivery_modality,
      geographic: project.geographic_scope,
      type: project.project_type
    },
    beneficiaries: project.beneficiaries,
    partners: [
      project.partner1,
      project.partner2,
      project.partner3,
      project.partner4,
      project.partner5
    ].filter(p => p),
    milestones: [
      project.milestones1,
      project.milestones2,
      project.milestones3,
      project.milestones4,
      project.milestones5
    ].filter(m => m),
    kpis: [
      project.kpis1,
      project.kpis2,
      project.kpis3,
      project.kpis4,
      project.kpis5
    ].filter(k => k),
    expectedOutputs: project.expected_outputs,
    comments: project.comments,
    sessionId: project.session_id,
    language: project.language,
    submissionDate: project.submission_date
  }));
  
  return NextResponse.json({
    success: true,
    data: transformedProjects,
    count: transformedProjects.length,
    sessionId: sessionId,
    timestamp: new Date().toISOString()
  });
}

// Get project count by session
async function getProjectCountBySession(crmSessionId: string, sessionId: string) {
  console.log('Getting project count for session:', sessionId);
  
  const query = `session_id='${sessionId}'`;
  
  const projects = await getModuleEntries(
    crmSessionId, 
    "icesc_project_suggestions", 
    ["id"],
    query
  );
  
  console.log(`Project count for session ${sessionId}: ${projects.length}`);
  
  return NextResponse.json({
    success: true,
    sessionId: sessionId,
    projectCount: projects.length,
    timestamp: new Date().toISOString()
  });
}

// Get session statistics
async function getSessionStatistics(crmSessionId: string, sessionId: string) {
  console.log('Getting statistics for session:', sessionId);
  
  const query = `session_id='${sessionId}'`;
  
  const projects = await getModuleEntries(
    crmSessionId, 
    "icesc_project_suggestions", 
    [
      "id",
      "strategic_goal_id",
      "strategic_goal",
      "pillar_id",
      "pillar",
      "service_id",
      "service",
      "sub_service_id",
      "sub_service",
      "budget_icesco",
      "budget_member_state",
      "budget_sponsorship",
      "project_type",
      "delivery_modality",
      "geographic_scope",
      "submission_date"
    ],
    query
  );

  console.log('=== DEBUG: Statistics Projects Retrieved ===');
  console.log('Projects count for statistics:', projects.length);

  // Handle case where no projects are found
  if (!projects || projects.length === 0) {
    console.log('No projects found for statistics, session:', sessionId);
    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId,
        totalProjects: 0,
        totalBudget: 0,
        averageBudget: 0,
        byGoal: {},
        byPillar: {},
        byService: {},
        bySubService: {},
        byProjectType: {},
        byDeliveryModality: {},
        byGeographicScope: {},
        submissionTimeline: []
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Calculate statistics
  const statistics: any = {
    sessionId: sessionId,
    totalProjects: projects.length,
    totalBudget: projects.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.budget_icesco) || 0) + 
      (parseFloat(p.budget_member_state) || 0) + 
      (parseFloat(p.budget_sponsorship) || 0), 0
    ),
    averageBudget: 0,
    byGoal: {},
    byPillar: {},
    byService: {},
    bySubService: {},
    byProjectType: {},
    byDeliveryModality: {},
    byGeographicScope: {},
    submissionTimeline: []
  };
  
  if (projects.length > 0) {
    statistics.averageBudget = statistics.totalBudget / projects.length;
  }
  
  // Group by strategic framework
  projects.forEach((project: any) => {
    // By goal
    if (project.strategic_goal_id) {
      const goalKey = `${project.strategic_goal} (${project.strategic_goal_id})`;
      if (!statistics.byGoal[goalKey]) {
        statistics.byGoal[goalKey] = { count: 0, totalBudget: 0 };
      }
      statistics.byGoal[goalKey].count++;
      statistics.byGoal[goalKey].totalBudget += (parseFloat(project.budget_icesco) || 0) + 
        (parseFloat(project.budget_member_state) || 0) + 
        (parseFloat(project.budget_sponsorship) || 0);
    }
    
    // By pillar
    if (project.pillar_id) {
      const pillarKey = `${project.pillar} (${project.pillar_id})`;
      if (!statistics.byPillar[pillarKey]) {
        statistics.byPillar[pillarKey] = { count: 0, totalBudget: 0 };
      }
      statistics.byPillar[pillarKey].count++;
      statistics.byPillar[pillarKey].totalBudget += (parseFloat(project.budget_icesco) || 0) + 
        (parseFloat(project.budget_member_state) || 0) + 
        (parseFloat(project.budget_sponsorship) || 0);
    }
    
    // By service
    if (project.service_id) {
      const serviceKey = `${project.service} (${project.service_id})`;
      if (!statistics.byService[serviceKey]) {
        statistics.byService[serviceKey] = { count: 0, totalBudget: 0 };
      }
      statistics.byService[serviceKey].count++;
      statistics.byService[serviceKey].totalBudget += (parseFloat(project.budget_icesco) || 0) + 
        (parseFloat(project.budget_member_state) || 0) + 
        (parseFloat(project.budget_sponsorship) || 0);
    }
    
    // By sub-service
    if (project.sub_service_id) {
      const subServiceKey = `${project.sub_service} (${project.sub_service_id})`;
      if (!statistics.bySubService[subServiceKey]) {
        statistics.bySubService[subServiceKey] = { count: 0, totalBudget: 0 };
      }
      statistics.bySubService[subServiceKey].count++;
      statistics.bySubService[subServiceKey].totalBudget += (parseFloat(project.budget_icesco) || 0) + 
        (parseFloat(project.budget_member_state) || 0) + 
        (parseFloat(project.budget_sponsorship) || 0);
    }
    
    // By project type
    if (project.project_type) {
      if (!statistics.byProjectType[project.project_type]) {
        statistics.byProjectType[project.project_type] = 0;
      }
      statistics.byProjectType[project.project_type]++;
    }
    
    // By delivery modality
    if (project.delivery_modality) {
      if (!statistics.byDeliveryModality[project.delivery_modality]) {
        statistics.byDeliveryModality[project.delivery_modality] = 0;
      }
      statistics.byDeliveryModality[project.delivery_modality]++;
    }
    
    // By geographic scope
    if (project.geographic_scope) {
      if (!statistics.byGeographicScope[project.geographic_scope]) {
        statistics.byGeographicScope[project.geographic_scope] = 0;
      }
      statistics.byGeographicScope[project.geographic_scope]++;
    }
    
    // Submission timeline
    if (project.submission_date) {
      statistics.submissionTimeline.push({
        projectId: project.id,
        submissionDate: project.submission_date,
        projectName: project.name
      });
    }
  });
  
  // Sort submission timeline by date
  statistics.submissionTimeline.sort((a: any, b: any) => 
    new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
  );
  
  console.log('Statistics calculated for session:', sessionId);
  
  return NextResponse.json({
    success: true,
    data: statistics,
    timestamp: new Date().toISOString()
  });
}

// Export session projects
async function exportSessionProjects(crmSessionId: string, sessionId: string) {
  console.log('Exporting projects for session:', sessionId);
  
  const projects = await getProjectsBySession(crmSessionId, sessionId);
  const projectData = (projects as any).data;
  
  // Create CSV content
  const csvHeaders = [
    'Project ID', 'Project Name', 'Description',
    'Goal ID', 'Goal Name', 'Pillar ID', 'Pillar Name',
    'Service ID', 'Service Name', 'Sub-Service ID', 'Sub-Service Name',
    'Contact Name', 'Contact Email', 'Contact Phone', 'Contact Role',
    'Budget ICESCO', 'Budget Member State', 'Budget Sponsorship', 'Total Budget',
    'Start Date', 'End Date', 'Frequency',
    'Delivery Modality', 'Geographic Scope', 'Project Type',
    'Beneficiaries', 'Partners', 'Milestones', 'KPIs', 'Expected Outputs',
    'Comments', 'Session ID', 'Language', 'Submission Date'
  ];
  
  const csvRows = projectData.map((project: any) => [
    project.id,
    project.name,
    project.description,
    project.strategicFramework.goal.id,
    project.strategicFramework.goal.name,
    project.strategicFramework.pillar.id,
    project.strategicFramework.pillar.name,
    project.strategicFramework.service.id,
    project.strategicFramework.service.name,
    project.strategicFramework.subService.id,
    project.strategicFramework.subService.name,
    project.contact.name,
    project.contact.email,
    project.contact.phone,
    project.contact.role,
    project.budget.icesco,
    project.budget.memberState,
    project.budget.sponsorship,
    project.budget.total,
    project.timeline.start,
    project.timeline.end,
    project.timeline.frequency,
    project.scope.delivery,
    project.scope.geographic,
    project.scope.type,
    project.beneficiaries,
    project.partners.join('; '),
    project.milestones.join('; '),
    project.kpis.join('; '),
    project.expectedOutputs,
    project.comments,
    project.sessionId,
    project.language,
    project.submissionDate
  ]);
  
  const csvContent = [csvHeaders, ...csvRows]
    .map((row: any) => row.map((field: any) => `"${field}"`).join(','))
    .join('\n');
  
  console.log('CSV export created for session:', sessionId);
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="session_${sessionId}_projects.csv"`
    }
  });
}
