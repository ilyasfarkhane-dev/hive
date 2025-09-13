"use client";
import React, { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
import type { Service } from "@/types";

interface StepThreeProps {
  services: Service[];
  onNext: (serviceId: string) => void;
  onPrevious?: () => void;
  selectedService?: string | null;
  goalColorIndex?: number | null;
}

const cardColors = [
  { bg: "bg-[#3870ba]", hover: "hover:bg-[#2c5a95]" },
  { bg: "bg-[#f2c600]", hover: "hover:bg-[#d9b200]" },
  { bg: "bg-[#5da3ff]", hover: "hover:bg-[#4a8ae6]" },
  { bg: "bg-[#e86100]", hover: "hover:bg-[#cf5700]" },
  { bg: "bg-[#259997]", hover: "hover:bg-[#1e807e]" },
  { bg: "bg-[#afc0d6]", hover: "hover:bg-[#9aaec7]" },
];

const ServiceCard: React.FC<{
  service: Service;
  colorIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  language: string;
}> = ({ service, colorIndex, isSelected, isHovered, onHover, onSelect, language }) => {
  // Get localized content based on language
const getLocalizedTitle = () => {
  switch (language) {
    case 'ar':
      return service.name_service_ar_c || service.description;
    case 'fr':
      return service.name_service_fr_c || service.description;
    default:
      console.log("service description:", service.description);
      console.log("service :", service);
      return service.description;
  }
};

const getLocalizedDescription = () => {
  switch (language) {
    case 'ar':
      return service.description_service_ar_c || service.description_service || service.description;
    case 'fr':
      return service.description_service_fr_c || service.description_service || service.description;
    default:
      return service.description_service || service.description;
  }
};
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, scale: isSelected ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative group cursor-pointer transition-all duration-300 ${
        isSelected ? "ring-4 ring-white ring-opacity-30 transform" : ""
      }`}
      onMouseEnter={() => onHover(service.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(service.id)}
    >
      <div
        className={`h-full rounded-3xl shadow-xl overflow-hidden transition-all duration-300 border border-white/10 ${
          cardColors[colorIndex % cardColors.length].bg
        } ${!isSelected && isHovered ? cardColors[colorIndex % cardColors.length].hover : ""}`}
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between relative">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white bg-opacity-25 text-white text-xl font-bold shadow-lg backdrop-blur-sm border border-white/20">
            {service.code}
          </div>

          {/* Selected check */}
          {isSelected && (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-300 border border-white/30">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-2 pb-24 relative">
          <h3 className="text-lg font-medium text-white leading-relaxed opacity-95"
              style={{ 
                direction: language === 'ar' ? 'rtl' : 'ltr',
                textAlign: language === 'ar' ? 'right' : 'left'
              }}>
            {getLocalizedTitle()}
          </h3>
          <p className="text-white text-md mt-4 leading-relaxed opacity-90"
             style={{ 
               direction: language === 'ar' ? 'rtl' : 'ltr',
               textAlign: language === 'ar' ? 'right' : 'left'
             }}>
            {getLocalizedDescription()}
          </p>

          {/* Plus icon for hover */}
          {!isSelected && (
            <div className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-25 group-hover:bg-opacity-35 transition-all duration-300 backdrop-blur-sm border border-white/20">
              <Plus className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Subtle border highlight */}
        <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none"></div>
      </div>

      {/* Hover overlay */}
      {!isSelected && (
        <div className="absolute inset-0 rounded-3xl bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 pointer-events-none" />
      )}
    </motion.div>
  );
};

const StepThree: React.FC<StepThreeProps> = ({
  services,
  onNext,
  onPrevious,
  selectedService = null,
  goalColorIndex = null,
}) => {
  const { t, i18n } = useTranslation('common');
  const [selected, setSelected] = useState<string | null>(selectedService);
  const [hovered, setHovered] = useState<string | null>(null);
  
  // Get current language
  const currentLanguage = i18n.language || 'en';

  // Sync local selected state with prop changes (e.g., language changes)
  useEffect(() => {
    setSelected(selectedService);
  }, [selectedService]);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onNext(id), 400);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-800 mb-3">{t('selectService')}</h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('selectServiceDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              colorIndex={goalColorIndex !== null ? goalColorIndex : index}
              isSelected={selected === service.id}
              isHovered={hovered === service.id}
              onHover={setHovered}
              onSelect={handleSelect}
              language={currentLanguage}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-start items-center mt-12 pt-8 border-t border-gray-200">
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('previous')}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepThree;