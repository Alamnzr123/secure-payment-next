import type { NextApiRequest, NextApiResponse } from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getAuthUser, isWhitelisted } from '@/lib/gateway';

const API_GATEWAY_KEY = process.env.API_GATEWAY_KEY ?? '';

// Usage: /api/gateway/proxy/<path>?to=<targetBase>
// Example: GET /api/gateway/proxy/get?to=https://httpbin.org

let proxy: unknown = null;

function getTarget(req: NextApiRequest) {
  const to = (req.query.to as string) || undefined;
  return to;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // require X-API-KEY
  const providedKey = req.headers['x-api-key'] as string | undefined;
  if (API_GATEWAY_KEY && providedKey !== API_GATEWAY_KEY) {
    return res.status(401).json({ message: 'Unauthorized - missing or invalid X-API-KEY' });
  }

  // require authenticated dashboard user
  const user = await getAuthUser(req as import('next').NextApiRequest);
  if (!user || !user.role || !['finance', 'admin'].includes(user.role)) {
    return res.status(401).json({ message: 'Unauthorized - dashboard access required' });
  }

  const to = getTarget(req);
  if (!to) return res.status(400).json({ message: 'Missing ?to=<targetBaseUrl>' });
  if (!isWhitelisted(to)) return res.status(403).json({ message: 'Target not allowed by gateway whitelist' });
  let target: string;
  let basePath = '';
  try {
    const u = new URL(to);
    target = u.origin;
    basePath = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '');
  } catch {
    // if to is not a full URL, use it as target directly
    target = to;
  }

  // create proxy middleware per request because target varies
  proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path: string) => {
      // remove /api/gateway/proxy from proxied path
      const remaining = path.replace(/^\/api\/gateway\/proxy/, '');
      // if basePath already present at start of remaining, avoid duplicating it
      if (basePath && remaining.startsWith(basePath)) return remaining;
      return `${basePath}${remaining}`;
    },
    onProxyReq: (proxyReq: import('http').ClientRequest) => {
      // optionally modify outgoing request here
      try {
        proxyReq.setHeader('X-Forwarded-By', 'next-api-gateway-proxy');
      } catch {
        // ignore if header can't be set
      }
    },
    secure: false,
  });

  // adapt middleware to Next.js API route
  return new Promise<void>((resolve, reject) => {
    // call middleware (cast to any because http-proxy-middleware types are not callable in this environment)
    try {
      // call the middleware (use a safe unknown cast)
      const fn = proxy as unknown as ((req: import('http').IncomingMessage, res: import('http').ServerResponse, next: (err?: unknown) => void) => void);
      fn(req as unknown as import('http').IncomingMessage, res as unknown as import('http').ServerResponse, (err?: unknown) => {
        if (err) return reject(err);
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  }).catch((err) => {
    res.status(500).json({ message: err instanceof Error ? err.message : 'proxy error' });
  });
}
