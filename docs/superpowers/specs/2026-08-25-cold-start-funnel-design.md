# KoreaHomeGuide Cold Start Funnel Design

Date: 2026-08-25

## Goal
Reposition Phase 1 from a feature collection into one acquisition funnel for foreign renters.

Primary funnel:
`Visitor -> Rent Check start -> Rent Check result -> Email lead -> Optional help request -> Follow-up relationship`

Phase 1 optimizes trust and lead accumulation, not monetization.

## Product principle
The homepage is a funnel, not a feature directory. The primary action is checking whether a Seoul rent quote is fair using recent official signed transactions. Explorer, Guides, brokerage tools, and future relocation services stay available as secondary paths.

## Locales
Ship English (`en`) and Simplified Chinese (`zh-CN`) only. Japanese is deferred until EN/ZH traffic and conversion data exist. New lead and analytics contracts must be locale-neutral enough to add `ja` later without changing storage structure.

## Homepage flow
1. Hero: one pain statement, one primary CTA (`Check my rent`).
2. Trust strip: official signed transactions / built for foreign renters / no live listings.
3. Embedded Rent Check with current inputs and current MOLIT comparison algorithm.
4. Immediate ungated result: verdict, confidence, quote, comparable median, difference, comparable count, data period, comparables, and Fair Rent distribution where available.
5. Lead capture shown only after a completed result.
6. After lead success, optional high-intent help request.
7. Secondary discovery: All Seoul Explorer by budget and before-you-sign Guides.
8. Remove homepage prominence of Internet, SIM/eSIM, moving, cleaning, insurance, relocation, and generic Coming Soon cards. Keep them in the long-term roadmap, not the primary Phase 1 UI.

## Lead capture UX
The same shared lead module is used on:
- `/`
- `/tools/seoul-rent-check/`
- `/zh/`
- `/zh/tools/seoul-rent-check/`

English intent:
- `Keep this rent check.`
- `Get the detailed comparables + before-you-sign checklist by email.`
- CTA: `Send my report`

Do not use newsletter-first language such as Subscribe/Join as the primary value proposition.

The user must see the full Rent Check result before being asked for email.

After successful capture, show an optional prompt such as `Signing soon and need help? Tell us what you're worried about.` The help message is optional and never gates the result.

## Shared browser interface
Rent Check implementations should emit a stable result event instead of the lead module scraping DOM values:

```js
window.dispatchEvent(new CustomEvent('khg:rent-check-result', {
  detail: {
    language,
    sourcePage,
    districtCode,
    propertyType,
    depositWon,
    monthlyRentWon,
    areaSqm,
    rating,
    confidence,
    askingValueWon,
    medianValueWon,
    differencePct,
    comparableCount,
    monthsUsed,
    dataThroughMonth
  }
}));
```

The lead module keeps only the latest result context in browser memory.

## Lead data model
Store:
- email
- language
- district_code
- property_type
- deposit_won
- monthly_rent_won
- area_sqm
- rating
- confidence
- asking_value_won
- median_value_won
- difference_pct
- comparable_count
- months_used
- data_through_month
- source_page
- utm_source
- utm_medium
- utm_campaign
- referrer_host
- help_requested
- help_message
- created_at

Do not store raw IP addresses in the Sheet. Do not store the full comparable transaction list in each lead row.

## Lead API
Create `POST /api/lead` with two request types:
- `lead_capture`
- `help_request`

Validation:
- POST only
- same-origin/request-source guard consistent with existing public API protection
- normalized valid email with length cap
- locale allowlist: `en`, `zh-CN`
- supported Seoul district allowlist
- supported Rent Check property type
- non-negative deposit/rent
- positive reasonable area
- help-message length cap
- sanitized logging

Never log email, help message, webhook URL, or storage secret.

## Google Sheet storage
Phase 1 uses Google Sheet as a lightweight CRM.

Data path:
`Browser -> /api/lead -> Google Apps Script webhook -> Google Sheet`

Vercel env vars:
- `LEAD_SHEET_WEBHOOK_URL`
- `LEAD_SHEET_SHARED_SECRET`

The browser never receives either value. The server sends a server-to-server JSON request containing the shared secret; Apps Script validates it before appending a row.

If storage is missing or temporarily unavailable, Rent Check remains fully usable and the lead module alone shows a recoverable error.

Repeat emails are allowed because one renter may check multiple homes. Prevent accidental client double-clicks, but do not pretend an in-memory serverless Map is global deduplication.

## Email-delivery honesty
Do not claim a report was emailed unless a real mail-delivery integration has been implemented and verified. If launch initially stores leads only, use transparent early-access wording rather than fake delivery confirmation.

## Analytics
GA4 funnel events:
- `rent_check_start`
- `rent_check_result`
- `lead_form_view`
- `lead_submit`
- `help_request`

Allowed params include language, source_page, district_code, property_type, rating, confidence, comparable-count bucket, and sufficient/insufficient state.

Never send email, free-text help messages, name, phone, or other contact PII to GA4.

## Phase 1 KPI
Primary funnel:
`Qualified visitor -> Rent Check start -> Rent Check result -> Lead submit -> Help request`

Directional benchmark frame: 100 qualified visitors -> 30 Rent Checks -> 8 email leads -> 1-2 high-intent help requests. These are diagnostic targets, not promises.

## SEO guardrails
Preserve existing canonical URLs, EN/ZH hreflang, Rent Check URL, Explorer URLs, Guides URLs, sitemap behavior, and official-data disclaimers. Do not put useful SEO content behind an email gate. Do not remove district/Dong/Building SEO surfaces just because the homepage is simplified.

## Trust / monetization boundary
No monetization CTA influences the Rent Check verdict, comparable selection, Fair Rent metrics, or later safety interpretation.

Long-term roadmap remains:
1. Traffic + trust + leads
2. Foreigner-specific intelligence + relationship features
3. Downstream service/referral monetization
4. Housing/relocation marketplace

## Expected implementation surface
Existing:
- `index.html`
- `zh/index.html`
- `app.js`
- `zh/app.js`
- `tools/seoul-rent-check/index.html`
- `tools/seoul-rent-check/app.js`
- `zh/tools/seoul-rent-check/index.html`
- `zh/tools/seoul-rent-check/app.js`
- `styles.css`

New:
- `lead-capture.js`
- `api/lead.js`
- lead validation/storage helper under `lib/`
- `docs/operations/google-sheet-lead-capture.md`
- Apps Script setup source/documentation

Tests cover lead visibility timing, EN/ZH behavior, validation, secret isolation, storage failure behavior, PII-free GA events, homepage hierarchy, and existing Rent Check / Explorer / SEO / hreflang / sitemap regression.

## Out of scope
- Japanese UI/content/SEO
- affiliate/referral CTAs
- paid advertising
- partner-service monetization
- user accounts
- favorites/alerts
- full email marketing automation
- paid consultation
- marketplace booking/payment
