import { useState, useEffect, useCallback } from 'react';

export interface CRMProject {
  id: string;
  name: string;
  description: string;
  project_brief: string;
  brief?: string; // Alternative name for project_brief
  problem_statement1_c: string;
  rationale_impact: string;
  
  // Strategic information
  strategic_goal: string;
  strategic_goal_id: string;
  pillar: string;
  pillar_id: string;
  service: string;
  service_id: string;
  sub_service: string;
  sub_service_id: string;
  subservice_code: string;
  subservice_name: string;
  
  // Status and dates
  status: string;
  created_at: string;
  date_entered: string;
  date_modified: string;
  
  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  contact_id: string;
  
  // Budget
  budget_icesco: number;
  budget_member_state: number;
  budget_sponsorship: number;
  
  // Timeline
  start_date: string;
  end_date: string;
  frequency: string;
  frequency_duration: string;
  
  // Additional fields
  beneficiaries: string[];
  other_beneficiaries: string;
  partners: string[];
  institutions: string[];
  delivery_modality: string;
  geographic_scope: string;
  convening_method: string;
  project_type: string;
  project_type_other: string;
  milestones: string[];
  expected_outputs: string;
  kpis: string[];
  comments: string;
  supporting_documents?: string[]; // Supporting documents array
  
  // CRM specific fields
  assigned_user_id: string;
  assigned_user_name: string;
  created_by: string;
  created_by_name: string;
  modified_user_id: string;
  modified_by_name: string;
}

export interface UseContactProjectsReturn {
  projects: CRMProject[];
  loading: boolean;
  error: string | null;
  errorType: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

export function useContactProjects(): UseContactProjectsReturn {
  const [projects, setProjects] = useState<CRMProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  // No caching - always fetch fresh data

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`=== FRONTEND: FETCHING CRM PROJECTS (Attempt ${attempt}/${maxRetries}) ===`);
        setLoading(true);
        setError(null);
        setErrorType(null);
        
        // Get contact ID from localStorage
        let contactId = null;
        try {
          const contactInfo = localStorage.getItem('contactInfo');
          if (contactInfo) {
            const parsedContact = JSON.parse(contactInfo);
            contactId = parsedContact.id;
            console.log('✅ Contact ID from localStorage:', contactId);
          } else {
            console.log('⚠️ No contactInfo found in localStorage');
          }
        } catch (error) {
          console.error('Error parsing contactInfo from localStorage:', error);
        }
        
        // Build URL with contact ID parameter only (backend will get fresh session)
        const params = new URLSearchParams();
        if (contactId) params.append('contact_id', contactId);
        
        const url = `/api/crm/projects?${params.toString()}`;
        
      
        
        // Fetch projects from our API route (which handles CORS)
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch projects');
        }
        
        console.log('=== FRONTEND: CRM PROJECTS RECEIVED ===');
        console.log('Success:', data.success);
        console.log('Count:', data.count);
        console.log('Contact ID used for filtering:', contactId);
        console.log('Projects sample:', data.projects.slice(0, 2).map((p: CRMProject) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          contact_id: p.contact_id,
          sub_service: p.sub_service,
          sub_service_id: p.sub_service_id
        })));
        
        setProjects(data.projects);
        setLoading(false);
        return; // Success, exit retry loop
        
      } catch (err) {
        console.error(`Error fetching CRM projects (attempt ${attempt}):`, err);
        
        // If this is the last attempt, set error state
        if (attempt === maxRetries) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
          setError(errorMessage);
          
          // Determine error type based on the error message
          if (errorMessage.includes('timeout') || errorMessage.includes('unavailable')) {
            setErrorType('CONNECTION_ERROR');
          } else if (errorMessage.includes('Authentication failed')) {
            setErrorType('AUTH_ERROR');
          } else {
            setErrorType('UNKNOWN_ERROR');
          }
          
          setProjects([]);
          setLoading(false);
        } else {
          // Wait before retrying
          console.log(`Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }, []);


  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    errorType,
    refetch: (forceRefresh = false) => fetchProjects(forceRefresh),
  };
}
