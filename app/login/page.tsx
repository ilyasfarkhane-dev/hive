"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, User } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
// import logo from "@/public/Logo-01.svg"; // SVG import might not work in production
// import maquettes from "@/public/maquettes.png"; // Removed during cleanup
import { useTranslation } from 'react-i18next';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import i18n from 'i18next';
import axios from "axios";
import { useAuth } from '@/context/AuthContext';
// import { resetValidationFlag } from '@/utils/sessionValidation'; // Removed during cleanup

const demoCredentials = [
  { username: "admin", password: "admin123", role: "Administrator" },
  { username: "user", password: "member123", role: "Member State" },
  { username: "viewer", password: "viewer123", role: "Observer" }
];

const LoginPage = () => {
  const { t } = useTranslation('common');
  const { login: authLogin, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, don't show login page
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await authLogin(credentials.login, credentials.password);
      
      if (!success) {
        setError(t('invalidCredentials'));
      }
      // If successful, AuthContext will handle the state change and redirect
    } catch (err: any) {
      setError(t('loginFailed'));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e7378] to-[#1B3B36] flex flex-col justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background maquette image - similar to site header */}
      <Image
        src="/ice-ban.jpg"
        alt="Background maquette"
        width={800}
        height={600}
        className="absolute right-0 top-0 h-full w-full object-cover block opacity-60 sm:opacity-80"
        style={{ 
          position: 'absolute',
          right: '0',
          top: '0',
          zIndex: 1,
          transform: 'none',
          direction: 'ltr',
          left: 'auto'
        }}
      />
      
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
        <LanguageSwitcher showLabels={false} />
      </div>

      <div className="mx-auto w-full max-w-md relative z-10 px-4 sm:px-0">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center">
          <Image src="/Logo-01.svg" alt="ICESCO Logo" width={80} height={80} className="mb-4 sm:mb-6 sm:w-[120px] sm:h-[120px]" />
        </motion.div>
        <motion.h5
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-8xl text-white font-bold leading-tight"
        >
          {t('siteTitle')}
        </motion.h5>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-secondary text-sm sm:text-base lg:text-lg font-medium mt-2 px-2"
        >
          {t('subtitle')}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-6 sm:mt-8 mx-auto w-full max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/20 backdrop-blur-md py-6 px-4 shadow-xl rounded-2xl sm:py-8 sm:px-6 lg:px-10 border border-white/30">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-white">{t('login')}</label>
              <div className="mt-1 relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  autoFocus
                  value={credentials.login}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 pl-9 sm:pl-10 text-sm sm:text-base"
                  placeholder={t('enterLogin')}
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">{t('password')}</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 pl-9 pr-9 sm:pl-10 sm:pr-10 text-sm sm:text-base"
                  placeholder={t('enterPassword')}
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />}
                </button>
                <span className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
                </span>
              </div>
            </div>

            {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 rounded-lg text-center text-sm">{error}</motion.div>}

            <div className="flex flex-col gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm sm:text-base font-medium text-white bg-[#0e7378] hover:bg-[#0a5559] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e7378] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div> : <>
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> {t('signIn')}
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