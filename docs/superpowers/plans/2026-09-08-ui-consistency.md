# SignedPrice UI consistency and reliability

> **For agentic workers:** Use executing-plans. The Site owner integrates source changes; parallel agents provide read-only research.

**Goal:** Make the existing four-city product visually coherent and repair navigation, forms, media and editorial discovery without losing existing calculations or saved places.

**Architecture:** Retain Next.js, current routes, source stores and publication gates. Extend the green editorial brand through shared tokens, make city navigation section-aware, and reuse a small formatted-amount input. Keep photos in the existing licensed registry and serve resized static assets; no new paid infrastructure.

**Tech Stack:** Next.js 16, React, CSS Modules, Vitest, existing Postgres and static snapshots.

**Spec:** User's 14-point request plus the additional simple Explore marker request; attached screenshots 01–12.

## Global constraints

- Existing URLs, calculators and local saved data remain compatible.
- No fabricated building photos or inferred Japanese building transactions.
- No new paid services, broad noindex rules, or unreviewed news publication.
- Body 16px; controls 14px; shared green accent, red saved heart, calm neutral canvas.
- Headings can wrap naturally where required; prevent accidental narrow columns, clipping and overlapping figures.
- User explicitly requests autonomous execution, GitHub upload and preview verification before production.

## Execution

- [x] Navigation: test section-preserving city destinations, repair header alignment and menu dismissal; Tokyo receives its own real Explore destination.
- [x] Inputs and save: test comma/decimal normalization; apply shared amount input without changing calculation values; retain storage keys and use red hearts.
- [x] Common visual rhythm: align Home Search and Passport; unify canvas, type scale, card padding and content width across Tools, Check, Saved, News and Guides.
- [x] Explore and detail: replace dashed map clusters with simple numeric markers; balance summary metrics and charts; remove empty media slots and show only verified imagery or explicit compact no-photo treatment.
- [x] Singapore and Tokyo: repair graph date domains and missing-photo layout; add relevant licensed region imagery when available; provide Tokyo Overview/Explore navigation within actual data scope.
- [x] Performance and publishing: trace Check/results, cached snapshots and news review/publication; fix measured causes while retaining last-good data and editorial checks.
- [x] Verification: focused unit tests, typecheck/build, desktop/mobile browser checks of navigation, input, save, calculation, media and content; independent read-only review; push to GitHub and validate preview before production.

## Release evidence and boundaries

- TypeScript validation passed. The staged source tree passed 335 test files / 2,769 tests, including 27 isolated PostgreSQL/WASM publication tests; 12 unrelated optional tests were skipped. The clean source export excludes local generated build diagnostics.
- Local isolated build cannot download the external Korean font in this runtime; the Vercel preview build is the release gate, not a claimed local build success.
- Independent review found and prompted repairs to the Dubai editorial-market constraint, cross-market news matching, broken-media fallback and desktop menu dismissal.
- Three licensed Singapore regional-context photos are served as static 480px WebP assets (124,164 bytes combined). They are explicitly not photographs of searched buildings. Exact building-photo coverage remains limited to the existing verified registry; no synthetic substitutes.
- News discovery only links to eligible reviewed articles from the same market. Live Neon inspection found 1,291 collected external items, all awaiting review, and zero database editorial articles. Checked-in reviewed editorial content still renders. There is no safe existing all-locale portfolio seed: 37 English/Korean pairs share slug keys. Do not describe the fresh external-headline feed as fixed end-to-end or auto-publish the backlog.
- Tokyo now has Overview and Explore routes and complete public metadata. Live preview shows no published data and Neon has zero Japan area records. Its existing atomic operator pipeline still needs an authorized, configured run. The scheduled scope is Minato only, not an all-23-ward backfill; no named-building transactions or unsupported rankings are invented.
- Existing Neon media is reused. At inspection there were 26,706 photo metadata rows but only 82 approved records (12 Seoul, 70 Singapore); these are not 26,706 verified image files. New QA branch `codex-ui-polish-qa-20260908` tested migration 0016 without modifying production rows.

### Live preview walkthrough

| Surface / journey | Directly observed |
| --- | --- |
| Home | Four city actions, grouped budget input, USD 750,000 submitted into three-city Passport results and candidate links |
| Singapore | CCR regional image, exact approved THE SAIL photo, project detail to price check; SGD 1,800,000 submitted correctly; A/B compare shows both results |
| Seoul | Rent filter label, Gangnam list, red saved heart, saved state retained on building detail, transaction chart/table and Explore return link |
| Saved | Singapore candidate persisted after reload; storage keys retained; Dubai navigation reaches its own Saved destination |
| Costs | Synthetic KRW scenario returned 6.19% on KRW 1.05 billion total acquisition cash; Dubai AED 2 million / AED 120,000 annual-rent input returned 6.0% gross |
| Content | News index, actual article, Guides index opened; readable bounded columns verified; external-news publication gap recorded above |
| Rankings | Seoul price order and detail links observed; oversized title and district-only hub copy caught and corrected in follow-up |
| Tokyo | Overview, Explore filters and section-preserving city switch observed; unavailable published-data state explicitly retained |
| Maps | After deployment, production Singapore Google map rendered numeric 969 / 1,661 / 1,232 markers with solid pill styling and no dashed decoration |

- The first complete browser gate passed 467 cases, skipped 25, and failed 13: integer keypad, Tokyo missing OG metadata, intentional title/screenshot changes, and one A/B navigation race. These were diagnosed and repaired rather than bypassed. Screenshot artifacts were visually reviewed before updating their baselines.
- Direct Home re-check found Passport's old hard-coded blue overriding shared styling; all Passport actions now use the shared token, with a new passing browser color assertion.
- Final browser CI passed 480 cases with 25 conditional skips and zero failures. V2 verify/build, mobile regression and the final preview build also passed on `81b468d0495c135c17916832b95cb0bf22897b9f`.
- PR 244 was merged as `52ec52aeb4819b2154e63f716cab611e4e48413a` after the approved preview gate. Production deployment `dpl_5YLftx8ZQgM9aekfJ5V3EHxxe4UN` is READY and assigned to www.signedprice.com and signedprice.com.
- Public-site smoke checks passed: Home four-city destinations, matching green Search/Passport actions, numeric Singapore map markers, and a synthetic USD 750,000 Passport submission returning all three supported city results. Production Saved entries were not changed. Production prebuild applied all 16 migrations successfully; the nearby-place seed reported changed=0, upserted=0 and pruned=0.
- The durable release record is PR 244. Implementation and release checkmarks do not imply all data operations are complete; the news/Tokyo/media boundaries above remain follow-up work.
