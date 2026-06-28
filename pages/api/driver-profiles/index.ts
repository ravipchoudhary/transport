import type { NextApiRequest, NextApiResponse } from 'next';
import { getDriverProfiles, addDriverProfile } from '../../../lib/database';
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
  if (req.method === 'GET') return res.status(200).json(await getDriverProfiles(user.id));
  if (req.method === 'POST') {
    const { driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks } = req.body;
    if (!driverName || !mobileNumber) return res.status(400).json({ error: 'Missing required fields.' });
    const result = await addDriverProfile(user.id, driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks);
    return res.status(201).json(result.profile);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
