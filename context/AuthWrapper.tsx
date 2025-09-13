"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/app/login/page';
import LoadingSpinner from '@/components/LoadingSpinner';
import { validateSessionOnLoad } from '@/utils/sessionValidation';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only validate session if we're not on the login page and not authenticated
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage) {
        validateSessionOnLoad();
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e7378]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default AuthWrapper;