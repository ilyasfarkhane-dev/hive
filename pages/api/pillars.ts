// /pages/api/pillars.ts
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

// 🔹 Get pillars for a goal
async function getPillarsByGoal(sessionId: string, goalId: string, language: string = 'en') {
  // Determine which fields to select based on language
  let relatedFields: string[];
  switch (language) {
    case 'fr':
      relatedFields = ["id", "name", "name_pillar_fr_c"];
      break;
    case 'ar':
      relatedFields = ["id", "name", "name_pillar_ar_c"];
      break;
    case 'en':
    default:
      relatedFields = ["id", "name", "description"];
      break;
  }

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_goal",
    module_id: goalId,
    link_field_name: "ms_goal_ms_pillar_1", // 🔥 replace with actual relationship link name
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
  return entryList.map((entry: any) => {
    const fields: Record<string, string> = {};
    Object.values(entry.name_value_list).forEach((field: any) => {
      fields[field.name] = field.value;
    });
    
    // Map the description field based on language
    let descriptionField: string;
    switch (language) {
      case 'fr':
        descriptionField = fields.name_pillar_fr_c || fields.description || '';
        break;
      case 'ar':
        descriptionField = fields.name_pillar_ar_c || fields.description || '';
        break;
      case 'en':
      default:
        descriptionField = fields.description || '';
        break;
    }
    
    return {
      id: fields.id,
      name: fields.name,
      description: descriptionField,
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { goalId, language = 'en' } = req.query;
  if (!goalId || typeof goalId !== "string") {
    return res.status(400).json({ message: "Missing goalId" });
  }

  console.log('Pillars API - GoalId:', goalId, 'Language:', language);

  try {
    const sessionId = await getSessionId();
    const pillars = await getPillarsByGoal(sessionId, goalId, language as string);
    console.log('Pillars fetched successfully:', pillars.length, 'pillars for language:', language);
    res.status(200).json(pillars);
  } catch (error: any) {
    console.error("CRM error:", error.message);
    res.status(500).json({ message: "Failed to fetch pillars" });
  }
}
