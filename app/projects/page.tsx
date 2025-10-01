"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  Trash2, 
  Eye,
  Edit,
  Users,
  Target,
  Building,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
// Removed local storage imports - only using CRM projects
import ProjectsPageHeader from '@/components/ProjectsPageHeader';
import { useRouter } from 'next/navigation';
import { goals as goalsData } from '@/Data/goals/data';
import { pillarsByGoal, servicesByPillar, subServicesByService } from '@/Data/index';
import { useContactProjects, CRMProject } from '@/hooks/useContactProjects';
import { useProjectHierarchy } from '@/hooks/useProjectHierarchy';
import { ProjectHierarchyBadges } from '@/components/ProjectHierarchyBadges';
import { ProjectCard } from '@/components/ProjectCard';
import { 
  getGoalCodeFromSubserviceId, 
  getPillarCodeFromSubserviceId, 
  getServiceCodeFromSubserviceId, 
  getSubServiceCodeFromId,
  getSubServiceCodeFromName,
  getSubServiceCodeFromProject,
  getGoalTitleFromCode,
  getPillarTitleFromCode,
  getServiceTitleFromCode,
  getSubServiceTitleFromCode
} from '@/utils/codeMapping';

// Only using CRM projects now
type AnyProject = CRMProject;

// Tooltip component
const Tooltip = ({ children, content, className = "" }: { children: React.ReactNode; content: string | any; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-40 max-w-xl whitespace-normal break-words leading-relaxed">
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          {content}
        </div>
      )}
    </div>
  );
};

const ProjectsPage = () => {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const [crmProjects, setCrmProjects] = useState<CRMProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AnyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<AnyProject | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'drafted' | 'published'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const currentLanguage = i18n.language || 'en';
  
  // Fetch CRM projects
  const { projects: crmProjectsData, loading: crmLoading, error: crmError, errorType: crmErrorType, refetch: refetchCrmProjects } = useContactProjects();

  // Update CRM projects when data changes
  useEffect(() => {
    if (crmProjectsData) {
      setCrmProjects(crmProjectsData);
      setLoading(false);
    }
  }, [crmProjectsData, crmLoading, crmError]);

  // Set loading based on CRM loading state
  useEffect(() => {
    setLoading(crmLoading);
  }, [crmLoading]);

  // Filter and search projects - only CRM projects
  useEffect(() => {
    let filtered = [...crmProjects];


    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.brief?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter based on project status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => {
        // Check if project has a status field, otherwise use a default logic
        const projectStatus = project.status || 'Draft'; // Default to Draft if no status
        
        if (statusFilter === 'drafted') {
          return projectStatus === 'Draft';
        } else if (statusFilter === 'published') {
          return projectStatus === 'Published';
        }
        return true;
      });
    }

    
    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [crmProjects, searchTerm, statusFilter]);

  // CRM projects are read-only, no delete functionality
  const handleDeleteProject = (projectId: string) => {
    // CRM projects cannot be deleted from the frontend
    alert(t('crmProjectsReadOnly') || 'CRM projects are read-only and cannot be deleted from this interface.');
  };

  const handleViewProject = (project: AnyProject) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleCardClick = (project: AnyProject) => {
    console.log('Card clicked:', project);
    console.log('Project ID:', project.id);
    console.log('Project ID type:', typeof project.id);
    
    if (!project.id) {
      console.error('Project ID is missing!');
      return;
    }
    
    const projectUrl = `/projects/${project.id}`;
    console.log('Navigating to:', projectUrl);
    
    // Use push for navigation
    router.push(projectUrl);
  };

  const handleCardHover = (project: AnyProject) => {
    // Prefetch the route on hover for faster navigation
    router.prefetch(`/projects/${project.id}`);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchCrmProjects(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage === 'en-US' ? 'ar-SA' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US');
  };

  const getStatusColor = (project: AnyProject) => {
    // Status logic based on project status field
    const projectStatus = project.status || 'Draft';
    
    if (projectStatus === 'Draft') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800'; // Default to published
  };

  const getStatusText = (project: AnyProject) => {
    // Status text based on project status field
    const projectStatus = project.status || 'Draft';
    
    if (projectStatus === 'Draft') {
      return t('drafted');
    }
    return t('published'); // Default to published
  };

  // Helper function to get code from title or return the value as is
  const getCode = (value: string | any) => {
    if (typeof value === 'string') {
      // If it's already a code (like "1.1", "2.3"), return it
      if (/^\d+\.\d+$/.test(value)) {
        return value;
      }
      // If it's a title, try to extract code or return as is
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      // If it's a multilingual object, return the first available value
      const currentLang = currentLanguage as 'en' | 'fr' | 'ar';
      const titleValue = value[currentLang] || value.en || value;
      return titleValue;
    }
    return value || '';
  };

  // Helper function to get title from value (for tooltips)
  const getTitle = (value: string | any) => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      const currentLang = currentLanguage as 'en' | 'fr' | 'ar';
      return value[currentLang] || value.en || value;
    }
    return value || '';
  };

  // Helper functions to get titles from codes
  const getGoalTitle = (code: string | any) => {
    const codeStr = typeof code === 'string' ? code : '';
    const goal = goalsData.find(g => g.code === codeStr);
    if (goal) {
      const currentLang = currentLanguage as 'en' | 'fr' | 'ar';
      return goal.title[currentLang] || goal.title.en || goal.title;
    }
    return codeStr;
  };

  const getPillarTitle = (code: string) => {
    // Find the goal first, then find the pillar
    for (const goalCode in pillarsByGoal) {
      const pillars = pillarsByGoal[goalCode];
      const pillar = pillars.find(p => p.id === code);
      if (pillar) {
        return pillar.title;
      }
    }
    return code;
  };

  const getServiceTitle = (code: string) => {
    // Find the pillar first, then find the service
    for (const pillarCode in servicesByPillar) {
      const services = servicesByPillar[pillarCode];
      const service = services.find(s => s.id === code);
      if (service) {
        return service.title;
      }
    }
    return code;
  };

  const getSubServiceTitle = (code: string) => {
    // Find the service first, then find the sub-service
    for (const serviceCode in subServicesByService) {
      const subServices = subServicesByService[serviceCode];
      const subService = subServices.find(s => s.id === code);
      if (subService) {
        return subService.title;
      }
    }
    return code;
  };

  // Helper function to translate frequency values
  const getTranslatedFrequency = (frequency: string) => {
    switch (frequency) {
      case 'Onetime':
        return t('frequencyOneTime');
      case 'Continuous':
        return t('frequencyContinuous');
      default:
        return frequency; // Return as-is if no translation found
    }
  };

  // Helper function to translate delivery modality values
  const getTranslatedDeliveryModality = (modality: string) => {
    if (!modality) return modality;
    
    // Normalize to handle case-insensitive matching
    const normalizedModality = modality.charAt(0).toUpperCase() + modality.slice(1).toLowerCase();
    
    switch (normalizedModality) {
      case 'Physical':
        return t('modalityPhysical');
      case 'Virtual':
        return t('modalityVirtual');
      case 'Hybrid':
        return t('hybrid');
      case 'Online':
        return t('online');
      case 'Offline':
        return t('offline');
      case 'In-person':
        return t('inPerson');
      default:
        return modality; // Return as-is if no translation found
    }
  };

  // Helper function to translate geographic scope values
  const getTranslatedGeographicScope = (scope: string) => {
    if (!scope) return scope;
    
    // Normalize to handle case-insensitive matching
    const normalizedScope = scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();
    
    switch (normalizedScope) {
      case 'Local':
        return t('local');
      case 'National':
        return t('scopeNational');
      case 'Regional':
        return t('scopeRegional');
      case 'International':
        return t('scopeInternational');
      case 'Global':
        return t('global');
      default:
        return scope; // Return as-is if no translation found
    }
  };

  // Loading component for project cards
  const LoadingCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // Loading component for filters
  const LoadingFilters = () => (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Integrated Header with Content */}
      <ProjectsPageHeader 
        breadcrumbs={[
          { label: t('projects') }
        ]}
      />
      
      {/* Main Content */}
      <div className="py-8 bg-white relative z-20 projects-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search and Filter Controls */}
          {loading ? (
            <LoadingFilters />
          ) : (
        <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('searchProjects')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Filter Buttons and Create Project Button */}
              <div className="flex gap-2 items-center">
                {/* Filter Buttons - CRM Project Status */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      statusFilter === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('allProjects')}
                  </button>
                 
                  <button
                    onClick={() => setStatusFilter('drafted')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      statusFilter === 'drafted'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('drafted')}
                  </button>
                 
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      statusFilter === 'published'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('published')}
                  </button>
                </div>

                {/* Debug and Action Buttons */}
                <div className="flex gap-3">
                 
                  
                  {/* Create New Project Button */}
                  <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('createNewProject') || 'Create New Project'}
                  </button>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Results Count and Refresh Button */}
          {!loading && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {crmError && crmErrorType === 'CONNECTION_ERROR' ? (
                  <div className="flex items-center">
                    <span className="text-red-600">
                      {t('crmConnectionError') || 'Unable to connect to CRM server'}
                    </span>
                    {crmProjects.length > 0 && (
                      <span className="ml-2 text-amber-600 text-xs">
                        ({t('usingCachedData') || 'Using cached data'})
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    {t('showing')} {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} {t('of')} {filteredProjects.length} {t('projects')}
                    <span className="ml-2 text-teal-600">
                      ({crmProjects.length})
                    </span>
                  </>
                )}
              </div>
              
              {crmError && crmErrorType === 'CONNECTION_ERROR' && (
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('retry') || 'Retry'}
                </button>
              )}
            </div>
          )}
            
          

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : crmError && crmErrorType === 'CONNECTION_ERROR' ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('crmServerUnavailable') || 'CRM Server Unavailable'}
            </h3>
            <p className="text-gray-500 text-lg mb-6">
              {t('crmServerUnavailableDescription') || 'The CRM server is currently unavailable. Please try again later or contact support if the issue persists.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
             
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('createNewProject') || 'Create New Project'}
              </button>
            </div>
          </div>
        ) : crmProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            
            <p className="text-gray-500 text-lg mb-6">
              {t('noCrmProjectsDescription')}
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('createNewProject') || 'Create New Project'}
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noProjectsFound')}</h3>
            <p className="text-gray-500 mb-6">
              {t('tryAdjustingFilters')}
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('createNewProject') || 'Create New Project'}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {currentProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    currentLanguage={currentLanguage}
                    onCardClick={handleCardClick}
                    onCardHover={handleCardHover}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center">
                <nav className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('previous')}
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('next')}
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Project Details Modal */}
        {showModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                </div>
                
              <div className="p-6 space-y-6">
                {/* Project Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('projectOverview')}</h3>
                  <p className="text-gray-600">
                    {selectedProject.description || selectedProject.brief || ''}
                  </p>
                </div>

                {/* Contact Information */}
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('contactInformation')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{selectedProject.contact_name || ''}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{selectedProject.contact_email || ''}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{selectedProject.contact_phone || ''}</span>
                    </div>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{selectedProject.contact_role || ''}</span>
                    </div>
                  </div>
                  </div>

                {/* Budget */}
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('budget')}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium">{t('budgetLabel_icesco')}</div>
                      <div className="text-xl font-bold text-blue-900">{selectedProject.budget_icesco} USD</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600 font-medium">{t('memberState')}</div>
                      <div className="text-xl font-bold text-green-900">{selectedProject.budget_member_state} USD</div>
                  </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-600 font-medium">{t('sponsorship')}</div>
                      <div className="text-xl font-bold text-purple-900">{selectedProject.budget_sponsorship} USD</div>
                  </div>
                    </div>
                </div>
                
                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('timeline')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">{t('startDate')}</div>
                      <div className="font-medium">{selectedProject.start_date ? formatDate(selectedProject.start_date) : t('notSet')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">{t('endDate')}</div>
                      <div className="font-medium">{selectedProject.end_date ? formatDate(selectedProject.end_date) : t('notSet')}</div>
                  </div>
                </div>
                </div>

                {/* Supporting Documents */}
                {selectedProject.supporting_documents && selectedProject.supporting_documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('supportingDocuments')}</h3>
                    <div className="space-y-2">
                      {selectedProject.supporting_documents.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-600">{doc}</span>
              </div>
            ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;