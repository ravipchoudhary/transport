import type { NextApiRequest, NextApiResponse } from 'next';
import { getDriverRecords, addDriverRecord } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  if (req.method === 'GET') return res.status(200).json(await getDriverRecords(user.id));
  if (req.method === 'POST') {
    const { driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks } = req.body;
    if (!driverName || !mobileNumber || !vehicleNumber || !amountGiven || !paymentDate || !paymentType) return res.status(400).json({ error: 'Missing required fields.' });
    const amount = Number(amountGiven);
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: 'Amount given must be a non-negative number.' });
    const result = await addDriverRecord(user.id, driverName, mobileNumber, vehicleNumber, amount, paymentDate, paymentType, remarks);
    return res.status(201).json(result.record);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
