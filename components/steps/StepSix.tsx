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
  onSaveAsDraft?: () => void;
  onRetry?: (projectData: any) => Promise<any>;
  submissionResult?: {
    success: boolean;
    projectId?: string;
    error?: string;
    message?: string;
    canRetry?: boolean;
  } | null;
  isSubmitting?: boolean;
  isRetrying?: boolean;
  isDraftSaving?: boolean;
  showDraftButton?: boolean;
};

const Step6: React.FC<Step6Props> = ({
  selectedCards,
  projectDetails,
  onClearData,
  onPrevious,
  onEditProjectDetails,
  onSubmit,
  onSaveAsDraft,
  onRetry,
  submissionResult,
  isSubmitting = false,
  isRetrying = false,
  isDraftSaving = false,
  showDraftButton = false,
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
        return String(value[currentLanguage] || value.en || value.fr || value.ar || '');
      }
    }
    
    return String(value);
  };
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language || 'en');
  
  // Update currentLanguage when i18n.language changes
  React.useEffect(() => {
    setCurrentLanguage(i18n.language || 'en');
  }, [i18n.language]);
  
  // Debug: Log current language and translation
  // Language and translation setup

  // Clean up multilingual objects in projectDetails
  React.useEffect(() => {
    // Ensure proper handling of multilingual data
    if (projectDetails && selectedCards) {
      // Data is properly processed
    }
  }, [projectDetails, selectedCards]);

  // Data processing for rendering

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit();
    }
    // Don't set isSubmitted here - let the submission result handle the UI state
  };

  // Helper function to get the translated value
  const getTranslatedValue = (value: Record<string, string> | string | undefined | null, fallback: string = t('notFound')): string => {
    // Handle null, undefined, or non-object values
    if (!value || typeof value !== 'object') {
      return typeof value === 'string' ? value : fallback;
    }
    
    // Handle multilingual objects silently
    if (value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
      return value[currentLanguage] || value.en || value.fr || value.ar || fallback;
    }
    
    // Handle other object values
    return value[currentLanguage] || value.en || fallback;
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
            <h3 className="text-2xl font-bold text-[#0e7378] mb-4">
              {safeRender(t('projectSubmittedSuccessfully'))}
            </h3>
            <p className="text-[#0e7378] mb-6">
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
            className="px-6 py-2 bg-[#0e7378] text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            {safeRender(t('ok'))}
          </button>
        </div>
      </div>
    );
  }


  // Helper function to translate beneficiary values
  const translateBeneficiary = (beneficiary: any) => {
    // Handle multilingual objects
    if (typeof beneficiary === 'object' && beneficiary !== null) {
      if (beneficiary.hasOwnProperty(currentLanguage)) {
        return beneficiary[currentLanguage];
      } else if (beneficiary.hasOwnProperty('en')) {
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
    
    return beneficiaryMap[beneficiaryString] || beneficiaryString;
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
          {safeRenderAny(safeRenderAny(t('reviewProjectProposal'), 'main title'), 'main title render')}
        </h3>
        <p className={`text-gray-600 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>
          {safeRenderAny(safeRenderAny(t('reviewProjectProposalDesc'), 'desc'), 'desc render')}
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
                <p className={`text-gray-800 font-medium mb-2 ${currentLanguage === 'ar' ? 'text-right text-base' : 'text-left text-sm'}`}>{safeRenderAny(getTranslatedValue(card.title), 'card title render')}</p>
                <p className={`text-gray-600 leading-relaxed ${currentLanguage === 'ar' ? 'text-right text-sm' : 'text-left text-xs'}`}>{safeRenderAny(getTranslatedValue(card.desc, card.title), 'card desc render')}</p>
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
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('projectOverview'), 'projectOverview header'), 'projectOverview section')}</p>
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
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('rationaleImpact'), 'rationaleImpact header'), 'rationaleImpact section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('problemStatementPlaceholder'), 'problemStatementPlaceholder label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{safeRender(projectDetails.rationale)}</span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('beneficiaries'), 'beneficiaries label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {(() => {
                      if (Array.isArray(projectDetails.beneficiaries)) {
                        return projectDetails.beneficiaries.map((b: any) => {
                          const rendered = safeRenderAny(b, 'beneficiary');
                          const translated = translateBeneficiary(rendered);
                          return translated;
                        }).join(", ");
                      } else {
                        const rendered = safeRenderAny(projectDetails.beneficiaries, 'beneficiaries');
                        const translated = translateBeneficiary(rendered);
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
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('implementationBudget'), 'implementationBudget header'), 'implementationBudget section')}</p>
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
                    {safeRenderAny(translateFrequency(projectDetails.projectFrequency || ''), 'frequency value')} {safeRender(projectDetails.frequencyDuration) && `(${safeRender(projectDetails.frequencyDuration)})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Partners */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('partnersCollaboration'), 'partnersCollaboration header'), 'partnersCollaboration section')}</p>
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
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('projectScopeModality'), 'projectScopeModality header'), 'projectScopeModality section')}</p>
              <div className="space-y-2">
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('deliveryModality'), 'deliveryModality label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {safeRenderAny(translateModality(projectDetails.deliveryModality || ''), 'delivery modality value')}
                  </span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('geographicScope'), 'geographicScope label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {safeRenderAny(translateScope(projectDetails.geographicScope || ''), 'geographic scope value')}
                  </span>
                </p>
                <p className={currentLanguage === 'ar' ? 'text-base' : 'text-sm'}>
                  <span className="font-medium text-gray-700">{safeRenderAny(t('conveningMethod'), 'conveningMethod label')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {safeRenderAny(translateConveningMethod(projectDetails.conveningMethod || ''), 'convening method value')} {safeRender(projectDetails.conveningMethodOther) && `(${safeRender(projectDetails.conveningMethodOther)})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Monitoring */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('monitoringEvaluation'), 'monitoringEvaluation header'), 'monitoringEvaluation section')}</p>
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
              <p className={`font-semibold text-gray-800 mb-3 ${currentLanguage === 'ar' ? 'text-base' : 'text-sm'}`}>{safeRenderAny(safeRenderAny(t('contactInformation'), 'contactInformation header'), 'contactInformation section')}</p>
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
                <p className="font-semibold text-gray-800 mb-3 text-sm">{safeRenderAny(safeRenderAny(t('supportingDocuments'), 'supportingDocuments header'), 'supportingDocuments section')}</p>
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
                <p className="font-semibold text-gray-800 mb-3 text-sm">{safeRenderAny(safeRenderAny(t('comments'), 'comments header'), 'comments section')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{safeRender(projectDetails.comments)}</p>
              </div>
            )}
          </div>
        )}

        {/* Submission Status */}
        {(isSubmitting || isRetrying) && (
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
                  <div className="flex-1">
                    <p className="font-medium text-red-800">
                      {t('error')}: {submissionResult.error}
                    </p>
                  </div>
                  {submissionResult.canRetry && onRetry && (
                    <button
                      onClick={() => onRetry(projectDetails)}
                      disabled={isRetrying}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                    >
                      {isRetrying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Retrying...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retry
                        </>
                      )}
                    </button>
                  )}
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

          <div className={`flex items-center gap-3 ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}>
            {/* Save as Draft Button - Vertical Ticket Style */}
            {showDraftButton && (
              <button
                onClick={onSaveAsDraft}
                disabled={isDraftSaving}
                className="group relative flex flex-col items-center justify-center w-14 sm:w-16 md:w-18 h-20 sm:h-24 md:h-28 rounded-full bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white transition shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
              >
                {isDraftSaving ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2 sm:mb-3"></div>
                    <span className="text-[10px] sm:text-xs font-medium transform -rotate-90 whitespace-nowrap">Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="text-[10px] sm:text-xs font-medium transform -rotate-90 whitespace-nowrap">Save as Draft</span>
                  </>
                )}
                
                {/* Tooltip */}
                <div className="absolute right-full top-1/2 mr-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap transform -translate-y-1/2">
                  Save your progress as a draft
                  <div className="absolute left-full top-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent transform -translate-y-1/2"></div>
                </div>
              </button>
            )}

           

            {/* Submit/Clear Button */}
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
    </div>
  );
};

export default Step6;
