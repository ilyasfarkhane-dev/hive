import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from 'react-i18next'

// Debug function to check for multilingual objects
const debugRender = (value: any, context: string) => {
  if (value && typeof value === 'object' && !Array.isArray(value) && !React.isValidElement(value)) {
    if (value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
      console.error(`🚨 MULTILINGUAL OBJECT DETECTED in ${context}:`, value);
      console.error('Stack trace:', new Error().stack);
      return String(value.en || value.fr || value.ar || '');
    }
  }
  return value;
};

type Step5Props = {
  onNext?: (details: any) => void;
  onPrevious?: () => void;
  onSaveAsDraft?: () => void;
  initialValues?: any;
  selectedCards?: any[];
  isDraftSaving?: boolean;
  showDraftButton?: boolean;
};

export type StepFiveRef = {
  getFormValues: () => any;
};

const StepFive = forwardRef<StepFiveRef, Step5Props>(({ onNext, onPrevious, onSaveAsDraft, initialValues, selectedCards = [], isDraftSaving = false, showDraftButton = false }, ref) => {
  const { t: originalT, i18n } = useTranslation('common');
  const currentLanguage = i18n.language || 'en';

  // Safe translation function to ensure strings are returned
  const t = (key: string): string => {
    const translated = originalT(key);
    if (typeof translated === 'object' && translated !== null) {
      return (translated as any)[currentLanguage] || (translated as any).en || key;
    }
    return typeof translated === 'string' ? translated : key;
  };
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [formValues, setFormValues] = useState({
    title: "",
    brief: "",
    rationale: "",
    beneficiaries: [] as string[],
    otherBeneficiary: "",
    startDate: "",
    endDate: "",
    conveningMethod: "",
    conveningMethodOther: "",
    projectFrequency: "",
    frequencyDuration: "",
    freqError: "",
    partners: [] as string[],
    partnerInput: "",
    milestones: [] as string[],
    milestoneInput: "",
    kpis: [] as string[],
    kpiInput: "",
    budget: {
      icesco: "",
      member_state: "",
      sponsorship: "",
    },
    geographicScope: "",
    deliveryModality: "",
    expectedOutputs: "",
    contact: {
      name: "",
      email: "",
      phone: "",
      role: "",
    },
    files: [] as File[],
    comments: "",
  });

  const [emailError, setEmailError] = useState("");

  const [isInitialized, setIsInitialized] = useState(false);






  const otherBeneficiaryValue = t('beneficiaryOther');
  // Load saved data on component mount - only run once
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem("projectDetails");
        if (savedData) {
          const parsedData = JSON.parse(savedData);


          // Check if "Other" beneficiary is selected to show the input
          if (parsedData.beneficiaries && parsedData.beneficiaries.includes(otherBeneficiaryValue)) {
            setShowOtherInput(true);
          }

          setFormValues(prev => {
            const newFormValues = {
              ...prev,
              ...parsedData,
              // Note: Files from localStorage can't be restored as File objects
              // We'll only keep actual File objects that were added after page load
              files: prev.files || []
            };
            
            
            return newFormValues;
          });
        }
      } catch (error) {
        console.error("Error loading saved data:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    // Only load if not already initialized
    if (!isInitialized) {
      loadSavedData();
    }
  }, [isInitialized, otherBeneficiaryValue]); // Include dependencies

  // Handle initialValues from props (when coming back from next step)
  useEffect(() => {
    if (initialValues && isInitialized) {
      
      setFormValues(prev => {
        const newFormValues = {
          ...prev,
          ...initialValues,
        };
        return newFormValues;
      });
    }
  }, [initialValues, isInitialized]);

  // Save to localStorage - but only after initialization
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load


    const serializableFiles = formValues.files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));

    const dataToSave = {
      ...formValues,
      files: serializableFiles,
    };

    localStorage.setItem("projectDetails", JSON.stringify(dataToSave));

    // Dispatch custom event to notify other components about localStorage changes
    const event = new CustomEvent('projectDetailsUpdated', {
      detail: { formValues }
    });
    window.dispatchEvent(event);
  }, [formValues, isInitialized]);

  useImperativeHandle(
    ref,
    () => ({
      getFormValues: () => {
        // Filter out any files that are not actual File objects (e.g., from localStorage)
        const validFiles = formValues.files.filter(file => file instanceof File);

        return {
          ...formValues,
          files: validFiles, // Only return actual File objects
        };
      },
    }),
    [formValues]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter((file) => file.size <= 10 * 1024 * 1024);
    setFormValues((prev) => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email change with validation
  const handleEmailChange = (email: string) => {
    setFormValues(prev => ({
      ...prev,
      contact: { ...prev.contact, email }
    }));

    if (email && !validateEmail(email)) {
      setEmailError(String(t('invalidEmailFormat')));
    } else {
      setEmailError("");
    }
  };

  const handleAddPartner = () => {
    const trimmed = formValues.partnerInput.trim();
    if (trimmed && !formValues.partners.includes(trimmed) && formValues.partners.length < 5) {
      setFormValues((prev) => ({
        ...prev,
        partners: [...prev.partners, trimmed],
        partnerInput: "",
      }));
    }
  };

  const handleAddMilestone = () => {
    const trimmed = formValues.milestoneInput.trim();
    if (trimmed && !formValues.milestones.includes(trimmed) && formValues.milestones.length < 5) {
      setFormValues((prev) => ({
        ...prev,
        milestones: [...prev.milestones, trimmed],
        milestoneInput: "",
      }));
    }
  };

  const handleAddKPI = () => {
    const trimmed = formValues.kpiInput.trim();
    if (trimmed && !formValues.kpis.includes(trimmed) && formValues.kpis.length < 5) {
      setFormValues((prev) => ({
        ...prev,
        kpis: [...prev.kpis, trimmed],
        kpiInput: "",
      }));
    }
  };

  // Handle Enter key press for input fields
  const handleKeyPress = (e: React.KeyboardEvent, type: 'partner' | 'milestone' | 'kpi') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (type) {
        case 'partner':
          handleAddPartner();
          break;
        case 'milestone':
          handleAddMilestone();
          break;
        case 'kpi':
          handleAddKPI();
          break;
      }
    }
  };

  // Check if we're in draft editing mode
  const isDraftEditing = () => {
    try {
      const editingProjectId = localStorage.getItem('editingProjectId');
      const isEditing = localStorage.getItem('isEditingProject') === 'true';
      return !!(editingProjectId && isEditing);
    } catch (error) {
      return false;
    }
  };

  // Form validation function for regular submission
  const isFormValid = () => {
    // If we're editing a draft, use more lenient validation
    if (isDraftEditing()) {
      // For draft editing, only require essential fields
      const essentialFields = [
        formValues.title,
        formValues.brief,
        formValues.beneficiaries.length > 0,
        formValues.budget.icesco,
        formValues.budget.member_state,
        formValues.budget.sponsorship,
        formValues.projectFrequency,
        formValues.partners.length > 0,
        formValues.conveningMethod,
        formValues.deliveryModality,
        formValues.geographicScope,
      ];

      // Check if "Other" beneficiary is selected but no input provided
      if (formValues.beneficiaries.includes(otherBeneficiaryValue) && !formValues.otherBeneficiary.trim()) {
        return false;
      }

      // Check if "Other" convening method is selected but no input provided
      if (formValues.conveningMethod === "Other" && !formValues.conveningMethodOther.trim()) {
        return false;
      }

      // Check if continuous frequency is selected but no duration provided
      if (formValues.projectFrequency === "Continuous" && !formValues.frequencyDuration.trim()) {
        return false;
      }

      // Check email validation (if email is provided)
      if (formValues.contact.email && !validateEmail(formValues.contact.email)) {
        return false;
      }

      return essentialFields.every(field => field);
    }

    // For regular submission, require all fields
    const requiredFields = [
      formValues.title,
      formValues.brief,
      formValues.beneficiaries.length > 0,
      formValues.budget.icesco,
      formValues.budget.member_state,
      formValues.budget.sponsorship,
      formValues.projectFrequency,
      formValues.partners.length > 0,
      formValues.conveningMethod,
      formValues.deliveryModality,
      formValues.geographicScope,
      formValues.contact.name,
      formValues.contact.email,
      formValues.contact.phone,
      formValues.contact.role,
    ];

    // Check if "Other" beneficiary is selected but no input provided
    if (formValues.beneficiaries.includes(otherBeneficiaryValue) && !formValues.otherBeneficiary.trim()) {
      return false;
    }

    // Check if "Other" convening method is selected but no input provided
    if (formValues.conveningMethod === "Other" && !formValues.conveningMethodOther.trim()) {
      return false;
    }

    // Check if continuous frequency is selected but no duration provided
    if (formValues.projectFrequency === "Continuous" && !formValues.frequencyDuration.trim()) {
      return false;
    }

    // Check email validation
    if (formValues.contact.email && !validateEmail(formValues.contact.email)) {
      return false;
    }

    return requiredFields.every(field => field);
  };

  // Form validation function for draft saves - only requires title
  const isDraftValid = () => {
    return !!formValues.title && formValues.title.trim() !== '';
  };

  // Helper function to get field validation class
  const getFieldValidationClass = (isValid: boolean) => {
    return isValid ? "" : "border-red-500 focus:border-red-500 focus:ring-red-100";
  };
  return (

    <div id="step5Content" className="max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-[#0f7378] mb-2">
          {debugRender(t('enterProjectDetails'), 'main title')}
        </h3>
        <p className="text-gray-600 text-sm">
          {debugRender(t('fillAllRequiredFields'), 'subtitle')}
        </p>
      </div>

     

      <div className="space-y-8">
        {/* Project Identity */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="text-lg font-semibold text-gray-800">{debugRender(t('projectOverview'), 'section header')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('fillAllRequiredFields')}</p>
          </div>

          <div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-medium text-gray-900">
                  {t('projectTitle')} <span className="text-red-500">*</span>
                  <span className="block text-gray-500 text-sm">{t('titleHelp')}</span>
                </label>
                <input
                  id="title"
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  type="text"
                  required
                  placeholder={t('titlePlaceholder')}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 shadow-sm ${getFieldValidationClass(!!formValues.title)
                    }`}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-900">
                  {t('projectBrief')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="brief"
                  required
                  rows={4}
                  value={formValues.brief}
                  onChange={(e) => setFormValues({ ...formValues, brief: e.target.value })}
                  placeholder={t('projectBriefPlaceholder')}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 shadow-sm resize-none ${getFieldValidationClass(!!formValues.brief)
                    }`}
                ></textarea>
              </div>
            </div>

            {/* Strategic Justification */}
            <div className="mt-8">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-800">{t('rationaleImpact')}</h4>
                <p className="text-sm text-gray-600 mt-1">{t('problemStatementPlaceholder')}</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-900">
                  {t('problemStatement')}
                </label>
                <textarea
                  id="rationale"
                  rows={4}
                  required
                  value={formValues.rationale}
                  onChange={(e) => setFormValues({ ...formValues, rationale: e.target.value })}
                  placeholder={t('problemStatementPlaceholder')}
                  className={`w-full px-5 py-3 border rounded-2xl focus:ring-2 shadow-sm transition ${getFieldValidationClass(!!formValues.rationale)
                    }`}
                ></textarea>
              </div>
              {/* Target Beneficiaries */}
              <label className="block mb-2 font-medium text-gray-900">
                {t('beneficiaries')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="beneficiaries">
                {[
                  { label: t('beneficiaryStudents'), desc: t('beneficiaryStudentsDesc'), value: String(t('beneficiaryStudents')) },
                  { label: t('beneficiaryTeachers'), desc: t('beneficiaryTeachersDesc'), value: String(t('beneficiaryTeachers')) },
                  { label: t('beneficiaryYouth'), desc: t('beneficiaryYouthDesc'), value: String(t('beneficiaryYouth')) },
                  { label: t('beneficiaryPublic'), desc: t('beneficiaryPublicDesc'), value: String(t('beneficiaryPublic')) },
                  { label: t('beneficiaryPolicymakers'), desc: t('beneficiaryPolicymakersDesc'), value: String(t('beneficiaryPolicymakers')) },
                  { label: t('beneficiaryOther'), desc: t('beneficiaryOtherDesc'), value: String(t('beneficiaryOther')) },
                ].map((benef) => (
                  <label
                    key={benef.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${formValues.beneficiaries.includes(benef.value)
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-teal-500 w-4 h-4"
                      value={benef.value}
                      checked={formValues.beneficiaries.includes(benef.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormValues((prev) => ({
                            ...prev,
                            beneficiaries: [...prev.beneficiaries, benef.value],
                          }));
                          if (benef.value === otherBeneficiaryValue) setShowOtherInput(true);
                        } else {
                          setFormValues((prev) => ({
                            ...prev,
                            beneficiaries: prev.beneficiaries.filter((b) => b !== benef.value),
                            otherBeneficiary: benef.value === otherBeneficiaryValue ? "" : prev.otherBeneficiary,
                          }));
                          if (benef.value === otherBeneficiaryValue) setShowOtherInput(false);
                        }
                      }}
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm">{benef.label}</span>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{benef.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Show input only when "Other" is selected */}
              {showOtherInput && (
                <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <label className="block text-sm font-medium text-teal-800 mb-2">
                    {t('otherBeneficiaryPlaceholder')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                    placeholder={t('otherBeneficiaryPlaceholder')}
                    value={formValues.otherBeneficiary}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        otherBeneficiary: e.target.value,
                      }))
                    }
                  />
                </div>
              )}


            </div>
          </div>
        </div>

        {/* Implementation & Budget */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="text-lg font-semibold text-gray-800">{t('implementationBudget')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('implementationBudgetDesc')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium text-gray-900">
                {t('startDate')} <span className="text-gray-400 text-sm">{t('optional')}</span>
              </label>
              <input
                type="date"
                id="date_start"
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition duration-300 ease-in-out"
                value={formValues.startDate}
                onChange={(e) =>
                  setFormValues({ ...formValues, startDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-900">
                {t('endDate')} <span className="text-gray-400 text-sm">{t('optional')}</span>
              </label>
              <input
                type="date"
                id="date_end"
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition duration-300 ease-in-out"
                value={formValues.endDate}
                onChange={(e) =>
                  setFormValues({ ...formValues, endDate: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["ICESCO", "Member State", "Sponsorship"].map((item) => {
                const key = item.replace(" ", "_").toLowerCase();
                return (
                  <div className="space-y-2" key={item}>
                    <label className="block text-sm font-medium text-gray-700">
                      {t(`budgetLabel_${key}`)} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t('amountPlaceholder')}
                        required
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 shadow-sm"
                        id={`budget_${key}`}
                        value={formValues.budget[key as keyof typeof formValues.budget]}
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            budget: { ...formValues.budget, [key]: e.target.value },
                          })
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        {t('currencyUSD')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block mb-1 font-medium text-gray-900">
                {t('projectFrequency')} <span className="text-red-500">*</span>
              </label>
              <select
                id="project_frequency"
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 shadow-sm transition-all duration-200 ${formValues.freqError ? "border-red-500" : ""
                  }`}
                value={formValues.projectFrequency}
                onChange={(e) => setFormValues({ ...formValues, projectFrequency: e.target.value })}
                required
              >
                <option value="">{t('frequencySelect')}</option>
                <option value="One-time">{t('frequencyOneTime')}</option>
                <option value="Continuous">{t('frequencyContinuous')}</option>
              </select>
              {formValues.projectFrequency === "Continuous" && (
                <input
                  type="text"
                  id="frequency_duration"
                  placeholder={t('frequencyDurationPlaceholder')}
                  className={`w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition duration-300 ease-in-out mt-2 ${formValues.freqError ? "border-red-500" : ""
                    }`}
                  value={formValues.frequencyDuration}
                  onChange={(e) => setFormValues({ ...formValues, frequencyDuration: e.target.value })}
                  required
                />
              )}
              {formValues.freqError && <p className="text-red-500 text-sm mt-1">{formValues.freqError}</p>}
            </div>
          </div>
        </div>

        {/* Partners & Collaboration */}
        <div>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-800">{t('partnersCollaboration')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('partnersCollaborationDesc')}</p>
          </div>

          <div className="form-group space-y-2">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                {t('partners')} <span className="text-red-500">*</span>
              </span>
              <span className="block text-gray-500 text-sm">{t('institutions')} ({formValues.partners.length}/5)</span>
            </label>
            <div className="tag-input-container flex flex-col gap-2">
              <div id="partners-list" className="flex flex-wrap gap-2">
                {formValues.partners.map((p, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          partners: prev.partners.filter((_, index) => index !== i),
                        }))
                      }
                      className="w-4 h-4 flex items-center justify-center text-teal-600 hover:text-teal-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={String(formValues.partners.length >= 5 ? t('maxPartnersReached') : t('addPartnerPlaceholder'))}
                  className={`enhanced-input flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 ${formValues.partners.length >= 5 ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  value={formValues.partnerInput}
                  onChange={(e) => setFormValues({ ...formValues, partnerInput: e.target.value })}
                  onKeyPress={(e) => handleKeyPress(e, 'partner')}
                  disabled={formValues.partners.length >= 5}
                />
                <button
                  type="button"
                  id="add-partner-btn"
                  className={`px-3 py-2 rounded-xl transition-all duration-200 ${formValues.partners.length >= 5
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  onClick={handleAddPartner}
                  disabled={formValues.partners.length >= 5}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              {formValues.partners.length >= 5 && (
                <p className="text-sm text-amber-600 mt-1">
                  {t('maxPartnersLimitReached')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Project Scope & Modality */}
        <div>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-800">{t('projectScopeModality')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('projectScopeModalityDesc')}</p>
          </div>

          <div className="form-group space-y-2 my-6">
            <label htmlFor="convening_method" className="block">
              <span className="label-text font-medium text-gray-800">{t('projectType')} <span className="text-red-500">*</span></span>
              <span className="block text-gray-500 text-sm">{t('projectTypeHelp')}</span>
            </label>
            <select
              id="convening_method"
              required
              className="enhanced-select w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
              value={formValues.conveningMethod}
              onChange={(e) =>
                setFormValues({ ...formValues, conveningMethod: e.target.value })
              }
            >
              <option value="">{t('projectTypeSelect')}</option>
              <option value="Training">{t('typeTraining')}</option>
              <option value="Workshop">{t('typeWorkshop')}</option>
              <option value="Conference">{t('typeConference')}</option>
              <option value="Campaign">{t('typeCampaign')}</option>
              <option value="Research">{t('typeResearch')}</option>
              <option value="Other">{t('other')}</option>
            </select>

            {formValues.conveningMethod === "Other" && (
              <input
                type="text"
                id="convening_method_other"
                required
                placeholder={t('projectTypeOtherPlaceholder')}
                className="mt-3 w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition"
                value={formValues.conveningMethodOther}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    conveningMethodOther: e.target.value,
                  })
                }
              />
            )}
          </div>

          <div className="scope-grid grid md:grid-cols-2 gap-6">
            <div className="form-group space-y-3">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  {t('deliveryModality')} <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">{t('deliveryModalityHelp')}</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: "Physical", label: t('modalityPhysical') },
                  { value: "Virtual", label: t('modalityVirtual') },
                  { value: "Hybrid", label: t('modalityHybrid') }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${formValues.deliveryModality === option.value
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="modality"
                      value={option.value}
                      required
                      className="accent-teal-500 w-4 h-4"
                      checked={formValues.deliveryModality === option.value}
                      onChange={(e) =>
                        setFormValues({ ...formValues, deliveryModality: e.target.value })
                      }
                    />
                    <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group space-y-3">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  {t('geographicScope')} <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">{t('geographicScopeHelp')}</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: "National", label: t('scopeNational') },
                  { value: "Regional", label: t('scopeRegional') },
                  { value: "International", label: t('scopeInternational') }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${formValues.geographicScope === option.value
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="geographicScope"
                      value={option.value}
                      required
                      className="accent-teal-500 w-4 h-4"
                      checked={formValues.geographicScope === option.value}
                      onChange={(e) =>
                        setFormValues({ ...formValues, geographicScope: e.target.value })
                      }
                    />
                    <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Contact Information */}
        <div>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-800">{t('contactInformation')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('contactInformationDesc')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('contactFullName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contact_name"
                placeholder={t('contactFullNamePlaceholder')}
                required
                value={formValues.contact.name}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, name: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('contactEmail')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="contact_email"
                placeholder={t('contactEmailPlaceholder')}
                required
                value={formValues.contact.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-200 transition-all duration-200 shadow-sm ${emailError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-gray-300 focus:border-teal-500"
                  }`}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('contactPhone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="contact_phone"
                placeholder={t('contactPhonePlaceholder')}
                required
                value={formValues.contact.phone}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, phone: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('contactRole')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contact_role"
                placeholder={t('contactRolePlaceholder')}
                required
                value={formValues.contact.role}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, role: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Monitoring & Evaluation */}
        <div>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-800">{t('monitoringEvaluation')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('monitoringEvaluationDesc')}</p>
          </div>

          <div className="form-group space-y-3">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                {t('milestones')} <span className="text-gray-400 text-sm">{t('optional')}</span>
              </span>
              <span className="block text-gray-500 text-sm">{t('milestonesHelp')}</span>
            </label>
            <div className="milestone-container flex flex-col gap-2">
              <div id="milestones-list" className="flex flex-col gap-2">
                {formValues.milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          milestones: prev.milestones.filter((_, index) => index !== i),
                        }))
                      }
                      className="w-4 h-4 flex items-center justify-center text-teal-600 hover:text-teal-900"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  id="milestone-input"
                  placeholder={String(formValues.milestones.length >= 5 ? t('maxMilestonesReached') : t('milestoneNamePlaceholder'))}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm ${formValues.milestones.length >= 5 ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  value={formValues.milestoneInput}
                  onChange={(e) =>
                    setFormValues({ ...formValues, milestoneInput: e.target.value })
                  }
                  onKeyPress={(e) => handleKeyPress(e, 'milestone')}
                  disabled={formValues.milestones.length >= 5}
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  disabled={formValues.milestones.length >= 5}
                  className={`px-3 py-2 rounded-xl transition shadow-md flex items-center justify-center ${formValues.milestones.length >= 5
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              {formValues.milestones.length >= 5 && (
                <p className="text-sm text-amber-600 mt-1 mb-8">
                  {t('maxMilestonesLimitReached')}
                </p>
              )}
            </div>
          </div>

          <div className="form-group space-y-2 mb-8">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                {t('expectedOutputsDeliverables')} <span className="text-gray-400 text-sm">{t('optional')}</span>
              </span>
              <span className="block text-gray-500 text-sm">
                {t('expectedOutputsDeliverablesHelp')}
              </span>
            </label>
            <textarea
              id="expected_outputs"
              rows={3}
              placeholder={t('expectedOutputsDeliverablesPlaceholder')}
              value={formValues.expectedOutputs}
              onChange={(e) => setFormValues({ ...formValues, expectedOutputs: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
            ></textarea>
          </div>

          <div className="form-group space-y-2">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                {t('keyPerformanceIndicators')} <span className="text-gray-400 text-sm">{t('optional')}</span>
              </span>
              <span className="block text-gray-500 text-sm">{t('keyPerformanceIndicatorsHelp')}</span>
            </label>
            <div className="tag-input-container flex flex-col gap-2">
              <div id="kpis-list" className="flex flex-wrap gap-2">
                {formValues.kpis.map((kpi, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full"
                  >
                    <span>{kpi}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          kpis: prev.kpis.filter((_, index) => index !== i),
                        }))
                      }
                      className="w-4 h-4 flex items-center justify-center text-teal-600 hover:text-teal-900"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  id="kpi-input"
                  placeholder={String(formValues.kpis.length >= 5 ? t('maxKPIsReached') : t('keyPerformanceIndicatorsPlaceholder'))}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm ${formValues.kpis.length >= 5 ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  value={formValues.kpiInput}
                  onChange={(e) =>
                    setFormValues({ ...formValues, kpiInput: e.target.value })
                  }
                  onKeyPress={(e) => handleKeyPress(e, 'kpi')}
                  disabled={formValues.kpis.length >= 5}
                />
                <button
                  type="button"
                  onClick={handleAddKPI}
                  disabled={formValues.kpis.length >= 5}
                  className={`px-3 py-2 rounded-xl transition shadow-md flex items-center justify-center ${formValues.kpis.length >= 5
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              {formValues.kpis.length >= 5 && (
                <p className="text-sm text-amber-600 mt-1">
                  {t('maxKPIsLimitReached')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        <div>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-800">{t('supportingDocuments')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('supportingDocumentsDesc')}</p>
          </div>

          <div
            id="upload-area"
            className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200 cursor-pointer"
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.xlsx,.pptx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
            />
            <div className="upload-content flex flex-col items-center justify-center gap-3 pointer-events-none">
              <svg
                className="w-10 h-10 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700">{t('uploadDropOrBrowse')}</p>
                <p className="text-xs text-gray-500">{t('uploadTypesLimit')}</p>
              </div>
            </div>
          </div>

          {formValues.files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
              {formValues.files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* comments */}
        <div>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-800">{t('comments')}</h4>
            <p className="text-sm text-gray-600 mt-1">{t('commentsDesc')}</p>
          </div>

          <div className="form-group space-y-3">
            <label className="block">
              <span className="label-text font-medium text-gray-800">{t('comments')} <span className="text-gray-400 text-sm">{t('optional')}</span></span>
              <span className="block text-gray-500 text-sm mb-4">{t('commentsHelp')}</span>

              <textarea
                id="comments"
                rows={4}
                placeholder={t('commentsPlaceholder')}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition"
                value={formValues.comments}
                onChange={(e) =>
                  setFormValues({ ...formValues, comments: e.target.value })
                }
              ></textarea>
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {debugRender(t('previous'), 'previous button')}
          </button>

          <div className="flex items-center gap-3">
            {/* Save as Draft Button - Vertical Ticket Style */}
            {showDraftButton && (
              <button
                onClick={onSaveAsDraft}
                disabled={isDraftSaving || !isDraftValid()}
                className={`group relative flex flex-col items-center justify-center w-16 h-32 rounded-full transition shadow-lg font-medium ${
                  isDraftValid() && !isDraftSaving
                    ? 'bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isDraftSaving ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-medium transform -rotate-90 whitespace-nowrap">Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="text-xs font-medium transform -rotate-90 whitespace-nowrap">Save as Draft</span>
                  </>
                )}
                
                {/* Tooltip */}
                <div className="absolute right-full top-1/2 mr-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap transform -translate-y-1/2">
                  {isDraftValid() ? 'Save your progress as a draft' : 'Fill required fields to save as draft'}
                  <div className="absolute left-full top-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent transform -translate-y-1/2"></div>
                </div>
              </button>
            )}

            {/* Next Button */}
            <button
              onClick={() => {

                // Check for multilingual objects in form values
                const checkForMultilingualObjects = (obj: any, path = '') => {
                  for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                      if (value.hasOwnProperty('en') && value.hasOwnProperty('fr') && value.hasOwnProperty('ar')) {
                        console.warn(`Found multilingual object at ${currentPath}:`, value);
                      } else {
                        checkForMultilingualObjects(value, currentPath);
                      }
                    } else if (Array.isArray(value)) {
                      value.forEach((item, index) => {
                        if (item && typeof item === 'object') {
                          checkForMultilingualObjects(item, `${currentPath}[${index}]`);
                        }
                      });
                    }
                  }
                };

                checkForMultilingualObjects(formValues);
                onNext && onNext(formValues);
              }}
              disabled={!isFormValid()}
              className={`flex items-center px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg ${isFormValid()
                  ? "bg-[#0e7378] text-white hover:bg-[#0a5d61] hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              {debugRender(t('next'), 'next button')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Validation Message */}
        {!isFormValid() && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-4 h-4 text-amber-600 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-amber-700">
                {isDraftEditing() 
                  ? 'Please fill all essential fields to continue'
                  : debugRender(t('pleaseFillAllRequiredFields'), 'validation message')
                }
              </p>
            </div>
          </div>
        )}

        {/* Draft Validation Message */}
        {!isDraftValid() && showDraftButton && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">
                Enter a project title to save as draft
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

  );
});

StepFive.displayName = 'StepFive';

export default StepFive;
