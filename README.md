# সাশ্রয় (Shasroy)

Bangla e-commerce shop for stationery, gifts, household essentials and affordable decor in Bangladesh. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Drizzle ORM and Supabase (PostgreSQL, Auth, Storage).

## What works

- **Storefront:** database-backed catalog with search, category filter and sorting; product pages with gallery, variants and stock labels; persistent guest cart; cash-on-delivery checkout with delivery zones; order confirmation.
- **Admin** (`/admin`, magic-link sign-in, roles staff / manager / owner): orders with status workflow, search, internal notes and printable slips; products, variants, stock and images; categories; delivery zones; stock history; admin user management.
- Money is stored as integer paisa; stock, prices and totals are validated on the server inside transactions.

Not built yet: online payments, courier integration, customer notifications, production deployment. See `HANDOVER.md` for the phase-by-phase status and open items.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (never commit .env.local)
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin sign-in is at `/admin/login`.

Database URLs come from the Supabase dashboard (Connect). Use the transaction pooler (port 6543) for `DATABASE_URL` and the session pooler (port 5432) for `DATABASE_URL_DIRECT`; percent-encode special characters in the password.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (no database) |
| `npm run test:db` | Integration tests; use a **development** database only (creates and removes `ZZTEST` rows, refuses to run if real orders exist) |
| `npm run db:generate` / `db:migrate` / `db:check` / `db:studio` | Drizzle migrations and tooling |
| `npm run db:seed` | Repeatable seed: categories, delivery zones, sample products (draft unless `SEED_SAMPLES_ACTIVE=true`), optional owner from `ADMIN_SEED_EMAIL` |

## Notes

- The shop's public contact details are configured in `src/lib/shop-contact.ts`; empty values are simply not shown.
- Sample products and delivery fees are placeholders; replace them with the real catalogue and prices before launch.
- This project uses a Next.js version with breaking changes. Read `AGENTS.md` and the docs in `node_modules/next/dist/docs/` before changing framework-level code.
