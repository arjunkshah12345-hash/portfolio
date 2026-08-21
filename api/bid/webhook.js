import { getStripe } from '../../lib/bid/stripe.js';
import { upsertListing } from '../../lib/bid/store.js';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  const stripe = await getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    res.statusCode = 200;
    res.end('ignored (demo)');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const raw = await rawBody(req);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch (err) {
    res.statusCode = 400;
    res.end(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const md = session.metadata || {};
    const bidCents = Number(md.bidCents || 0);
    await upsertListing({
      url: md.url,
      title: md.title,
      description: md.description,
      email: md.email,
      bidCents
    });
  }

  res.statusCode = 200;
  res.end('ok');
}

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
