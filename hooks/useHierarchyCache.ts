import { useState, useEffect, useCallback } from 'react';

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

interface HierarchyCacheEntry {
  data: ProjectHierarchy | null;
  loading: boolean;
  error: string | null;
  timestamp: number;
}

interface HierarchyCache {
  [subserviceId: string]: HierarchyCacheEntry;
}

// Global cache and pending requests
let globalCache: HierarchyCache = {};
let pendingRequests: { [subserviceId: string]: Promise<ProjectHierarchy | null> } = {};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useHierarchyCache(subserviceId: string | null) {
  const [hierarchy, setHierarchy] = useState<ProjectHierarchy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async (id: string): Promise<ProjectHierarchy | null> => {
    try {
      const response = await fetch(`/api/crm/project-hierarchy?subserviceId=${id}`);
      const data = await response.json();
      
      if (data.success) {
        return data.hierarchy;
      } else {
        throw new Error(data.error || 'Failed to fetch hierarchy');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch hierarchy');
    }
  }, []);

  const getOrFetchHierarchy = useCallback(async (id: string): Promise<ProjectHierarchy | null> => {
    const now = Date.now();
    const cached = globalCache[id];
    
    // Return cached data if it's still valid
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    // If there's already a pending request for this ID, wait for it
    if (pendingRequests[id] !== undefined) {
      return pendingRequests[id];
    }
    
    // Create new request
    const request = fetchHierarchy(id).then((result) => {
      // Cache the result
      globalCache[id] = {
        data: result,
        loading: false,
        error: null,
        timestamp: now
      };
      
      // Remove from pending requests
      delete pendingRequests[id];
      
      return result;
    }).catch((err) => {
      // Cache the error
      globalCache[id] = {
        data: null,
        loading: false,
        error: err.message,
        timestamp: now
      };
      
      // Remove from pending requests
      delete pendingRequests[id];
      
      throw err;
    });
    
    pendingRequests[id] = request;
    return request;
  }, [fetchHierarchy]);

  useEffect(() => {
    if (!subserviceId) {
      setHierarchy(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Check if we already have cached data
    const cached = globalCache[subserviceId];
    if (cached && !cached.loading) {
      setHierarchy(cached.data);
      setError(cached.error);
      setLoading(false);
      return;
    }

    const loadHierarchy = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getOrFetchHierarchy(subserviceId);
        setHierarchy(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hierarchy');
        setHierarchy(null);
      } finally {
        setLoading(false);
      }
    };

    loadHierarchy();
  }, [subserviceId, getOrFetchHierarchy]);

  return { hierarchy, loading, error };
}

// Utility function to clear cache if needed
export function clearHierarchyCache() {
  globalCache = {};
  pendingRequests = {};
  console.log('Hierarchy cache cleared');
}
