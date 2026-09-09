# Data collection and publication operations

This release connects collection, review, publication and cost evidence. Collection success is separate from public publication. No pending fee or building candidate becomes public merely because an API returned successfully.

## Scheduled work (UTC)

| Work | Schedule | Behaviour |
| --- | --- | --- |
| Seoul sales / rent | 18:10 / 18:25 daily | Existing enabled-job and rights gates remain authoritative. |
| Singapore private sales / rent | 02:10 / 02:25 daily | Check current source data; stable records are unchanged. |
| Singapore publication | 02:50 daily | Validate a complete immutable release, then atomically move its pointer. Also attempted after a short successful collection. |
| Additional official pages | 03:05 daily | Registry enforces seven-day policy and thirty-day cost intervals, leases and retry backoff. |
| HDB buildings | 03:20 daily | Seven-day due check; complete paginated collection before committing candidates. |
| Consented Tool research | 00:43 daily | Existing 90-day expiry plus live aggregate health check. Only last aggregation time is retained. |

Existing Dubai jobs remain disabled unless their explicit source access and reuse gates permit collection. No unlicensed asking-price scraper is enabled.

## Operator workflow

Open `/admin/evidence/` and select **정기 수집 운영**. The screen separates official transaction jobs, page changes, HDB candidates and Singapore releases. It shows attempts, successful collection, counts, failures, anomalies, next due date and publication time where applicable.

1. Review the captured official page and its prior version. Marking a page reviewed does not approve a tax rule or monetary evidence.
2. For the reviewed AMK Town Council page, import eight standard-flat tariff drafts. Normal/reduced eligibility, council coverage, effective date and unconfirmed tax inclusion remain explicit. Re-import is idempotent; a later reviewed observation updates the same linked evidence with an audit history.
3. Complete and approve the source and monetary evidence using the existing evidence workflow. Building, home type, area and recurring period must match before an operating-cost suggestion appears. The user explicitly selects a starting cost; missing costs are never assumed zero. One-off repairs and ambiguous acquisition fees are not annualised.
4. Review individual HDB candidates. Approval requires a current candidate with an exact existing entity match; it publishes the official year, floors and dwelling count on the English/Korean HDB detail page. Version conflicts are rejected. Withdrawal removes the public pointer and retains audit history.
5. Run the K-apt runtime probe to test the configured public-data key against the current V3 repairs endpoint using an existing complex identifier. A successful sample still requires unit and denominator review. Keys and credential-bearing URLs are never returned.

## Verified isolated-database evidence

- Existing pool: 5,801 rows preserved; 3,180 unique official corroborations corrected into pending status with before/after audit records. Repeat apply changed zero rows. HDB resale 2,225; HDB rental 775; MOLIT 180. Remaining 2,621: ambiguous 2,360 and unmatched 261. HDB month precision is explicit; unknown rental areas stay null.
- HDB building API: 13,357 records across fourteen pages; 9,992 exact unique entity matches. Full repeat returned zero new/changed records. Pending → approved → stale-version rejection → withdrawn public visibility verified.
- Five official page monitors stored real captures. AMK tariffs imported eight pending records; repeat imported/updated zero.
- Singapore release: 134,266 sales and 34,326 rental records, with 1,250 rental groups meeting the minimum five-record threshold. Repeat preserved release ID and publication time. Rental ranges remain ranges, grouped by month/type/bedrooms/range; no exact-area yields are invented.
- Explore and Check share the release. Check deliberately excludes the incomplete current month; Explore may include it. Transport/cache fallbacks retain the served artifact's actual date.

## Safe replay

From `v2`, the backfill and Singapore publication scripts default to read-only validation; `--apply` is required for writes. Load the intended branch's `DATABASE_URL` through a protected environment file, never a command-line URL. Backfill is version-checked and resumable in 100-record transactions.

Scripts: `apps/web/scripts/backfill-property-pool.mts`, `publish-singapore-observations.mts`, `collect-additional-sources.mts`, and `verify-hdb-collection.mts`. Use the existing TypeScript loader with `--conditions=react-server` and `--experimental-transform-types` for `.mts` scripts.

Migrations 0021–0024 are additive to existing content and property data. Raw collection, review and publication storage has row-level security enabled; authenticated server routes mediate access. Preview builds do not migrate a potentially inherited production database.

## Explicit external dependencies

K-apt runtime subscription/units, OneMap production authentication, Dubai project-level costs and commercial reuse, and licensed listing feeds require verified provider access. They remain visibly blocked or diagnostic-only until verified. Policy page monitoring does not rewrite financial calculation rules automatically.
