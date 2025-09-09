// Step6.tsx
import React, { useState } from "react";
import { Paperclip } from "lucide-react";
import { useTranslation } from 'react-i18next';

type Step6Props = {
  selectedGoal: string | null;
  selectedPillar: string | null;
  selectedService: string | null;
  selectedSubService: string | null;
  projectDetails: any;
  goals: { id: string; title: string; desc: string }[];
  pillars: { id: string; title: string; desc: string }[];     // ✅ now arrays
  services: { id: string; title: string; desc: string }[];    // ✅
  subServices: { id: string; title: string; desc: string }[]; // ✅
  onClearData?: () => void;
};

const Step6: React.FC<Step6Props> = ({
  selectedGoal,
  selectedPillar,
  selectedService,
  selectedSubService,
  projectDetails,
  goals,
  pillars,
  services,
  subServices,
  onClearData,
}) => {
  const { t } = useTranslation('common');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Debug log
  console.log({
    selectedGoal,
    selectedPillar,
    selectedService,
    selectedSubService,
    goals,
    pillars,
    services,
    subServices,
  });

  const handleSubmit = () => {
    setIsSubmitted(true);

   

  
  };

  const getLabelFromId = (id: string | null, items: { id: string; title: string, desc: string }[]) => {
    if (!id) return t('notSelected');
    const item = items.find((item) => item.id === id);
    return item ? item.desc : t('notFound');
  };

  const getPillarTitle = () => {
    if (!selectedPillar) return t('notSelected');
    const pillar = pillars.find((p) => p.id === selectedPillar);
    return pillar ? pillar.desc : t('notFound');
  };

  const getServiceTitle = () => {
    if (!selectedService) return t('notSelected');
    const service = services.find((s) => s.id === selectedService);
    return service ? service.desc : t('notFound');
  };

  const getSubServiceTitle = () => {
    if (!selectedSubService) return t('notSelected');
    const subService = subServices.find((s) => s.id === selectedSubService);
    return subService ? subService.desc : t('notFound');
  };

 if (isSubmitted) {
  return (
    <div className="mt-16 w-full max-w-4xl mx-auto">
      <div className="p-12 text-center bg-white rounded-2xl shadow-lg">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-4">
            {t('projectSubmittedSuccessfully')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('projectSubmittedDesc')}
          </p>
        </div>

        {/* ✅ OK button */}
        <button
          onClick={() => {
            setIsSubmitted(false); // Reset view (you can redirect here instead)
            if (onClearData) onClearData(); // Clear data if needed
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
        {/* Strategic Goal */}
        <div className="border-b pb-6">
          <p className="text-xl font-semibold text-teal-700 mb-4">{t('strategicGoal')}</p>
          <p className="text-gray-800">{getLabelFromId(selectedGoal, goals)}</p>
        </div>

        {/* Pillar */}
        <div className="border-b pb-6">
          <p className="text-xl font-semibold text-teal-700 mb-4">{t('pillar')}</p>
          <p className="text-gray-800">{getPillarTitle()}</p>
        </div>

        {/* Service */}
        <div className="border-b pb-6">
          <p className="text-xl font-semibold text-teal-700 mb-4">{t('service')}</p>
          <p className="text-gray-800">{getServiceTitle()}</p>
        </div>

        {/* Sub-Service */}
        <div className="border-b pb-6">
          <p className="text-xl font-semibold text-teal-700 mb-4">{t('subService')}</p>
          <p className="text-gray-800">{getSubServiceTitle()}</p>
        </div>

        {/* Project Details */}
        {projectDetails && (
          <div className="space-y-6">
            <p className="text-xl font-semibold text-teal-700 mb-4">{t('projectDetails')}</p>

            {/* Overview */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Project Overview</p>
              <p>
                <strong>Title:</strong> {projectDetails.title}
              </p>
              <p>
                <strong>Brief:</strong> {projectDetails.brief}
              </p>
            </div>

            {/* Rationale */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Rationale & Impact</p>
              <p>
                <strong>Problem Statement:</strong> {projectDetails.rationale}
              </p>
              <p>
                <strong>Beneficiaries:</strong> {projectDetails.beneficiaries.join(", ")}
              </p>
              {projectDetails.otherBeneficiary && (
                <p>
                  <strong>Other Beneficiaries:</strong> {projectDetails.otherBeneficiary}
                </p>
              )}
            </div>

            {/* Implementation */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Implementation & Budget</p>
              <p>
                <strong>Start Date:</strong> {projectDetails.startDate}
              </p>
              <p>
                <strong>End Date:</strong> {projectDetails.endDate}
              </p>
              <p>
                <strong>Budget:</strong> ICESCO: {projectDetails.budget.icesco} USD, Member
                State: {projectDetails.budget.member_state} USD, Sponsorship:{" "}
                {projectDetails.budget.sponsorship} USD
              </p>
              <p>
                <strong>Frequency:</strong> {projectDetails.projectFrequency}{" "}
                {projectDetails.frequencyDuration && `(${projectDetails.frequencyDuration})`}
              </p>
            </div>

            {/* Partners */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Partners & Collaboration</p>
              <p>
                <strong>Partners:</strong> {projectDetails.partners.join(", ")}
              </p>
            </div>

            {/* Scope */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Project Scope & Modality</p>
              <p>
                <strong>Delivery Modality:</strong> {projectDetails.deliveryModality}
              </p>
              <p>
                <strong>Geographic Scope:</strong> {projectDetails.geographicScope}
              </p>
              <p>
                <strong>Convening Method:</strong> {projectDetails.conveningMethod}{" "}
                {projectDetails.conveningMethodOther && `(${projectDetails.conveningMethodOther})`}
              </p>
            </div>

            {/* Monitoring */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Monitoring & Evaluation</p>
              <p>
                <strong>Milestones:</strong> {projectDetails.milestones.join(", ")}
              </p>
              <p>
                <strong>Expected Outputs:</strong> {projectDetails.expectedOutputs}
              </p>
              <p>
                <strong>KPIs:</strong> {projectDetails.kpis.join(", ")}
              </p>
            </div>

            {/* Contact */}
            <div className="border-b pb-6">
              <p className="font-medium text-gray-800 mb-2">Contact Information</p>
              <p>
                <strong>Name:</strong> {projectDetails.contact?.name}
              </p>
              <p>
                <strong>Email:</strong> {projectDetails.contact?.email}
              </p>
              <p>
                <strong>Phone:</strong> {projectDetails.contact?.phone}
              </p>
              <p>
                <strong>Role:</strong> {projectDetails.contact?.role}
              </p>
            </div>

            {/* Files */}
            {projectDetails.files && projectDetails.files.length > 0 && (
              <div className="border-b pb-6">
                <p className="font-medium text-gray-800 mb-2">Supporting Documents</p>
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
                <p className="font-medium text-gray-800 mb-2">Comments</p>
                <p>{projectDetails.comments}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-teal-600 justify-center text-center flex items-center mx-auto text-white rounded-xl hover:bg-teal-700 transition shadow-md font-medium"
        >
          {t('submitProject')}
        </button>
      </div>
    </div>
  );
};

export default Step6;
