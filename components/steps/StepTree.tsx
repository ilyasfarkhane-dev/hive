"use client";
import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Service {
  id: string;
  title: string;
  desc: string;
  description_service: string;
}

interface StepThreeProps {
  services: Service[];
  onNext: (serviceId: string) => void;
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
}> = ({ service, colorIndex, isSelected, isHovered, onHover, onSelect }) => {
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
        className={`h-full rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
          cardColors[colorIndex % cardColors.length].bg
        } ${!isSelected && isHovered ? cardColors[colorIndex % cardColors.length].hover : ""}`}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white bg-opacity-20 text-white text-xl font-bold shadow-md">
            {service.title}
          </div>

          {/* Selected check */}
          {isSelected && (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-2 pb-24 relative">
          <h4 className="text-xl font-semibold text-white leading-tight">{service.desc}</h4>
          <p className="text-white text-sm mt-4 text-justify">{service.description_service}</p>

          {/* Plus icon for hover */}
          {!isSelected && (
            <div className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300">
              <Plus className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      {!isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 pointer-events-none" />
      )}
    </motion.div>
  );
};

const StepThree: React.FC<StepThreeProps> = ({
  services,
  onNext,
  selectedService = null,
  goalColorIndex = null,
}) => {
  const [selected, setSelected] = useState<string | null>(selectedService);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    onNext(id); // Immediately go to next step
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-800 mb-3">Select Your Service</h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the service that best matches your project’s focus
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
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StepThree;
