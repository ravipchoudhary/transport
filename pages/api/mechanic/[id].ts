import type { NextApiRequest, NextApiResponse } from 'next';
import { updateMechanicExpense, deleteMechanicExpense } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  const { id } = req.query as { id: string };
  if (req.method === 'PUT') { const { mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks } = req.body; if (!mechanicName || !vehicleNumber || !workDescription || !amountPaid || !date || !paidBy) return res.status(400).json({ error: 'Missing required fields.' }); const result = await updateMechanicExpense(user.id, id, mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks); if (!result.success) return res.status(404).json({ error: result.message }); return res.status(200).json(result.expense); }
  if (req.method === 'DELETE') { const result = await deleteMechanicExpense(user.id, id); if (!result.success) return res.status(404).json({ error: result.message }); return res.status(200).json({ message: result.message }); }
  return res.status(405).json({ error: 'Method not allowed' });
}
