"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ContactInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  email1?: string;
  phone_work?: string;
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
    const storedHash = localStorage.getItem("contactEeemailHash");
    const storedContact = localStorage.getItem("contactInfo");
    const storedGoals = localStorage.getItem("goals");
    const storedSession = localStorage.getItem("sessionId");

    if (storedHash) {
      setIsAuthenticated(true);
      if (storedContact) setContactInfo(JSON.parse(storedContact));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedSession) setSessionId(storedSession);
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
        localStorage.setItem("contactEeemailHash", data.hashedEmail);
        localStorage.setItem("contactInfo", JSON.stringify(data.contactInfo));
        localStorage.setItem("goals", JSON.stringify(data.goals));
        if (data.sessionId) localStorage.setItem("sessionId", data.sessionId);

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
    localStorage.removeItem("sessionId");
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
