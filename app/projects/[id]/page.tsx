'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, FileText, Landmark, Settings, Pin, Clock, Tag, Target, BarChart3, User, MessageSquare, AlertCircle, FileX } from 'lucide-react';
import Image from 'next/image';
import ProjectsPageHeader from '@/components/ProjectsPageHeader';
// import maquettesImage from '@/public/maquettes.png'; // Removed during cleanup

import {
  getGoalCodeFromSubserviceId,
  getPillarCodeFromSubserviceId,
  getServiceCodeFromSubserviceId,
  getSubServiceCodeFromProject,
  getGoalTitleFromCode,
  getPillarTitleFromCode,
  getServiceTitleFromCode,
  getSubServiceTitleFromCode
} from '@/utils/codeMapping';

// Union type for both project types
type AnyProject = {
  id: string;
  name: string;
  description?: string;
  brief?: string;
  rationale?: string;
  start_date?: string;
  end_date?: string;
  budget?: {
    icesco: string;
    member_state: string;
    sponsorship: string;
  };
  project_frequency?: string;
  frequency_duration?: string;
  partners?: string[];
  convening_method?: string;
  convening_method_other?: string;
  delivery_modality?: string;
  geographic_scope?: string;
  beneficiaries?: string[];
  other_beneficiary?: string;
  milestones?: string[];
  expected_outputs?: string;
  kpis?: string[];
  contact?: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  files?: any[];
  comments?: string;
  date_entered?: string;
  date_modified?: string;
  created_at?: string;
  modified_at?: string;
  // CRM specific fields
  subservice_name?: string;
  subservice_id?: string;
  contact_name?: string;
  contact_id?: string;
  account_name?: string;
  account_id?: string;
  source?: 'local' | 'crm';
  // Additional CRM fields from the actual data
  strategic_goal_id?: string;
  pillar_id?: string;
  service_id?: string;
  sub_service_id?: string;
  strategic_goal?: string;
  pillar?: string;
  service?: string;
  sub_service?: string;
  other_beneficiaries?: string;
  budget_icesco?: string;
  budget_member_state?: string;
  budget_sponsorship?: string;
  frequency?: string;
  project_type?: string;
  project_type_other?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
};

const ProjectDetailsPage = () => {
  const { t, i18n } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const currentLanguage = i18n.language || 'en';

  const [project, setProject] = useState<AnyProject | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Retry utility function with exponential backoff - retry indefinitely
  const retryWithBackoff = async (fn: () => Promise<any>, baseDelay: number = 1000) => {
    let attempt = 0;
    
    while (true) {
      try {
        return await fn();
      } catch (error) {
        attempt++;
        
        // Calculate delay with exponential backoff (capped at 30 seconds)
        const delay = Math.min(baseDelay * Math.pow(2, Math.min(attempt - 1, 5)), 30000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const projectId = params?.id as string;

        // Clean existing data first
        const { cleanExistingProjectData } = await import('@/utils/dataCleanup');
        cleanExistingProjectData();

        // First try to get from localStorage (local projects) - this is instant
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        const localProject = localProjects.find((p: AnyProject) => p.id === projectId);

        if (localProject) {
          setProject({ ...localProject, source: 'local' });
          setLoading(false);
          return;
        }

        // If not found locally, try to get from CRM

        // Use retry logic for the API call
        
        const response = await retryWithBackoff(async () => {
          const apiCall = fetch(`/api/crm/projects`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
          );

          const response = await Promise.race([apiCall, timeoutPromise]) as Response;
          
          if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
          }
          
          return response;
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch projects from CRM');
        }
        
        const crmProject = data.projects?.find((p: AnyProject) => p.id === projectId);

        if (crmProject) {
            
            
            
            
            
            
            
            
            
            // Helper function to get field value with fallbacks
            const getFieldValue = (primaryField: string, ...fallbackFields: string[]) => {
              const allFields = [primaryField, ...fallbackFields];
              for (const field of allFields) {
                if (crmProject[field] !== undefined && crmProject[field] !== null && crmProject[field] !== '') {
                  return crmProject[field];
                }
              }
              return '';
            };

            // Transform CRM project data to match expected format
            const transformedProject = {
              ...crmProject,
              source: 'crm',
              // Transform string fields to arrays where needed
              beneficiaries: (() => {
                const beneficiariesValue = getFieldValue('beneficiaries', 'beneficiaries_c', 'beneficiaries_list', 'target_beneficiaries');
                return typeof beneficiariesValue === 'string'
                  ? beneficiariesValue.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                  : Array.isArray(beneficiariesValue) ? beneficiariesValue : [];
              })(),
              partners: (() => {
                const partnersValue = getFieldValue('partners', 'partners_c', 'partners_list', 'collaborating_partners');
                return typeof partnersValue === 'string'
                  ? partnersValue.split(',').map((p: string) => p.trim()).filter((p: string) => p)
                  : Array.isArray(partnersValue) ? partnersValue : [];
              })(),
              milestones: (() => {
                const milestonesValue = getFieldValue('milestones', 'milestones_c', 'milestones_list');
                return typeof milestonesValue === 'string'
                  ? milestonesValue.split(',').map((m: string) => m.trim()).filter((m: string) => m)
                  : Array.isArray(milestonesValue) ? milestonesValue : [];
              })(),
              kpis: (() => {
                const kpisValue = getFieldValue('kpis', 'kpis_c', 'kpis_list', 'key_performance_indicators');
                return typeof kpisValue === 'string'
                  ? kpisValue.split(',').map((k: string) => k.trim()).filter((k: string) => k)
                  : Array.isArray(kpisValue) ? kpisValue : [];
              })(),
              // Map budget fields with fallbacks
              budget: {
                icesco: getFieldValue('budget_icesco', 'budget_icesco_c', 'icesco_budget', 'total_budget') || '0',
                member_state: getFieldValue('budget_member_state', 'budget_member_c', 'member_budget', 'member_state_budget') || '0',
                sponsorship: getFieldValue('budget_sponsorship', 'budget_sponsor_c', 'sponsor_budget', 'sponsorship_budget') || '0'
              },
              // Map other fields with fallbacks
              brief: getFieldValue('description', 'brief', 'project_description', 'summary'),
              rationale: getFieldValue('problem_statement', 'rationale', 'justification', 'background'),
              start_date: getFieldValue('start_date', 'date_start', 'project_start', 'begin_date'),
              end_date: getFieldValue('end_date', 'date_end', 'project_end', 'completion_date'),
              project_frequency: (() => {
                // Check all possible frequency fields from the CRM data - prioritize project_frequency first
                const frequencyFields = [
                  'project_frequency', 'frequency', 'frequency_c', 'project_frequency_c',
                  'frequency_duration', 'recurrence', 'freq', 'duration', 'timing', 'schedule',
                  // Check if there are any other fields in the raw data
                  ...Object.keys(crmProject).filter(key => 
                    key.toLowerCase().includes('freq') || 
                    key.toLowerCase().includes('duration') || 
                    key.toLowerCase().includes('recur') ||
                    key.toLowerCase().includes('timing') ||
                    key.toLowerCase().includes('schedule')
                  )
                ];
                const result = getFieldValue(frequencyFields[0], ...frequencyFields.slice(1));
                return result;
              })(),
              delivery_modality: getFieldValue('delivery_modality', 'delivery_method', 'modality', 'implementation_method'),
              geographic_scope: getFieldValue('geographic_scope', 'geographic_coverage', 'scope', 'coverage_area'),
              convening_method: getFieldValue('project_type', 'convening_method', 'project_category', 'type', 'category'),
              expected_outputs: getFieldValue('expected_outputs', 'outputs', 'deliverables', 'results'),
              comments: getFieldValue('comments', 'notes', 'remarks', 'additional_info'),
              // Map contact info with fallbacks
              contact: {
                name: getFieldValue('contact_name', 'contact_person', 'primary_contact', 'project_contact'),
                email: getFieldValue('contact_email', 'email', 'contact_email_c', 'primary_email'),
                phone: getFieldValue('contact_phone', 'phone', 'contact_phone_c', 'primary_phone'),
                role: getFieldValue('contact_role', 'position', 'role_c', 'contact_position')
              }
            };

            
            
            

            setProject(transformedProject);
            setLoading(false);
            console.log('✅ Project loaded successfully');
          } else {
            console.log('❌ Project not found in CRM');
            console.log('Looking for project ID:', projectId);
            console.log('Available project IDs:', data.projects?.map((p: AnyProject) => p.id) || []);
            console.log('Total projects found:', data.projects?.length || 0);
            setError('Project not found in CRM');
            setLoading(false);
          }
      } catch (err) {
        console.error('❌ Error fetching project:', err);
        // Don't set error state or loading to false - keep retrying indefinitely
        // The retry logic will handle this automatically
      }
    };

    if (params?.id) {
      fetchProject();
    }
  }, [params?.id]);

  const getStatusColor = (project: AnyProject) => {
    if (!project.start_date && !project.end_date) return 'bg-yellow-100 text-yellow-800';

    const now = new Date();
    const startDate = project.start_date ? new Date(project.start_date) : null;
    const endDate = project.end_date ? new Date(project.end_date) : null;

    if (endDate && endDate < now) return 'bg-green-100 text-green-800';
    if (startDate && startDate <= now) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (project: AnyProject) => {
    if (!project.start_date && !project.end_date) return t('planned');

    const now = new Date();
    const startDate = project.start_date ? new Date(project.start_date) : null;
    const endDate = project.end_date ? new Date(project.end_date) : null;

    if (endDate && endDate < now) return t('completed');
    if (startDate && startDate <= now) return t('inProgress');
    return t('planned');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('notSpecified');
    return new Date(dateString).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper function to clean beneficiary strings
  const cleanBeneficiaryString = (str: string) => {
    return str
      .replace(/[\^]/g, '') // Remove caret symbols
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Helper function to translate beneficiary values
  const translateBeneficiary = (beneficiary: string) => {
    // Clean the beneficiary string from any unwanted characters
    const cleanBeneficiary = cleanBeneficiaryString(beneficiary);
    
    const beneficiaryMap: Record<string, string> = {
      // English keys
      'Students': t('beneficiaryStudents'),
      'Teachers': t('beneficiaryTeachers'),
      'Youth': t('beneficiaryYouth'),
      'General Public': t('beneficiaryPublic'),
      'Policymakers': t('beneficiaryPolicymakers'),
      'Other': t('beneficiaryOther'),
      
      // Arabic keys (in case data is stored in Arabic)
      'الطلاب': t('beneficiaryStudents'),
      'المعلمون': t('beneficiaryTeachers'),
      'الشباب': t('beneficiaryYouth'),
      'الجمهور العام': t('beneficiaryPublic'),
      'صانعو السياسات': t('beneficiaryPolicymakers'),
      'أخرى': t('beneficiaryOther'),
      
      // French keys (in case data is stored in French)
      'Étudiants': t('beneficiaryStudents'),
      'Enseignants': t('beneficiaryTeachers'),
      'Jeunesse': t('beneficiaryYouth'),
      'Grand Public': t('beneficiaryPublic'),
      'Décideurs': t('beneficiaryPolicymakers'),
      'Autre': t('beneficiaryOther'),
    };
    
    return beneficiaryMap[cleanBeneficiary] || cleanBeneficiary;
  };

  // Helper function to translate frequency values
  const translateFrequency = (frequency: string) => {
    const frequencyMap: Record<string, string> = {
      'One-time': t('frequencyOneTime'),
      'Continuous': t('frequencyContinuous'),
      'Monthly': t('frequencyMonthly') || 'Monthly',
      'Yearly': t('frequencyYearly') || 'Yearly',
      'Weekly': t('frequencyWeekly') || 'Weekly',
      'Daily': t('frequencyDaily') || 'Daily',
      // Add more mappings as needed
    };
    
    return frequencyMap[frequency] || frequency;
  };

  // Helper function to translate delivery modality values
  const translateModality = (modality: string) => {
    const modalityMap: Record<string, string> = {
      'Physical': t('modalityPhysical'),
      'Virtual': t('modalityVirtual'),
      'Hybrid': t('modalityHybrid'),
      // Add more mappings as needed
    };
    
    return modalityMap[modality] || modality;
  };

  // Helper function to translate geographic scope values
  const translateScope = (scope: string) => {
    const scopeMap: Record<string, string> = {
      'National': t('scopeNational'),
      'Regional': t('scopeRegional'),
      'International': t('scopeInternational'),
      // Add more mappings as needed
    };
    
    return scopeMap[scope] || scope;
  };

  // Helper function to translate convening method values
  const translateConveningMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'Workshop': t('typeWorkshop'),
      'Conference': t('typeConference'),
      'Training': t('typeTraining'),
      'Campaign': t('typeCampaign'),
      'Research': t('typeResearch'),
      // Add more mappings as needed
    };
    
    return methodMap[method] || method;
  };

  // Loading component for individual sections
  const LoadingSection = ({ title }: { title: string }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
      </div>
    </div>
  );

  // Error component for individual sections
  const ErrorSection = ({ message }: { message: string }) => (
    <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-800 font-medium">{message}</p>
      </div>
    </div>
  );

  // Handle edit project - navigate to project submission form with pre-filled data
  const handleEditProject = () => {
    
    if (!project) {
      console.error('❌ Cannot edit project: project is null or undefined');
      console.log('Loading:', loading);
      console.log('Error:', error);
      return;
    }

    // Set session storage flag to indicate we're coming from project edit
    sessionStorage.setItem('fromProjectEdit', 'true');

    
    
    

    // Map project data to form format
    const formData = {
      // Basic project info
      title: project.name || '',
      brief: project.brief || project.description || '',
      rationale: project.rationale || '',
      
      // Strategic selections (extract from hierarchy or project data)
      selectedGoal: project.strategic_goal_id || '',
      selectedPillar: project.pillar_id || '',
      selectedService: project.service_id || '',
      selectedSubService: project.sub_service_id || project.subservice_id || '',
      
      // Strategic selection names for display
      selectedGoalName: project.strategic_goal || '',
      selectedPillarName: project.pillar || '',
      selectedServiceName: project.service || '',
      selectedSubServiceName: project.sub_service || project.subservice_name || '',
      
      // Beneficiaries
      beneficiaries: project.beneficiaries || [],
      otherBeneficiary: project.other_beneficiaries || '',
      
      // Budget and timeline
      budget: {
        icesco: project.budget_icesco?.toString() || '',
        member_state: project.budget_member_state?.toString() || '',
        sponsorship: project.budget_sponsorship?.toString() || '',
      },
      startDate: project.start_date || '',
      endDate: project.end_date || '',
      projectFrequency: (() => {
        // Check all possible frequency field names and values
        const frequencyFields = [
          'project_frequency', 'frequency', 'frequency_duration', 'frequency_c',
          'project_frequency_c', 'freq', 'duration', 'timing', 'schedule'
        ];
        
        let rawFrequency = '';
        for (const field of frequencyFields) {
          if ((project as any)[field] && (project as any)[field] !== '') {
            rawFrequency = (project as any)[field];
            break;
          }
        }
        
        
        let normalizedFrequency = rawFrequency;
        if (rawFrequency === 'Onetime') {
          normalizedFrequency = 'One-time';
        } else if (rawFrequency === 'Continuous') {
          normalizedFrequency = 'Continuous';
        } else if (rawFrequency === 'One-time') {
          normalizedFrequency = 'One-time';
        } else if (!rawFrequency || rawFrequency === '') {
          normalizedFrequency = '';
        }
        
        return normalizedFrequency;
      })(),
      frequencyDuration: project.frequency_duration || '',
      
      // Partners and scope
      partners: project.partners || [],
      geographicScope: project.geographic_scope || '',
      deliveryModality: project.delivery_modality || '',
      conveningMethod: project.convening_method || project.project_type || '',
      conveningMethodOther: project.convening_method_other || project.project_type_other || '',
      
      // Monitoring and evaluation
      milestones: project.milestones || [],
      kpis: project.kpis || [],
      expectedOutputs: project.expected_outputs || '',
      
      // Contact information
      contact: {
        name: project.contact_name || '',
        email: project.contact_email || '',
        phone: project.contact_phone || '',
        role: project.contact_role || '',
      },
      contact_id: project.contact_id || '',
      
      // Additional info
      comments: project.comments || '',
      
      // Files (if any)
      files: project.files || [],
    };

    // Store the form data in localStorage for the project submission form
    console.log('=== PROJECT EDIT DATA STORAGE DEBUG ===');
    console.log('Storing project data for editing:', formData);
    console.log('Key fields being stored:');
    console.log('- startDate:', formData.startDate);
    console.log('- endDate:', formData.endDate);
    console.log('- partners:', formData.partners);
    console.log('- beneficiaries:', formData.beneficiaries);
    console.log('- expectedOutputs:', formData.expectedOutputs);
    console.log('- projectFrequency:', formData.projectFrequency);
    console.log('- frequencyDuration:', formData.frequencyDuration);
    console.log('========================================');
    
    
    localStorage.setItem('projectDetails', JSON.stringify(formData));
    
    
    // Store the project ID for update purposes
    localStorage.setItem('editingProjectId', project.id);
    localStorage.setItem('isEditingProject', 'true');
    
    // Navigate to the project submission form
    router.push('/#next-section');
  };


  // State for hierarchy data to make it reactive to language changes
  const [hierarchyData, setHierarchyData] = useState<{
    goal: { code: string | null; title: string | null };
    pillar: { code: string | null; title: string | null };
    service: { code: string | null; title: string | null };
    subservice: { code: string | null; title: string | null };
  } | null>(null);

  // Update hierarchy data when project or language changes
  useEffect(() => {
    if (project && project.source === 'crm') {
      const subserviceCode = getSubServiceCodeFromProject(project);
      if (subserviceCode) {
        const goalCode = getGoalCodeFromSubserviceId(subserviceCode);
        const pillarCode = getPillarCodeFromSubserviceId(subserviceCode);
        const serviceCode = getServiceCodeFromSubserviceId(subserviceCode);

        const goalTitle = goalCode ? getGoalTitleFromCode(goalCode, currentLanguage as 'en' | 'fr' | 'ar') : null;
        const pillarTitle = pillarCode ? getPillarTitleFromCode(pillarCode, currentLanguage as 'en' | 'fr' | 'ar') : null;
        const serviceTitle = serviceCode ? getServiceTitleFromCode(serviceCode, currentLanguage as 'en' | 'fr' | 'ar') : null;
        const subserviceTitle = getSubServiceTitleFromCode(subserviceCode, currentLanguage as 'en' | 'fr' | 'ar');

        setHierarchyData({
          goal: { code: goalCode, title: goalTitle },
          pillar: { code: pillarCode, title: pillarTitle },
          service: { code: serviceCode, title: serviceTitle },
          subservice: { code: subserviceCode, title: subserviceTitle }
        });
      } else {
        setHierarchyData(null);
      }
    } else {
      setHierarchyData(null);
    }
  }, [project, currentLanguage]);

  // Debug: Log current state
  console.log('=== PROJECT DETAILS RENDER STATE ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Project:', project);
  console.log('Project ID from params:', params?.id);
  console.log('Hierarchy Data:', hierarchyData);
  
  // Force render debug
  console.log('=== FORCE RENDER DEBUG ===');
  console.log('Should show content:', !loading && !error && project);
  console.log('Content conditions:');
  console.log('- !loading:', !loading);
  console.log('- !error:', !error);
  console.log('- project exists:', !!project);
  
  if (project) {
    console.log('=== PROJECT HIERARCHY DEBUG ===');
    console.log('Project source:', project.source);
    console.log('Project subservice_id:', project.subservice_id);
    console.log('Project subservice_name:', project.subservice_name);
    console.log('Project sub_service_id:', project.sub_service_id);
    console.log('Project sub_service:', project.sub_service);
    
    const subserviceCode = getSubServiceCodeFromProject(project);
    console.log('Subservice code from function:', subserviceCode);
  }

  return (
    <div className="min-h-screen bg-gray-50 relative" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ zIndex: 1 }}>
     
      
      {/* Header */}
      <div className="relative z-1">
        <ProjectsPageHeader 
          breadcrumbs={[
            { label: t('projects'), href: '/projects' },
            { label: project?.name || t('loading') }
          ]}
        />
      </div>


      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative mt-8" style={{ zIndex: 1, marginTop: '2rem' }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
           

            {/* Show loading states */}
            {loading && (
              <div className="relative z-1">
                <LoadingSection title={t('projectOverview')} />
                <LoadingSection title={t('rationaleImpact')} />
                <LoadingSection title={t('implementationBudget')} />
                <LoadingSection title={t('partnersCollaboration')} />
                <LoadingSection title={t('projectScopeModality')} />
                <LoadingSection title={t('monitoringEvaluation')} />
                <LoadingSection title={t('contactInformation')} />
                <LoadingSection title={t('comments')} />
              </div>
            )}


            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t('error') || 'Error'}
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('retry') || 'Retry'}
                </button>
              </div>
            )}

            {/* No Project State */}
            {!loading && !error && !project && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileX className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  {t('projectNotFound') || 'Project Not Found'}
                </h3>
                <p className="text-yellow-700 mb-4">
                  {t('projectNotFoundMessage') || 'The requested project could not be found.'}
                </p>
                <button
                  onClick={() => router.push('/projects')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  {t('backToProjects') || 'Back to Projects'}
                </button>
              </div>
            )}

            {!loading && !error && project && (
              <>
            {/* Project Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative"
              style={{ 
                zIndex: 1, 
                position: 'relative', 
                visibility: 'visible', 
                display: 'block',
                opacity: 1,
                backgroundColor: 'white'
              }}
            >
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                    <div className={`w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    {t('projectOverview')}
                  </h2>
                  
                  {/* Edit Button */}
                  <button
                    onClick={handleEditProject}
                    className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t('editProject') || 'Edit Project'}
                  </button>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('titreprojet')}</label>
                    <p className="text-lg font-medium text-gray-900">{project.name}</p>
                  </div>
                
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('brief')}</label>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {project.description || project.brief || t('noDescription')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Rationale & Impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-50 to-red-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  {t('rationaleImpact')}
                </h2>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('problemStatementPlaceholder')}</label>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">
                      {project.rationale || ('problem_statement' in project ? (project as any).problem_statement : '') || t('noDescription')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('beneficiaries')}</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(project.beneficiaries) ? (
                        project.beneficiaries.map((beneficiary, index) => (
                          <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                            {translateBeneficiary(beneficiary)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic">{t('notSpecified')}</span>
                      )}
                    </div>
                    {project.other_beneficiary && (
                      <div className="mt-3">
                        <span className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">
                          {project.other_beneficiary}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('expectedImpact')}</label>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-green-800 text-sm">
                        {t('impactDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Implementation & Budget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  {t('implementationBudget')}
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Timeline */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('timeline')}</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">{t('startDate')}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatDate(project.start_date)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">{t('endDate')}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatDate(project.end_date)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">{t('frequency')}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(() => {
                            const frequencyValue = project.project_frequency || project.frequency || project.frequency_duration;
                            
                            if (frequencyValue && frequencyValue.trim() !== '') {
                              return translateFrequency(frequencyValue);
                            } else {
                              // Show "Not Specified" when no frequency is found
                              return t('notSpecified') || 'Not Specified';
                            }
                          })()}
                          {project.frequency_duration && project.frequency_duration.trim() !== '' && ` (${project.frequency_duration})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('budget')}</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl border border-blue-200">
                        <span className="text-sm font-medium text-blue-700">{t('budgetLabel_icesco')}</span>
                        <span className="text-lg font-bold text-blue-900">
                          {formatCurrency(project.budget?.icesco || ('budget_icesco' in project ? (project as any).budget_icesco : '') || '0')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl border border-green-200">
                        <span className="text-sm font-medium text-green-700">{t('memberState')}</span>
                        <span className="text-lg font-bold text-green-900">
                          {formatCurrency(project.budget?.member_state || ('budget_member_state' in project ? (project as any).budget_member_state : '') || '0')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-purple-50 rounded-xl border border-purple-200">
                        <span className="text-sm font-medium text-purple-700">{t('sponsorship')}</span>
                        <span className="text-lg font-bold text-purple-900">
                          {formatCurrency(project.budget?.sponsorship || ('budget_sponsorship' in project ? (project as any).budget_sponsorship : '') || '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* Project Scope & Modality */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  {t('projectScopeModality')}
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('deliveryModality')}</label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 font-medium">{project.delivery_modality ? translateModality(project.delivery_modality) : t('notSpecified')}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('geographicScope')}</label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 font-medium">{project.geographic_scope ? translateScope(project.geographic_scope) : t('notSpecified')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('conveningMethod')}</label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 font-medium">
                          {(() => {
                            const method = project.convening_method || ('project_type' in project ? (project as any).project_type : '');
                            return method ? translateConveningMethod(method) : t('notSpecified');
                          })()} 
                          {project.convening_method_other && ` (${project.convening_method_other})`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Partners & Beneficiaries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  {t('partnersCollaboration')}
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('partners')}</label>
                    <div className="flex flex-wrap gap-3">
                      {project.partners && Array.isArray(project.partners) && project.partners.length > 0 ? (
                        project.partners.map((partner, index) => (
                          <span key={index} className="px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-medium border border-green-200">
                            {partner}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic text-sm">{t('notSpecified')}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('beneficiaries')}</label>
                    <div className="flex flex-wrap gap-3">
                      {project.beneficiaries && Array.isArray(project.beneficiaries) && project.beneficiaries.length > 0 ? (
                        project.beneficiaries.map((beneficiary, index) => (
                          <span key={index} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl text-sm font-medium border border-blue-200">
                            {translateBeneficiary(beneficiary)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic text-sm">{t('notSpecified')}</span>
                      )}
                      {project.other_beneficiary && (
                        <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium border border-gray-200">
                          {project.other_beneficiary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Monitoring & Evaluation */}
            {((project.milestones?.length || 0) > 0 || project.expected_outputs || (project.kpis?.length || 0) > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-8 py-6 border-b border-gray-100">
                  <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                    <div className={`w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    {t('monitoringEvaluation')}
                  </h2>
                </div>
                <div className="p-8 space-y-8">
                  {project.milestones && Array.isArray(project.milestones) && project.milestones.length > 0 && (
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('milestones')}</label>
                      <div className="space-y-3">
                        {project.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-900 font-medium">{milestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.expected_outputs && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('expectedOutputs')}</label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 leading-relaxed">{project.expected_outputs}</p>
                      </div>
                    </div>
                  )}
                  {project.kpis && Array.isArray(project.kpis) && project.kpis.length > 0 && (
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('kpis')}</label>
                      <div className="flex flex-wrap gap-3">
                        {project.kpis.map((kpi, index) => (
                          <span key={index} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-medium border border-yellow-200">
                            {kpi}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  {t('contactInformation')}
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('name')}</label>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.name || ('contact_name' in project ? (project as any).contact_name : '') || t('notSpecified')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('email')}</label>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.email || ('contact_email' in project ? (project as any).contact_email : '') || t('notSpecified')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('phone')}</label>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.phone || ('contact_phone' in project ? (project as any).contact_phone : '') || t('notSpecified')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('role')}</label>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.role || ('contact_role' in project ? (project as any).contact_role : '') || t('notSpecified')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Show loading states for sidebar */}
            {loading && (
              <div className="relative z-0">
                <LoadingSection title={t("projectHierarchy")} />
                <LoadingSection title={t('projectInfo')} />
              </div>
            )}

            {/* Project Hierarchy (for CRM projects) */}
            {!loading && !error && project && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-sans font-bold text-gray-900 flex items-center">
                    <div className={`w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-3' : 'mr-3'}`}>
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    {t("projectHierarchy")}
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {hierarchyData ? (
                    <>
                      {/* Goal */}
                      {hierarchyData.goal.code && (
                    <div className="group relative overflow-hidden rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide mx-2">{t('goal')}</span>
                            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded">
                              {hierarchyData.goal.code}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 leading-relaxed font-medium">
                            {hierarchyData.goal.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pillar */}
                  {hierarchyData.pillar.code && (
                    <div className="group relative overflow-hidden rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                          <Landmark className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mx-2">{t('pillar')}</span>
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                              {hierarchyData.pillar.code}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                            {hierarchyData.pillar.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service */}
                  {hierarchyData.service.code && (
                    <div className="group relative overflow-hidden rounded-xl border border-violet-200/60 bg-gradient-to-r from-violet-50 to-violet-100/50 p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide mx-2">{t('service')}</span>
                            <span className="text-xs font-mono font-bold text-violet-800 bg-violet-200 px-2 py-0.5 rounded">
                              {hierarchyData.service.code}
                            </span>
                          </div>
                          <p className="text-xs text-violet-700 leading-relaxed font-medium">
                            {hierarchyData.service.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subservice */}
                  {hierarchyData.subservice.code && (
                    <div className="group relative overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                          <Pin className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold text-amber-600 mx-2 uppercase tracking-wide">{t('subService')}</span>
                            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                              {hierarchyData.subservice.code}
                            </span>
                          </div>
                          <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            {hierarchyData.subservice.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('projectHierarchy')}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {t('hierarchyNotAvailable') || 'Project hierarchy information is not available for this project.'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          
            
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;