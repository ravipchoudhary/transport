import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { loginUser } from '../../../lib/database';

const SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL env var');
      return res.status(500).json({ error: 'Server misconfiguration: DATABASE_URL is not set.' });
    }

    if (!SECRET) {
      console.error('Missing JWT_SECRET env var');
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
    }

    const { emailOrMobile, email, mobile, username, password } = req.body;
    const identifier = (emailOrMobile || email || mobile || username)?.trim();
    const normalizedIdentifier = identifier?.toLowerCase();
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';

    if (!normalizedIdentifier || !trimmedPassword) {
      return res.status(400).json({ success: false, message: 'Email/mobile and password are required' });
    }

    const result = await loginUser(normalizedIdentifier, trimmedPassword);
    if (!result.success || !result.user) {
      return res.status(401).json({ error: result.message || 'Invalid email/mobile or password.' });
    }

    const token = jwt.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ success: true, token, user: result.user });
  } catch (err: any) {
    console.error('Login API error:', err?.stack || err?.message || err);
    return res.status(500).json({ error: 'Internal server error. Check server logs.' });
  }
}
