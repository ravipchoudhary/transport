import type { NextApiRequest, NextApiResponse } from 'next';
import { registerUser } from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { fullName, mobile, email, password, role } = req.body;
  if (!fullName || !mobile || !email || !password) return res.status(400).json({ error: 'All registration fields are required.' });
  const result = await registerUser(fullName, mobile, email, password, role);
  if (!result.success) return res.status(400).json({ error: result.message });
  return res.status(201).json({ message: 'Registration successful!', user: result.user });
}
