"use client";
import React, { useEffect, useState, useRef, useMemo, Component, ErrorInfo, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { useTranslation } from "react-i18next";
import { useI18n } from "@/context/I18nProvider";

// Error Boundary to catch multilingual object errors
interface ErrorBoundaryProps {
  children: ReactNode;
  stepName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class StepErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 ERROR in ${this.props.stepName}:`, error);
    console.error('Error details:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    
    if (error.message.includes('Objects are not valid as a React child')) {
      console.error('🚨 This is the multilingual object error!');
      console.error('The error occurred in:', this.props.stepName);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-bold">Error in {this.props.stepName}</h3>
          <p className="text-red-600 text-sm mt-2">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
import { useProjectSubmission, ProjectSubmissionData } from "@/hooks/useProjectSubmission";
import { saveProjectToLocal, handleMultipleFileUploads, getProjectsFromLocal } from "@/utils/localStorage";


const Rooms = () => {
  const { t, i18n } = useTranslation("common");
  const { isRTL, currentLanguage } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const stepFiveRef = useRef<StepFiveRef>(null);
  const { submitProject, isSubmitting, submissionResult, resetSubmission } = useProjectSubmission();
  const [localSubmissionResult, setSubmissionResult] = useState<{success: boolean, projectId?: string, message?: string, error?: string} | null>(null);

  // GSAP animation refs
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<HTMLDivElement[]>([]);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Function to add ref to contentRefs array
  const addContentRef = (el: HTMLDivElement | null) => {
    if (el && !contentRefs.current.includes(el)) {
      contentRefs.current.push(el);
    }
  };

  // Language loading effect
  useEffect(() => {
    setIsLanguageLoaded(true);
    setHasAnimated(false); // Reset animation state when language changes
  }, [currentLanguage]);

  // Clear refs when language changes
  useEffect(() => {
    contentRefs.current = [];
    setHasAnimated(false); // Reset animation state when language changes
  }, [currentLanguage]);

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

  // Memoize selected cards to force re-render when language changes
  const memoizedSelectedCards = useMemo(() => {
    const migratedCards = selectedCards.map(card => {
      // Migrate string-based cards to multilingual objects
      let migratedCard = { ...card };
      
      // If title is a string, convert it to multilingual object
      if (typeof card.title === 'string') {
        migratedCard.title = {
          en: card.title,
          fr: card.title,
          ar: card.title
        };
      }
      
      // If desc is a string, convert it to multilingual object
      if (typeof card.desc === 'string') {
        migratedCard.desc = {
          en: card.desc,
          fr: card.desc,
          ar: card.desc
        };
      }
      
      return {
        ...migratedCard,
        // Force re-evaluation of title text when language changes
        _langKey: i18n.language
      };
    });
    
    // Save migrated cards back to localStorage if any were migrated
    const hasStringCards = selectedCards.some(card => 
      typeof card.title === 'string' || typeof card.desc === 'string'
    );
    
    if (hasStringCards) {
      const cardsToSave = migratedCards.map(card => {
        const { _langKey, ...cardWithoutLangKey } = card;
        return cardWithoutLangKey;
      });
      localStorage.setItem('selectedCards', JSON.stringify(cardsToSave));
    }
    
    return migratedCards;
  }, [selectedCards, i18n.language]);

  // Force re-render when language changes
  const [languageKey, setLanguageKey] = useState(0);
  useEffect(() => {
    setLanguageKey(prev => prev + 1);
  }, [i18n.language]);

  // Create a component that will re-render when language changes
  const SelectedCardText = React.memo(({ card }: { card: any }) => {
    const { i18n } = useTranslation("common");
    const currentLang = i18n.language || "en";
    
    console.log('SelectedCardText rendering for card:', card.id, 'language:', currentLang);
    
    // Try to get translated title from the card data
    if (card.title && typeof card.title === 'object') {
      const result = card.title[currentLang] || card.title.en || card.title;
      if (typeof result === 'string') {
        return <span>{decodeHtmlEntities(result)}</span>;
      } else {
        const stringResult = Object.values(result).find(val => typeof val === 'string');
        return <span>{stringResult ? decodeHtmlEntities(stringResult) : String(t("noDescription"))}</span>;
      }
    }
    
    // Try desc field if title doesn't have translations
    if (card.desc && typeof card.desc === 'object') {
      const result = card.desc[currentLang] || card.desc.en || card.desc;
      if (typeof result === 'string') {
        return <span>{decodeHtmlEntities(result)}</span>;
      } else {
        const stringResult = Object.values(result).find(val => typeof val === 'string');
        return <span>{stringResult ? decodeHtmlEntities(stringResult) : String(t("noDescription"))}</span>;
      }
    }
    
    // If title is a string, return it as is
    if (typeof card.title === 'string') {
      return <span>{decodeHtmlEntities(card.title)}</span>;
    }
    
    // If desc is a string, return it as is
    if (typeof card.desc === 'string') {
      return <span>{decodeHtmlEntities(card.desc)}</span>;
    }
    
    return <span>{String(t("noDescription"))}</span>;
  });
  SelectedCardText.displayName = 'SelectedCardText';

  // Create a separate component for the entire selected cards section
  const SelectedCardsSection = React.memo(() => {
    const { t, i18n } = useTranslation("common");
    const currentLang = i18n.language || "en";
    
    console.log('SelectedCardsSection rendering for language:', currentLang);
    console.log('Selected cards:', memoizedSelectedCards);
    
    return (
      <div className="relative min-h-[120px] flex flex-col gap-4" style={{ direction: 'ltr' }}>
        {memoizedSelectedCards.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
            {String(t("noSelections"))}
          </div>
        ) : (
          <AnimatePresence>
            {memoizedSelectedCards.slice().reverse().map((card, index) => {
              const isLastSelected = index === 0;
              const originalIndex = memoizedSelectedCards.length - 1 - index;
              
              return (
                <motion.div
                  key={`${card.type}-${card.id || originalIndex}-${currentLang}-${languageKey}`}
                  className={`w-full relative ${isLastSelected ? "z-20" : "z-10"}`}
                  initial={{ 
                    opacity: 0, 
                    y: isLastSelected ? 60 : 30, 
                    scale: isLastSelected ? 0.9 : 0.95,
                    rotateX: isLastSelected ? 5 : 0
                  }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: isLastSelected ? 1.02 : 0.98,
                    rotateX: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: -20,
                    scale: 0.95
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: "easeOut",
                    delay: isLastSelected ? 0 : 0.05
                  }}
                  whileHover={{ 
                    scale: isLastSelected ? 1.05 : 1.02,
                    y: isLastSelected ? -2 : -1,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className={`h-full rounded-3xl shadow-xl overflow-hidden transition-all duration-500 relative border border-white/10 ${
                    cardColors[card.colorIndex % cardColors.length].bg
                  } ${
                    isLastSelected 
                      ? "shadow-2xl ring-2 ring-white ring-opacity-40 transform-gpu" 
                      : "shadow-lg opacity-90 hover:opacity-95"
                  }`}
                  style={{
                    transform: isLastSelected 
                      ? "translateY(-6px) rotateX(-1deg)" 
                      : "translateY(0px)",
                    filter: isLastSelected 
                      ? "brightness(1.05) contrast(1.02)" 
                      : "brightness(0.98)"
                  }}>

                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

                    {/* Type badge */}
                    <div className={`absolute top-3 left-4 px-3 py-1.5 rounded-full text-xs font-bold z-10 transition-all duration-300 whitespace-nowrap backdrop-blur-sm ${
                      isLastSelected 
                        ? "bg-white/95 text-gray-800 shadow-lg border border-white/20" 
                        : "bg-white/85 text-gray-700 border border-white/30"
                    }`}
                    style={{
                      width: 'auto',
                      minWidth: 'fit-content',
                      maxWidth: 'calc(100% - 2rem)',
                      position: 'absolute',
                      top: '0.25rem',
                      left: '3rem',
                      right: 'auto',
                      direction: 'ltr'
                    }}>
                      {getCardTitle(card.type)}
                    </div>

                    {/* Header with code and checkmark */}
                    <div className="p-4 pb-3 flex items-start justify-between relative">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-white text-sm font-bold shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20 ${
                        isLastSelected 
                          ? "bg-white/25 scale-110" 
                          : "bg-white/20 hover:bg-white/25"
                      }`}>
                        {typeof card.code === 'string' ? card.code : card.id}
                      </div>
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-300 border border-white/30 ${
                        isLastSelected ? "scale-110" : "scale-100"
                      }`}>
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="p-4 pt-2">
                      <div className="mb-4">
                        <p className={`text-white text-sm leading-relaxed font-medium transition-all duration-300 ${
                          isLastSelected ? "opacity-100" : "opacity-90"
                        }`}
                        style={{ 
                          direction: currentLang === 'ar' ? 'rtl' : 'ltr',
                          textAlign: currentLang === 'ar' ? 'right' : 'left'
                        }}>
                          <SelectedCardText card={card} />
                        </p>
                      </div>
                    </div>

                    {/* Enhanced glow effect for last selected card */}
                    {isLastSelected && (
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 via-transparent to-white/10 opacity-60 pointer-events-none"></div>
                    )}

                    {/* Subtle border highlight */}
                    <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none"></div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    );
  });
  SelectedCardsSection.displayName = 'SelectedCardsSection';

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
    title: any, // Can be string or multilingual object
    desc: any, // Can be string or multilingual object
    colorIndex: number,
    code?: string
  ) => {
    const newCard = { type, id, title, desc, colorIndex, code };
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

        // ✅ Ensure every card keeps its type for the badge and extract correct language values
        const currentLang = (i18n.language || "en") as "en" | "fr" | "ar";
        const cardsWithType = parsedCards.map((card: any) => {
          const migratedCard = {
            ...card,
            type: card.type || "unknown", // keep type or fallback
          };

          // Extract the correct language value from title
          if (typeof card.title === 'object' && card.title !== null) {
            migratedCard.title = card.title[currentLang] || card.title.en || card.title || '';
          } else if (typeof card.title === 'string') {
            migratedCard.title = card.title;
          } else {
            migratedCard.title = '';
          }

          // Extract the correct language value from desc
          if (typeof card.desc === 'object' && card.desc !== null) {
            migratedCard.desc = card.desc[currentLang] || card.desc.en || card.desc || migratedCard.title;
          } else if (typeof card.desc === 'string') {
            migratedCard.desc = card.desc;
          } else {
            migratedCard.desc = migratedCard.title;
          }

          return migratedCard;
        });

        setSelectedCards(cardsWithType);
        
        // Save migrated cards back to localStorage
        localStorage.setItem('selectedCards', JSON.stringify(cardsWithType));

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
}, [i18n.language]);


  // Handle goal selection
  const handleGoalSelect = (goalId: string, colorIndex: number) => {
    setSelectedGoal(goalId);
    setSelectedColorIndex(colorIndex);
    setShowTwoColumns(true);

    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      // Extract the correct language value from the title and desc objects
      const currentLang = (i18n.language || "en") as "en" | "fr" | "ar";
      // Store the original multilingual objects instead of resolved strings
      addSelectedCard("goal", goal.id, goal.title, goal.desc, colorIndex, goal.code);
    }

    // Load pillars for this goal
    const goalPillars = pillarsData[goalId] || [];
    setPillars(goalPillars);

    setCurrentStep(2);
  };


  // Handle pillar selection
  const handlePillarSelect = (pillarId: string) => {
    console.log("🟢 Service card clicked ID:", pillarId);
    setSelectedPillar(pillarId);

    const pillar = pillars.find((p) => p.id === pillarId);
    if (pillar && selectedColorIndex !== null) {
      // Extract the correct language value from the title object
      const currentLang = (i18n.language || "en") as "en" | "fr" | "ar";
      // Store the original multilingual objects instead of resolved strings
      addSelectedCard("pillar", pillar.id, pillar.title, pillar.desc || pillar.title, selectedColorIndex, pillar.code);
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
      // Extract the correct language value from the service data
      const currentLang = i18n.language || "en";
      // Create multilingual objects for service
      const serviceTitle = {
        en: service.title,
        fr: service.name_service_fr_c || service.title,
        ar: service.name_service_ar_c || service.title
      };
      const serviceDesc = {
        en: service.desc,
        fr: service.description_service_fr_c || service.desc,
        ar: service.description_service_ar_c || service.desc
      };

      addSelectedCard("service", service.id, serviceTitle, serviceDesc, selectedColorIndex, service.code);
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
      // Extract the correct language value from the sub-service data
      const currentLang = i18n.language || "en";
      // Create multilingual objects for sub-service
      const subServiceTitle = {
        en: subService.description || subService.name,
        fr: subService.name_fr_c || subService.description || subService.name,
        ar: subService.name_ar_c || subService.description || subService.name
      };
      const subServiceDesc = {
        en: subService.description_subservice_en_c || subService.description_subservice,
        fr: subService.description_subservice_fr_c || subService.description_subservice,
        ar: subService.description_subservice_ar_c || subService.description_subservice
      };

      addSelectedCard("subService", subService.id, subServiceTitle, subServiceDesc, selectedColorIndex, subService.name);
    }

    setCurrentStep(5);
  };


  // Handle project details (step 5) - just save and move to step 6
  const handleProjectDetails = () => {
    const details = stepFiveRef.current?.getFormValues();
    if (details) {
      console.log('=== CONTENT.TSX: Processing Step 5 details ===');
      console.log('Raw details from StepFive:', details);
      
      // Sanitize the details to ensure no multilingual objects
      const sanitizeValue = (value: any): any => {
        if (value && typeof value === 'object' && !Array.isArray(value) && !React.isValidElement(value)) {
          if (value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
            console.warn('🚨 Found multilingual object in project details:', value);
            return String(value.en || value.fr || value.ar || '');
          }
          // Recursively sanitize object properties
          const sanitized: any = {};
          for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeValue(val);
          }
          return sanitized;
        } else if (Array.isArray(value)) {
          return value.map(item => sanitizeValue(item));
        }
        return value;
      };
      
      const sanitizedDetails = sanitizeValue(details);
      console.log('Sanitized details:', sanitizedDetails);
      
      setProjectDetails(sanitizedDetails);
      setCurrentStep(6);
    }
  };

  // Handle project submission (step 6)
  const handleProjectSubmission = async () => {
    if (!projectDetails) {
      console.error('No project details available for submission');
      return;
    }
    
    try {
      // Handle file uploads first
      let supportingDocuments: string[] = [];
      if (projectDetails.files && projectDetails.files.length > 0) {
        console.log('Uploading files:', projectDetails.files);
        console.log('File details:', projectDetails.files.map((f: File) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          isFile: f instanceof File,
          constructor: f.constructor.name
        })));
        supportingDocuments = await handleMultipleFileUploads(projectDetails.files);
        console.log('Files uploaded successfully:', supportingDocuments);
      }
      
      // Prepare project data for CRM submission
      const projectData = {
        // Basic project info
        name: projectDetails.title || '',
        description: projectDetails.brief || '',
        project_brief: projectDetails.brief || '',
        problem_statement: projectDetails.rationale || '',
        rationale_impact: projectDetails.rationale || '',
        
        // Strategic selections - get codes from selectedCards (ensure they are strings)
        strategic_goal: (() => {
          const goalCard = selectedCards.find(card => card.type === 'goal');
          const code = goalCard?.code;
          return typeof code === 'string' ? code : selectedGoal || '';
        })(),
        strategic_goal_id: selectedGoal || '',
        pillar: (() => {
          const pillarCard = selectedCards.find(card => card.type === 'pillar');
          const code = pillarCard?.code;
          return typeof code === 'string' ? code : selectedPillar || '';
        })(),
        pillar_id: selectedPillar || '',
        service: (() => {
          const serviceCard = selectedCards.find(card => card.type === 'service');
          const code = serviceCard?.code;
          return typeof code === 'string' ? code : selectedService || '';
        })(),
        service_id: selectedService || '',
        sub_service: (() => {
          const subServiceCard = selectedCards.find(card => card.type === 'subService');
          const code = subServiceCard?.code;
          return typeof code === 'string' ? code : selectedSubService || '';
        })(),
        sub_service_id: selectedSubService || '',
        
        // Beneficiaries - ensure all are strings
        beneficiaries: (projectDetails.beneficiaries || []).map((b: any) => typeof b === 'string' ? b : String(b)),
        other_beneficiaries: projectDetails.otherBeneficiary || '',
        
        // Budget and timeline
        budget_icesco: parseFloat(projectDetails.budget?.icesco) || 0,
        budget_member_state: parseFloat(projectDetails.budget?.member_state) || 0,
        budget_sponsorship: parseFloat(projectDetails.budget?.sponsorship) || 0,
        start_date: projectDetails.startDate || '',
        end_date: projectDetails.endDate || '',
        frequency: projectDetails.projectFrequency || '',
        frequency_duration: projectDetails.frequencyDuration || '',
        
        // Partners and scope - ensure all are strings
        partners: (projectDetails.partners || []).map((p: any) => typeof p === 'string' ? p : String(p)),
        institutions: (projectDetails.partners || []).map((p: any) => typeof p === 'string' ? p : String(p)), // Using partners as institutions for now
        delivery_modality: projectDetails.deliveryModality || '',
        geographic_scope: projectDetails.geographicScope || '',
        convening_method: projectDetails.conveningMethod || '',
        project_type: projectDetails.conveningMethod || '', // Using convening method as project type for now
        project_type_other: projectDetails.conveningMethodOther || '',
        
        // Monitoring and evaluation - ensure all are strings
        milestones: (projectDetails.milestones || []).map((m: any) => typeof m === 'string' ? m : String(m)),
        expected_outputs: projectDetails.expectedOutputs ? [String(projectDetails.expectedOutputs)] : [],
        kpis: (projectDetails.kpis || []).map((k: any) => typeof k === 'string' ? k : String(k)),
        
        // Contact information
        contact_name: projectDetails.contact?.name || '',
        contact_email: projectDetails.contact?.email || '',
        contact_phone: projectDetails.contact?.phone || '',
        contact_role: projectDetails.contact?.role || '',
        contact_id: (() => {
          // Get the contact ID from localStorage
          try {
            const contactInfo = JSON.parse(localStorage.getItem('contactInfo') || '{}');
            return contactInfo.id || '';
          } catch {
            return '';
          }
        })(),
        
        // Additional info
        comments: projectDetails.comments || '',
        // Note: supporting_documents is expected to be File[] but we have URLs
        // We'll store the URLs in comments instead
        supporting_documents: [], // Empty array since we have URLs, not Files
      };

      // Submit to CRM using the hook
      const result = await submitProject(projectData);
      
      if (result.success) {
        // Also save to local storage for backup
        const projectId = saveProjectToLocal(projectData);
        console.log('Project submitted to CRM and saved locally with ID:', projectId);
        
        // Update submission result to show success
        setSubmissionResult({
          success: true,
          projectId: result.projectId || projectId,
          message: result.message || String(t('projectSubmittedSuccessfully'))
        });
      } else {
        // If CRM submission fails, still save locally as draft
        const projectId = saveProjectToLocal(projectData);
        console.log('CRM submission failed, saved locally as draft with ID:', projectId);
        
        setSubmissionResult({
          success: false,
          error: result.error || 'Failed to submit project to CRM. Saved locally as draft.',
          projectId: projectId
        });
      }
      
    } catch (error) {
      console.error('Error during project submission:', error);
      
      // Try to save locally as backup
      try {
        // Create a minimal project data for local backup
        const backupProjectData = {
          name: projectDetails.title || 'Draft Project',
          description: projectDetails.brief || '',
          project_brief: projectDetails.brief || '',
          problem_statement: projectDetails.rationale || '',
          rationale_impact: projectDetails.rationale || '',
          strategic_goal: (() => {
            const goalCard = selectedCards.find(card => card.type === 'goal');
            const code = goalCard?.code;
            return typeof code === 'string' ? code : selectedGoal || '';
          })(),
          strategic_goal_id: selectedGoal || '',
          pillar: (() => {
            const pillarCard = selectedCards.find(card => card.type === 'pillar');
            const code = pillarCard?.code;
            return typeof code === 'string' ? code : selectedPillar || '';
          })(),
          pillar_id: selectedPillar || '',
          service: (() => {
            const serviceCard = selectedCards.find(card => card.type === 'service');
            const code = serviceCard?.code;
            return typeof code === 'string' ? code : selectedService || '';
          })(),
          service_id: selectedService || '',
          sub_service: (() => {
            const subServiceCard = selectedCards.find(card => card.type === 'subService');
            const code = subServiceCard?.code;
            return typeof code === 'string' ? code : selectedSubService || '';
          })(),
          sub_service_id: selectedSubService || '',
          beneficiaries: projectDetails.beneficiaries || [],
          other_beneficiaries: projectDetails.otherBeneficiary || '',
          budget_icesco: parseFloat(projectDetails.budget?.icesco) || 0,
          budget_member_state: parseFloat(projectDetails.budget?.member_state) || 0,
          budget_sponsorship: parseFloat(projectDetails.budget?.sponsorship) || 0,
          start_date: projectDetails.startDate || '',
          end_date: projectDetails.endDate || '',
          frequency: projectDetails.projectFrequency || '',
          frequency_duration: projectDetails.frequencyDuration || '',
          partners: projectDetails.partners || [],
          institutions: projectDetails.partners || [],
          delivery_modality: projectDetails.deliveryModality || '',
          geographic_scope: projectDetails.geographicScope || '',
          convening_method: projectDetails.conveningMethod || '',
          project_type: projectDetails.conveningMethod || '',
          project_type_other: projectDetails.conveningMethodOther || '',
          milestones: projectDetails.milestones || [],
          expected_outputs: projectDetails.expectedOutputs ? [projectDetails.expectedOutputs] : [],
          kpis: projectDetails.kpis || [],
          contact_name: projectDetails.contact?.name || '',
          contact_email: projectDetails.contact?.email || '',
          contact_phone: projectDetails.contact?.phone || '',
          contact_role: projectDetails.contact?.role || '',
          comments: projectDetails.comments || '',
          supporting_documents: []
        };
        
        const projectId = saveProjectToLocal(backupProjectData);
        setSubmissionResult({
          success: false,
          error: 'Failed to submit project. Saved locally as draft.',
          projectId: projectId
        });
      } catch (localError) {
        console.error('Error saving locally:', localError);
        setSubmissionResult({
          success: false,
          error: 'Failed to submit project and save locally. Please try again.'
        });
      }
    }
  };

  // Handle navigation
  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      // Remove cards of steps after prevStep
      setSelectedCards((cards) => {
        const filteredCards = cards.filter((card) => {
          switch (card.type) {
            case 'goal': return prevStep >= 2; // Remove goal when going back to step 1
            case 'pillar': return prevStep >= 3; // Remove pillar when going back to step 2 or earlier
            case 'service': return prevStep >= 4; // Remove service when going back to step 3 or earlier
            case 'subService': return prevStep >= 5; // Remove sub-service when going back to step 4 or earlier
            default: return true;
          }
        });
        
        // Update localStorage with filtered cards
        localStorage.setItem('selectedCards', JSON.stringify(filteredCards));
        return filteredCards;
      });
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

  const getCardDescription = (card: any) => {
    const currentLang = i18n.language || "en";
    
    // Debug log
    console.log('Card desc data:', card.desc, 'Current lang:', currentLang);
    
    // Try to get translated description from the card data
    if (card.desc && typeof card.desc === 'object') {
      const result = card.desc[currentLang] || card.desc.en || card.desc;
      console.log('Translated desc:', result);
      // Ensure we return a string, not an object
      if (typeof result === 'string') {
        return decodeHtmlEntities(result);
      } else {
        // If result is still an object, try to get a string value
        const stringResult = Object.values(result).find(val => typeof val === 'string');
        return stringResult ? decodeHtmlEntities(stringResult) : t("noDescription");
      }
    }
    
    // If desc is a string, return it as is
    if (typeof card.desc === 'string') {
      console.log('String desc:', card.desc);
      return decodeHtmlEntities(card.desc);
    }
    
    // Fallback to title if no description
    if (card.title && typeof card.title === 'object') {
      const result = card.title[currentLang] || card.title.en || card.title;
      if (typeof result === 'string') {
        return decodeHtmlEntities(result);
      } else {
        const stringResult = Object.values(result).find(val => typeof val === 'string');
        return stringResult ? decodeHtmlEntities(stringResult) : t("noDescription");
      }
    }
    
    return card.title || t("noDescription");
  };

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const getCardTitleText = (card: any) => {
    const currentLang = i18n.language || "en";
    
    // Debug: Log the card structure
    console.log('Card data:', card, 'Current lang:', currentLang);
    
    // Try to get translated title from the card data
    if (card.title && typeof card.title === 'object') {
      const result = card.title[currentLang] || card.title.en || card.title;
      console.log('Title result:', result);
      // Ensure we return a string, not an object
      if (typeof result === 'string') {
        return decodeHtmlEntities(result);
      } else {
        // If result is still an object, try to get a string value
        const stringResult = Object.values(result).find(val => typeof val === 'string');
        return stringResult ? decodeHtmlEntities(stringResult) : t("noDescription");
      }
    }
    
    // Try desc field if title doesn't have translations
    if (card.desc && typeof card.desc === 'object') {
      const result = card.desc[currentLang] || card.desc.en || card.desc;
      console.log('Desc result:', result);
      if (typeof result === 'string') {
        return decodeHtmlEntities(result);
      } else {
        const stringResult = Object.values(result).find(val => typeof val === 'string');
        return stringResult ? decodeHtmlEntities(stringResult) : t("noDescription");
      }
    }
    
    // If title is a string, return it as is
    if (typeof card.title === 'string') {
      return decodeHtmlEntities(card.title);
    }
    
    // If desc is a string, return it as is
    if (typeof card.desc === 'string') {
      return decodeHtmlEntities(card.desc);
    }
    
    return t("noDescription");
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
      // Set initial state to prevent horizontal overflow
      gsap.set(rightColumnRef.current, { x: 50, opacity: 0 });
      
      gsap.to(rightColumnRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  }, [showTwoColumns, currentStep]);

  // Prevent horizontal scrollbar when two-column layout is active
  useEffect(() => {
    if (showTwoColumns) {
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, [showTwoColumns]);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    if (!isLanguageLoaded || hasAnimated || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            console.log('Content section came into view - starting GSAP animations...', {
              titleRef: !!titleRef.current,
              descriptionRef: !!descriptionRef.current,
              stepperRef: !!stepperRef.current,
              contentRefs: contentRefs.current.length,
              containerRef: !!containerRef.current
            });

            setHasAnimated(true);

            const ctx = gsap.context(() => {
              // Animate title
              if (titleRef.current) {
                console.log('Animating Content title...');
      gsap.fromTo(
                  titleRef.current,
                  { opacity: 0, y: 30, scale: 0.95 },
                  { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
                );
              }

              // Animate description
              if (descriptionRef.current) {
                console.log('Animating Content description...');
                gsap.fromTo(
                  descriptionRef.current,
                  { opacity: 0, y: 20 },
                  { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
                );
              }

              // Animate stepper
              if (stepperRef.current) {
                console.log('Animating Content stepper...');
                gsap.fromTo(
                  stepperRef.current,
                  { opacity: 0, y: 40 },
                  { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.4 }
                );
              }

              // Animate content elements
              if (contentRefs.current && contentRefs.current.length > 0) {
                console.log('Animating Content elements...', contentRefs.current.length);
                gsap.fromTo(
                  contentRefs.current,
                  { opacity: 0, y: 30 },
                  { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.6 }
                );
              }
            }, containerRef);

            // Disconnect observer after animation
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the section is visible
        rootMargin: '0px 0px -50px 0px' // Start animation slightly before fully in view
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLanguageLoaded, hasAnimated]);


  return (
    <section 
      ref={containerRef}
      id="next-section" 
      className="bg-white-100 py-6 lg:py-8 w-full px-4 md:px-6 lg:px-8 relative overflow-x-hidden"
    >
      <div className="text-center mt-6 sm:mt-8 xl:mt-0">
          <h2 
            ref={titleRef}
            className="text-gradient uppercase text-xl xs:text-2xl leading-none lg:text-3xl desktop:text-4xl"
            style={{ opacity: 0, transform: 'translateY(30px) scale(0.95)' }}
          >
          {String(t("takePartInStrategy"))}
        </h2>
        <p 
          ref={descriptionRef}
          className="uppercase mt-4 text-gradient text-sm lg:text-base 2xl:text-lg max-lg:hidden"
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          {String(t("submitAndTrackProposal"))}
        </p>
      </div>

      {/* Stepper */}
      <section 
        ref={stepperRef}
        className="mt-8 md:mt-12 flex flex-col items-center"
        style={{ opacity: 0, transform: 'translateY(40px)' }}
      >
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
          className={`relative w-full px-4 md:px-6 lg:px-8 mt-8 overflow-x-hidden ${showTwoColumns ? "flex flex-col md:flex-row gap-12" : ""
            }`}
          style={{ direction: 'ltr' }}
        >
          {/* Left column */}
          {showTwoColumns && (
            <div className="hidden md:flex md:w-1/3 flex-col-reverse justify-between mt-8 mb-4 md:mb-0" style={{ direction: 'ltr' }}>
              <div className="h-[80px]"></div>
              <div className="sticky top-4 space-y-3" style={{ direction: 'ltr' }}>
                <div className="text-sm font-semibold text-gray-600 mb-2">
                  {String(t("yourSelections"))}
                </div>
                <SelectedCardsSection />

                            </div>
            </div>
          )}

          {/* Right column */}
          <div
            className={`w-full overflow-x-hidden ${showTwoColumns ? "md:w-2/3" : "w-full"}`}
            ref={rightColumnRef}
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <div 
                  ref={addContentRef}
                  style={{ opacity: 0, transform: 'translateY(30px)' }}
                >
                <StepOne
                  goals={goals}
                  selectedGoal={selectedGoal}
                  onNext={handleGoalSelect}
                />
                </div>
              )}
              {currentStep === 2 && (
                <div 
                  ref={addContentRef}
                  style={{ opacity: 0, transform: 'translateY(30px)' }}
                >
                <StepTwo
                  onNext={handlePillarSelect}
                  onPrevious={handlePrevious}
                  pillars={pillars}
                  selectedPillar={selectedPillar}
                  goalColorIndex={selectedColorIndex}
                  selectedGoal={selectedGoal ?? ""}
                />
                </div>
              )}
              {currentStep === 3 && (
                <div 
                  ref={addContentRef}
                  style={{ opacity: 0, transform: 'translateY(30px)' }}
                >
                <StepThree
                  services={services}
                  onNext={handleServiceSelect}
                  onPrevious={handlePrevious}
                  selectedService={selectedService}
                  goalColorIndex={selectedColorIndex}
                />
                </div>
              )}
              {currentStep === 4 && (
                <div 
                  ref={addContentRef}
                  style={{ opacity: 0, transform: 'translateY(30px)' }}
                >
                <StepFour
                  subServices={subServices}
                  onNext={handleSubServiceSelect}
                  onPrevious={handlePrevious}  // <-- pass the handler
                  selectedSubService={selectedSubService}
                  goalColorIndex={selectedColorIndex}
                />
                </div>
              )}

              {currentStep === 5 && (
                <div 
                  ref={addContentRef}
                  style={{ opacity: 0, transform: 'translateY(30px)' }}
                >
                <StepErrorBoundary stepName="Step 5 (Project Details)">
                  <StepFive ref={stepFiveRef} onNext={handleProjectDetails} onPrevious={handlePrevious} />
                </StepErrorBoundary>
                </div>
              )}
              {currentStep === 6 && (
                <div 
                  ref={addContentRef}
                  style={{ opacity: 0, transform: 'translateY(30px)' }}
                >
                <StepErrorBoundary stepName="Step 6 (Review & Submit)">
                  <StepSix
                    selectedCards={selectedCards}
                    projectDetails={projectDetails}
                    onPrevious={handlePrevious}
                    onClearData={clearAllData}
                    onEditProjectDetails={handleEditProjectDetails}
                    onSubmit={handleProjectSubmission}
                  submissionResult={localSubmissionResult || submissionResult}
                  isSubmitting={isSubmitting}
                />
                </StepErrorBoundary>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Rooms;
  