# UrbanrisePro

A hyperlocal services marketplace connecting residents with verified local service providers (electricians, plumbers, cleaners, etc.) in Tier 2/3 Tamil Nadu towns.

## Vercel Deployment

The project is configured for Vercel. Connect your GitHub repo to Vercel and set these environment variables in the Vercel dashboard (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `SESSION_SECRET` | Same secret used in Replit |
| `ADMIN_SECRET` | Same secret used in Replit |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | Your Vercel production URL, e.g. `https://your-app.vercel.app` (optional — `*.vercel.app` is allowed automatically) |

Vercel build settings are in `vercel.json`. The build command builds both the API server (esbuild → `artifacts/api-server/dist/`) and the frontend (Vite → `artifacts/localpro/dist/public/`). The Express API is served as a serverless function from `api/index.js`.

Database: schema is managed by Drizzle. The Neon database schema was pushed via `DATABASE_URL="<neon-url>" pnpm --filter @workspace/db run push`. No migration step is needed on deploy — the schema is already in sync.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — express-session secret
- Required env: `ADMIN_SECRET` — secret for admin login (phone 9000000000)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/localpro), mobile-first, Wouter routing
- API: Express 5 (artifacts/api-server, port 8080)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)
- Session store: connect-pg-simple (sessions table in Postgres)

## Where things live

- `artifacts/localpro/src/pages/` — all frontend pages (resident/, provider/, admin/, public/)
- `artifacts/localpro/src/components/` — shell, auth-provider, bottom-nav, language toggle
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/db/` — Drizzle schema + seed data
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod validation schemas

## Architecture decisions

- No RLS — access control lives entirely in Express middleware, not the DB layer.
- OTP is stubbed for MVP — any 6-digit code is accepted; real SMS via Task #7.
- Sessions in Postgres via connect-pg-simple (must be in esbuild externals list).
- CORS allows any `*.replit.dev` and `*.replit.app` origin for Replit-managed deployments.
- Wouter base path driven by `BASE_PATH` env var (set to `/` by artifact.toml).

## Product

Three user roles:
- **Resident** — browse providers by category, book a service, track booking status, leave reviews, raise disputes.
- **Provider** — onboard with KYC docs, accept/decline jobs, view upskilling modules, earn Hall of Fame badges.
- **Admin** — verify provider KYC, resolve disputes, manage local partners, view metrics dashboard.

## User preferences

- Internal package/directory names kept as `localpro` (renaming would break the artifact system).
- Brand name in all user-facing strings: **UrbanrisePro**.

## Gotchas

- After any change to `artifacts/api-server/src/`, run `node build.mjs` inside `artifacts/api-server/` before restarting.
- `connect-pg-simple` must remain in esbuild's `external` list or sessions break silently.
- Admin login: POST /api/auth/admin-login with phone `9000000000` + `ADMIN_SECRET`.
- Booking status from API is `"requested"` (not `"pending"`) — the frontend active-bookings filter must include it.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
