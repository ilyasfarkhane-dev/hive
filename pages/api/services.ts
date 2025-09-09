// /pages/api/services.ts
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

// 🔹 Get services for a pillar
async function getServicesByPillar(sessionId: string, pillarId: string) {
  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_pillar",
    module_id: pillarId,
    link_field_name: "ms_pillar_ms_service_1", // 🔥 replace with actual relationship link name
    related_module_query: "",
    related_fields: ["id", "name", "description", "description_service"], // update with service fields
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
    return {
      id: fields.id,
      title: fields.name,
      desc: fields.description,
      description_service: fields.description_service,
    };
  });
}

// 🔹 API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { pillarId } = req.query;
  if (!pillarId || typeof pillarId !== "string") {
    return res.status(400).json({ message: "Missing pillarId" });
  }

  try {
    const sessionId = await getSessionId();
    const services = await getServicesByPillar(sessionId, pillarId);
    res.status(200).json(services);
  } catch (error: any) {
    console.error("CRM error:", error.message);
    res.status(500).json({ message: "Failed to fetch services" });
  }
}
