import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = getJwtSecret();
  if (!secret) return res.status(500).json({ error: 'Server authentication is not configured.' });
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. Authentication token missing.' });
  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Session expired or invalid token.' });
    res.status(200).json({ valid: true, user });
  });
}
