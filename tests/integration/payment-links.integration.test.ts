import { describe, it, expect } from 'vitest';
import request from 'supertest';
import http from 'http';
import handler from '../../src/pages/api/payment-links/[token]';

function createServer() {
  return http.createServer((req, res) => {
  // @ts-expect-error - we are adapting for tests and using a minimal req/res
  handler(req, res);
  });
}

describe('payment-links integration', () => {
  it('responds with demo invoice for sample-token', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;

    const res = await request(`http://127.0.0.1:${port}`).get('/api/payment-links/sample-token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('invoice');
    expect(res.body.invoice.invoiceNumber).toBe('INV-12345');

    server.close();
  });
});
