import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser, isWhitelisted } from '@/lib/gateway';
// Use global fetch (Node 18+). If your Node doesn't provide global fetch, install a polyfill or node-fetch.
function getFetch(): typeof fetch | undefined {
  return (globalThis as unknown as { fetch?: typeof fetch }).fetch;
}

// Simple API gateway / proxy for forwarding requests to internal or external services.
// Usage: POST/GET /api/gateway/<targetPath>?to=<targetBaseUrl>
// Example: GET /api/gateway/status?to=https://httpbin.org

function getTargetUrl(req: NextApiRequest): string | null {
  const { to } = req.query as { to?: string };
  if (to && typeof to === 'string') return to;
  // fallback: use path as internal API route (relative to this app)
  const pathParts = (req.query.path as string[]) ?? [];
  if (pathParts.length === 0) return null;
  return `http://localhost:${process.env.PORT ?? 3000}/${pathParts.join('/')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // require authenticated dashboard user
  const user = await getAuthUser(req as NextApiRequest);
  if (!user || !user.role || !['finance', 'admin'].includes(user.role)) {
    return res.status(401).json({ message: 'Unauthorized - dashboard access required' });
  }

  const target = getTargetUrl(req);
  if (!target) return res.status(400).json({ message: 'Missing target. Provide ?to=<baseUrl> or include path parts.' });

  // enforce whitelist
  if (!isWhitelisted(target)) return res.status(403).json({ message: 'Target not allowed by gateway whitelist' });

  try {
    const method = req.method ?? 'GET';
    const headers: Record<string, string> = {};
    // forward most headers except host/connection
    for (const [k, v] of Object.entries(req.headers)) {
      if (!v) continue;
      const keyLower = k.toLowerCase();
      if (['host', 'connection', 'content-length'].includes(keyLower)) continue;
      if (Array.isArray(v)) headers[k] = v.join(', ');
      else headers[k] = v as string;
    }

    const body = ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(req.body ?? {});

  const fetchFn = getFetch();
  if (!fetchFn) throw new Error('No global fetch available (Node 18+ required)');
  const r = await fetchFn(target, { method, headers, body });
    const text = await r.text();
    const contentType = r.headers.get('content-type') ?? 'text/plain';
    res.setHeader('content-type', contentType);
    res.status(r.status).send(text);
  } catch (err: unknown) {
    return res.status(500).json({ message: err instanceof Error ? err.message : 'gateway error' });
  }
}
