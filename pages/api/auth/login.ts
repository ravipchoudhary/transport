import type { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../lib/database';
import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'choudhary-transport-secret-2026';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Validate critical environment
    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL env var');
      return res.status(500).json({ error: 'Server misconfiguration: DATABASE_URL is not set.' });
    }
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET in production');
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is required in production.' });
    }

    // Quick DB connectivity check — fail fast with a clear message
    try {
      await prisma.$queryRawUnsafe('SELECT 1');
    } catch (dbErr) {
      console.error('Prisma connectivity error:', (dbErr as any)?.stack ? (dbErr as any).stack : String(dbErr));
      return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
    }

    const { email, username, password } = req.body;
    const loginId = email?.trim().toLowerCase() || username?.trim();
    if (!loginId || !password) return res.status(400).json({ error: 'Email/username and password are required.' });

    const result = await loginUser(loginId, password);
    if (!result.success || !result.user) return res.status(401).json({ error: result.message || 'Login failed.' });

    const token = jwt.sign({ id: result.user.id, email: result.user.email, role: result.user.role }, SECRET, { expiresIn: '24h' });
    return res.status(200).json({ message: 'Login successful!', token, user: result.user });
  } catch (err: any) {
    console.error('Login API error:', (err as any)?.stack ? (err as any).stack : String(err));
    return res.status(500).json({ error: 'Internal server error. Check server logs.' });
  }
}
