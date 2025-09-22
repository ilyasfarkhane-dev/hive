import { NextRequest, NextResponse } from 'next/server';
import CRMService, { ProjectSubmissionData } from '@/services/crmService';

// CRM Configuration - should be moved to environment variables
const CRM_CONFIG = {
  baseUrl: process.env.CRM_BASE_URL || 'http://3.145.21.11',
  username: process.env.CRM_USERNAME || 'your-username',
  password: process.env.CRM_PASSWORD || 'your-password',
  application: process.env.CRM_APPLICATION || 'ICESCO Portal',
};

export async function POST(request: NextRequest) {
  try {
    console.log('=== CRM Submission API Called ===');
    const projectData: ProjectSubmissionData = await request.json();
    console.log('Received project data:', JSON.stringify(projectData, null, 2));

    // Validate required fields - check if this is a draft
    const isDraft = projectData.status === 'Draft';
    
    if (!isDraft) {
      // For non-drafts, validate all required fields
      const requiredFields = [
        'name', 'description', 'strategic_goal', 'pillar', 'service', 'sub_service',
        'contact_name', 'contact_email', 'contact_phone', 'session_id'
      ];

      const missingFields = requiredFields.filter(field => !projectData[field as keyof ProjectSubmissionData]);
      
      if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required fields: ${missingFields.join(', ')}` 
          },
          { status: 400 }
        );
      }
    } else {
      // For drafts, only validate essential fields
      if (!projectData.name || !projectData.session_id) {
        console.log('Missing essential fields for draft:', { name: !!projectData.name, session_id: !!projectData.session_id });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Missing essential fields: name and session_id are required for draft saves' 
          },
          { status: 400 }
        );
      }
    }

    console.log('CRM Config:', CRM_CONFIG);
    
    // Initialize CRM service
    const crmService = new CRMService(CRM_CONFIG);
    console.log('CRM Service initialized');

    // Submit project to CRM
    console.log('Calling CRM submitProject...');
    const result = await crmService.submitProject(projectData);
    console.log('CRM submission result:', result);

    if (result.success) {
      console.log('CRM submission successful');
      return NextResponse.json({
        success: true,
        projectId: result.id,
        message: result.message || 'Project submitted successfully',
      });
    } else {
      console.log('CRM submission failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to submit project' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Project submission error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
