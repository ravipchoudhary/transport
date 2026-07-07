import type { NextApiRequest, NextApiResponse } from 'next';
import { getChallans, addChallan } from '../../../lib/database';
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

  if (req.method === 'GET') {
    const data = await getChallans(user.id);
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { challanNo, dealerName, date, totalBags, riceBags, wheatBags, ratePerBag, vehicleNumber, driverName, scannedData } = req.body;
    if (!challanNo || !dealerName || !date) return res.status(400).json({ error: 'Challan number, dealer name, and date are required.' });
    const result = await addChallan(user.id, challanNo, dealerName, date, riceBags, wheatBags, totalBags, ratePerBag, vehicleNumber, driverName, scannedData);
    return res.status(201).json(result.challan);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
