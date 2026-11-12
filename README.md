# Abu Bakkar Academy — website and enrollment system.

Next.js 14 · Tailwind · Supabase · Vercel..
## What it does
- Marketing homepage (Character Grooming = main service, Academic Tuition = second service), Parent Promise sharing.
- Enrollment wizard: service → class type (Group / Private) → package (Monthly / 3 / 6 months, or 4-week tuition) → age group or school grade + subject → details → total payable.
- Payment: manual verified transfer (JazzCash / Easypaisa / bank). The parent submits the transaction ID, an admin checks it against the real statement, and only then is the child enrolled.
- Admin dashboard at `/admin`: payments to verify, enrollments, parents and students, class batches and capacity, packages and prices, age groups, subjects, settings, revenue, ad sources, CSV export.

## Set up (once)
1. `npm install`
2. In Supabase → SQL Editor, run the whole of `supabase/schema.sql`. It is safe to re-run and never deletes data. It upgrades an existing database and fills in the packages and age groups.
3. Copy `.env.example` to `.env.local` (and add the same variables in Vercel → Settings → Environment Variables). Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET` (a long random string).
4. `npm run dev`, open `/admin`, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. That creates the first admin account; add more people under Settings.
5. In `/admin → Settings` enter your real JazzCash / Easypaisa / bank details. Until you do, parents are told to get payment details on WhatsApp.
6. In `/admin → Class Batches` create the batches (timing, teacher, capacity). Capacity drives the "Limited Seats Available" label.

## Payments
Manual verification is built in. A card/wallet gateway (JazzCash or Easypaisa merchant account) needs merchant credentials and is not connected; it would plug in at `app/api/payment/route.ts` and call the same database function (`verify_payment`) after the gateway confirms.

## Rules enforced in the database (`supabase/schema.sql`)
- An enrollment can only become `verified` if a verified payment exists.
- The fee charged at checkout is stored on the enrollment and can never change.
- The checkout price is read from `packages`, never from the browser; if it changed while a parent was filling the form, checkout stops and shows the new total.
- A transaction ID cannot be used twice. A class batch cannot exceed its capacity. Only verified students can be placed in a batch.

## Tests
- `npm test` runs the pricing tests and the database tests (the SQL runs on an in-memory Postgres, including an upgrade of the old database).
- Full browser test of the whole flow: start `node tests/mock-supabase.mjs` (a local stand-in for Supabase), run the site with `SUPABASE_URL=http://127.0.0.1:54321`, then `node tests/e2e.mjs` (needs `npm i puppeteer-core` and Chrome).

## Images and logo
- `public/logo.png` (full) and `public/logo-compact.png` (navbar, footer).
- Hero: uses the photo `public/hero-boy.jpg` cut from the designed banner (headline and supporting lines are editable in /admin → Settings).
- Contact number: `lib/contact.ts` (override with `NEXT_PUBLIC_WHATSAPP_NUMBER`).

## Before running ads
Read `ADS.md`. Confirm brand-name clearance, and have the Refund Policy and Privacy Policy reviewed.
