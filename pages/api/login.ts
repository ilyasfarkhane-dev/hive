import type { NextApiRequest, NextApiResponse } from "next";
import md5 from "md5";
import { getSessionId, getContactByLogin, getGoals } from "@/utils/crm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { email, password, language = 'en' } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing email or password" });

  try {
    const sessionId = await getSessionId(); // CRM session

    const contactInfo = await getContactByLogin(sessionId, email);
    if (!contactInfo)
      return res.status(404).json({ message: "Contact not found" });

    const goals = await getGoals(sessionId, language);

    const hashedEmail = md5(email);
    return res.status(200).json({ hashedEmail, sessionId, contactInfo, goals });
  } catch (error: any) {
    console.error("CRM error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ message: "CRM request failed", error: error.message });
  }
}
