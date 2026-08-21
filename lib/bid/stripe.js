// Stripe client factory — keeps secrets isolated and avoids global mutation.
export async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Lazy import so local/demo without stripe does not crash
  const StripeClient = (await import('stripe')).default;
  // Use the latest Stripe API version noted in the request spec.
  const client = new StripeClient(key, {
    apiVersion: '2026-03-25.dahlia'
  });
  return client;
}
