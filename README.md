# Surplus Flooring Marketplace

A marketplace for buying and selling surplus flooring material — leftover
stock from completed jobs, distributor overstock, and take-up material.
Listings carry the manufacturer/product-line/color-number/dye-lot detail a
repair job actually needs; checkout runs through Stripe Connect with funds
held until the buyer confirms receipt (or a hold window elapses).

## Stack

- **Next.js 16** (App Router, TypeScript) — one codebase for B2B and B2C
- **PostgreSQL + Prisma** — relational schema for the filter-heavy listing data
- **Auth.js** (Credentials provider) — email-verified accounts, JWT sessions
- **Stripe Connect** (Express accounts, separate charges & transfers) — escrow-style
  hold/release without hand-rolled money logic
- **S3-compatible object storage** — listing photos and verification docs via
  presigned uploads
- **Vercel Cron** — hourly auto-release job for held funds

## Local development

### Prerequisites

- Node.js 20.9+
- A PostgreSQL database
- (Optional) An S3-compatible bucket, Stripe test-mode keys, a Resend API key

### Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run db:migrate:dev # creates the schema
npm run db:seed        # creates an admin user + default platform config
npm run dev
```

Visit http://localhost:3000. Log in as the seeded admin with the credentials
from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in your `.env` (defaults:
`admin@surplusflooring.example` / `ChangeMe123!` — change these before
deploying anywhere real).

### Running without Stripe/S3/Resend configured

Everything except payments and file uploads works with just `DATABASE_URL`
set:

- **Email** falls back to logging the message (and verification links) to
  the server console instead of sending it.
- **Object storage**: without S3 credentials, the upload endpoint returns a
  clear "not configured" error instead of crashing. For local testing with
  real uploads, run any S3-compatible server (e.g. `npx s3rver` or MinIO) and
  point `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` at it —
  see `s3rver-start.mjs` for a minimal example.
- **Payments**: without `STRIPE_SECRET_KEY`, checkout and payout actions
  return a friendly error instead of attempting a Stripe call.

### Turbopack dev server

`next dev` (Turbopack) can leave a corrupted on-disk cache if killed
uncleanly or if two instances run concurrently. If `npm run dev` starts
throwing cache/compaction errors, run `./restart-dev.sh` (or manually
`rm -rf .next` after killing any stray `next dev` process) and start again.

## Environment variables

See `.env.example` for the full list with descriptions. Required for a
minimal working app: `DATABASE_URL`, `AUTH_SECRET`, `APP_BASE_URL`. Required
for a production deployment: everything in `.env.example`.

## Architecture notes

### Data model

`prisma/schema.prisma` is the source of truth. Key design points:

- **Listings** carry the precision fields as first-class columns (not a
  freeform description), so search/filter can run directly against them.
  `dyeLotNumber` is nullable on purpose — the UI shows "no dye lot on file"
  rather than hiding the gap.
- **Transactions** are a separate model from Listings/Offers with their own
  status machine (`PENDING_PAYMENT` → `FUNDS_HELD` → `RELEASED` /
  `DISPUTED` → `RELEASED`/`REFUNDED`, or `CANCELLED`), plus a
  `TransactionStatusEvent` audit trail. Commission and payout amounts are
  snapshotted onto the transaction at checkout time, so later changes to the
  platform commission % never retroactively affect past sales.
- **Offers** track counter-offer threads via a self-relation plus a
  `proposedBy` field, so the UI can always tell which side needs to act next.
- **PlatformConfig** is a singleton row (commission %, hold window) editable
  live from `/admin/config` — never hardcoded.

### Payments

Checkout uses Stripe Checkout Sessions in `payment` mode, charging the
buyer on the **platform's** Stripe account — not `transfer_data` at
purchase time. This is what makes the hold possible: the platform holds the
full payment in its own balance, and a separate `stripe.transfers.create`
call (in `src/lib/transactions.ts`) moves the seller's cut to their
Connect Express account only when funds are released. That release is
triggered by either the buyer confirming receipt or the `/api/cron/release-funds`
route (gated by `CRON_SECRET`, scheduled via `vercel.json`).

Commission is computed on the item price only; sellers keep 100% of the flat
shipping fee they set at listing time, since it's a pass-through cost.

### Scope decisions worth knowing about

- **Whole-lot purchases only.** Buy Now and accepted offers purchase the
  entire listed quantity — there's no partial-quantity checkout. Flagged as
  a deliberate v1 simplification, not an oversight.
- **Email+phone verification gates listing/buying; phone verification itself
  does not.** Email verification is a hard gate (`requireVerifiedUser`).
  Phone verification exists (OTP via `src/lib/sms.ts`) but isn't wired as a
  transacting gate, since no SMS provider is specified in the brief and a
  hard-blocking gate with no real SMS backend would make the app unusable
  out of the box. `sendSms` is a one-function seam — plug in Twilio/SNS
  there to make it a real gate if desired.
- **Dispute resolution has two automated paths**: release the held funds to
  the seller, or fully refund the buyer. A "partial" `DisputeStatus` exists
  in the schema for future use, but v1 doesn't automate a split
  refund/payout — the brief calls for manual admin resolution, not automated
  arbitration, and the two common outcomes are the ones that are safe to
  automate.
- **Geocoding** falls back to a built-in table of major Canadian city
  centroids when `MAPBOX_TOKEN` isn't set, so distance search works without
  a paid API key. Set `MAPBOX_TOKEN` for real address-level geocoding.

## Deploying

1. **Database**: provision Postgres (Neon, Railway, Supabase, RDS — anything
   reachable over `DATABASE_URL`). Run `npm run db:migrate` (uses
   `prisma migrate deploy`, safe for production) as part of your deploy step,
   then `npm run db:seed` once to create the first admin.
2. **App host**: Vercel is the path of least resistance — `vercel.json`
   already declares the hourly cron job. Railway/Fly work too; just wire up
   an external cron hitting `/api/cron/release-funds` with
   `Authorization: Bearer $CRON_SECRET` hourly.
3. **Stripe**: create a Stripe account, enable Connect, add a webhook
   endpoint at `<APP_BASE_URL>/api/stripe/webhook` subscribed to at least
   `checkout.session.completed` and `account.updated`, and set
   `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.
4. **Object storage**: create an S3-compatible bucket (S3, R2, B2) with CORS
   allowing `PUT`/`GET` from your app's origin, and set the `S3_*` env vars.
5. **Email**: create a Resend account and verify a sending domain, set
   `RESEND_API_KEY` / `EMAIL_FROM`.
6. Set `AUTH_SECRET` (random, `openssl rand -base64 32`), `CRON_SECRET`
   (random), and `APP_BASE_URL` to your production URL.

## Assumptions

Per the build brief: Canada-first (CAD currency), one codebase for both B2B
and B2C, "production-ready" means correct and safe at small-to-medium
scale rather than pre-hardened for massive scale. Flag any of these if
they're wrong for your use case.
