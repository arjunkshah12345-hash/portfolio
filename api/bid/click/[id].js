import { recordClick, externalUrlFor, readEntries } from '../../../lib/bid/store.js';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (!id) {
    res.statusCode = 400;
    res.end('missing id');
    return;
  }
  // Try to increment, but still redirect even if not found
  const updated = await recordClick(id).catch(() => null);
  if (!updated) {
    // Fallback: try to find any entry to redirect to avoid leaking ids
    const entries = await readEntries();
    const first = entries.find((e) => e.id === id) || entries[0];
    const url = externalUrlFor(first?.url || 'https://arjunshah.xyz');
    res.writeHead(302, { Location: url });
    res.end();
    return;
  }
  const url = externalUrlFor(updated.url);
  res.writeHead(302, { Location: url });
  res.end();
}
