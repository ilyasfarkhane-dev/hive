import axios from "axios";
import md5 from "md5";
import dotenv from "dotenv";
dotenv.config();

dotenv.config();

const CRM_URL = `${process.env.CRM_BASE_URL}/service/v4_1/rest.php`;
const CRM_USER = process.env.CRM_USERNAME;
const CRM_PASS = process.env.CRM_PASSWORD;
const CRM_APP = process.env.CRM_APPLICATION;

// 1️⃣ Login to CRM
async function login() {
  const response = await axios.post(CRM_URL, {
    method: "login",
    input_type: "JSON",
    response_type: "JSON",
    rest_data: JSON.stringify({
      user_auth: {
        user_name: CRM_USER,
        password: md5(CRM_PASS),
      },
      application_name: CRM_APP,
    }),
  });
  return response.data.id; // session_id
}

// 2️⃣ Get all services
async function getAllServices(sessionId) {
  const response = await axios.post(CRM_URL, {
    method: "get_entry_list",
    input_type: "JSON",
    response_type: "JSON",
    rest_data: JSON.stringify({
      session: sessionId,
      module_name: "Services",
      query: "",
      order_by: "",
      offset: 0,
      select_fields: ["id", "name"],
      link_name_to_fields_array: [],
      max_results: 1000,
      deleted: 0,
    }),
  });

  return response.data.entry_list.map((entry) => ({
    id: entry.name_value_list.id.value,
    name: entry.name_value_list.name.value,
  }));
}

// 3️⃣ Get subservices for a given service
async function getSubservicesByService(serviceId, sessionId) {
  const response = await axios.post(CRM_URL, {
    method: "get_relationships",
    input_type: "JSON",
    response_type: "JSON",
    rest_data: JSON.stringify({
      session: sessionId,
      module_name: "Services",
      module_id: serviceId,
      link_field_name: "ms_service_ms_subservice_1",
      related_module_query: "",
      related_fields: [
        "id",
        "name",
        "name_ar_c",
        "name_fr_c",
        "description",
        "description_subservice",
        "description_subservice_ar_c",
        "description_subservice_fr_c",
      ],
      related_module_link_name_to_fields_array: [],
      deleted: 0,
    }),
  });

  return response.data.entry_list.map((item) => {
    const f = item.name_value_list;
    return {
      id: f.id.value,
      name: f.name?.value || "",
      name_ar_c: f.name_ar_c?.value || "",
      name_fr_c: f.name_fr_c?.value || "",
      description: f.description?.value || "",
      description_subservice: f.description_subservice?.value || "",
      description_subservice_ar_c: f.description_subservice_ar_c?.value || "",
      description_subservice_fr_c: f.description_subservice_fr_c?.value || "",
    };
  });
}

// 4️⃣ Main function
(async () => {
  try {
    const sessionId = await login();
    const services = await getAllServices(sessionId);

    const result = {};

    for (const service of services) {
      const subservices = await getSubservicesByService(service.id, sessionId);
      result[service.id] = subservices;
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
})();


