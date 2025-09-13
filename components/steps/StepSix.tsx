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
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const currentLanguage = i18n.language || 'en';

  // Debug: Log selectedCards to see what we're working with
  console.log('StepSix selectedCards:', selectedCards);
  console.log('StepSix projectDetails:', projectDetails);

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
    
    // Handle object values with language keys
    return value[currentLanguage] || value.en || fallback;
  };

  const getCardTitle = (type: string) => {
    switch (type) {
      case "goal":
        return t("strategicGoal");
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

  if (submissionResult?.success) {
    return (
      <div className="mt-16 w-full max-w-4xl mx-auto">
        <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
          <div className="mb-8">
            <div className="w-28 h-28 mx-auto mb-6">
              <Lottie animationData={successAnimation} loop={false} />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-4">
              {t('projectSubmittedSuccessfully')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('projectSubmittedDesc')}
            </p>
            {submissionResult.projectId && (
              <p className="text-sm text-green-600 mt-2">
                {t('projectId')} {submissionResult.projectId}
              </p>
            )}
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
            {t('ok')}
          </button>
        </div>
      </div>
    );
  }


  // Helper function to get translated value for form values
  const getTranslatedFormValue = (value: string | undefined | null): string => {
    if (!value) return '';
    return t(value) || value;
  };

  return (
    <div className="mt-12 w-full max-w-6xl" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-[#0e7378] mb-2">
          {t('reviewProjectProposal')}
        </h3>
        <p className="text-gray-600 text-sm">
          {t('reviewProjectProposalDesc')}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8">
        {/* Edit Button */}
        {onEditProjectDetails && (
          <div className={`flex ${currentLanguage === 'ar' ? 'justify-start' : 'justify-end'} mb-6`}>
            <button
              onClick={onEditProjectDetails}
              className={`flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 font-medium ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <svg className={`w-4 h-4 ${currentLanguage === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editProjectDetails')}
            </button>
          </div>
        )}

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
            <h4 className="text-lg font-semibold text-teal-700">{t('yourSelections')}</h4>
          </div>
          {selectedCards.map((card, index) => {
            console.log(`Card ${index}:`, {
              type: card.type,
              id: card.id,
              title: card.title,
              desc: card.desc,
              titleType: typeof card.title,
              descType: typeof card.desc
            });
            
            return (
              <div key={`${card.type}-${card.id}`} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className={`flex items-center gap-3 mb-3 ${currentLanguage === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-teal-600">{card.code}</span>
                  </div>
                  <p className="text-sm font-semibold text-teal-700">{getCardTitle(card.type)}</p>
                </div>
                <p className={`text-gray-800 font-medium text-sm mb-2 ${currentLanguage === 'ar' ? 'text-right' : 'text-left'}`}>{getTranslatedValue(card.title)}</p>
                <p className={`text-gray-600 text-xs leading-relaxed ${currentLanguage === 'ar' ? 'text-right' : 'text-left'}`}>{getTranslatedValue(card.desc, card.title)}</p>
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
              <p className="text-lg font-semibold text-teal-700">{t('projectDetails')}</p>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('projectOverview')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('title')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.title}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('brief')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.brief}</span>
                </p>
              </div>
            </div>

            {/* Rationale */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('rationaleImpact')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('problemStatementPlaceholder')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.rationale}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('beneficiaries')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.beneficiaries.join(", ")}</span>
                </p>
                {projectDetails.otherBeneficiary && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">{t('otherBeneficiaries')}:</span> 
                    <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.otherBeneficiary}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Implementation */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('implementationBudget')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('startDate')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.startDate}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('endDate')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.endDate}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('budget')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {t('budgetLabel_icesco')}: {projectDetails.budget.icesco} USD, {t('memberState')}: {projectDetails.budget.member_state} USD, {t('sponsorship')}: {projectDetails.budget.sponsorship} USD
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('frequency')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {getTranslatedFormValue(projectDetails.projectFrequency)} {projectDetails.frequencyDuration && `(${projectDetails.frequencyDuration})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Partners */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('partnersCollaboration')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('partners')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.partners.join(", ")}</span>
                </p>
              </div>
            </div>

            {/* Scope */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('projectScopeModality')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('deliveryModality')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {getTranslatedFormValue(projectDetails.deliveryModality)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('geographicScope')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {getTranslatedFormValue(projectDetails.geographicScope)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('conveningMethod')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    {getTranslatedFormValue(projectDetails.conveningMethod)} {projectDetails.conveningMethodOther && `(${projectDetails.conveningMethodOther})`}
                  </span>
                </p>
              </div>
            </div>

            {/* Monitoring */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('monitoringEvaluation')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('milestones')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.milestones.join(", ")}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('expectedOutputs')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.expectedOutputs}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('kpis')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.kpis.join(", ")}</span>
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t('contactInformation')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('name')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.contact?.name}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('email')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.contact?.email}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('phone')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.contact?.phone}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">{t('role')}:</span> 
                  <span className={`text-gray-600 ${currentLanguage === 'ar' ? 'mr-2' : 'ml-2'}`}>{projectDetails.contact?.role}</span>
                </p>
              </div>
            </div>

            {/* Files */}
            {projectDetails.files && projectDetails.files.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-800 mb-3 text-sm">{t('supportingDocuments')}</p>
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
                <p className="font-semibold text-gray-800 mb-3 text-sm">{t('comments')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{projectDetails.comments}</p>
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
                    {submissionResult.projectId && (
                      <p className="text-sm text-green-600 mt-1">
                        {t('projectId')} {submissionResult.projectId}
                      </p>
                    )}
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
