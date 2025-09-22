import axios from "axios";
import md5 from "md5";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";

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

    if (!resp.data.entry_list) {
      console.error('No entry_list in CRM response');
      console.error('Available keys:', Object.keys(resp.data));
      return [];
    }

    if (!Array.isArray(resp.data.entry_list)) {
      console.error('entry_list is not an array:', typeof resp.data.entry_list);
      return [];
    }


    return resp.data.entry_list.map((entry: any) => {
      const obj: Record<string, any> = {};
      
      // Process name_value_list fields
      if (entry.name_value_list) {
        Object.values(entry.name_value_list).forEach((field: any) => {
          obj[field.name] = field.value;
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
      
      // Process link_list relationships
      if (entry.link_list) {
        obj.link_list = {};
        Object.keys(entry.link_list).forEach((linkName: string) => {
          const linkData = entry.link_list[linkName];
          if (Array.isArray(linkData)) {
            obj.link_list[linkName] = linkData.map((relatedEntry: any) => {
              const relatedObj: Record<string, any> = {};
              if (relatedEntry.name_value_list) {
                Object.values(relatedEntry.name_value_list).forEach((field: any) => {
                  relatedObj[field.name] = field.value;
                });
              }
              return relatedObj;
            });
          } else {
            obj.link_list[linkName] = linkData;
          }
        });
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
