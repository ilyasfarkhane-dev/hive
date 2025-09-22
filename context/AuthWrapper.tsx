"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/app/login/page';
// import LoadingSpinner from '@/components/LoadingSpinner'; // Removed during cleanup
// import { validateSessionOnLoad } from '@/utils/sessionValidation'; // Removed during cleanup

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('=== AUTH WRAPPER DEBUG ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('isLoading:', isLoading);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e7378] to-[#1B3B36] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing login page');
    return <LoginPage />;
  }

  console.log('User authenticated, showing children');
  return <>{children}</>;
};

export default AuthWrapper;