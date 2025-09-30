"use client";
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  showLabels?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ showLabels = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", flag: "🇺🇸", name: "English" },
    { code: "fr", flag: "🇫🇷", name: "Français" },
    { code: "ar", flag: "🇸🇦", name: "العربية" },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (langCode === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
    document.documentElement.setAttribute("lang", langCode);
    localStorage.setItem("i18nextLng", langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (showLabels) {
    // Original horizontal layout for when labels are needed
    return (
      <div className="flex gap-3 mt-6">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-4 py-2 rounded-2xl text-white transition-all duration-300 border-2 backdrop-blur-sm ${
              i18n.language === lang.code
                ? "bg-white/20 border-white font-bold shadow-lg"
                : "bg-white/10 border-white/50 hover:border-white hover:bg-white/20 hover:shadow-md"
            }`}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Modern dropdown for header use
  return (
    <div className="relative language-switcher z-[200]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="Language selector"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden z-[250] language-dropdown">
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 language-option ${
                i18n.language === lang.code
                  ? "bg-[#0e7378]/20 text-[#0e7378] font-semibold"
                  : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
              } ${index !== languages.length - 1 ? 'border-b border-gray-200/50' : ''}`}
              role="option"
              aria-selected={i18n.language === lang.code}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.name}</span>
              </div>
              {i18n.language === lang.code && (
                <svg className="w-4 h-4 ml-auto text-[#0e7378]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
