import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

interface HierarchyState {
  data: ProjectHierarchy | null;
  loading: boolean;
  error: string | null;
}

interface HierarchyContextType {
  getHierarchy: (subserviceId: string) => HierarchyState;
  fetchHierarchy: (subserviceId: string) => Promise<void>;
  clearCache: () => void;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

interface HierarchyProviderProps {
  children: ReactNode;
}

export function HierarchyProvider({ children }: HierarchyProviderProps) {
  const [cache, setCache] = useState<{ [key: string]: HierarchyState }>({});
  const [pendingRequests, setPendingRequests] = useState<{ [key: string]: Promise<void> }>({});

  const fetchHierarchy = useCallback(async (subserviceId: string) => {
    // If already loading or cached, return
    if (pendingRequests[subserviceId] !== undefined || (cache[subserviceId] && !cache[subserviceId].loading)) {
      return;
    }

    // Set loading state
    setCache(prev => ({
      ...prev,
      [subserviceId]: {
        data: null,
        loading: true,
        error: null
      }
    }));

    const request = fetch(`/api/crm/project-hierarchy?subserviceId=${subserviceId}`)
      .then(async (response) => {
        const data = await response.json();
        
        if (data.success) {
          setCache(prev => ({
            ...prev,
            [subserviceId]: {
              data: data.hierarchy,
              loading: false,
              error: null
            }
          }));
        } else {
          setCache(prev => ({
            ...prev,
            [subserviceId]: {
              data: null,
              loading: false,
              error: data.error || 'Failed to fetch hierarchy'
            }
          }));
        }
      })
      .catch((error) => {
        setCache(prev => ({
          ...prev,
          [subserviceId]: {
            data: null,
            loading: false,
            error: error.message || 'Failed to fetch hierarchy'
          }
        }));
      })
      .finally(() => {
        // Remove from pending requests
        setPendingRequests(prev => {
          const newPending = { ...prev };
          delete newPending[subserviceId];
          return newPending;
        });
      });

    setPendingRequests(prev => ({
      ...prev,
      [subserviceId]: request
    }));
  }, [cache]);

  const getHierarchy = useCallback((subserviceId: string): HierarchyState => {
    return cache[subserviceId] || {
      data: null,
      loading: false,
      error: null
    };
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache({});
    setPendingRequests({});
  }, []);

  return (
    <HierarchyContext.Provider value={{ getHierarchy, fetchHierarchy, clearCache }}>
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy(subserviceId: string | null) {
  const context = useContext(HierarchyContext);
  
  if (!context) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }

  const { getHierarchy, fetchHierarchy } = context;

  // Fetch hierarchy if not already loaded
  React.useEffect(() => {
    if (subserviceId) {
      fetchHierarchy(subserviceId);
    }
  }, [subserviceId, fetchHierarchy]);

  return subserviceId ? getHierarchy(subserviceId) : { data: null, loading: false, error: null };
}
