// /pages/api/goals.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";


const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";


// 🔹 Utility: fetch ms_goal entries
async function getGoals(sessionId: string, language: string = 'en') {
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

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_goal", // your custom module
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
  return entryList.map((entry: any) => {
    const fields: Record<string, string> = {};
    Object.values(entry.name_value_list).forEach((field: any) => {
      fields[field.name] = field.value;
    });
    
    // Map the description field based on language
    let descriptionField: string;
    switch (language) {
      case 'fr':
        descriptionField = fields.name_goal_fr_c || fields.description || '';
        break;
      case 'ar':
        descriptionField = fields.name_goal_ar_c || fields.description || '';
        break;
      case 'en':
      default:
        descriptionField = fields.description || '';
        break;
    }
    
    return {
      id: fields.id,
      title: fields.name,
      desc: descriptionField,
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  const sessionId = req.query.sessionId as string;
  const language = req.query.language as string || 'en';

  if (!sessionId) {
    return res.status(400).json({ message: "Missing sessionId in query" });
  }

  try {
    const goals = await getGoals(sessionId, language);
    res.status(200).json(goals);
  } catch (error: any) {
    console.error("CRM error:", error.message);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
}

