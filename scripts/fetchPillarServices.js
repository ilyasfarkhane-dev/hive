// scripts/fetchPillarServices.js
import fs from "fs";
import axios from "axios";
import md5 from "md5";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";
const ADMIN_USERNAME = process.env.CRM_ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASS || "admin25";

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

// 🔹 Get all pillars
async function getAllPillars(sessionId) {
  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "ms_pillar",
        query: "",
        order_by: "",
        offset: 0,
        select_fields: ["id", "name"],
        max_results: 100,
        deleted: 0,
      }),
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return resp.data?.entry_list?.map((entry) => {
    const fields = {};
    Object.values(entry.name_value_list).forEach((f) => { fields[f.name] = f.value; });
    return { id: fields.id, name: fields.name };
  }) || [];
}

// 🔹 Get services for a pillar
async function getServicesByPillar(sessionId, pillarId) {
  const relatedFields = [
    "id",
    "name",
    "name_service_ar_c",
    "name_service_fr_c",
    "description",
    "description_service",
    "description_service_fr_c",
    "description_service_ar_c",
  ];

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_pillar",
    module_id: pillarId,
    link_field_name: "ms_pillar_ms_service_1",
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
      id: fields.id, // ✅ include the service ID
      code: fields.name || "", // code or short name
      name_service_ar_c: fields.name_service_ar_c || "",
      name_service_fr_c: fields.name_service_fr_c || "",
      description: fields.description || "",
      description_service: fields.description_service || "",
      description_service_fr_c: fields.description_service_fr_c || "",
      description_service_ar_c: fields.description_service_ar_c || "",
    };
  });
}

// 🔹 Fetch and save all pillar services
async function fetchAllPillarServices() {
  const sessionId = await getSessionId();
  const pillars = await getAllPillars(sessionId);
  const pillarServices = {};

  for (const pillar of pillars) {
    console.log("Fetching services for pillar:", pillar.id);
    const services = await getServicesByPillar(sessionId, pillar.id);
    pillarServices[pillar.id] = services;
  }

  const fileContent = `export const pillarServicesData = ${JSON.stringify(pillarServices, null, 2)};`;
  fs.writeFileSync("./Data/services/pillarServices.js", fileContent, "utf-8");
  console.log("✅ Pillar services saved to ./Data/services/pillarServices.js");
}

fetchAllPillarServices().catch(console.error);
