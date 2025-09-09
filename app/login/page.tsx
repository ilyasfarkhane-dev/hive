"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import logo from "@/public/Logo-01.svg";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import i18n from 'i18next';

import axios from "axios";

const demoCredentials = [
  { username: "admin", password: "admin123", role: "Administrator" },
  { username: "user", password: "member123", role: "Member State" },
  { username: "viewer", password: "viewer123", role: "Observer" }
];

const LoginPage = () => {
  const { t } = useTranslation('common');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedHash = localStorage.getItem("contactEeemailHash");
    if (storedHash) setIsLoggedIn(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/login", {
        email: credentials.login, // map login_c to email in API
        password: credentials.password,
        language: i18n.language || 'en'
      });

    

      if (response.status === 200 && response.data.hashedEmail) {
       
        localStorage.setItem("contactEeemailHash", response.data.hashedEmail);
        localStorage.setItem("session_id", response.data.sessionId);

        setIsLoggedIn(true);
        window.location.href = "/";
      } else {
        setError(response.data.message || t('invalidCredentials'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const fillDemoCredentials = (index: number) => {
    const demo = demoCredentials[index];
    setCredentials({ login: demo.username, password: demo.password });
    setError("");
  };

  if (isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e7378] to-[#1B3B36] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="dropdown" showLabels={true} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center">
          <Image src={logo || "/placeholder.svg"} alt="ICESCO Logo" width={120} height={120} className="mb-6" />
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 text-center text-3xl font-extrabold text-white">
          {t('title')}
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-2 text-center text-sm text-blue-100">
          {t('signInToAccount')}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700">{t('login')}</label>
              <div className="mt-1 relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={credentials.login}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e7378] focus:border-transparent transition-all duration-200"
                  placeholder={t('enterLogin')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('password')}</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e7378] focus:border-transparent transition-all duration-200 pr-10"
                  placeholder={t('enterPassword')}
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm">{error}</motion.div>}

            <div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#0e7378] hover:bg-[#0a5559] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e7378] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>
                  <LogIn className="w-5 h-5 mr-2" /> {t('signIn')}
                </>}
              </motion.button>
            </div>
          </form>

        
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
