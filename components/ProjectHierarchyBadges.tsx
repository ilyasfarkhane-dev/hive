import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectHierarchy } from '@/hooks/useProjectHierarchy';
import { useStableState } from '@/hooks/useStableState';

// Tooltip component (copied from projects page)
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

interface ProjectHierarchyBadgesProps {
  hierarchy: ProjectHierarchy | null;
  loading?: boolean;
  error?: string | null;
  hasSubserviceId?: boolean;
}

export const ProjectHierarchyBadges: React.FC<ProjectHierarchyBadgesProps> = ({
  hierarchy,
  loading = false,
  error = null,
  hasSubserviceId = true
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Add a small delay to prevent rapid state changes
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 50); // Small delay to prevent rapid state changes
    
    return () => clearTimeout(timer);
  }, [hierarchy, loading, error, hasSubserviceId]);

  if (!showContent) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="px-3 py-1.5 bg-gray-200 text-gray-500 text-xs rounded-full font-medium animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="px-3 py-1.5 bg-gray-200 text-gray-500 text-xs rounded-full font-medium animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <Tooltip content={error}>
          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
            {t('error') || 'Error'}
          </span>
        </Tooltip>
      </div>
    );
  }

  if (!hasSubserviceId) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <Tooltip content="This project has no subservice assigned">
          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
            {t('noSubservice') || 'No Subservice'}
          </span>
        </Tooltip>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <Tooltip content="Subservice assigned but hierarchy data not available. This may be due to API limitations or missing data in the system.">
          <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help">
            {t('subService') || 'Subservice'}: {t('assigned') || 'Assigned'}
          </span>
        </Tooltip>
      </div>
    );
  }

  const getLocalizedTitle = (item: any, field: string) => {
    if (currentLanguage === 'ar' && item[`${field}_ar_c`]) {
      return item[`${field}_ar_c`];
    } else if (currentLanguage === 'fr' && item[`${field}_fr_c`]) {
      return item[`${field}_fr_c`];
    } else if (item[field]) {
      return item[field];
    }
    return item.name || item.code || 'N/A';
  };

  const getLocalizedDescription = (item: any, field: string) => {
    if (currentLanguage === 'ar' && item[`${field}_ar_c`]) {
      return item[`${field}_ar_c`];
    } else if (currentLanguage === 'fr' && item[`${field}_fr_c`]) {
      return item[`${field}_fr_c`];
    } else if (item[field]) {
      return item[field];
    }
    return item.description || 'N/A';
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Goal Badge */}
      <Tooltip 
        content={
          <div className="max-w-xs">
            <div className="font-semibold text-sm mb-1">
              {hierarchy.goal.title[currentLanguage as keyof typeof hierarchy.goal.title] || hierarchy.goal.title.en}
            </div>
            <div className="text-xs text-gray-300">
              {hierarchy.goal.desc[currentLanguage as keyof typeof hierarchy.goal.desc] || hierarchy.goal.desc.en}
            </div>
          </div>
        }
      >
        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help hover:shadow-md transition-shadow">
          {t('goal') || 'Goal'}: {hierarchy.goal.code}
        </span>
      </Tooltip>

      {/* Pillar Badge */}
      <Tooltip 
        content={
          <div className="max-w-xs">
            <div className="font-semibold text-sm mb-1">
              {hierarchy.pillar.title[currentLanguage as keyof typeof hierarchy.pillar.title] || hierarchy.pillar.title.en}
            </div>
            <div className="text-xs text-gray-300">
              Code: {hierarchy.pillar.code}
            </div>
          </div>
        }
      >
        <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help hover:shadow-md transition-shadow">
          {t('pillar') || 'Pillar'}: {hierarchy.pillar.code}
        </span>
      </Tooltip>

      {/* Service Badge */}
      <Tooltip 
        content={
          <div className="max-w-xs">
            <div className="font-semibold text-sm mb-1">
              {getLocalizedTitle(hierarchy.service, 'name_service')}
            </div>
            <div className="text-xs text-gray-300 mb-2">
              {getLocalizedDescription(hierarchy.service, 'description_service')}
            </div>
            <div className="text-xs text-gray-400">
              Code: {hierarchy.service.code}
            </div>
          </div>
        }
      >
        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help hover:shadow-md transition-shadow">
          {t('service') || 'Service'}: {hierarchy.service.code}
        </span>
      </Tooltip>

      {/* Subservice Badge */}
      <Tooltip 
        content={
          <div className="max-w-xs">
            <div className="font-semibold text-sm mb-1">
              {getLocalizedTitle(hierarchy.subservice, 'name')}
            </div>
            <div className="text-xs text-gray-300 mb-2">
              {getLocalizedDescription(hierarchy.subservice, 'description_subservice')}
            </div>
            <div className="text-xs text-gray-400">
              Code: {hierarchy.subservice.name}
            </div>
          </div>
        }
      >
        <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full font-medium shadow-sm cursor-help hover:shadow-md transition-shadow">
          {t('subService') || 'Subservice'}: {hierarchy.subservice.name}
        </span>
      </Tooltip>
    </div>
  );
};
