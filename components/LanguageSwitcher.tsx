"use client";
import React from "react";
import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  showLabels?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ showLabels = false }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", flag: "🇺🇸" },
    { code: "fr", flag: "🇫🇷" },
    { code: "ar", flag: "🇸🇦" },
  ];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (langCode === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
    document.documentElement.setAttribute("lang", langCode);
    localStorage.setItem("i18nextLng", langCode);
  };

  return (
<div className="flex gap-3 mt-6">
  {languages.map(lang => (
    <button
      key={lang.code}
      onClick={() => changeLanguage(lang.code)}
      className={`px-4 py-2 rounded-2xl text-white transition-colors border-2 ${
        i18n.language === lang.code
          ? "bg-transparent border-white font-bold"
          : "bg-transparent border-white/50 hover:border-white hover:bg-white/10"
      }`}
    >
     {lang.code.toUpperCase()}
    </button>
  ))}
</div>


  );
};

export default LanguageSwitcher;
