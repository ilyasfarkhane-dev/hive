// /pages/api/pillars.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";

// 🔹 Get pillars for a goal
async function getPillarsByGoal(sessionId: string, goalId: string) {
  const relatedFields = [
    "id",
    "name",
    "description",
    "name_pillar_fr_c",
    "name_pillar_ar_c"
  ];

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

  return entryList.map((entry: any) => {
    const fields: Record<string, string> = {};
    Object.values(entry.name_value_list).forEach((field: any) => {
      fields[field.name] = field.value;
    });

    return {
      id: fields.id,
      code: fields.name || "",
      title: {
        en: fields.description || fields.name || "",
        fr: fields.name_pillar_fr_c || fields.name || "",
        ar: fields.name_pillar_ar_c || fields.name || "",
      }
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { goalId, sessionId } = req.query;
  if (!goalId || typeof goalId !== "string") {
    return res.status(400).json({ message: "Missing goalId" });
  }
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ message: "Missing sessionId" });
  }

  try {
    const pillars = await getPillarsByGoal(sessionId, goalId);
    res.status(200).json(pillars);
  } catch (error: any) {
    console.error("CRM error:", error.message);
    res.status(500).json({ message: "Failed to fetch pillars" });
  }
}
