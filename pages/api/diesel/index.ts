import type { NextApiRequest, NextApiResponse } from 'next';
import { getDieselEntries, addDieselEntry } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied. Authentication token missing or invalid.' });

  if (req.method === 'GET') {
    const data = await getDieselEntries(user.id);
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { driverName, vehicleNumber, quantity, rate, date, givenBy, remarks } = req.body;
    if (!driverName || !vehicleNumber || !quantity || !rate || !date || !givenBy) return res.status(400).json({ error: 'Missing required fields.' });
    const result = await addDieselEntry(user.id, driverName, vehicleNumber, quantity, rate, date, givenBy, remarks);
    return res.status(201).json(result.entry);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
