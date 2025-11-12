# API Gateway (detailed reference)

This project includes two gateway implementations that help during development and testing:

- A lightweight forwarder at `src/pages/api/gateway/[...path].ts`
- A library-backed proxy using `http-proxy-middleware` at `src/pages/api/gateway/proxy/[...path].ts`

This file documents both gateways, environment variables, authentication/whitelisting rules, usage examples, troubleshooting tips, and recommended next steps.

# Overview

Why a gateway? A gateway provides a single origin to call multiple backend services (internal or external) and can centralize auth, logging, request transformations, and CORS avoidance in development.

Two gateways in this repo

- Simple gateway (`/api/gateway/[...path]`) — quick forwarding to internal or external URLs. Good for simple admin tooling.
- Proxy gateway (`/api/gateway/proxy/[...path]`) — uses `http-proxy-middleware`, offers better proxy semantics (path rewrite, changeOrigin, header handling).

## Files & helpers

- `src/pages/api/gateway/[...path].ts` — lightweight forwarder.
- `src/pages/api/gateway/proxy/[...path].ts` — http-proxy-middleware proxy.
- `src/lib/gateway.ts` — helpers:
  - `getAuthUser(req: NextApiRequest)` — reads `token` cookie (JWT) and returns the DB user (via Prisma).
  - `isWhitelisted(target?: string)` — checks `API_GATEWAY_WHITELIST` (comma-separated list; supports origin, hostname, and `.example.com` wildcard).

## Environment variables

- `JWT_SECRET` — used to verify the auth JWT (already required by `src/pages/api/auth.ts`).
- `API_GATEWAY_KEY` — optional. When set, the proxy route expects `X-API-KEY` header to match this value.
- `API_GATEWAY_WHITELIST` — optional. Comma-separated allowed origins/hostnames (e.g. `https://httpbin.org,example.com,.example.com`). If unset, targets are allowed for convenience in dev.

## Auth & access rules

- Both gateways require an authenticated dashboard user by default. The gateways validate the `token` cookie and look up the user in the DB. Only users with role `finance` or `admin` are allowed.
- The proxy gateway has an extra check: if `API_GATEWAY_KEY` is set, requests must include header `X-API-KEY: <value>`.
- If `API_GATEWAY_WHITELIST` is set, the gateway will reject (403) targets not matching the whitelist.

## How targets are resolved

Simple gateway (`/api/gateway/[...path]`):

- If query param `to` is present and is a full URL, the gateway uses that as target.
- If `to` is omitted, the gateway treats the remainder of the path as an internal route and forwards to `http://localhost:<PORT>/<path>`.

Proxy gateway (`/api/gateway/proxy/[...path]`):

- `to` is required. The code will parse `to` as a URL (if possible) and extract origin and base pathname.
- If `to` includes a path (for example `https://httpbin.org/get`) the proxy avoids duplicating that path when appending the requested path.

## Examples

1. Forward to an external URL (proxy route)

GET http://localhost:3000/api/gateway/proxy/get?to=https://httpbin.org/get

- Upstream: `https://httpbin.org/get`
- Requirements: logged-in dashboard user and (if set) `API_GATEWAY_WHITELIST` allowing `httpbin.org`. If `API_GATEWAY_KEY` is set, include header `X-API-KEY`.

2. Call an internal API via the simple gateway

GET http://localhost:3000/api/gateway/api/payment-links

- Upstream: `http://localhost:3000/api/payment-links` (internal routing; useful for admin tooling).

3. Create a payment link through the gateway (POST)

POST http://localhost:3000/api/gateway/api/payment-links
Body: { "invoiceId": "<id>", "expiresHours": 24 }

- Same auth and whitelist checks apply.

4. Proxy to an external host without a trailing path

GET http://localhost:3000/api/gateway/proxy/get?to=https://httpbin.org

- Upstream: `https://httpbin.org/get`

## Debugging & common issues

- 404s when proxying external sites

  - Root cause: duplicated path segments. Example: passing `to=https://httpbin.org/get` and requesting `/api/gateway/proxy/get` could produce `https://httpbin.org/get/get`. The proxy was updated to parse and avoid duplication.

- 401 / 403 from the gateway
  - 401: not authenticated or missing `X-API-KEY` for proxy when required. Ensure you are logged in to the dashboard (so the `token` cookie exists) and include `X-API-KEY` if configured.
  - 403: target blocked by `API_GATEWAY_WHITELIST` — add the target origin or hostname to the whitelist.

## Security recommendations

- Do not expose these gateways publicly without strong access controls.
- Configure `API_GATEWAY_WHITELIST` to the minimal set of targets needed during development.
- Use `API_GATEWAY_KEY` and dashboard authentication together when you need an extra layer of protection.
- Consider adding rate-limiting and request size limits.

## Next steps / optional improvements

Pick any of these and I will implement:

1. Add a `/finance/gateway-tester` admin-only UI that composes proxied requests (method, URL, headers, body) and shows responses.
2. Add strict whitelist enforcement mode (exact origin matches only).
3. Add request logging/audit and an admin page to view recent gateway calls.
4. Add rate-limiting and request size limits.

If you want me to implement one, tell me which item and I'll add it next.

---

Generated and kept in repository so you won't lose gateway knowledge.
