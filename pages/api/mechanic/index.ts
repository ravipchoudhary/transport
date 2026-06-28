import type { NextApiRequest, NextApiResponse } from 'next';
import { getMechanicExpenses, addMechanicExpense } from '../../../lib/database';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'choudhary-transport-secret-2026';

function authUser(req: NextApiRequest) { const authHeader = req.headers.authorization as string | undefined; const token = authHeader && authHeader.split(' ')[1]; if (!token) return null; try { return jwt.verify(token, SECRET) as any; } catch { return null; } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  if (req.method === 'GET') { const data = await getMechanicExpenses(user.id); return res.status(200).json(data); }
  if (req.method === 'POST') { const { mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks } = req.body; if (!mechanicName || !vehicleNumber || !workDescription || !amountPaid || !date || !paidBy) return res.status(400).json({ error: 'Missing required fields.' }); const result = await addMechanicExpense(user.id, mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks); return res.status(201).json(result.expense); }
  return res.status(405).json({ error: 'Method not allowed' });
}
