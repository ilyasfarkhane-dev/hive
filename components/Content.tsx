
"use client";
import React, { useEffect, useState, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { AnimatePresence, motion } from "framer-motion";
import StepOne from "@/components/steps/StepOne";
import StepTwo from "@/components/steps/StepTwo";
import StepThree from "@/components/steps/StepTree";
import StepFour from "@/components/steps/StepFoor";
import StepFive, { StepFiveRef } from "./steps/StepFive";
import StepSix from "@/components/steps/StepSix";
import axios from "axios";
import { gsap } from "gsap";
import { steps } from "@/Data/index";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const Rooms = () => {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(1);

  const stepFiveRef = useRef<StepFiveRef>(null);
  // Removed unused step5Ref and Step5Handle reference

  // User selections
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSubService, setSelectedSubService] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [SubServiceStored, setSubServiceStored] = useState(false);
  const [goals, setGoals] = useState<{ id: string; title: string; desc: string }[]>([]);
  const [pillars, setPillars] = useState<{ id: string; title: string; desc: string }[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [subServices, setSubServices] = useState<any[]>([]);

  const [loadingGoals, setLoadingGoals] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSubServices, setLoadingSubServices] = useState(false);
  const [lastLanguage, setLastLanguage] = useState<string>('');

  // Two-column layout & right column animation
  const [showTwoColumns, setShowTwoColumns] = useState(false);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  const [showSuccess, setShowSuccess] = useState(false);

  // Track selected cards for history
  const [selectedCards, setSelectedCards] = useState<{ type: string; id: string; title: string; desc: string; colorIndex: number }[]>([]);

  const cardColors = [
    { bg: "bg-[#3870ba]", text: "text-[#3870ba]" },
    { bg: "bg-[#f2c600]", text: "text-[#f2c600]" },
    { bg: "bg-[#5da3ff]", text: "text-[#5da3ff]" },
    { bg: "bg-[#e86100]", text: "text-[#e86100]" },
    { bg: "bg-[#259997]", text: "text-[#259997]" },
    { bg: "bg-[#afc0d6]", text: "text-[#afc0d6]" },
  ];

  const saveToLocalStorage = (data: any) => {
    try {
      localStorage.setItem('projectProposalData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };



  // Clear all proposal data and reset state
  const handleClearData = () => {
    setCurrentStep(1);
    setSelectedGoal(null);
    setSelectedPillar(null);
    setSelectedService(null);
    setSelectedSubService(null);
    setProjectDetails(null);
    setShowTwoColumns(false);
    setSelectedCards([]);
    setSelectedColorIndex(null);
  };

  useEffect(() => {
    setCurrentStep(1);
    setSelectedGoal(null);
    setSelectedPillar(null);
    setSelectedService(null);
    setSelectedSubService(null);
    setProjectDetails(null);
    setShowTwoColumns(false);
    setSelectedCards([]);
    setSelectedColorIndex(null);
  }, []);

  useEffect(() => {
    AOS.init({ duration: 600, easing: "ease-in-out" });
  }, []);

  const stepVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.8, y: -50, transition: { duration: 0.4 } },
  };

  const addSelectedCard = (type: string, id: string, title: string, desc: string, colorIndex: number) => {
    const newCard = { type, id, title, desc, colorIndex };
    setSelectedCards((prev) => [...prev, newCard]);
  };

  const sessionId = localStorage.getItem("session_id");

  useEffect(() => {
    if (!sessionId) return;

    // Get current language from i18n
    const currentLanguage = i18n.language || 'en';
    
    console.log('Content.tsx - Language changed:', currentLanguage, 'Last language:', lastLanguage);
    
    // Only fetch if language actually changed or it's the first load
    if (currentLanguage !== lastLanguage) {
      console.log('Fetching goals for language:', currentLanguage);
      // Clear goals immediately when language changes to show loading state
      setGoals([]);
      setLoadingGoals(true);
      setLastLanguage(currentLanguage);
      
      axios.get("/api/goals", { params: { sessionId, language: currentLanguage } })
        .then(res => {
          console.log('Goals fetched successfully:', res.data.length, 'goals');
          setGoals(res.data);
          setLoadingGoals(false);
        })
        .catch(err => {
          console.error('Error fetching goals:', err);
          setLoadingGoals(false);
        });
    }
  }, [sessionId, i18n.language, lastLanguage]);

  // Rebuild selected cards on language/data change so labels re-translate
  useEffect(() => {
    if (!showTwoColumns || selectedCards.length === 0) return;
    const rebuilt: { type: string; id: string; title: string; desc: string; colorIndex: number }[] = [];
    let colorIndex = selectedColorIndex ?? 0;
    // goal
    if (selectedGoal) {
      const goal = goals.find(g => g.id === selectedGoal);
      if (goal) rebuilt.push({ type: 'goal', id: goal.id, title: goal.title, desc: goal.desc, colorIndex: colorIndex ?? 0 });
    }
    // pillar
    if (selectedPillar) {
      const pillar = pillars.find(p => p.id === selectedPillar);
      if (pillar) rebuilt.push({ type: 'pillar', id: pillar.id, title: pillar.title, desc: pillar.desc, colorIndex: colorIndex ?? 0 });
    }
    // service
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) rebuilt.push({ type: 'service', id: service.id, title: service.title, desc: service.desc, colorIndex: colorIndex ?? 0 });
    }
    // subservice
    if (selectedSubService) {
      const sub = subServices.find(s => s.id === selectedSubService);
      if (sub) rebuilt.push({ type: 'subService', id: sub.id, title: sub.title, desc: sub.desc, colorIndex: colorIndex ?? 0 });
    }
    if (rebuilt.length > 0) setSelectedCards(rebuilt);
  }, [i18n.language, goals, pillars, services, subServices]);

  // Initial load effect - ensure goals are fetched on first render
  useEffect(() => {
    if (sessionId && goals.length === 0 && !loadingGoals) {
      const currentLanguage = i18n.language || 'en';
      setLoadingGoals(true);
      
      axios.get("/api/goals", { params: { sessionId, language: currentLanguage } })
        .then(res => {
          setGoals(res.data);
          setLoadingGoals(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingGoals(false);
        });
    }
  }, [sessionId, goals.length, loadingGoals]);


  // Fetch pillars when goal changes
  useEffect(() => {
    if (!selectedGoal) return;
    async function fetchPillars() {
      try {
        // Get current language from i18n
        const currentLanguage = i18n.language || 'en';
        console.log('Content.tsx - Fetching pillars for goal:', selectedGoal, 'language:', currentLanguage);
        const resp = await axios.get(`/api/pillars?goalId=${selectedGoal}&language=${currentLanguage}`);
        // map API data to { id, title, desc } structure
        const mappedPillars = resp.data.map((p: any) => ({
          id: p.id,
          title: p.name,
          desc: p.description
        }));
        console.log('Content.tsx - Pillars fetched successfully:', mappedPillars.length, 'pillars');
        setPillars(mappedPillars);
      } catch (error) {
        console.error("Failed to load pillars:", error);
      }
    }
    fetchPillars();
  }, [selectedGoal, i18n.language]);

  // Fetch services when pillar changes
  useEffect(() => {
    if (!selectedPillar) return;

    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const currentLanguage = i18n.language || 'en';
        const resp = await axios.get(`/api/services`, {
          params: { pillarId: selectedPillar, language: currentLanguage },
        });
        setServices(resp.data);
      } catch (error) {
        console.error("Failed to load services:", error);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [selectedPillar, i18n.language]);

  // Fetch sub-services when service or language changes
  useEffect(() => {
    if (!selectedService) return;
    setLoadingSubServices(true);
    const currentLanguage = i18n.language || 'en';
    axios.get(`/api/subservices?serviceId=${selectedService}&language=${currentLanguage}`)
      .then(res => setSubServices(res.data))
      .catch(() => setSubServices([]))
      .finally(() => setLoadingSubServices(false));
  }, [selectedService, i18n.language]);

  const handleGoalSelect = (goalId: string, colorIndex: number) => {
    setSelectedGoal(goalId);
    setSelectedColorIndex(colorIndex);
    setShowTwoColumns(true);

    const goal = goals.find(g => g.id === goalId);
    if (goal) addSelectedCard("goal", goal.id, goal.title, goal.desc, colorIndex);

    saveToLocalStorage({
      selectedGoal: goalId,
      selectedColorIndex: colorIndex,
      timestamp: new Date().toISOString(),
    });

    setCurrentStep(2);
  };

  const handlePillarSelect = (pillarId: string) => {
    setSelectedPillar(pillarId);
    const pillar = pillars.find(p => p.id === pillarId);
    if (pillar && selectedColorIndex !== null) addSelectedCard("pillar", pillar.id, pillar.title, pillar.desc, selectedColorIndex);

    saveToLocalStorage({
      selectedGoal,
      selectedPillar: pillarId,
      selectedColorIndex,
      timestamp: new Date().toISOString()
    });

    setCurrentStep(3);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service && selectedColorIndex !== null) addSelectedCard("service", service.id, service.title, service.desc, selectedColorIndex);

    saveToLocalStorage({
      selectedGoal,
      selectedPillar,
      selectedService: serviceId,
      selectedColorIndex,
      timestamp: new Date().toISOString()
    });

    setCurrentStep(4);
  };

  const handleProjectDetails = () => {
    if (currentStep === 5) {
      const details = stepFiveRef.current?.getFormValues();
      if (details) {
        setProjectDetails(details);
        saveToLocalStorage({
          selectedGoal,
          selectedPillar,
          selectedService,
          selectedSubService,
          projectDetails: details,
          selectedColorIndex,
          timestamp: new Date().toISOString()
        });
        setCurrentStep(6);
      }
    }
  };

  const handleSubServiceSelect = (subServiceId: string) => {
    setSelectedSubService(subServiceId);
    const subService = subServices.find(s => s.id === subServiceId);
    if (subService && selectedColorIndex !== null) addSelectedCard("subService", subService.id, subService.title, subService.desc, selectedColorIndex);

    saveToLocalStorage({
      selectedGoal,
      selectedPillar,
      selectedService,
      selectedSubService: subServiceId,
      selectedColorIndex,
      timestamp: new Date().toISOString()
    });

    setSubServiceStored(true);

    setCurrentStep(5);
  };


  useEffect(() => {
    if (projectDetails) {
      saveToLocalStorage({
        selectedGoal,
        selectedPillar,
        selectedService,
        selectedSubService,
        projectDetails,
        selectedColorIndex,
        timestamp: new Date().toISOString()
      });
      setCurrentStep(6);
    }
  }, [projectDetails]);


  const handleNext = () => {
    if (currentStep === 5) {
      const details = stepFiveRef.current?.getFormValues();
      if (details) {
        setProjectDetails(details);
        saveToLocalStorage({
          selectedGoal,
          selectedPillar,
          selectedService,
          selectedSubService,
          projectDetails: details,
          selectedColorIndex,
          timestamp: new Date().toISOString()
        });
        setCurrentStep(6);
      }
    } else if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };


  const getCardTitle = (type: string) => {
    switch (type) {
      case "goal": return t('goal');
      case "pillar": return t('pillar');
      case "service": return t('service');
      case "subService": return t('subService');
      default: return t('item');
    }
  };

  const getStepTitle = (stepId: number) => {
    switch (stepId) {
      case 1: return t('strategicGoal');
      case 2: return t('pillar');
      case 3: return t('service');
      case 4: return t('subService');
      case 5: return t('projectDetails');
      case 6: return t('reviewSubmit');
      default: return t('item');
    }
  };

  // Animate right column
  useEffect(() => {
    if (showTwoColumns && rightColumnRef.current) {
      gsap.fromTo(rightColumnRef.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" });
    }
  }, [showTwoColumns, currentStep]);

  return (
    <section id="next-section" className="bg-white-100 py-10 lg:py-14 w-full px-5 md:px-[1.9rem] largesceen:px-14 fourk:px-44 relative">
      <div className="text-center mt-12 sm:mt-20 xl:mt-0">
        <h2 className="text-gradient uppercase text-3xl xs:text-[3.2rem] leading-none lg:text-[6.25rem] desktop:text-[7.813rem] largesceen:text-[4.375rem]">
          {t('takePartInStrategy')}
        </h2>
        <p className="uppercase mt-12 text-gradient lg:text-base 2xl:text-lg largesceen:text-[1.625rem] max-lg:hidden">
          {t('submitAndTrackProposal')}
        </p>
      </div>

      {/* Stepper */}
      <section data-aos="fade-up" className="mt-16 md:mt-24 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-4xl relative">
          {steps.map((step) => (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold transition-all duration-500 ${currentStep >= step.id ? "bg-[#0e7378]" : "bg-gray-300 text-gray-600"}`}>
                {step.id}
              </div>
              <p className="mt-4 text-sm font-semibold text-center text-gray-800">{getStepTitle(step.id)}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className={`relative w-full px-16 mt-12 ${showTwoColumns ? 'flex flex-col md:flex-row gap-6' : ''}`}>
          {/* Left column */}
          {showTwoColumns && selectedCards.length > 0 && (
            <div className="w-full flex-col justify-between md:w-1/3 mt-18 mb-6 md:mb-0">
              <div className="h-[150px]"></div>
              <div className="sticky top-4 space-y-4">
                <div className="text-sm font-semibold text-gray-600 mb-2">{t('yourSelections')}</div>
                <div className="relative min-h-[200px] flex flex-col gap-4">
                  <AnimatePresence>
                    {selectedCards.map((card, index) => (
                      <motion.div
                        key={`${card.type}-${card.id}`}
                        className={`selection-card w-full ${index === selectedCards.length - 1 ? "scale-105 shadow-2xl" : "scale-100"}`}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="flex items-center justify-between mb-2 mt-4">
                          <span className="text-xs font-medium text-gray-500 uppercase">{getCardTitle(card.type)}</span>
                        </div>
                        <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${cardColors[typeof card.colorIndex === 'number' && cardColors[card.colorIndex] ? card.colorIndex : 0].bg} ${index === selectedCards.length - 1 ? "transform scale-105 shadow-2xl border-2 border-white" : "transform scale-90 shadow-md"}`}>
                          <div className="p-4 flex items-start justify-between">
                            <div className={`p-4`}>
                              <div className="text-white font-bold">{card.title}</div>
                              <div className="text-sm text-white mt-1">{card.desc}</div>
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
          <div className="hidden md:flex flex-col items-center justify-center mx-4">
            <div className="h-full w-0.5 bg-gray-300"></div>
          </div>

          <div ref={rightColumnRef} className={`${showTwoColumns ? 'w-full md:w-2/3' : 'w-full'}`}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && !showTwoColumns && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  {loadingGoals || goals.length === 0 ? (
                    <LoadingSpinner message={loadingGoals ? t('loadingGoals') : t('loading')} />
                  ) : (
                    <StepOne goals={goals} selectedGoal={selectedGoal} onNext={handleGoalSelect} />
                  )}
                </motion.div>
              )}

              {currentStep === 2 && selectedGoal && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <StepTwo
                    selectedGoal={selectedGoal}
                    selectedPillar={selectedPillar}
                    onNext={handlePillarSelect}
                    goalColorIndex={selectedColorIndex}
                    pillars={pillars}
                  />
                </motion.div>
              )}

              {currentStep === 3 && selectedPillar && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  {loadingServices ? <LoadingSpinner /> : <StepThree services={services} selectedService={selectedService} onNext={handleServiceSelect} goalColorIndex={selectedColorIndex} />}
                </motion.div>
              )}

              {currentStep === 4 && selectedService && (
                <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  {loadingSubServices ? <LoadingSpinner /> : <StepFour subServices={subServices} selectedSubService={selectedSubService} onNext={handleSubServiceSelect} goalColorIndex={selectedColorIndex} />}
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div key="step5" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <StepFive
                    ref={stepFiveRef}
                    onNext={(details) => {
                      setProjectDetails(details);
                    }}
                  />
                </motion.div>
              )}


              {currentStep === 6 && (
                <motion.div key="step6" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                  <StepSix
                    selectedGoal={selectedGoal}
                    selectedPillar={selectedPillar}
                    selectedService={selectedService}
                    selectedSubService={selectedSubService}
                    projectDetails={projectDetails}
                    goals={goals}
                    pillars={pillars}
                    services={services}
                    subServices={subServices}
                    onClearData={handleClearData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step controls */}
        <div className="mt-12 flex gap-4">
          {currentStep > 1 && (
             <button
      onClick={() => {
        // Handle step 2 -> 1: Reset to single column view
        if (currentStep === 2) {
          setShowTwoColumns(false);
          setSelectedCards([]);
          setSelectedColorIndex(null);
          setSelectedGoal(null);
          // Clear the main localStorage but preserve projectDetails
          const savedProjectDetails = localStorage.getItem("projectDetails");
          localStorage.removeItem("projectProposalData");
          if (savedProjectDetails) {
            localStorage.setItem("projectDetails", savedProjectDetails);
          }
        } 
        // Handle other steps: Just remove last selected card and update state
        else if (currentStep > 2) {
          setSelectedCards(prev => prev.slice(0, -1));
          gsap.to(".selection-card:not(:last-child)", { 
            y: 0, 
            scale: 1, 
            duration: 0.3, 
            ease: "power2.out" 
          });

          // Reset the appropriate state based on which step we're going back to
          switch (currentStep) {
            case 3:
              setSelectedPillar(null);
              break;
            case 4:
              setSelectedService(null);
              break;
            case 5:
              setSelectedSubService(null);
              break;
            case 6:
              // Don't clear projectDetails when going back to step 5
              // The StepFive component will handle loading from localStorage
              break;
          }

          // Update localStorage with current state (except when going back to step 5)
          if (currentStep !== 6) {
            saveToLocalStorage({
              selectedGoal,
              selectedPillar: currentStep === 3 ? null : selectedPillar,
              selectedService: currentStep === 4 ? null : selectedService,
              selectedSubService: currentStep === 5 ? null : selectedSubService,
              projectDetails: currentStep === 6 ? null : projectDetails,
              selectedColorIndex,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Move to previous step
        setCurrentStep(prev => prev - 1);
      }}
      className="px-6 py-2 bg-gray-300 rounded-lg text-sm hover:bg-gray-400 disabled:opacity-50"
    >
      {t('previous')}
    </button>
          )}
           {currentStep === 5 && (
    <button
      type="button"
      onClick={handleProjectDetails}
      className="px-6 py-2 bg-primary text-white rounded-lg text-sm hover:bg-[#1B3B36]"
    >
      {t('next')}
    </button>
  )}



        </div>
      </section>

   
    </section>
  );
};

export default Rooms;