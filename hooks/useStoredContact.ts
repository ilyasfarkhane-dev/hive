"use client";
import { useState, useEffect } from 'react';
import { 
  getStoredContactInfo, 
  getStoredSessionId, 
  getStoredGoals,
  isUserAuthenticated,
  getUserFullName,
  getUserEmail,
  getUserPhone,
  getUserTitle,
  getUserDepartment,
  getUserPrimaryAddress,
  getUserAltAddress,
  logStoredContactInfo,
  StoredContactInfo
} from '@/utils/contactStorage';

export interface UseStoredContactReturn {
  // Data
  contactInfo: StoredContactInfo | null;
  sessionId: string | null;
  goals: any[];
  isAuthenticated: boolean;
  
  // Computed values
  fullName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  primaryAddress: {
    street?: string;
    city?: string;
    state?: string;
    postalcode?: string;
    country?: string;
  };
  altAddress: {
    street?: string;
    city?: string;
    state?: string;
    postalcode?: string;
    country?: string;
  };
  
  // Actions
  refreshData: () => void;
  logContactInfo: () => void;
}

export const useStoredContact = (): UseStoredContactReturn => {
  const [contactInfo, setContactInfo] = useState<StoredContactInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshData = () => {
    console.log('=== DEBUG: Refreshing Stored Contact Data ===');
    const contact = getStoredContactInfo();
    const session = getStoredSessionId();
    const storedGoals = getStoredGoals();
    const auth = isUserAuthenticated();
    
    setContactInfo(contact);
    setSessionId(session);
    setGoals(storedGoals);
    setIsAuthenticated(auth);
    
    console.log('Data refreshed successfully');
    console.log('=============================================');
  };

  const logContactInfo = () => {
    logStoredContactInfo();
  };

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Computed values
  const fullName = getUserFullName();
  const email = getUserEmail();
  const phone = getUserPhone();
  const title = getUserTitle();
  const department = getUserDepartment();
  const primaryAddress = getUserPrimaryAddress();
  const altAddress = getUserAltAddress();

  return {
    // Data
    contactInfo,
    sessionId,
    goals,
    isAuthenticated,
    
    // Computed values
    fullName,
    email,
    phone,
    title,
    department,
    primaryAddress,
    altAddress,
    
    // Actions
    refreshData,
    logContactInfo
  };
};


