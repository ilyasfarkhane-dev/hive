// scripts/fetchPillars.js
import fs from "fs";
import axios from "axios";
import md5 from "md5";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";
const ADMIN_USERNAME = process.env.CRM_ADMIN_USER || "portal";
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASS || "Portal@2025";

// 🔹 Get session ID
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

// 🔹 Fetch all goals
async function getAllGoals(sessionId) {
  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "ms_goal",
        query: "",
        order_by: "",
        offset: 0,
        select_fields: ["id", "name", "description"],
        max_results: 100,
        deleted: 0,
      }),
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return resp.data?.entry_list?.map((entry) => entry.id) || [];
}

// 🔹 Fetch pillars for a goal
async function getPillarsByGoal(sessionId, goalId) {
  const relatedFields = ["id","name","description","name_pillar_fr_c","name_pillar_ar_c"];

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_goal",
    module_id: goalId,
    link_field_name: "ms_goal_ms_pillar_1",
    related_module_query: "",
    related_fields: relatedFields,
    related_module_link_name_to_fields_array: [],
    deleted: 0,
  });

  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "get_relationships",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: restData,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const entryList = resp.data?.entry_list || [];

  return entryList.map((entry) => {
    const fields = {};
    Object.values(entry.name_value_list).forEach((f) => { fields[f.name] = f.value; });

    return {
      id: fields.id,
      code: fields.name || "",
      title: {
        en: fields.description || fields.name || "",
        fr: fields.name_pillar_fr_c || fields.name || "",
        ar: fields.name_pillar_ar_c || fields.name || "",
      },
    };
  });
}

// 🔹 Fetch all pillars and save
async function fetchAllPillars() {
  const sessionId = await getSessionId();
  const goalIds = await getAllGoals(sessionId); // ✅ Use real IDs
  const allPillars = {};

  for (const goalId of goalIds) {
    console.log("Fetching pillars for goal:", goalId);
    const pillars = await getPillarsByGoal(sessionId, goalId);
    allPillars[goalId] = pillars;
  }

  const fileContent = `export const pillarsData = ${JSON.stringify(allPillars, null, 2)};`;
  fs.writeFileSync("./Data/pillars/data.js", fileContent, "utf-8");
  console.log("✅ Pillars saved to ./Data/pillars/data.js");
}

fetchAllPillars().catch(console.error);
