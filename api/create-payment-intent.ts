import Stripe from 'stripe';

// Use default API version (avoid TS literal mismatches)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
      amount,
      currency = 'usd',
      description = 'Digital Binder Pro purchase',
      receipt_email,
    } = req.body || {};

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be an integer in cents.' });
    }

    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      receipt_email, // <-- this triggers Stripe to email a receipt
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({ clientSecret: pi.client_secret });
  } catch (err: any) {
    console.error('[create-payment-intent] error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
