// Step6.tsx
import React, { useState } from "react";
import { Paperclip } from "lucide-react";
import { useTranslation } from 'react-i18next';
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
};

const Step6: React.FC<Step6Props> = ({
  selectedCards,
  projectDetails,
  onClearData,
  onPrevious,
  onEditProjectDetails,
}) => {
  const { t, i18n } = useTranslation('common');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const currentLanguage = i18n.language || 'en';

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  // Helper function to get the translated value
  const getTranslatedValue = (value: Record<string, string> | string, fallback: string = t('notFound')): string => {
    if (typeof value === 'string') return value;
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

  if (isSubmitted) {
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
          </div>
          <button
            onClick={() => {
              setIsSubmitted(false); 
              if (onClearData) onClearData();
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            {t('ok')}
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="mt-16 w-full max-w-6xl">
      <h3 className="text-2xl font-semibold text-center mb-4 text-[#0e7378]">
        {t('reviewProjectProposal')}
      </h3>
      <p className="text-center text-gray-600 mb-8">
        {t('reviewProjectProposalDesc')}
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Edit Button */}
        {onEditProjectDetails && (
          <div className="flex justify-end mb-6">
            <button
              onClick={onEditProjectDetails}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editProjectDetails')}
            </button>
          </div>
        )}

        {/* Selected Cards */}
        <div className="space-y-6">
          <h4 className="text-xl font-semibold text-teal-700 mb-6">{t('yourSelections')}</h4>
          {selectedCards.map((card, index) => (
            <div key={`${card.type}-${card.id}`} className="border-b pb-6 last:border-b-0">
              <p className="text-lg font-semibold text-teal-700 mb-2">{getCardTitle(card.type)}</p>
              <p className="text-gray-800 font-medium">{card.title}</p>
              <p className="text-gray-600 text-sm mt-1">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Project Details */}
        {projectDetails && (
          <div className="space-y-6">
            <p className="text-xl font-semibold text-teal-700 mb-4">{t('projectDetails')}</p>

            {/* Overview */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('projectOverview')}</p>
              <p>
                <strong>{t('title')}:</strong> {projectDetails.title}
              </p>
              <p>
                <strong>{t('brief')}:</strong> {projectDetails.brief}
              </p>
            </div>

            {/* Rationale */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('rationaleImpact')}</p>
              <p>
                <strong>{t('problemStatement')}:</strong> {projectDetails.rationale}
              </p>
              <p>
                <strong>{t('beneficiaries')}:</strong> {projectDetails.beneficiaries.join(", ")}
              </p>
              {projectDetails.otherBeneficiary && (
                <p>
                  <strong>{t('otherBeneficiaries')}:</strong> {projectDetails.otherBeneficiary}
                </p>
              )}
            </div>

            {/* Implementation */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('implementationBudget')}</p>
              <p>
                <strong>{t('startDate')}:</strong> {projectDetails.startDate}
              </p>
              <p>
                <strong>{t('endDate')}:</strong> {projectDetails.endDate}
              </p>
              <p>
                <strong>{t('budget')}:</strong> {projectDetails.budget.icesco} USD, {t('memberState')}: {projectDetails.budget.member_state} USD, {t('sponsorship')}:{" "}
                {projectDetails.budget.sponsorship} USD
              </p>
              <p>
                <strong>{t('frequency')}:</strong> {projectDetails.projectFrequency}{" "}
                {projectDetails.frequencyDuration && `(${projectDetails.frequencyDuration})`}
              </p>
            </div>

            {/* Partners */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('partnersCollaboration')}</p>
              <p>
                <strong>{t('partners')}:</strong> {projectDetails.partners.join(", ")}
              </p>
            </div>

            {/* Scope */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('projectScopeModality')}</p>
              <p>
                <strong>{t('deliveryModality')}:</strong> {projectDetails.deliveryModality}
              </p>
              <p>
                <strong>{t('geographicScope')}:</strong> {projectDetails.geographicScope}
              </p>
              <p>
                <strong>{t('conveningMethod')}:</strong> {projectDetails.conveningMethod}{" "}
                {projectDetails.conveningMethodOther && `(${projectDetails.conveningMethodOther})`}
              </p>
            </div>

            {/* Monitoring */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('monitoringEvaluation')}</p>
              <p>
                <strong>{t('milestones')}:</strong> {projectDetails.milestones.join(", ")}
              </p>
              <p>
                <strong>{t('expectedOutputs')}:</strong> {projectDetails.expectedOutputs}
              </p>
              <p>
                <strong>{t('kpis')}:</strong> {projectDetails.kpis.join(", ")}
              </p>
            </div>

            {/* Contact */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">{t('contactInformation')}</p>
              <p>
                <strong>{t('name')}:</strong> {projectDetails.contact?.name}
              </p>
              <p>
                <strong>{t('email')}:</strong> {projectDetails.contact?.email}
              </p>
              <p>
                <strong>{t('phone')}:</strong> {projectDetails.contact?.phone}
              </p>
              <p>
                <strong>{t('role')}:</strong> {projectDetails.contact?.role}
              </p>
            </div>

            {/* Files */}
            {projectDetails.files && projectDetails.files.length > 0 && (
              <div className="border-b pb-6">
                <p className="font-medium text-gray-800 mb-2">{t('supportingDocuments')}</p>
                <div className="space-y-2">
                  {projectDetails.files.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Paperclip />
                      <span>{file.name}</span>
                      <span className="text-gray-400">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {projectDetails.comments && (
              <div className="border-b pb-6">
                <p className="font-medium text-gray-800 mb-2">{t('comments')}</p>
                <p>{projectDetails.comments}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('previous')}
          </button>

          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition shadow-md font-medium"
          >
            {t('submitProject')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6;
