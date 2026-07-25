# Surplus Flooring Marketplace — UI Demo

A **frontend-only preview** of a marketplace for buying and selling surplus
flooring material — leftover stock from completed jobs, distributor
overstock, and take-up material. Listings carry the manufacturer/product-
line/color-number/dye-lot detail a repair job actually needs.

**This build has no backend.** There is no database, no auth, no payments,
and no file storage — everything runs against a small set of mock listings
baked into the code (`src/lib/demo/data.ts`), and every form (login,
register, create listing, buy now, offers) shows an inline "this is a demo"
notice instead of doing anything real. It's meant to be deployed with zero
environment variables and clicked through as a UI preview.

For the full working version — real auth, Postgres/Prisma, Stripe Connect
checkout with escrow hold/release, S3-backed uploads, an admin panel — see
the `main` branch history before this demo variant, or the companion
full-stack build.

## What works

- Browse/search/filter listings (manufacturer, material type, condition,
  price, quantity, distance) over the mock dataset
- Listing detail pages, including the dye-lot / box-label provenance section
- Login, register, and "list surplus material" forms — fully validated with
  the same Zod schemas as the real app, just not persisted anywhere

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000. No `.env` file needed.

## Deploying

Push to Vercel (or any static/Node host) — no environment variables, no
database, no external services required. `next build` produces mostly
static pages since nothing here depends on runtime data.
