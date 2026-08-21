import { getConfig, readEntries, rankEntries } from '../../lib/bid/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method Not Allowed');
    return;
  }
  const cfg = getConfig();
  const entries = rankEntries(await readEntries());
  const claimRank1Cents = entries.length > 0 ? entries[0].bidCents + 100 : cfg.minEnterCents;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      storage: cfg.storage, // 'kv' when live
      maxEntries: cfg.maxEntries,
      takeoverUntil: null,
      takeoverActive: null,
      takeoverPriceCents: cfg.takeoverPriceCents,
      claimRank1Cents,
      minEnterCents: cfg.minEnterCents,
      entries
    })
  );
}
