## Quick orientation

This is a T3-stack Next.js application (Next.js + tRPC + Prisma + Clerk + shadcn UI).
Key code locations:

- App (routes & pages): `src/app/` (see `src/app/layout.tsx`, `src/app/page.tsx`)
- Protected areas: `src/app/(protected)/` (sidebar, dashboard, create flows)
- API / server logic: `src/server/` and `src/server/api/` (routers under `src/server/api/routers/`)
- tRPC client wiring: `src/trpc/` and `src/app/api/trpc/[trpc]/route.ts`
- Database schema: `prisma/schema.prisma` (Prisma models and migrations)
- UI components: `src/components/ui/` (shadcn-style components)
- Auth: `@clerk/nextjs` integration and route protection in `src/middleware.ts`

Follow these points when editing or generating code.

## Quick orientation

This is a T3-stack Next.js application (Next.js + tRPC + Prisma + Clerk + shadcn UI).
Key code locations:

- App (routes & pages): `src/app/` (see `src/app/layout.tsx`, `src/app/page.tsx`)
- Protected areas: `src/app/(protected)/` (sidebar, dashboard, create flows)
- API / server logic: `src/server/` and `src/server/api/` (routers under `src/server/api/routers/`)
- tRPC client wiring: `src/trpc/` and `src/app/api/trpc/[trpc]/route.ts`
- Database schema: `prisma/schema.prisma` (Prisma models and migrations)
- UI components: `src/components/ui/` (shadcn-style components)
- Auth: `@clerk/nextjs` integration and route protection in `src/middleware.ts`

Follow these points when editing or generating code.

## Development workflow (concrete commands)

- Install: `npm install` (postinstall runs `prisma generate`)
- Start a local DB (Docker): `./start-database.sh` (loads `.env` DATABASE_URL)
- Push Prisma schema (no migration files): `npm run db:push`
- Create a dev migration: `npm run db:generate` (runs `prisma migrate dev`)
- Apply migrations to production-like DB: `npm run db:migrate`
- Dev server: `npm run dev` (Next dev with Turbo)
- Lint/typecheck: `npm run check` (`next lint && tsc --noEmit`)
- Format: `npm run format:write` / `npm run format:check`

When you change `prisma/schema.prisma` add a migration using `npm run db:generate`. If you only want to sync schema to a development DB without creating migration files, use `npm run db:push`.

## Architectural patterns & conventions

- Backend API surface is tRPC. New endpoints are created as routers in `src/server/api/routers/` and then exported/combined in `src/server/api/root.ts`. When adding a router, update `root.ts`.
- Server-only code (DB access) belongs in `src/server/` and `src/lib/` for helpers. Keep Prisma access in `src/server/db.ts`.
- UI components are shared under `src/components/ui/` and follow shadcn conventions (single-file default exports, props forwarding).
- Auth: Clerk is the single auth provider. `src/middleware.ts` defines `isPublicRoute` and protects routes not listed there. If you add a new public page (like sign-in alternatives), update `isPublicRoute`.
- Feature modules: protected app pages live under `src/app/(protected)/`. This folder groups sidebar, dashboard, and feature pages.

## Integration notes / external dependencies

- Clerk: look at `src/middleware.ts` and `@clerk/nextjs` usage across pages. Avoid duplicating auth checks; rely on middleware and `auth` where appropriate.
- Prisma: `prisma/schema.prisma` is canonical. `@prisma/client` is generated on install; `postinstall` runs `prisma generate`.
- Google Gemini: `src/lib/gemini.ts` contains an example of using `@google/genai` and expects `GEMINI_API_KEY` in env.
- GitHub / Octokit: `octokit` is available; look for usages in `src/lib/github.ts`.

## Code examples & quick recipes

- Add a new tRPC router: create `src/server/api/routers/<name>.ts`, export procedures, then add to `src/server/api/root.ts`'s router map.
- Protecting routes: update `src/middleware.ts`'s `createRouteMatcher` list to add new public paths. All other routes are protected by Clerk.
- Start DB and apply schema (common dev sequence):
  1. `./start-database.sh`
  2. `npm install`
  3. `npm run db:push` (or `npm run db:generate`)
  4. `npm run dev`

## Source-of-truth files to check before edits

- `package.json` scripts (dev/build/lint/db scripts)
- `prisma/schema.prisma` (data model)
- `src/server/api/root.ts` (tRPC wiring)
- `src/middleware.ts` (auth/public routes)
- `src/components/ui/` (common UI patterns)

## What to avoid / gotchas

- Don't assume environment variables are present. The repo uses `.env` for `DATABASE_URL` and `GEMINI_API_KEY`; `start-database.sh` sources `.env`.
- DB migrations are managed with Prisma; creating or editing migrations requires `npm run db:generate` and may need a running DB.
- Next.js static file and `_next` paths are excluded in middleware matcher — be careful if adding static endpoints.

## When you finish a change

- Run `npm run check` and `npm run format:write`.
- If you change Prisma schema, run `npm run db:generate` and optionally `prisma studio` with `npm run db:studio` to inspect data.

---

If anything here looks incomplete or you want examples added (e.g., how to extend `src/server/api/root.ts`), tell me which area to expand and I'll iterate.

If you want this file expanded into a longer "Copilot Instructions" section (examples of adding routers, tRPC patterns, edge cases), say so and I'll add it.
