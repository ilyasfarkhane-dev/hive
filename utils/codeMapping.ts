import { goals } from '@/Data/goals/data';
import { pillarsByGoal, servicesByPillar, subServicesByService } from '@/Data/index';
import { pillarServicesData } from '@/Data/services/data';
import { serviceSubservicesData } from '@/Data/sub-service/data';
import { pillarsData } from '@/Data/pillars/data';

// Helper function to get goal code from goal ID
export const getGoalCodeFromId = (goalId: string): string => {
  const goal = goals.find(g => g.id === goalId);
  return goal ? goal.code : goalId;
};

// Helper function to get pillar code from pillar ID
export const getPillarCodeFromId = (pillarId: string): string => {
  for (const goalCode in pillarsByGoal) {
    const pillars = pillarsByGoal[goalCode];
    const pillar = pillars.find(p => p.id === pillarId);
    if (pillar) {
      return pillar.id; // The ID is already the code (e.g., "1.1", "2.3")
    }
  }
  return pillarId;
};

// Helper function to get service code from service ID
export const getServiceCodeFromId = (serviceId: string): string => {
  for (const pillarCode in servicesByPillar) {
    const services = servicesByPillar[pillarCode];
    const service = services.find(s => s.id === serviceId);
    if (service) {
      return service.id; // The ID is already the code (e.g., "1.1.1", "2.3.1")
    }
  }
  return serviceId;
};

// Helper function to get subservice code from subservice ID
export const getSubServiceCodeFromId = (subserviceId: string): string | null => {
  // If subserviceId is empty, return null
  if (!subserviceId || subserviceId.trim() === '') {
    return null;
  }
  
  // Search in the actual data structure
  for (const serviceId in serviceSubservicesData) {
    const subServices = (serviceSubservicesData as any)[serviceId];
    const subService = subServices.find((s: any) => s.id === subserviceId);
    if (subService) {
      return subService.name; // Return the code (e.g., "1.1.1.1", "2.3.1.1")
    }
  }
  return null;
};

// Helper function to get subservice code from subservice name (fallback)
export const getSubServiceCodeFromName = (subserviceName: string): string | null => {
  if (!subserviceName || subserviceName.trim() === '') {
    return null;
  }
  
  for (const serviceCode in subServicesByService) {
    const subServices = subServicesByService[serviceCode];
    const subService = subServices.find(s => 
      s.title.toLowerCase().includes(subserviceName.toLowerCase()) ||
      subserviceName.toLowerCase().includes(s.title.toLowerCase())
    );
    if (subService) {
      return subService.id;
    }
  }
  return null;
};

// Helper function to get subservice code from project data (handles both ID and name)
export const getSubServiceCodeFromProject = (project: any): string | null => {
  // First try to get from subservice_id
  if (project.subservice_id && project.subservice_id.trim() !== '') {
    const codeFromId = getSubServiceCodeFromId(project.subservice_id);
    if (codeFromId) return codeFromId;
  }
  
  // Then try to get from subservice_name
  if (project.subservice_name && project.subservice_name.trim() !== '') {
    const codeFromName = getSubServiceCodeFromName(project.subservice_name);
    if (codeFromName) return codeFromName;
  }
  
  // Manual mapping is no longer needed since we're getting subservice data directly from CRM relationships
  
  return null;
};

// Helper function to get goal code from subservice code (by traversing up the hierarchy)
export const getGoalCodeFromSubserviceId = (subserviceCode: string): string | null => {
  // Find which service this subservice belongs to by looking for the subservice code
  for (const serviceId in serviceSubservicesData) {
    const subServices = (serviceSubservicesData as any)[serviceId];
    const subService = subServices.find((s: any) => s.name === subserviceCode);
    if (subService) {
      // Find which pillar this service belongs to
      for (const pillarId in pillarServicesData) {
        const services = (pillarServicesData as any)[pillarId];
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          // Find which goal this pillar belongs to
          for (const goalId in pillarsData) {
            const pillars = (pillarsData as any)[goalId];
            const pillar = pillars.find((p: any) => p.id === pillarId);
            if (pillar) {
              // Get the goal code from the goal ID
              const goal = goals.find(g => g.id === goalId);
              return goal ? goal.code : goalId;
            }
          }
        }
      }
    }
  }
  return null;
};

// Helper function to get pillar code from subservice code
export const getPillarCodeFromSubserviceId = (subserviceCode: string): string | null => {
  // Find which service this subservice belongs to by looking for the subservice code
  for (const serviceId in serviceSubservicesData) {
    const subServices = (serviceSubservicesData as any)[serviceId];
    const subService = subServices.find((s: any) => s.name === subserviceCode);
    if (subService) {
      // Find which pillar this service belongs to
      for (const pillarId in pillarServicesData) {
        const services = (pillarServicesData as any)[pillarId];
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          // Find the pillar code
          for (const goalId in pillarsData) {
            const pillars = (pillarsData as any)[goalId];
            const pillar = pillars.find((p: any) => p.id === pillarId);
            if (pillar) {
              return pillar.code; // Return the pillar code (e.g., "1.1", "2.3")
            }
          }
        }
      }
    }
  }
  return null;
};

// Helper function to get service code from subservice code
export const getServiceCodeFromSubserviceId = (subserviceCode: string): string | null => {
  // Find which service this subservice belongs to by looking for the subservice code
  for (const serviceId in serviceSubservicesData) {
    const subServices = (serviceSubservicesData as any)[serviceId];
    const subService = subServices.find((s: any) => s.name === subserviceCode);
    if (subService) {
      // Find the service code
      for (const pillarId in pillarServicesData) {
        const services = (pillarServicesData as any)[pillarId];
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          return service.code; // Return the service code (e.g., "1.1.1", "2.3.1")
        }
      }
    }
  }
  return null;
};

// Helper function to get goal title from goal code
export const getGoalTitleFromCode = (goalCode: string, language: 'en' | 'fr' | 'ar' = 'en'): string | null => {
  const goal = goals.find(g => g.code === goalCode);
  return goal ? goal.title[language] : null;
};

// Helper function to get pillar title from pillar code
export const getPillarTitleFromCode = (pillarCode: string, language: 'en' | 'fr' | 'ar' = 'en'): string | null => {
  for (const goalId in pillarsData) {
    const pillars = (pillarsData as any)[goalId];
    const pillar = pillars.find((p: any) => p.code === pillarCode);
    if (pillar) {
      return pillar.title[language];
    }
  }
  return null;
};

// Helper function to get service title from service code
export const getServiceTitleFromCode = (serviceCode: string, language: 'en' | 'fr' | 'ar' = 'en'): string | null => {
  for (const pillarId in pillarServicesData) {
    const services = (pillarServicesData as any)[pillarId];
    const service = services.find((s: any) => s.code === serviceCode);
    if (service) {
      switch (language) {
        case 'ar':
          return service.name_service_ar_c || service.description;
        case 'fr':
          return service.name_service_fr_c || service.description;
        case 'en':
        default:
          return service.description;
      }
    }
  }
  return null;
};

// Helper function to get subservice title from subservice code
export const getSubServiceTitleFromCode = (subserviceCode: string, language: 'en' | 'fr' | 'ar' = 'en'): string | null => {
  for (const serviceId in serviceSubservicesData) {
    const subServices = (serviceSubservicesData as any)[serviceId];
    const subService = subServices.find((s: any) => s.name === subserviceCode);
    if (subService) {
      switch (language) {
        case 'ar':
          return subService.name_ar_c || subService.description;
        case 'fr':
          return subService.name_fr_c || subService.description;
        case 'en':
        default:
          return subService.description;
      }
    }
  }
  return null;
};
