import type { NextApiRequest, NextApiResponse } from 'next';
import { getDriverRecords, addDriverRecord } from '../../../lib/database';
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
  if (req.method === 'GET') return res.status(200).json(await getDriverRecords(user.id));
  if (req.method === 'POST') {
    const { driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks } = req.body;
    if (!driverName || !mobileNumber || !vehicleNumber || !amountGiven || !paymentDate || !paymentType) return res.status(400).json({ error: 'Missing required fields.' });
    const result = await addDriverRecord(user.id, driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks);
    return res.status(201).json(result.record);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
