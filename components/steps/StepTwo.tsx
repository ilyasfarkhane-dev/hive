"use client";
import React, { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Pillar } from "@/types";



type StepTwoProps = {
  onNext: (pillarId: string) => void;
  onPrevious?: () => void;
  selectedPillar?: string | null;
  goalColorIndex?: number | null;
  selectedGoal: string;
  pillars?: Pillar[];
};

const StepTwo: React.FC<StepTwoProps> = ({
  onNext,
  onPrevious,
  selectedPillar = null,
  goalColorIndex = null,
  pillars = [],
}) => {
  const { t, i18n } = useTranslation("common");
  const [selected, setSelected] = useState<string | null>(selectedPillar);
  const [hovered, setHovered] = useState<string | null>(null);

  // Sync local selected state with prop changes (e.g., language changes)
  useEffect(() => {
    setSelected(selectedPillar);
  }, [selectedPillar]);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onNext(id), 400);
  };

  const cardColors = [
    { bg: "bg-[#3870ba]", text: "text-[#3870ba]", hover: "hover:bg-[#2c5a95]" },
    { bg: "bg-[#f2c600]", text: "text-[#f2c600]", hover: "hover:bg-[#d9b200]" },
    { bg: "bg-[#5da3ff]", text: "text-[#5da3ff]", hover: "hover:bg-[#4a8ae6]" },
    { bg: "bg-[#e86100]", text: "text-[#e86100]", hover: "hover:bg-[#cf5700]" },
    { bg: "bg-[#259997]", text: "text-[#259997]", hover: "hover:bg-[#1e807e]" },
    { bg: "bg-[#afc0d6]", text: "text-[#afc0d6]", hover: "hover:bg-[#9aaec7]" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-800 mb-3">
          {t("selectStrategicPillar")}
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t("selectStrategicPillarDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {pillars.map((pillar, index) => {
            const isSelected = selected === pillar.id;
            const isHovered = hovered === pillar.id;
            const colorIndex = goalColorIndex !== null ? goalColorIndex : index;

            // pick correct language with safe extraction
            const getSafeTitle = (titleObj: any, lang: string): string => {
              if (typeof titleObj === 'string') return titleObj;
              if (typeof titleObj === 'object' && titleObj !== null) {
                const value = titleObj[lang] || titleObj.en || titleObj;
                return typeof value === 'string' ? value : '';
              }
              return '';
            };
            const title = getSafeTitle(pillar.title, i18n.language as "en" | "fr" | "ar");

            return (
              <motion.div
                key={pillar.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: isSelected ? 1.02 : 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  isSelected ? "ring-4 ring-white ring-opacity-30 transform" : ""
                }`}
                onMouseEnter={() => setHovered(pillar.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(pillar.id)}
              >
                <div
                  className={`h-full rounded-3xl shadow-xl overflow-hidden transition-all duration-300 border border-white/10 ${
                    cardColors[colorIndex % cardColors.length].bg
                  } ${isHovered && !isSelected ? cardColors[colorIndex % cardColors.length].hover : ""}`}
                >
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

                  <div className="p-6 pb-4 flex items-start justify-between relative">
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white bg-opacity-25 text-white text-xl font-bold shadow-lg backdrop-blur-sm border border-white/20">
                      {pillar.code}
                    </div>
                    <div
                      className={`transition-all duration-300 ${
                        isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90"
                      }`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg border border-white/30">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-2 relative">
                    <div className="mb-12">
                      <p className="text-lg font-medium text-justify text-white leading-relaxed opacity-95"
                          style={{ 
                            direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
                            textAlign: i18n.language === 'ar' ? 'right' : 'left'
                          }}>
                        {title}
                      </p>
                    </div>
                    <div
                      className={`absolute bottom-6 right-6 transition-all duration-300 ${
                        isSelected ? "opacity-0 scale-90" : "opacity-100 scale-100"
                      }`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-25 group-hover:bg-opacity-35 transition-all duration-300 backdrop-blur-sm border border-white/20">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Subtle border highlight */}
                  <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none"></div>
                </div>

                {!isSelected && (
                  <div className="absolute inset-0 rounded-3xl bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
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

export default StepTwo;
