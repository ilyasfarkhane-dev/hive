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
import { saveProjectToLocal, handleMultipleFileUploads, getProjectsFromLocal, handleFileUpload } from "@/utils/localStorage";


const Rooms = () => {
  const { t, i18n } = useTranslation("common");
  const { isRTL, currentLanguage } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const stepFiveRef = useRef<StepFiveRef>(null);
  const { submitProject, saveAsDraft, updateProject, retrySubmission, isSubmitting, isRetrying, submissionResult, setSubmissionResult, retryCount, maxRetries, resetSubmission } = useProjectSubmission();
  const [showDraftButton, setShowDraftButton] = useState(false);
  const [showFloatingDraft, setShowFloatingDraft] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [isReconstructingCards, setIsReconstructingCards] = useState(false);

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

  // Debug draft button state changes
  useEffect(() => {
    console.log('🎫 Draft button state changed:', showDraftButton);
  }, [showDraftButton]);

  // Hide draft button when project is successfully submitted
  useEffect(() => {
    if (submissionResult?.success) {
      setShowDraftButton(false);
    }
  }, [submissionResult?.success]);

  // Show two-column layout when selected cards are loaded (for editing mode)
  useEffect(() => {
    const isEditing = localStorage.getItem('isEditingProject') === 'true';
    if (isEditing && selectedCards.length > 0) {
      setShowTwoColumns(true);
    }
  }, [selectedCards, showTwoColumns]);

  // Check for editing mode and pre-fill form data - optimized
  useEffect(() => {
    // Use requestIdleCallback for non-critical initialization
    const initEditingMode = () => {
      const isEditing = localStorage.getItem('isEditingProject') === 'true';
      const editingProjectId = localStorage.getItem('editingProjectId');
      
      if (isEditing && editingProjectId) {
        setIsEditingLoading(true);
        
        // Add a small delay to ensure other components are ready
        setTimeout(() => {
          // Load the saved form data
          const savedData = localStorage.getItem('projectDetails');
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
            
              // Pre-fill the form with saved data
              setProjectDetails(parsedData);
              
              // Set selected cards based on strategic selections
              if (parsedData.selectedGoal) {
                setSelectedGoal(parsedData.selectedGoal);
              }
              if (parsedData.selectedPillar) {
                setSelectedPillar(parsedData.selectedPillar);
              }
              if (parsedData.selectedService) {
                setSelectedService(parsedData.selectedService);
              }
              if (parsedData.selectedSubService) {
                setSelectedSubService(parsedData.selectedSubService);
              }

              // Store the parsed data for later reconstruction when data is loaded
              localStorage.setItem('editingProjectData', JSON.stringify(parsedData));
            
            // Load services and subservices based on selected pillar and service
            if (parsedData.selectedPillar) {
              const pillarServicesRaw = pillarServicesData[parsedData.selectedPillar] || [];
              const pillarServices = pillarServicesRaw.map((s: any, index: number) => {
                return {
                  id: s.id || s.code || `service-${index}`,
                  code: s.code,
                  title: s.description_service,
                  description: s.description,
                  description_service: s.description_service,
                  description_service_fr_c: s.description_service_fr_c,
                  description_service_ar_c: s.description_service_ar_c,
                  name_service_fr_c: s.name_service_fr_c,
                  name_service_ar_c: s.name_service_ar_c,
                  name_service: s.description_service,
                };
              });
              setServices(pillarServices);
              
              // Load subservices if service is selected
              if (parsedData.selectedService) {
               
                const serviceSubservicesRaw = serviceSubservicesData[parsedData.selectedService as keyof typeof serviceSubservicesData] || [];
             
                const serviceSubservices = serviceSubservicesRaw.map((s: any, index: number) => {
                  const mappedSubservice = {
                    id: s.id || s.code || `subservice-${index}`,
                    code: s.code,
                    title: s.description_subservice,
                    description: s.description,
                    description_subservice: s.description_subservice,
                    description_subservice_fr_c: s.description_subservice_fr_c,
                    description_subservice_ar_c: s.description_subservice_ar_c,
                    name_subservice_fr_c: s.name_subservice_fr_c,
                    name_subservice_ar_c: s.name_subservice_ar_c,
                    name_subservice: s.description_subservice,
                  };
                  return mappedSubservice;
                });
                
                 setSubServices(serviceSubservices);
              } else {
                console.log('❌ No selected service found for subservices loading');
              }
            }
            
            // Go directly to step 5 but keep selected cards visible
            setCurrentStep(5);
            
            // Show two-column layout for selected cards sidebar
            // This will be shown when selected cards are loaded
            
            // Show draft button since we have project title
            setShowDraftButton(true);
            
          } catch (error) {
            console.error('Error parsing saved form data:', error);
          }
        } else {
          setIsEditingLoading(false);
        }
        
        // Set editing loading to false after initialization
        setIsEditingLoading(false);
        }, 200); // End of setTimeout
      } else {
        // Normal flow - check draft button state
        const hasSelectedCards = selectedCards.length > 0;
        
        if (hasSelectedCards) {
          // Check localStorage for project title when cards are selected
          try {
            const savedData = localStorage.getItem('projectDetails');
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              const hasProjectTitle = parsedData.title && parsedData.title.trim() !== '';
              setShowDraftButton(hasProjectTitle);
            }
          } catch (error) {
            console.error('Error checking localStorage on mount:', error);
          }
        }
      }
    };

    // Initialize editing mode immediately
    initEditingMode();
  }, []); // Remove selectedCards dependency to prevent infinite reloads

  // GSAP animation refs
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<HTMLDivElement[]>([]);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(true); // Start as loaded
  const [hasAnimated, setHasAnimated] = useState(false);

  // Function to add ref to contentRefs array
  const addContentRef = (el: HTMLDivElement | null) => {
    if (el && !contentRefs.current.includes(el)) {
      contentRefs.current.push(el);
    }
  };

  // Language loading effect - optimized
  useEffect(() => {
    setHasAnimated(false);
  }, [currentLanguage]);

  // Show draft button when cards are selected and project title is filled
  useEffect(() => {
    const checkDraftButton = () => {
      const hasSelectedCards = selectedCards.length > 0;
      
      // Check both projectDetails state and localStorage for project title
      let hasProjectTitle = false;
      if (projectDetails?.title && projectDetails.title.trim() !== '') {
        hasProjectTitle = true;
       } else {
        // Check localStorage for project title
        try {
          const savedData = localStorage.getItem('projectDetails');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            hasProjectTitle = parsedData.title && parsedData.title.trim() !== '';
          
          }
        } catch (error) {
          console.error('Error checking localStorage for project title:', error);
        }
      }
      
     
      setShowDraftButton(hasProjectTitle && !submissionResult?.success);
    };

    // Check immediately
    checkDraftButton();

    // Listen for localStorage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'projectDetails') {
        checkDraftButton();
      }
    };

    // Listen for focus events (when user returns to tab)
    const handleFocus = () => {
     
      checkDraftButton();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedCards, submissionResult?.success]); // Remove projectDetails dependency to prevent infinite reloads

  // Listen for real-time updates from StepFive component
  useEffect(() => {
    const handleProjectDetailsUpdate = (event: CustomEvent) => {
      
      if (event.detail?.formValues) {
        const hasProjectTitle = event.detail.formValues.title && event.detail.formValues.title.trim() !== '';
       
        // Update projectDetails state with the latest form values
        setProjectDetails(event.detail.formValues);
        
        setShowDraftButton(hasProjectTitle && !submissionResult?.success);
      }
    };

    // Listen for custom event from StepFive
    window.addEventListener('projectDetailsUpdated', handleProjectDetailsUpdate as EventListener);

    return () => {
      window.removeEventListener('projectDetailsUpdated', handleProjectDetailsUpdate as EventListener);
    };
  }, [submissionResult?.success]); // Remove selectedCards dependency to prevent infinite reloads

  // Scroll detection for floating draft button
  useEffect(() => {
    const handleScroll = () => {
      if (currentStep === 5 || currentStep === 6) {
        // Check if Next/Submit button is visible
        const nextButton = document.querySelector('button[onclick*="onNext"], button[onclick*="handleSubmit"]');
        if (nextButton) {
          const rect = nextButton.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          setShowFloatingDraft(!isVisible);
        }
      } else {
        setShowFloatingDraft(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentStep]);

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
      
      return migratedCard;
    });
    
    // Only save to localStorage if cards actually changed to prevent infinite loops
    const hasStringCards = selectedCards.some(card => 
      typeof card.title === 'string' || typeof card.desc === 'string'
    );
    
    if (hasStringCards) {
      // Check if the migrated cards are different from what's already in localStorage
      const currentStoredCards = localStorage.getItem('selectedCards');
      const migratedCardsString = JSON.stringify(migratedCards);
      
      if (currentStoredCards !== migratedCardsString) {
        localStorage.setItem('selectedCards', migratedCardsString);
      }
    }
    
    return migratedCards;
  }, [selectedCards]); // Remove i18n.language dependency to prevent infinite reloads

  // Language key for forcing re-renders when needed
  const [languageKey, setLanguageKey] = useState(0);

  // Create a component that will re-render when language changes
  const SelectedCardText = React.memo(({ card }: { card: any }) => {
    const { i18n } = useTranslation("common");
    const currentLang = i18n.language || "en";
   
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
   
    return (
      <div className="relative min-h-[120px] flex flex-col gap-4" style={{ direction: 'ltr' }}>
        {memoizedSelectedCards.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
            {String(t("noSelections"))}
          </div>
        ) : (
          <AnimatePresence>
            {memoizedSelectedCards.slice().map((card, index) => {
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

  // Debug subservices state changes
  useEffect(() => {
  }, [subServices]);

  // Fallback function to use names when hierarchy lookup fails
  const useFallbackCards = (parsedData: any) => {
    const fallbackCards = [];
    
    if (parsedData.selectedGoalName) {
      fallbackCards.push({
        type: 'goal',
        id: parsedData.selectedGoal || 'unknown',
        title: parsedData.selectedGoalName,
        desc: parsedData.selectedGoalName,
        code: 'Unknown',
        colorIndex: 0
      });
    }
    
    if (parsedData.selectedPillarName) {
      fallbackCards.push({
        type: 'pillar',
        id: parsedData.selectedPillar || 'unknown',
        title: parsedData.selectedPillarName,
        desc: parsedData.selectedPillarName,
        code: 'Unknown',
        colorIndex: 1
      });
    }
    
    if (parsedData.selectedServiceName) {
      fallbackCards.push({
        type: 'service',
        id: parsedData.selectedService || 'unknown',
        title: parsedData.selectedServiceName,
        desc: parsedData.selectedServiceName,
        code: 'Unknown',
        colorIndex: 2
      });
    }
    
    if (parsedData.selectedSubServiceName) {
      fallbackCards.push({
        type: 'subService',
        id: parsedData.selectedSubService || 'unknown',
        title: parsedData.selectedSubServiceName,
        desc: parsedData.selectedSubServiceName,
        code: 'Unknown',
        colorIndex: 3
      });
    }
    
    if (fallbackCards.length > 0) {
      setSelectedCards(fallbackCards);
      setShowTwoColumns(true); // Show sidebar when fallback cards are loaded
      localStorage.removeItem('editingProjectData'); // Clean up
    }
  };

  // Reconstruct selected cards when data is loaded (for editing mode)
  useEffect(() => {
    const editingData = localStorage.getItem('editingProjectData');
    const isEditing = localStorage.getItem('isEditingProject') === 'true';
    
    if (editingData && isEditing) {
      try {
        const parsedData = JSON.parse(editingData);
        setIsReconstructingCards(true);
        
        // Add a small delay to ensure other components are ready
        const reconstructWithDelay = async () => {
          // Wait a bit for other components to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // If we have a subservice ID, use the hierarchy API to get the complete chain
          if (parsedData.selectedSubService) {
            const reconstructFromHierarchy = async () => {
              try {
                const response = await fetch(`/api/crm/project-hierarchy?subserviceId=${parsedData.selectedSubService}`);
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const hierarchyData = await response.json();
                if (hierarchyData.success && hierarchyData.hierarchy) {
                  const { goal, pillar, service, subservice } = hierarchyData.hierarchy;
                  const reconstructedCards = [];
                  
                  // Add goal card
                  if (goal) {
                    reconstructedCards.push({
                      type: 'goal',
                      id: goal.id,
                    title: goal.title,
                    desc: goal.desc,
                    code: goal.code,
                    colorIndex: 0
                  });
                }
                
                // Add pillar card
                if (pillar) {
                  reconstructedCards.push({
                    type: 'pillar',
                    id: pillar.id,
                    title: pillar.title,
                    desc: pillar.title,
                    code: pillar.code,
                    colorIndex: 1
                  });
                }
                
                // Add service card
                if (service) {
                  // Get the current language for multilingual support
                  const currentLang = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'en') : 'en';
                  
                  let serviceTitle = 'Unknown Service';
                  let serviceDesc = 'No description';
                  
                  // Get title based on language
                  if (currentLang === 'ar' && service.name_service_ar_c) {
                    serviceTitle = service.name_service_ar_c;
                  } else if (currentLang === 'fr' && service.name_service_fr_c) {
                    serviceTitle = service.name_service_fr_c;
                  } else if (service.description_service) {
                    serviceTitle = service.description_service;
                  }
                  
                  // Get description based on language
                  if (currentLang === 'ar' && service.description_service_ar_c) {
                    serviceDesc = service.description_service_ar_c;
                  } else if (currentLang === 'fr' && service.description_service_fr_c) {
                    serviceDesc = service.description_service_fr_c;
                  } else if (service.description_service) {
                    serviceDesc = service.description_service;
                  } else if (service.description) {
                    serviceDesc = service.description;
                  }
                  
                  reconstructedCards.push({
                    type: 'service',
                    id: service.id,
                    title: serviceTitle,
                    desc: serviceDesc,
                    code: service.code || service.id,
                    colorIndex: 2
                  });
                }
                
                // Add subservice card
                if (subservice) {
                  // Get the current language for multilingual support
                  const currentLang = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'en') : 'en';
                  
                  let subserviceTitle = 'Unknown Subservice';
                  let subserviceDesc = 'No description';
                  
                  // Get title based on language
                  if (currentLang === 'ar' && subservice.name_ar_c) {
                    subserviceTitle = subservice.name_ar_c;
                  } else if (currentLang === 'fr' && subservice.name_fr_c) {
                    subserviceTitle = subservice.name_fr_c;
                  } else if (subservice.description_subservice) {
                    subserviceTitle = subservice.description_subservice;
                  } else if (subservice.name) {
                    subserviceTitle = subservice.name;
                  }
                  
                  // Get description based on language
                  if (currentLang === 'ar' && subservice.description_subservice_ar_c) {
                    subserviceDesc = subservice.description_subservice_ar_c;
                  } else if (currentLang === 'fr' && subservice.description_subservice_fr_c) {
                    subserviceDesc = subservice.description_subservice_fr_c;
                  } else if (subservice.description_subservice) {
                    subserviceDesc = subservice.description_subservice;
                  } else if (subservice.description) {
                    subserviceDesc = subservice.description;
                  }
                  
                  reconstructedCards.push({
                    type: 'subService',
                    id: subservice.id,
                    title: subserviceTitle,
                    desc: subserviceDesc,
                    code: subservice.name || subservice.id, // Use the code (like "5.4.7.3") as the code
                    colorIndex: 3
                  });
                }
                
                  if (reconstructedCards.length > 0) {
                    setSelectedCards(reconstructedCards);
                    setShowTwoColumns(true); // Show sidebar when cards are loaded
                    // Don't remove editingProjectData immediately - let other components load first
                    setTimeout(() => {
                      localStorage.removeItem('editingProjectData');
                    }, 500);
                  } else {
                    console.log('⚠️ No cards from hierarchy, using fallback...');
                    createFallbackCards(parsedData);
                  }
                  
                  setIsReconstructingCards(false);
                } else {
                 
                  createFallbackCards(parsedData);
                  setShowTwoColumns(true); // Show sidebar when fallback cards are loaded
                  setIsReconstructingCards(false);
                }
              } catch (error) {
                console.error('Error fetching hierarchy:', error);
                createFallbackCards(parsedData);
                setShowTwoColumns(true); // Show sidebar when fallback cards are loaded
                setIsReconstructingCards(false);
              }
            };
            
            reconstructFromHierarchy();
          } else {
            // No subservice ID, use fallback with names
            createFallbackCards(parsedData);
            setShowTwoColumns(true); // Show sidebar when fallback cards are loaded
            setIsReconstructingCards(false);
          }
        };
        
        // Start the reconstruction process
        reconstructWithDelay();
      } catch (error) {
        console.error('Error reconstructing cards:', error);
        setIsReconstructingCards(false);
      }
    } else {
      // Not in editing mode, ensure loading state is false
      setIsReconstructingCards(false);
    }
  }, []);

  // Function to create fallback cards when hierarchy reconstruction fails
  const createFallbackCards = (parsedData: any) => {
   
    const fallbackCards: any[] = [];
    
    // Create cards based on the parsed data selections
    if (parsedData.selectedGoal) {
      const goal = goalsData.find(g => g.id === parsedData.selectedGoal);
      if (goal) {
        fallbackCards.push({
          type: 'goal',
          id: goal.id,
          title: goal.title,
          desc: goal.desc,
          code: goal.code,
          colorIndex: 0
        });
      }
    }
    
    if (parsedData.selectedPillar) {
      const goalPillars = pillarsData[parsedData.selectedGoal] || [];
      const pillar = goalPillars.find(p => p.id === parsedData.selectedPillar);
      if (pillar) {
        fallbackCards.push({
          type: 'pillar',
          id: pillar.id,
          title: pillar.title,
          desc: (pillar as any).desc ?? pillar.title,
          code: pillar.code,
          colorIndex: 1
        });
      }
    }
    
    if (parsedData.selectedService) {
      const pillarServicesRaw = pillarServicesData[parsedData.selectedPillar] || [];
      const service = pillarServicesRaw.find(s => s.id === parsedData.selectedService || s.code === parsedData.selectedService);
      if (service) {
        fallbackCards.push({
          type: 'service',
          id: service.id || service.code,
          title: service.description_service || (service as any).name_service || 'Unknown Service',
          desc: service.description || service.description_service || 'No description',
          code: service.code,
          colorIndex: 2
        });
      }
    }
    
    if (parsedData.selectedSubService) {
     
      const serviceSubservicesRaw = (serviceSubservicesData as any)[parsedData.selectedService] || [];
      
      const subservice = serviceSubservicesRaw.find((s: any) => s.id === parsedData.selectedSubService || s.name === parsedData.selectedSubService);
      
      if (subservice) {
        const subserviceCard = {
          type: 'subService',
          id: subservice.id || subservice.name,
          title: subservice.description_subservice || subservice.name || 'Unknown Subservice',
          desc: subservice.description || subservice.description_subservice || 'No description',
          code: subservice.name || subservice.id,
          colorIndex: 3
        };
        fallbackCards.push(subserviceCard);
      } else {
        console.log('❌ Subservice not found in fallback data');
      }
    }
    
    setSelectedCards(fallbackCards);
  };

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


  // Load goals immediately
  useEffect(() => {
    setGoals(goalsData);
  }, []);

  // Clear editing flags on mount to ensure fresh start for new projects
  useEffect(() => {
    // Only clear if we're not actually in editing mode (no valid project ID)
    const editingProjectId = localStorage.getItem('editingProjectId');
    const isEditingProject = localStorage.getItem('isEditingProject') === 'true';
    
    if (isEditingProject && !editingProjectId) {
      
      // Preserve specific localStorage items
      const contactEeemailHash = localStorage.getItem('contactEeemailHash');
      const contactInfo = localStorage.getItem('contactInfo');
      const i18nextLng = localStorage.getItem('i18nextLng');
      const session_id = localStorage.getItem('session_id');
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore preserved items
      if (contactEeemailHash) localStorage.setItem('contactEeemailHash', contactEeemailHash);
      if (contactInfo) localStorage.setItem('contactInfo', contactInfo);
      if (i18nextLng) localStorage.setItem('i18nextLng', i18nextLng);
      if (session_id) localStorage.setItem('session_id', session_id);
    }
  }, []);

  // Handle hash navigation (for "Create New Project" button)
  useEffect(() => {
    const handleHashNavigation = () => {
      if (window.location.hash === '#next-section') {
        // Scroll to the section
        const element = document.getElementById('next-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.log('❌ next-section element not found');
        }
      }
    };

    // Check hash on mount
    handleHashNavigation();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);

  // Clear localStorage on page refresh/unload (preserving specific items)
useEffect(() => {
  const handleBeforeUnload = () => {
    // Preserve specific localStorage items
    const contactEeemailHash = localStorage.getItem('contactEeemailHash');
    const contactInfo = localStorage.getItem('contactInfo');
    const i18nextLng = localStorage.getItem('i18nextLng');
    const session_id = localStorage.getItem('session_id');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore preserved items
    if (contactEeemailHash) localStorage.setItem('contactEeemailHash', contactEeemailHash);
    if (contactInfo) localStorage.setItem('contactInfo', contactInfo);
    if (i18nextLng) localStorage.setItem('i18nextLng', i18nextLng);
    if (session_id) localStorage.setItem('session_id', session_id);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Preserve specific localStorage items
      const contactEeemailHash = localStorage.getItem('contactEeemailHash');
      const contactInfo = localStorage.getItem('contactInfo');
      const i18nextLng = localStorage.getItem('i18nextLng');
      const session_id = localStorage.getItem('session_id');
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore preserved items
      if (contactEeemailHash) localStorage.setItem('contactEeemailHash', contactEeemailHash);
      if (contactInfo) localStorage.setItem('contactInfo', contactInfo);
      if (i18nextLng) localStorage.setItem('i18nextLng', i18nextLng);
      if (session_id) localStorage.setItem('session_id', session_id);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);


  // Load selected cards from localStorage on component mount - optimized
  useEffect(() => {
    const loadSelectedCards = () => {
      // console.log('🔄 loadSelectedCards called - language:', i18n.language);
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

  // Load cards immediately
  loadSelectedCards();
}, []); // Remove language dependency to prevent infinite reloads


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

   
    const serviceSubServicesRaw = (serviceSubservicesData as any)[serviceId] || [];
   
    const serviceSubServices: SubService[] = serviceSubServicesRaw.map((s: any, index: number) => {
      const mappedSubservice = {
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
      };
     
      return mappedSubservice;
    });

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
      
      // Sanitize the details to ensure no multilingual objects
      const sanitizeValue = (value: any): any => {
        // Preserve File objects - don't sanitize them
        if (value instanceof File) {
          return value;
        }
        
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
      
      setProjectDetails(sanitizedDetails);
      setCurrentStep(6);
    }
  };

  // Handle draft saving
  const handleSaveAsDraft = async () => {
    // Get project details from state or localStorage
    let currentProjectDetails = projectDetails;
    
    if (!currentProjectDetails) {
      try {
        const savedData = localStorage.getItem('projectDetails');
        if (savedData) {
          currentProjectDetails = JSON.parse(savedData);
        }
      } catch (error) {
        console.error('Error loading project details from localStorage:', error);
      }
    }
    
    // Debug: Check if we have files in projectDetails
    console.log('=== DRAFT SAVE DEBUG ===');
    console.log('currentProjectDetails:', currentProjectDetails);
    console.log('Files in currentProjectDetails:', currentProjectDetails?.files);
    console.log('Files count:', currentProjectDetails?.files?.length || 0);
    
    // Always get fresh files from StepFive ref for draft save (since projectDetails might have lost File objects)
    console.log('🔍 Checking file source for draft save...');
    console.log('currentProjectDetails.files exists:', !!currentProjectDetails?.files);
    console.log('currentProjectDetails.files length:', currentProjectDetails?.files?.length || 0);
    console.log('currentProjectDetails.files first item:', currentProjectDetails?.files?.[0]);
    console.log('currentProjectDetails.files first item has fileObject:', !!currentProjectDetails?.files?.[0]?.fileObject);
    
    // Always get fresh files from StepFive ref for draft save
    console.log('Getting fresh files from StepFive ref for draft save...');
    const stepFiveData = stepFiveRef.current?.getFormValues();
    console.log('StepFive data retrieved:', stepFiveData);
    console.log('StepFive files:', stepFiveData?.files);
    console.log('StepFive files length:', stepFiveData?.files?.length || 0);
    console.log('StepFive files first item:', stepFiveData?.files?.[0]);
    console.log('StepFive files first item has fileObject:', !!stepFiveData?.files?.[0]?.fileObject);
      
    if (stepFiveData) {
      // Use the same sanitization logic as regular submission
      const sanitizeValue = (value: any): any => {
        // Preserve File objects - don't sanitize them
        if (value instanceof File) {
          return value;
        }
        
        // Special handling for files array - preserve File objects
        if (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && value[0].hasOwnProperty('fileObject')) {
          console.log('🔍 Detected files array, preserving File objects...');
          return value.map((fileItem: any) => {
            if (fileItem && typeof fileItem === 'object' && fileItem.fileObject instanceof File) {
              console.log('✅ Preserving File object for:', fileItem.name);
              return {
                ...fileItem,
                fileObject: fileItem.fileObject // Keep the File object as-is
              };
            }
            return fileItem;
          });
        }
        
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
      
      console.log('🔍 Files before sanitization:', stepFiveData.files);
      console.log('🔍 First file before sanitization:', stepFiveData.files?.[0]);
      console.log('🔍 First file fileObject before sanitization:', stepFiveData.files?.[0]?.fileObject);
      
      const sanitizedDetails = sanitizeValue(stepFiveData);
      
      console.log('🔍 Files after sanitization:', sanitizedDetails.files);
      console.log('🔍 First file after sanitization:', sanitizedDetails.files?.[0]);
      console.log('🔍 First file fileObject after sanitization:', sanitizedDetails.files?.[0]?.fileObject);
      
      // Update currentProjectDetails with sanitized data (including files)
      currentProjectDetails = {
        ...currentProjectDetails,
        ...sanitizedDetails
      };
      
      console.log('Updated currentProjectDetails with sanitized StepFive data');
      console.log('Updated currentProjectDetails.files:', currentProjectDetails.files);
      console.log('Files count after update:', currentProjectDetails.files?.length || 0);
    } else {
      console.log('No data found in StepFive ref');
      console.log('StepFive ref available:', !!stepFiveRef.current);
      console.log('StepFive getFormValues available:', !!stepFiveRef.current?.getFormValues);
    }
    
    if (!currentProjectDetails) {
      console.error('No project details available for draft save');
      return;
    }

    // Check if we're editing an existing project
    const editingProjectId = localStorage.getItem('editingProjectId');
    const isEditing = editingProjectId && localStorage.getItem('isEditingProject') === 'true';
    
    
  

    setIsDraftSaving(true);
    try {
      // Upload files first to get file paths for draft submission
      const uploadedFilePaths = await uploadFilesAndGetPaths(currentProjectDetails.files || []);
      
      // Prepare project data for draft submission (with file paths)
      const projectData = {
        // Project ID for updates
        ...(isEditing && editingProjectId ? { id: editingProjectId } : {}),
        
        // Basic project info
        name: currentProjectDetails.title || '',
        description: currentProjectDetails.brief || '',
        project_brief: currentProjectDetails.brief || '',
        problem_statement: currentProjectDetails.rationale || '',
        rationale_impact: currentProjectDetails.rationale || '',
        
        // Strategic selections - get codes from selectedCards
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
        
        // Beneficiaries
        beneficiaries: (currentProjectDetails.beneficiaries || []).map((b: any) => typeof b === 'string' ? b : String(b)),
        other_beneficiaries: currentProjectDetails.otherBeneficiary || '',
        
        // Budget and timeline
        budget_icesco: parseFloat(currentProjectDetails.budget?.icesco) || 0,
        budget_member_state: parseFloat(currentProjectDetails.budget?.member_state) || 0,
        budget_sponsorship: parseFloat(currentProjectDetails.budget?.sponsorship) || 0,
        start_date: currentProjectDetails.startDate || '',
        end_date: currentProjectDetails.endDate || '',
        frequency: currentProjectDetails.projectFrequency || '',
        frequency_duration: currentProjectDetails.frequencyDuration || '',
        
        // Partners and scope
        partners: (currentProjectDetails.partners || []).map((p: any) => typeof p === 'string' ? p : String(p)),
        institutions: (currentProjectDetails.partners || []).map((p: any) => typeof p === 'string' ? p : String(p)),
        delivery_modality: currentProjectDetails.deliveryModality || '',
        geographic_scope: currentProjectDetails.geographicScope || '',
        convening_method: currentProjectDetails.conveningMethod || '',
        project_type: currentProjectDetails.conveningMethod || '',
        project_type_other: currentProjectDetails.conveningMethodOther || '',
        
        // Monitoring and evaluation
        milestones: (currentProjectDetails.milestones || []).map((m: any) => typeof m === 'string' ? m : String(m)),
        expected_outputs: currentProjectDetails.expectedOutputs || '',
        kpis: (currentProjectDetails.kpis || []).map((k: any) => typeof k === 'string' ? k : String(k)),
        
        // Contact information
        contact_name: currentProjectDetails.contact?.name || '',
        contact_email: currentProjectDetails.contact?.email || '',
        contact_phone: currentProjectDetails.contact?.phone || '',
        contact_role: currentProjectDetails.contact?.role || '',
        contact_id: (() => {
          try {
            // If editing a project, use the contact ID from the project data
            if (isEditing && currentProjectDetails.contact_id) {
             return currentProjectDetails.contact_id;
            }
            
            // For new projects, try to get from localStorage
            const contactData = localStorage.getItem('contactData');
            if (contactData) {
              const parsed = JSON.parse(contactData);
              if (parsed.id) {
                return parsed.id;
              }
            }
            
            // If not found, try to get from contactInfo
            const contactInfo = localStorage.getItem('contactInfo');
            if (contactInfo) {
              const parsed = JSON.parse(contactInfo);
              if (parsed.id) {
                return parsed.id;
              }
            }
            
            console.log('❌ No contact ID found');
            return '';
          } catch (error) {
            console.error('Error getting contact ID:', error);
            return '';
          }
        })(),
        
        // Account information - automatically get from localStorage
        account_id: (() => {
          try {
            // If editing a project, use the account ID from the project data
            if (isEditing && currentProjectDetails.account_id) {
             return currentProjectDetails.account_id;
            }
            
            // For new projects, try to get from localStorage
            const contactData = localStorage.getItem('contactData');
            if (contactData) {
              const parsed = JSON.parse(contactData);
              if (parsed.account_id) {
                
                return parsed.account_id;
              }
            }
            
            // If not found, try to get from contactInfo
            const contactInfo = localStorage.getItem('contactInfo');
            if (contactInfo) {
              const parsed = JSON.parse(contactInfo);
              if (parsed.account_id) {
                
                return parsed.account_id;
              }
            }
            
            console.log('❌ No account ID found');
            return '';
          } catch (error) {
            console.error('Error getting account ID:', error);
            return '';
          }
        })(),
        account_name: (() => {
          try {
            // If editing a project, use the account name from the project data
            if (isEditing && currentProjectDetails.account_name) {
              
              return currentProjectDetails.account_name;
            }
            
            // For new projects, try to get from localStorage
            const contactData = localStorage.getItem('contactData');
           
            if (contactData) {
              const parsed = JSON.parse(contactData);
            
              if (parsed.account_name) {
               
                return parsed.account_name;
              }
            }
            
            // If not found, try to get from contactInfo
            const contactInfo = localStorage.getItem('contactInfo');
           
            if (contactInfo) {
              const parsed = JSON.parse(contactInfo);
               if (parsed.account_name) {
               
                return parsed.account_name;
              }
            }
            
            console.log('❌ No account name found');
            return '';
          } catch (error) {
            console.error('Error getting account name:', error);
            return '';
          }
        })(),
        
        // Additional info
        comments: currentProjectDetails.comments || '',
        // Supporting documents - will be uploaded after project creation
        supporting_documents: [],
        
        // Document fields for CRM storage - use uploaded file paths
        ...(uploadedFilePaths.length > 0 ? {
          document_c: uploadedFilePaths.join('; '),
          documents_icesc_project_suggestions_1_name: uploadedFilePaths.join('; ')
        } : {}),
        
      };

     
      
     

      // Add status field to ensure it's treated as a draft
      const draftProjectData = {
        ...projectData,
        status: 'Draft'
      };

      // Use updateProject if editing, otherwise use saveAsDraft
      const result = isEditing 
        ? await updateProject(draftProjectData as ProjectSubmissionData & { id: string })
        : await saveAsDraft(draftProjectData);
      
      if (result.success) {
        // Also save to local storage for backup
        const projectId = saveProjectToLocal(projectData);
        console.log(isEditing ? 'Draft updated in CRM and saved locally with ID:' : 'Draft submitted to CRM and saved locally with ID:', projectId);
        
        // Files were already uploaded in uploadFilesAndGetPaths function before CRM submission
        // No need to upload them again here
        
        // Clear editing flags
        if (isEditing) {
          // Preserve specific localStorage items
          const contactEeemailHash = localStorage.getItem('contactEeemailHash');
          const contactInfo = localStorage.getItem('contactInfo');
          const i18nextLng = localStorage.getItem('i18nextLng');
          const session_id = localStorage.getItem('session_id');
          
          // Clear all localStorage
          localStorage.clear();
          
          // Restore preserved items
          if (contactEeemailHash) localStorage.setItem('contactEeemailHash', contactEeemailHash);
          if (contactInfo) localStorage.setItem('contactInfo', contactInfo);
          if (i18nextLng) localStorage.setItem('i18nextLng', i18nextLng);
          if (session_id) localStorage.setItem('session_id', session_id);
        }
        
        // Set success result to show success message (same as regular submission)
        setSubmissionResult({
          success: true,
          projectId: result.projectId,
          message: isEditing ? 'Draft updated successfully' : 'Project saved as draft successfully'
        });
        
        // Redirect to projects page after 2 seconds - DISABLED FOR DEBUGGING
        // setTimeout(() => {
        //   window.location.href = '/projects';
        // }, 2000);
        console.log('✅ Draft save completed successfully - redirect disabled for debugging');
        console.log('🔗 To go to projects page, run: window.location.href = "/projects"');
      } else {
        console.error('❌ Draft save failed:', result.error);
        
        
        // If CRM is unavailable or any server error, save locally as fallback
        const isServerError = result.error && (
          result.error.includes('ETIMEDOUT') || 
          result.error.includes('Failed to authenticate') ||
          result.error.includes('connect ETIMEDOUT') ||
          result.error.includes('Internal server error') ||
          result.error.includes('HTTP error! status: 500')
        );
        
        if (isServerError) {
         
          try {
            // Save to local storage as backup
            const localProjectId = saveProjectToLocal(projectData);
            console.log('Draft saved locally as fallback with ID:', localProjectId);
            
            // Files were already uploaded in uploadFilesAndGetPaths function before CRM submission
            // No need to upload them again here
            
            // Set success result to show success message (same as regular submission)
            setSubmissionResult({
              success: true,
              projectId: localProjectId,
              message: 'Project saved as draft successfully (offline)'
            });
            
            // Redirect to projects page after 2 seconds - DISABLED FOR DEBUGGING
            // setTimeout(() => {
            //   window.location.href = '/projects';
            // }, 2000);
            console.log('✅ Local draft fallback completed - redirect disabled for debugging');
            console.log('🔗 To go to projects page, run: window.location.href = "/projects"');
          } catch (localError) {
            console.error('❌ Local save also failed:', localError);
          }
        }
      }
    } catch (error) {
      console.error('Draft save error:', error);
      // The hook will handle setting the submission result
    } finally {
      setIsDraftSaving(false);
    }
  };

  // Helper function to upload files and get file paths
  const uploadFilesAndGetPaths = async (files: any[]): Promise<string[]> => {
    if (!files || files.length === 0) {
      return [];
    }

    try {
      // Upload files using the existing handleFileUpload function
      const uploadPromises = files.map(async (fileItem: any) => {
        let fileToUpload = null;
        
        // Get the actual File object
        if (fileItem.fileObject && fileItem.fileObject instanceof File) {
          fileToUpload = fileItem.fileObject;
        } else if (fileItem instanceof File) {
          fileToUpload = fileItem;
        }
        
        if (fileToUpload) {
          const filePath = await handleFileUpload(fileToUpload);
          return filePath;
        }
        
        return null;
      });
      
      const filePaths = await Promise.all(uploadPromises);
      const validPaths = filePaths.filter((path: string | null): path is string => path !== null);
      
      return validPaths;
    } catch (error) {
      console.error('Error uploading files before CRM submission:', error);
      // Don't fail the entire submission if file upload fails
      return [];
    }
  };

  // Handle project submission (step 6)
  const handleProjectSubmission = async () => {
    if (!projectDetails) {
      console.error('No project details available for submission');
      return;
    }

    // Check if we're editing an existing project
    const editingProjectId = localStorage.getItem('editingProjectId');
    const isEditing = editingProjectId && localStorage.getItem('isEditingProject') === 'true';
    
    
    // If we're not actually editing (no valid project ID), clear the flags and create new project
    if (isEditing && !editingProjectId) {
      console.log('⚠️ Editing flags found but no valid project ID, clearing flags and creating new project');
      localStorage.removeItem('editingProjectId');
      localStorage.removeItem('isEditingProject');
      localStorage.removeItem('editingProjectData');
    }
    
    try {
      // Upload files first to get file paths for CRM submission
      const uploadedFilePaths = await uploadFilesAndGetPaths(projectDetails.files || []);
      
      // Prepare project data for CRM submission (with file paths)
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
        expected_outputs: projectDetails.expectedOutputs || '',
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
        
        // Account information - automatically get from localStorage
        account_id: (() => {
          try {
            // If editing a project, use the account ID from the project data
            if (isEditing && projectDetails.account_id) {
            
              return projectDetails.account_id;
            }
            
            // For new projects, try to get from localStorage
            const contactData = localStorage.getItem('contactData');
            if (contactData) {
              const parsed = JSON.parse(contactData);
              if (parsed.account_id) {
                return parsed.account_id;
              }
            }
            
            // If not found, try to get from contactInfo
            const contactInfo = localStorage.getItem('contactInfo');
            if (contactInfo) {
              const parsed = JSON.parse(contactInfo);
              if (parsed.account_id) {
                return parsed.account_id;
              }
            }
            
            console.log('❌ No account ID found');
            return '';
          } catch (error) {
            console.error('Error getting account ID:', error);
            return '';
          }
        })(),
        account_name: (() => {
          try {
            // If editing a project, use the account name from the project data
            if (isEditing && projectDetails.account_name) {
             return projectDetails.account_name;
            }
            
            // For new projects, try to get from localStorage
            const contactData = localStorage.getItem('contactData');
            if (contactData) {
              const parsed = JSON.parse(contactData);
              if (parsed.account_name) {
                return parsed.account_name;
              }
            }
            
            // If not found, try to get from contactInfo
            const contactInfo = localStorage.getItem('contactInfo');
            if (contactInfo) {
              const parsed = JSON.parse(contactInfo);
              if (parsed.account_name) {
                return parsed.account_name;
              }
            }
            
            console.log('❌ No account name found');
            return '';
          } catch (error) {
            console.error('Error getting account name:', error);
            return '';
          }
        })(),
        
        // Additional info
        comments: projectDetails.comments || '',
        // Supporting documents - will be uploaded after project creation
        supporting_documents: [],
        
        // Document fields for CRM storage - use uploaded file paths
        ...(uploadedFilePaths.length > 0 ? {
          document_c: uploadedFilePaths.join('; '),
          documents_icesc_project_suggestions_1_name: uploadedFilePaths.join('; ')
        } : {}),
        
        
        // Status - Published for normal submission, Draft for save as draft
        status: 'Published'
      };

   
      
      // Use updateProject if editing, otherwise use submitProject
      const result = isEditing 
        ? await updateProject({ ...projectData, id: editingProjectId! })
        : await submitProject(projectData);
      
   
      if (result.success) {
        // Clear editing flags after successful update
        if (isEditing) {
          // Preserve specific localStorage items
          const contactEeemailHash = localStorage.getItem('contactEeemailHash');
          const contactInfo = localStorage.getItem('contactInfo');
          const i18nextLng = localStorage.getItem('i18nextLng');
          const session_id = localStorage.getItem('session_id');
          
          // Clear all localStorage
          localStorage.clear();
          
          // Restore preserved items
          if (contactEeemailHash) localStorage.setItem('contactEeemailHash', contactEeemailHash);
          if (contactInfo) localStorage.setItem('contactInfo', contactInfo);
          if (i18nextLng) localStorage.setItem('i18nextLng', i18nextLng);
          if (session_id) localStorage.setItem('session_id', session_id);
          
          
        }
        
        // Also save to local storage for backup
        const projectId = saveProjectToLocal(projectData);
        console.log(isEditing ? 'Project updated in CRM and saved locally with ID:' : 'Project submitted to CRM and saved locally with ID:', projectId);
        
        // Files were already uploaded in uploadFilesAndGetPaths function before CRM submission
        // No need to upload them again here
        
        // The hook will handle setting the submission result
      } else {
        // If CRM submission fails, show error message
        console.log('CRM submission failed:', result.error);
        
        // The hook will handle setting the submission result
      }
      
    } catch (error) {
      console.error('Error during project submission:', error);
      
      // The hook will handle setting the submission result
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
    // Preserve specific localStorage items
    const contactEeemailHash = localStorage.getItem('contactEeemailHash');
    const contactInfo = localStorage.getItem('contactInfo');
    const i18nextLng = localStorage.getItem('i18nextLng');
    const session_id = localStorage.getItem('session_id');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore preserved items
    if (contactEeemailHash) localStorage.setItem('contactEeemailHash', contactEeemailHash);
    if (contactInfo) localStorage.setItem('contactInfo', contactInfo);
    if (i18nextLng) localStorage.setItem('i18nextLng', i18nextLng);
    if (session_id) localStorage.setItem('session_id', session_id);

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
   
    // Try to get translated description from the card data
    if (card.desc && typeof card.desc === 'object') {
      const result = card.desc[currentLang] || card.desc.en || card.desc;
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
    // Try to get translated title from the card data
    if (card.title && typeof card.title === 'object') {
      const result = card.title[currentLang] || card.title.en || card.title;
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

  // Intersection Observer for scroll-triggered animations - optimized
  useEffect(() => {
    if (!isLanguageLoaded || hasAnimated || !containerRef.current) return;

    // Use requestIdleCallback for animation setup
    const setupAnimations = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
             
              setHasAnimated(true);

              const ctx = gsap.context(() => {
                // Animate title
                if (titleRef.current) {
                  gsap.fromTo(
                    titleRef.current,
                    { opacity: 0, y: 30, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
                  );
                }

                // Animate description
                if (descriptionRef.current) {
                  gsap.fromTo(
                    descriptionRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
                  );
                }

                // Animate stepper
                if (stepperRef.current) {
                  gsap.fromTo(
                    stepperRef.current,
                    { opacity: 0, y: 40 },
                    { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.4 }
                  );
                }

                // Animate content elements
                if (contentRefs.current && contentRefs.current.length > 0) {
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
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    };

    // Use requestIdleCallback for animation setup
    if (window.requestIdleCallback) {
      window.requestIdleCallback(setupAnimations);
    } else {
      setTimeout(setupAnimations, 0);
    }
  }, [isLanguageLoaded, hasAnimated]);


  // Show editing skeleton while loading project data
  if (isEditingLoading || isReconstructingCards) {
    return (
      <section 
        ref={containerRef}
        id="next-section" 
        className="bg-white py-6 lg:py-8 w-full px-4 md:px-6 lg:px-8 relative overflow-x-hidden"
        style={{ zIndex: 10, position: 'relative' }}
      >
        <div className="text-center mt-6 sm:mt-8 xl:mt-0">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
        </div>

        {/* Stepper Skeleton */}
        <section className="mt-8 md:mt-12 flex flex-col items-center">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex-1 flex justify-center relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex-1 flex justify-center">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column layout skeleton */}
          <div className="relative w-full px-4 md:px-6 lg:px-8 mt-8 overflow-x-hidden flex flex-col md:flex-row gap-12">
            {/* Left column skeleton */}
            <div className="hidden md:flex md:w-1/3 flex-col-reverse justify-between mt-8 mb-4 md:mb-0">
              <div className="h-[80px]"></div>
              <div className="sticky top-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                {/* Selected cards skeleton */}
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column skeleton */}
            <div className="w-full md:w-2/3 overflow-x-hidden">
              <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                <div className="space-y-6">
                  {/* Form fields skeleton */}
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* Loading indicator */}
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                      <span className="text-gray-600 text-sm">Loading project details...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section 
      ref={containerRef}
      id="next-section" 
      className="bg-white py-6 lg:py-8 w-full px-4 md:px-6 lg:px-8 relative overflow-x-hidden"
      style={{ zIndex: 10, position: 'relative' }}
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
                  <StepFive ref={stepFiveRef} onNext={handleProjectDetails} onPrevious={handlePrevious} onSaveAsDraft={handleSaveAsDraft} selectedCards={selectedCards} isDraftSaving={isDraftSaving} showDraftButton={showDraftButton && !showFloatingDraft} />
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
                    onSaveAsDraft={handleSaveAsDraft}
                    onRetry={retrySubmission}
                    submissionResult={submissionResult}
                    isSubmitting={isSubmitting}
                    isRetrying={isRetrying}
                    isDraftSaving={isDraftSaving}
                    showDraftButton={showDraftButton && !showFloatingDraft}
                />
                </StepErrorBoundary>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>



{/* Floating Save as Draft Button - Vertical Style */}
{showDraftButton && showFloatingDraft && (
  <div className="fixed top-1/2 right-0 z-50 transform -translate-y-1/2">
    <motion.button
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={handleSaveAsDraft}
      disabled={isDraftSaving}
      className="group relative bg-teal-600 hover:bg-teal-700 text-white 
                 w-10 sm:w-12 md:w-14 h-28 sm:h-32 md:h-[250px]
                 shadow-xl hover:shadow-2xl transition-all duration-300 
                 font-semibold flex flex-col items-center justify-center rounded-l-xl 
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex flex-col items-center justify-center h-full">
        {isDraftSaving ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[0.75rem] sm:text-[0.85rem] md:text-[0.95rem] font-medium -rotate-90 whitespace-nowrap text-center">
              {t('saving')}...
            </span>
          </div>
        ) : (
          <span className="text-[0.75rem] sm:text-[0.85rem] md:text-[0.95rem] font-medium -rotate-90 whitespace-nowrap text-center">
            {t('saveAsDraft')}
          </span>
        )}
      </div>
    </motion.button>
  </div>
)}





    </section>
  );
};

export default Rooms;
  