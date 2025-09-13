import axios from "axios";
import md5 from "md5";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";

// Admin credentials
const ADMIN_USERNAME = process.env.CRM_ADMIN_USER || "portal";
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASS || "Portal@2025";

// 🔑 Get Session ID
export async function getSessionId(): Promise<string> {
  const hashedAdminPassword = md5(ADMIN_PASSWORD);
  const loginData = JSON.stringify({
    user_auth: { user_name: ADMIN_USERNAME, password: hashedAdminPassword },
    application_name: "MyApp",
  });

  const loginResp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "login",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: loginData,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if (!loginResp.data?.id) throw new Error("Failed to get session ID");
  return loginResp.data.id;
}

// 📦 Generic fetcher
export async function getModuleEntries(
  sessionId: string,
  module: string,
  selectFields: string[] = [],
  query = "",
  maxResults = 50
) {
  const requestData = JSON.stringify({
    session: sessionId,
    module_name: module,
    query,
    order_by: "",
    offset: 0,
    select_fields: selectFields,
    max_results: maxResults,
  });

  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: requestData,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  console.log('=== DEBUG: CRM API Response ===');
  console.log('Response status:', resp.status);
  console.log('Response data:', JSON.stringify(resp.data, null, 2));

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

  console.log(`Found ${resp.data.entry_list.length} entries`);

  return resp.data.entry_list.map((entry: any) => {
    const obj: Record<string, any> = {};
    if (entry.name_value_list) {
      Object.values(entry.name_value_list).forEach((field: any) => {
        obj[field.name] = field.value;
      });
    }
    return obj;
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
  
  console.log('=== DEBUG: Contact Retrieved ===');
  console.log('Login:', login);
  console.log('Contact found:', contacts.length > 0);
  if (contacts[0]) {
    console.log('Contact ID:', contacts[0].id);
    console.log('Contact Name:', contacts[0].first_name, contacts[0].last_name);
    console.log('Contact Email:', contacts[0].email1);
    console.log('Contact Phone:', contacts[0].phone_work);
    console.log('Portal Access:', contacts[0].portal_access_c);
  }
  console.log('===============================');
  
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
