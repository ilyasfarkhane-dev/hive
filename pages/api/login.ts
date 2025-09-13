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
   
    if (
      !contactInfo ||
      !contactInfo.password_c ||
      contactInfo.portal_access_c !== "1" ||
      contactInfo.password_c !== password
    ) {
      return res.status(404).json({ message: "Contact not found or access denied" });
    }

    console.log('=== DEBUG: Login Success - Contact Info ===');
    console.log('Contact ID:', contactInfo.id);
    console.log('Full Name:', contactInfo.first_name, contactInfo.last_name);
    console.log('Email:', contactInfo.email1);
    console.log('Phone Work:', contactInfo.phone_work);
    console.log('Phone Mobile:', contactInfo.phone_mobile);
    console.log('Title:', contactInfo.title);
    console.log('Department:', contactInfo.department);
    console.log('Primary Address:', {
      street: contactInfo.primary_address_street,
      city: contactInfo.primary_address_city,
      state: contactInfo.primary_address_state,
      postalcode: contactInfo.primary_address_postalcode,
      country: contactInfo.primary_address_country
    });
    console.log('Portal Access:', contactInfo.portal_access_c);
    console.log('Date Entered:', contactInfo.date_entered);
    console.log('Date Modified:', contactInfo.date_modified);
    console.log('==========================================');

    const goals = await getGoals(sessionId, language);

    // Remove sensitive information before sending to client
    // Never store passwords in localStorage for security reasons
    const { password_c, ...safeContactInfo } = contactInfo;

    const hashedEmail = md5(email);
    return res.status(200).json({ hashedEmail, sessionId, contactInfo: safeContactInfo, goals });
  } catch (error: any) {
    console.error("CRM error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ message: "CRM request failed", error: error.message });
  }
}
