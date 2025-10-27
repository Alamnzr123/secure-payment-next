import { describe, it, expect } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../src/pages/api/payment-links/[token]';
import type { Invoice } from '../src/types';

function makeReqRes(queryToken: string) {
  const req: Partial<NextApiRequest> = { query: { token: queryToken }, method: 'GET' };

  let statusCode = 200;
  let body: unknown = null;

  const res: Partial<NextApiResponse> = {};
  res.status = (code: number) => {
    statusCode = code;
    return res as NextApiResponse;
  };
  res.json = (payload: unknown) => {
    body = payload;
    return res as NextApiResponse;
  };
  res.setHeader = (name: string, value: string | number | string[]) => {
    // noop for tests
    void name;
    void value;
    return res as NextApiResponse;
  };
  res.end = (() => res as unknown as NextApiResponse) as NextApiResponse['end'];

  return {
    req: req as NextApiRequest,
    res: res as NextApiResponse,
    get body() {
      return body as unknown;
    },
    get status() {
      return statusCode;
    },
  };
}

describe('payment-links handler (demo token)', () => {
  it('returns demo invoice for sample-token', async () => {
    const wrapper = makeReqRes('sample-token');
    await handler(wrapper.req, wrapper.res);

    expect(wrapper.status).toBe(200);
    const body = wrapper.body as { invoice?: Invoice } | null;
    expect(body).not.toBeNull();
    expect(body).toHaveProperty('invoice');
    const invoice = body?.invoice;
    expect(invoice).toBeTruthy();
    expect(invoice?.invoiceNumber).toBe('INV-12345');
  });
});
