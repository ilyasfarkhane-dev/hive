"use client";
import { useState, useEffect } from 'react';
import { getStoredContactInfo } from '@/utils/contactStorage';

export interface CRMProject {
  id: string;
  name: string;
  description: string;
  brief?: string;
  problem_statement: string;
  budget_icesco: number;
  budget_member_state: number;
  budget_sponsorship: number;
  start_date: string;
  end_date: string;
  frequency: string;
  delivery_modality: string;
  geographic_scope: string;
  project_type: string;
  beneficiaries: string;
  subservice_name: string;
  subservice_id: string;
  contact_name: string;
  contact_id: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  account_name: string;
  account_id: string;
  strategic_goal?: string;
  pillar?: string;
  service?: string;
  sub_service?: string;
  supporting_documents?: string[];
  created_at: string;
  modified_at: string;
  status?: string;
  source: 'crm';
}

export interface ContactProjectsResult {
  success: boolean;
  projects: CRMProject[];
  total: number;
  message?: string;
  error?: string;
}

export const useContactProjects = () => {
  const [projects, setProjects] = useState<CRMProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContactProjects = async (): Promise<ContactProjectsResult> => {
    setLoading(true);
    setError(null);

    try {
      // Get contact info from localStorage
      const contactInfo = getStoredContactInfo();
      if (!contactInfo || !contactInfo.id) {
        throw new Error('No contact information found. Please log in again.');
      }

      console.log('Fetching projects for contact:', contactInfo.id);

      const response = await fetch('/api/get-contact-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: contactInfo.id
        }),
      });

      const result = await response.json();
      console.log('Contact projects result:', result);

      if (result.success) {
        console.log(`Found ${result.projects.length} projects from CRM`);
        setProjects(result.projects);
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch projects');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching contact projects:', error);
      return {
        success: false,
        projects: [],
        total: 0,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchContactProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchContactProjects,
    refetch: fetchContactProjects
  };
};
