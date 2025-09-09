"use client";
import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';

type StepOneProps = {
  goals: { id: string; title: string; desc: string }[];
  onNext: (goalId: string, colorIndex: number) => void;
  selectedGoal?: string | null;
};

const StepOne: React.FC<StepOneProps> = ({
  goals,
  onNext,
  selectedGoal = null,
}) => {
  const { t } = useTranslation('common');
  const [selected, setSelected] = useState<string | null>(selectedGoal);
  const [hovered, setHovered] = useState<string | null>(null);

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
          {t('selectStrategicGoal')}
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('selectStrategicGoalDesc')}
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
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isSelected ? 1.02 : 1,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  isSelected ? "ring-4 ring-white ring-opacity-30 transform" : ""
                }`}
                onMouseEnter={() => setHovered(goal.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(goal.id)}
              >
                <div
                  className={`h-full rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
                    cardColors[index % cardColors.length].bg
                  } ${
                    isHovered && !isSelected
                      ? cardColors[index % cardColors.length].hover
                      : ""
                  }`}
                >
                  <div className="p-6 pb-4 flex items-start justify-between">
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white bg-opacity-20 text-white text-xl font-bold shadow-md">
                      {goal.title}
                    </div>

                    <div
                      className={`transition-all duration-300 ${
                        isSelected
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-90"
                      }`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-2">
                    <div className="mb-12">
                      <p className="text-white text-sm opacity-90 mt-2">
                        {goal.desc}
                      </p>
                    </div>

                    <div
                      className={`absolute bottom-6 right-6 transition-all duration-300 ${
                        isSelected
                          ? "opacity-0 scale-90"
                          : "opacity-100 scale-100"
                      }`}
                    >
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
    </div>
  );
};

export default StepOne;
