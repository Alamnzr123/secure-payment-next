import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    paymentLink: {
      findUnique: vi.fn(),
    },
  },
}));

import handler from '../../src/pages/api/payment-links/[token]';

function makeReqRes(qToken: string) {
  const req: Partial<NextApiRequest> = { query: { token: qToken }, method: 'GET' };
  let statusCode = 200;
  let body: unknown = null;
  const res: Partial<NextApiResponse> = {};
  res.status = (code: number) => { statusCode = code; return res as NextApiResponse; };
  res.json = (p: unknown) => { body = p; return res as NextApiResponse; };
  res.setHeader = (name: string, value: string | number | string[]) => { void name; void value; return res as NextApiResponse; };
  res.end = (() => res) as unknown as NextApiResponse['end'];

  return { req: req as NextApiRequest, res: res as NextApiResponse, get body() { return body; }, get status() { return statusCode; } };
}

describe('payment-links DB paths (mocked prisma)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 404 when link not found', async () => {
  const prismaModule = await import('@/lib/prisma');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = prismaModule.prisma as any;
  prisma.paymentLink.findUnique.mockResolvedValue(null);

    const wrapper = makeReqRes('token-not-found');
    await handler(wrapper.req, wrapper.res);
    expect(wrapper.status).toBe(404);
    const body = wrapper.body as { message?: string } | null;
    expect(body?.message).toBe('Payment link not found');
  });

  it('returns 410 when link is used', async () => {
  const prismaModule = await import('@/lib/prisma');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = prismaModule.prisma as any;
  const link = { token: 't1', used: true, expiresAt: new Date(Date.now() + 1000 * 60), invoice: {} };
  prisma.paymentLink.findUnique.mockResolvedValue(link);

    const wrapper = makeReqRes('used-token');
    await handler(wrapper.req, wrapper.res);
    expect(wrapper.status).toBe(410);
    const body = wrapper.body as { message?: string } | null;
    expect(body?.message).toBe('Payment link already used');
  });

  it('returns invoice when link valid', async () => {
    const prismaModule = await import('@/lib/prisma');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaModule.prisma as any;
    const link = {
      token: 't2',
      used: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      invoice: { id: 'inv1', invoiceNumber: 'INV-1', customer: { id: 'c1', name: 'Cust' } },
    };
    prisma.paymentLink.findUnique.mockResolvedValue(link);

    const wrapper = makeReqRes('valid-token');
    await handler(wrapper.req, wrapper.res);
    expect(wrapper.status).toBe(200);
    const body = wrapper.body as { invoice?: { invoiceNumber?: string } } | null;
    expect(body?.invoice).toBeDefined();
    expect(body?.invoice?.invoiceNumber).toBe('INV-1');
  });
});
