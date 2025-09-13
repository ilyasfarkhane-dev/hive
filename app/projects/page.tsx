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
import ProjectsHeader from '@/components/ProjectsHeader';
import { useRouter } from 'next/navigation';
import { goals as goalsData } from '@/Data/goals/data';
import { pillarsByGoal, servicesByPillar, subServicesByService } from '@/Data/index';
import { useContactProjects, CRMProject } from '@/hooks/useContactProjects';
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
  const { projects: crmProjectsData, loading: crmLoading, error: crmError, refetch: refetchCrmProjects } = useContactProjects();

  // Update CRM projects when data changes
  useEffect(() => {
    console.log('=== PROJECTS PAGE CRM DATA UPDATE ===');
    console.log('CRM Projects Data:', crmProjectsData);
    console.log('CRM Loading:', crmLoading);
    console.log('CRM Error:', crmError);
    
    if (crmProjectsData) {
      console.log('Setting CRM projects:', crmProjectsData.length, 'projects');
      console.log('=== ACTUAL CRM PROJECTS DATA ===');
      console.log('First 3 projects:', crmProjectsData.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        created: p.created_at,
        source: 'CRM' // This should confirm it's from CRM
      })));
      setCrmProjects(crmProjectsData);
      setLoading(false);
    } else {
      console.log('No CRM projects data received');
    }
  }, [crmProjectsData, crmLoading, crmError]);

  // Set loading based on CRM loading state
  useEffect(() => {
    setLoading(crmLoading);
  }, [crmLoading]);

  // Filter and search projects - only CRM projects
  useEffect(() => {
    let filtered = [...crmProjects];

    console.log('=== FILTERING CRM PROJECTS ===');
    console.log('Input projects:', crmProjects.length);
    console.log('Status filter:', statusFilter);
    console.log('Search term:', searchTerm);
    console.log('Sample input project:', crmProjects[0] ? {
      id: crmProjects[0].id,
      name: crmProjects[0].name,
      status: crmProjects[0].status
    } : 'No projects');

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
        const projectStatus = project.status || 'published'; // Default to published if no status
        
        if (statusFilter === 'drafted') {
          return projectStatus === 'drafted' || projectStatus === 'draft';
        } else if (statusFilter === 'published') {
          return projectStatus === 'published' || projectStatus === 'active' || projectStatus === 'live';
        }
        return true;
      });
    }

    console.log('=== FILTERING RESULTS ===');
    console.log('Final filtered projects:', filtered.length);
    console.log('Sample filtered project:', filtered[0] ? {
      id: filtered[0].id,
      name: filtered[0].name,
      status: filtered[0].status,
      description: filtered[0].description?.substring(0, 50) + '...'
    } : 'No filtered projects');
    
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
    // Use replace for faster navigation
    router.replace(`/projects/${project.id}`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage === 'en-US' ? 'ar-SA' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US');
  };

  const getStatusColor = (project: AnyProject) => {
    // Status logic based on project status field
    const projectStatus = project.status || 'published';
    
    if (projectStatus === 'drafted' || projectStatus === 'draft') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800'; // Default to published
  };

  const getStatusText = (project: AnyProject) => {
    // Status text based on project status field
    const projectStatus = project.status || 'published';
    
    if (projectStatus === 'drafted' || projectStatus === 'draft') {
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
    switch (modality) {
      case 'Physical':
        return t('modalityPhysical');
      case 'Virtual':
        return t('modalityVirtual');
      case 'Hybrid':
        return t('modalityHybrid');
      default:
        return modality; // Return as-is if no translation found
    }
  };

  // Helper function to translate geographic scope values
  const getTranslatedGeographicScope = (scope: string) => {
    switch (scope) {
      case 'National':
        return t('scopeNational');
      case 'Regional':
        return t('scopeRegional');
      case 'International':
        return t('scopeInternational');
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
    <div className="min-h-screen bg-white-100" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <ProjectsHeader 
        breadcrumbs={[
          { label: t('projects') }
        ]}
      
      />
      
      {/* Main Content */}
      <div className="py-8">
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
            </div>
            </div>
          )}

          {/* Results Count and Refresh Button */}
          {!loading && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {t('showing')} {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} {t('of')} {filteredProjects.length} {t('projects')}
                <span className="ml-2 text-teal-600">
                  ({crmProjects.length})
                </span>
        </div>

              
            </div>
            )}
            
          

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : crmProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            
            <p className="text-gray-500 text-lg mb-6">
              {t('noCrmProjectsDescription')}
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
            >
              {t('submitNewProject')}
            </a>
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
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {currentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                  className="group relative cursor-pointer"
                  onClick={() => handleCardClick(project)}
                  onMouseEnter={() => handleCardHover(project)}
                >
                  {/* Main Card */}
                  <div className="relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group-hover:border-teal-200 group-hover:-translate-y-2">
                    
                    {/* Status Badge */}
                    <div className={`absolute top-4 ${currentLanguage === 'ar' ? 'left-4' : 'right-4'}`}>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(project)}`}>
                        <div className={`w-2 h-2 rounded-full ${currentLanguage === 'ar' ? 'ml-2' : 'mr-2'} ${getStatusColor(project).includes('green') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        {getStatusText(project)}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-8">
                      {/* Project Title */}
                      <div className="mb-6">
                        <h4 className="text-xl font-bold text-gray-600 line-clamp-2 mb-4 group-hover:text-teal-700 transition-colors duration-300">
                    {project.name}
                        </h4>
                      </div>

                      {/* Project Details */}
                      <div className="space-y-3 mb-6">
                        {project.frequency && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-gray-500 mr-3 " />
                            <span className="font-medium text-gray-700 mx-2">{t('frequency') || 'Frequency'}:</span>
                            <span className="ml-2 text-gray-600">{getTranslatedFrequency(project.frequency)}</span>
                          </div>
                        )}
                        
                        {project.delivery_modality && (
                        <div className="flex items-center text-sm text-gray-600">
                            <Globe className="w-4 h-4 text-gray-500 mr-3" />
                            <span className="font-medium text-gray-700 mx-2">{t('deliveryModality') || 'Delivery Modality'}:</span>
                            <span className="ml-2 text-gray-600">{getTranslatedDeliveryModality(project.delivery_modality)}</span>
                          </div>
                        )}
                        
                        {project.geographic_scope && (
                        <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-500 mr-3" />
                            <span className="font-medium text-gray-700 mx-2">{t('geographicScope') || 'Geographic Scope'}:</span>
                            <span className="ml-2 text-gray-600">{getTranslatedGeographicScope(project.geographic_scope)}</span>
                          </div>
                        )}
                        
                      
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.strategic_goal && (
                          <Tooltip content={getGoalTitle(project.strategic_goal)}>
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                              {t('goal')}: {getCode(project.strategic_goal)}
                          </span>
                          </Tooltip>
                        )}
                        {project.pillar && (
                          <Tooltip content={getPillarTitle(project.pillar)}>
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                              {t('pillar')}: {getCode(project.pillar)}
                          </span>
                          </Tooltip>
                        )}
                        {project.service && (
                          <Tooltip content={getServiceTitle(project.service)}>
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                              {t('service')}: {getCode(project.service)}
                            </span>
                          </Tooltip>
                        )}
                        {project.sub_service && (
                          <Tooltip content={getSubServiceTitle(project.sub_service)}>
                            <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                              {t('subService')}: {getCode(project.sub_service)}
                          </span>
                          </Tooltip>
                        )}
                        
                        {/* Show CRM relationship information with codes */}
                        {(() => {
                              // Debug: Log project subservice data
                              console.log(`=== PROJECT CARD DEBUG: ${project.id} ===`);
                              console.log('Project subservice_id:', project.subservice_id);
                              console.log('Project subservice_name:', project.subservice_name);
                              console.log('Full project data:', project);
                              
                              // Try to get subservice code using the comprehensive function
                              const subserviceCode = getSubServiceCodeFromProject(project);
                              console.log('Subservice code from function:', subserviceCode);
                              
                              if (!subserviceCode) {
                                // If no subservice code found, show a generic message
                                return (
                                  <Tooltip content={`No subservice relationship found. ID: ${project.subservice_id || 'none'}, Name: ${project.subservice_name || 'none'}`}>
                                    <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                                      No Subservice
                                    </span>
                                  </Tooltip>
                                );
                              }
                              
                              // Get the hierarchy codes from the subservice code
                              const goalCode = getGoalCodeFromSubserviceId(subserviceCode);
                              const pillarCode = getPillarCodeFromSubserviceId(subserviceCode);
                              const serviceCode = getServiceCodeFromSubserviceId(subserviceCode);
                              
                              // Get the titles for tooltips with current language
                              const goalTitle = goalCode ? getGoalTitleFromCode(goalCode, currentLanguage as 'en' | 'fr' | 'ar') : null;
                              const pillarTitle = pillarCode ? getPillarTitleFromCode(pillarCode, currentLanguage as 'en' | 'fr' | 'ar') : null;
                              const serviceTitle = serviceCode ? getServiceTitleFromCode(serviceCode, currentLanguage as 'en' | 'fr' | 'ar') : null;
                              const subserviceTitle = getSubServiceTitleFromCode(subserviceCode, currentLanguage as 'en' | 'fr' | 'ar');
                              
                              return (
                                <>
                                  {/* Goal Code */}
                                  {goalCode && (
                                    <Tooltip content={goalTitle || `Goal ${goalCode}`}>
                                      <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                                        {t('goal')} : {goalCode}
                                      </span>
                                    </Tooltip>
                                  )}
                                  
                                  {/* Pillar Code */}
                                  {pillarCode && (
                                    <Tooltip content={pillarTitle || `Pillar ${pillarCode}`}>
                                      <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                                        {t('pillar')} : {pillarCode}
                                      </span>
                                    </Tooltip>
                                  )}
                                  
                                  {/* Service Code */}
                                  {serviceCode && (
                                    <Tooltip content={serviceTitle || `Service ${serviceCode}`}>
                                      <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                                        {t('service')} : {serviceCode}
                                      </span>
                                    </Tooltip>
                                  )}
                                  
                                  {/* Subservice Code */}
                                  <Tooltip content={subserviceTitle || project.subservice_name || `Subservice ${subserviceCode}`}>
                                    <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
                                      {t('subService')} : {subserviceCode}
                                    </span>
                                  </Tooltip>
                                </>
                              );
                        })()}
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mx-2" />
                          {t('created')} : {formatDate(project.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                </motion.div>
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