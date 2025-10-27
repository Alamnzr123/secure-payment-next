import { describe, it, expect } from 'vitest';
import handler from '../src/pages/api/payment-links/[token]';

// minimal mock for NextApiRequest/Response
function makeReqRes(queryToken: string) {
  const req: unknown = { query: { token: queryToken }, method: 'GET' };
  let statusCode = 200;
  let body: unknown = null;
  const res: unknown = {
    status(code: number) { statusCode = code; return this; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json(payload: unknown) { body = payload; return this as any; },
    setHeader() {},
    end() {}
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { req: req as any, res: res as any, get body() { return body; }, get status() { return statusCode; } };
}

describe('payment-links handler (demo token)', () => {
  it('returns demo invoice for sample-token', async () => {
    const wrapper = makeReqRes('sample-token');
    await handler(wrapper.req, wrapper.res);
    expect(wrapper.status).toBe(200);
    expect(wrapper.body).toHaveProperty('invoice');
    const body = wrapper.body as Record<string, unknown> | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((body?.invoice as any)?.invoiceNumber).toBe('INV-12345');
  });
});
