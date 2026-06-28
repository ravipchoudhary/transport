import type { NextApiRequest, NextApiResponse } from 'next';
import { getMechanicExpenses, addMechanicExpense } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  if (req.method === 'GET') { const data = await getMechanicExpenses(user.id); return res.status(200).json(data); }
  if (req.method === 'POST') { const { mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks } = req.body; if (!mechanicName || !vehicleNumber || !workDescription || !amountPaid || !date || !paidBy) return res.status(400).json({ error: 'Missing required fields.' }); const amount = Number(amountPaid); if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Amount paid must be a positive number.' }); const result = await addMechanicExpense(user.id, mechanicName, vehicleNumber, workDescription, partsUsed, amount, date, paidBy, remarks); return res.status(201).json(result.expense); }
  return res.status(405).json({ error: 'Method not allowed' });
}
