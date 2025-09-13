"use client";
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { validateSessionOnLoad } from '@/utils/sessionValidation';

/**
 * Custom hook to validate session on component mount
 * Use this in any protected component to ensure session validation
 */
export const useSessionValidation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only validate if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      validateSessionOnLoad();
    }
  }, [isLoading, isAuthenticated]);

  return { isAuthenticated, isLoading };
};
