import type { NextApiRequest, NextApiResponse } from 'next';
import { updateChallan, deleteChallan } from '../../../lib/database';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'choudhary-transport-secret-2026';

function authUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as any;
  } catch (e) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied. Authentication token missing or invalid.' });
  const { id } = req.query as { id: string };

  if (req.method === 'PUT') {
    const { challanNo, dealerName, date, totalBags, riceBags, wheatBags, ratePerBag, vehicleNumber, driverName, scannedData } = req.body;
    if (!challanNo || !dealerName || !date) return res.status(400).json({ error: 'Challan number, dealer name, and date are required for updates.' });
    const result = await updateChallan(user.id, id, challanNo, dealerName, date, riceBags, wheatBags, totalBags, ratePerBag, vehicleNumber, driverName, scannedData);
    if (!result.success) return res.status(404).json({ error: result.message });
    return res.status(200).json(result.challan);
  }

  if (req.method === 'DELETE') {
    const result = await deleteChallan(user.id, id);
    if (!result.success) return res.status(404).json({ error: result.message });
    return res.status(200).json({ message: result.message });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
