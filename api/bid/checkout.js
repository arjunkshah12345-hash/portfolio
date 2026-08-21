import { getConfig, formatUsd, normalizeUrlOrHandle } from '../../lib/bid/store.js';
import { getStripe } from '../../lib/bid/stripe.js';

function bad(res, msg, code = 400) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: msg }));
}

function randomLetters(n) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }
  const body = await readJson(req).catch(() => null);
  if (!body) return bad(res, 'invalid json');
  const { url, title, description, email, bidCents, targetRank, takeover } = body;
  const cfg = getConfig();
  const cents = Number(bidCents || 0);
  if (!url || !title || !description || !email) return bad(res, 'missing required fields');
  if (!Number.isFinite(cents) || cents < cfg.minEnterCents) {
    return bad(res, `bid must be at least ${formatUsd(cfg.minEnterCents)}`);
  }

  const stripe = await getStripe();
  const amount = takeover ? cfg.takeoverPriceCents : cents;

  if (!stripe) {
    // Demo mode: pretend to create a session, return a local redirect that shows demo mode
    return res
      .writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      .end(JSON.stringify({ url: `/bid?demo=1` }));
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: absoluteUrl(req, '/bid?paid=1'),
    cancel_url: absoluteUrl(req, '/bid?canceled=1'),
    integration_identifier: `bid-arjun-${randomLetters(8)}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: {
            name: takeover ? 'Takeover #1 — arjunshah.xyz/bid (3 hours)' : 'Bid on arjunshah.xyz/bid',
            description: takeover
              ? 'Own rank #1 for 3 hours'
              : `Your listing will be inserted by bid amount`
          }
        }
      }
    ],
    // Put listing info on the session for the webhook to read
    metadata: {
      url: normalizeUrlOrHandle(url),
      title: String(title).slice(0, 80),
      description: String(description).slice(0, 280),
      email: String(email).slice(0, 120),
      bidCents: String(cents),
      targetRank: targetRank ? String(targetRank) : '',
      takeover: takeover ? '1' : '0'
    }
  });

  res
    .writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    .end(JSON.stringify({ url: session.url }));
}

async function readJson(req) {
  const buf = await rawBody(req);
  const str = buf.toString('utf8');
  return JSON.parse(str);
}

function absoluteUrl(req, path) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'arjunshah.xyz';
  return `${proto}://${host}${path}`;
}

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
