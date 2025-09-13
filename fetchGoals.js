// scripts/fetchGoals.js
import fs from 'fs';
import axios from 'axios';
import md5 from 'md5';

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";
const ADMIN_USERNAME = process.env.CRM_ADMIN_USER || "portal";
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASS || "Portal@2025";

// Get session ID
async function getSessionId() {
  const loginData = JSON.stringify({
    user_auth: { user_name: ADMIN_USERNAME, password: md5(ADMIN_PASSWORD) },
    application_name: "MyApp",
  });

  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "login",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: loginData,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if (!resp.data?.id) throw new Error("Admin login failed");
  return resp.data.id;
}

// Fetch goals
async function fetchGoals(sessionId) {
  const selectFields = ["id", "name", "description", "name_goal_fr_c", "name_goal_ar_c"];
  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_goal",
    query: "",
    order_by: "date_entered DESC",
    offset: 0,
    select_fields: selectFields,
    max_results: 50,
  });

  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: restData,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const entryList = resp.data?.entry_list || [];

  return entryList.map((entry) => {
    const fields = {};
    Object.values(entry.name_value_list).forEach(f => (fields[f.name] = f.value));

    return {
      id: fields.id,
      code: fields.name,
      title: {
        en: fields.description || fields.name || "",
        fr: fields.name_goal_fr_c || fields.name || "",
        ar: fields.name_goal_ar_c || fields.name || "",
      },
      desc: {
        en: fields.description || fields.name || "",
        fr: fields.name_goal_fr_c || fields.name || "",
        ar: fields.name_goal_ar_c || fields.name || "",
      },
    };
  });
}

// Write to data.js
async function saveGoalsToFile(goals) {
  const fileContent = `export const goals = ${JSON.stringify(goals, null, 2)};`;
  fs.writeFileSync('./Data/goals/data.js', fileContent, 'utf-8');
  console.log('Goals saved to /Data/goals/data.js');
}

// Run
(async () => {
  try {
    const sessionId = await getSessionId();
    const goals = await fetchGoals(sessionId);
    await saveGoalsToFile(goals);
  } catch (error) {
    console.error("Error fetching or saving goals:", error);
  }
})();
