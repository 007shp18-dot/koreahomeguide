# SignedPrice data audit — 19 September 2026

## Scope and evidence

Read-only inspection of production Neon project `delicate-scene-40576440`, default branch resolved by its default flag to `br-super-butterfly-b31hhh93` (`main`), on 19 September 2026. SQL results were compared with the current-main code and checked-in artifacts. All timestamps below are UTC unless explicitly marked KST. No production rows, credentials, environment flags, or publication pointers were changed.

Collection time, source contract period, and site publication time are different. The collectors' `source_as_of` values describe source retrieval; they are not the date of the newest contract. A successful run with no new rows does not establish stale collection.

## Findings by market

| Market | Latest collection evidence | Public evidence | Assessment |
| --- | --- | --- | --- |
| Seoul sale | Succeeded 2026-09-18 18:10:23.673; received 8,516, inserted 370, updated 15, unchanged 8,131 | Installed sale snapshot Feb–Aug 2026; generated 2026-09-02 00:00 | Collection is current (19 September KST); period matches completed-month policy, but no new artifact has been installed since September 2 |
| Seoul rent | Succeeded 2026-09-18 18:25:37.025; received 57,395, inserted 1,758, updated 32, unchanged 55,605 | Installed rent snapshot Feb–Aug 2026; generated 2026-09-02 00:00 | Same separation between daily collection and completed-month publication |
| Singapore private sale | Succeeded 2026-09-19 02:10:54.233; received 2,017, inserted 276, unchanged 1,741 | Active publication released 2026-09-19 02:11:08.336, 134,931 sale records | Collection and publication are advancing; latest contract month is September |
| Singapore private rent | Succeeded 2026-09-19 02:25:14.754; received 44,291, all unchanged | Same active publication, 44,291 rental records | August is the newest stored rental month; collection success without changes is valid |
| Dubai transactions / rent | Both skipped on 2026-09-19 with `job_disabled`; 8 skips per job from 12–19 September | Installed area artifact generated 2026-09-06 23:00; comparison 2026-06-08 through 2026-09-05 | Automatic collection is disabled; existing public area statistics are a separate artifact |
| Tokyo sale | Succeeded 2026-09-19 07:00:48.033; received 256, all unchanged | 2026 Q1 published for all 23 wards, 1,983 records; 207 published ward/quarter releases overall | Quarterly source period is distinct from latest collection time; all 23 Q2 scopes currently record `no_data` |

### Seoul: collection does not publish Explore

`app/api/internal/market-data-refresh/route.ts` calls the shared collector/persistence service for Seoul, but only Singapore jobs invoke a publication builder. `lib/public-market/korea-evidence-repositories.server.ts` loads the installed registry and verifies the compressed rent/sale artifacts. It does not read newly collected observations. The installed artifacts are cached within a deployment. Running collection again, invalidating a page, or changing the displayed timestamp cannot make those artifacts current.

`data/installed-snapshots.json` and `evidence_releases` agree on the Feb–Aug 2026 period and September 2 generation. Installed rent `recordCount` is 49,129; installed sale `recordCount` is 22,850. These are artifact counts and must not be equated with raw database observation counts.

The latest active live contracts are dated **17 September 2026**. Current active observation inventory:

| Schema | Active rows | August active rows | September active rows |
| --- | ---: | ---: | ---: |
| `kr-sale-recent@1` | 50,177 | 3,327 | 0 |
| `kr-sale-live@1` | 8,392 | 6,580 | 1,812 |
| `kr-rent-recent@1` | 177,641 | 27,444 | 0 |
| `kr-rent-live@1` | 58,127 | 41,963 | 16,164 |

Additional live sale rows: 168 cancelled and 43 superseded. Additional live rent rows: 191 superseded. The recent seed schemas use first-of-month observation dates; those cannot safely be interpreted as exact contract days. Seed and live schemas overlap in August. This proves overlapping coverage, not an exact count of duplicate contracts. Equal building, amount, area, and month can describe separate legitimate contracts; no amount-based deletion or deduplication was performed.

**Existing safe rebuild path:** the repository already contains protected Preview-only runners at `/api/internal/korea-rent-snapshot/` and `/api/internal/korea-sale-snapshot/`. They invoke `runKoreaPublicSummaryBatch` / `runKoreaSaleSummaryBatch`, then `finalizeKoreaRentSnapshotJob` / `finalizeKoreaSaleSnapshotJob`, and the artifact builders. Each collects **700 coordinates** (25 districts × 4 housing types × 7 completed months) into a separate runtime cache. Rent emits rent evidence, building inventory, and conversion evidence; sale emits sale evidence. Neither runner activates a public registry or reads the live Neon observations.

Both planners intentionally call `completedSeoulMonthKeys(referenceInstant, 7)`. A local, read-only execution of the actual planners returned Feb–Aug 2026 for `2026-09-19T00:00:00.000Z`, and Mar–Sep for `2026-10-01T00:00:00.000Z`, with 700 coordinates in each plan. Therefore September's exclusion today is **not itself a freshness defect**. A rebuild today can incorporate later corrections to completed months but should retain Feb–Aug coverage. September publication needs October's completed-month build or an explicit, separately designed partial-month policy; do not spoof a future reference instant.

**Precisely missing:** no newly built, verified artifact set and matching installed-registry digests were produced/installed by the nightly database collector. The database contains newer live contracts, but the existing runners require their own complete source-month cache. This audit did not inspect Preview runtime-cache contents, so it does not claim those cache entries are absent. Finalization explicitly rejects any missing coordinate with `source coverage is incomplete`. The seeded `recent@1` observation samples preserve month precision and minimal raw metadata; a straightforward union with daily observations is not a lossless reconstruction of the runners' full source records.

**Executable next step:** use the existing protected Preview runner pages with the configured server-only MOLIT key and `SIGNEDPRICE_INTERNAL_JOB_TOKEN`. Each page already executes the following protocol using the same actual reference instant throughout; this audit did not invoke the broad 1,400-coordinate rebuild:

```json
{"action":"batch","referenceInstant":"2026-09-19T00:00:00.000Z","cursor":0}
```

POST to the appropriate Preview endpoint with its Bearer token, repeatedly advance to the returned `nextCursor` until 700, then POST `{"action":"finalize","referenceInstant":"2026-09-19T00:00:00.000Z"}`. Fetch each returned artifact with `action: "artifact"`, its dataset (`kr-rent`, `kr-building-registry`, `kr-conversion`, or `kr-sale`), and each zero-based `chunk`. The built-in runner downloads the resulting bundle. Use the real current instant when executing, not the historical example above. The production endpoint deliberately returns 404; do not change `VERCEL_ENV` to bypass it.

Verify the bundle's outer SHA-256 and artifact parsers, compare counts and coverage to the existing release, replace the four compressed files and all corresponding registry metadata together, then build the derived identity index with `node scripts/build-building-identity-index.mjs` from `v2/apps/web` and test before deployment. For a future automatic database publisher, separately implement non-overlapping month selection/reconciliation, cancellation handling, duplicate multiplicity, rights/publication thresholds, and atomic activation; do not deduplicate by amount.

### Dubai: intentional schedule gate, separate artifact path

The latest transaction skip started 2026-09-19 01:10:28.353; rent skip started 01:25:29.287. Neither job has observations in the shared observation inventory. In `lib/market-data/refresh-service.server.ts`, `job_disabled` is returned when the job is absent from `SIGNEDPRICE_MARKET_REFRESH_JOBS`, before the configured DLD URL is checked. Therefore these skips establish that the jobs were disabled; they do **not** establish whether valid source URLs or credentials are configured.

The documented production enablement in `docs/redesign/2026-09-08-release-verification.md` listed Seoul and Singapore jobs, excluding Dubai. The scheduler contains both Dubai routes, but having a cron route is insufficient to enable a job.

The checked-in Dubai artifact has comparison period 8 June–5 September 2026, source transaction period 1 January–6 September, and source rent period 1 June–5 September. `lib/dubai/evidence-repository.server.ts` loads that rights- and digest-validated artifact. The shared DLD CSV importer does not rebuild this public artifact.

**Required next implementation:** verify current free official DLD CSV availability and exact URLs, expected download size and execution cost, then canary a bounded source import. Keep the artifact's approved rights, unit checks, and minimum publication count (30). Rebuild and validate the public comparison artifact separately. Merely enabling broad downloads would not close the publication gap, so no flag was changed.

### Singapore: published data is newer than the static seed registry

The active pointer joins to release `sg-publication:b115abf27eafc6f12394b3c0b05015497e1c384aa12dad14a3ef272e49076994`, with retrieval time 2026-09-19 02:10:41.000 and publication time 02:11:08.336. This is the appropriate database publication evidence; the old static `evidence_releases` / installed seed dates alone would incorrectly imply that Singapore is still at September 2.

The latest live sale `observed_at` is 2026-09-01 and rent is 2026-08-01, both month precision. They must be presented as September and August, not as specific contract days. Repeated rental imports legitimately report all rows unchanged.

### Tokyo: Q2 absence is recorded, not an empty published release

Published pointers cover 23 wards in each quarter from 2024 Q1 through 2026 Q1 (207 total). Q1 2026 has 1,983 transactions and latest retrieval 2026-09-13 13:00:48.135. The successful 19 September 07:00 run refreshed a 2024 Q3 scope, illustrating why a global latest-run timestamp cannot describe the latest quarter's source date.

For 12–19 September, the market run table contains 158 successes and 161 `failed/no_data` records. The separate `japan_backfill_attempts` table identifies all 23 Q2 2026 scopes as `no_data`, with retry times on 19 September between 15:15 and 16:55. Existing code applies a 24-hour source-absence backoff and retains published data. This audit does not claim Q2 is absent from every possible official source; it records what the configured source checks returned.

## Safe correction made

Fixed the operations screen's Singapore job mapping in `lib/data-operations/collection-view.ts`. The city used prefix `sg-singapore`, but real scheduled jobs are `sg-private-sale` and `sg-private-rent`. As a result, the Singapore overview incorrectly displayed no execution data, the Singapore city filter hid both jobs, and job labels omitted the city. The prefix is now `sg-`, consistent with actual job identifiers.

Added a real rendered `CollectionPanel` regression using successful Singapore sale/rent jobs. It failed before the fix (no `2 / 2` success summary), then passed after it. Focused verification:

```text
vitest run apps/web/test/collection-panel-render.test.tsx 
           apps/web/test/collection-view.test.ts 
           apps/web/test/operations-data-quality.test.tsx
3 files passed; 11 tests passed
```

This correction changes the accuracy of operational status, not source data or public publication. No unverified dates were advanced and no public snapshot was republished during this audit.

Also clarified the public Seoul overview: the former “Data updated” now reads “Latest snapshot built” (with Korean and Chinese translations and a localized date), contract periods remain separate, and a note explains completed-month publication and the validation/publication step after daily collection. Coordinated ownership with the Explore agent before editing. Existing overview and both snapshot builder/handler test groups passed: 5 files, 55 tests. No test was added solely to freeze editorial wording.

The planner evidence can be reproduced without network requests or database writes, from `v2`:

```bash
node --conditions=react-server --experimental-loader ./scripts/typescript-extension-loader.mjs --experimental-transform-types --input-type=module - <<'JS'
import { buildKoreaSaleSummaryPlan, buildKoreaPublicSummaryPlan } from '@signedprice/korea-rent';
for (const referenceInstant of ['2026-09-19T00:00:00.000Z', '2026-10-01T00:00:00.000Z']) {
  for (const [kind, build] of [['sale', buildKoreaSaleSummaryPlan], ['rent', buildKoreaPublicSummaryPlan]]) {
    const plan = build(referenceInstant);
    console.log({ kind, referenceInstant, coordinates: plan.length,
      months: [...new Set(plan.map(row => row.dealYmd))] });
  }
}
JS
```

## Reproducible read-only queries

```sql
-- Latest run per job. source_as_of is retrieval time, not contract coverage.
SELECT DISTINCT ON (job) job, state, source_as_of, received, inserted,
  updated, unchanged, unlinked, error_code, started_at, completed_at
FROM market_data_refresh_runs
ORDER BY job, started_at DESC, id DESC;

-- Preserve schema/status separation; do not sum overlapping schemas as unique contracts.
SELECT market_id, kind, local_schema_version, status, count(*) AS rows,
  min(observed_at) AS earliest, max(observed_at) AS latest,
  max(period_end) AS period_end
FROM observations
GROUP BY market_id, kind, local_schema_version, status
ORDER BY market_id, kind, local_schema_version, status;

-- Active Singapore publication, rather than the installed seed date.
SELECT r.id, r.source_as_of, r.released_at, r.sale_count, r.rent_count
FROM singapore_publication_active a
JOIN singapore_publication_releases r ON r.id = a.release_id;

-- Actual published Tokyo periods and ward coverage.
SELECT p.year, p.quarter, count(DISTINCT p.city) AS wards,
  sum(r.expected_count) AS transactions, max(r.retrieved_at) AS last_retrieved
FROM japan_area_publications p
JOIN japan_area_releases r ON r.id = p.release_id
WHERE r.state = 'published'
GROUP BY p.year, p.quarter
ORDER BY p.year DESC, p.quarter DESC;
```
