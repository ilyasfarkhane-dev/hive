"use client";
import { useState } from 'react';

export interface SuggestionData {
  name?: string;
  description?: string;
  brief?: string;
  problemStatement?: string;
  rationale?: string;
  budgetIcesco?: number;
  budgetMemberState?: number;
  budgetSponsorship?: number;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  deliveryModality?: string;
  geographicScope?: string;
  projectType?: string;
  beneficiaries?: string[];
  milestone1?: string;
  milestone2?: string;
  milestone3?: string;
  kpi1?: string;
  kpi2?: string;
  kpi3?: string;
  partner1?: string;
  partner2?: string;
  partner3?: string;
  additionalComments?: string;
}

export interface SuggestionSubmissionResult {
  success: boolean;
  suggestionId?: string;
  contactId?: string;
  subserviceId?: string;
  message?: string;
  error?: string;
}

export const useSuggestionSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SuggestionSubmissionResult | null>(null);

  const submitSuggestion = async (
    subserviceId: string, 
    suggestionData: SuggestionData
  ): Promise<SuggestionSubmissionResult> => {
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      console.log('=== DEBUG: Submitting Project Suggestion ===');
      console.log('Subservice ID:', subserviceId);
      console.log('Suggestion Data:', suggestionData);

      // Get contact info from localStorage
      const contactInfo = JSON.parse(localStorage.getItem('contactInfo') || '{}');
      
      // Check for multilingual objects in contact info
      console.log('=== DEBUG: Checking Contact Info for Multilingual Objects ===');
      Object.keys(contactInfo).forEach(key => {
        if (typeof contactInfo[key] === 'object' && contactInfo[key] !== null) {
          console.log(`Multilingual object found in contactInfo.${key}:`, contactInfo[key]);
        }
      });
      
      const response = await fetch('/api/submit-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subserviceId,
          projectData: suggestionData,
          contactInfo: contactInfo // Include contact info from localStorage
        }),
      });

      const result = await response.json();
      console.log('Submission result:', result);
      
      // Check for multilingual objects in the result
      console.log('=== DEBUG: Checking Result for Multilingual Objects ===');
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'object' && result[key] !== null) {
          console.log(`Multilingual object found in result.${key}:`, result[key]);
        }
      });

      if (result.success) {
        setSubmissionResult({
          success: true,
          suggestionId: result.suggestionId,
          contactId: result.contactId,
          subserviceId: result.subserviceId,
          message: result.message
        });
      } else {
        setSubmissionResult({
          success: false,
          error: result.error || 'Submission failed'
        });
      }

      return result;
    } catch (error) {
      console.error('Suggestion submission error:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setSubmissionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearResult = () => {
    setSubmissionResult(null);
  };

  return {
    isSubmitting,
    submissionResult,
    submitSuggestion,
    clearResult
  };
};
