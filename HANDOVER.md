# Shasroy — agent handover

Updated: 20 October 2026 (Asia/Dhaka). Phases 1–7 implemented; Phase 8 (production readiness) is next.

## Start here

Continue the existing project; do not scaffold it again. Read `AGENTS.md` and the relevant Next.js docs in `node_modules/next/dist/docs/` before changing code (this Next.js version has breaking changes: for example `middleware` is now `proxy`). Preserve the accepted Bengali storefront design. Keep replies concise; the user works step by step and wants each phase verified before the next ("caveman mode").

## Repository and state

- Workspace: `/Users/siam/Developer/Projects/B-shasroy`; GitHub: https://github.com/mustahsin64/Shasroy; branch `main`.
- Phases 1–6 are committed and pushed. Phase 7 is implemented in the working tree and **not committed** unless the git log says otherwise. `PHASE_7_IMPLEMENTATION_PLAN.md` is the plan it followed.
- Git push: the active `gh`/git account on this machine (`siam-shipday`) gets a 403 on this repo. Pushes have worked by using the `mustahsin64` token for a single command (`GH_TOKEN="$(gh auth token --user mustahsin64)" git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main`). Do not change the user's global Git/`gh` authentication.

## Business and design requirements

Store: সাশ্রয় (Shasroy), a Bangladesh e-commerce shop for stationery, kids' gifts, women's gift items, plastic household goods and affordable decor.

- All storefront copy is natural Bangla, including navigation and accessibility labels; admin copy is Bangla too.
- Font: **Noto Serif Bengali**, self-hosted through `@fontsource-variable/noto-serif-bengali`.
- Theme: logo-derived green and gold with cream, sage and white surfaces. Logo/tagline: "আপনার পছন্দ আপনার দামে". Preserve the supplied logo (`public/brand/shasroy-logo.png`).
- Layout follows the Gifymo demo (https://demo2.themelexus.com/gifymo/) as a custom Next.js adaptation, not an imported theme.
- The user dislikes generic AI-style marketing copy. Never invent prices, reviews, discounts or contact details.

## Architecture

Modular monolith: one Next.js 16 (App Router, React 19, TypeScript) project for storefront, admin and server logic. No separate backend.

- Database: PostgreSQL on Supabase, accessed only from the server through Drizzle (`DATABASE_URL`, transaction pooler; migrations and seed use `DATABASE_URL_DIRECT`, session pooler). Password characters such as `#` must be percent-encoded in these URLs.
- Every table has RLS enabled with no policies, so the Supabase Data API returns nothing.
- Money is integer paisa. Prices, stock and totals are validated on the server; orders and stock changes run in transactions.
- Auth: Supabase Auth magic link for admins only; authorization comes from our own `admin_users` table. Customers check out as guests.
- Storage: Supabase Storage bucket `product-images` (public read), behind `src/lib/storage.ts`.
- Styling: Tailwind 4 plus `src/app/storefront.css`, `src/app/admin/admin.css`, `src/app/admin/print.css`.

Not implemented: online payments (SSLCOMMERZ), courier API, SMS/email to customers, customer accounts, reviews, coupons, deployment.

## Environment and credentials

`.env.local` is git-ignored; never print, paste or commit its values. Names (see `.env.example`):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only: storage uploads, seed
DATABASE_URL=                   # transaction pooler, port 6543
DATABASE_URL_DIRECT=            # session pooler, port 5432
ADMIN_SEED_EMAIL=               # owner admin registered by the seed
SEED_SAMPLES_ACTIVE=            # development only: true publishes the sample products
```

The service-role key was pasted into chat once during Phase 3; the user was asked to rotate it. Supabase Authentication > URL Configuration > Redirect URLs must include `http://localhost:3000/**` (done) and later the production domain.

There is one Supabase project, used for development. It holds seed data only (8 `SAMPLE-` products, placeholder prices, 3 placeholder delivery zones) and no real orders.

## Run and verify

```bash
npm ci
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build
npm test             # unit tests, no database needed
npm run test:db      # integration tests against the DATABASE_URL database
npm run db:generate  # create a migration from src/db/schema.ts
npm run db:migrate   # apply migrations (uses DATABASE_URL_DIRECT)
npm run db:check
npm run db:seed      # repeatable; safe to re-run
```

`npm run test:db` creates and removes rows tagged `ZZTEST`; it refuses to run if the database contains non-test orders, so point it at a development database only (override: `ALLOW_DB_TESTS_WITH_ORDERS=1`). Tests use Node's built-in runner through `tsx` with `--conditions=react-server`.

Known environment notes: if the user npm cache has permission errors use `--cache /tmp/shasroy-npm-cache`; do not change global cache ownership. The scratchpad under `/private/tmp` can disappear between days, so keep helper scripts in the repo (prefix `.zz-` and delete) rather than there. macOS has no `timeout` command. Avoid `npm audit fix --force`.

## Phase status

1. **Foundation** — framework, tooling, brand theme, responsive shell. Done.
2. **Database** — Drizzle schema (`src/db/schema.ts`), migrations in `drizzle/`, server-only client `src/db/index.ts`, env validation `src/lib/env.ts`, Zod rules `src/lib/validation.ts`, seed `scripts/seed.ts`. Done.
3. **Product storefront** — `src/lib/catalog.ts`, homepage with search/category/sort, `/products/[slug]` with gallery, variants and stock labels. Storefront lives in `src/app/(shop)/` with its own header/footer layout. Promo banners and occasion tiles still use the static contact sheet `public/images/sample-products.png`. Done.
4. **Cart** — `src/lib/cart.ts`, `/cart`, httpOnly cookie `shasroy_cart` (only a SHA-256 hash is stored). Prices are never stored in the cart; quantity capped at stock and 10 per line. Done. Abandoned-cart cleanup is Phase 8.
5. **COD checkout** — `src/lib/checkout.ts`, `/checkout`, `/order/[id]`. `placeOrder` is one transaction: locks the cart, locks variants in id order, re-checks stock, snapshots items, decrements stock, writes inventory movements and status history, deletes the cart. Done.
6. **Admin dashboard** — `src/app/admin/` (login outside the protected `(panel)/` group), `src/proxy.ts` refreshes the session, `src/lib/admin-auth.ts` verifies claims then requires an active `admin_users` row (linked by email on first sign-in; inactive records are never linked). Every page uses `requireAdmin`, every Server Action `assertAdmin`. Roles in `src/lib/roles.ts`: staff = orders; manager = + catalog, delivery, stock history; owner = + admin users. Orders, products, variants, stock, images (sharp to WebP, 4 MB limit because of Vercel's 4.5 MB body cap) and categories. Done.
7. **Store operations** — implemented 20 October 2026:
   - Internal order notes (`order_notes`, append-only, 1–2000 chars, enforced in Zod and by a database check). Shown only on the admin order page; excluded from the customer confirmation and print projections.
   - Order search (`?q=`): order number, name and phone, with Bangla digits, `+880`/`880` prefixes and partial phones (3+ digits); `%` and `_` are literal. Status tab counts stay global and are labelled so.
   - Printable slip `/admin/orders/[id]/print?size=a4|a5` (browser print/PDF). Uses a minimal projection (no notes, no history). Money to collect is shown only for unpaid, non-cancelled COD orders; paid, refunded and cancelled orders are labelled instead.
   - Delivery settings `/admin/delivery` (manager+): fee in taka (decimal-safe, Bangla digits), days, active, sort order; slug is fixed after creation. Edits use optimistic concurrency on `updated_at` and write an audit event in the same transaction. Checkout sends the fee the customer saw (`expectedFeePaisa`); if it changed the order is refused with a message and the customer reviews the new total. The zone row is read with a shared lock so a concurrent edit and order have a defined outcome. Old orders keep their saved fee and zone name. No active zone shows an honest "checkout unavailable" state.
   - Variant stock history `/admin/products/[id]/variants/[variantId]/history` (manager+): read-only ledger with reason filter and pagination; no invented running balance.
   - Owner-only admin users `/admin/users`: register (staff or manager), change role, deactivate/reactivate. The service locks actor, target and owner rows, re-verifies the actor is an active owner, and blocks self-deactivation, self-demotion, owner role changes and removing the last active owner. Forms carry the expected role/state so stale forms are rejected. Every change writes `admin_audit_events`. Registering sends no email; the person uses `/admin/login`.
   - Shared contact details: `src/lib/shop-contact.ts` (single config), `src/components/contact-links.tsx`, used in header, footer, order confirmation and FAQ. **Pending:** `rawShopContact` is empty because the real phone, WhatsApp, Facebook page, email and pickup address have not been supplied; empty or invalid values are omitted everywhere. Fill the values in that file (public data only).
   - Migration `drizzle/0002_phase7_notes_audit.sql` (additive: `order_notes`, `admin_audit_events`, enum `admin_audit_action`), applied to the development database; row counts of existing tables were unchanged.
   - Verified: lint, typecheck, build, `db:check`; 14 unit tests and 17 database integration tests pass (permissions in the service layer, notes, search, print projection, stale-fee checkout, inactive zone rollback, stock history, concurrent owner changes, cancel-once stock restore); unauthenticated requests to the new admin routes redirect to login; contact links checked on header, FAQ and footer (desktop and mobile) with temporary values that were then removed.
   - **Not yet verified:** print previews (A4/A5, long address, many items) and the new admin screens in a signed-in browser; the first-login linking of a newly registered admin through a real magic-link email. Server Actions are covered only through their services, not through HTTP.
8. **Production readiness** — SEO/sitemap/structured data, performance, rate limiting, logging, analytics, abandoned-cart cleanup, SMTP for auth emails (Supabase's built-in sender is rate-limited), production Redirect URLs, Vercel deployment (region `sin1`), backups, cache strategy.

Post-MVP: SSLCOMMERZ, courier API, SMS/email notifications, customer accounts, reviews, coupons.

## Important files

| Path | Purpose |
| --- | --- |
| `src/db/schema.ts` | All tables, enums, relations, RLS |
| `src/lib/admin/*.ts` | Server-only admin services (orders, notes, products, categories, delivery, inventory, users, audit) |
| `src/lib/admin-auth.ts`, `src/lib/roles.ts` | Admin authentication/authorization, role ranking |
| `src/lib/catalog.ts`, `cart.ts`, `checkout.ts` | Storefront services |
| `src/lib/money.ts`, `validation.ts`, `format.ts` | Taka/paisa parsing, shared Zod rules, Bangla formatting |
| `src/lib/shop-contact.ts` | Public contact details (empty until supplied) |
| `src/app/(shop)/` | Storefront routes; `src/app/admin/` admin routes; `src/proxy.ts` session refresh |
| `scripts/seed.ts` | Repeatable seed (categories, zones, sample products, optional owner) |
| `tests/` | `unit.test.mts`, `db.test.mts` |

## Suggested next-agent prompt

> Read HANDOVER.md and AGENTS.md. Continue Shasroy from the current implementation. Keep the green/gold Bengali design and Noto Serif Bengali. First check `git status`/`git log` for whether Phase 7 is committed, then verify the Phase 7 items marked "not yet verified" with a signed-in admin session, wire the real shop contact details if the user has supplied them, and then start Phase 8 only when asked. Keep responses concise.
