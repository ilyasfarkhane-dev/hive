// /pages/api/subservices.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import md5 from "md5";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";
const ADMIN_USERNAME = process.env.CRM_ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASS || "admin25";

// 🔹 Get session id
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

// 🔹 Get sub-services for a service (language-aware)
async function getSubServicesByService(
  sessionId: string,
  serviceId: string,
  language: string = 'en'
) {
  // Choose fields by language (include base name/description for fallback)
  let relatedFields: string[];
  switch (language) {
    case 'fr':
      relatedFields = [
        "id",
        "name",
        "description",
        "name_subservice_fr_c",
        "description_subservice_fr_c",
        "description_subservice",
      ];
      break;
    case 'ar':
      relatedFields = [
        "id",
        "name",
        "name_ar_c",
        "description_subservice_ar_c",
      ];
      break;
    case 'en':
    default:
      relatedFields = ["id", "name", "description", "description_subservice"];
      break;
  }

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_service", // Parent module
    module_id: serviceId,
    link_field_name: "ms_service_ms_subservice_1", // 🔥 replace with your actual relationship link
    related_module_query: "",
    related_fields: relatedFields, // language-based
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
  return entryList.map((entry: any) => {
    const fields: Record<string, string> = {};
    Object.values(entry.name_value_list).forEach((field: any) => {
      fields[field.name] = field.value;
    });

    // Map localized fields with sensible fallbacks
    let title = '';
    let desc = '';
    switch (language) {
      case 'fr':
        title = fields.name_subservice_fr_c || fields.name || '';
        desc = fields.description_subservice_fr_c || fields.description_subservice || fields.description || '';
        break;
      case 'ar':
        title = fields.name_subservice_ar_c || fields.name || '';
        desc = fields.description_subservice_ar_c || fields.description_subservice || fields.description || '';
        break;
      case 'en':
      default:
        title = fields.name || '';
        desc = fields.description || fields.description_subservice || '';
        break;
    }

    return {
      id: fields.id,
      title,
      desc,
      description_subservice: fields.description_subservice,
    };
  });
}

// 🔹 API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { serviceId, language = 'en' } = req.query;
  if (!serviceId || typeof serviceId !== "string") {
    return res.status(400).json({ message: "Missing serviceId" });
  }

  try {
    const sessionId = await getSessionId();
    const subServices = await getSubServicesByService(sessionId, serviceId, language as string);
    res.status(200).json(subServices);
  } catch (error: any) {
    console.error("CRM error:", error.message);
    res.status(500).json({ message: "Failed to fetch sub-services" });
  }
}
