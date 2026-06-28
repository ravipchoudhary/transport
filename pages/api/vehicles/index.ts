import type { NextApiRequest, NextApiResponse } from 'next';
import { getVehicles, addVehicle } from '../../../lib/database';
import { getAuthenticatedUser } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  if (req.method === 'GET') return res.status(200).json(await getVehicles(user.id));
  if (req.method === 'POST') {
    const { vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks } = req.body;
    if (!vehicleNumber || !vehicleType || !ownerName) return res.status(400).json({ error: 'Missing required fields.' });
    const payload = {
      vehicleNumber,
      vehicleType,
      ownerName,
      rcDocument: typeof rcDocument === 'string' && rcDocument ? rcDocument : null,
      roadTaxExpiry: typeof roadTaxExpiry === 'string' && roadTaxExpiry ? roadTaxExpiry : null,
      insuranceExpiry: typeof insuranceExpiry === 'string' && insuranceExpiry ? insuranceExpiry : null,
      pucExpiry: typeof pucExpiry === 'string' && pucExpiry ? pucExpiry : null,
      fitnessExpiry: typeof fitnessExpiry === 'string' && fitnessExpiry ? fitnessExpiry : null,
      permitExpiry: typeof permitExpiry === 'string' && permitExpiry ? permitExpiry : null,
      remarks: typeof remarks === 'string' && remarks ? remarks : null,
    };
    const result = await addVehicle(user.id, payload.vehicleNumber, payload.vehicleType, payload.ownerName, payload.rcDocument, payload.roadTaxExpiry, payload.insuranceExpiry, payload.pucExpiry, payload.fitnessExpiry, payload.permitExpiry, payload.remarks);
    return res.status(201).json(result.vehicle);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Access denied.' });
  if (req.method === 'GET') return res.status(200).json(await getVehicles(user.id));
  if (req.method === 'POST') {
    const { vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks } = req.body;
    if (!vehicleNumber || !vehicleType || !ownerName) return res.status(400).json({ error: 'Missing required fields.' });
    const payload = {
      vehicleNumber,
      vehicleType,
      ownerName,
      rcDocument: typeof rcDocument === 'string' && rcDocument ? rcDocument : null,
      roadTaxExpiry: typeof roadTaxExpiry === 'string' && roadTaxExpiry ? roadTaxExpiry : null,
      insuranceExpiry: typeof insuranceExpiry === 'string' && insuranceExpiry ? insuranceExpiry : null,
      pucExpiry: typeof pucExpiry === 'string' && pucExpiry ? pucExpiry : null,
      fitnessExpiry: typeof fitnessExpiry === 'string' && fitnessExpiry ? fitnessExpiry : null,
      permitExpiry: typeof permitExpiry === 'string' && permitExpiry ? permitExpiry : null,
      remarks: typeof remarks === 'string' && remarks ? remarks : null,
    };
    const result = await addVehicle(user.id, payload.vehicleNumber, payload.vehicleType, payload.ownerName, payload.rcDocument, payload.roadTaxExpiry, payload.insuranceExpiry, payload.pucExpiry, payload.fitnessExpiry, payload.permitExpiry, payload.remarks);
    return res.status(201).json(result.vehicle);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
