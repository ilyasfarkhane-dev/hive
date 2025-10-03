'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, FileText, Landmark, Settings, Pin, Clock, Tag, Target, BarChart3, User, MessageSquare, AlertCircle, FileX, Download } from 'lucide-react';
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
import { useProjectSubmission } from '@/hooks/useProjectSubmission';

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
  session_id?: string;
};

const ProjectDetailsPage = () => {
  const { t, i18n } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const currentLanguage = i18n.language || 'en';

  const [project, setProject] = useState<AnyProject | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<AnyProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [showOtherBeneficiaryInput, setShowOtherBeneficiaryInput] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draftMessage, setDraftMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Retry state management
  const [retryCount, setRetryCount] = useState(0);
  const [draftRetryCount, setDraftRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays in ms

  // Use project submission hook for draft functionality
  const { saveAsDraft } = useProjectSubmission();

  // Helper function to delay execution
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Function to handle file download
  const handleDownload = (file: any) => {
    try {
      // Extract filename from file path or use file name
      let fileName = file.name || file.fileName || 'document';
      let filePath = file.filePath || '';
      
      // Clean up the file path - remove \public\ prefix if present
      if (filePath.startsWith('\\public\\')) {
        filePath = filePath.replace('\\public\\', '/');
      } else if (filePath.startsWith('/public/')) {
        filePath = filePath.replace('/public/', '/');
      }
      
      // If no filePath, try to construct it
      if (!filePath) {
        filePath = `/uploads/${fileName}`;
      }
      
      console.log('📥 Downloading file:', fileName, 'from path:', filePath);
      
      // Create download link
      const link = document.createElement('a');
      link.href = filePath;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

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
          const apiCall = fetch(`/api/crm/projects?project_id=${projectId}`, {
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
        
        console.log('🔍 Individual project fetch response:', {
          success: data.success,
          projectId: projectId,
          projectsCount: data.projects?.length || 0,
          projectIds: data.projects?.map((p: any) => p.id) || []
        });
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch projects from CRM');
        }
        
        const crmProject = data.projects?.find((p: AnyProject) => p.id === projectId);

        if (crmProject) {
          console.log('✅ Found project in CRM:', crmProject.name);
            
            
            
            
            
            
            
            
            
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
    if (!modality) return modality;
    
    // Normalize to handle case-insensitive matching
    const normalizedModality = modality.charAt(0).toUpperCase() + modality.slice(1).toLowerCase();
    
    const modalityMap: Record<string, string> = {
      'Physical': t('modalityPhysical'),
      'Virtual': t('modalityVirtual'),
      'Hybrid': t('hybrid'),
      'Online': t('online'),
      'Offline': t('offline'),
      'In-person': t('inPerson'),
    };
    
    return modalityMap[normalizedModality] || modality;
  };

  // Helper function to translate geographic scope values
  const translateScope = (scope: string) => {
    if (!scope) return scope;
    
    // Normalize to handle case-insensitive matching
    const normalizedScope = scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();
    
    const scopeMap: Record<string, string> = {
      'Local': t('local'),
      'National': t('scopeNational'),
      'Regional': t('scopeRegional'),
      'International': t('scopeInternational'),
      'Global': t('global'),
    };
    
    return scopeMap[normalizedScope] || scope;
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

  // Handle edit project - enable inline editing
  const handleEditProject = () => {
    if (!project) {
      console.error('❌ Cannot edit project: project is null or undefined');
      return;
    }
    
    setIsEditing(true);
    setEditedProject({ ...project });
    
    // Check if "Other" beneficiary is selected to show the input
    const hasOtherBeneficiary = project.beneficiaries?.includes(t('beneficiaryOther')) || false;
    setShowOtherBeneficiaryInput(hasOtherBeneficiary);
    
    console.log('✅ Enabled inline editing for project:', project.id);
  };

  // Retry function for save changes - runs automatically in background
  const retrySaveChanges = async (updateData: any, currentAttempt: number = 1): Promise<{ success: boolean; error?: string }> => {
    if (currentAttempt > MAX_RETRIES) {
      return {
        success: false,
        error: `Failed to save changes after ${MAX_RETRIES} attempts. Please check your connection and try again later.`
      };
    }

    // Only log to console, don't show to user
    console.log(`🔄 Retrying save changes (attempt ${currentAttempt}/${MAX_RETRIES})...`);
    
    // Wait for exponential backoff delay
    const delayMs = RETRY_DELAYS[Math.min(currentAttempt - 1, RETRY_DELAYS.length - 1)];
    await delay(delayMs);

    try {
      // Call the update API
      const response = await fetch('/api/update-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      console.log('📥 CRM update response:', result);
      
      if (result.success) {
        setRetryCount(0); // Reset retry count on success
        return { success: true };
      } else if (currentAttempt < MAX_RETRIES) {
        // If still failing and we have retries left, continue retrying automatically
        console.log(`🔄 Save changes failed, retrying... (${currentAttempt}/${MAX_RETRIES})`);
        return await retrySaveChanges(updateData, currentAttempt + 1);
      } else {
        // Max retries reached
        console.log(`❌ Max retries reached for save changes (${MAX_RETRIES} attempts)`);
        return {
          success: false,
          error: result.error || 'Failed to save changes after multiple attempts'
        };
      }
    } catch (error) {
      if (currentAttempt < MAX_RETRIES) {
        // If network error and we have retries left, continue retrying automatically
        return await retrySaveChanges(updateData, currentAttempt + 1);
      } else {
        // Max retries reached
        return {
          success: false,
          error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!editedProject) return;
    
    // Check if session_id is available
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
    if (!sessionId) {
      setSaveMessage({
        type: 'error',
        message: 'Session expired. Please refresh the page and try again.'
      });
      return;
    }
    
    setIsSaving(true);
    setRetryCount(0); // Reset retry count for new save attempt
    
    try {
      console.log('💾 Saving project changes to CRM:', editedProject);
      console.log('📋 Original project data:', project);
      console.log('🎯 Strategic data from project:', {
        strategic_goal: project?.strategic_goal,
        strategic_goal_id: project?.strategic_goal_id,
        pillar: project?.pillar,
        pillar_id: project?.pillar_id,
        service: project?.service,
        service_id: project?.service_id,
        sub_service: project?.sub_service,
        sub_service_id: project?.sub_service_id
      });

      // Handle file uploads and document management
      let uploadedFilePaths: string[] = [];
      let documentNames: string[] = [];
      
      console.log('📁 Processing documents for project update...');
      console.log('📁 editedProject.files:', editedProject.files);
      console.log('📁 Files count:', editedProject.files?.length || 0);
      
      if (editedProject.files && editedProject.files.length > 0) {
        console.log('📁 Files detected in edited project, processing...');
        
        // Upload new files (filter out existing files that don't need re-upload)
        const newFiles = editedProject.files.filter((file: any) => file instanceof File);
        const existingFiles = editedProject.files.filter((file: any) => !(file instanceof File));
        
        console.log('📁 New files to upload:', newFiles.length);
        console.log('📁 Existing files:', existingFiles.length);
        
        // Upload new files
        for (const file of newFiles) {
          try {
            const formData = new FormData();
            formData.append('files', file);
            
            // Get user email from localStorage
            let userEmail = 'unknown';
            try {
              const contactInfo = localStorage.getItem('contactInfo');
              if (contactInfo) {
                const contact = JSON.parse(contactInfo);
                userEmail = contact.email || 'unknown';
              }
            } catch (e) {
              console.error('Error getting user email:', e);
            }
            
            formData.append('userEmail', userEmail);
            
            const response = await fetch('/api/upload-documents', {
              method: 'POST',
              body: formData,
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.files && result.files.length > 0) {
                uploadedFilePaths.push(result.files[0].filePath);
                documentNames.push(file.name);
                console.log('✅ File uploaded:', file.name, '->', result.files[0].filePath);
              }
            } else {
              console.error('❌ File upload failed:', file.name);
            }
          } catch (error) {
            console.error('❌ Error uploading file:', file.name, error);
          }
        }
        
        // Add existing file paths
        for (const file of existingFiles) {
          if (file.filePath || file.fileName) {
            // If it's an existing file, use its current path or generate one
            const filePath = file.filePath || `\\public\\uploads\\${file.fileName || file.name}`;
            uploadedFilePaths.push(filePath);
            documentNames.push(file.name || file.fileName);
          }
        }
        
        console.log('📁 Final file paths:', uploadedFilePaths);
        console.log('📁 Final document names:', documentNames);
      } else {
        console.log('📁 No files in edited project - clearing document fields');
        console.log('📁 This means all documents were removed');
      }
      
      // Prepare the data for CRM update
      const updateData = {
        id: editedProject.id,
        name: editedProject.name,
        description: editedProject.description || editedProject.brief || '',
        project_brief: editedProject.brief || editedProject.description || '',
        problem_statement: editedProject.rationale || '',
        rationale_impact: editedProject.rationale || '',
        
        // Strategic selections (preserve existing values if not changed)
        strategic_goal: editedProject.strategic_goal || project?.strategic_goal || 'Strategic Goal',
        strategic_goal_id: editedProject.strategic_goal_id || project?.strategic_goal_id || '',
        pillar: editedProject.pillar || project?.pillar || 'Pillar',
        pillar_id: editedProject.pillar_id || project?.pillar_id || '',
        service: editedProject.service || project?.service || 'Service',
        service_id: editedProject.service_id || project?.service_id || '',
        sub_service: editedProject.sub_service || project?.sub_service || 'Subservice',
        sub_service_id: editedProject.sub_service_id || project?.sub_service_id || '',
        
        // Beneficiaries
        beneficiaries: editedProject.beneficiaries || [],
        other_beneficiaries: editedProject.other_beneficiary || '',
        
        // Budget and timeline
        budget_icesco: parseFloat(editedProject.budget?.icesco || '0') || 0,
        budget_member_state: parseFloat(editedProject.budget?.member_state || '0') || 0,
        budget_sponsorship: parseFloat(editedProject.budget?.sponsorship || '0') || 0,
        start_date: editedProject.start_date || '',
        end_date: editedProject.end_date || '',
        frequency: editedProject.project_frequency || editedProject.frequency || '',
        frequency_duration: editedProject.frequency_duration || '',
        
        // Partners and scope
        partners: editedProject.partners || [],
        institutions: editedProject.partners || [], // Same as partners for CRM
        delivery_modality: editedProject.delivery_modality || '',
        geographic_scope: editedProject.geographic_scope || '',
        convening_method: editedProject.convening_method || '',
        project_type: editedProject.convening_method || '',
        project_type_other: editedProject.convening_method_other || '',
        
        // Monitoring and evaluation
        milestones: editedProject.milestones || [],
        expected_outputs: editedProject.expected_outputs || '',
        kpis: editedProject.kpis || [],
        
        // Contact information
        contact_name: editedProject.contact?.name || '',
        contact_email: editedProject.contact?.email || '',
        contact_phone: editedProject.contact?.phone || '',
        contact_role: editedProject.contact?.role || '',
        contact_id: editedProject.contact_id || project?.contact_id || '',
        
        // Account information
        account_id: editedProject.account_id || project?.account_id || '',
        account_name: editedProject.account_name || project?.account_name || '',
        
        // Additional info
        comments: editedProject.comments || '',
        
        // Document fields - always include to properly update/clear CRM fields
        document_c: uploadedFilePaths.join('; '),
        documents_icesc_project_suggestions_1_name: documentNames.join('; '),
        
        // Metadata
        session_id: typeof window !== 'undefined' ? localStorage.getItem('session_id') || '' : '',
        language: currentLanguage,
        submission_date: new Date().toISOString(),
        status: 'Published' // Mark as published when saving from details page
      };
      
      console.log('📤 Sending update data to CRM:', updateData);
      console.log('🔑 Session ID in update data:', updateData.session_id ? 'Present' : 'Missing');
      
      // Try initial save
      try {
        const response = await fetch('/api/update-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        const result = await response.json();
        console.log('📥 CRM update response:', result);
        
        if (result.success) {
          // Update local state with the saved changes
          setProject(editedProject);
          setIsEditing(false);
          setEditedProject(null);
          
          // Show success message
          setSaveMessage({ type: 'success', message: 'Project updated successfully' });
          console.log('✅ Project updated successfully in CRM');
          
          // Clear success message after 3 seconds
          setTimeout(() => setSaveMessage(null), 3000);
        } else {
          // If initial save failed, try retry logic
          console.log('🔄 Initial save failed, attempting automatic retry...');
          const retryResult = await retrySaveChanges(updateData);
          
          if (retryResult.success) {
            // Update local state with the saved changes
            setProject(editedProject);
            setIsEditing(false);
            setEditedProject(null);
            
            // Show success message
            setSaveMessage({ type: 'success', message: 'Project updated successfully' });
            console.log('✅ Project updated successfully after retry');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSaveMessage(null), 3000);
          } else {
            console.error('❌ Failed to update project after retries:', retryResult.error);
            setSaveMessage({ type: 'error', message: `Failed to save changes: ${retryResult.error}` });
          }
        }
      } catch (error) {
        // If initial save failed with network error, try retry logic
        console.log('🔄 Network error occurred, attempting automatic retry...');
        const retryResult = await retrySaveChanges(updateData);
        
        if (retryResult.success) {
          // Update local state with the saved changes
          setProject(editedProject);
          setIsEditing(false);
          setEditedProject(null);
          
          // Show success message
          setSaveMessage({ type: 'success', message: 'Project updated successfully' });
          console.log('✅ Project updated successfully after retry');
          
          // Clear success message after 3 seconds
          setTimeout(() => setSaveMessage(null), 3000);
        } else {
          console.error('❌ Failed to update project after retries:', retryResult.error);
          setSaveMessage({ type: 'error', message: `Failed to save changes: ${retryResult.error}` });
        }
      }
      
    } catch (error) {
      console.error('❌ Error saving project:', error);
      setSaveMessage({ type: 'error', message: `Error saving changes: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Retry function for save as draft - runs automatically in background
  const retrySaveAsDraft = async (draftData: any, currentAttempt: number = 1): Promise<{ success: boolean; error?: string }> => {
    if (currentAttempt > MAX_RETRIES) {
      console.log(`❌ Max retries reached for draft save (${MAX_RETRIES} attempts)`);
      return {
        success: false,
        error: `Failed to save as draft after ${MAX_RETRIES} attempts. Please check your connection and try again later.`
      };
    }

    // Only log to console, don't show to user
    console.log(`🔄 Retrying save as draft (attempt ${currentAttempt}/${MAX_RETRIES})...`);
    console.log(`📋 Draft data session_id: ${draftData.session_id ? 'Present' : 'Missing'}`);
    
    // Wait for exponential backoff delay
    const delayMs = RETRY_DELAYS[Math.min(currentAttempt - 1, RETRY_DELAYS.length - 1)];
    console.log(`⏳ Waiting ${delayMs}ms before retry...`);
    await delay(delayMs);

    try {
      // Call the update API for draft save (not create API)
      const response = await fetch('/api/update-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });
      
      const result = await response.json();
      console.log('📥 CRM draft update response:', result);
      
      if (result.success) {
        setDraftRetryCount(0); // Reset retry count on success
        return { success: true };
      } else if (currentAttempt < MAX_RETRIES) {
        // If still failing and we have retries left, continue retrying automatically
        console.log(`🔄 Draft save failed, retrying... (${currentAttempt}/${MAX_RETRIES})`);
        return await retrySaveAsDraft(draftData, currentAttempt + 1);
      } else {
        // Max retries reached
        console.log(`❌ Max retries reached for draft save (${MAX_RETRIES} attempts)`);
        return {
          success: false,
          error: result.error || 'Failed to save as draft after multiple attempts'
        };
      }
    } catch (error) {
      if (currentAttempt < MAX_RETRIES) {
        // If network error and we have retries left, continue retrying automatically
        return await retrySaveAsDraft(draftData, currentAttempt + 1);
      } else {
        // Max retries reached
        return {
          success: false,
          error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!editedProject) return;
    
    // Check if session_id is available
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
    if (!sessionId) {
      setDraftMessage({
        type: 'error',
        message: 'Session expired. Please refresh the page and try again.'
      });
      return;
    }
    
    setDraftRetryCount(0); // Reset retry count for new draft save attempt
    setIsDraftSaving(true); // Set loading state to show spinner
    
    try {
      console.log('💾 Saving project as draft:', editedProject);
      
      // Handle file uploads and document management (same logic as handleSaveChanges)
      let uploadedFilePaths: string[] = [];
      let documentNames: string[] = [];
      
      console.log('📁 Processing documents for draft save...');
      console.log('📁 editedProject.files:', editedProject.files);
      console.log('📁 Files count:', editedProject.files?.length || 0);
      
      if (editedProject.files && editedProject.files.length > 0) {
        console.log('📁 Files detected in edited project, processing...');
        
        // Upload new files (filter out existing files that don't need re-upload)
        const newFiles = editedProject.files.filter((file: any) => file instanceof File);
        const existingFiles = editedProject.files.filter((file: any) => !(file instanceof File));
        
        console.log('📁 New files to upload:', newFiles.length);
        console.log('📁 Existing files:', existingFiles.length);
        
        // Upload new files
        for (const file of newFiles) {
          try {
            const formData = new FormData();
            formData.append('files', file);
            
            // Get user email from localStorage
            let userEmail = 'unknown';
            try {
              const contactInfo = localStorage.getItem('contactInfo');
              if (contactInfo) {
                const contact = JSON.parse(contactInfo);
                userEmail = contact.email || 'unknown';
              }
            } catch (e) {
              console.error('Error getting user email:', e);
            }
            
            formData.append('userEmail', userEmail);
            
            const response = await fetch('/api/upload-documents', {
              method: 'POST',
              body: formData,
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.files && result.files.length > 0) {
                uploadedFilePaths.push(result.files[0].filePath);
                documentNames.push(file.name);
                console.log('✅ File uploaded for draft:', file.name, '->', result.files[0].filePath);
              }
            } else {
              console.error('❌ File upload failed for draft:', file.name);
            }
          } catch (error) {
            console.error('❌ Error uploading file for draft:', file.name, error);
          }
        }
        
        // Add existing file paths
        for (const file of existingFiles) {
          if (file.filePath || file.fileName) {
            // If it's an existing file, use its current path or generate one
            const filePath = file.filePath || `\\public\\uploads\\${file.fileName || file.name}`;
            uploadedFilePaths.push(filePath);
            documentNames.push(file.name || file.fileName);
          }
        }
        
        console.log('📁 Final file paths for draft:', uploadedFilePaths);
        console.log('📁 Final document names for draft:', documentNames);
      } else {
        console.log('📁 No files in edited project - clearing document fields for draft');
        console.log('📁 This means all documents were removed');
      }
      
      // Prepare the data for draft update (same as save changes but with Draft status)
      const draftData = {
        id: editedProject.id,
        name: editedProject.name,
        description: editedProject.description || editedProject.brief || '',
        project_brief: editedProject.brief || editedProject.description || '',
        problem_statement: editedProject.rationale || '',
        rationale_impact: editedProject.rationale || '',
        
        // Strategic selections (preserve existing values if not changed)
        strategic_goal: editedProject.strategic_goal || project?.strategic_goal || 'Strategic Goal',
        strategic_goal_id: editedProject.strategic_goal_id || project?.strategic_goal_id || '',
        pillar: editedProject.pillar || project?.pillar || 'Pillar',
        pillar_id: editedProject.pillar_id || project?.pillar_id || '',
        service: editedProject.service || project?.service || 'Service',
        service_id: editedProject.service_id || project?.service_id || '',
        sub_service: editedProject.sub_service || project?.sub_service || 'Subservice',
        sub_service_id: editedProject.sub_service_id || project?.sub_service_id || '',
        
        // Beneficiaries
        beneficiaries: editedProject.beneficiaries || [],
        other_beneficiaries: editedProject.other_beneficiary || '',
        
        // Budget and timeline
        budget_icesco: parseFloat(editedProject.budget?.icesco || '0') || 0,
        budget_member_state: parseFloat(editedProject.budget?.member_state || '0') || 0,
        budget_sponsorship: parseFloat(editedProject.budget?.sponsorship || '0') || 0,
        start_date: editedProject.start_date || '',
        end_date: editedProject.end_date || '',
        frequency: editedProject.project_frequency || editedProject.frequency || '',
        frequency_duration: editedProject.frequency_duration || '',
        
        // Partners and scope
        partners: editedProject.partners || [],
        institutions: editedProject.partners || [], // Same as partners for CRM
        delivery_modality: editedProject.delivery_modality || '',
        geographic_scope: editedProject.geographic_scope || '',
        convening_method: editedProject.convening_method || '',
        project_type: editedProject.convening_method || '',
        project_type_other: editedProject.convening_method_other || '',
        
        // Monitoring and evaluation
        milestones: editedProject.milestones || [],
        expected_outputs: editedProject.expected_outputs || '',
        kpis: editedProject.kpis || [],
        
        // Contact information
        contact_name: editedProject.contact?.name || '',
        contact_email: editedProject.contact?.email || '',
        contact_phone: editedProject.contact?.phone || '',
        contact_role: editedProject.contact?.role || '',
        contact_id: editedProject.contact_id || project?.contact_id || '',
        
        // Account information
        account_id: editedProject.account_id || project?.account_id || '',
        account_name: editedProject.account_name || project?.account_name || '',
        
        // Additional info
        comments: editedProject.comments || '',
        
        // Document fields - always include to properly update/clear CRM fields
        document_c: uploadedFilePaths.join('; '),
        documents_icesc_project_suggestions_1_name: documentNames.join('; '),
        
        // Metadata
        session_id: typeof window !== 'undefined' ? localStorage.getItem('session_id') || '' : '',
        language: currentLanguage,
        submission_date: new Date().toISOString(),
        status: 'Draft' // Mark as draft
      };
      
      console.log('📤 Sending draft update data to CRM:', draftData);
      console.log('🔑 Session ID in draft data:', draftData.session_id ? 'Present' : 'Missing');
      
      // Try initial draft update using the update API (not create API)
      try {
        const response = await fetch('/api/update-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(draftData),
        });
        
        const result = await response.json();
        console.log('📥 CRM draft update response:', result);
        
        if (result.success) {
          // Update local state with the saved changes
          setProject(editedProject);
          setIsEditing(false);
          setEditedProject(null);
          
          // Show success message
          setDraftMessage({ type: 'success', message: 'Project saved as draft successfully' });
          console.log('✅ Project saved as draft successfully');
          
          // Clear success message after 3 seconds
          setTimeout(() => setDraftMessage(null), 3000);
        } else {
          // If initial draft save failed, try retry logic
          console.log('🔄 Initial draft save failed, attempting automatic retry...');
          const retryResult = await retrySaveAsDraft(draftData);
          
          if (retryResult.success) {
            // Update local state with the saved changes
            setProject(editedProject);
            setIsEditing(false);
            setEditedProject(null);
            
            // Show success message
            setDraftMessage({ type: 'success', message: 'Project saved as draft successfully' });
            console.log('✅ Project saved as draft successfully after retry');
            
            // Clear success message after 3 seconds
            setTimeout(() => setDraftMessage(null), 3000);
          } else {
            console.error('❌ Failed to save project as draft after retries:', retryResult.error);
            setDraftMessage({ type: 'error', message: `Failed to save as draft: ${retryResult.error}` });
          }
        }
      } catch (error) {
        // If initial draft save failed with network error, try retry logic
        console.log('🔄 Network error occurred during draft save, attempting automatic retry...');
        const retryResult = await retrySaveAsDraft(draftData);
        
        if (retryResult.success) {
          // Update local state with the saved changes
          setProject(editedProject);
          setIsEditing(false);
          setEditedProject(null);
          
          // Show success message
          setDraftMessage({ type: 'success', message: 'Project saved as draft successfully' });
          console.log('✅ Project saved as draft successfully after retry');
          
          // Clear success message after 3 seconds
          setTimeout(() => setDraftMessage(null), 3000);
        } else {
          console.error('❌ Failed to save project as draft after retries:', retryResult.error);
          setDraftMessage({ type: 'error', message: `Failed to save as draft: ${retryResult.error}` });
        }
      }
      
    } catch (error) {
      console.error('❌ Error saving project as draft:', error);
      setDraftMessage({ type: 'error', message: `Error saving as draft: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsDraftSaving(false); // Always reset loading state
    }
  };

  // Handle cancel editing
  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedProject(null);
    console.log('❌ Cancelled editing');
  };

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    if (!editedProject) return;
    
    setEditedProject(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  // Handle beneficiary changes
  const handleBeneficiaryChange = (beneficiaryValue: string, isChecked: boolean) => {
    if (!editedProject) return;
    
    const currentBeneficiaries = editedProject.beneficiaries || [];
    
    if (isChecked) {
      // Add beneficiary
      setEditedProject(prev => ({
        ...prev!,
        beneficiaries: [...currentBeneficiaries, beneficiaryValue]
      }));
      
      // Show other input if "Other" is selected
      if (beneficiaryValue === t('beneficiaryOther')) {
        setShowOtherBeneficiaryInput(true);
      }
    } else {
      // Remove beneficiary
      setEditedProject(prev => ({
        ...prev!,
        beneficiaries: currentBeneficiaries.filter(b => b !== beneficiaryValue),
        other_beneficiary: beneficiaryValue === t('beneficiaryOther') ? '' : prev?.other_beneficiary
      }));
      
      // Hide other input if "Other" is deselected
      if (beneficiaryValue === t('beneficiaryOther')) {
        setShowOtherBeneficiaryInput(false);
      }
    }
  };

  // Handle other beneficiary input change
  const handleOtherBeneficiaryChange = (value: string) => {
    if (!editedProject) return;
    
    setEditedProject(prev => ({
      ...prev!,
      other_beneficiary: value
    }));
  };

  // Handle edit project - navigate to project submission form with pre-filled data (old function)
  const handleEditProjectOld = () => {
    
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
        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className={`w-5 h-5 mr-3 ${
                saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {saveMessage.type === 'success' ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="font-medium">{saveMessage.message}</span>
            </div>
          </div>
        )}

        {/* Draft Message */}
        {draftMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            draftMessage.type === 'success' 
              ? 'bg-blue-50 border-blue-200 text-blue-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className={`w-5 h-5 mr-3 ${
                draftMessage.type === 'success' ? 'text-blue-500' : 'text-red-500'
              }`}>
                {draftMessage.type === 'success' ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="font-medium">{draftMessage.message}</span>
            </div>
          </div>
        )}

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
                  
                  {/* Edit/Save/Cancel Buttons */}
                  {!isEditing ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleEditProject}
                        className="group inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Settings className="w-4 h-4 mx-2 group-hover:rotate-90 transition-transform duration-200" />
                        {t('editProject') || 'Edit Project'}
                      </button>
                      
                      {/* Project Status */}
                      {project && (() => {
                        console.log('🔍 DEBUG - Project status:', (project as any).status);
                        console.log('🔍 DEBUG - Full project object:', project);
                        return null;
                      })()}
                      {project && (
                        <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${
                          (project as any).status === 'Draft' || (project as any).status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          (project as any).status === 'Published' || (project as any).status === 'published' || (project as any).status === 'Active' || (project as any).status === 'active' ? 'bg-green-100 text-green-800' :
                          (project as any).status === 'Submitted' || (project as any).status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(project as any).status || 'Unknown'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded transition-colors duration-150 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-3 h-3 mx-1.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          'Save as Published'
                        )}
                      </button>
                      <button
                        onClick={handleSaveAsDraft}
                        disabled={isDraftSaving}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 bg-yellow-200 hover:bg-yellow-100 disabled:bg-slate-50 rounded transition-colors duration-150 disabled:cursor-not-allowed"
                      >
                        {isDraftSaving ? (
                          <>
                            <div className="w-3 h-3 mx-1.5 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          'Save as Draft'
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('titreprojet')} <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProject?.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg font-medium"
                        placeholder="Project name"
                      />
                    ) : (
                      <p className="text-lg font-medium text-gray-900">{project.name}</p>
                    )}
                  </div>
                
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('brief')} <span className="text-red-500">*</span></label>
                  {isEditing ? (
                    <textarea
                      value={editedProject?.description || editedProject?.brief || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700 leading-relaxed text-lg min-h-[100px]"
                      placeholder="Project description"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {project.description || project.brief || t('noDescription')}
                    </p>
                  )}
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
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('problemStatementPlaceholder')} <span className="text-red-500">*</span></label>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    {isEditing ? (
                      <textarea
                        value={editedProject?.rationale || ('problem_statement' in (editedProject || {}) ? (editedProject as any).problem_statement : '') || ''}
                        onChange={(e) => handleFieldChange('rationale', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700 leading-relaxed min-h-[120px] bg-white"
                        placeholder="Problem statement"
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">
                        {project.rationale || ('problem_statement' in project ? (project as any).problem_statement : '') || t('problemStatement')}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Beneficiaries Section */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('beneficiaries')}</label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                              editedProject?.beneficiaries?.includes(benef.value)
                                ? 'border-teal-500 bg-teal-50 shadow-sm'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 accent-teal-500 w-4 h-4"
                              value={benef.value}
                              checked={editedProject?.beneficiaries?.includes(benef.value) || false}
                              onChange={(e) => handleBeneficiaryChange(benef.value, e.target.checked)}
                            />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 text-sm">{benef.label}</span>
                              <p className="text-gray-500 text-xs mt-1 leading-relaxed">{benef.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Show input only when "Other" is selected */}
                      {showOtherBeneficiaryInput && (
                        <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
                          <label className="block text-sm font-medium text-teal-800 mb-2">
                            {t('otherBeneficiaryPlaceholder')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                            placeholder={t('otherBeneficiaryPlaceholder')}
                            value={editedProject?.other_beneficiary || ''}
                            onChange={(e) => handleOtherBeneficiaryChange(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )}
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
                        <span className="text-sm font-medium text-gray-600">{t('startDate')} <span className="text-red-500">*</span></span>
                        {isEditing ? (
                          <input
                            type="date"
                            required
                            value={editedProject?.start_date || ''}
                            onChange={(e) => handleFieldChange('start_date', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{formatDate(project.start_date)}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">{t('endDate')} <span className="text-red-500">*</span></span>
                        {isEditing ? (
                          <input
                            type="date"
                            required
                            value={editedProject?.end_date || ''}
                            onChange={(e) => handleFieldChange('end_date', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{formatDate(project.end_date)}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">{t('frequency')} <span className="text-red-500">*</span></span>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editedProject?.project_frequency || editedProject?.frequency || ''}
                              onChange={(e) => handleFieldChange('project_frequency', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">{t('frequencySelect')}</option>
                              <option value="One-time">{t('frequencyOneTime')}</option>
                              <option value="Continuous">{t('frequencyContinuous')}</option>
                            </select>
                            {editedProject?.project_frequency === "Continuous" && (
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-700">
                                  {t('frequencyDurationPlaceholder')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder={t('frequencyDurationPlaceholder')}
                                  value={editedProject?.frequency_duration || ''}
                                  onChange={(e) => handleFieldChange('frequency_duration', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
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
                        )}
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
                        <span className="text-sm font-medium text-blue-700">{t('budgetLabel_icesco')} <span className="text-red-500">*</span></span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedProject?.budget?.icesco || ('budget_icesco' in (editedProject || {}) ? (editedProject as any).budget_icesco : '') || '0'}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (editedProject?.budget) {
                                handleFieldChange('budget', { ...editedProject.budget, icesco: value });
                              } else {
                                handleFieldChange('budget_icesco', value);
                              }
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-lg font-bold text-blue-900 text-right"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(project.budget?.icesco || ('budget_icesco' in project ? (project as any).budget_icesco : '') || '0')}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl border border-green-200">
                        <span className="text-sm font-medium text-green-700">{t('memberState')} <span className="text-red-500">*</span></span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedProject?.budget?.member_state || ('budget_member_state' in (editedProject || {}) ? (editedProject as any).budget_member_state : '') || '0'}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (editedProject?.budget) {
                                handleFieldChange('budget', { ...editedProject.budget, member_state: value });
                              } else {
                                handleFieldChange('budget_member_state', value);
                              }
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-lg font-bold text-green-900 text-right"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-lg font-bold text-green-900">
                            {formatCurrency(project.budget?.member_state || ('budget_member_state' in project ? (project as any).budget_member_state : '') || '0')}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 bg-purple-50 rounded-xl border border-purple-200">
                        <span className="text-sm font-medium text-purple-700">{t('sponsorship')} <span className="text-red-500">*</span></span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedProject?.budget?.sponsorship || ('budget_sponsorship' in (editedProject || {}) ? (editedProject as any).budget_sponsorship : '') || '0'}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (editedProject?.budget) {
                                handleFieldChange('budget', { ...editedProject.budget, sponsorship: value });
                              } else {
                                handleFieldChange('budget_sponsorship', value);
                              }
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-lg font-bold text-purple-900 text-right"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-lg font-bold text-purple-900">
                            {formatCurrency(project.budget?.sponsorship || ('budget_sponsorship' in project ? (project as any).budget_sponsorship : '') || '0')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>


              {/* Partners */}
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
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('partners')}</label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {editedProject?.partners?.map((partner, index) => (
                          <span key={index} className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {partner}
                            <button
                              type="button"
                              onClick={() => {
                                if (!editedProject) return;
                                const newPartners = editedProject.partners?.filter((_, i) => i !== index) || [];
                                setEditedProject(prev => ({ ...prev!, partners: newPartners }));
                              }}
                              className="w-4 h-4 flex items-center justify-center text-green-600 hover:text-green-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('addPartnerPlaceholder')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && editedProject && (!editedProject.partners || !editedProject.partners.includes(value))) {
                                setEditedProject(prev => ({
                                  ...prev!,
                                  partners: [...(prev?.partners || []), value]
                                }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}
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
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('deliveryModality')} <span className="text-red-500">*</span></label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {[
                            { value: "Physical", label: t('modalityPhysical') },
                            { value: "Virtual", label: t('modalityVirtual') },
                            { value: "Hybrid", label: t('modalityHybrid') }
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                editedProject?.delivery_modality === option.value
                                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryModality"
                                value={option.value}
                                className="accent-teal-500 w-4 h-4"
                                checked={editedProject?.delivery_modality === option.value}
                                onChange={(e) => handleFieldChange('delivery_modality', e.target.value)}
                              />
                              <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 font-medium">{project.delivery_modality ? translateModality(project.delivery_modality) : t('notSpecified')}</p>
                      </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('geographicScope')} <span className="text-red-500">*</span></label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {[
                            { value: "National", label: t('scopeNational') },
                            { value: "Regional", label: t('scopeRegional') },
                            { value: "International", label: t('scopeInternational') }
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                editedProject?.geographic_scope === option.value
                                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="geographicScope"
                                value={option.value}
                                className="accent-teal-500 w-4 h-4"
                                checked={editedProject?.geographic_scope === option.value}
                                onChange={(e) => handleFieldChange('geographic_scope', e.target.value)}
                              />
                              <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 font-medium">{project.geographic_scope ? translateScope(project.geographic_scope) : t('notSpecified')}</p>
                      </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('conveningMethod')} <span className="text-red-500">*</span></label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            value={editedProject?.convening_method || ('project_type' in (editedProject || {}) ? (editedProject as any).project_type : '') || ''}
                            onChange={(e) => handleFieldChange('convening_method', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                          >
                            <option value="">{t('projectTypeSelect')}</option>
                            <option value="Training">{t('typeTraining')}</option>
                            <option value="Workshop">{t('typeWorkshop')}</option>
                            <option value="Conference">{t('typeConference')}</option>
                            <option value="Campaign">{t('typeCampaign')}</option>
                            <option value="Research">{t('typeResearch')}</option>
                            <option value="Other">{t('other')}</option>
                          </select>
                          {(editedProject?.convening_method === "Other" || ('project_type' in (editedProject || {}) ? (editedProject as any).project_type === "Other" : false)) && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('projectTypeOtherPlaceholder')} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder={t('projectTypeOtherPlaceholder')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                                value={editedProject?.convening_method_other || ('project_type_other' in (editedProject || {}) ? (editedProject as any).project_type_other : '') || ''}
                                onChange={(e) => handleFieldChange('convening_method_other', e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-900 font-medium">
                          {(() => {
                            const method = project.convening_method || ('project_type' in project ? (project as any).project_type : '');
                            return method ? translateConveningMethod(method) : t('notSpecified');
                          })()} 
                          {project.convening_method_other && ` (${project.convening_method_other})`}
                        </p>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

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
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('name')} <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProject?.contact?.name || ('contact_name' in (editedProject || {}) ? (editedProject as any).contact_name : '') || ''}
                        onChange={(e) => {
                          if (editedProject?.contact) {
                            handleFieldChange('contact', { ...editedProject.contact, name: e.target.value });
                          } else {
                            handleFieldChange('contact_name', e.target.value);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                        placeholder={t('contactFullNamePlaceholder')}
                      />
                    ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.name || ('contact_name' in project ? (project as any).contact_name : '') || t('notSpecified')}</p>
                    </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('email')} <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedProject?.contact?.email || ('contact_email' in (editedProject || {}) ? (editedProject as any).contact_email : '') || ''}
                        onChange={(e) => {
                          if (editedProject?.contact) {
                            handleFieldChange('contact', { ...editedProject.contact, email: e.target.value });
                          } else {
                            handleFieldChange('contact_email', e.target.value);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                        placeholder={t('contactEmailPlaceholder')}
                      />
                    ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.email || ('contact_email' in project ? (project as any).contact_email : '') || t('notSpecified')}</p>
                    </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('phone')} <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedProject?.contact?.phone || ('contact_phone' in (editedProject || {}) ? (editedProject as any).contact_phone : '') || ''}
                        onChange={(e) => {
                          if (editedProject?.contact) {
                            handleFieldChange('contact', { ...editedProject.contact, phone: e.target.value });
                          } else {
                            handleFieldChange('contact_phone', e.target.value);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                        placeholder={t('contactPhonePlaceholder')}
                      />
                    ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.phone || ('contact_phone' in project ? (project as any).contact_phone : '') || t('notSpecified')}</p>
                    </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('role')} <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProject?.contact?.role || ('contact_role' in (editedProject || {}) ? (editedProject as any).contact_role : '') || ''}
                        onChange={(e) => {
                          if (editedProject?.contact) {
                            handleFieldChange('contact', { ...editedProject.contact, role: e.target.value });
                          } else {
                            handleFieldChange('contact_role', e.target.value);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                        placeholder={t('contactRolePlaceholder')}
                      />
                    ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 font-medium">{project.contact?.role || ('contact_role' in project ? (project as any).contact_role : '') || t('notSpecified')}</p>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

          
            {/* Monitoring & Evaluation */}
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
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('milestones')}</label>
                  {isEditing ? (
                      <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {editedProject?.milestones?.map((milestone, index) => (
                          <span key={index} className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            {milestone}
                            <button
                              type="button"
                              onClick={() => {
                                if (!editedProject) return;
                                const newMilestones = editedProject.milestones?.filter((_, i) => i !== index) || [];
                                setEditedProject(prev => ({ ...prev!, milestones: newMilestones }));
                              }}
                              className="w-4 h-4 flex items-center justify-center text-yellow-600 hover:text-yellow-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('milestoneNamePlaceholder')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && editedProject && (!editedProject.milestones || !editedProject.milestones.includes(value))) {
                                setEditedProject(prev => ({
                                  ...prev!,
                                  milestones: [...(prev?.milestones || []), value]
                                }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {project.milestones && Array.isArray(project.milestones) && project.milestones.length > 0 ? (
                        project.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-900 font-medium">{milestone}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 italic text-sm">{t('notSpecified')}</span>
                      )}
                    </div>
                  )}
                </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('expectedOutputs')}</label>
                  {isEditing ? (
                    <textarea
                      value={editedProject?.expected_outputs || ''}
                      onChange={(e) => handleFieldChange('expected_outputs', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 min-h-[100px]"
                      placeholder={t('expectedOutputsDeliverablesPlaceholder')}
                    />
                  ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 leading-relaxed">{project.expected_outputs || t('notSpecified')}</p>
                    </div>
                  )}
                </div>

                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('kpis')}</label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {editedProject?.kpis?.map((kpi, index) => (
                          <span key={index} className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            {kpi}
                            <button
                              type="button"
                              onClick={() => {
                                if (!editedProject) return;
                                const newKpis = editedProject.kpis?.filter((_, i) => i !== index) || [];
                                setEditedProject(prev => ({ ...prev!, kpis: newKpis }));
                              }}
                              className="w-4 h-4 flex items-center justify-center text-yellow-600 hover:text-yellow-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('keyPerformanceIndicatorsPlaceholder')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && editedProject && (!editedProject.kpis || !editedProject.kpis.includes(value))) {
                                setEditedProject(prev => ({
                                  ...prev!,
                                  kpis: [...(prev?.kpis || []), value]
                                }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                    </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {project.kpis && Array.isArray(project.kpis) && project.kpis.length > 0 ? (
                        project.kpis.map((kpi, index) => (
                          <span key={index} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-medium border border-yellow-200">
                            {kpi}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic text-sm">{t('notSpecified')}</span>
                  )}
                </div>
            )}
                </div>
              </div>
            </motion.div>

            {/* Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  {t('comments')}
                </h2>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('comments')}</label>
                  {isEditing ? (
                    <textarea
                      value={editedProject?.comments || ''}
                      onChange={(e) => handleFieldChange('comments', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all duration-200 min-h-[120px]"
                      placeholder={t('commentsPlaceholder')}
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-900 leading-relaxed">{project.comments || t('notSpecified')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Supporting Documents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-sans font-bold text-gray-900 flex items-center">
                  <div className={`w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center ${currentLanguage === 'ar' ? 'ml-4' : 'mr-4'}`}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  {t('supportingDocuments')}
                </h2>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('supportingDocuments')}</label>
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Display current files */}
                      {editedProject?.files && editedProject.files.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">{t('currentDocuments')}:</p>
                          {editedProject.files.map((file: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleDownload(file)}
                                  className="w-5 h-5 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Download file"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{file.name || file.fileName || 'Unknown file'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editedProject) return;
                                  const newFiles = editedProject.files?.filter((_, i) => i !== index) || [];
                                  setEditedProject(prev => ({ ...prev!, files: newFiles }));
                                }}
                                className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* File upload for editing */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">{t('addNewDocuments')}</p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.xlsx,.pptx"
                          onChange={(e) => {
                            if (!editedProject) return;
                            const newFiles = Array.from(e.target.files || []);
                            const updatedFiles = [...(editedProject.files || []), ...newFiles];
                            setEditedProject(prev => ({ ...prev!, files: updatedFiles }));
                          }}
                          className="hidden"
                          id="file-upload-edit"
                        />
                        <label
                          htmlFor="file-upload-edit"
                          className="inline-block px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 cursor-pointer transition-colors text-sm"
                        >
                          {t('selectFiles')}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      {project.files && project.files.length > 0 ? (
                        <div className="space-y-2">
                          {project.files.map((file: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleDownload(file)}
                                className="w-5 h-5 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{file.name || file.fileName || 'Unknown file'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">{t('noDocuments')}</p>
                      )}
                    </div>
                  )}
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