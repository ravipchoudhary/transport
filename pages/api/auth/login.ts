import type { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../lib/database';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const secret = getJwtSecret();
  if (!secret) return res.status(500).json({ error: 'Server authentication is not configured.' });
  const result = await loginUser(email, password);
  if (!result.success || !result.user) return res.status(401).json({ error: result.message || 'Login failed.' });
  const token = jwt.sign({ id: result.user.id, email: result.user.email, role: result.user.role }, secret, { expiresIn: '24h' });
  return res.status(200).json({ message: 'Login successful!', token, user: result.user });
}
