# Abu Bakkar Academy — enrollment site

Next.js 14 · Tailwind · Supabase · Vercel.

## Setup
1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` → `.env.local` and fill in values.
4. `npm run dev` → http://localhost:3000 · admin at `/admin` (uses `ADMIN_PASSWORD`).
5. Deploy: import the repo in Vercel and add the same env vars.

## Launch flow
- In `/admin` → Programs: set fee, timings, teacher, start date, seats and status `open` (until then enrollment is closed).
- Settings: enter real JazzCash / Easypaisa / bank details.
- Parents enroll → pay → submit transaction ID → you verify in admin → confirmation page + WhatsApp/email (auto if API keys set; otherwise use the "WhatsApp parent" button).

## Notes
- Logo files: `public/logo.png` (full, with tagline) and `public/logo-compact.png` (navbar/footer).
- Contact number is set in `lib/contact.ts` (override with `NEXT_PUBLIC_WHATSAPP_NUMBER`).
- Replace the placeholder text in the Privacy and Terms pages and have all policies reviewed before launch.
- Ad concepts and rules: `ADS.md`.
