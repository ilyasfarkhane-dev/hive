import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, getModuleEntries } from '@/utils/crm';

export async function GET(request: NextRequest) {
  try {
    // Get session ID
    const sessionId = await getSessionId();
    
    // Fetch subservices with their related projects
    const subserviceEntries = await getModuleEntries(
      sessionId,
      'ms_subservice',
      [
        'id',
        'name',
        'code',
        'description'
      ],
      '', // No specific query
      50, // Max 50 subservices
      [
        { name: 'ms_subservice_icesc_project_suggestions_1', value: ['id', 'name', 'description'] }
      ] // Include project relationships
    );
    
    console.log('=== SUBSERVICES WITH RELATIONSHIPS ===');
    console.log('Subservices count:', subserviceEntries.length);
    
    // Process subservices and their relationships
    const subservicesWithProjects = subserviceEntries.map((subservice: any) => {
      const projects = [];
      
      if (subservice.link_list && subservice.link_list.ms_subservice_icesc_project_suggestions_1) {
        const relatedProjects = subservice.link_list.ms_subservice_icesc_project_suggestions_1;
        if (Array.isArray(relatedProjects)) {
          projects.push(...relatedProjects);
        }
      }
      
      return {
        id: subservice.id,
        name: subservice.name,
        code: subservice.code,
        description: subservice.description,
        projects: projects
      };
    });
    
    console.log('Subservices with projects:', subservicesWithProjects.map((s: any) => ({
      id: s.id,
      name: s.name,
      projectCount: s.projects.length
    })));
    
    return NextResponse.json({
      success: true,
      subservices: subservicesWithProjects,
      count: subservicesWithProjects.length
    });
    
  } catch (error) {
    console.error('Error in CRM subservices API route:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      subservices: [],
      count: 0
    }, { status: 500 });
  }
}
