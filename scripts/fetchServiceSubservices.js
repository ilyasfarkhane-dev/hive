// scripts/fetchServiceSubservices.js
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

// 🔹 Get all services
async function getAllServices(sessionId) {
  const resp = await axios.post(
    CRM_REST_URL,
    new URLSearchParams({
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: sessionId,
        module_name: "ms_service",
        query: "",
        order_by: "",
        offset: 0,
        select_fields: [
          "id", 
          "name",
          "name_ar_c",
          "name_fr_c", 
          "name_en_c",
          "description",
          "description_ar_c",
          "description_fr_c",
          "description_en_c",
          "description_service",
          "description_service_ar_c",
          "description_service_fr_c",
          "description_service_en_c"
        ],
        max_results: 100,
        deleted: 0,
      }),
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return resp.data?.entry_list?.map((entry) => {
    const fields = {};
    Object.values(entry.name_value_list).forEach((f) => {
      fields[f.name] = f.value;
    });
    return { 
      id: fields.id, 
      name: fields.name,
      // Multilingual name fields
      name_ar_c: fields.name_ar_c,
      name_fr_c: fields.name_fr_c,
      name_en_c: fields.name_en_c,
      // Multilingual description fields
      description: fields.description,
      description_ar_c: fields.description_ar_c,
      description_fr_c: fields.description_fr_c,
      description_en_c: fields.description_en_c,
      // Multilingual service description fields
      description_service: fields.description_service,
      description_service_ar_c: fields.description_service_ar_c,
      description_service_fr_c: fields.description_service_fr_c,
      description_service_en_c: fields.description_service_en_c,
    };
  }) || [];
}

// 🔹 Get sub-services for a service
async function getSubServicesByService(sessionId, serviceId) {
  const relatedFields = [
    "id",
    "name",
    "name_ar_c",
    "name_fr_c",
    "name_en_c",
    "description",
    "description_ar_c",
    "description_fr_c", 
    "description_en_c",
    "description_subservice",
    "description_subservice_ar_c",
    "description_subservice_fr_c",
    "description_subservice_en_c",
  ];

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_service",
    module_id: serviceId,
    link_field_name: "ms_service_ms_subservice_1", // adjust if your link is different
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
      name: fields.name,
      // Multilingual name fields
      name_ar_c: fields.name_ar_c,
      name_fr_c: fields.name_fr_c,
      name_en_c: fields.name_en_c,
      // Multilingual description fields
      description: fields.description,
      description_ar_c: fields.description_ar_c,
      description_fr_c: fields.description_fr_c,
      description_en_c: fields.description_en_c,
      // Multilingual subservice description fields
      description_subservice: fields.description_subservice,
      description_subservice_ar_c: fields.description_subservice_ar_c,
      description_subservice_fr_c: fields.description_subservice_fr_c,
      description_subservice_en_c: fields.description_subservice_en_c,
    };
  });
}

// 🔹 Fetch all sub-services for all services
async function fetchAllSubServices() {
  const sessionId = await getSessionId();
  const services = await getAllServices(sessionId);
  const serviceSubservices = {};

  for (const service of services) {
    console.log("Fetching sub-services for service:", service.id);
    const subservices = await getSubServicesByService(sessionId, service.id);
    serviceSubservices[service.id] = subservices;
  }

  const fileContent = `export const serviceSubservicesData = ${JSON.stringify(serviceSubservices, null, 2)};`;
  fs.writeFileSync("./Data/sub-service/data.ts", fileContent, "utf-8");
  console.log("✅ Sub-services saved to ./Data/sub-service/data.ts");
}

fetchAllSubServices().catch(console.error);
