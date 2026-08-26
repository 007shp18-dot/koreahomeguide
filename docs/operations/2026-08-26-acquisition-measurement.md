# Acquisition Measurement Handoff

Status: Owner-review measurement procedure for the assumed 2026-08-26 deployment. Do not invent or backfill unavailable values.

## Production verification recorded on 2026-08-26

- Home, Rent Check, `robots.txt` and the root sitemap returned HTTP 200 from the public domain.
- The public Rent Check completed one valid Gangnam apartment calculation with 13 comparables across three completed months.
- This is a single smoke test, not proof of the 95% valid-request success target.
- GA4, Search Console, Vercel telemetry and Google Sheets delivery still require the owner-console checks below.

## Baseline capture

Before deployment, export Search Console performance data for the relevant entry pages and their page/query combinations. Retain the export date, comparison window, filters, and any data availability limits. Capture the fields: page, query, impressions, clicks, CTR, and average position.

Before deployment, export GA4 acquisition and funnel events for the same baseline window. Capture qualified entry sessions, Rent Check CTA clicks, Rent Check tool views, Rent Check starts, Rent Check results, sanitized Rent Check errors, lead form views, lead submits, help requests, and aggregate follow-up actions. Preserve the event definitions and reporting window used for each export.

Use these dimensions for both baseline and checkpoints where available: source page, query cluster, locale, district, property type, campaign, referrer host, and sufficient/insufficient result.

Exclude PII and sensitive detail from this handoff: no email, free-text help content, phone, exact quote amount, raw IP, or complete comparable list.

## Checkpoints

For an assumed deployment on 2026-08-26, capture and compare the same reports at these checkpoints:

| Checkpoint | Purpose |
| --- | --- |
| 2026-09-09 | Early signal review |
| 2026-09-23 | Initial trend review |
| 2026-10-21 | Week 8 review |
| 2026-11-18 | Longer-window roadmap review |

If actual deployment is later than 2026-08-26, shift all four dates by the same number of days.

## Roadmap diagnosis rules

1. No impressions: validate indexing, sitemap and canonical eligibility, then prioritize page discovery and query coverage work.
2. Impressions with no clicks: review title, description, answer-first opening, and search-intent alignment before expanding acquisition.
3. Clicks with no Rent Check starts: review landing-page message match, CTA prominence, and the entry-page path to the tool.
4. Rent Check starts with no results: investigate result-coverage sufficiency, form friction, validation failures, and result delivery before adding traffic.
5. Rent Check results with no follow-up action: review result usefulness, follow-up CTA clarity, help availability, and next-step relevance.

## Handoff record

For each checkpoint, retain the source exports, time window, filters, dimensions, metric values, data gaps, and the selected diagnosis rule. Compare like-for-like windows; record changes in tracking, deployment timing, or attribution before interpreting movement.
