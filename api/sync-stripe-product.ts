import Stripe from 'stripe';

// No explicit apiVersion — rely on account default to avoid TS literal mismatch
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Expected JSON body:
 * {
 *   name: string,
 *   description?: string,
 *   price: number,         // cents (integer)
 *   currency?: string,     // default 'usd'
 *   productId?: string,    // optional, if you track it
 *   priceId?: string       // optional, if you track it
 * }
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      name,
      description = '',
      price,
      currency = 'usd',
      productId,
      // priceId is ignored here; we always create a new price (Stripe prices are immutable for amount)
    } = req.body || {};

    if (!name || !Number.isInteger(price) || price <= 0) {
      return res.status(400).json({ error: 'Provide valid name and integer price (cents).' });
    }

    // Create or update the product
    const product = productId
      ? await stripe.products.update(productId, { name, description })
      : await stripe.products.create({ name, description });

    // Always create a new price for the current amount/currency
    const newPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency,
    });

    return res.status(200).json({
      stripeProductId: product.id,
      stripePriceId: newPrice.id,
    });
  } catch (err: any) {
    console.error('[sync-stripe-product] error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
