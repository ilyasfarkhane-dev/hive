import { useState, useEffect } from 'react';

export interface ProjectHierarchy {
  subservice: {
    id: string;
    name: string;
    name_ar_c: string;
    name_fr_c: string;
    description: string;
    description_subservice: string;
    description_subservice_ar_c: string;
    description_subservice_fr_c: string;
  };
  service: {
    id: string;
    code: string;
    name_service_ar_c: string;
    name_service_fr_c: string;
    description: string;
    description_service: string;
    description_service_fr_c: string;
    description_service_ar_c: string;
  };
  pillar: {
    id: string;
    code: string;
    title: {
      en: string;
      fr: string;
      ar: string;
    };
  };
  goal: {
    id: string;
    code: string;
    title: {
      en: string;
      fr: string;
      ar: string;
    };
    desc: {
      en: string;
      fr: string;
      ar: string;
    };
  };
}

export function useProjectHierarchy(subserviceId: string | null) {
  const [hierarchy, setHierarchy] = useState<ProjectHierarchy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subserviceId) {
      setHierarchy(null);
      setError(null);
      return;
    }

    const fetchHierarchy = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/crm/project-hierarchy?subserviceId=${subserviceId}`);
        const data = await response.json();
        
        if (data.success) {
          setHierarchy(data.hierarchy);
        } else {
          setError(data.error || 'Failed to fetch hierarchy');
          setHierarchy(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hierarchy');
        setHierarchy(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, [subserviceId]);

  return { hierarchy, loading, error };
}
