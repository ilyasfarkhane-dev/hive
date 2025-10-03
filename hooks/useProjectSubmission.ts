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
  expected_outputs: string;
  kpis: string[];
  
  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  contact_id?: string;
  
  // Account information
  account_id?: string;
  account_name?: string;
  
  // Additional info
  comments?: string;
  supporting_documents?: File[];
  status?: string;
}

export interface SubmissionResult {
  success: boolean;
  projectId?: string;
  error?: string;
  message?: string;
  retryCount?: number;
  maxRetries?: number;
  canRetry?: boolean;
  errorType?: string;
  errors?: string[];
}

export const useProjectSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { sessionId } = useAuth();
  const { currentLanguage } = useI18n();
  const { logProjectSubmission } = useProjectSubmissionLogging();
  const { logProjects, refreshData } = useSessionTracking();

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays in ms

  // Helper function to delay execution
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Retry function for failed submissions - runs automatically in background
  const retrySubmission = async (projectData: ProjectSubmissionData): Promise<SubmissionResult> => {
    if (retryCount >= MAX_RETRIES) {
      const errorResult = {
        success: false,
        error: `Submission failed after ${MAX_RETRIES} attempts. Please check your connection and try again later.`,
        retryCount,
        maxRetries: MAX_RETRIES,
        canRetry: false,
      };
      setSubmissionResult(errorResult);
      return errorResult;
    }

    // Keep retrying state but don't show attempt messages to user
    setIsRetrying(true);
    const currentRetry = retryCount + 1;
    setRetryCount(currentRetry);

    // Only log to console, don't show to user
    console.log(`🔄 Retrying submission (attempt ${currentRetry}/${MAX_RETRIES})...`);
    
    // Wait for exponential backoff delay
    const delayMs = RETRY_DELAYS[Math.min(currentRetry - 1, RETRY_DELAYS.length - 1)];
    await delay(delayMs);

    // Call the actual submission function
    const result = await performSubmission(projectData);
    
    if (result.success) {
      setRetryCount(0); // Reset retry count on success
      setIsRetrying(false);
      // Show success message to user
      setSubmissionResult({
        success: true,
        projectId: result.projectId,
        message: result.message,
      });
    } else if (currentRetry < MAX_RETRIES) {
      // If still failing and we have retries left, continue retrying automatically
      return await retrySubmission(projectData);
    } else {
      // Max retries reached - show final error to user
      const finalResult = {
        ...result,
        retryCount: currentRetry,
        maxRetries: MAX_RETRIES,
        canRetry: false,
      };
      setSubmissionResult(finalResult);
      setIsRetrying(false);
      return finalResult;
    }

    return result;
  };

  // Actual submission logic (extracted from submitProject)
  const performSubmission = async (projectData: ProjectSubmissionData): Promise<SubmissionResult> => {
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

    try {
      // Prepare data for submission
      const submissionData = {
        ...projectData,
        session_id: sessionId,
        language: currentLanguage,
        submission_date: new Date().toISOString(),
        status: 'Published', // Set status to Published by default
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
      
      // Parse response first to check error type
      const result = await response.json();
      console.log('API response:', result);
      
      // Don't throw error for validation failures - return them directly
      if (!response.ok) {
        // Check if this is a validation error (don't retry these)
        if (result.errorType === 'VALIDATION_ERROR') {
          console.error('Validation error - will not retry:', result.errors);
          return {
            success: false,
            error: result.error || 'Validation failed',
            errorType: 'VALIDATION_ERROR',
            errors: result.errors,
            canRetry: false // Prevent retry for validation errors
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (result.success) {
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
      return errorResult;
    }
  };

  // Main submission function with retry logic
  const submitProject = async (projectData: ProjectSubmissionData): Promise<SubmissionResult> => {
    setIsSubmitting(true);
    setSubmissionResult(null);
    setRetryCount(0);

    try {
      const result = await performSubmission(projectData);
      
      if (result.success) {
        setSubmissionResult({
          success: true,
          projectId: result.projectId,
          message: result.message,
        });
      } else {
        // Check if this error should be retried (don't retry validation errors)
        const shouldRetry = result.canRetry !== false && retryCount < MAX_RETRIES;
        
        // If submission failed, try retry logic automatically (unless it's a validation error)
        if (shouldRetry) {
          console.log(`🔄 Initial submission failed, attempting automatic retry...`);
          return await retrySubmission(projectData);
        } else {
          const errorResult = {
            ...result,
            retryCount: 0,
            maxRetries: MAX_RETRIES,
            canRetry: result.canRetry !== false ? true : false,
          };
          setSubmissionResult(errorResult);
        }
      }

      return result;
    } catch (error) {
      console.error('Project submission error:', error);
      
      // Try automatic retry on network/connection errors
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Network error occurred, attempting automatic retry...`);
        return await retrySubmission(projectData);
      } else {
        const errorResult = {
          success: false,
          error: `Failed to submit project. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryCount: 0,
          maxRetries: MAX_RETRIES,
          canRetry: true,
        };
        setSubmissionResult(errorResult);
        return errorResult;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAsDraft = async (projectData: ProjectSubmissionData): Promise<SubmissionResult> => {
    console.log('=== DRAFT SAVE DEBUG ===');
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
      // Prepare data for draft submission
      const submissionData = {
        ...projectData,
        session_id: sessionId,
        language: currentLanguage,
        submission_date: new Date().toISOString(),
        status: 'Draft', // Set status to Draft
      };

      // Log the draft submission
      logProjectSubmission(submissionData);

      console.log('Sending draft request to /api/submit-project-simple...');
      const response = await fetch('/api/submit-project-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      console.log('Draft response status:', response.status);
      
      const result = await response.json();
      console.log('Draft API response:', result);

      if (result.success) {
        setSubmissionResult({
          success: true,
          projectId: result.projectId,
          message: result.message || 'Project saved as draft successfully',
        });
        
        console.log('=== DRAFT SAVE SUCCESSFUL ===');
        console.log('Project saved as draft with ID:', result.projectId);
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
      console.error('Draft save error:', error);
      const errorResult = {
        success: false,
        error: `Failed to save draft. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setSubmissionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setSubmissionResult(null);
    setRetryCount(0);
    setIsRetrying(false);
  };

  const updateProject = async (projectData: ProjectSubmissionData & { id: string }): Promise<SubmissionResult> => {
    console.log('=== PROJECT UPDATE DEBUG ===');
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
      // Prepare data for update
      const updateData = {
        ...projectData,
        session_id: sessionId,
        language: currentLanguage,
        updated_date: new Date().toISOString(),
        // Preserve the status field (Draft or Published)
        status: projectData.status || 'Draft',
      };

      // Log the project update
      logProjectSubmission(updateData);

      console.log('Sending update request to /api/update-project...');
      const response = await fetch('/api/update-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Update response status:', response.status);
      
      const result = await response.json();
      console.log('Update API response:', result);

      if (result.success) {
        setSubmissionResult({
          success: true,
          projectId: result.projectId,
          message: result.message || 'Project updated successfully',
        });

        // Refresh data after successful update
        refreshData();

        return {
          success: true,
          projectId: result.projectId,
          message: result.message || 'Project updated successfully',
        };
      } else {
        const errorMessage = result.error || 'Failed to update project';
        console.error('Update failed:', errorMessage);
        
        setSubmissionResult({
          success: false,
          error: errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage = `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Update error:', errorMessage);
      
      setSubmissionResult({
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitProject,
    saveAsDraft,
    updateProject,
    retrySubmission,
    isSubmitting,
    isRetrying,
    submissionResult,
    setSubmissionResult, // Added for draft success message
    retryCount,
    maxRetries: MAX_RETRIES,
    resetSubmission,
  };
};
