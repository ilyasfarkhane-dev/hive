"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  SessionProject, 
  SessionStatistics, 
  SessionProjectTracker,
  getSessionProjects,
  getSessionProjectCount,
  getSessionStatistics,
  exportSessionProjects,
  logSessionProjectSubmission
} from '@/utils/sessionTracking';

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
  
  const tracker = sessionId ? new SessionProjectTracker(sessionId) : null;
  
  // Load projects for the current session
  const loadProjects = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading projects for session:', sessionId);
      const sessionProjects = await getSessionProjects(sessionId);
      setProjects(sessionProjects);
      console.log(`Loaded ${sessionProjects.length} projects for session ${sessionId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      console.error('Error loading session projects:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);
  
  // Load statistics for the current session
  const loadStatistics = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading statistics for session:', sessionId);
      const sessionStats = await getSessionStatistics(sessionId);
      setStatistics(sessionStats);
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
  
  // Export projects as CSV
  const exportProjects = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID available');
      return;
    }
    
    try {
      console.log('Exporting projects for session:', sessionId);
      const csvBlob = await exportSessionProjects(sessionId);
      
      // Create download link
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session_${sessionId}_projects.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Projects exported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export projects';
      console.error('Error exporting projects:', err);
      setError(errorMessage);
    }
  }, [sessionId]);
  
  // Log all projects
  const logProjects = useCallback(() => {
    if (tracker) {
      tracker.logAllProjects();
    } else {
      console.log('No tracker available');
    }
  }, [tracker]);
  
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
  
  // Create summary
  const createSummary = useCallback(() => {
    if (tracker) {
      return tracker.createSummary();
    }
    return JSON.stringify({ error: 'No tracker available' }, null, 2);
  }, [tracker]);
  
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

// Hook for logging project submissions
export const useProjectSubmissionLogging = () => {
  const { sessionId } = useAuth();
  
  const logProjectSubmission = useCallback((projectData: any) => {
    if (sessionId) {
      logSessionProjectSubmission(sessionId, projectData);
    } else {
      console.warn('No session ID available for logging');
    }
  }, [sessionId]);
  
  return { logProjectSubmission };
};


