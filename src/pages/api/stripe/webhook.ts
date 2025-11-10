import type { NextApiRequest, NextApiResponse } from 'next';
// helper to read raw request body without additional packages
const getRawBody = (req: NextApiRequest) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', (err) => reject(err));
  });
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_API_KEY || '', { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const bufStr = await getRawBody(req);

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(bufStr, sig, webhookSecret);
    } else {
      // If no webhook secret set (dev/test), parse body directly
      event = JSON.parse(bufStr);
    }
  } catch (err: unknown) {
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'invalid payload'}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId as string | undefined;
        if (invoiceId) {
          await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'paid' } });
          const link = await prisma.paymentLink.findUnique({ where: { invoiceId } });
          if (link && !link.used) await prisma.paymentLink.update({ where: { token: link.token }, data: { used: true } });
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId as string | undefined;
        if (invoiceId) {
          await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'paid' } });
          const link = await prisma.paymentLink.findUnique({ where: { invoiceId } });
          if (link && !link.used) await prisma.paymentLink.update({ where: { token: link.token }, data: { used: true } });
        }
        break;
      }
      default:
        // ignore other events
        break;
    }
  } catch (err: unknown) {
    return res.status(500).json({ message: err instanceof Error ? err.message : 'internal error' });
  }

  res.json({ received: true });
}
