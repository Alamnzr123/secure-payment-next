import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register as apiRegister } from '../src/lib/api';

describe('api helpers', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('login returns data on success', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ user: { id: 'u1', email: 'a@b.com' } }),
    } as unknown as Response));

    const res = await login('a@b.com', 'pw');
    expect(res.error).toBeUndefined();
    expect(res.data?.user).toBeDefined();
    expect(res.data?.user.email).toBe('a@b.com');
  });

  it('register surfaces fieldErrors when server returns them', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Validation failed', fieldErrors: { email: 'Invalid' } }),
      statusText: 'Bad Request'
    } as unknown as Response));

    const res = await apiRegister('bad-email', 'short');
    expect(res.error).toBe('Validation failed');
    expect(res.fieldErrors).toBeDefined();
    expect(res.fieldErrors?.email).toBe('Invalid');
  });
});
