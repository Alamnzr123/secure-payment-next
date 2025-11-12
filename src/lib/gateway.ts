import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { prisma } from '@/lib/prisma';
import type { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';

export async function getAuthUser(req: NextApiRequest) {
  const cookies = req.headers?.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    return user;
  } catch {
    return null;
  }
}

export function isWhitelisted(target?: string) {
  // API_GATEWAY_WHITELIST is a comma-separated list of allowed origins or hostnames.
  const raw = process.env.API_GATEWAY_WHITELIST ?? '';
  if (!raw) return true; // no whitelist configured => allow all
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (!target) return true; // internal routes allowed
  try {
    const u = new URL(target);
    const origin = u.origin; // scheme + host
    const hostname = u.hostname;
    return list.some((entry) => {
      if (entry === origin) return true;
      if (entry === hostname) return true;
      // allow wildcard subdomains like .example.com
      if (entry.startsWith('.')) {
        return hostname.endsWith(entry.slice(1));
      }
      return origin.includes(entry) || hostname.includes(entry);
    });
  } catch {
    // if target isn't a full URL, compare as host-like string
    return list.some((entry) => target.includes(entry));
  }
}
