## Quick orientation — accounts-receivable-management-next

This file contains short, actionable guidance for automated coding agents working on this repository.
Keep it focused on the concrete structure, conventions, and commands an agent needs to be immediately productive.

1. Project shape (big picture)

- Next.js Pages Router app (server-rendered pages live under `src/pages/` — e.g. `src/pages/_app.tsx`).
- Backend API routes are Pages API handlers under `src/pages/api/` (examples: `api/auth.ts`, `api/invoices`, `api/payment-links`).
- Prisma + PostgreSQL for persistence: schema in `prisma/schema.prisma` and singleton client at `src/lib/prisma.ts`.

2. Important runtime patterns & conventions

- Authentication: JWT issued by `POST /api/auth` and stored in an httpOnly cookie named `token`. See `src/pages/api/auth.ts`.
- Data normalization: API responses normalize DB types for the client — Date → ISO string, Decimal → string. Consumers in `src/types/index.ts` expect strings for dates/amounts.
- Payment-link flow: finance UI calls `POST /api/payment-links` to create a token; customers open `/invoices/[token]` which calls `GET /api/payment-links/[token]` to validate and return invoice data.
- Prisma relations: `PaymentLink` uses a one-to-one relation with `invoice` (`invoiceId` marked `@unique`). If you edit relations, keep one-to-one uniqueness rules in mind.

3. Files you will edit most

- `src/pages/api/invoices/index.ts` — list/create invoices (GET/POST). Keep validation and normalization here.
- `src/pages/api/payment-links/index.ts` and `.../[token].ts` — generate & validate payment links.
- `src/pages/api/auth.ts` — login/validate handlers (JWT + cookie).
- `src/lib/prisma.ts` — Prisma client singleton (reuse this; do not create new PrismaClient instances in other files).
- `src/lib/api.ts` — client-side fetch helpers used by pages/components.
- `src/components/InvoiceForm.tsx` — uses `react-hook-form`; call `handleSubmit(yourHandler)` (common error if used incorrectly).
- `src/types/index.ts` — keep types in sync with API normalization (ISO strings for dates, string for Decimal fields).

4. Developer workflows & commands (run from repo root)

- Install runtime deps:
  npm install
- Ensure runtime packages used by the repo:
  npm install @prisma/client pg bcryptjs jsonwebtoken cookie axios react-hook-form
- Dev quickstart (requires DATABASE_URL & JWT_SECRET in `.env`):
  npx prisma generate
  npx prisma migrate dev --name init # only when you want to apply schema migrations
  npm run dev
- If you change `schema.prisma` run `npx prisma generate` to regenerate types before restarting TS server.

5. TypeScript & Editor tips

- If TS can't resolve `@prisma/client`, run `npx prisma generate` and restart the TS server (VS Code: "TypeScript: Restart TS Server").
- The project uses path alias `@/*` pointing to `src/*` — check `tsconfig.json` if imports fail.

6. Common pitfalls to avoid

- Don’t call `react-hook-form`'s `handleSubmit` directly as the `onSubmit` prop — use `onSubmit={handleSubmit(yourSubmit)}`.
- When returning Prisma `Decimal`/`Date` values from APIs, convert them to primitives (e.g. `amount: inv.amount.toString()`, `dueDate: inv.dueDate?.toISOString()`) so the client types match.
- Keep the singleton Prisma client in `src/lib/prisma.ts` to avoid connection storms in dev/hot-reload.
- Auth: `GET /api/auth` validates the cookie token; code expecting session info should call that endpoint.

7. Integration points & testing areas to check first

- Payment flow: `src/pages/invoices/[token].tsx` (customer-facing) and `src/pages/finance/*` (manager-facing).
- Seed and migrations: `prisma/seed.ts` and `prisma/migrations/` — use `prisma migrate` only against dev DBs.

8. If you modify APIs, remember to:

- Update `src/types/index.ts` for the client.
- Run `npx prisma generate` if the Prisma schema changed.
- Run the Next dev server and test the flow manually: create invoice → generate link → open `/invoices/<token>` → simulate payment.

If anything is unclear or you want me to add short examples for a specific file (e.g. exact JSON returned by `GET /api/invoices`), tell me which endpoint or component to document and I'll iterate.
