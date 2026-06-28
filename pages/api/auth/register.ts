import type { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL env var');
      return res.status(500).json({ error: 'Server misconfiguration: DATABASE_URL is not set.' });
    }

    const { fullName, mobile, email, password, role } = req.body;
    if (!fullName || !mobile || !email || !password) {
      return res.status(400).json({ error: 'Full name, mobile, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();

    const result = await registerUser({
      fullName: fullName.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      password,
      role: role?.trim()
    });

    if (!result.success) {
      return res.status(409).json({ error: result.message });
    }

    return res.status(201).json({ success: true, user: result.user });
  } catch (err: any) {
    console.error('Register API error:', err?.stack || err?.message || err);
    return res.status(500).json({ error: 'Internal server error. Check server logs.' });
  }
}
