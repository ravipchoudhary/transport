import type { NextApiRequest, NextApiResponse } from 'next';
import { updateDieselEntry, deleteDieselEntry } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied. Authentication token missing or invalid.' });
  const { id } = req.query as { id: string };

  if (req.method === 'PUT') {
    const { driverName, vehicleNumber, quantity, rate, date, givenBy, remarks } = req.body;
    if (!driverName || !vehicleNumber || !date || !givenBy) return res.status(400).json({ error: 'Missing required fields.' });
    const qty = Number(quantity);
    const rt = Number(rate);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(rt) || rt <= 0) return res.status(400).json({ error: 'Quantity and rate must be positive numbers.' });
    const result = await updateDieselEntry(user.id, id, driverName, vehicleNumber, qty, rt, date, givenBy, remarks);
    if (!result.success) return res.status(404).json({ error: result.message });
    return res.status(200).json(result.entry);
  }

  if (req.method === 'DELETE') {
    const result = await deleteDieselEntry(user.id, id);
    if (!result.success) return res.status(404).json({ error: result.message });
    return res.status(200).json({ message: result.message });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
