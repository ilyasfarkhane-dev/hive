"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ContactInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  login_c?: string;
  email1?: string;
  phone_work?: string;
  phone_mobile?: string;
  title?: string;
  department?: string;
  description?: string;
  primary_address_street?: string;
  primary_address_city?: string;
  primary_address_state?: string;
  primary_address_postalcode?: string;
  primary_address_country?: string;
  alt_address_street?: string;
  alt_address_city?: string;
  alt_address_state?: string;
  alt_address_postalcode?: string;
  alt_address_country?: string;
  portal_access_c?: string;
  date_entered?: string;
  date_modified?: string;
  created_by?: string;
  modified_user_id?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  created_by_name?: string;
  modified_by_name?: string;
  [key: string]: any;
}

interface Goal {
  id: string;
  title: string;
  desc?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  contactInfo?: ContactInfo;
  goals: Goal[];
  sessionId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<ContactInfo>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();

  useEffect(() => {
    // Check for session_id in localStorage as primary authentication method
    const storedSessionId = localStorage.getItem("session_id");
    const storedHash = localStorage.getItem("contactEeemailHash");
    const storedContact = localStorage.getItem("contactInfo");
    const storedGoals = localStorage.getItem("goals");

    // If session_id exists, user is authenticated
    if (storedSessionId) {
      setIsAuthenticated(true);
      setSessionId(storedSessionId);
      
      // Load additional data if available
      if (storedContact) setContactInfo(JSON.parse(storedContact));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
    } else if (storedHash) {
      // Fallback to old authentication method for backward compatibility
      setIsAuthenticated(true);
      if (storedContact) setContactInfo(JSON.parse(storedContact));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
    } else {
      // No valid session found
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (login: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login, password }),
      });

      const data = await res.json();

      if (res.ok && data.hashedEmail) {
        console.log('=== DEBUG: Storing Contact Info in localStorage ===');
        console.log('Contact Info:', data.contactInfo);
        console.log('Session ID:', data.sessionId);
        console.log('Goals Count:', data.goals?.length || 0);
        console.log('================================================');

        localStorage.setItem("contactEeemailHash", data.hashedEmail);
        localStorage.setItem("contactInfo", JSON.stringify(data.contactInfo));
        localStorage.setItem("goals", JSON.stringify(data.goals));
        if (data.sessionId) {
          localStorage.setItem("session_id", data.sessionId);
          setSessionId(data.sessionId);
        }

        setContactInfo(data.contactInfo);
        setGoals(data.goals);
        setSessionId(data.sessionId);
        setIsAuthenticated(true);
        return true;
      } else {
        console.error("Login failed:", data);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("contactEeemailHash");
    localStorage.removeItem("contactInfo");
    localStorage.removeItem("goals");
    localStorage.removeItem("session_id");
    setIsAuthenticated(false);
    setContactInfo(undefined);
    setGoals([]);
    setSessionId(undefined);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, isLoading, contactInfo, goals, sessionId }}
    >
      {children}
    </AuthContext.Provider>
  );
};
