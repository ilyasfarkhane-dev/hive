import { NextRequest, NextResponse } from 'next/server';

// Import the data directly
import { serviceSubservicesData } from '@/Data/sub-service/data';
import { pillarServicesData } from '@/Data/services/data';
import { pillarsData } from '@/Data/pillars/data';
import { goals } from '@/Data/goals/data';

function findSubserviceHierarchy(subserviceId: string) {
  try {
    console.log('=== Finding subservice hierarchy ===');
    console.log('Looking for subservice ID or code:', subserviceId);
    console.log('ServiceSubservicesData keys:', Object.keys(serviceSubservicesData).length);
    
    // Step 1: Find the subservice in serviceSubservicesData
    // Search by both ID (UUID) and name (code like "1.1.3.1")
    let subservice = null;
    let serviceId = null;
    
    for (const [serviceIdKey, subservices] of Object.entries(serviceSubservicesData)) {
      const foundSubservice = subservices.find(sub => 
        sub.id === subserviceId || sub.name === subserviceId  // ✅ Search by ID OR name
      );
      if (foundSubservice) {
        subservice = foundSubservice;
        serviceId = serviceIdKey;
        console.log('✅ Found subservice by', foundSubservice.id === subserviceId ? 'ID' : 'code');
        console.log('Subservice:', subservice);
        console.log('Service ID:', serviceId);
        break;
      }
    }
    
    if (!subservice || !serviceId) {
      console.log('❌ Subservice not found with ID/code:', subserviceId);
      console.log('Tried searching by both UUID and code format');
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
      return null;
    }
    
    // Step 4: Find the goal in goals
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const subserviceId = searchParams.get('subserviceId');

    if (!projectId && !subserviceId) {
      return NextResponse.json({
        success: false,
        error: 'Either projectId or subserviceId is required'
      }, { status: 400 });
    }

    let targetSubserviceId = subserviceId;

    // If projectId is provided, get the subservice ID from the project
    if (projectId && !subserviceId) {
      try {
        const projectsResponse = await fetch(`${request.nextUrl.origin}/api/crm/projects`);
        const projectsResult = await projectsResponse.json();
        
        if (!projectsResult.success) {
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch projects: ' + projectsResult.error
          }, { status: 500 });
        }
        
        const project = projectsResult.projects.find((p: any) => p.id === projectId);
        if (!project) {
          return NextResponse.json({
            success: false,
            error: `Project with ID ${projectId} not found`
          }, { status: 404 });
        }
        
        if (!project.sub_service_id) {
          return NextResponse.json({
            success: false,
            error: `Project ${projectId} has no subservice assigned`
          }, { status: 404 });
        }
        
        targetSubserviceId = project.sub_service_id;
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `Failed to fetch project data: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    // Find the hierarchy using the subservice ID
    const hierarchy = findSubserviceHierarchy(targetSubserviceId!);

    if (!hierarchy) {
      return NextResponse.json({
        success: false,
        error: `No hierarchy found for subservice ID ${targetSubserviceId}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hierarchy: {
        subservice: {
          id: hierarchy.subservice.id,
          name: hierarchy.subservice.name,
          name_ar_c: hierarchy.subservice.name_ar_c,
          name_fr_c: hierarchy.subservice.name_fr_c,
          description: hierarchy.subservice.description,
          description_subservice: hierarchy.subservice.description_subservice,
          description_subservice_ar_c: hierarchy.subservice.description_subservice_ar_c,
          description_subservice_fr_c: hierarchy.subservice.description_subservice_fr_c
        },
        service: {
          id: hierarchy.service.id,
          code: hierarchy.service.code,
          name_service_ar_c: hierarchy.service.name_service_ar_c,
          name_service_fr_c: hierarchy.service.name_service_fr_c,
          description: hierarchy.service.description,
          description_service: hierarchy.service.description_service,
          description_service_fr_c: hierarchy.service.description_service_fr_c,
          description_service_ar_c: hierarchy.service.description_service_ar_c
        },
        pillar: {
          id: hierarchy.pillar.id,
          code: hierarchy.pillar.code,
          title: hierarchy.pillar.title
        },
        goal: {
          id: hierarchy.goal.id,
          code: hierarchy.goal.code,
          title: hierarchy.goal.title,
          desc: hierarchy.goal.desc
        }
      }
    });

  } catch (error) {
    console.error('Error fetching project hierarchy:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
