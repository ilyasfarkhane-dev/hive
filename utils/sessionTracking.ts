/**
 * Session-based Project Tracking Utilities
 * Handles tracking and logging of projects submitted by session_id
 */

export interface SessionProject {
  id: string;
  name: string;
  description: string;
  strategicFramework: {
    goal: { id: string; name: string };
    pillar: { id: string; name: string };
    service: { id: string; name: string };
    subService: { id: string; name: string };
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  budget: {
    icesco: number;
    memberState: number;
    sponsorship: number;
    total: number;
  };
  timeline: {
    start: string;
    end: string;
    frequency: string;
  };
  scope: {
    delivery: string;
    geographic: string;
    type: string;
  };
  beneficiaries: string[];
  partners: string[];
  milestones: string[];
  kpis: string[];
  expectedOutputs: string;
  comments: string;
  sessionId: string;
  language: string;
  submissionDate: string;
}

export interface SessionStatistics {
  sessionId: string;
  totalProjects: number;
  totalBudget: number;
  averageBudget: number;
  byGoal: { [key: string]: { count: number; totalBudget: number } };
  byPillar: { [key: string]: { count: number; totalBudget: number } };
  byService: { [key: string]: { count: number; totalBudget: number } };
  bySubService: { [key: string]: { count: number; totalBudget: number } };
  byProjectType: { [key: string]: number };
  byDeliveryModality: { [key: string]: number };
  byGeographicScope: { [key: string]: number };
  submissionTimeline: Array<{
    projectId: string;
    submissionDate: string;
    projectName: string;
  }>;
}

/**
 * Get all projects submitted by a specific session_id
 */
export async function getSessionProjects(sessionId: string): Promise<SessionProject[]> {
  try {
    console.log('=== Getting Session Projects ===');
    console.log('Session ID:', sessionId);
    
    const response = await fetch(`/api/session-projects?session_id=${sessionId}&action=list`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get session projects');
    }
    
    console.log(`Retrieved ${data.count} projects for session ${sessionId}`);
    return data.data;
  } catch (error) {
    console.error('Error getting session projects:', error);
    throw error;
  }
}

/**
 * Get project count for a specific session_id
 */
export async function getSessionProjectCount(sessionId: string): Promise<number> {
  try {
    console.log('=== Getting Session Project Count ===');
    console.log('Session ID:', sessionId);
    
    const response = await fetch(`/api/session-projects?session_id=${sessionId}&action=count`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get session project count');
    }
    
    console.log(`Project count for session ${sessionId}: ${data.projectCount}`);
    return data.projectCount;
  } catch (error) {
    console.error('Error getting session project count:', error);
    throw error;
  }
}

/**
 * Get statistics for a specific session_id
 */
export async function getSessionStatistics(sessionId: string): Promise<SessionStatistics> {
  try {
    console.log('=== Getting Session Statistics ===');
    console.log('Session ID:', sessionId);
    
    const response = await fetch(`/api/session-projects?session_id=${sessionId}&action=statistics`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get session statistics');
    }
    
    console.log('Session statistics retrieved:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error getting session statistics:', error);
    throw error;
  }
}

/**
 * Export projects for a specific session_id as CSV
 */
export async function exportSessionProjects(sessionId: string): Promise<Blob> {
  try {
    console.log('=== Exporting Session Projects ===');
    console.log('Session ID:', sessionId);
    
    const response = await fetch(`/api/session-projects?session_id=${sessionId}&action=export`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvBlob = await response.blob();
    console.log('CSV export completed for session:', sessionId);
    return csvBlob;
  } catch (error) {
    console.error('Error exporting session projects:', error);
    throw error;
  }
}

/**
 * Log session project submission
 */
export function logSessionProjectSubmission(sessionId: string, projectData: any) {
  console.log('=== Session Project Submission Log ===');
  console.log('Session ID:', sessionId);
  console.log('Project Name:', projectData.name);
  console.log('Submission Time:', new Date().toISOString());
  console.log('Strategic Framework:', {
    goal: projectData.strategic_goal,
    goalId: projectData.strategic_goal_id,
    pillar: projectData.pillar,
    pillarId: projectData.pillar_id,
    service: projectData.service,
    serviceId: projectData.service_id,
    subService: projectData.sub_service,
    subServiceId: projectData.sub_service_id
  });
  console.log('Contact:', {
    name: projectData.contact_name,
    email: projectData.contact_email,
    phone: projectData.contact_phone,
    role: projectData.contact_role
  });
  console.log('Budget:', {
    icesco: projectData.budget_icesco,
    memberState: projectData.budget_member_state,
    sponsorship: projectData.budget_sponsorship,
    total: (parseFloat(projectData.budget_icesco) || 0) + 
           (parseFloat(projectData.budget_member_state) || 0) + 
           (parseFloat(projectData.budget_sponsorship) || 0)
  });
  console.log('Timeline:', {
    start: projectData.start_date,
    end: projectData.end_date,
    frequency: projectData.frequency
  });
  console.log('Scope:', {
    delivery: projectData.delivery_modality,
    geographic: projectData.geographic_scope,
    type: projectData.project_type
  });
  console.log('Partners:', projectData.partners);
  console.log('Milestones:', projectData.milestones);
  console.log('KPIs:', projectData.kpis);
  console.log('==========================================');
}

/**
 * Create session project summary
 */
export function createSessionProjectSummary(sessionId: string, projects: SessionProject[]): string {
  const summary = {
    sessionId: sessionId,
    totalProjects: projects.length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget.total, 0),
    averageBudget: projects.length > 0 ? projects.reduce((sum, p) => sum + p.budget.total, 0) / projects.length : 0,
    projectNames: projects.map(p => p.name),
    strategicGoals: Array.from(new Set(projects.map(p => p.strategicFramework.goal.name))),
    pillars: Array.from(new Set(projects.map(p => p.strategicFramework.pillar.name))),
    services: Array.from(new Set(projects.map(p => p.strategicFramework.service.name))),
    subServices: Array.from(new Set(projects.map(p => p.strategicFramework.subService.name))),
    projectTypes: Array.from(new Set(projects.map(p => p.scope.type))),
    deliveryModalities: Array.from(new Set(projects.map(p => p.scope.delivery))),
    geographicScopes: Array.from(new Set(projects.map(p => p.scope.geographic))),
    submissionDates: projects.map(p => p.submissionDate).sort(),
    firstSubmission: projects.length > 0 ? projects[0].submissionDate : null,
    lastSubmission: projects.length > 0 ? projects[projects.length - 1].submissionDate : null
  };
  
  console.log('=== Session Project Summary ===');
  console.log(JSON.stringify(summary, null, 2));
  
  return JSON.stringify(summary, null, 2);
}

/**
 * Track session project activity
 */
export class SessionProjectTracker {
  private sessionId: string;
  private projects: SessionProject[] = [];
  private statistics: SessionStatistics | null = null;
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }
  
  /**
   * Load projects for this session
   */
  async loadProjects(): Promise<void> {
    try {
      this.projects = await getSessionProjects(this.sessionId);
      console.log(`Loaded ${this.projects.length} projects for session ${this.sessionId}`);
    } catch (error) {
      console.error('Error loading session projects:', error);
      throw error;
    }
  }
  
  /**
   * Load statistics for this session
   */
  async loadStatistics(): Promise<void> {
    try {
      this.statistics = await getSessionStatistics(this.sessionId);
      console.log(`Loaded statistics for session ${this.sessionId}`);
    } catch (error) {
      console.error('Error loading session statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get projects
   */
  getProjects(): SessionProject[] {
    return this.projects;
  }
  
  /**
   * Get statistics
   */
  getStatistics(): SessionStatistics | null {
    return this.statistics;
  }
  
  /**
   * Get project count
   */
  getProjectCount(): number {
    return this.projects.length;
  }
  
  /**
   * Get total budget
   */
  getTotalBudget(): number {
    return this.projects.reduce((sum, p) => sum + p.budget.total, 0);
  }
  
  /**
   * Get projects by strategic goal
   */
  getProjectsByGoal(goalId: string): SessionProject[] {
    return this.projects.filter(p => p.strategicFramework.goal.id === goalId);
  }
  
  /**
   * Get projects by pillar
   */
  getProjectsByPillar(pillarId: string): SessionProject[] {
    return this.projects.filter(p => p.strategicFramework.pillar.id === pillarId);
  }
  
  /**
   * Get projects by service
   */
  getProjectsByService(serviceId: string): SessionProject[] {
    return this.projects.filter(p => p.strategicFramework.service.id === serviceId);
  }
  
  /**
   * Get projects by sub-service
   */
  getProjectsBySubService(subServiceId: string): SessionProject[] {
    return this.projects.filter(p => p.strategicFramework.subService.id === subServiceId);
  }
  
  /**
   * Get projects by project type
   */
  getProjectsByType(projectType: string): SessionProject[] {
    return this.projects.filter(p => p.scope.type === projectType);
  }
  
  /**
   * Export projects as CSV
   */
  async exportAsCSV(): Promise<Blob> {
    return await exportSessionProjects(this.sessionId);
  }
  
  /**
   * Create summary
   */
  createSummary(): string {
    return createSessionProjectSummary(this.sessionId, this.projects);
  }
  
  /**
   * Log all projects
   */
  logAllProjects(): void {
    console.log('=== All Session Projects ===');
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Total Projects: ${this.projects.length}`);
    console.log(`Total Budget: $${this.getTotalBudget().toLocaleString()}`);
    console.log('Projects:');
    this.projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (${project.id})`);
      console.log(`   Strategic Framework: ${project.strategicFramework.goal.name} → ${project.strategicFramework.pillar.name} → ${project.strategicFramework.service.name} → ${project.strategicFramework.subService.name}`);
      console.log(`   Budget: $${project.budget.total.toLocaleString()}`);
      console.log(`   Type: ${project.scope.type}`);
      console.log(`   Submission: ${project.submissionDate}`);
    });
    console.log('=============================');
  }
}


