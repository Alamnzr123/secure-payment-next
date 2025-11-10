import type { NextApiRequest, NextApiResponse } from 'next';
// Use global fetch (Node 18+). If not present, instruct user to install node-fetch.
function getFetch(): typeof fetch | undefined {
  return (globalThis as unknown as { fetch?: typeof fetch }).fetch;
}

// This endpoint is only for local testing: it POSTs a dummy event to the webhook endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type = 'checkout.session.completed', invoiceId = null } = req.body ?? {};

  const event = {
    id: `evt_${Date.now()}`,
    type,
    data: {
      object: {
        id: `obj_${Date.now()}`,
        metadata: invoiceId ? { invoiceId } : {},
        payment_status: 'paid',
      },
    },
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/webhook`;

  try {
    const fetchFn = getFetch();
    if (!fetchFn) throw new Error('No fetch available (Node global fetch is required)');
    const r = await fetchFn(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    const text = await r.text();
    return res.status(200).json({ forwarded: true, status: r.status, webhookResponse: text });
  } catch (err: unknown) {
    return res.status(500).json({ message: err instanceof Error ? err.message : 'failed to forward' });
  }
}
