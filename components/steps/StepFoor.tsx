"use client";
import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// Updated type for sub-service
type SubService = {
  id: string;
  name: string;
  name_ar_c: string;
  name_fr_c: string;
  name_en_c?: string;
  description: string;
  description_ar_c?: string;
  description_fr_c?: string;
  description_en_c?: string;
  description_subservice: string;
  description_subservice_ar_c: string;
  description_subservice_fr_c: string;
  description_subservice_en_c?: string;
};

type StepFourProps = {
  subServices: SubService[];
  onNext: (subServiceId: string) => void;
  onPrevious?: () => void; // <-- added
  selectedSubService?: string | null;
  goalColorIndex?: number | null;
};

const StepFour: React.FC<StepFourProps> = ({
  subServices,
  onNext,
  onPrevious,
  selectedSubService = null,
  goalColorIndex = null,
}) => {
  const { t, i18n } = useTranslation("common");
  const [selected, setSelected] = useState<string | null>(selectedSubService);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onNext(id), 400);
  };

  const getLocalizedText = (subService: SubService, field: 'name' | 'description', lang: string) => {
    switch (field) {
      case 'name':
        switch (lang) {
          case 'ar': return subService.name_ar_c || subService.description || subService.name;
          case 'fr': return subService.name_fr_c || subService.description || subService.name;
          case 'en': return subService.description || subService.name;
          default: return subService.description || subService.name;
        }
      case 'description':
        switch (lang) {
          case 'ar': return subService.description_subservice_ar_c || subService.description_subservice || subService.description;
          case 'fr': return subService.description_subservice_fr_c || subService.description_subservice || subService.description;
          case 'en': return subService.description_subservice_en_c || subService.description_subservice || subService.description;
          default: return subService.description_subservice || subService.description;
        }
      default: return '';
    }
  };

  const cardColors = [
    { bg: "bg-[#3870ba]", text: "text-[#3870ba]", hover: "hover:bg-[#2c5a95]" },
    { bg: "bg-[#f2c600]", text: "text-[#f2c600]", hover: "hover:bg-[#d9b200]" },
    { bg: "bg-[#5da3ff]", text: "text-[#5da3ff]", hover: "hover:bg-[#4a8ae6]" },
    { bg: "bg-[#e86100]", text: "text-[#e86100]", hover: "hover:bg-[#cf5700]" },
    { bg: "bg-[#259997]", text: "text-[#259997]", hover: "hover:bg-[#1e807e]" },
    { bg: "bg-[#afc0d6]", text: "text-[#afc0d6]", hover: "hover:bg-[#9aaec7]" },
  ];

  const lang = i18n.language || "en";

  if (subServices.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-3">{t("selectStrategicSubService")}</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("noSubServicesAvailable")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-800 mb-3">{t("selectStrategicSubService")}</h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("selectStrategicSubServiceDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {subServices.map((subService, index) => {
            const isSelected = selected === subService.id;
            const isHovered = hovered === subService.id;
            const colorIndex = goalColorIndex !== null ? goalColorIndex : index % cardColors.length;

            const title = getLocalizedText(subService, 'name', lang);
            const desc = getLocalizedText(subService, 'description', lang);

            return (
              <motion.div
                key={subService.id || `sub-${index}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: isSelected ? 1.02 : 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative group cursor-pointer transition-all duration-300 ${isSelected ? "ring-4 ring-white ring-opacity-30 transform" : ""}`}
                onMouseEnter={() => setHovered(subService.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(subService.id)}
              >
                <div className={`h-full rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${cardColors[colorIndex].bg} ${isHovered && !isSelected ? cardColors[colorIndex].hover : ""}`}>
                  <div className="p-6 pb-4 flex items-start justify-between">
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white bg-opacity-20 text-white text-md font-bold shadow-md">
                      {subService.name}
                    </div>
                    <div className={`transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-2">
                    <div className="mb-12">
                      <h4 className="text-2xl text-justify font-semibold text-white leading-tight">{title}</h4>
                      <p className="text-white mt-2 text-md font-semibold text-justify line-clamp-3">{desc}</p>
                    </div>

                    <div className={`absolute bottom-6 right-6 transition-all duration-300 ${isSelected ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}>
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {!isSelected && (
                  <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Previous button */}
      {onPrevious && (
        <div className="mt-6 flex justify-start">
         <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('previous')}
          </button>
        </div>
      )}
    </div>
  );
};

export default StepFour;
