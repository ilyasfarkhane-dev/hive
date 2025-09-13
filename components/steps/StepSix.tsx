// Step6.tsx
import React, { useState } from "react";
import { Paperclip } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Lottie from "lottie-react";
import successAnimation from "@/public/success.json"; 

// Update the types to match your new data structure
type Goal = {
  id: string;
  title: Record<string, string>;
  desc: Record<string, string>;
};

type Step6Props = {
  selectedCards: any[];
  projectDetails: any;
  onClearData?: () => void;
  onPrevious?: () => void;
  onEditProjectDetails?: () => void;
  onSubmit?: () => void;
  submissionResult?: {
    success: boolean;
    projectId?: string;
    error?: string;
    message?: string;
  } | null;
  isSubmitting?: boolean;
};

const Step6: React.FC<Step6Props> = ({
  selectedCards,
  projectDetails,
  onClearData,
  onPrevious,
  onEditProjectDetails,
  onSubmit,
  submissionResult,
  isSubmitting = false,
}) => {
  const { t: originalT, i18n } = useTranslation('common');
  
  // Safe translation function that always returns a string
  const t = (key: string): string => {
    const translated = originalT(key);
    if (typeof translated === 'object' && translated !== null) {
      return (translated as any)[currentLanguage] || (translated as any).en || key;
    }
    return typeof translated === 'string' ? translated : key;
  };

  // Enhanced safe render function for any value
  const safeRenderAny = (value: any, context?: string): string => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
        console.error(`🚨 MULTILINGUAL OBJECT DETECTED in StepSix ${context}:`, value);
        console.error('Stack trace:', new Error().stack);
        return String(value[currentLanguage] || value.en || value.fr || value.ar || '');
      }
    }
    
    return String(value);
  };

  // Debug wrapper to catch any multilingual objects being rendered
  const debugRender = (value: any, context: string) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && !React.isValidElement(value)) {
      if (value.hasOwnProperty && value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
        console.error(`🚨 CRITICAL: Multilingual object being rendered directly in ${context}:`, value);
        console.error('This is the source of the React error!');
        console.error('Stack trace:', new Error().stack);
        return safeRenderAny(value, context);
      }
    }
    return value;
  };
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language || 'en');
  
  // Update currentLanguage when i18n.language changes
  React.useEffect(() => {
    setCurrentLanguage(i18n.language || 'en');
  }, [i18n.language]);
  
  // Debug: Log current language and translation
  console.log('🔍 StepSix currentLanguage:', currentLanguage);
  console.log('🔍 StepSix i18n.language:', i18n.language);
  console.log('🔍 StepSix beneficiaryStudents translation:', t('beneficiaryStudents'));

  // Comprehensive debugging of projectDetails - MOVED TO TOP TO FIX HOOKS ERROR
  React.useEffect(() => {
    console.log('=== STEP 6 DEBUGGING: Scanning projectDetails for multilingual objects ===');
    
    const scanForMultilingualObjects = (obj: any, path = '') => {
      if (!obj) return;
      
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        if (obj.hasOwnProperty('en') && obj.hasOwnProperty('fr') && obj.hasOwnProperty('ar')) {
          console.error(`🚨 Found multilingual object at ${path}:`, obj);
          return;
        }
        
        for (const [key, value] of Object.entries(obj)) {
          scanForMultilingualObjects(value, path ? `${path}.${key}` : key);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          scanForMultilingualObjects(item, `${path}[${index}]`);
        });
      }
    };
    
    scanForMultilingualObjects(projectDetails, 'projectDetails');
    scanForMultilingualObjects(selectedCards, 'selectedCards');
  }, [projectDetails, selectedCards]);

  // Debug: Log selectedCards to see what we're working with
  // console.log('StepSix selectedCards:', selectedCards);
  // console.log('StepSix projectDetails:', projectDetails);

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit();
    }
    // Don't set isSubmitted here - let the submission result handle the UI state
  };

  // Helper function to get the translated value
  const getTranslatedValue = (value: Record<string, string> | string | undefined | null, fallback: string = t('notFound')): string => {
    console.log('🔍 getTranslatedValue called with:', typeof value, value);
    
    // Handle null, undefined, or non-object values
    if (!value || typeof value !== 'object') {
      const result = typeof value === 'string' ? value : fallback;
      console.log('🔍 getTranslatedValue returning (non-object):', result);
      return result;
    }
    
    // Check if it's a multilingual object
    if (value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
      console.error('🚨 CRITICAL: getTranslatedValue received multilingual object:', value);
      console.error('🚨 This might be the source of the React error!');
    }
    
    // Handle object values with language keys
    const result = value[currentLanguage] || value.en || fallback;
    console.log('🔍 getTranslatedValue returning (object):', result);
    return safeRenderAny(result, 'getTranslatedValue result');
  };

  // Helper function to safely render any value as string
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // If it's a multilingual object, get the translated value
      if (value[currentLanguage] || value.en) {
        return value[currentLanguage] || value.en || '';
      }
      // If it's not a multilingual object, stringify it
      return String(value);
    }
    return String(value);
  };

  const getCardTitle = (type: string) => {
    let translated: any;
    switch (type) {
      case "goal":
        translated = t("strategicGoal");
        break;
      case "pillar":
        translated = t("pillar");
        break;
      case "service":
        translated = t("service");
        break;
      case "subService":
        translated = t("subService");
        break;
      default:
        translated = t("item");
    }
    
    // Use safeRenderAny to ensure we always get a string
    return safeRenderAny(translated, `getCardTitle(${type})`);
  };

  if (submissionResult?.success) {
    return (
      <div className="mt-16 w-full max-w-4xl mx-auto">
        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
          <div className="mb-8">
            <div className="w-28 h-28 mx-auto mb-6">
              <Lottie animationData={successAnimation} loop={false} />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-4">
              {safeRender(t('projectSubmittedSuccessfully'))}
            </h3>
            <p className="text-gray-600 mb-6">
              {safeRender(t('projectSubmittedDesc'))}
            </p>
           
          </div>
          <button
            onClick={() => {
              // Navigate first to avoid showing home page
              router.replace('/projects');
              // Clear data after navigation to prevent re-render issues
              setTimeout(() => {
                if (onClearData) onClearData();
              }, 0);
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            {safeRender(t('ok'))}
          </button>
        </div>
      </div>
    );
  }


  // Helper function to translate beneficiary values
  const translateBeneficiary = (beneficiary: any) => {
    console.log('🔍 translateBeneficiary called with:', beneficiary, 'type:', typeof beneficiary, 'currentLanguage:', currentLanguage);
    
    // Handle multilingual objects
    if (typeof beneficiary === 'object' && beneficiary !== null) {
      if (beneficiary.hasOwnProperty(currentLanguage)) {
        console.log('🔍 Found multilingual object with current language:', beneficiary[currentLanguage]);
        return beneficiary[currentLanguage];
      } else if (beneficiary.hasOwnProperty('en')) {
        console.log('🔍 Found multilingual object with English fallback:', beneficiary.en);
        return beneficiary.en;
      }
    }
    
    // Handle string values
    const beneficiaryString = String(beneficiary);
    const beneficiaryMap: Record<string, string> = {
      'Students': t('beneficiaryStudents'),
      'Teachers': t('beneficiaryTeachers'),
      'Youth': t('beneficiaryYouth'),
      'General Public': t('beneficiaryPublic'),
      'Policymakers': t('beneficiaryPolicymakers'),
      'Other': t('beneficiaryOther'),
      // Add more mappings as needed
    };
    
    const result = beneficiaryMap[beneficiaryString] || beneficiaryString;
    console.log('🔍 translateBeneficiary result:', result);
    return result;
  };

  // Helper function to translate frequency values
  const translateFrequency = (frequency: any) => {
    // Handle multilingual objects
    if (typeof frequency === 'object' && frequency !== null) {
      if (frequency.hasOwnProperty(currentLanguage)) {
        return frequency[currentLanguage];
      } else if (frequency.hasOwnProperty('en')) {
        return frequency.en;
      }
    }
    
    const frequencyString = String(frequency);
    const frequencyMap: Record<string, string> = {
      'One-time': t('frequencyOneTime'),
      'Continuous': t('frequencyContinuous'),
      'Monthly': t('frequencyMonthly') || 'Monthly',
      'Yearly': t('frequencyYearly') || 'Yearly',
      'Weekly': t('frequencyWeekly') || 'Weekly',
      'Daily': t('frequencyDaily') || 'Daily',
      // Add more mappings as needed
    };
    
    return frequencyMap[frequencyString] || frequencyString;
  };

  // Helper function to translate delivery modality values
  const translateModality = (modality: any) => {
    // Handle multilingual objects
    if (typeof modality === 'object' && modality !== null) {
      if (modality.hasOwnProperty(currentLanguage)) {
        return modality[currentLanguage];
      } else if (modality.hasOwnProperty('en')) {
        return modality.en;
      }
    }
    
    const modalityString = String(modality);
    const modalityMap: Record<string, string> = {
      'Physical': t('modalityPhysical'),
      'Virtual': t('modalityVirtual'),
      'Hybrid': t('modalityHybrid'),
      // Add more mappings as needed
    };
    
    return modalityMap[modalityString] || modalityString;
  };

  // Helper function to translate geographic scope values
  const translateScope = (scope: any) => {
    // Handle multilingual objects
    if (typeof scope === 'object' && scope !== null) {
      if (scope.hasOwnProperty(currentLanguage)) {
        return scope[currentLanguage];
      } else if (scope.hasOwnProperty('en')) {
        return scope.en;
      }
    }
    
    const scopeString = String(scope);
    const scopeMap: Record<string, string> = {
      'National': t('scopeNational'),
      'Regional': t('scopeRegional'),
      'International': t('scopeInternational'),
      // Add more mappings as needed
    };
    
    return scopeMap[scopeString] || scopeString;
  };

  // Helper function to translate convening method values
  const translateConveningMethod = (method: any) => {
    // Handle multilingual objects
    if (typeof method === 'object' && method !== null) {
      if (method.hasOwnProperty(currentLanguage)) {
        return method[currentLanguage];
      } else if (method.hasOwnProperty('en')) {
        return method.en;
      }
    }
    
    const methodString = String(method);
    const methodMap: Record<string, string> = {
      'Workshop': t('typeWorkshop'),
      'Conference': t('typeConference'),
      'Training': t('typeTraining'),
      'Campaign': t('typeCampaign'),
      'Research': t('typeResearch'),
      // Add more mappings as needed
    };
    
    return methodMap[methodString] || methodString;
  };

  // Helper function to get translated value for form values
  const getTranslatedFormValue = (value: string | undefined | null): string => {
    if (!value) return '';
    const translated = t(value);
    // Use safeRenderAny to ensure we always get a string
    return safeRenderAny(translated, `getTranslatedFormValue(${value})`);
  };


  return (
    <div className="mt-12 w-full max-w-6xl" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-[#0e7378] mb-2">
          {debugRender(safeRenderAny(t('reviewProjectProposal'), 'main title'), 'main title render')}
        </h3>
        <p className={`text-gray-600 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>
          {debugRender(safeRenderAny(t('reviewProjectProposalDesc'), 'desc'), 'desc render')}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8">
       

        {/* Selected Cards */}
        <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
          <div className={`flex items-center gap-3 mb-6 ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
                <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-teal-700">{safeRender(t('yourSelections'))}</h4>
          </div>
          {selectedCards.map((card, index) => {
            return (
              <div key={`${card.type}-${card.id}`} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className={`flex items-center gap-3 mb-3 ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-teal-600">{typeof card.code === 'string' ? card.code : card.id}</span>
                  </div>
                  <p className={`font-semibold text-teal-700 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{getCardTitle(card.type)}</p>
                </div>
                <p className={`text-gray-800 font-medium mb-2 ${currentLanguage === 'ar' ? 'text-right text-base' : 'text-left text-sm'}`}>{debugRender(getTranslatedValue(card.title), 'card title render')}</p>
                <p className={`text-gray-600 leading-relaxed ${currentLanguage === 'ar' ? 'text-right text-sm' : 'text-left text-xs'}`}>{debugRender(getTranslatedValue(card.desc, card.title), 'card desc render')}</p>
              </div>
            );
          })}
        </div>

        {/* Project Details */}
        {projectDetails && (
          <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
            <div className={`flex items-center gap-3 mb-6 ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-teal-700">{safeRender(t('projectDetails'))}</p>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('projectOverview'), 'projectOverview header'), 'projectOverview section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('title'), 'title label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.title)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('brief'), 'brief label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.brief)}</span>
                </p>
              </div>
            </div>

            {/* Rationale */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('rationaleImpact'), 'rationaleImpact header'), 'rationaleImpact section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('problemStatementPlaceholder'), 'problemStatementPlaceholder label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.rationale)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('beneficiaries'), 'beneficiaries label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {(() => {
                      console.log('🔍 Beneficiaries raw data:', projectDetails.beneficiaries);
                      console.log('🔍 Beneficiaries type:', typeof projectDetails.beneficiaries);
                      console.log('🔍 Beneficiaries isArray:', Array.isArray(projectDetails.beneficiaries));
                      
                      if (Array.isArray(projectDetails.beneficiaries)) {
                        return projectDetails.beneficiaries.map((b: any) => {
                          console.log('🔍 Individual beneficiary:', b, 'type:', typeof b);
                          const rendered = safeRenderAny(b, 'beneficiary');
                          console.log('🔍 Rendered beneficiary:', rendered);
                          const translated = translateBeneficiary(rendered);
                          console.log('🔍 Translated beneficiary:', translated);
                          return translated;
                        }).join(", ");
                      } else {
                        const rendered = safeRenderAny(projectDetails.beneficiaries, 'beneficiaries');
                        console.log('🔍 Rendered beneficiaries (single):', rendered);
                        const translated = translateBeneficiary(rendered);
                        console.log('🔍 Translated beneficiaries (single):', translated);
                        return translated;
                      }
                    })()}
                  </span>
                </p>
                {projectDetails.otherBeneficiary && (
                  <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                    <span className="font-medium text-gray-700">{safeRenderAny(t('otherBeneficiaries'), 'otherBeneficiaries label')}:</span> 
                    <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.otherBeneficiary)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Implementation */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('implementationBudget'), 'implementationBudget header'), 'implementationBudget section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('startDate'), 'startDate label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.startDate)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('endDate'), 'endDate label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.endDate)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('budget'), 'budget label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {safeRender(t('budgetLabel_icesco'))}: {safeRender(projectDetails.budget?.icesco)} USD, {safeRender(t('memberState'))}: {safeRender(projectDetails.budget?.member_state)} USD, {safeRender(t('sponsorship'))}: {safeRender(projectDetails.budget?.sponsorship)} USD
                  </span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('frequency'), 'frequency label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {debugRender(translateFrequency(projectDetails.projectFrequency || ''), 'frequency value')} {safeRender(projectDetails.frequencyDuration) && `(${safeRender(projectDetails.frequencyDuration)})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Partners */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('partnersCollaboration'), 'partnersCollaboration header'), 'partnersCollaboration section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('partners'), 'partners label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {Array.isArray(projectDetails.partners) 
                      ? projectDetails.partners.map((p: any) => safeRenderAny(p, 'partner')).join(", ")
                      : safeRenderAny(projectDetails.partners, 'partners')
                    }
                  </span>
                </p>
              </div>
            </div>

            {/* Scope */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('projectScopeModality'), 'projectScopeModality header'), 'projectScopeModality section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('deliveryModality'), 'deliveryModality label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {debugRender(translateModality(projectDetails.deliveryModality || ''), 'delivery modality value')}
                  </span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('geographicScope'), 'geographicScope label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {debugRender(translateScope(projectDetails.geographicScope || ''), 'geographic scope value')}
                  </span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('conveningMethod'), 'conveningMethod label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {debugRender(translateConveningMethod(projectDetails.conveningMethod || ''), 'convening method value')} {safeRender(projectDetails.conveningMethodOther) && `(${safeRender(projectDetails.conveningMethodOther)})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Monitoring */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('monitoringEvaluation'), 'monitoringEvaluation header'), 'monitoringEvaluation section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('milestones'), 'milestones label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {Array.isArray(projectDetails.milestones) 
                      ? projectDetails.milestones.map((m: any) => safeRenderAny(m, 'milestone')).join(", ")
                      : safeRenderAny(projectDetails.milestones, 'milestones')
                    }
                  </span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('expectedOutputs'), 'expectedOutputs label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.expectedOutputs)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('kpis'), 'kpis label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {Array.isArray(projectDetails.kpis) 
                      ? projectDetails.kpis.map((k: any) => safeRenderAny(k, 'kpi')).join(", ")
                      : safeRenderAny(projectDetails.kpis, 'kpis')
                    }
                  </span>
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{debugRender(safeRenderAny(t('contactInformation'), 'contactInformation header'), 'contactInformation section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('name'), 'name label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.contact?.name)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('email'), 'email label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.contact?.email)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('phone'), 'phone label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.contact?.phone)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('role'), 'role label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.contact?.role)}</span>
                </p>
              </div>
            </div>

            {/* Files */}
            {projectDetails.files && projectDetails.files.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-800 mb-3 text-sm">{debugRender(safeRenderAny(t('supportingDocuments'), 'supportingDocuments header'), 'supportingDocuments section')}</p>
                <div className="space-y-2">
                  {projectDetails.files.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-gray-400 text-xs">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {projectDetails.comments && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-800 mb-3 text-sm">{debugRender(safeRenderAny(t('comments'), 'comments header'), 'comments section')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{safeRender(projectDetails.comments)}</p>
              </div>
            )}
          </div>
        )}

        {/* Submission Status */}
        {isSubmitting && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800 font-medium">{t('loading')}...</p>
            </div>
          </div>
        )}

        {submissionResult && (
          <div className={`mt-8 p-4 rounded-lg border ${
            submissionResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {submissionResult.success ? (
                <>
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className={`font-medium ${submissionResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {submissionResult.message || t('projectSubmittedSuccessfully')}
                    </p>
                    
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-800">
                      {t('error')}: {submissionResult.error}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={`flex ${currentLanguage === 'ar' ? 'flex-row-reverse' : 'justify-between'} items-center mt-8 pt-6 border-t border-gray-200`}>
          <button
            onClick={onPrevious}
            className={`flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}
          >
            <svg className={`w-5 h-5 ${currentLanguage === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('previous')}
          </button>

          {!submissionResult?.success && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('loading') + '...' : t('submitProject')}
            </button>
          )}

          {submissionResult?.success && (
            <button
              onClick={onClearData}
              className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition shadow-md font-medium"
            >
              {t('submitNewProject')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step6;
