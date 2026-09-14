# SignedPrice content quality follow-up — 2026-09-14

## Reason for this change

The AdSense notice identifies low-value content, but does not identify offending URLs. Public review found useful existing market reports that were not visible on the homepage, unrelated neighbourhood recommendations on Seoul building pages, and technical missing-data language that was difficult to interpret.

## Changes

- Surface three existing September market reports on the English, Korean and Chinese homepages, using their published titles, decks, canonical links and dates. This is a curated selection, not an automatic publication feed.
- Link Seoul building readers to the corresponding city research index instead of implying that one selected neighbourhood story describes every building.
- Explain unavailable supplemental building facts in reader-facing language while preserving the separate reasons and transaction records.
- Describe publisher responsibility, AI assistance, source-based reporting and the limits of neighbourhood guides on the existing Data & sources page. No individual authors, inspections or blanket human-review claims are invented.

## Page volume and scope

The public root sitemap had 48,710 URL entries and the Singapore sitemap had 35,787 when inspected. These include language variants and are not counts of distinct articles or Google-indexed pages. A complete production content-depth audit has not been performed.

Existing Seoul indexing requires a named building/neighbourhood and at least three usable transaction records or qualifying published evidence. HDB indexing requires the configured publication minimum and a published median. These are existing product thresholds, not Google approval requirements. This change does not alter indexing thresholds, source rights, stored data, article publication, schedules or approval policy.

Official policy references:
- https://support.google.com/publisherpolicies/answer/10502938?hl=en
- https://developers.google.com/search/docs/essentials/spam-policies#scaled-content
- https://developers.google.com/search/blog/2023/02/google-search-and-ai-content

Page volume and AI use alone do not establish the rejection cause. These improvements do not guarantee AdSense approval. Full content-depth review and an operator's later review request remain separate from this UI change.

## Verification

Targeted homepage, reading, trust and building rendering tests, TypeScript and lint are run before publication. Browser checks retain mobile overflow, touch-target and visual comparison gates; homepage baselines must be reviewed for the intentional new section. No production database migrations are run locally.
