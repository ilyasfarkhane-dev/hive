"use client";
import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { useTranslation } from "react-i18next";

import StepOne from "@/components/steps/StepOne";
import StepTwo from "@/components/steps/StepTwo";
import StepThree from "@/components/steps/StepTree";
import StepFour from "@/components/steps/StepFoor";
import StepFive, { StepFiveRef } from "./steps/StepFive";
import StepSix from "@/components/steps/StepSix";
import { pillarsData } from "@/Data/pillars/data";
import { steps } from "@/Data/index";
import { goals as goalsData } from "@/Data/goals/data";
import { pillarServicesData } from "@/Data/services/data";
import type { Goal, Pillar, SubService, Service } from "@/types";
import { serviceSubservicesData } from "@/Data/sub-service/data";


const Rooms = () => {
  const { t, i18n } = useTranslation("common");
  const [currentStep, setCurrentStep] = useState(1);
  const stepFiveRef = useRef<StepFiveRef>(null);

  // User selections
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSubService, setSelectedSubService] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

  const [showTwoColumns, setShowTwoColumns] = useState(false);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [subServices, setSubServices] = useState<any[]>([]);

  const cardColors = [
    { bg: "bg-[#3870ba]", text: "text-[#3870ba]" },
    { bg: "bg-[#f2c600]", text: "text-[#f2c600]" },
    { bg: "bg-[#5da3ff]", text: "text-[#5da3ff]" },
    { bg: "bg-[#e86100]", text: "text-[#e86100]" },
    { bg: "bg-[#259997]", text: "text-[#259997]" },
    { bg: "bg-[#afc0d6]", text: "text-[#afc0d6]" },
  ];

  const addSelectedCard = (
    type: string,
    id: string,
    title: string,
    desc: string,
    colorIndex: number,
    code?: string // <-- add code as optional param
  ) => {
    const newCard = { type, id, title, desc, colorIndex, code }; // <-- include code
    setSelectedCards((prev) => {
      const exists = prev.some(c => c.id === newCard.id);
      if (!exists) {
        const updatedCards = [...prev, newCard];
        localStorage.setItem('selectedCards', JSON.stringify(updatedCards));
        return updatedCards;
      }
      return prev;
    });
  };


  // Load goals
  useEffect(() => {
    setGoals(goalsData);
  }, []);

  // Clear localStorage on page refresh/unload
useEffect(() => {
  const handleBeforeUnload = () => {
    localStorage.removeItem('selectedCards');
    localStorage.removeItem('projectDetails');
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      localStorage.removeItem('selectedCards');
      localStorage.removeItem('projectDetails');
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);


  // Load selected cards from localStorage on component mount
 useEffect(() => {
  const loadSelectedCards = () => {
    try {
      const savedCards = localStorage.getItem("selectedCards");
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);

        // ✅ Ensure every card keeps its type for the badge
        const cardsWithType = parsedCards.map((card: any) => ({
          ...card,
          type: card.type || "unknown", // keep type or fallback
        }));

        setSelectedCards(cardsWithType);

        if (cardsWithType.length > 0) {
          setShowTwoColumns(true);

          const lastCard = cardsWithType[cardsWithType.length - 1];
          switch (lastCard.type) {
            case "goal":
              setCurrentStep(2);
              setSelectedGoal(lastCard.id);
              setSelectedColorIndex(lastCard.colorIndex);
              setPillars(pillarsData[lastCard.id] || []);
              break;

            case "pillar":
              setCurrentStep(3);
              setSelectedPillar(lastCard.id);
              setSelectedColorIndex(lastCard.colorIndex);
              const pillarServicesRaw = pillarServicesData[lastCard.id] || [];
              setServices(
                pillarServicesRaw.map((s: any, index: number) => ({
                  id: s.id || s.code || `service-${index}`,
                  code: s.code,
                  title: s.description_service,
                  desc: s.description_service,
                  description_service: s.description_service,
                  description_service_fr_c: s.description_service_fr_c,
                  description_service_ar_c: s.description_service_ar_c,
                  name_service_fr_c: s.name_service_fr_c,
                  name_service_ar_c: s.name_service_ar_c,
                  name_service: s.description_service,
                  type: "service", // ✅ keep type
                }))
              );
              break;

            case "service":
              setCurrentStep(4);
              setSelectedService(lastCard.id);
              setSelectedColorIndex(lastCard.colorIndex);
              const serviceSubServicesRaw =
                (serviceSubservicesData as any)[lastCard.id] || [];
              setSubServices(
                serviceSubServicesRaw.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  name_ar_c: s.name_ar_c,
                  name_fr_c: s.name_fr_c,
                  name_en_c: s.name_en_c,
                  description: s.description,
                  description_ar_c: s.description_ar_c,
                  description_fr_c: s.description_fr_c,
                  description_en_c: s.description_en_c,
                  description_subservice: s.description_subservice,
                  description_subservice_ar_c: s.description_subservice_ar_c,
                  description_subservice_fr_c: s.description_subservice_fr_c,
                  description_subservice_en_c: s.description_subservice_en_c,
                  type: "subService", // ✅ keep type
                }))
              );
              break;

            case "subService":
              setCurrentStep(5);
              setSelectedSubService(lastCard.id);
              setSelectedColorIndex(lastCard.colorIndex);
              break;
          }
        }
      }
    } catch (error) {
      console.error(
        "Error loading selected cards from localStorage:",
        error
      );
    }
  };

  loadSelectedCards();
}, []);


  // Handle goal selection
  const handleGoalSelect = (goalId: string, colorIndex: number) => {
    setSelectedGoal(goalId);
    setSelectedColorIndex(colorIndex);
    setShowTwoColumns(true);

    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      const lang = i18n.language || "en";
      addSelectedCard("goal", goal.id, goal.title[lang], goal.desc[lang], colorIndex, goal.code);
    }

    // Load pillars for this goal
    const goalPillars = pillarsData[goalId] || [];
    setPillars(goalPillars);

    setCurrentStep(2);
  };


  // Handle pillar selection
  // Handle pillar selection
  const handlePillarSelect = (pillarId: string) => {

    console.log("🟢 Service card clicked ID:", pillarId);
    setSelectedPillar(pillarId);

    const pillar = pillars.find((p) => p.id === pillarId);
    if (pillar && selectedColorIndex !== null) {
      const lang = i18n.language || "en";

      const title =
        typeof pillar.title === "object" ? (pillar.title as any)[lang] : pillar.title;
      const desc = pillar.desc
        ? (typeof pillar.desc === "object" ? (pillar.desc as any)[lang] : pillar.desc)
        : title; // fallback to title if desc doesn't exist

      addSelectedCard("pillar", pillar.id, title, desc, selectedColorIndex);
    }

    // Load services for this pillar
    const pillarServicesRaw = pillarServicesData[pillarId] || [];
    const pillarServices = pillarServicesRaw.map((s: any, index: number) => {
      return {
        id: s.id || s.code || `service-${index}`, // ensure id exists
        code: s.code, // ✅ use the correct field
        title: s.description_service, // English title
        description: s.description, // English description
        description_service: s.description_service,
        description_service_fr_c: s.description_service_fr_c,
        description_service_ar_c: s.description_service_ar_c,
        name_service_fr_c: s.name_service_fr_c,
        name_service_ar_c: s.name_service_ar_c,
        name_service: s.description_service, // fallback
      };
    });



    setServices(pillarServices);
    setCurrentStep(3);
  };



  // Handle service selection
  // Handle service selection - fix the sub-service loading
  // Handle service selection - fix the sub-service loading
  // Handle service selection
  const handleServiceSelect = (serviceId: string) => {
    console.log("🟢 Service card clicked ID:", serviceId);
    setSelectedService(serviceId);

    const service = services.find((s) => s.id === serviceId);

    if (service && selectedColorIndex !== null) {
      const lang = i18n.language || "en";

      // Get localized title and description
      const title = lang === "ar" ? service.name_service_ar_c :
        lang === "fr" ? service.name_service_fr_c : service.title;
      const desc = lang === "ar" ? service.description_service_ar_c :
        lang === "fr" ? service.description_service_fr_c : service.desc;

      addSelectedCard("service", service.id, title, desc, selectedColorIndex);
    }

    // 🔹 Get sub-services for this serviceId
    const serviceSubServicesRaw = (serviceSubservicesData as any)[serviceId] || [];

    const serviceSubServices: SubService[] = serviceSubServicesRaw.map((s: any) => ({
      id: s.id,
      name: s.name,
      name_ar_c: s.name_ar_c,
      name_fr_c: s.name_fr_c,
      name_en_c: s.name_en_c,
      description: s.description,
      description_ar_c: s.description_ar_c,
      description_fr_c: s.description_fr_c,
      description_en_c: s.description_en_c,
      description_subservice: s.description_subservice,
      description_subservice_ar_c: s.description_subservice_ar_c,
      description_subservice_fr_c: s.description_subservice_fr_c,
      description_subservice_en_c: s.description_subservice_en_c,
    }));

    setSubServices(serviceSubServices);
    setCurrentStep(4);
  };





  // Handle sub-service selection
  const handleSubServiceSelect = (subServiceId: string) => {
    setSelectedSubService(subServiceId);

    const subService = subServices.find((s) => s.id === subServiceId);

    if (subService && selectedColorIndex !== null) {
      const lang = i18n.language || "en";

      // Pick correct localized title
      const title = lang === "ar" ? subService.name_ar_c :
        lang === "fr" ? subService.name_fr_c :
          subService.description || subService.name;

      // Pick correct localized description
      const desc = lang === "ar" ? subService.description_subservice_ar_c :
        lang === "fr" ? subService.description_subservice_fr_c :
          subService.description_subservice_en_c || subService.description_subservice;

      addSelectedCard("subService", subService.id, title, desc, selectedColorIndex);
    }

    setCurrentStep(5);
  };


  // Handle project details (step 5)
  const handleProjectDetails = () => {
    const details = stepFiveRef.current?.getFormValues();
    if (details) {
      setProjectDetails(details);
      setCurrentStep(6);
    }
  };

  // Handle navigation
  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      // Remove cards of steps after prevStep
      setSelectedCards((cards) =>
        cards.filter((card) => {
          switch (card.type) {
            case 'goal': return prevStep >= 2;
            case 'pillar': return prevStep >= 3;
            case 'service': return prevStep >= 4;
            case 'subService': return prevStep >= 5;
            default: return true;
          }
        })
      );
    }
  };



  // Clear all data and reset to step 1
  const clearAllData = () => {
    // Clear localStorage
    localStorage.removeItem('selectedCards');
    localStorage.removeItem('projectDetails');

    // Reset all state
    setSelectedCards([]);
    setSelectedGoal(null);
    setSelectedPillar(null);
    setSelectedService(null);
    setSelectedSubService(null);
    setProjectDetails(null);
    setSelectedColorIndex(null);
    setShowTwoColumns(false);
    setCurrentStep(1);
    setPillars([]);
    setServices([]);
    setSubServices([]);
  };

  // Handle editing project details
  const handleEditProjectDetails = () => {
    setCurrentStep(5);
  };

  const getCardTitle = (type: string) => {
    switch (type) {
      case "goal":
        return t("goal");
      case "pillar":
        return t("pillar");
      case "service":
        return t("service");
      case "subService":
        return t("subService");
      default:
        return t("item");
    }
  };

  const getStepTitle = (stepId: number) => {
    switch (stepId) {
      case 1:
        return t("strategicGoal");
      case 2:
        return t("pillar");
      case 3:
        return t("service");
      case 4:
        return t("subService");
      case 5:
        return t("projectDetails");
      case 6:
        return t("reviewSubmit");
      default:
        return t("item");
    }
  };

  // GSAP right column animation
  useEffect(() => {
    if (showTwoColumns && rightColumnRef.current) {
      gsap.fromTo(
        rightColumnRef.current,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [showTwoColumns, currentStep]);

  return (
    <section id="next-section" className="bg-white-100 py-10 lg:py-14 w-full px-5 md:px-[1.9rem] largesceen:px-14 fourk:px-44 relative">
      <div className="text-center mt-12 sm:mt-20 xl:mt-0">
        <h2 className="text-gradient uppercase text-3xl xs:text-[2rem] leading-none lg:text-[6.25rem] desktop:text-[7.813rem] largesceen:text-[2.375rem]">
          {t("takePartInStrategy")}
        </h2>
        <p className="uppercase mt-12 text-gradient lg:text-base 2xl:text-lg largesceen:text-[1.625rem] max-lg:hidden">
          {t("submitAndTrackProposal")}
        </p>
      </div>

      {/* Stepper */}
      <section className="mt-16 md:mt-24 flex flex-col items-center">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step) => (
              <div key={step.id} className="flex-1 flex justify-center relative">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold transition-all duration-500 ${currentStep >= step.id ? "bg-[#0e7378]" : "bg-gray-300 text-gray-600"
                    }`}
                >
                  {step.id}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="flex-1 flex justify-center">
                <p className="text-sm font-semibold text-gray-800 text-center">
                  {getStepTitle(step.id)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div
          className={`relative w-full px-16 mt-12 ${showTwoColumns ? "flex flex-col md:flex-row gap-6" : ""
            }`}
        >
          {/* Left column */}
          {showTwoColumns && selectedCards.length > 0 && (
            <div className="hidden md:flex md:w-1/3 flex-col-reverse justify-between mt-18 mb-6 md:mb-0">
              <div className="h-[150px]"></div>
              <div className="sticky top-4 space-y-4">
                <div className="text-sm font-semibold text-gray-600 mb-2">
                  {t("yourSelections")}
                </div>
                <div className="relative min-h-[200px] flex flex-col gap-4">
                  <AnimatePresence>
                    {selectedCards.map((card, index) => (
                      <motion.div
                        key={`${card.type}-${card.id || index}`}
                        className={`w-full ${index === selectedCards.length - 1 ? "scale-105 shadow-2xl" : "scale-100"}`}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className={`h-full rounded-2xl shadow-xl overflow-hidden transition-all duration-300 relative  ${cardColors[card.colorIndex % cardColors.length].bg}`}>

                          {/* Type badge */}
                          <div className="absolute top-2 left-2 px-2 py-1 bg-white bg-opacity-80 rounded-full text-xs font-bold text-gray-800 z-10">
                            {getCardTitle(card.type)}
                            
                          </div>

                          {/* Code badge */}
                          {card.code && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-white bg-opacity-80 rounded-full text-xs font-bold text-gray-800 z-10">
                              {card.code}
                            </div>
                          )}

                          <div className="p-4 pb-3 flex items-start justify-between relative">
                            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white bg-opacity-20 text-white text-sm font-bold shadow-md">
                              {card.name}
                            </div>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>

                          <div className="p-4 pt-2">
                            <div className="mb-8">
                              <p className="text-white text-sm text-justify font-semibold opacity-90 mb-1">
                                {card.title}
                              </p>
                              <p className="text-white text-xs text-justify opacity-75 line-clamp-2">
                                {card.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          )}

          {/* Right column */}
          <div
            className={`w-full ${showTwoColumns ? "md:w-2/3" : "w-full"}`}
            ref={rightColumnRef}
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <StepOne
                  goals={goals}
                  selectedGoal={selectedGoal}
                  onNext={handleGoalSelect}
                />
              )}
              {currentStep === 2 && (
                <StepTwo
                  onNext={handlePillarSelect}
                  onPrevious={handlePrevious}
                  pillars={pillars}
                  selectedPillar={selectedPillar}
                  goalColorIndex={selectedColorIndex}
                  selectedGoal={selectedGoal ?? ""}
                />
              )}
              {currentStep === 3 && (
                <StepThree
                  services={services}
                  onNext={handleServiceSelect}
                  onPrevious={handlePrevious}
                  selectedService={selectedService}
                  goalColorIndex={selectedColorIndex}
                />
              )}
              {currentStep === 4 && (
                <StepFour
                  subServices={subServices}
                  onNext={handleSubServiceSelect}
                  onPrevious={handlePrevious}  // <-- pass the handler
                  selectedSubService={selectedSubService}
                  goalColorIndex={selectedColorIndex}
                />
              )}

              {currentStep === 5 && (
                <StepFive ref={stepFiveRef} onNext={handleProjectDetails} onPrevious={handlePrevious} />
              )}
              {currentStep === 6 && (
                <StepSix
                  selectedCards={selectedCards}
                  projectDetails={projectDetails}
                  onPrevious={handlePrevious}
                  onClearData={clearAllData}
                  onEditProjectDetails={handleEditProjectDetails}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Rooms;
