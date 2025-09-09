"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';


const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="flex items-center px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </button>
  );
};

export default LogoutButton;