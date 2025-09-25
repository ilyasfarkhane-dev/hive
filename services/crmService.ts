/**
 * CRM Service for SugarCRM API Integration
 * Handles project submission and data management
 */

import { mapProjectDataToCRM, validateProjectData } from '@/utils/crmFieldMapping';
import md5 from 'md5';

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
  expected_outputs: string;
  kpis: string[];
  
  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;
  contact_id?: string;
  
  // Account information
  account_id?: string;
  account_name?: string;
  
  // Additional info
  comments?: string;
  supporting_documents?: File[];
  
  // Metadata
  session_id: string;
  language: string;
  submission_date: string;
  status?: string; // 'Draft' or 'Published'
}

export interface CRMResponse {
  success: boolean;
  id?: string;
  error?: string;
  message?: string;
  relationships?: any[];
}

class CRMService {
  private config: CRMConfig;
  private sessionId: string | null = null;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  // Getter for session ID
  get currentSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Authenticate with SugarCRM and get session ID
   */
  async authenticate(): Promise<string> {
    try {
      
      // Try multiple authentication methods
      const authMethods = [
        {
          name: 'Plain password with MyApp',
          authData: {
            user_auth: {
              user_name: this.config.username,
              password: this.config.password,
            },
            application_name: "MyApp",
          }
        },
        {
          name: 'MD5 hashed password with MyApp',
          authData: {
        user_auth: {
          user_name: this.config.username,
          password: md5(this.config.password),
        },
            application_name: "MyApp",
          }
        },
        {
          name: 'Plain password with ICESCO Portal',
          authData: {
            user_auth: {
              user_name: this.config.username,
              password: this.config.password,
            },
            application_name: "ICESCO Portal",
          }
        },
        {
          name: 'MD5 hashed password with ICESCO Portal',
          authData: {
            user_auth: {
              user_name: this.config.username,
              password: md5(this.config.password),
            },
            application_name: "ICESCO Portal",
          }
        }
      ];

      for (const method of authMethods) {
        try {
      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'login',
          input_type: 'JSON',
          response_type: 'JSON',
              rest_data: JSON.stringify(method.authData),
        }),
        // Add longer timeout for slow CRM server
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      
          // Check if response is ok before parsing JSON
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Auth response error text:', errorText);
            if (response.status === 500) {
              console.log('CRM server returned 500 error, trying next method...');
              continue;
            }
            throw new Error(`CRM server returned HTTP ${response.status}: ${response.statusText}. Response: ${errorText || 'Empty response'}`);
          }
          
          // Get response text first to debug
          const responseText = await response.text();
          console.log('Auth response text:', responseText);
          
          if (!responseText || responseText.trim() === '') {
            console.log('CRM server returned empty response, trying next method...');
            continue;
          }
          
          // Try to parse JSON
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response text that failed to parse:', responseText);
            console.log('Invalid JSON response, trying next method...');
            continue;
          }
          
      
      if (data.id) {
        this.sessionId = data.id;
            console.log(`Authentication successful with method: ${method.name}, session ID:`, data.id);
        return data.id;
      } else {
        console.error('Authentication failed:', data.error);
            console.log('Authentication failed, trying next method...');
            continue;
          }
        } catch (methodError) {
          console.error(`Authentication method ${method.name} failed:`, methodError);
          console.log('Trying next method...');
          continue;
        }
      }
      
      // If all methods failed
      throw new Error('All authentication methods failed. CRM server may be down or credentials may be incorrect.');
      
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
      
      // Validate project data first - check if this is a draft
      const isDraft = projectData.status === 'Draft';
      const validation = validateProjectData(projectData, isDraft);
      if (!validation.valid) {
        console.log('Validation failed:', validation.errors);
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }
      console.log('Project data validation passed');

      // Use session ID from project data if available, otherwise authenticate
      if (projectData.session_id) {
        console.log('Using session ID from project data:', projectData.session_id);
        this.sessionId = projectData.session_id;
      } else if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      } else {
        console.log('Using existing session ID:', this.sessionId);
      }

      // Prepare the project data for CRM using dynamic mapping
      console.log('Mapping project data to CRM format...');
      const crmData = mapProjectDataToCRM(projectData);
      console.log('Mapped CRM data:', crmData);
      
      // Fix phone number length (max 15 characters for better compatibility)
      crmData.forEach(field => {
        if (field.name === 'contact_phone' && typeof field.value === 'string') {
          if (field.value.length > 15) {
            field.value = field.value.substring(0, 15);
            console.log('Truncated phone number to:', field.value);
          }
          // Also remove any non-numeric characters except + and -
          field.value = field.value.replace(/[^\d+\-]/g, '');
        }
      });

      // Add strategic information as additional data
      const strategicInfo = {
        strategic_goal: projectData.strategic_goal,
        strategic_goal_id: projectData.strategic_goal_id || '',
        pillar: projectData.pillar,
        pillar_id: projectData.pillar_id || '',
        service: projectData.service,
        service_id: projectData.service_id || '',
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
      
      // Validate and fix data before sending to CRM
      crmData.forEach(field => {
        // Fix empty string values that should be null
        if (field.value === '') {
          field.value = null;
        }
        // Fix phone number length (max 15 characters for better compatibility)
        if (field.name === 'contact_phone' && typeof field.value === 'string') {
          if (field.value.length > 15) {
            field.value = field.value.substring(0, 15);
            console.log('Truncated phone number to:', field.value);
          }
          // Also remove any non-numeric characters except + and -
          field.value = field.value.replace(/[^\d+\-]/g, '');
        }
      });

      console.log('Final CRM data to submit:', crmData);

      const submissionData = {
        session: this.sessionId,
        module_name: 'icesc_project_suggestions',
        name_value_list: crmData,
      };
      
      console.log('Submitting to CRM with data:', JSON.stringify(submissionData, null, 2));
   

      // Retry logic for connection timeouts
      let response;
      let lastError;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} to submit project to CRM...`);
          
          response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
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
            // Add longer timeout for slow CRM server
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });
          
          console.log(`Attempt ${attempt} successful - Response status: ${response.status}`);
          break; // Success, exit retry loop
          
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
          
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('All retry attempts failed');
      }

      console.log('CRM submission response status:', response.status);
      console.log('CRM submission response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CRM submission failed with status:', response.status);
        console.error('Error response:', errorText);
        return {
          success: false,
          error: `CRM server returned error status ${response.status}: ${errorText}`,
        };
      }
      
      // Get response text first to check if it's valid JSON
      const responseText = await response.text();
      console.log('Raw CRM submission response:', responseText);
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('CRM returned HTML error page instead of JSON');
        return {
          success: false,
          error: `CRM server returned an HTML error page. This usually indicates an authentication issue or server error. Please check your session ID and try logging in again.`,
        };
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed CRM Response:', data);
      } catch (parseError) {
        console.error('Failed to parse CRM response as JSON:', parseError);
        console.error('Raw response was:', responseText);
        return {
          success: false,
          error: `Failed to parse CRM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Raw response: ${responseText.substring(0, 200)}...`,
        };
      }
      
      if (data.id && data.id !== '-1') {
        console.log('Project submitted successfully with ID:', data.id);
        
        // Create relationships after successful project creation
        const relationships = [];
        
        // Create subservice relationship if subservice_id is provided
        if (projectData.sub_service_id) {
          console.log('Creating subservice relationship...');
          const subserviceResult = await this.createSubserviceRelationship(data.id, projectData.sub_service_id);
          relationships.push({
            type: 'subservice',
            success: subserviceResult.success,
            error: subserviceResult.error
          });
        }
        
        // Create contact relationship if contact_id is provided
        if (projectData.contact_id) {
          console.log('Creating contact relationship...');
          const contactResult = await this.createContactRelationship(data.id, projectData.contact_id);
          relationships.push({
            type: 'contact',
            success: contactResult.success,
            error: contactResult.error
          });
        }
        
        // Create account relationship if account_id is provided
        if (projectData.account_id) {
          console.log('Creating account relationship...');
          const accountResult = await this.createAccountRelationship(data.id, projectData.account_id);
          relationships.push({
            type: 'account',
            success: accountResult.success,
            error: accountResult.error
          });
        }
        
        console.log('Relationship creation results:', relationships);
        
        return {
          success: true,
          id: data.id,
          message: 'Project submitted successfully with relationships',
          relationships: relationships
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
   * Search for a contact by login credentials
   */
  async searchContact(login: string, password: string): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      console.log('=== CRM Contact Search Started ===');
      console.log('Searching for contact with login:', login);

      if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      }

      // Search for contact by login_c field (not email1)
      let searchData = {
        session: this.sessionId,
        module_name: 'Contacts',
        query: `contacts.login_c = '${login.replace(/'/g, "\\'")}'`,
        order_by: 'contacts.date_entered DESC',
        offset: 0,
        select_fields: [
          'id',
          'first_name',
          'last_name',
          'email1',
          'phone_mobile',
          'phone_work',
          'title',
          'account_name',
          'account_id',
          'primary_address_country',
          'login_c',
          'password_c'
        ],
        link_name_to_fields_array: [
          {
            name: 'accounts_contacts',
            value: ['id', 'name']
          }
        ],
        max_results: 1
      };

      // Try a simpler query first
      let response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_entry_list',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(searchData),
        }),
      });

      console.log('Contact search response status:', response.status);
      
      // If the first query fails, try without the query filter
      if (response.status === 500) {
        console.log('First query failed, trying without login filter...');
        searchData = {
          session: this.sessionId,
          module_name: 'Contacts',
          query: '', // Empty query to get all contacts
          order_by: 'contacts.date_entered DESC',
          offset: 0,
          select_fields: [
            'id',
            'first_name',
            'last_name',
            'email1',
            'phone_mobile',
            'phone_work',
            'title',
            'account_name',
            'primary_address_country',
            'login_c',
            'password_c'
          ],
          link_name_to_fields_array: [
            {
              name: 'accounts_contacts',
              value: ['id', 'name']
            }
          ],
          max_results: 50 // Get more results to search through
        };

        response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            method: 'get_entry_list',
            input_type: 'JSON',
            response_type: 'JSON',
            rest_data: JSON.stringify(searchData),
          }),
        });
      }

      console.log('Contact search data:', JSON.stringify(searchData, null, 2));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) { 
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        return {
          success: false,
          error: 'CRM returned non-JSON response (likely database error)'
        };
      }
      
      const data = await response.json();
      console.log('Contact search response data:', data);

      if (data.entry_list && data.entry_list.length > 0) {
        // If we got results, find the one matching the login credentials
        let matchingContact = null;
        
        if (searchData.query) {
          // If we used a query filter, take the first result
          matchingContact = data.entry_list[0];
        } else {
          // If we got all contacts, find the one with matching login
          matchingContact = data.entry_list.find((contact: any) => 
            contact.name_value_list.login_c?.value === login
          );
        }
        
        if (matchingContact) {
          // Verify password
          const storedPassword = matchingContact.name_value_list.password_c?.value;
          if (storedPassword !== password) {
            console.log('Password mismatch for contact:', login);
            return {
              success: false,
              error: 'Invalid password'
            };
          }
          
          console.log('Contact found and password verified:', matchingContact);
          
          // Extract account information from relationship
          let accountId = null;
          let accountName = null;
          
          // Check if we have relationship data
          if (data.relationship_list && data.relationship_list.length > 0) {
            console.log('Relationship list found:', data.relationship_list.length);
            
            const accountRelationship = data.relationship_list.find((rel: any) => 
              rel.name === 'accounts_contacts' && rel.records && rel.records.length > 0
            );
            
            if (accountRelationship) {
              console.log('Account relationship found:', accountRelationship);
              console.log('Account records:', accountRelationship.records.length);
              
              if (accountRelationship.records.length > 0) {
                // Get the first account from the relationship
                const account = accountRelationship.records[0];
                console.log('First account record:', account);
                
                accountId = account.id;
                accountName = account.name_value_list?.name?.value || '';
                console.log('Extracted account info:', { accountId, accountName });
              }
            } else {
              console.log('No accounts_contacts relationship found');
              console.log('Available relationships:', data.relationship_list.map((rel: any) => rel.name));
            }
          } else {
            console.log('No relationship_list in response');
          }
          
          // Fallback to direct account fields if no relationship data
          if (!accountId) {
            accountId = matchingContact.name_value_list.account_id?.value || null;
            accountName = matchingContact.name_value_list.account_name?.value || '';
            console.log('Using direct account fields:', { accountId, accountName });
          }
          
          // If we have account name but no ID, try to find the account by name (optional)
          if (accountName && !accountId) {
            console.log('Have account name but no ID, searching for account...');
            try {
              // Try multiple search approaches
              const searchQueries = [
                `accounts.name='${accountName.replace(/'/g, "\\'")}'`, // With table prefix
                `name='${accountName.replace(/'/g, "\\'")}'`, // Without table prefix
                `name LIKE '%${accountName.replace(/'/g, "\\'")}%'` // Partial match
              ];
              
              let accountFound = false;
              
              for (let i = 0; i < searchQueries.length && !accountFound; i++) {
                console.log(`Trying account search query ${i + 1}:`, searchQueries[i]);
                
                try {
                  const accountSearchData = {
                    session: this.sessionId,
                    module_name: 'Accounts',
                    query: searchQueries[i],
                    select_fields: ['id', 'name'],
                    max_results: 1
                  };
                  
                  const accountResponse = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      method: 'get_entry_list',
                      input_type: 'JSON',
                      response_type: 'JSON',
                      rest_data: JSON.stringify(accountSearchData),
                    }),
                    signal: AbortSignal.timeout(5000), // 5 second timeout per query
                  });
                  
                  const responseText = await accountResponse.text();
                  console.log(`Account search raw response ${i + 1}:`, responseText);
                  
                  try {
                    const accountData = JSON.parse(responseText);
                    console.log(`Account search parsed response ${i + 1}:`, accountData);
                    
                    if (accountData.entry_list && accountData.entry_list.length > 0) {
                      accountId = accountData.entry_list[0].id;
                      console.log('✅ Found account ID by name:', accountId);
                      accountFound = true;
                    } else {
                      console.log(`❌ No results with query ${i + 1}`);
                    }
                  } catch (parseError) {
                    console.error(`Failed to parse account search response ${i + 1}:`, parseError);
                    console.log('Raw response was:', responseText);
                    console.log('This might be a database error or invalid query');
                  }
                } catch (fetchError: any) {
                  console.error(`Account search fetch error ${i + 1}:`, fetchError);
                  if (fetchError?.name === 'TimeoutError' || fetchError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
                    console.log(`Query ${i + 1} timed out`);
                  }
                }
              }
              
              if (!accountFound) {
                console.log('❌ No account found with any search method for:', accountName);
              }
            } catch (searchError: any) {
              console.error('Error searching for account by name:', searchError);
              if (searchError?.name === 'TimeoutError' || searchError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
                console.log('Account search timed out during login - will retry during project submission');
              } else {
                console.log('Account search failed during login - will retry during project submission');
              }
              // Don't fail the login process if account search fails
            }
          }

          return {
            success: true,
            contact: {
              id: matchingContact.id,
              first_name: matchingContact.name_value_list.first_name?.value || '',
              last_name: matchingContact.name_value_list.last_name?.value || '',
              email: matchingContact.name_value_list.email1?.value || login, // Use login as email if email1 is empty
              phone: matchingContact.name_value_list.phone_mobile?.value || matchingContact.name_value_list.phone_work?.value || '',
              title: matchingContact.name_value_list.title?.value || '',
              account_name: accountName,
              account_id: accountId,
              country: matchingContact.name_value_list.primary_address_country?.value || ''
            }
          };
        } else {
          console.log('No contact found with login:', login);
          return {
            success: false,
            error: 'Contact not found'
          };
        }
      } else if (data.error) {
        console.log('CRM returned error:', data.error);
        return {
          success: false,
          error: data.error.description || 'CRM search error'
        };
      } else {
        console.log('No contact found with login:', login);
        return {
          success: false,
          error: 'Contact not found'
        };
      }
    } catch (error) {
      console.error('Contact Search Error:', error);
      return {
        success: false,
        error: `Failed to search contact: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create contact relationship for a project
   */
  async createContactRelationship(projectId: string, contactId: string): Promise<CRMResponse> {
    try {
      console.log('=== Creating Contact Relationship ===');
      console.log('Project ID:', projectId);
      console.log('Contact ID:', contactId);

      if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      }

      const relationshipData = {
        session: this.sessionId,
        module_name: 'icesc_project_suggestions',
        module_id: projectId,
        link_field_name: 'contacts_icesc_project_suggestions_1',
        related_ids: [contactId]
      };

      console.log('Contact relationship data:', JSON.stringify(relationshipData, null, 2));

      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_relationship',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(relationshipData),
        }),
      });

      console.log('Contact relationship response status:', response.status);
      const data = await response.json();
      console.log('Contact relationship response data:', data);

      if (data.created && data.created > 0) {
        return {
          success: true,
          message: 'Contact relationship created successfully',
        };
      } else {
        return {
          success: false,
          error: data.error?.description || 'Failed to create contact relationship',
        };
      }
    } catch (error) {
      console.error('Contact Relationship Error:', error);
      return {
        success: false,
        error: `Failed to create contact relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create account relationship for a project
   */
  async createAccountRelationship(projectId: string, accountId: string): Promise<CRMResponse> {
    try {
      console.log('=== Creating Account Relationship ===');
      console.log('Project ID:', projectId);
      console.log('Account ID:', accountId);

      if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      }

      const relationshipData = {
        session: this.sessionId,
        module_name: 'icesc_project_suggestions',
        module_id: projectId,
        link_field_name: 'accounts_icesc_project_suggestions_1',
        related_ids: [accountId]
      };

      console.log('Account relationship data:', JSON.stringify(relationshipData, null, 2));

      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_relationship',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(relationshipData),
        }),
      });

      console.log('Account relationship response status:', response.status);
      const data = await response.json();
      console.log('Account relationship response data:', data);

      if (data.created && data.created > 0) {
        return {
          success: true,
          message: 'Account relationship created successfully',
        };
      } else {
        return {
          success: false,
          error: data.error?.description || 'Failed to create account relationship',
        };
      }
    } catch (error) {
      console.error('Account Relationship Error:', error);
      return {
        success: false,
        error: `Failed to create account relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update project in CRM using icesc_project_suggestions module
   */
  async updateProject(projectData: ProjectSubmissionData & { id: string }): Promise<CRMResponse> {
    try {
      console.log('=== CRM Update Project Started ===');
      console.log('Project data for update:', JSON.stringify(projectData, null, 2));

      // Validate project ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!projectData.id || !uuidRegex.test(projectData.id)) {
        console.error('Invalid project ID format:', projectData.id);
        return {
          success: false,
          error: `Invalid project ID format: ${projectData.id}. Expected UUID format.`,
        };
      }

      // Use session ID from project data if available, otherwise authenticate
      if (projectData.session_id) {
        console.log('Using session ID from project data:', projectData.session_id);
        this.sessionId = projectData.session_id;
      } else if (!this.sessionId) {
        console.log('No session ID available, authenticating...');
        await this.authenticate();
      }

      // Validate session ID format
      const sessionIdRegex = /^[a-zA-Z0-9]{20,}$/;
      if (!this.sessionId || !sessionIdRegex.test(this.sessionId)) {
        console.log('Session ID appears invalid, getting fresh session...');
        await this.authenticate();
      }

      // Prepare the project data for CRM using dynamic mapping (same as submit)
      console.log('Mapping project data to CRM format...');
      const crmData = mapProjectDataToCRM(projectData);
      console.log('Mapped CRM data:', crmData);
      
      // Fix phone number length (max 15 characters for better compatibility)
      crmData.forEach(field => {
        if (field.name === 'contact_phone' && typeof field.value === 'string') {
          if (field.value.length > 15) {
            field.value = field.value.substring(0, 15);
            console.log('Truncated phone number to:', field.value);
          }
          // Also remove any non-numeric characters except + and -
          field.value = field.value.replace(/[^\d+\-]/g, '');
        }
      });

      const updateData = {
        session: this.sessionId,
        module_name: 'icesc_project_suggestions',
        id: projectData.id,
        name_value_list: crmData,
      };
      
      console.log('Updating CRM with data:', JSON.stringify(updateData, null, 2));
      console.log('Session ID being used:', this.sessionId);
      console.log('CRM Base URL:', this.config.baseUrl);
      console.log('Project ID being updated:', projectData.id);
      console.log('Number of fields being sent:', crmData.length);
      console.log('Field names being sent:', crmData.map(f => f.name));

      // Retry logic for connection timeouts
      let response;
      let lastError;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} to update project in CRM...`);
          
          response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              method: 'set_entry',
              input_type: 'JSON',
              response_type: 'JSON',
              rest_data: JSON.stringify(updateData),
            }),
            // Add longer timeout for slow CRM server
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });
          
          console.log(`Attempt ${attempt} successful - Response status: ${response.status}`);
          break; // Success, exit retry loop
          
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
          
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('All retry attempts failed');
      }

      console.log('CRM update response status:', response.status);
      console.log('CRM update response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CRM update failed with status:', response.status);
        console.error('Error response:', errorText);
        console.error('Request data that caused error:', JSON.stringify(updateData, null, 2));
        return {
          success: false,
          error: `CRM server returned error status ${response.status}: ${response.statusText}. This usually indicates invalid data format or missing required fields. Response: ${errorText.substring(0, 200)}...`,
        };
      }

      const responseText = await response.text();
      console.log('CRM update response text:', responseText);

      // Check if response is HTML (error page) instead of JSON
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
        console.error('CRM returned HTML error page instead of JSON');
        return {
          success: false,
          error: 'CRM server returned an HTML error page instead of JSON response. This usually indicates an authentication issue or server error.',
        };
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('CRM update response data:', data);
      } catch (parseError) {
        console.error('Failed to parse CRM update response as JSON:', parseError);
        console.error('Raw response text:', responseText);
        return {
          success: false,
          error: `Failed to parse CRM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        };
      }

      if (data.id && data.id !== '-1') {
        console.log('✅ Project updated successfully with ID:', data.id);
        return {
          success: true,
          id: data.id,
          message: 'Project updated successfully',
        };
      } else {
        console.error('❌ Project update failed');
        console.error('Response data:', data);
        return {
          success: false,
          error: data.error?.description || data.error?.message || `Failed to update project. Response: ${JSON.stringify(data)}`,
        };
      }

    } catch (error) {
      console.error('Project Update Error:', error);
      return {
        success: false,
        error: `Failed to update project in CRM: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create subservice relationship for a project
   */
  async createSubserviceRelationship(projectId: string, subserviceId: string): Promise<CRMResponse> {
    try {
      console.log('=== Creating Subservice Relationship ===');
      console.log('Project ID:', projectId);
      console.log('Subservice ID:', subserviceId);

      if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      }

      const relationshipData = {
        session: this.sessionId,
        module_name: 'icesc_project_suggestions',
        module_id: projectId,
        link_field_name: 'ms_subservice_icesc_project_suggestions_1',
        related_ids: [subserviceId]
      };

      console.log('Relationship data:', JSON.stringify(relationshipData, null, 2));

      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'set_relationship',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(relationshipData),
        }),
      });

      console.log('Relationship response status:', response.status);
      const data = await response.json();
      console.log('Relationship response data:', data);

      if (data.created && data.created.length > 0) {
        return {
          success: true,
          message: 'Subservice relationship created successfully',
        };
      } else {
        return {
          success: false,
          error: data.error?.description || 'Failed to create subservice relationship',
        };
      }
    } catch (error) {
      console.error('Subservice Relationship Error:', error);
      return {
        success: false,
        error: `Failed to create subservice relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get strategic goals from CRM
   */
  async getGoals(): Promise<any[]> {
    try {
      console.log('=== Fetching Goals from CRM ===');
      
      if (!this.sessionId) {
        console.log('No session ID, authenticating...');
        await this.authenticate();
      }

      const queryData = {
        session: this.sessionId,
        module_name: 'Goals',
        query: '',
        order_by: 'name',
        offset: 0,
        select_fields: ['id', 'name', 'description'],
        max_results: 50
      };

      const response = await fetch(`${this.config.baseUrl}/service/v4_1/rest.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          method: 'get_entry_list',
          input_type: 'JSON',
          response_type: 'JSON',
          rest_data: JSON.stringify(queryData),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.description || 'Failed to fetch goals');
      }

      console.log('Goals fetched successfully:', data.entry_list?.length || 0);
      return data.entry_list || [];
    } catch (error) {
      console.error('Get Goals Error:', error);
      throw error;
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
