# Japan regional transaction publication

Japan XIT001 uses anonymous ward/quarter transactions, not property identities. This implementation adapts PR242's registered official endpoint and field parsing; it does not merge its branch or publish cached API responses directly.

## Source contract

Official documentation checked 2026-09-08:

- https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/ — city, year, quarter, English output and priceClassification=01 (MLIT transaction price information only, excluding the distinct RMI classification).
- https://www.reinfolib.mlit.go.jp/help/apiManual/ — server-side subscription header, avoid bursts, XIT001 returns HTTP 404 when data is absent.
- https://www.reinfolib.mlit.go.jp/help/termsOfUse/ — PDL1.0 baseline, source attribution, identify editing, quarterly additions and retrospective additions.

The initial bounded rollout used Minato 13103 / 2025 / Q4. The source contract and storage support all 23 Tokyo wards; Minato was an operator scope, not an MLIT coverage restriction. No fixtures are exposed by the public API or page. Years from 2024 through the current UTC year and the 23 Tokyo wards are accepted. One complete ward/quarter response is limited to 8 MiB decoded and 10,000 records. The previous 2,000-record truncation is removed; larger complete results are staged in 2,000-row chunks. Over-limit, malformed, mismatched-period/ward, absent-source and explicitly incomplete responses do not publish.

## Storage and atomic publication

Migration `0015_japan_area_releases.sql` registers Tokyo, its source and attributed rights policy, extends existing run/lease job constraints with `jp-tokyo-sale`, and adds three regional tables. No synthetic property_entities or observed_at contract dates are created.

- `japan_area_releases`: full bounded raw response, SHA-256, canonical multiset hash, exact retrieval instant, request scope, parser version, source_records link, run link, release history, added/removed/retained counts.
- `japan_area_records`: anonymous normalized members attached to an immutable release. A reference is scope + full disclosed-row content hash + occurrence number, **not an official transaction ID**. Identical disclosed rows preserve multiplicity. JSON field order and response ordering do not create new public transactions.
- `japan_area_publications`: one current complete release per ward/quarter.

The existing `source_records.object_reference` points to the actual raw_payload in the regional release, e.g. `neon://japan_area_releases/<release-id>/raw_payload`. Bounded raw payloads stay in Neon; no paid storage service was added. Source metadata includes request/classification/language, response ETag/Last-Modified when supplied, parser and run. Repeated identical raw responses reuse their original source_record, while each attempted release retains its own raw payload and retrieval time.

`activate_japan_area_release` locks and checks the existing 10-minute lease and matching running execution, verifies actual row count, source row count, raw hash and multiset hash, then publishes an evidence_releases entry and changes the pointer in the same PostgreSQL transaction. Failure in any earlier chunk, validation, publication write or stale lease leaves the prior pointer and prices unchanged. Expired runs are marked failed when a new worker recovers the lease. A >50% record-count reduction is blocked unless an authenticated operator has reviewed and explicitly allowed it.

Corrections/removals replace a complete scoped snapshot; old versions and values remain addressable via release-pinned pagination. The provider supplies no stable identity to pair individual corrections or label a removal as a cancellation. Accordingly, run `updated` is zero; release-level added/removed/retained counters describe the evidence honestly. Run inserted/unchanged counts compare multiset members. Unlinked is zero because the subject is the ward, not a missing building.

Public `/api/japan/transactions/` reads only these publications, in a single MVCC statement for metadata/count/page. `/jp/tokyo/` filters neighbourhood/layout/built-year text, ward, quarter, type and numeric area; sorts all matches by price descending before 20-row pagination. Pagination pins a release; new searches select current data. Retrieved-at is read from storage and never restamped during public reads. All currency is JPY and time precision is quarter. Numeric area filters exclude nonnumeric disclosed ranges. No building imagery/precise pins are inferred. Query variants are noindex.

## Root/operator production steps

No production data collection, migration, deployment or environment change was performed while implementing this code.

1. Review migration 0015 independently. Check pending migrations before using the existing runner; it applies **all** pending migrations. From `v2/apps/web`, with the intended environment scoped to the process, `node scripts/apply-content-database.mjs`. The existing runner wraps each migration in a transaction and records its filename in signedprice_schema_migrations. Do not invoke a production prebuild merely to test code.
2. From `v2`, inspect the no-network/no-write plan:

   ```sh
   node --conditions=react-server --experimental-loader ./scripts/typescript-extension-loader.mjs --experimental-transform-types scripts/refresh-japan-area.mts --city=13103 --year=2025 --quarter=4
   ```

3. With the existing `DATABASE_URL` and `SIGNEDPRICE_REINFOLIB_API_KEY` injected server-side, repeat with `--execute`. The command outputs only state, scope, run release/hash/count and retrieval time, never keys or raw provider errors. Repeat with `--verify` for a bounded read of the selected public snapshot (count, first-page count, currency, precision, source instant).
4. Compare the exact received count from execute with the sourceCount/filteredCount from verify and public API. An unfiltered first page has min(20, count) rows. Load `/jp/tokyo/?city=13103&year=2025&quarter=4`, paginate and verify the response keeps the release ID and source instant. Run execute again: public count must remain unchanged; latest run inserted=0 and unchanged=received.
5. If a candidate fails `source_count_reduction`, compare the complete retained raw responses and provider publication changes before using `--allow-large-reduction` together with `--execute`. The ordinary cron cannot use this override.
6. Enable `SIGNEDPRICE_JAPAN_REFRESH_ENABLED=true` only after the verified operator flow succeeds and the existing CRON_SECRET is available. The Vercel cron runs at minute 40 of every UTC hour and fetches exactly one ward and one quarter per invocation. The absolute UTC hour rotates over all 23 wards; each aligned 23-hour block visits every ward once, and successive blocks rotate over the previous eight completed quarters. Near the start of the supported 2024 range, only completed supported quarters are selected. A full 184-invocation cycle takes about eight days while the completed-quarter window is unchanged, assuming the cron is enabled, invocations run, and the provider succeeds. Deploying this schedule does not mean all scopes have been collected or published.

   There is no Minato-only bootstrap or publication prerequisite. A missing provider quarter or failed request retains prior published data and does not trap later hourly invocations on the same scope. The global `jp-tokyo-sale` lease still permits only one active refresh across all wards. Operator backfills must run explicit ward-quarter scopes sequentially, preserving a gap between provider requests; do not launch all wards in parallel. Review actual public counts and refresh-run outcomes before claiming coverage is complete. This schedule adds no bulk collection endpoint and does not change the existing authorization or enabled gate.

Authenticated HTTP alternative after deployment:

- POST `/api/internal/japan-refresh/?city=13103&year=2025&quarter=4` with the existing `CONTENT_ADMIN_SECRET` Bearer authorization.
- GET `/api/internal/japan-refresh/` with existing `CRON_SECRET` requires the enabled gate and chooses one scope from the hourly 23-ward rotation. Supplying a complete explicit `city`, `year`, and `quarter` selects that scope instead, with the same authentication and enabled gate.
- The operator POST accepts `allowLargeReduction=true`; GET rejects it.

Read-only operational checks can select the latest five `market_data_refresh_runs` for job jp-tokyo-sale (state, error_code, source_as_of, received, inserted, updated, unchanged, unlinked), join the selected japan_area_publications to japan_area_releases, and compare expected_count with actual count for its release_id. Avoid raw payloads or unbounded record scans in status checks.

## Local verification

Regular configured Vitest tests: `apps/web/test/japan-area-data.test.ts` and `japan-area-routes.test.ts`.

Seven additional tests execute the actual migrations, repository SQL and activation function in local PostgreSQL/WASM via PGlite. This is an optional test harness, not a production dependency. Install `@electric-sql/pglite` in a temporary directory, then run:

```sh
JAPAN_TEST_PGLITE_MODULE=/absolute/path/to/node_modules/@electric-sql/pglite/dist/index.cjs pnpm exec vitest run apps/web/test/japan-area-data.test.ts apps/web/test/japan-area-postgres.test.ts apps/web/test/japan-area-routes.test.ts
```

The PostgreSQL tests cover recollection, identical-record multiplicity, corrected/removed snapshot history, second-chunk failure, lease recovery/fencing, quarter-only non-building storage, and hash/count-reduction guards. Fixtures are explicitly representative disclosed inputs and are never installed as public data.

## Release review follow-up

Public reads now share a Next Data Cache entry for 60 seconds, keyed by market namespace, ward/quarter, release selector and all filters/page. Each value is bounded to a 20-row response. Success responses advertise a 60-second CDN lifetime; invalid, unpublished and storage-failure responses are no-store. Unpublished results and errors are thrown inside the cache boundary and are not cached. Operator verification deliberately continues to use the uncached repository. Public pages use Next's automatic dynamic behavior from searchParams, rather than force-dynamic overriding the cache. The application has not opted into Cache Components, so this change uses the existing `unstable_cache` API without changing global Next configuration.

Known attribution parameters (UTM, Google/Bing/Meta and other named click IDs) are removed from page filter parsing and pagination. Unknown filter names and duplicate actual filters still fail validation. The API remains strict and does not accept attribution parameters.

Residual integrity boundary: activation recomputes the original raw-payload hash and the multiset of record references, but does not recompute a separate digest of every normalized JSON field. The validated parser and single staging writer produce these fields; no public endpoint accepts normalized data or mutates it. An out-of-band mutation of only a normalized price while retaining its reference could pass the current database gate. Covering that low-priority review finding requires a separately versioned normalized-payload digest (and parser-version contract) checked inside activation. It was not retrofitted into the already-applied 0015 migration during the release follow-up. Restrict direct mutation of staged/published records to controlled operator work; do not treat the existing hashes as a guarantee against arbitrary database write corruption.
