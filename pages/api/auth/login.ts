import type { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../../lib/database';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'choudhary-transport-secret-2026';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
  const result = await loginUser(username, password);
  if (!result.success) return res.status(401).json({ error: result.message });
  const token = jwt.sign({ id: result.user.id, email: result.user.email, role: result.user.role }, SECRET, { expiresIn: '24h' });
  return res.status(200).json({ message: 'Login successful!', token, user: result.user });
}
