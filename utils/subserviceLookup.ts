import { serviceSubservicesData } from '@/Data/sub-service/data';
import { pillarServicesData } from '@/Data/services/data';
import { pillarsData } from '@/Data/pillars/data';
import { goals } from '@/Data/goals/data';

export interface SubserviceHierarchy {
  subservice: {
    id: string;
    name: string;
    name_ar_c: string;
    name_fr_c: string;
    description: string;
    description_subservice: string;
    description_subservice_ar_c: string;
    description_subservice_fr_c: string;
  };
  service: {
    id: string;
    code: string;
    name_service_ar_c: string;
    name_service_fr_c: string;
    description: string;
    description_service: string;
    description_service_fr_c: string;
    description_service_ar_c: string;
  };
  pillar: {
    id: string;
    code: string;
    title: {
      en: string;
      fr: string;
      ar: string;
    };
  };
  goal: {
    id: string;
    code: string;
    title: {
      en: string;
      fr: string;
      ar: string;
    };
    desc: {
      en: string;
      fr: string;
      ar: string;
    };
  };
}

export function findSubserviceHierarchy(subserviceId: string): SubserviceHierarchy | null {
  try {
    // Step 1: Find the subservice in serviceSubservicesData
    let subservice = null;
    let serviceId = null;
    
    for (const [serviceIdKey, subservices] of Object.entries(serviceSubservicesData)) {
      const foundSubservice = subservices.find(sub => sub.id === subserviceId);
      if (foundSubservice) {
        subservice = foundSubservice;
        serviceId = serviceIdKey;
        break;
      }
    }
    
    if (!subservice || !serviceId) {
      console.log(`Subservice with ID ${subserviceId} not found`);
      return null;
    }
    
    // Step 2: Find the service in pillarServicesData
    let service = null;
    let pillarId = null;
    
    for (const [pillarIdKey, services] of Object.entries(pillarServicesData)) {
      const foundService = services.find(svc => svc.id === serviceId);
      if (foundService) {
        service = foundService;
        pillarId = pillarIdKey;
        break;
      }
    }
    
    if (!service || !pillarId) {
      console.log(`Service with ID ${serviceId} not found`);
      return null;
    }
    
    // Step 3: Find the pillar in pillarsData
    let pillar = null;
    let goalId = null;
    
    for (const [goalIdKey, pillars] of Object.entries(pillarsData)) {
      const foundPillar = pillars.find(p => p.id === pillarId);
      if (foundPillar) {
        pillar = foundPillar;
        goalId = goalIdKey;
        break;
      }
    }
    
    if (!pillar || !goalId) {
      console.log(`Pillar with ID ${pillarId} not found`);
      return null;
    }
    
    // Step 4: Find the goal in goals
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) {
      console.log(`Goal with ID ${goalId} not found`);
      return null;
    }
    
    return {
      subservice,
      service,
      pillar,
      goal
    };
    
  } catch (error) {
    console.error('Error finding subservice hierarchy:', error);
    return null;
  }
}

export function findSubserviceHierarchyByProjectId(projectId: string): Promise<SubserviceHierarchy | null> {
  return new Promise(async (resolve) => {
    try {
      // First, get the subservice ID from the project
      const response = await fetch(`http://localhost:3000/api/crm/projects`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to fetch projects:', result.error);
        resolve(null);
        return;
      }
      
      const project = result.projects.find((p: any) => p.id === projectId);
      if (!project) {
        console.log(`Project with ID ${projectId} not found`);
        resolve(null);
        return;
      }
      
      if (!project.sub_service_id) {
        console.log(`Project ${projectId} has no subservice assigned`);
        resolve(null);
        return;
      }
      
      // Now find the hierarchy using the subservice ID
      const hierarchy = findSubserviceHierarchy(project.sub_service_id);
      resolve(hierarchy);
      
    } catch (error) {
      console.error('Error finding subservice hierarchy by project ID:', error);
      resolve(null);
    }
  });
}
