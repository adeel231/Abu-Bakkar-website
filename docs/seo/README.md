# Quran international: audit baseline, architecture and tracking plan

Status as of 17 Nov 2026. This is what is built in the repository and what still needs a person with access.

## 1. Technical audit (code-level baseline)

| Check | Finding | Action |
|---|---|---|
| HTTPS / canonical host | `metadataBase` = `https://www.abubakkaracademy.com`. Redirect non-www to www is a hosting (Vercel domain) setting. | **Needs access:** confirm in Vercel → Domains. |
| robots.txt | Did not exist. Added `app/robots.ts` (blocks /admin, /api, /pay, /confirmation, /payment-review). | Done. Verify live at `/robots.txt`. |
| XML sitemap | Did not exist. Added `app/sitemap.ts` (public pages + all Quran pages). | Done. **Needs access:** submit in Search Console. |
| Canonicals | Quran pages set self-canonical via `meta()`. Older pages (home, services) have none. | Add canonicals to older pages next sprint. |
| noindex | None found in code. Admin has `robots: noindex`. | Verify live with URL Inspection. |
| Rendering | Quran pages are server components, content in the initial HTML (no click/scroll needed). Header/footer of older pages are client components. | Done for Quran. |
| hreflang | `en-GB` ↔ `en-US` between `/quran/uk` and `/quran/usa` only, each self-referencing. | Done. |
| Structured data | Organization + BreadcrumbList JSON-LD on every Quran page. Course markup deliberately not added (no documented courses with required fields yet). | Validate in Rich Results Test after deploy. |
| Performance | No images on Quran pages; pages are static and ~96 kB first load. | Run PageSpeed Insights on live URLs. |
| Forms | Server-side zod validation, honeypot, per-IP rate limit, no card data, consent stored with timestamp. Table has RLS enabled (service role only). | Add CAPTCHA if spam appears. |
| Analytics | GA4/GTM/Meta IDs come from the existing `Analytics` component. Quran events are fired with no personal or child data. | **Needs access:** set `NEXT_PUBLIC_GA4_ID` / GTM in hosting. |

Not possible from the repository: Search Console setup, live HTTP status checks, PageSpeed scores, Keyword Planner or Ahrefs/Semrush exports.

## 2. Keyword research

`keyword-research.csv` holds the seed keywords per country mapped to target URLs. **All metric columns are intentionally empty.** They must be filled from Google Keyword Planner (country = UK / US, language = English, network = Google Search) and recorded with date and filters. Numbers must not be estimated. Do not add volumes of overlapping variants.

## 3. Page architecture

| URL | Status | Notes |
|---|---|---|
| /quran | Built | Hub |
| /quran/uk, /quran/usa | Built | GBP / USD, hreflang pair |
| /quran/kids, /quran/female-teachers, /quran/pricing, /quran/book-trial, /quran/teachers | Built | Teachers page shows "coming soon" until real profiles are added in `app/quran/teachers/page.tsx` |
| /quran/noorani-qaida, nazra, tajweed, hifz, adults | Built (short first version) | Driven by `lib/quran.ts` → `SERVICES`. Expand after keyword data. |
| /quran/canada | Not built | Wait for research and UK/US performance |
| Safeguarding, privacy (child data) and cancellation policy pages | **Not built** | Must be written from real procedures. The kids page only states what is true now. |

Final mapping must be re-checked against the Keyword Planner export.

## 4. Booking funnel and lead system

Form → `POST /api/quran/lead` → `quran_leads` table (run the new block at the end of `supabase/schema.sql` in Supabase) → admin email + parent confirmation email → `/admin/quran-leads` to move a lead through: New Inquiry → Trial Booked → Trial Attended → Package Recommended → Payment Pending → Paying Student → Retained / Cancelled. Conversion dates are stamped on status change. The admin page flags inquiries unanswered for 24h and trials past their time and not marked attended.

Not built yet: automated reminders before the session, parent self-reschedule, scheduled alert emails, funnel dashboard by channel, referral credits, subscriptions.

## 5. Tracking plan

Events fired now from the form: `trial_booking_started`, `generate_lead`, `trial_booked` (Meta custom events also sent). Still to wire: `trial_attended`, `begin_checkout`, `purchase`, `subscription_renewed`, `subscription_cancelled` (server-side, from admin/payment status) and `whatsapp_click`. Events never include names, ages or contact details.

## 6. Dependencies on the business

- International payment provider (Safepay or other): approval, GBP/USD, settlement currency, recurring billing, refunds. Checkout is not built and must not go live untested.
- Safeguarding lead, teacher identity/background checks, safeguarding policy, recording consent.
- Verified teacher profiles and real availability per time zone.
- Hifz pricing stays hidden until specialist teachers exist (`NEXT_PUBLIC_QURAN_HIFZ_LIVE=true` shows it).
- Prices are launch prices pending approval.
