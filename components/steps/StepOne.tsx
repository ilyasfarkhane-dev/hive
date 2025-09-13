"use client";
import React, { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

type Goal = {
  id: string;
  code: string; // this is the name field
  title: Record<string, string>; // en/fr/ar
  desc: Record<string, string>; // en/fr/ar
};

type StepOneProps = {
  goals: Goal[];
  onNext: (goalId: string, colorIndex: number) => void;
  selectedGoal?: string | null;
};

const StepOne: React.FC<StepOneProps> = ({ goals, onNext, selectedGoal = null }) => {
  const { t, i18n } = useTranslation("common");
  const [selected, setSelected] = useState<string | null>(selectedGoal);
  const [hovered, setHovered] = useState<string | null>(null);

  const currentLang = i18n.language || "en";

  // Sync local selected state with prop changes (e.g., language changes)
  useEffect(() => {
    setSelected(selectedGoal);
  }, [selectedGoal]);

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const cardColors = [
    { bg: "bg-[#3870ba]", hover: "hover:bg-[#2c5a95]" },
    { bg: "bg-[#f2c600]", hover: "hover:bg-[#d9b200]" },
    { bg: "bg-[#5da3ff]", hover: "hover:bg-[#4a8ae6]" },
    { bg: "bg-[#e86100]", hover: "hover:bg-[#cf5700]" },
    { bg: "bg-[#259997]", hover: "hover:bg-[#1e807e]" },
    { bg: "bg-[#afc0d6]", hover: "hover:bg-[#9aaec7]" },
  ];

  const handleSelect = (id: string) => {
    setSelected(id);
    const goalIndex = goals.findIndex((g) => g.id === id);
    setTimeout(() => {
      onNext(id, goalIndex % cardColors.length);
    }, 400);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-800 mb-3">
          {t("selectStrategicGoal")}
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t("selectStrategicGoalDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {goals.map((goal, index) => {
            const isSelected = selected === goal.id;
            const isHovered = hovered === goal.id;

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: isSelected ? 1.02 : 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative group cursor-pointer transition-all duration-300 ${isSelected ? "ring-4 ring-white ring-opacity-30 transform" : ""}`}
                onMouseEnter={() => setHovered(goal.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(goal.id)}
              >
                <div
                  className={`h-full rounded-3xl shadow-xl overflow-hidden transition-all duration-300 border border-white/10 ${cardColors[index % cardColors.length].bg} ${isHovered && !isSelected ? cardColors[index % cardColors.length].hover : ""}`}
                >
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

                  <div className="p-6 pb-4 flex items-start justify-between relative">
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white bg-opacity-25 text-white text-xl font-bold shadow-lg backdrop-blur-sm border border-white/20">
                      {goal.code}
                    </div>

                    <div className={`transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg border border-white/30">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-2 relative">
                    <div className="mb-12">
                      <p className="text-white text-lg text-justify font-medium leading-relaxed opacity-95 mt-2"
                         style={{ 
                           direction: currentLang === 'ar' ? 'rtl' : 'ltr',
                           textAlign: currentLang === 'ar' ? 'right' : 'left'
                         }}>
                        {decodeHtmlEntities(
                          (typeof goal.desc?.[currentLang] === 'string' ? goal.desc[currentLang] : 
                           typeof goal.title?.[currentLang] === 'string' ? goal.title[currentLang] : 
                           goal.code) || ''
                        )}
                      </p>
                    </div>

                    <div className={`absolute bottom-6 right-6 transition-all duration-300 ${isSelected ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}>
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
    </div>
  );
};

export default StepOne;
