import type { NextApiRequest, NextApiResponse } from 'next';
import { getDriverProfiles, addDriverProfile } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  if (req.method === 'GET') return res.status(200).json(await getDriverProfiles(user.id));
  if (req.method === 'POST') {
    const { driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks } = req.body;
    if (!driverName || !mobileNumber) return res.status(400).json({ error: 'Missing required fields.' });
    const sanitizedAadhaarNumber = typeof aadhaarNumber === 'string' && aadhaarNumber.length <= 12 ? aadhaarNumber : null;
    const sanitizedAadhaarPhoto = typeof aadhaarPhoto === 'string' && aadhaarPhoto.length <= 500 ? aadhaarPhoto : null;
    const sanitizedLicensePhoto = typeof licensePhoto === 'string' && licensePhoto.length <= 500 ? licensePhoto : null;
    const sanitizedDriverPhoto = typeof driverPhoto === 'string' && driverPhoto.length <= 500 ? driverPhoto : null;
    const result = await addDriverProfile(user.id, driverName, mobileNumber, address, sanitizedAadhaarNumber, sanitizedAadhaarPhoto, licenseNumber, sanitizedLicensePhoto, sanitizedDriverPhoto, assignedVehicleNumber, joiningDate, remarks);
    return res.status(201).json(result.profile);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
