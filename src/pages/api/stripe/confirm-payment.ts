import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_API_KEY || '', { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { sessionId } = req.body ?? {};
  if (!sessionId) return res.status(400).json({ message: 'sessionId required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId as string, { expand: ['payment_intent'] });
    if (!session || !session.payment_status || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Session not paid' });
    }

    const invoiceId = session.metadata?.invoiceId as string | undefined;
    if (invoiceId) {
      // mark invoice paid and mark any payment link used
      await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'paid' } });
      // mark payment link used if exists
      const link = await prisma.paymentLink.findUnique({ where: { invoiceId } });
      if (link && !link.used) await prisma.paymentLink.update({ where: { token: link.token }, data: { used: true } });
    }

    return res.status(200).json({ message: 'Payment confirmed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    return res.status(500).json({ message });
  }
}
