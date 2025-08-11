import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, description, price, currency, productId, priceId } = req.body;

    if (!name || !price || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let product;

    if (productId) {
      // Update existing product
      product = await stripe.products.update(productId, {
        name,
        description,
      });
    } else {
      // Create new product
      product = await stripe.products.create({
        name,
        description,
      });
    }

    let newPrice;

    if (priceId) {
      // Create a new price if amount changed
      newPrice = await stripe.prices.create({
        unit_amount: price,
        currency,
        product: product.id,
      });
    } else {
      // First time creating price
      newPrice = await stripe.prices.create({
        unit_amount: price,
        currency,
        product: product.id,
      });
    }

    return res.status(200).json({
      stripeProductId: product.id,
      stripePriceId: newPrice.id,
    });

  } catch (err: any) {
    console.error('Stripe sync error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
