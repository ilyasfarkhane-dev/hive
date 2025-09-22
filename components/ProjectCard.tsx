import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Globe, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useHierarchyCache } from '@/hooks/useHierarchyCache';
import { ProjectHierarchyBadges } from './ProjectHierarchyBadges';
import { CRMProject } from '@/hooks/useContactProjects';

interface ProjectCardProps {
  project: CRMProject;
  index: number;
  currentLanguage: string;
  onCardClick: (project: CRMProject) => void;
  onCardHover: (project: CRMProject) => void;
}

// Tooltip component (copied from projects page)
const Tooltip = ({ children, content, className = "" }: { children: React.ReactNode; content: string | any; className?: string }) => {
  const [isVisible, setIsVisible] = React.useState(false);

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

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({
  project,
  index,
  currentLanguage,
  onCardClick,
  onCardHover
}) => {
  const { t } = useTranslation();
  
  // Comprehensive subservice data validation with memoization
  const getSubserviceData = useMemo(() => {
    // Check all possible subservice fields
    const subserviceId = project.sub_service_id || null;
    const subserviceName = project.sub_service || project.subservice_name || project.subservice_code || null;
    
    // Validate subservice ID - be more lenient
    const hasValidId = Boolean(
      subserviceId && 
      typeof subserviceId === 'string' && 
      subserviceId.trim() !== '' && 
      subserviceId !== 'null' && 
      subserviceId !== 'undefined' &&
      subserviceId.length > 5 // Be more lenient with ID length
    );
    
    // Validate subservice name - be more lenient
    const hasValidName = Boolean(
      subserviceName && 
      typeof subserviceName === 'string' && 
      subserviceName.trim() !== '' && 
      subserviceName !== 'null' && 
      subserviceName !== 'undefined' &&
      subserviceName.length > 0 // Allow single character names
    );
    
    return {
      subserviceId: hasValidId ? subserviceId : null,
      subserviceName: hasValidName ? subserviceName : null,
      hasSubservice: hasValidId || hasValidName
    };
  }, [project.sub_service_id, project.sub_service, project.subservice_name, project.subservice_code]);
  
  const { subserviceId, subserviceName, hasSubservice } = getSubserviceData;
  
  
  
  // For hierarchy lookup, we need an ID, but we can still show that we have a subservice
  const hierarchySubserviceId = subserviceId; // Use the validated subserviceId
  const { hierarchy, loading: hierarchyLoading, error: hierarchyError } = useHierarchyCache(hierarchySubserviceId);

  const getStatusColor = (project: CRMProject) => {
    const status = project.status?.toLowerCase();
    if (status === 'published' || status === 'active') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (status === 'draft' || status === 'pending') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (project: CRMProject) => {
    const status = project.status?.toLowerCase();
    if (status === 'published' || status === 'active') {
      return t('published') || 'Published';
    } else if (status === 'draft' || status === 'pending') {
      return t('drafted') || 'Drafted';
    } else {
      return project.status || t('unknown') || 'Unknown';
    }
  };

  const getTranslatedFrequency = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      'Onetime': t('onetime') || 'One-time',
      'Annual': t('annual') || 'Annual',
      'Biannual': t('biannual') || 'Biannual',
      'Quarterly': t('quarterly') || 'Quarterly',
      'Monthly': t('monthly') || 'Monthly',
      'Weekly': t('weekly') || 'Weekly',
      'Daily': t('daily') || 'Daily'
    };
    return frequencyMap[frequency] || frequency;
  };

  const getTranslatedDeliveryModality = (modality: string) => {
    const modalityMap: { [key: string]: string } = {
      'Online': t('online') || 'Online',
      'Offline': t('offline') || 'Offline',
      'Hybrid': t('hybrid') || 'Hybrid',
      'In-Person': t('inPerson') || 'In-Person'
    };
    return modalityMap[modality] || modality;
  };

  const getTranslatedGeographicScope = (scope: string) => {
    const scopeMap: { [key: string]: string } = {
      'Local': t('local') || 'Local',
      'National': t('national') || 'National',
      'Regional': t('regional') || 'Regional',
      'International': t('international') || 'International',
      'Global': t('global') || 'Global'
    };
    return scopeMap[scope] || scope;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('noDate') || 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US');
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="group relative cursor-pointer"
      onClick={() => onCardClick(project)}
      onMouseEnter={() => onCardHover(project)}
    >
      {/* Main Card */}
      <div 
        className="relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group-hover:border-teal-200 group-hover:-translate-y-2"
      >
        
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
                <Clock className="w-4 h-4 text-gray-500 mr-3" />
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

          {/* Hierarchy Badges */}
          <ProjectHierarchyBadges 
            hierarchy={hierarchy}
            loading={hierarchyLoading}
            error={hierarchyError}
            hasSubserviceId={hasSubservice}
          />

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
  );
});

ProjectCard.displayName = 'ProjectCard';
