"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/app/login/page';
import LoadingSpinner from '@/components/LoadingSpinner'; // You might want to create a loading component

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

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