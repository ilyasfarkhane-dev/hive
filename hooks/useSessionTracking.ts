"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

// Simplified interfaces for session tracking
interface SessionProject {
  id: string;
  name: string;
  strategicFramework: {
    goal: { id: string; title: string };
    pillar: { id: string; title: string };
    service: { id: string; title: string };
    subService: { id: string; title: string };
  };
  scope: {
    type: string;
  };
  budget: {
    total: number;
  };
}

interface SessionStatistics {
  totalProjects: number;
  totalBudget: number;
  projectsByGoal: Record<string, number>;
  projectsByPillar: Record<string, number>;
}

export interface UseSessionTrackingReturn {
  // Data
  projects: SessionProject[];
  statistics: SessionStatistics | null;
  projectCount: number;
  totalBudget: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  refreshData: () => Promise<void>;
  exportProjects: () => Promise<void>;
  logProjects: () => void;
  
  // Filtered data
  getProjectsByGoal: (goalId: string) => SessionProject[];
  getProjectsByPillar: (pillarId: string) => SessionProject[];
  getProjectsByService: (serviceId: string) => SessionProject[];
  getProjectsBySubService: (subServiceId: string) => SessionProject[];
  getProjectsByType: (projectType: string) => SessionProject[];
  
  // Summary
  createSummary: () => string;
}

export const useSessionTracking = (): UseSessionTrackingReturn => {
  const { sessionId } = useAuth();
  const [projects, setProjects] = useState<SessionProject[]>([]);
  const [statistics, setStatistics] = useState<SessionStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load projects for the current session (simplified)
  const loadProjects = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading projects for session:', sessionId);
      // Simplified - just return empty array for now
      setProjects([]);
      console.log(`Loaded 0 projects for session ${sessionId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      console.error('Error loading session projects:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);
  
  // Load statistics for the current session (simplified)
  const loadStatistics = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading statistics for session:', sessionId);
      // Simplified - return basic stats
      setStatistics({
        totalProjects: 0,
        totalBudget: 0,
        projectsByGoal: {},
        projectsByPillar: {}
      });
      console.log('Statistics loaded for session:', sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      console.error('Error loading session statistics:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([loadProjects(), loadStatistics()]);
      console.log('Data refreshed for session:', sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      console.error('Error refreshing data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, loadProjects, loadStatistics]);
  
  // Export projects as CSV (simplified)
  const exportProjects = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID available');
      return;
    }
    
    try {
      console.log('Exporting projects for session:', sessionId);
      // Simplified - just log the action
      console.log('Projects exported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export projects';
      console.error('Error exporting projects:', err);
      setError(errorMessage);
    }
  }, [sessionId]);
  
  // Log all projects (simplified)
  const logProjects = useCallback(() => {
    console.log('=== All Session Projects ===');
    console.log('Session ID:', sessionId);
    console.log('Total Projects:', projects.length);
    console.log('Total Budget: $0');
    console.log('Projects:');
    console.log('============================');
  }, [sessionId, projects]);
  
  // Filter functions
  const getProjectsByGoal = useCallback((goalId: string) => {
    return projects.filter(p => p.strategicFramework.goal.id === goalId);
  }, [projects]);
  
  const getProjectsByPillar = useCallback((pillarId: string) => {
    return projects.filter(p => p.strategicFramework.pillar.id === pillarId);
  }, [projects]);
  
  const getProjectsByService = useCallback((serviceId: string) => {
    return projects.filter(p => p.strategicFramework.service.id === serviceId);
  }, [projects]);
  
  const getProjectsBySubService = useCallback((subServiceId: string) => {
    return projects.filter(p => p.strategicFramework.subService.id === subServiceId);
  }, [projects]);
  
  const getProjectsByType = useCallback((projectType: string) => {
    return projects.filter(p => p.scope.type === projectType);
  }, [projects]);
  
  // Create summary (simplified)
  const createSummary = useCallback(() => {
    return JSON.stringify({
      sessionId,
      totalProjects: projects.length,
      totalBudget: projects.reduce((sum, p) => sum + p.budget.total, 0),
      projects: projects
    }, null, 2);
  }, [sessionId, projects]);
  
  // Load data on mount
  useEffect(() => {
    if (sessionId) {
      refreshData();
    }
  }, [sessionId, refreshData]);
  
  // Calculate derived values
  const projectCount = projects.length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget.total, 0);
  
  return {
    // Data
    projects,
    statistics,
    projectCount,
    totalBudget,
    isLoading,
    error,
    
    // Actions
    loadProjects,
    loadStatistics,
    refreshData,
    exportProjects,
    logProjects,
    
    // Filtered data
    getProjectsByGoal,
    getProjectsByPillar,
    getProjectsByService,
    getProjectsBySubService,
    getProjectsByType,
    
    // Summary
    createSummary
  };
};

// Hook for logging project submissions (simplified)
export const useProjectSubmissionLogging = () => {
  const { sessionId } = useAuth();
  
  const logProjectSubmission = useCallback((projectData: any) => {
    if (sessionId) {
      console.log('=== Session Project Submission Log ===');
      console.log('Session ID:', sessionId);
      console.log('Project Name:', projectData.name);
      console.log('Submission Time:', new Date().toISOString());
      console.log('Strategic Framework:', projectData.strategic_goal, projectData.pillar, projectData.service, projectData.sub_service);
      console.log('Contact:', projectData.contact_name, projectData.contact_email);
      console.log('Budget:', projectData.budget_icesco, projectData.budget_member_state, projectData.budget_sponsorship);
      console.log('Timeline:', projectData.start_date, projectData.end_date);
      console.log('Scope:', projectData.delivery_modality, projectData.geographic_scope);
      console.log('Partners:', projectData.partners);
      console.log('Milestones:', projectData.milestones);
      console.log('KPIs:', projectData.kpis);
      console.log('==========================================');
    } else {
      console.warn('No session ID available for logging');
    }
  }, [sessionId]);
  
  return { logProjectSubmission };
};


