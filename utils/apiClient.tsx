import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import md5 from 'md5';

const CRM_REST_URL = "http://3.145.21.11/service/v4_1/rest.php";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

  try {
    const hashedPassword = md5(password);

    const restData = JSON.stringify({
      user_auth: { user_name: username, password: hashedPassword },
      application_name: "MyApp",
    });

    const { data } = await axios.post(
      CRM_REST_URL,
      new URLSearchParams({
        method: "login",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: restData,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (data && data.id) {
      return res.status(200).json({ sessionId: data.id });
    } else {
      return res.status(401).json({ message: 'Invalid username or password', raw: data });
    }
  } catch (error: any) {
    console.error('CRM REST login error:', error.message || error);
    return res.status(500).json({ message: 'CRM login failed', error: error.message });
  }
}
