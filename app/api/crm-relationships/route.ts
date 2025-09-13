import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

const CRM_BASE_URL = 'http://3.145.21.11';

// Get fresh session ID
async function getFreshSessionId(): Promise<string> {
  try {
    const sessionId = await getSessionId();
    return sessionId;
  } catch (error) {
    console.error('Failed to get fresh session ID:', error);
    throw new Error('Failed to authenticate with CRM');
  }
}

// Get strategic framework relationships
export async function GET(request: NextRequest) {
  try {
    console.log('=== CRM Relationships API ===');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'framework';
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    
    const sessionId = await getFreshSessionId();
    console.log('Session ID obtained:', sessionId);
    
    switch (action) {
      case 'framework':
        return await getStrategicFramework(sessionId);
      
      case 'projects':
        if (!id || !type) {
          return NextResponse.json({ error: 'ID and type are required for projects action' }, { status: 400 });
        }
        return await getProjectsByFramework(sessionId, type, id);
      
      case 'project':
        if (!id) {
          return NextResponse.json({ error: 'ID is required for project action' }, { status: 400 });
        }
        return await getProjectWithRelationships(sessionId, id);
      
      case 'statistics':
        return await getFrameworkStatistics(sessionId);
      
      case 'search':
        return await searchProjects(sessionId, searchParams);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: framework, projects, project, statistics, or search' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('CRM Relationships API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to access CRM relationships: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Get complete strategic framework
async function getStrategicFramework(sessionId: string) {
  console.log('Getting complete strategic framework...');
  
  const [goals, pillars, services, subServices] = await Promise.all([
    getModuleEntries(sessionId, "ms_goal", ["id", "name", "description"]),
    getModuleEntries(sessionId, "ms_pillar", ["id", "name", "description"]),
    getModuleEntries(sessionId, "ms_service", ["id", "name", "description"]),
    getModuleEntries(sessionId, "ms_subservice", ["id", "name", "description"])
  ]);
  
  const framework = {
    goals: goals.map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description
    })),
    pillars: pillars.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description
    })),
    services: services.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description
    })),
    subServices: subServices.map((ss: any) => ({
      id: ss.id,
      name: ss.name,
      description: ss.description
    }))
  };
  
  console.log('Strategic framework retrieved:', {
    goals: framework.goals.length,
    pillars: framework.pillars.length,
    services: framework.services.length,
    subServices: framework.subServices.length
  });
  
  return NextResponse.json({
    success: true,
    data: framework,
    counts: {
      goals: framework.goals.length,
      pillars: framework.pillars.length,
      services: framework.services.length,
      subServices: framework.subServices.length
    }
  });
}

// Get projects by framework level
async function getProjectsByFramework(sessionId: string, type: string, id: string | null) {
  console.log(`Getting projects by ${type}:`, id);
  
  if (!type || !id) {
    return NextResponse.json(
      { error: 'Type and ID are required for projects action' },
      { status: 400 }
    );
  }
  
  let query = '';
  switch (type) {
    case 'goal':
      query = `strategic_goal_id='${id}'`;
      break;
    case 'pillar':
      query = `pillar_id='${id}'`;
      break;
    case 'service':
      query = `service_id='${id}'`;
      break;
    case 'subservice':
      query = `sub_service_id='${id}'`;
      break;
    default:
      return NextResponse.json(
        { error: 'Invalid type. Use: goal, pillar, service, or subservice' },
        { status: 400 }
      );
  }
  
  const projects = await getModuleEntries(
    sessionId, 
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
      "budget_icesco",
      "budget_member_state",
      "budget_sponsorship",
      "date_start",
      "date_end",
      "project_frequency",
      "delivery_modality",
      "geographic_scope",
      "project_type"
    ],
    query
  );
  
  console.log(`Found ${projects.length} projects for ${type} ${id}`);
  
  return NextResponse.json({
    success: true,
    data: projects,
    count: projects.length,
    framework: { type, id }
  });
}

// Get specific project with full relationships
async function getProjectWithRelationships(sessionId: string, projectId: string | null) {
  console.log('Getting project with relationships:', projectId);
  
  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    );
  }
  
  const projects = await getModuleEntries(
    sessionId, 
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
      "comments"
    ],
    `id='${projectId}'`
  );
  
  if (projects.length === 0) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }
  
  const project = projects[0];
  
  // Get related strategic framework details
  const [goal, pillar, service, subService] = await Promise.all([
    getModuleEntries(sessionId, "ms_goal", ["id", "name", "description"], `id='${project.strategic_goal_id}'`),
    getModuleEntries(sessionId, "ms_pillar", ["id", "name", "description"], `id='${project.pillar_id}'`),
    getModuleEntries(sessionId, "ms_service", ["id", "name", "description"], `id='${project.service_id}'`),
    getModuleEntries(sessionId, "ms_subservice", ["id", "name", "description"], `id='${project.sub_service_id}'`)
  ]);
  
  const projectWithRelationships = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
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
      comments: project.comments
    },
    strategicFramework: {
      goal: goal[0] || null,
      pillar: pillar[0] || null,
      service: service[0] || null,
      subService: subService[0] || null
    }
  };
  
  console.log('Project with relationships retrieved');
  
  return NextResponse.json({
    success: true,
    data: projectWithRelationships
  });
}

// Get framework statistics
async function getFrameworkStatistics(sessionId: string) {
  console.log('Getting framework statistics...');
  
  const allProjects = await getModuleEntries(
    sessionId, 
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
      "budget_sponsorship"
    ]
  );
  
  const [goals, pillars, services, subServices] = await Promise.all([
    getModuleEntries(sessionId, "ms_goal", ["id", "name"]),
    getModuleEntries(sessionId, "ms_pillar", ["id", "name"]),
    getModuleEntries(sessionId, "ms_service", ["id", "name"]),
    getModuleEntries(sessionId, "ms_subservice", ["id", "name"])
  ]);
  
  const statistics: any = {
    totalProjects: allProjects.length,
    totalBudget: allProjects.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.budget_icesco) || 0) + 
      (parseFloat(p.budget_member_state) || 0) + 
      (parseFloat(p.budget_sponsorship) || 0), 0
    ),
    byGoal: {},
    byPillar: {},
    byService: {},
    bySubService: {}
  };
  
  // Calculate statistics for each level
  goals.forEach((goal: any) => {
    const goalProjects = allProjects.filter((p: any) => p.strategic_goal_id === goal.id);
    statistics.byGoal[goal.name] = {
      id: goal.id,
      count: goalProjects.length,
      totalBudget: goalProjects.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  pillars.forEach((pillar: any) => {
    const pillarProjects = allProjects.filter((p: any) => p.pillar_id === pillar.id);
    statistics.byPillar[pillar.name] = {
      id: pillar.id,
      count: pillarProjects.length,
      totalBudget: pillarProjects.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  services.forEach((service: any) => {
    const serviceProjects = allProjects.filter((p: any) => p.service_id === service.id);
    statistics.byService[service.name] = {
      id: service.id,
      count: serviceProjects.length,
      totalBudget: serviceProjects.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  subServices.forEach((subService: any) => {
    const subServiceProjects = allProjects.filter((p: any) => p.sub_service_id === subService.id);
    statistics.bySubService[subService.name] = {
      id: subService.id,
      count: subServiceProjects.length,
      totalBudget: subServiceProjects.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  console.log('Statistics calculated:', {
    totalProjects: statistics.totalProjects,
    totalBudget: statistics.totalBudget
  });
  
  return NextResponse.json({
    success: true,
    data: statistics
  });
}

// Search projects by criteria
async function searchProjects(sessionId: string, searchParams: URLSearchParams) {
  console.log('Searching projects with criteria:', Object.fromEntries(searchParams.entries()));
  
  const conditions = [];
  
  const goalId = searchParams.get('goalId');
  const pillarId = searchParams.get('pillarId');
  const serviceId = searchParams.get('serviceId');
  const subServiceId = searchParams.get('subServiceId');
  const projectType = searchParams.get('projectType');
  const deliveryModality = searchParams.get('deliveryModality');
  const geographicScope = searchParams.get('geographicScope');
  const minBudget = searchParams.get('minBudget');
  const maxBudget = searchParams.get('maxBudget');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  if (goalId) conditions.push(`strategic_goal_id='${goalId}'`);
  if (pillarId) conditions.push(`pillar_id='${pillarId}'`);
  if (serviceId) conditions.push(`service_id='${serviceId}'`);
  if (subServiceId) conditions.push(`sub_service_id='${subServiceId}'`);
  if (projectType) conditions.push(`project_type='${projectType}'`);
  if (deliveryModality) conditions.push(`delivery_modality='${deliveryModality}'`);
  if (geographicScope) conditions.push(`geographic_scope='${geographicScope}'`);
  if (minBudget) conditions.push(`(budget_icesco + budget_member_state + budget_sponsorship) >= ${minBudget}`);
  if (maxBudget) conditions.push(`(budget_icesco + budget_member_state + budget_sponsorship) <= ${maxBudget}`);
  if (startDate) conditions.push(`date_start >= '${startDate}'`);
  if (endDate) conditions.push(`date_end <= '${endDate}'`);
  
  const query = conditions.length > 0 ? conditions.join(' AND ') : '';
  
  const projects = await getModuleEntries(
    sessionId, 
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
      "budget_icesco",
      "budget_member_state",
      "budget_sponsorship",
      "date_start",
      "date_end",
      "project_frequency",
      "delivery_modality",
      "geographic_scope",
      "project_type"
    ],
    query
  );
  
  console.log(`Found ${projects.length} projects matching search criteria`);
  
  return NextResponse.json({
    success: true,
    data: projects,
    count: projects.length,
    criteria: Object.fromEntries(searchParams.entries())
  });
}


