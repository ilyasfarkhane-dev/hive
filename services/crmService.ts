/**
 * CRM Service for SugarCRM API Integration
 * Handles project submission and data management
 */

import { mapProjectDataToCRM, validateProjectData } from '@/utils/crmFieldMapping';

export interface CRMConfig {
  baseUrl: string;
  username: string;
  password: string;
  application: string;
}

export interface ProjectSubmissionData {
  // Basic project info
  name: string;
  description: string;
  project_brief: string;
  problem_statement: string;
  rationale_impact: string;
  
  // Strategic selections
  strategic_goal: string;
  strategic_goal_id: string;
  pillar: string;
  pillar_id: string;
  service: string;
  service_id: string;
  sub_service: string;
  sub_service_id: string;
  
  // Beneficiaries
  beneficiaries: string[];
  other_beneficiaries?: string;
  
  // Budget and timeline
  budget_icesco: number;
  budget_member_state: number;
  budget_sponsorship: number;
  start_date: string;
  end_date: string;
  frequency: string;
  frequency_duration?: string;
  
  // Partners and scope
  partners: string[];
  institutions: string[];
  delivery_modality: string;
  geographic_scope: string;
  convening_method: string;
  project_type: string;
  project_type_other?: string;
  
  // Monitoring and evaluation
  milestones: string[];
  expected_outputs: string[];
  kpis: string[];
  
  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  
  // Additional info
  comments?: string;
  supporting_documents?: File[];
  
  // Metadata
  session_id: string;
  language: string;
  submission_date: string;
}

export interface CRMResponse {
  success: boolean;
  id?: string;
  error?: string;
  message?: string;
}

class CRMService {
  private config: CRMConfig;
  private sessionId: string | null = null;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  /**
   * Authenticate with SugarCRM and get session ID
   */
  async authenticate(): Promise<string> {
    try {
      console.log('=== CRM Authentication Started ===');
      console.log('CRM Base URL:', this.config.baseUrl);
      console.log('Username:', this.config.username);
      console.log('Application:', this.config.application);
      
      const authData = {
        user_auth: {
          user_name: this.config.username,
          password: this.config.password,
        },
        application_name: this.config.application,
      };
      
      console.log('Auth data:', JSON.stringify(authData, null, 2));
      
      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'login',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(authData),
        }),
      });

      console.log('Auth response status:', response.status);
      console.log('Auth response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Auth response data:', data);
      
      if (data.id) {
        this.sessionId = data.id;
        console.log('Authentication successful, session ID:', data.id);
        return data.id;
      } else {
        console.error('Authentication failed:', data.error);
        throw new Error(data.error?.description || 'Authentication failed');
      }
    } catch (error) {
      console.error('CRM Authentication Error:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to authenticate with CRM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit project to CRM using icesc_project_suggestions module
   */
  async submitProject(projectData: ProjectSubmissionData): Promise<CRMResponse> {
    try {
      console.log('=== CRM Project Submission Started ===');
      
      // Validate project data first
      const validation = validateProjectData(projectData);
      if (!validation.valid) {
        console.log('Validation failed:', validation.errors);
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }
      console.log('Project data validation passed');

      // Ensure we have a valid session
      if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      } else {
        console.log('Using existing session ID:', this.sessionId);
      }

      // Prepare the project data for CRM using dynamic mapping
      console.log('Mapping project data to CRM format...');
      const crmData = mapProjectDataToCRM(projectData);
      console.log('Mapped CRM data:', crmData);

      // Add strategic information as additional data
      const strategicInfo = {
        strategic_goal: projectData.strategic_goal,
        strategic_goal_id: projectData.strategic_goal_id,
        pillar: projectData.pillar,
        pillar_id: projectData.pillar_id,
        service: projectData.service,
        service_id: projectData.service_id,
        sub_service: projectData.sub_service,
        sub_service_id: projectData.sub_service_id,
        rationale_impact: projectData.rationale_impact,
        institutions: projectData.institutions,
        convening_method: projectData.convening_method
      };

      // Add strategic info to comments
      const existingComments = projectData.comments || '';
      const strategicInfoJson = JSON.stringify(strategicInfo);
      crmData.push({
        name: 'comments',
        value: existingComments + (existingComments ? '\n\n' : '') + `Strategic Info: ${strategicInfoJson}`
      });

      console.log('Final CRM data to submit:', crmData);

      const submissionData = {
        session: this.sessionId,
        module_name: 'icesc_project_suggestions',
        name_value_list: crmData,
      };
      
      console.log('Submitting to CRM with data:', JSON.stringify(submissionData, null, 2));

      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_entry',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(submissionData),
        }),
      });

      console.log('CRM submission response status:', response.status);
      console.log('CRM submission response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('CRM Response:', data);
      
      if (data.id && data.id !== '-1') {
        console.log('Project submitted successfully with ID:', data.id);
        return {
          success: true,
          id: data.id,
          message: 'Project submitted successfully',
        };
      } else {
        console.error('Project submission failed:', data.error);
        return {
          success: false,
          error: data.error?.description || 'Failed to submit project',
        };
      }
    } catch (error) {
      console.error('Project Submission Error:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error: `Failed to submit project to CRM: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }


  /**
   * Logout from CRM session
   */
  async logout(): Promise<void> {
    if (this.sessionId) {
      try {
        await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            method: 'logout',
            input_type: 'JSON',
            response_type: 'JSON',
            rest_data: JSON.stringify({
              session: this.sessionId,
            }),
          }),
        });
      } catch (error) {
        console.error('CRM Logout Error:', error);
      } finally {
        this.sessionId = null;
      }
    }
  }
}

export default CRMService;
