/**
 * ICESCO CRM Access Examples
 * This file contains practical examples of how to access and work with CRM data
 */

import { getSessionId, getModuleEntries } from '../utils/crm.js';

// Example 1: Get Complete Strategic Framework
async function getStrategicFramework(sessionId) {
  console.log('=== Getting Complete Strategic Framework ===');
  
  // Get all goals
  const goals = await getModuleEntries(sessionId, "ms_goal", ["id", "name", "description"]);
  console.log('Goals:', goals);
  
  // Get all pillars
  const pillars = await getModuleEntries(sessionId, "ms_pillar", ["id", "name", "description"]);
  console.log('Pillars:', pillars);
  
  // Get all services
  const services = await getModuleEntries(sessionId, "ms_service", ["id", "name", "description"]);
  console.log('Services:', services);
  
  // Get all sub-services
  const subServices = await getModuleEntries(sessionId, "ms_subservice", ["id", "name", "description"]);
  console.log('Sub-Services:', subServices);
  
  return {
    goals,
    pillars,
    services,
    subServices
  };
}

// Example 2: Get Projects by Strategic Framework Level
async function getProjectsByFramework(sessionId, frameworkType, frameworkId) {
  console.log(`=== Getting Projects by ${frameworkType} ===`);
  
  let query = '';
  switch (frameworkType) {
    case 'goal':
      query = `strategic_goal_id='${frameworkId}'`;
      break;
    case 'pillar':
      query = `pillar_id='${frameworkId}'`;
      break;
    case 'service':
      query = `service_id='${frameworkId}'`;
      break;
    case 'subservice':
      query = `sub_service_id='${frameworkId}'`;
      break;
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
      "date_end"
    ],
    query
  );
  
  console.log(`Projects for ${frameworkType} ${frameworkId}:`, projects);
  return projects;
}

// Example 3: Get Project with Full Relationship Details
async function getProjectWithRelationships(sessionId, projectId) {
  console.log('=== Getting Project with Full Relationships ===');
  
  // Get the project
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
    console.log('Project not found');
    return null;
  }
  
  const project = projects[0];
  
  // Get related strategic framework details
  const goal = await getModuleEntries(
    sessionId, 
    "ms_goal", 
    ["id", "name", "description"],
    `id='${project.strategic_goal_id}'`
  );
  
  const pillar = await getModuleEntries(
    sessionId, 
    "ms_pillar", 
    ["id", "name", "description"],
    `id='${project.pillar_id}'`
  );
  
  const service = await getModuleEntries(
    sessionId, 
    "ms_service", 
    ["id", "name", "description"],
    `id='${project.service_id}'`
  );
  
  const subService = await getModuleEntries(
    sessionId, 
    "ms_subservice", 
    ["id", "name", "description"],
    `id='${project.sub_service_id}'`
  );
  
  // Build complete relationship object
  const projectWithRelationships = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      contact: {
        name: project.contact_name,
        email: project.contact_email
      },
      budget: {
        icesco: project.budget_icesco,
        memberState: project.budget_member_state,
        sponsorship: project.budget_sponsorship
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
      ].filter(p => p), // Remove empty values
      milestones: [
        project.milestones1,
        project.milestones2,
        project.milestones3,
        project.milestones4,
        project.milestones5
      ].filter(m => m), // Remove empty values
      kpis: [
        project.kpis1,
        project.kpis2,
        project.kpis3,
        project.kpis4,
        project.kpis5
      ].filter(k => k), // Remove empty values
      comments: project.comments
    },
    strategicFramework: {
      goal: goal[0] || null,
      pillar: pillar[0] || null,
      service: service[0] || null,
      subService: subService[0] || null
    }
  };
  
  console.log('Project with relationships:', JSON.stringify(projectWithRelationships, null, 2));
  return projectWithRelationships;
}

// Example 4: Get Statistics by Strategic Framework
async function getFrameworkStatistics(sessionId) {
  console.log('=== Getting Framework Statistics ===');
  
  // Get all projects
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
  
  // Get all framework elements
  const goals = await getModuleEntries(sessionId, "ms_goal", ["id", "name"]);
  const pillars = await getModuleEntries(sessionId, "ms_pillar", ["id", "name"]);
  const services = await getModuleEntries(sessionId, "ms_service", ["id", "name"]);
  const subServices = await getModuleEntries(sessionId, "ms_subservice", ["id", "name"]);
  
  // Calculate statistics
  const statistics = {
    totalProjects: allProjects.length,
    totalBudget: allProjects.reduce((sum, p) => 
      sum + (parseFloat(p.budget_icesco) || 0) + 
      (parseFloat(p.budget_member_state) || 0) + 
      (parseFloat(p.budget_sponsorship) || 0), 0
    ),
    byGoal: {},
    byPillar: {},
    byService: {},
    bySubService: {}
  };
  
  // Count projects by goal
  goals.forEach(goal => {
    const goalProjects = allProjects.filter(p => p.strategic_goal_id === goal.id);
    statistics.byGoal[goal.name] = {
      id: goal.id,
      count: goalProjects.length,
      totalBudget: goalProjects.reduce((sum, p) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  // Count projects by pillar
  pillars.forEach(pillar => {
    const pillarProjects = allProjects.filter(p => p.pillar_id === pillar.id);
    statistics.byPillar[pillar.name] = {
      id: pillar.id,
      count: pillarProjects.length,
      totalBudget: pillarProjects.reduce((sum, p) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  // Count projects by service
  services.forEach(service => {
    const serviceProjects = allProjects.filter(p => p.service_id === service.id);
    statistics.byService[service.name] = {
      id: service.id,
      count: serviceProjects.length,
      totalBudget: serviceProjects.reduce((sum, p) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  // Count projects by sub-service
  subServices.forEach(subService => {
    const subServiceProjects = allProjects.filter(p => p.sub_service_id === subService.id);
    statistics.bySubService[subService.name] = {
      id: subService.id,
      count: subServiceProjects.length,
      totalBudget: subServiceProjects.reduce((sum, p) => 
        sum + (parseFloat(p.budget_icesco) || 0) + 
        (parseFloat(p.budget_member_state) || 0) + 
        (parseFloat(p.budget_sponsorship) || 0), 0
      )
    };
  });
  
  console.log('Framework Statistics:', JSON.stringify(statistics, null, 2));
  return statistics;
}

// Example 5: Search Projects by Criteria
async function searchProjects(sessionId, criteria) {
  console.log('=== Searching Projects by Criteria ===');
  
  let query = '';
  const conditions = [];
  
  if (criteria.goalId) {
    conditions.push(`strategic_goal_id='${criteria.goalId}'`);
  }
  
  if (criteria.pillarId) {
    conditions.push(`pillar_id='${criteria.pillarId}'`);
  }
  
  if (criteria.serviceId) {
    conditions.push(`service_id='${criteria.serviceId}'`);
  }
  
  if (criteria.subServiceId) {
    conditions.push(`sub_service_id='${criteria.subServiceId}'`);
  }
  
  if (criteria.projectType) {
    conditions.push(`project_type='${criteria.projectType}'`);
  }
  
  if (criteria.deliveryModality) {
    conditions.push(`delivery_modality='${criteria.deliveryModality}'`);
  }
  
  if (criteria.geographicScope) {
    conditions.push(`geographic_scope='${criteria.geographicScope}'`);
  }
  
  if (criteria.minBudget) {
    conditions.push(`(budget_icesco + budget_member_state + budget_sponsorship) >= ${criteria.minBudget}`);
  }
  
  if (criteria.maxBudget) {
    conditions.push(`(budget_icesco + budget_member_state + budget_sponsorship) <= ${criteria.maxBudget}`);
  }
  
  if (criteria.startDate) {
    conditions.push(`date_start >= '${criteria.startDate}'`);
  }
  
  if (criteria.endDate) {
    conditions.push(`date_end <= '${criteria.endDate}'`);
  }
  
  if (conditions.length > 0) {
    query = conditions.join(' AND ');
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
  
  console.log(`Found ${projects.length} projects matching criteria:`, projects);
  return projects;
}

// Example 6: Export Project Data with Relationships
async function exportProjectData(sessionId, format = 'json') {
  console.log('=== Exporting Project Data ===');
  
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
    ]
  );
  
  // Transform data for export
  const exportData = projects.map(project => ({
    projectId: project.id,
    projectName: project.name,
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
    comments: project.comments
  }));
  
  if (format === 'json') {
    console.log('Export Data (JSON):', JSON.stringify(exportData, null, 2));
    return exportData;
  } else if (format === 'csv') {
    // Convert to CSV format
    const csvHeaders = [
      'Project ID', 'Project Name', 'Description',
      'Goal ID', 'Goal Name', 'Pillar ID', 'Pillar Name',
      'Service ID', 'Service Name', 'Sub-Service ID', 'Sub-Service Name',
      'Contact Name', 'Contact Email', 'Contact Phone', 'Contact Role',
      'Budget ICESCO', 'Budget Member State', 'Budget Sponsorship', 'Total Budget',
      'Start Date', 'End Date', 'Frequency',
      'Delivery Modality', 'Geographic Scope', 'Project Type',
      'Beneficiaries', 'Partners', 'Milestones', 'KPIs', 'Comments'
    ];
    
    const csvRows = exportData.map(project => [
      project.projectId,
      project.projectName,
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
      project.comments
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    console.log('Export Data (CSV):', csvContent);
    return csvContent;
  }
  
  return exportData;
}

// Example usage
async function main() {
  try {
    // Get session ID
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Example 1: Get complete strategic framework
    const framework = await getStrategicFramework(sessionId);
    
    // Example 2: Get projects by goal
    const goalProjects = await getProjectsByFramework(sessionId, 'goal', '1915ff7b-ece8-11f5-63bd-68be9e0244bc');
    
    // Example 3: Get specific project with relationships
    const projectWithRelations = await getProjectWithRelationships(sessionId, 'project_id_here');
    
    // Example 4: Get framework statistics
    const statistics = await getFrameworkStatistics(sessionId);
    
    // Example 5: Search projects
    const searchResults = await searchProjects(sessionId, {
      projectType: 'Workshop',
      deliveryModality: 'Physical',
      minBudget: 10000
    });
    
    // Example 6: Export data
    const exportData = await exportProjectData(sessionId, 'json');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

export {
  getStrategicFramework,
  getProjectsByFramework,
  getProjectWithRelationships,
  getFrameworkStatistics,
  searchProjects,
  exportProjectData
};


