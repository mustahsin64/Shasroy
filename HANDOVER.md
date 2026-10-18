# Shasroy — agent handover

Updated: 18 October 2026 (Asia/Dhaka).

## Start here

Continue the existing project; do not scaffold it again. Read `AGENTS.md` and relevant Next.js documentation in `node_modules/next/dist/docs/` before changing code. Preserve the accepted Bengali storefront design. The next planned implementation is Phase 2: database and backend foundation, when the user requests it.

The user prefers concise responses and step-by-step implementation, with each phase verified before advancing. They described this as “caveman mode”—avoid unnecessary explanation and token waste.

## Repository and state

- Local workspace: `/Users/siam/Developer/Projects/B-shasroy`
- GitHub: https://github.com/mustahsin64/Shasroy
- Branch: `main`, tracking `origin/main`.
- Latest local commit at handover: `98e4117` — `layout improved`.
- Earlier foundation commit: `d014c52`.
- Working tree was clean before this handover file was created.
- Remote tracking status was inspected locally; no fresh fetch was performed for this handover.
- This file has not been committed or pushed by the handover task.

Git originally authenticated as `siam-shipday` and received a 403. The user subsequently signed in and successfully pushed. Do not change their global Git authentication unless needed and authorized.

## Business and design requirements

Store: সাশ্রয় (Shasroy), a Bangladesh e-commerce shop for stationery, kids’ gifts, women’s gift items, plastic household goods, and affordable decorative items.

- All storefront copy should be natural Bangla, including navigation and accessibility labels.
- Required font: **Noto Serif Bengali**, self-hosted through `@fontsource-variable/noto-serif-bengali`.
- Theme: logo-derived green and gold, with cream, sage, and white surfaces.
- Logo/tagline: “আপনার পছন্দ আপনার দামে”. Preserve the supplied logo.
- User disliked generic AI-style marketing copy and the earlier abstract landing-page design.
- User explicitly requested the layout/design of Gifymo, adapted to Shasroy branding, colors, Bangla, and the specified font.

References inspected:

- Requested preview: https://preview.themeforest.net/item/gifymo-giftshop-woocommerce-theme/full_screen_preview/32503749
- Accessible author demo: https://demo2.themelexus.com/gifymo/

The ThemeForest preview encountered a security challenge; the author’s public demo was inspected successfully. The implementation is a close custom Next.js adaptation, not an imported WordPress theme or a pixel-perfect reproduction. There is no purchased theme package in this repository.

## Architecture

Agreed: a modular monolith with one Next.js project for storefront, admin, and server-side business logic. No separate Express/NestJS backend or microservices initially.

Implemented:

- Next.js App Router + TypeScript (Next.js 16.4.2 resolved during previous checks).
- React (19.3.1 resolved during previous checks).
- Tailwind CSS 4 and custom storefront CSS.
- shadcn/ui configuration, reusable Button, Radix Slot, Lucide icons.
- ESLint and TypeScript checks.
- Locally served Noto Serif Bengali.

Planned, **not implemented**:

- PostgreSQL hosted on Supabase.
- Drizzle ORM and migrations.
- Zod validation.
- Supabase Auth for admins and Supabase Storage for actual product photos.
- Guest checkout, COD first; SSLCOMMERZ later.
- Vercel production hosting.
- Vitest/Playwright tests as meaningful business behavior is introduced.

The earlier Sites skill was consulted, but this is a local Next.js/Vercel project. No Sites registration, Worker deployment, or public deployment was performed.

## Current UI and behavior

- Three-row header: utility strip, logo/information row, navigation/search row.
- Desktop left sidebar: categories, informational blocks, gift banner, short editorial content.
- Main column: gift hero, paired banners, four-column product grid, lower banners, recipient categories, FAQ.
- Multi-column footer.
- Responsive mobile navigation and horizontally scrolling categories.
- Bangla search and category filtering over eight hardcoded sample products.
- Native expandable product descriptions and FAQ entries.
- Search uses GET query `q`; filtering uses `category`; results anchor is `#products`.
- `src/app/page.tsx` is an async server component and awaits `searchParams`.

**This is a storefront foundation with sample browsing, not a working e-commerce system.** There is no database connection, real catalog, pricing, cart, checkout, inventory, authentication, admin UI, payment integration, or order creation. Do not imply that Phase 3 is complete just because a product grid exists.

Samples are explicitly labeled as concepts. Images do not represent actual stock; no fabricated prices, reviews, discounts, or working purchase controls were added. Real catalog data should replace the samples in subsequent phases.

## Important files

| File | Purpose |
| --- | --- |
| `src/app/page.tsx` | Homepage, sample catalog, categories, server-side query filtering |
| `src/app/layout.tsx` | Bengali document language, metadata, font/CSS imports, shared shell |
| `src/app/storefront.css` | Gifymo-style composition, responsive breakpoints, component styling |
| `src/app/globals.css` | Tailwind import, shared color tokens, base styles; some old landing-page styles remain |
| `src/components/site-header.tsx` | Logo, navigation, GET search form |
| `src/components/site-footer.tsx` | Bengali footer and links |
| `src/components/ui/button.tsx` | Shared Button variants |
| `src/lib/utils.ts` | `cn` utility |
| `components.json` | shadcn/ui configuration |
| `public/brand/shasroy-logo.png` | Original user-supplied logo |
| `public/images/gift-hero.png` | Generated green/gold gift hero |
| `public/images/sample-products.png` | Generated 4×2 contact sheet for eight sample products |
| `public/images/README.md` | Image provenance and generation prompts |
| `.env.example` | Empty configuration template, safe to commit |

Product imagery uses CSS background positioning to select cells in the contact sheet. It has not been split into separate real product assets. The original logo has an off-white background and generous margins; it is displayed using CSS framing, not a newly traced or transparent logo.

Original supplied logo location (outside repository): `/Users/siam/Downloads/personal/Shasroy/logo, design/সাশ্রয় Bengali Eco Logo.png`. Use the repository copy for application code.

## Environment and credentials

The user has a Supabase account and entered configuration locally. Earlier, values were moved from `.env.example` to ignored `.env.local`, and the example was cleared. `.env.local` was verified as Git-ignored with owner-only permissions. Its values have not been revalidated for this handover.

Expected names:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` entry may also exist locally. Do not print any values, copy them into documentation, or commit `.env.local`. Never expose the service-role key in client code. The presence of an environment key is not proof that it has a usable value.

Drizzle migrations will need database connection configuration, typically a server-only connection string. Do not assume the existing API keys provide direct SQL access. Determine the missing configuration safely when Phase 2 starts, and ask the user to set secrets locally rather than paste them into chat.

## Run and verify

```bash
npm ci
npm run dev
# http://localhost:3000

npm run lint
npm run typecheck
npm run build
```

Previous verification on the redesigned storefront:

- ESLint and TypeScript passed.
- Production build passed; homepage is dynamically rendered because it uses search parameters.
- Desktop layout inspected at 1366×900.
- Mobile layout inspected at 390×844; viewport override reset afterward.
- Category filter verified: stationery returns notebook and pencil samples.
- Bangla search verified: “কলম” returns notebook and desk organizer samples.
- Browser preview last used `http://localhost:3000/`; check whether the dev server is still running before launching another.
- No automated test suite exists yet.

Environment issues previously encountered:

- User npm cache had a permissions error; installation succeeded with `--cache /tmp/shasroy-npm-cache`. Do not delete or change ownership of the global cache as a workaround.
- Next.js Turbopack build needed sandbox escalation to bind an internal localhost port. This was an environment restriction, not a source error.
- Earlier audit found five development-only advisories through the Next.js ESLint dependency chain. Production dependency audit then reported zero. These results are historical, not a current security guarantee. Avoid blindly running `npm audit fix --force`; it proposed an incompatible downgrade.

## Agreed eight-phase MVP plan

1. **Project foundation — complete, then visually redesigned.** Framework, tooling, environment template, responsive shell, brand theme.
2. **Database and backend — complete (18 October 2026).** Supabase/PostgreSQL connection, Drizzle schema/migrations, categories, products, variants, images, inventory, orders/items, delivery areas, admin authorization records, repeatable seed data.
   - Schema: `src/db/schema.ts`; server-only client: `src/db/index.ts`; env validation: `src/lib/env.ts`; Zod input rules: `src/lib/validation.ts`; migrations: `drizzle/`; seed: `scripts/seed.ts`.
   - Scripts: `npm run db:generate`, `db:migrate`, `db:check`, `db:studio`, `db:seed`.
   - RLS is enabled on every table with no policies, so the Supabase Data API returns nothing; the app reads and writes only from the server via `DATABASE_URL`.
   - Seeded sample products are `draft` with placeholder prices and `SAMPLE-` SKUs. Delivery fees (৳60 / ৳100 / ৳120) are placeholders. Order numbers default to `SH-<sequence>` starting at 1001.
   - No admin record yet; set `ADMIN_SEED_EMAIL` and re-run the seed.
3. **Product storefront — complete except sample images (18 October 2026).**
   - Data access layer: `src/lib/catalog.ts` (server-only); formatting: `src/lib/format.ts`; image URLs: `src/lib/storage.ts` (Supabase Storage bucket `product-images`).
   - Homepage reads categories/products from the database with server-side search, category filter and sort (`?sort=newest|price-asc|price-desc`).
   - Product page `/products/[slug]` with gallery, variant choice via `?variant=SKU`, price, stock status; add-to-bag button is disabled until Phase 4.
   - Samples are published only in development via `SEED_SAMPLES_ACTIVE=true`. The seed uploads one WebP per sample to Storage when `SUPABASE_SERVICE_ROLE_KEY` is set; until then cards show a placeholder icon.
   - Promo banners and occasion tiles still use the static contact sheet.
   Original scope: Replace sample data with database-backed homepage/listing/detail pages, galleries, variants, pricing, stock, search/filter/sort.
4. **Shopping cart — complete (18 October 2026).** Add/update/remove variants, persistent cart, server-validated price and stock.
   - Tables `carts` (only the SHA-256 hash of the cookie token is stored) and `cart_items` (unique per cart + variant, quantity 1–99); migration `drizzle/0001_carts.sql`.
   - Logic: `src/lib/cart.ts`; Server Actions: `src/app/cart/actions.ts`; page `/cart`; add-to-bag form on the product page; header bag link shows the item count.
   - Cookie `shasroy_cart`: httpOnly, SameSite=Lax, Secure in production, 30 days, renewed on activity.
   - Prices are never stored in the cart; lines always show live price and stock. Quantity is capped at stock and 10 per line. Unavailable or over-stock lines are flagged and excluded from the subtotal.
   - Not yet: cleanup of abandoned carts (Phase 8). Checkout button is disabled until Phase 5.
5. **COD checkout — complete (18 October 2026).** Guest name/phone/address, delivery fees, transactional order creation, unique order number, confirmation.
   - Logic: `src/lib/checkout.ts` (`placeOrder`, `listDeliveryZones`, `getOrderConfirmation`); Server Action `src/app/checkout/actions.ts`; pages `/checkout` and `/order/[id]`; form `src/components/checkout-form.tsx`.
   - `placeOrder` runs in one transaction: locks the cart row (stops double submits), locks variant rows in id order, re-checks active/stock, inserts order + item snapshots, decrements stock, writes `inventory_movements` (reason `order`) and `order_status_history` (null to `pending`), deletes the cart. Any failure rolls back.
   - Phone accepts 01…, +880… and Bangla digits; stored as `01XXXXXXXXX`. Totals and fees are computed on the server only.
   - Confirmation URL uses the order UUID (unguessable); the page masks the phone number. Order numbers are `SH-<sequence>`.
   - Tested: validation errors, successful order (stock 5 to 1, history, cart cleared), sold-out-before-submit rejection. Test orders were deleted and stock restored.
   - Not yet: SMS/email notification, rate limiting (Phase 8), order lookup by customer.
6. **Admin dashboard.** Secure login, categories/products/images/variants/stock/prices, order management.
7. **Store operations.** Status history, stock restoration on cancellation, staff notes, printable order view, delivery settings, contact links once actual contact details are supplied.
8. **Production readiness.** SEO/sitemap/structured data, performance, security/rate limiting, logging, analytics, meaningful checkout/inventory tests, Vercel deployment and backup verification.

Post-MVP: SSLCOMMERZ, courier API integration, customer accounts, reviews, coupons, stock synchronization.

For database work: store money as integer paisa; validate totals and inventory on the server; use transactions for stock reservations/orders; separate admin authentication from authorization; protect customer and order data. Keep the accepted design while connecting real behavior.

## Suggested next-agent prompt

> Read HANDOVER.md and AGENTS.md in this repository. Continue Shasroy from the current implementation. Keep the Gifymo-inspired green/gold Bengali design and Noto Serif Bengali font. Implement Phase 2: Supabase/PostgreSQL and Drizzle database foundation with migrations, access controls, and repeatable seed data. Inspect existing configuration without exposing credentials. Verify the work and report any remaining configuration needed. Keep responses concise.
