// /pages/api/goals.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";

// 🔹 Utility: fetch ms_goal entries
async function getGoals(sessionId: string) {
  const selectFields = [
    "id",
    "name",             // code like "1"
    "description",      // English title
    "name_goal_fr_c",   // French title
    "name_goal_ar_c"    // Arabic title
  ];

  const restData = JSON.stringify({
    session: sessionId,
    module_name: "ms_goal",
    query: "",
    order_by: "date_entered DESC",
    offset: 0,
    select_fields: selectFields,
    max_results: 50,
  });

  try {
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

      // Extract all fields from API response
      if (entry.name_value_list && typeof entry.name_value_list === "object") {
        Object.entries(entry.name_value_list).forEach(([_, field]: [string, any]) => {
          fields[field.name] = field.value;
        });
      }

      const code = fields.name || "";
      const descFallback = fields.description || "";

      return {
        id: fields.id,
        code,
        title: {
          en: fields.description || code,           // English title
          fr: fields.name_goal_fr_c || code,       // French title
          ar: fields.name_goal_ar_c || code,       // Arabic title
        },
      
      };
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ message: "Missing sessionId in query" });
  }

  try {
    const goals = await getGoals(sessionId);
    res.status(200).json(goals);
  } catch (error: any) {
    console.error("CRM error:", error.message);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
}
