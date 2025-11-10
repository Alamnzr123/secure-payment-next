import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_API_KEY || '', { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { invoiceId, amount, description, successUrl, cancelUrl } = req.body ?? {};

  try {
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: Record<string, string> = {};

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer: true } });
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Invoice ${invoice.invoiceNumber}` },
            unit_amount: Math.round(Number(invoice.amount) * 100),
          },
          quantity: 1,
        },
      ];
      metadata.invoiceId = invoice.id;
    } else if (amount) {
      const cents = Math.round(Number(amount) * 100);
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: description ?? 'Custom payment' },
            unit_amount: cents,
          },
          quantity: 1,
        },
      ];
      if (description) metadata.description = String(description);
    } else {
      return res.status(400).json({ message: 'invoiceId or amount is required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      metadata,
      success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    return res.status(500).json({ message });
  }
}
