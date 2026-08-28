# Rent Check Seoul Coverage — Staged Spec

## Goal

Let users check rent quotes in all 25 Seoul districts without increasing the current Seoul-wide Explorer request fan-out or publishing thin neighborhood SEO pages.

## Stage 1 scope

- Add all 25 official Seoul district codes to the English and Chinese Rent Check selectors on the home and standalone tool pages.
- Keep Gangnam-gu as the default so existing cold-start behavior does not change.
- Accept all 25 codes in `/api/rent-check` only.
- Let Rent Check analytics and browser-saved comparisons retain all 25 district codes.
- Keep Korean district names visible next to English and Chinese labels.

## Explicitly unchanged

- Explorer selectors and the Seoul-wide map stay on the currently curated 10 districts.
- The Seoul-wide endpoint stays at 10 districts × 3 completed months.
- Rent-market pages, dynamic neighborhood SEO routes, sitemaps, and Chinese indexability stay unchanged.
- No new neighborhood names, map coordinates, or SEO pages are invented in this stage.
- Existing Rent Check API shape, GA4 event names, DOM IDs, and URLs stay unchanged.

## Later stages

1. Add the remaining districts to Explorer in bounded batches only after each batch has verified Korean/English/Chinese neighborhood labels and map coordinates.
2. Expand the Seoul-wide aggregate only after upstream-call, timeout, and cache measurements support it.
3. Add indexable neighborhood pages only when the existing transaction-count quality gate is met.
