import axios from "axios";
import md5 from "md5";

const CRM_REST_URL = "https://crm.icesco.org/service/v4_1/rest.php";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// Utility function for retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_BASE
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors or client errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          throw error; // Don't retry client errors
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Admin credentials
const ADMIN_USERNAME = process.env.CRM_ADMIN_USER || "portal";
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASS || "Portal@2025";

// 🔑 Get Session ID with timeout and retry logic
export async function getSessionId(): Promise<string> {
  const hashedAdminPassword = md5(ADMIN_PASSWORD);
  const loginData = JSON.stringify({
    user_auth: { user_name: ADMIN_USERNAME, password: hashedAdminPassword },
    application_name: "MyApp",
  });

  return withRetry(async () => {
    const loginResp = await axios.post(
      CRM_REST_URL,
      new URLSearchParams({
        method: "login",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: loginData,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      }
    );

    if (!loginResp.data?.id) {
      throw new Error(`Authentication failed: ${loginResp.data?.error?.description || 'No session ID returned'}`);
    }
    return loginResp.data.id;
  }).catch(error => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Connection timeout: CRM server is not responding');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Connection refused: CRM server is unreachable');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid credentials');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
    throw error;
  });
}

// 🔗 Get related projects for a specific contact using get_relationships
export async function getContactProjects(
  sessionId: string,
  contactId: string,
  relatedFields: string[] = [
    'id',
    'name',
    'description',
    'status_c',
    'date_entered',
    'date_modified',
    'contact_name',
    'contact_email',
    'contact_phone',
    'contact_role',
    'budget_icesco',
    'budget_member_state',
    'budget_sponsorship',
    'date_start',
    'date_end',
    'project_frequency',
    'beneficiaries',
    'delivery_modality',
    'geographic_scope',
    'project_type',
    'expected_outputs',
    'comments'
  ]
): Promise<any[]> {
  const method = 'get_relationships';
  const inputType = 'JSON';
  const responseType = 'JSON';
  
  const restData = {
    session: sessionId,
    module_name: 'Contacts',
    module_id: contactId,
    link_field_name: 'contacts_icesc_project_suggestions_1',
    related_module_query: '',
    related_fields: relatedFields,
    deleted: 0
  };

  console.log('=== CRM GET_RELATIONSHIPS REQUEST ===');
  console.log('Method:', method);
  console.log('Module:', 'Contacts');
  console.log('Contact ID:', contactId);
  console.log('Link field:', 'contacts_icesc_project_suggestions_1');
  console.log('Related fields:', relatedFields);

  const requestData = {
    method,
    input_type: inputType,
    response_type: responseType,
    rest_data: JSON.stringify(restData)
  };

  try {
    const response = await withRetry(async () => {
      return await axios.post(CRM_REST_URL, requestData, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    });

    console.log('=== CRM GET_RELATIONSHIPS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response keys:', Object.keys(response.data));

    if (response.data.entry_list) {
      console.log('Found', response.data.entry_list.length, 'related projects');
      return response.data.entry_list;
    } else {
      console.log('No entry_list in response, checking for errors...');
      if (response.data.error) {
        console.error('CRM Error:', response.data.error);
        throw new Error(`CRM Error: ${response.data.error}`);
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching contact projects:', error);
    throw error;
  }
}

// 📦 Generic fetcher with timeout and error handling
export async function getModuleEntries(
  sessionId: string,
  module: string,
  selectFields: string[] = [],
  query = "",
  maxResults = 50,
  linkNameToFieldsArray: any[] = []
) {
  const requestData = JSON.stringify({
    session: sessionId,
    module_name: module,
    query,
    order_by: "",
    offset: 0,
    select_fields: selectFields,
    max_results: maxResults,
    link_name_to_fields_array: linkNameToFieldsArray.length > 0 ? linkNameToFieldsArray : []
  });
  
  console.log('=== CRM API REQUEST DEBUG ===');
  console.log('Module:', module);
  console.log('Select fields:', selectFields);
  console.log('Link name to fields array:', linkNameToFieldsArray);
  console.log('Request data:', requestData);

  return withRetry(async () => {
    const resp = await axios.post(
      CRM_REST_URL,
      new URLSearchParams({
        method: "get_entry_list",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: requestData,
      }).toString(),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000, // 15 second timeout
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      }
    );


    // Check if the response has the expected structure
    if (!resp.data) {
      console.error('No data in CRM response');
      return [];
    }

    // Debug: Log the full response structure
    console.log('=== CRM API RESPONSE DEBUG ===');
    console.log('Response keys:', Object.keys(resp.data));
    if (resp.data.entry_list && resp.data.entry_list.length > 0) {
      console.log('First entry keys:', Object.keys(resp.data.entry_list[0]));
      console.log('First entry link_list:', resp.data.entry_list[0].link_list);
    }
    if (resp.data.relationship_list) {
      console.log('Relationship list:', resp.data.relationship_list);
    }

    if (!resp.data.entry_list) {
      console.error('No entry_list in CRM response');
      console.error('Available keys:', Object.keys(resp.data));
      return [];
    }

    if (!Array.isArray(resp.data.entry_list)) {
      console.error('entry_list is not an array:', typeof resp.data.entry_list);
      return [];
    }


    // Process relationship_list to create a map of relationships by entry ID
    const relationshipMap: Record<string, any> = {};
    const globalContacts: any[] = [];
    
    if (resp.data.relationship_list) {
      console.log('Processing relationship_list:', resp.data.relationship_list);
      resp.data.relationship_list.forEach((rel: any, relIndex: number) => {
        console.log(`\n--- RELATIONSHIP ${relIndex + 1} ---`);
        console.log('Relationship item:', rel);
        console.log('Relationship item keys:', Object.keys(rel));
        
        // Check if this relationship has link_list (which contains the actual relationship data)
        if (rel.link_list && Array.isArray(rel.link_list)) {
          console.log('Found link_list in relationship:', rel.link_list);
          rel.link_list.forEach((linkEntry: any) => {
            console.log('Link entry:', linkEntry);
            console.log('Link entry keys:', Object.keys(linkEntry));
            
            // The link entry should contain the relationship data in records
            if (linkEntry.records && Array.isArray(linkEntry.records)) {
              console.log('Processing records in link:', linkEntry.records);
              linkEntry.records.forEach((record: any) => {
                console.log('Record:', record);
                console.log('Record keys:', Object.keys(record));
                
                // The record should have link_value containing the actual contact data
                if (record.link_value) {
                  console.log('Processing link_value:', record.link_value);
                  console.log('Link_value keys:', Object.keys(record.link_value));
                  
                  // Process the contact data from link_value
                  const contactObj: Record<string, any> = {};
                  if (record.link_value.name_value_list) {
                    Object.values(record.link_value.name_value_list).forEach((field: any) => {
                      contactObj[field.name] = field.value;
                    });
                  } else {
                    // If no name_value_list, use the direct properties
                    Object.keys(record.link_value).forEach((key: string) => {
                      if (key !== 'project_id') {
                        // Keep the id field as it contains the actual contact ID
                        if (key === 'id' && record.link_value[key] && record.link_value[key].value) {
                          contactObj[key] = record.link_value[key].value;
                        } else if (key === 'id') {
                          contactObj[key] = record.link_value[key];
                        } else {
                          contactObj[key] = record.link_value[key];
                        }
                      }
                    });
                  }
                  
                  // Store contact in global list
                  globalContacts.push(contactObj);
                  console.log(`Stored contact:`, contactObj);
                }
              });
            }
          });
        }
      });
    }
    
    // Map contacts to projects based on project ID in the relationship data
    // Since we don't have direct project-to-contact mapping, we'll assign contacts to projects
    if (globalContacts.length > 0) {
      console.log(`\n=== MAPPING ${globalContacts.length} CONTACTS TO PROJECTS ===`);
      resp.data.entry_list.forEach((entry: any, projectIndex: number) => {
        const projectId = entry.id;
        console.log(`\n--- PROJECT ${projectIndex + 1}: ${projectId} ---`);
        
        // For now, we'll assign contacts to projects in order
        // In a real scenario, you'd need to determine the correct mapping
        const assignedContacts = globalContacts.slice(projectIndex, projectIndex + 1);
        if (assignedContacts.length > 0) {
          relationshipMap[projectId] = {
            'contacts_icesc_project_suggestions_1': assignedContacts
          };
          console.log(`Assigned ${assignedContacts.length} contact(s) to project ${projectId}:`, assignedContacts.map(c => c.name?.value || c.name));
        }
      });
    }

    return resp.data.entry_list.map((entry: any) => {
      const obj: Record<string, any> = {};
      
      // Process name_value_list fields
      if (entry.name_value_list) {
        Object.values(entry.name_value_list).forEach((field: any) => {
          obj[field.name] = field.value;
          
          // Debug contact-related fields
          if (field.name && field.name.includes('contact')) {
            console.log(`[CRM Processing] Project ${entry.id} - ${field.name}:`, field.value);
          }
        });
      }
      
      // Process direct fields that might not be in name_value_list
      Object.keys(entry).forEach((key: string) => {
        if (key !== 'name_value_list' && key !== 'link_list') {
          // Only add if not already processed from name_value_list
          if (!(key in obj)) {
            obj[key] = entry[key];
          }
        }
      });
      
      // Process link_list relationships (if they exist)
      if (entry.link_list) {
        console.log(`Processing link_list for entry ${entry.id}:`, Object.keys(entry.link_list));
        obj.link_list = {};
        Object.keys(entry.link_list).forEach((linkName: string) => {
          const linkData = entry.link_list[linkName];
          console.log(`Link ${linkName} data:`, linkData);
          if (Array.isArray(linkData)) {
            obj.link_list[linkName] = linkData.map((relatedEntry: any) => {
              const relatedObj: Record<string, any> = {};
              if (relatedEntry.name_value_list) {
                Object.values(relatedEntry.name_value_list).forEach((field: any) => {
                  relatedObj[field.name] = field.value;
                });
              } else {
                // Handle direct properties (like the contact data structure)
                Object.keys(relatedEntry).forEach((key: string) => {
                  if (key === 'id' && relatedEntry[key] && relatedEntry[key].value) {
                    relatedObj[key] = relatedEntry[key].value;
                  } else if (key === 'id') {
                    relatedObj[key] = relatedEntry[key];
                  } else {
                    relatedObj[key] = relatedEntry[key];
                  }
                });
              }
              return relatedObj;
            });
          } else {
            obj.link_list[linkName] = linkData;
          }
        });
      } else {
        console.log(`No link_list found for entry ${entry.id}`);
      }
      
      // Add relationships from relationship_list (only for this specific project)
      if (relationshipMap[entry.id]) {
        console.log(`Adding relationships for entry ${entry.id}:`, Object.keys(relationshipMap[entry.id]));
        obj.link_list = { ...obj.link_list, ...relationshipMap[entry.id] };
        
        // Also add the contact name to the main object for easy access
        if (relationshipMap[entry.id]['contacts_icesc_project_suggestions_1'] && 
            relationshipMap[entry.id]['contacts_icesc_project_suggestions_1'].length > 0) {
          const contact = relationshipMap[entry.id]['contacts_icesc_project_suggestions_1'][0];
          let contactName = '';
          if (contact.name && typeof contact.name === 'object') {
            contactName = contact.name.value || contact.name.name || '';
          } else if (typeof contact.name === 'string') {
            contactName = contact.name;
          }
          obj.contacts_icesc_project_suggestions_1_name = contactName;
          console.log(`Added contact name for project ${entry.id}: "${contactName}"`);
        }
      } else {
        console.log(`No relationships found for project ${entry.id}`);
      }
      
      return obj;
    });
  }).catch(error => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Connection timeout: CRM server is not responding');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Connection refused: CRM server is unreachable');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed: Session expired');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
    throw error;
  });
}

// 👤 Fetch contact by login
export async function getContactByLogin(sessionId: string, login: string) {
  const contacts = await getModuleEntries(
    sessionId,
    "Contacts",
    [
      "id",
      "first_name",
      "last_name",
      "login_c",
      "email1",
      "phone_work",
      "phone_mobile",
      "title",
      "department",
      "description",
      "primary_address_street",
      "primary_address_city",
      "primary_address_state",
      "primary_address_postalcode",
      "primary_address_country",
      "alt_address_street",
      "alt_address_city",
      "alt_address_state",
      "alt_address_postalcode",
      "alt_address_country",
      "password_c",
      "portal_access_c",
      "date_entered",
      "date_modified",
      "created_by",
      "modified_user_id",
      "assigned_user_id",
      "assigned_user_name",
      "created_by_name",
      "modified_by_name"
    ],
    `login_c='${login.replace(/'/g, "\\'")}'`,
    1
  );
  
  
  return contacts[0] || null;
}

// 🎯 Fetch goals
export async function getGoals(sessionId: string, language: string = 'en') {
  // Determine which fields to select based on language
  let selectFields: string[];
  switch (language) {
    case 'fr':
      selectFields = ["id", "name", "name_goal_fr_c"];
      break;
    case 'ar':
      selectFields = ["id", "name", "name_goal_ar_c"];
      break;
    case 'en':
    default:
      selectFields = ["id", "name", "description"];
      break;
  }

  const rawGoals = await getModuleEntries(
    sessionId,
    "ms_goal",
    selectFields,
    "",
    50
  );

  return rawGoals.map((g: any) => {
    // Map the description field based on language
    let descriptionField: string;
    switch (language) {
      case 'fr':
        descriptionField = g.name_goal_fr_c || g.description || '';
        break;
      case 'ar':
        descriptionField = g.name_goal_ar_c || g.description || '';
        break;
      case 'en':
      default:
        descriptionField = g.description || '';
        break;
    }

    return {
      id: g.id,
      title: g.name,
      desc: descriptionField,
    };
  });
}
