/**
 * Utility functions for submitting project suggestions
 */

import { getStoredContactInfo } from './contactStorage';

export interface SimpleSuggestionData {
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

export interface SuggestionResult {
  success: boolean;
  suggestionId?: string;
  contactId?: string;
  subserviceId?: string;
  message?: string;
  error?: string;
}

/**
 * Submit a project suggestion using stored contact information
 * @param subserviceId - The subservice ID (e.g., 'ms_subservice_icesc_project_suggestions_1')
 * @param suggestionData - The project suggestion data
 * @returns Promise with submission result
 */
export async function submitProjectSuggestion(
  subserviceId: string,
  suggestionData: SimpleSuggestionData = {}
): Promise<SuggestionResult> {
  try {
    console.log('=== DEBUG: Submitting Project Suggestion ===');
    console.log('Subservice ID:', subserviceId);
    console.log('Suggestion Data:', suggestionData);

    // Get stored contact information
    const contactInfo = getStoredContactInfo();
    if (!contactInfo || !contactInfo.id) {
      console.error('No contact information found in localStorage');
      return {
        success: false,
        error: 'No contact information found. Please log in again.'
      };
    }

    console.log('Using stored contact ID:', contactInfo.id);

    // Submit to API
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

    return result;
  } catch (error) {
    console.error('Suggestion submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Quick submission with minimal data
 * @param subserviceId - The subservice ID
 * @param projectName - Project name
 * @param description - Project description
 * @returns Promise with submission result
 */
export async function quickSubmitSuggestion(
  subserviceId: string,
  projectName: string,
  description: string
): Promise<SuggestionResult> {
  return submitProjectSuggestion(subserviceId, {
    name: projectName,
    description: description,
    projectType: 'Other',
    deliveryModality: 'Hybrid',
    geographicScope: 'International',
    frequency: 'Onetime',
    beneficiaries: ['GeneralPublic']
  });
}
