import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: parts } = req.query as { path?: string[] };
  if (!parts || parts.length === 0) return res.status(400).end('Missing asset path');
  const assetPath = path.join(process.cwd(), 'assets', ...parts);
  if (!fs.existsSync(assetPath)) return res.status(404).end('Not found');
  const ext = path.extname(assetPath).toLowerCase();
  const mime: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };
  const contentType = mime[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(assetPath);
  res.setHeader('Content-Type', contentType);
  stream.pipe(res);
}
