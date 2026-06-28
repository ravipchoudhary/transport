import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  return secret && secret.trim() ? secret : null;
}

export function getAuthenticatedUser(req: NextApiRequest) {
  const secret = getJwtSecret();
  if (!secret) return null;

  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string') return null;
    if (typeof payload.id !== 'string' || !payload.id) return null;
    return payload as { id: string; email?: string; role?: string };
  } catch {
    return null;
  }
}
