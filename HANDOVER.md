# Shasroy — agent handover

Updated: 22 October 2026 (Asia/Dhaka). Phases 1–7 implemented and committed; Phase 8 (production readiness) mostly done; the shop is live at https://shasroy.vercel.app. Latest code commit on `main`: `a88b87d`.

## Start here

Continue the existing project; do not scaffold it again. Read `AGENTS.md` and the relevant Next.js docs in `node_modules/next/dist/docs/` before changing code (this Next.js version has breaking changes: for example `middleware` is now `proxy`). Preserve the accepted Bengali storefront design. Keep replies concise; the user works step by step and wants each phase verified before the next ("caveman mode").

## Repository and state

- Workspace: `/Users/siam/Developer/Projects/B-shasroy`; GitHub: https://github.com/mustahsin64/Shasroy; branch `main`.
- Phases 1–7 are committed and pushed; Phase 8 is mostly done. Recent commits: `a88b87d` (shop phone/email, Rajshahi delivery zones), `4daf561` + `c3a2fbd` (Vercel deploy, `vercel.json`), `5f83772` (gift wrap, storefront conversion fixes), `53cd183` (sticky nav only, hero images), `d5e4a95` (Phase 8 SEO/error pages/rate limiting/cart cleanup/logging), `acba92d` (Phase 7). `PHASE_7_IMPLEMENTATION_PLAN.md` stays untracked in the repo root.
- Git push: the active `gh`/git account on this machine (`siam-shipday`) gets a 403 on this repo. Pushes have worked by using the `mustahsin64` token for a single command (`GH_TOKEN="$(gh auth token --user mustahsin64)" git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main`). Do not change the user's global Git/`gh` authentication.

## Business and design requirements

Store: সাশ্রয় (Shasroy), a Rajshahi-based Bangladesh e-commerce shop for stationery, kids' gifts, women's gift items, plastic household goods and affordable decor.

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

Not implemented: online payments (SSLCOMMERZ), courier API, SMS/email to customers, customer accounts, reviews, coupons.

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

The service-role key was pasted into chat once during Phase 3; the user was asked to rotate it. Development Redirect URLs include `http://localhost:3000/**`.

Two Supabase projects:

- **Development** (ref `ztynfaiiauzjgzthljsx`), used by `.env.local`. Seed data only, no real orders. `npm run test:db` runs here.
- **Production** "Shasroy Prod" (ref `mdvtkeinuzbeoabvxezc`, Singapore, free plan), used by Vercel. Its values are in the git-ignored `.env.prod`. Run production scripts with `node --env-file=.env.prod node_modules/.bin/<tool> ...`; variables already in the shell override the file. All 4 migrations applied and seeded. Auth Site URL `https://shasroy.vercel.app`, Redirect URL `https://shasroy.vercel.app/**`. The owner admin `mustahsin64@gmail.com` is linked and has signed in. The 8 `SAMPLE-` products are published there with **placeholder prices** and must be replaced or hidden before real sales. Never run `test:db` against production.

The production DB password was pasted into chat during setup and must be rotated (then update `DATABASE_URL`/`DATABASE_URL_DIRECT` in Vercel and `.env.prod`, and redeploy). A local `.env.vercel` (git-ignored, holds the Vercel env values) should be deleted.

Both databases use two delivery zones: `inside-rajshahi` (রাজশাহী শহরের ভেতরে, ৳30, 1–2 days) and `outside-rajshahi` (রাজশাহীর বাইরে (সারা দেশে), ৳120, 3–5 days). The seed inserts zones with `onConflictDoNothing`, so admin edits are never overwritten.

## Deployment

- Vercel project `shasroy` (team `mustahsinul-moulas-projects`, Hobby plan), connected to GitHub: every push to `main` deploys to production at https://shasroy.vercel.app.
- `vercel.json`: region `sin1`; daily cron `30 20 * * *` (02:30 Dhaka) calling `/api/cron/cleanup-carts`. Vercel Cron sends GET with `Authorization: Bearer <CRON_SECRET>`, so the route exports `GET = POST`.
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`.

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
8. **Production readiness** — in progress.
   - **Done (committed `d5e4a95`):**
     - Storefront redesign (committed `ed3d652`): centred-logo header with search popover and bag (`src/components/site-header.tsx`); auto-scrolling "new arrivals" belt (`src/components/new-arrivals.tsx`); full-width hero carousel whose top tab bar navigates one slide per category, with autoplay, arrows and dots (`src/components/hero-carousel.tsx`). Each slide references `/images/<slug>-hero.png` (slugs: kids, stationery, women, gifts, kitchen, travel, wearable) and falls back to a cream background until the file exists; filenames and prompts are in `public/images/README.md`.
     - SEO: `src/app/sitemap.ts` and `src/app/robots.ts` (admin and transactional routes disallowed), `metadataBase` and Open Graph in `src/app/layout.tsx`, JSON-LD via `src/components/json-ld.tsx` (Organization sitewide, Product on product pages). Site origin from `src/lib/site.ts`.
     - Storefront `not-found.tsx` and `error.tsx` under `src/app/(shop)/`.
     - Best-effort in-memory rate limiting (`src/lib/rate-limit.ts`) on the checkout and admin login server actions. Not distributed; per instance only.
     - Abandoned-cart cleanup: `src/lib/cart-cleanup.ts` (`deleteStaleCarts`, 30-day TTL) and `POST /api/cron/cleanup-carts`, guarded by `CRON_SECRET` (returns 404 when the secret is unset).
     - Structured logging helper `src/lib/log.ts` (one JSON line per event; no secrets).
     - New env vars `NEXT_PUBLIC_SITE_URL` and `CRON_SECRET` documented in `.env.example`.
     - Verified: lint, typecheck, build, 14 unit tests, and a security review of the diff — all clean. `test:db` not run this session.
   - **Done 22 October 2026 (`53cd183`…`a88b87d`):**
     - Header: only the nav row (`.cp-nav`) is sticky; the announcement bar and logo row scroll away. Hero is taller on wide screens and spaced further from the new-arrivals belt.
     - Hero carousel: 6 slides (gifts, kids, stationery, women, home `kitchen-hero.png`, decor `decor-hero.png`) with tab labels matching category names; only slides for active categories show. Images were AI-generated in Figma (file "Shasroy hero images"); `travel`/`wearable` images removed.
     - Storefront conversion fixes: new-arrivals belt shows only when there are 8+ products; sidebar category menu, sample note and trust strip removed; stationery promo uses a photo; mobile puts products first and shortens the page; FAQ answers cover ordering, per-zone delivery cost and time, COD, checking before paying, gift wrap and contact.
     - Product page lists delivery zones (fee and days) and has "এখনই কিনুন" (adds then goes to checkout) next to "ব্যাগে যোগ করুন". Product cards have one-tap quick add for single-variant products, otherwise "ধরন বেছে নিন".
     - **Gift wrap** (migration `0003_gift_wrap_settings.sql`): per-order fee from the single-row `shop_settings` table (default ৳30, editable with on/off at `/admin/settings`, manager+, optimistic concurrency + audit `gift_wrap_update`). Checkout has a gift checkbox and an optional message (max 200 chars); the server checks the fee the customer saw (`gift-wrap-fee-changed`, `gift-wrap-unavailable`). Orders store `gift_wrap`, `gift_wrap_fee_paisa`, `gift_message`; DB checks keep the total and gift fields consistent. Gift orders' print slips hide prices (amount to collect stays) and show the card message.
     - Deployed to Vercel with a new production Supabase project (see above). Contact details filled: phone 01712241476, email mustahsin64@gmail.com (no WhatsApp/Facebook/address yet).
     - Verified: lint, typecheck, build, unit tests, 22/22 DB tests (development); live routes, contact links, zones, products and owner login checked on production.
   - **Remaining:** replace the sample products with real ones (prices, stock, photos); rotate the production DB password; delete `.env.vercel`; SMTP for auth emails (Supabase's built-in sender is rate-limited); signed-in check of print slips (A4/A5, gift order) and `/admin/settings`; backups; custom domain; order alerts; confirm the old development `sb_secret_` key was rotated. Minor: the empty-shop text "এই বিভাগে এখনো কোনো পণ্য নেই" shows even when no category is selected.

Post-MVP: SSLCOMMERZ, courier API, SMS/email notifications, customer accounts, reviews, coupons.

## Important files

| Path | Purpose |
| --- | --- |
| `src/db/schema.ts` | All tables, enums, relations, RLS |
| `src/lib/admin/*.ts` | Server-only admin services (orders, notes, products, categories, delivery, inventory, users, audit) |
| `src/lib/admin-auth.ts`, `src/lib/roles.ts` | Admin authentication/authorization, role ranking |
| `src/lib/catalog.ts`, `cart.ts`, `checkout.ts` | Storefront services |
| `src/lib/money.ts`, `validation.ts`, `format.ts` | Taka/paisa parsing, shared Zod rules, Bangla formatting |
| `src/lib/shop-contact.ts` | Public contact details (phone and email set) |
| `src/lib/shop-settings.ts`, `src/lib/admin/settings.ts` | Shop settings (gift wrap fee/on-off) read and admin update |
| `vercel.json` | Region and cron schedule |
| `src/lib/site.ts`, `log.ts`, `rate-limit.ts`, `cart-cleanup.ts` | Site origin, structured logging, in-memory rate limiting, abandoned-cart cleanup |
| `src/app/sitemap.ts`, `robots.ts`, `src/components/json-ld.tsx` | SEO: sitemap, robots, structured data |
| `src/components/site-header.tsx`, `hero-carousel.tsx`, `new-arrivals.tsx` | Storefront header, hero category carousel, new-arrivals belt |
| `src/app/api/cron/cleanup-carts/route.ts` | CRON_SECRET-guarded cart cleanup endpoint |
| `src/app/(shop)/` | Storefront routes; `src/app/admin/` admin routes; `src/proxy.ts` session refresh |
| `scripts/seed.ts` | Repeatable seed (categories, zones, sample products, optional owner) |
| `tests/` | `unit.test.mts`, `db.test.mts` |

## Suggested next-agent prompt

> Read HANDOVER.md and AGENTS.md. Continue Shasroy from the current implementation (`main`, live at https://shasroy.vercel.app). Keep the green/gold Bengali design and Noto Serif Bengali. Phases 1–7 are done and Phase 8 is mostly done; see the Phase 8 "Remaining" list (real products, DB password rotation, SMTP, signed-in print/settings checks, backups, custom domain). Pushes to `main` deploy to production automatically. Keep responses concise.
