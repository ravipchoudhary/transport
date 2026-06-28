import type { NextApiRequest, NextApiResponse } from 'next';
import { updateDriverRecord, deleteDriverRecord } from '../../../lib/database';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'choudhary-transport-secret-2026';

function authUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, SECRET) as any; } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  const { id } = req.query as { id: string };
  if (req.method === 'PUT') {
    const { driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks } = req.body;
    const result = await updateDriverRecord(user.id, id, driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks);
    if (!result.success) return res.status(404).json({ error: result.message });
    return res.status(200).json(result.record);
  }
  if (req.method === 'DELETE') {
    const result = await deleteDriverRecord(user.id, id);
    if (!result.success) return res.status(404).json({ error: result.message });
    return res.status(200).json({ message: result.message });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
