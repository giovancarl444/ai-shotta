import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), '..', 'data', 'snipingQueue.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'No queue file found.' });
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const queue = JSON.parse(raw);

  // You can filter or sort here if needed
  const results = queue
    .filter(t => t.status !== 'pending') // hide raw unprocessed tokens
    .map(t => ({
      token: t.token,
      address: t.address,
      score: t.score,
      roi: t.simulatedROI,
      result: t.snipeResult || t.status,
      autoBuy: !!t.autoBuy,
      source: t.source,
      detectedAt: t.detectedAt,
    }));

  res.status(200).json(results);
}
