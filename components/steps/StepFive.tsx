import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

type Step5Props = {
  onNext?: (details: any) => void;
  initialValues?: any;
};

export type StepFiveRef = {
  getFormValues: () => any;
};

const StepFive = forwardRef<StepFiveRef, Step5Props>((props, ref) => {
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

  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved data on component mount - only run once
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem("projectDetails");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Check if "Other" beneficiary is selected to show the input
          if (parsedData.beneficiaries && parsedData.beneficiaries.includes("Other")) {
            setShowOtherInput(true);
          }
          
          setFormValues(prev => ({
            ...prev,
            ...parsedData,
            // Note: Files from localStorage can't be restored as File objects
            files: parsedData.files || []
          }));
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
  }, []); // Remove isInitialized from dependency array

  // Handle initialValues from props (when coming back from next step)
  useEffect(() => {
    if (props.initialValues && isInitialized) {
      setFormValues(prev => ({
        ...prev,
        ...props.initialValues,
      }));
    }
  }, [props.initialValues, isInitialized]);

  // Save to localStorage - but only after initialization
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load

    const serializableFiles = formValues.files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));

    localStorage.setItem(
      "projectDetails",
      JSON.stringify({
        ...formValues,
        files: serializableFiles,
      })
    );
  }, [formValues, isInitialized]);

  useImperativeHandle(
    ref,
    () => ({
      getFormValues: () => {
        const serializableFiles = formValues.files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }));
        return {
          ...formValues,
          files: serializableFiles,
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

  const handleAddPartner = () => {
    const trimmed = formValues.partnerInput.trim();
    if (trimmed && !formValues.partners.includes(trimmed)) {
      setFormValues((prev) => ({
        ...prev,
        partners: [...prev.partners, trimmed],
        partnerInput: "",
      }));
    }
  };
  return (

    <div id="step5Content" className="space-y-16">
      {/* Section Header */}
      <div className="text-center">
        <h3 className="text-4xl md:text-3xl font-extrabold text-[#0f7378]  mt-12">
          Enter your project details
        </h3>
      </div>

      <div className="relative   py-4 space-y-8 ">
        {/* Project Identity */}
        <div className="my-12 space-y-6">
          <div className="flex items-center gap-3 mb-6 text-teal-700">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p className="text-xl font-semibold">Project Overview</p>
          </div>

          <div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-medium text-gray-900">
                  Project Title <span className="text-red-500">*</span>
                  <span className="block text-gray-500 text-sm">
                    A clear, descriptive name for your project
                  </span>
                </label>
                <input
                  id="title"
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  type="text"
                  required
                  placeholder="Enter project title"
                  className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-900">
                  Project Brief <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="brief"
                  required
                  rows={4}
                  value={formValues.brief}
                  onChange={(e) => setFormValues({ ...formValues, brief: e.target.value })}
                  placeholder="Provide a concise summary..."
                  className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm"
                ></textarea>
              </div>
            </div>

            {/* Strategic Justification */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-12 text-teal-700 ">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-xl font-semibold">Rationale & Impact</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-900">
                  Problem Statement & Rationale
                </label>
                <textarea
                  id="rationale"
                  rows={4}
                  required
                  value={formValues.rationale}
                  onChange={(e) => setFormValues({ ...formValues, rationale: e.target.value })}
                  placeholder="Describe the problem this project addresses..."
                  className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition"
                ></textarea>
              </div>
              {/* Target Beneficiaries */}
              <label className="block mb-2 font-medium text-gray-900">
                Target Beneficiaries <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="beneficiaries">
                {[
                  { label: "Students", desc: "Educational beneficiaries", value: "Students" },
                  { label: "Teachers", desc: "Government officials", value: "Teachers" },
                  { label: "Youth", desc: "Young people and communities", value: "Youth" },
                  { label: "General Public", desc: "Broader community impact", value: "General Public" },
                  { label: "Policymakers", desc: "Educational decision-makers", value: "Policymakers" },
                  { label: "Other", desc: "Specify custom beneficiaries", value: "Other" },
                ].map((benef) => (
                  <label
                    key={benef.value}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-300 hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md"
                  >
                    <input
                      type="checkbox"
                      className="accent-teal-500"
                      value={benef.value}
                      checked={formValues.beneficiaries.includes(benef.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormValues((prev) => ({
                            ...prev,
                            beneficiaries: [...prev.beneficiaries, benef.value],
                          }));
                          if (benef.value === "Other") setShowOtherInput(true);
                        } else {
                          setFormValues((prev) => ({
                            ...prev,
                            beneficiaries: prev.beneficiaries.filter((b) => b !== benef.value),
                            otherBeneficiary: benef.value === "Other" ? "" : prev.otherBeneficiary,
                          }));
                          if (benef.value === "Other") setShowOtherInput(false);
                        }
                      }}
                    />
                    <div>
                      <span className="font-medium text-gray-900 mr-2">{benef.label}</span>
                      <span className="text-gray-500 text-sm">{benef.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Show input only when "Other" is selected */}
              {showOtherInput && (
                <div className="mt-2">
                  <input
                    type="text"
                    className="ml-2 px-3 py-2 border border-gray-300 rounded-xl"
                    placeholder="Please specify other beneficiary"
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
        <div className="my-12 space-y-6">
          <div className="flex items-center gap-3 mb-6 mt-4 text-teal-700">
            <svg
              className="w-6 h-6 text-teal-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            <p className="text-xl font-semibold">Implementation & Budget</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium text-gray-900">
                Start Date <span className="text-gray-400 text-sm">(optional)</span>
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
                End Date <span className="text-gray-400 text-sm">(optional)</span>
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

            {["ICESCO", "Member State", "Sponsorship"].map((item) => {
              const key = item.replace(" ", "_").toLowerCase();
              return (
                <div className="flex items-center gap-4" key={item}>
                  <label className="text-gray-700 text-sm min-w-[120px]">
                    {item} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="0.00"
                      required
                      className="w-full px-5 py-3 pr-16 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition duration-300 ease-in-out"
                      id={`budget_${key}`}
                      value={formValues.budget[key as keyof typeof formValues.budget]}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          budget: { ...formValues.budget, [key]: e.target.value },
                        })
                      }
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="md:col-span-2 space-y-2">
              <label className="block mb-1 font-medium text-gray-900">
                Project Frequency <span className="text-red-500">*</span>
              </label>
              <select
                id="project_frequency"
                className={`w-full px-5 py-3 border border-gray-300 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition duration-300 ease-in-out ${formValues.freqError ? "border-red-500" : ""
                  }`}
                value={formValues.projectFrequency}
                onChange={(e) => setFormValues({ ...formValues, projectFrequency: e.target.value })}
                required
              >
                <option value="">Select frequency</option>
                <option value="One-time">One-time</option>
                <option value="Continuous">Continuous</option>
              </select>
              {formValues.projectFrequency === "Continuous" && (
                <input
                  type="text"
                  id="frequency_duration"
                  placeholder="Duration (e.g., 1 year, 2 years...)"
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
        <div className="mb-12">
          <div className="card-header flex items-center gap-3 mb-4 text-teal-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-xl font-semibold">Partners & Collaboration</p>
          </div>

          <div className="form-group space-y-2">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                Project Partners <span className="text-red-500">*</span>
              </span>
              <span className="block text-gray-500 text-sm">institutions</span>
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
                  placeholder="Add partner organization..."
                  className="enhanced-input flex-1 px-4 py-2 border border-gray-300 rounded-xl ..."
                  value={formValues.partnerInput}
                  onChange={(e) => setFormValues({ ...formValues, partnerInput: e.target.value })}
                />
                <button
                  type="button"
                  id="add-partner-btn"
                  className="px-3 py-2 bg-teal-600 text-white rounded-xl ..."
                  onClick={handleAddPartner}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Scope & Modality */}
        <div className="my-12">
          <div className="card-header flex items-center gap-3 mb-4 text-teal-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <p className="text-xl font-semibold">Project Scope & Modality</p>
          </div>

          <div className="form-group space-y-2 my-6">
            <label htmlFor="convening_method" className="block">
              <span className="label-text font-medium text-gray-800">
                Project Type <span className="text-red-500">*</span>
              </span>
              <span className="block text-gray-500 text-sm">
                What is the nature of your project?
              </span>
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
              <option value="">Select the format your project will take</option>
              <option value="Training">Training Program</option>
              <option value="Workshop">Workshop Series</option>
              <option value="Conference">Conference/Summit</option>
              <option value="Campaign">Awareness Campaign</option>
              <option value="Research">Research Initiative</option>
              <option value="Other">Other</option>
            </select>

            {formValues.conveningMethod === "Other" && (
              <input
                type="text"
                id="convening_method_other"
                required
                placeholder="Please specify the project format..."
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
                  Delivery Modality <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">
                  How will the project be conducted?
                </span>
              </label>
              <div className="radio-group flex flex-col gap-3">
                <label className="radio-item flex items-center gap-3 p-3 border border-gray-300 rounded-xl hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md">
                  <input
                    type="radio"
                    name="modality"
                    value="Physical"
                    required
                    className="accent-teal-500"
                    checked={formValues.deliveryModality === "Physical"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, deliveryModality: e.target.value })
                    }
                  />
                  <span className="font-medium text-gray-900">Physical</span>
                </label>

                <label className="radio-item flex items-center gap-3 p-3 border border-gray-300 rounded-xl hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md">
                  <input
                    type="radio"
                    name="modality"
                    value="Virtual"
                    required
                    className="accent-teal-500"
                    checked={formValues.deliveryModality === "Virtual"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, deliveryModality: e.target.value })
                    }
                  />
                  <span className="font-medium text-gray-900">Virtual</span>
                </label>

                <label className="radio-item flex items-center gap-3 p-3 border border-gray-300 rounded-xl hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md">
                  <input
                    type="radio"
                    name="modality"
                    value="Hybrid"
                    required
                    className="accent-teal-500"
                    checked={formValues.deliveryModality === "Hybrid"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, deliveryModality: e.target.value })
                    }
                  />
                  <span className="font-medium text-gray-900">Hybrid</span>
                </label>
              </div>
            </div>

            <div className="form-group space-y-3">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  Geographic Scope <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">
                  Project&apos;s geographic reach
                </span>
              </label>
              <div className="checkbox-grid-small grid grid-cols-1 gap-2">
                <label className="checkbox-item-small flex items-center gap-2 p-2 border border-gray-300 rounded-xl hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md">
                  <input
                    type="radio"
                    name="geographicScope"
                    value="National"
                    required
                    className="accent-teal-500"
                    checked={formValues.geographicScope === "National"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, geographicScope: e.target.value })
                    }
                  />
                  <span className="text-gray-900 font-medium">National</span>
                </label>

                <label className="checkbox-item-small flex items-center gap-2 p-2 border border-gray-300 rounded-xl hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md">
                  <input
                    type="radio"
                    name="geographicScope"
                    value="Regional"
                    required
                    className="accent-teal-500"
                    checked={formValues.geographicScope === "Regional"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, geographicScope: e.target.value })
                    }
                  />
                  <span className="text-gray-900 font-medium">Regional</span>
                </label>

                <label className="checkbox-item-small flex items-center gap-2 p-2 border border-gray-300 rounded-xl hover:border-teal-500 transition cursor-pointer bg-white/50 backdrop-blur-md">
                  <input
                    type="radio"
                    name="geographicScope"
                    value="International"
                    required
                    className="accent-teal-500"
                    checked={formValues.geographicScope === "International"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, geographicScope: e.target.value })
                    }
                  />
                  <span className="text-gray-900 font-medium">International</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Project Contact Information */}
        <div className="my-12 ">
          <div className="card-header flex items-center gap-3 mb-4 text-teal-700">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <p className="text-xl font-semibold">Project Contact Information</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="form-group space-y-2">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  Full Name <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">Primary project contact</span>
              </label>
              <input
                type="text"
                id="contact_name"
                placeholder="Enter full name"
                required
                value={formValues.contact.name}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, name: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
              />
            </div>

            <div className="form-group space-y-2">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  Email Address <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">Primary contact email</span>
              </label>
              <input
                type="email"
                id="contact_email"
                placeholder="Enter email address"
                required
                value={formValues.contact.email}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, email: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
              />
            </div>

            <div className="form-group space-y-2">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  Phone Number <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">Contact phone number</span>
              </label>
              <input
                type="tel"
                id="contact_phone"
                placeholder="Enter phone number"
                required
                value={formValues.contact.phone}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, phone: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
              />
            </div>

            <div className="form-group space-y-2">
              <label className="block">
                <span className="label-text font-medium text-gray-800">
                  Position/Role <span className="text-red-500">*</span>
                </span>
                <span className="block text-gray-500 text-sm">Your role in the organization</span>
              </label>
              <input
                type="text"
                id="contact_role"
                placeholder="Enter position or role"
                required
                value={formValues.contact.role}
                onChange={(e) => setFormValues({
                  ...formValues,
                  contact: { ...formValues.contact, role: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Monitoring & Evaluation */}
        <div className="my-12">
          <div className="card-header flex items-center gap-3 mb-4 text-teal-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <p className="text-xl font-semibold">Monitoring & Evaluation</p>
          </div>

          <div className="form-group space-y-3">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                Project Milestones <span className="text-gray-400 text-sm">(optional)</span>
              </span>
              <span className="block text-gray-500 text-sm">Key checkpoints and deliverable dates</span>
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
                  placeholder="Milestone name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
                  value={formValues.milestoneInput}
                  onChange={(e) =>
                    setFormValues({ ...formValues, milestoneInput: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = formValues.milestoneInput.trim();
                    if (trimmed) {
                      setFormValues((prev) => ({
                        ...prev,
                        milestones: [...prev.milestones, trimmed],
                        milestoneInput: "",
                      }));
                    }
                  }}
                  className="px-3 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition shadow-md flex items-center justify-center"
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
            </div>
          </div>

          <div className="form-group space-y-2 mb-8">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                Expected Outputs & Deliverables <span className="text-gray-400 text-sm">(optional)</span>
              </span>
              <span className="block text-gray-500 text-sm">
                Concrete results and deliverables from this project
              </span>
            </label>
            <textarea
              id="expected_outputs"
              rows={3}
              placeholder="List the expected outputs and deliverables..."
              value={formValues.expectedOutputs}
              onChange={(e) => setFormValues({ ...formValues, expectedOutputs: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
            ></textarea>
          </div>

          <div className="form-group space-y-2">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                Key Performance Indicators <span className="text-gray-400 text-sm">(optional)</span>
              </span>
              <span className="block text-gray-500 text-sm">How will success be measured?</span>
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
                  placeholder="Add success metric..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition shadow-sm"
                  value={formValues.kpiInput}
                  onChange={(e) =>
                    setFormValues({ ...formValues, kpiInput: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = formValues.kpiInput.trim();
                    if (trimmed) {
                      setFormValues((prev) => ({
                        ...prev,
                        kpis: [...prev.kpis, trimmed],
                        kpiInput: "",
                      }));
                    }
                  }}
                  className="px-3 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition shadow-md flex items-center justify-center"
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
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="my-12 bg-white backdrop-blur-lg rounded-3xl shadow-xl p-8 space-y-6">
          <div className="card-header flex items-center gap-3 mb-4 text-teal-700">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-xl font-semibold">Supporting Documents</p>
          </div>

          <div
            id="upload-area"
            className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition cursor-pointer"
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.xlsx,.pptx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
            />
            <div className="upload-content flex flex-col items-center justify-center gap-4 pointer-events-none">
              <svg
                className="w-12 h-12 text-teal-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-lg font-medium text-gray-700">
                Drop files here or{" "}
                <span className="text-teal-600 font-semibold">browse</span>
              </p>
              <p className="text-sm text-gray-500">
                PDF, DOCX, PNG, JPG, XLSX, PPTX up to 10MB each
              </p>
            </div>
          </div>

          {formValues.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {formValues.files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2 bg-gray-50 border rounded-lg shadow-sm"
                >
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* comments */}
        <div className="my-12">
          <div className="card-header flex items-center gap-3 mb-4 text-teal-700">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <p className="text-xl font-semibold">Comments </p>
          </div>

          <div className="form-group space-y-3">
            <label className="block">
              <span className="label-text font-medium text-gray-800">
                Comments <span className="text-gray-400 text-sm">(optional)</span>
              </span>
              <span className="block text-gray-500 text-sm mb-4">
                Add any relevant comments or feedback
              </span>

              <textarea
                id="comments"
                rows={4}
                placeholder="Add any additional comments or feedback..."
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

    </div>

  );
});

export default StepFive;
