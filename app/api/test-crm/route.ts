import { NextRequest, NextResponse } from 'next/server';
import CRMService from '@/services/crmService';

// CRM Configuration for testing
const CRM_CONFIG = {
  baseUrl: process.env.CRM_BASE_URL || 'http://3.145.21.11',
  username: process.env.CRM_USERNAME || 'your-username',
  password: process.env.CRM_PASSWORD || 'your-password',
  application: process.env.CRM_APPLICATION || 'ICESCO Portal',
};

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId } = await request.json();

    const crmService = new CRMService(CRM_CONFIG);

    switch (action) {
      case 'authenticate':
        try {
          const session = await crmService.authenticate();
          return NextResponse.json({
            success: true,
            sessionId: session,
            message: 'Authentication successful'
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed'
          }, { status: 500 });
        }

      case 'get_module_fields':
        try {
          if (!sessionId) {
            return NextResponse.json({
              success: false,
              error: 'Session ID required for get_module_fields'
            }, { status: 400 });
          }

          const response = await fetch(`${CRM_CONFIG.baseUrl}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'get_module_fields',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify({
                session: sessionId,
                module_name: 'icesc_project_suggestions'
              }),
            }),
          });

          const data = await response.json();
          return NextResponse.json({
            success: true,
            data: data
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get module fields'
          }, { status: 500 });
        }

      case 'test_submission':
        try {
          // Test data for submission
          const testProjectData = {
            name: 'Test Project',
            description: 'This is a test project description',
            problem_statement: 'Test problem statement',
            beneficiaries: ['Students', 'Teachers'],
            other_beneficiaries: '',
            budget_icesco: 1000,
            budget_member_state: 2000,
            budget_sponsorship: 500,
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            frequency: 'One-time',
            frequency_duration: '6 months',
            partners: ['Partner 1', 'Partner 2'],
            delivery_modality: 'Physical',
            geographic_scope: 'National',
            project_type: 'Training',
            project_type_other: '',
            milestones: ['Milestone 1', 'Milestone 2'],
            expected_outputs: ['Test outputs'],
            kpis: ['KPI 1', 'KPI 2'],
            contact_name: 'Test Contact',
            contact_email: 'test@example.com',
            contact_phone: '1234567890',
            contact_role: 'Project Manager',
            comments: 'Test comments',
            // Strategic info
            strategic_goal: '1',
            strategic_goal_id: 'test-goal-id',
            pillar: '1.1',
            pillar_id: 'test-pillar-id',
            service: '1.1.1',
            service_id: 'test-service-id',
            sub_service: '1.1.1.1',
            sub_service_id: 'test-subservice-id',
            rationale_impact: 'Test rationale',
            institutions: ['Institution 1'],
            convening_method: 'Conference',
            project_brief: 'Test project brief for CRM testing',
            session_id: sessionId || 'test-session',
            language: 'en',
            submission_date: new Date().toISOString()
          };

          const result = await crmService.submitProject(testProjectData);
          return NextResponse.json(result);
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Test submission failed'
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: authenticate, get_module_fields, test_submission'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Test CRM API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


