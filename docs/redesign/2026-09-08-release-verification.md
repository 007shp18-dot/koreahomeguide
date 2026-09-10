# First release verification

## Baseline and recovery

Production baseline: 6f85c351121967eec4c2d301ecc41b2ff43d62d6. Existing production deployment dpl_HsndjLvRm8ceCbnBaJj4SrfNDkWV remains the code rollback target. The Sites design reference is unchanged.

## Local gates

- Final full Vitest run including browser-review fixes: 331 suites and 2,719 tests passed, with both optional PostgreSQL suites enabled and zero skipped tests (53.32 seconds). Full workspace TypeScript checking also passed.
- Production build and full TypeScript checking passed. Later narrow detail/navigation fixes passed their focused tests, TypeScript and lint.
- Frozen dependency lockfile retained. No paid service or production environment file added locally.
- Review found and fixed tracking-query rejection in Tokyo, uncached Japan reads, Tokyo fake actions, and Save missing from actual exact-evidence Detail.

## Database and collection evidence

Migration0015 was independently reviewed, applied successfully to isolated Neon branch br-dry-pine-b3kxyxdy, then applied transactionally to production main br-super-butterfly-b31hhh93. It adds regional Japan storage and extends allowed jobs; existing prices are not replaced by this migration.

Seoul sale production run7, 2026-09-08T08:36:32Z: succeeded, received5637, inserted5637, unlinked0. Repeat run8, 08:45:08Z: succeeded, received5637, inserted0, updated0, unchanged5637, unlinked0.

Vercel Production config SIGNEDPRICE_MARKET_REFRESH_JOBS changed from kr-seoul-sale to kr-seoul-sale,kr-seoul-rent,sg-private-sale,sg-private-rent. SIGNEDPRICE_JAPAN_REFRESH_ENABLED=true added. These changes require the new production deployment; remaining canaries will be recorded after it. Secret values were not exported from Vercel.

## Publication boundary

Existing Seoul/Singapore/Dubai collection writes source records and normalized observations. Existing Explore/Ranking/Check continue to share validated installed public snapshots. Collection success is not claimed as automatic publication. Seoul current public period is seven completed months (February–August2026); the incremental canary covers August/September and cannot safely be appended to aggregate public artifacts. Complete public price regeneration uses the existing protected snapshot runner and validated artifact release. Japan has a separate fully staged, atomic regional publication flow and short shared public cache.

## Browser review

The isolated local preview renders the actual installed public snapshots. Desktop Main search reached the matching Gangnam Explore results; the four city photos loaded at equal dimensions. The main heading has two intentional desktop lines. Seoul rankings display medians in descending order and link to the matching districts.

A 390px iframe viewport check of Main, Explore and Tools produced 375px usable document widths without page-level horizontal overflow. The mobile menu exposes all five sections, four cities, Saved and language choices. All seven existing tools remain linked from their three groups.

Visual review found legacy button styles stretching Explore rows to 266px. Scoped compact actions reduce desktop rows to 133px, with small 128×96 thumbnails and a short accessible no-photo placeholder. Mobile rows measure approximately 128px. The four mobile view choices now share one full-width row (79.25px each in the inspected viewport), without horizontal scrolling.

Building links now carry the transaction explicitly, including the default Sale selection. Regression coverage follows the rendered Sale link into the evidence model for a building with both sale and rental records. The existing static canonical page and query-aware client architecture are preserved; server fallback content can show the canonical cohort until the client loads the requested selection.

The local preview does not establish a successful hydrated interaction gate: Save clicks and unrelated scenario-calculator inputs did not update React state. The isolated Next development server also logs `uv_resident_set_memory` errors; this is recorded as a preview limitation, without claiming a proven application root cause. Deployed browser checks must cover Save persistence, calculations, map activation and return-position restoration.

## Approval boundary

Automatic approval review initially rejected the GitHub branch push because the destination and source payload were not explicitly authorized. No alternate transport was attempted. The user subsequently gave explicit approval to upload to `007shp18-dot/koreahomeguide`, verify Save and calculation functions in the deployment preview, and deploy to `www.signedprice.com`. The approved payload is the committed source, tests, non-secret configuration and implementation documents on `codex/revenue-ux-seo-20260908`. The release proceeds through the existing CI and browser gates before production.

The existing Vercel production deployment remains live. Database migration and the non-secret production collection flags described above have already been applied; the flags become effective on the next deployment.

## Remaining release gates

GitHub CI, deployed browser review, Japan first real source collection/publication, Singapore/rent canaries and production smoke checks are pending at this checkpoint.
