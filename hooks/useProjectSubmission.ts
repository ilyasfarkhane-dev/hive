"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nProvider';
import { useProjectSubmissionLogging, useSessionTracking } from './useSessionTracking';

export interface ProjectSubmissionData {
  // Basic project info
  name: string;
  description: string;
  project_brief: string;
  problem_statement: string;
  rationale_impact: string;
  
  // Strategic selections
  strategic_goal: string;
  strategic_goal_id: string;
  pillar: string;
  pillar_id: string;
  service: string;
  service_id: string;
  sub_service: string;
  sub_service_id: string;
  
  // Beneficiaries
  beneficiaries: string[];
  other_beneficiaries?: string;
  
  // Budget and timeline
  budget_icesco: number;
  budget_member_state: number;
  budget_sponsorship: number;
  start_date: string;
  end_date: string;
  frequency: string;
  frequency_duration?: string;
  
  // Partners and scope
  partners: string[];
  institutions: string[];
  delivery_modality: string;
  geographic_scope: string;
  convening_method: string;
  project_type: string;
  project_type_other?: string;
  
  // Monitoring and evaluation
  milestones: string[];
  expected_outputs: string[];
  kpis: string[];
  
  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  contact_id?: string;
  
  // Additional info
  comments?: string;
  supporting_documents?: File[];
}

export interface SubmissionResult {
  success: boolean;
  projectId?: string;
  error?: string;
  message?: string;
}

export const useProjectSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const { sessionId } = useAuth();
  const { currentLanguage } = useI18n();
  const { logProjectSubmission } = useProjectSubmissionLogging();
  const { logProjects, refreshData } = useSessionTracking();

  const submitProject = async (projectData: ProjectSubmissionData): Promise<SubmissionResult> => {
    console.log('=== PROJECT SUBMISSION DEBUG ===');
    console.log('Session ID:', sessionId);
    console.log('Project Data:', projectData);
    console.log('Current Language:', currentLanguage);
    
    if (!sessionId) {
      console.error('No session ID found - user not authenticated');
      return {
        success: false,
        error: 'No active session found. Please log in again.',
      };
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Prepare data for submission
      const submissionData = {
        ...projectData,
        session_id: sessionId,
        language: currentLanguage,
        submission_date: new Date().toISOString(),
      };

      // Log the project submission
      logProjectSubmission(submissionData);

      console.log('Sending request to /api/submit-project-simple...');
      console.log('Current window location:', window.location.href);
      const response = await fetch('/api/submit-project-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);

      if (result.success) {
        setSubmissionResult({
          success: true,
          projectId: result.projectId,
          message: result.message,
        });
        
        // Log all projects after successful submission
        console.log('=== PROJECT SUBMISSION SUCCESSFUL ===');
        console.log('New project submitted successfully!');
        console.log('Project ID:', result.projectId);
        console.log('Project Name:', projectData.name);
        console.log('Session ID:', sessionId);
        console.log('=====================================');
        
        // Refresh data and log all projects
        try {
          await refreshData();
          console.log('=== ALL YOUR PROJECTS ===');
          logProjects();
          console.log('========================');
        } catch (error) {
          console.error('Error refreshing project data:', error);
        }
      } else {
        setSubmissionResult({
          success: false,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      console.error('Project submission error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        projectData: projectData,
        sessionId: sessionId
      });
      const errorResult = {
        success: false,
        error: `Failed to submit project. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setSubmissionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setSubmissionResult(null);
  };

  return {
    submitProject,
    isSubmitting,
    submissionResult,
    resetSubmission,
  };
};
