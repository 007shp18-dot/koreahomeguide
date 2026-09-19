# Data updates and article photography — 19 September 2026

Read-only inspection of `delicate-scene-40576440`, database `neondb`, production `main` / `br-super-butterfly-b31hhh93`. Database clock at first count: 2026-09-19 14:30:54 UTC; database size 1,161 MB. Inspection used bounded aggregates, scoped records and existing publication pointers. No ingestion, production writes, provider retries, approval changes or paid provisioning occurred in this audit.

## Source collection is not the public release

| Pipeline | Latest checked run (UTC) | Result | Public/source scope checked |
| --- | --- | --- | --- |
| Seoul sale | Sep 18 18:10:16–18:10:23 | Succeeded; 8,516 received, 370 inserted, 15 updated | 58,780 stored observations; newest recorded contract Sep 17. Latest `kr-sale` evidence release remains Sep 2, period Feb 1–Aug 31, 76,570 snapshot records. |
| Seoul rent | Sep 18 18:25:15–18:25:37 | Succeeded; 57,395 received, 1,758 inserted, 32 updated | 235,959 stored observations; newest recorded contract Sep 17. Latest `kr-rent` evidence release remains Sep 2, period Feb 1–Aug 31, 340,704 snapshot records. |
| Singapore private sale | Sep 19 02:10:41–02:10:54 | Succeeded; 2,017 received, 276 inserted | Active Singapore publication released Sep 19 02:11:08.336, source-as-of 02:10:41, 134,931 sales. Stored observations include September period records; different source/status filters mean raw count 135,976 is not the published count. |
| Singapore private rent | Sep 19 02:25:03–02:25:14 | Succeeded; 44,291 unchanged | Same active publication has 44,291 rental records. Latest raw period is August. The post-publication fetch was unchanged; do not relabel the release as 02:25. |
| Tokyo | Sep 19 07:00:47–07:00:48 | Succeeded; 256 unchanged | Maintenance checked an older scope. Latest published quarter is 2026 Q1: all 23 wards, 1,983 records. Q1 latest publication Sep 13 13:00:48.180. All 23 Q2 probes returned `no_data` Sep 18 15:15–16:55, each scheduled for a 24-hour retry. This supports provider no-data for the checked scopes, not an assertion of an unqueried future publication date. |
| Dubai sale/rent | Sep 19 01:10 / 01:25 | Both skipped `job_disabled` | No successful DLD scheduled run in the run table; no Dubai normalized observations. Bundled area artifact generated Sep 6 23:00, as-of Sep 5, comparison June 8–Sep 5. Transactions source extends Sep 6; rents Sep 5. |
| News discovery | Sep 19 12:17:19–12:17:20 | Succeeded; 796 fetched/stored | Collection freshness verified; this count is not the count of publishable editorial articles. |

The Singapore active release is `sg-publication:b115abf27eafc6f12394b3c0b05015497e1c384aa12dad14a3ef272e49076994`.

Seoul's public repository path (`korea-evidence-repositories.server.ts`, used by `area-route-model.server.ts` and `district-detail-route.server.tsx`) reads installed, verified snapshots. The checked-in sale/rent artifacts and the database evidence release metadata both retain September 2 / August-end scope. `market-data-refresh.md` explicitly states that daily normalized ingestion does not replace installed snapshots: that needs a separately validated projection. The September 19 Seoul editorial article correctly identifies its distinct fixed live-collection extraction and warns that Explore may use a different publication window. Do not change those dates or claim September daily collection has already updated every public summary. Deployment-specific snapshot overrides were not inspected in this audit.

Dubai exclusion is intentional: `scheduledJobState` requires the exact job in `SIGNEDPRICE_MARKET_REFRESH_JOBS`; it returns `job_disabled` before reading source URLs or fetching. The existing runbook requires storage headroom, validated source URLs, retention and public release checks. Current database size alone does not establish plan capacity. The bundled Dubai artifact permits the approved noncommercial use, but `canUseCommercially` is false. No flag was enabled and no full DLD download was launched.

Other persisted collections: OneMap latest Sep 19 12:35–12:38, unchanged with `ambiguous_matches:25`; HDB building latest Sep 14 03:20–03:21. HDB is healthy on its intended seven-day cadence: `data_collection_state` records next due Sep 21 03:21:05.935, zero consecutive failures, and no error/anomaly. The daily 03:20 cron checks this due date; it returns `not_due_or_busy` before writing a run when not yet due. A daily scheduler does not imply a daily source fetch. Policy source checks were Sep 17, consistent with their weekly monitoring scope.

## Integrity scope and results

475,008 observations total, 473,559 active. Checked joins found:

- 0 observations without a property entity or source record.
- 0 observation/entity market mismatches.
- 0 building photos without a building.
- 0 media assets without a property subject.
- 0 public media references without a media asset.
- 0 exact public images linked to a different media subject.
- 0 public images whose media is unapproved or whose joined rights disallow display.
- 0 content source links without a source.

These are scoped relationship and publication-gate checks, not certification of every source value or photograph's visual identity. No authentication tables or user submissions were inspected.

## Actual photograph availability

`building_photos`: 40,918 rows, comprising 99 approved (94 licensed URLs, 5 Google), 239 rejected, and 40,580 awaiting review. Approved rows comprise 18 Seoul and 81 Singapore. `public_entity_media` has 99 rows; latest published/checked September 11 13:00:39.317. Database storage of a candidate is not approval to display it.

There are 26 stored editorial articles, all market briefs/data stories, and initially **zero** `content_entity_links`. A bounded join found no approved public property canonical name of at least seven characters occurring in the current stored article bodies. A relationship must be editorially established; nearby or same-city photos are not a substitute.

Treasure at Tampines is verified as:

- Property: `sg-singapore:project:75399f9b26e04660cdd1f9451976c82ebdfd856d6aa87c7bc9e969f57c1df9d4`.
- Legacy building: `singapore:project:75399f9b26e04660cdd1f9451976c82ebdfd856d6aa87c7bc9e969f57c1df9d4`.
- Registry: `sg-project:OCR:TREASURE AT TAMPINES`.
- No approved media asset or public projection exists for this entity.
- Candidate 208 is an unreviewed NAVER/Weverse URL with unreviewed rights. It must not be published as the building.
- Google candidate 42308 matches provider place `ChIJ_09jj7cX2jERUU1pi8NTds4`; provider identity score .98 with name/country/distance evidence, checked September 11. It is not a visually approved licensed direct asset.

Google discovery automatically paused after HTTP 403 on Sep 19 00:47:08, until Sep 20 00:47:08. This is the existing automatic authentication/provider-error backoff, not an editorial rejection. There are 151 historic 403 attempts and 25 successful attempts, the latest successful one Sep 18. The precise upstream 403 body is not retained; billing, API enablement, key restrictions or permissions cannot be distinguished from that stored code. No backoff or access-control workaround was attempted. NAVER remains intentionally paused for `review-queue-quality-audit`; Wikimedia was ready at Sep 19 12:07:52.

## Code correction and bounded follow-up

The published-content query now resolves a photo only through an explicit same-market article → verified entity → exact public media relationship, with current rights, visual approval and legacy identity checks. It preserves the public reader's revocation and approval-timestamp gates. The returned photo carries the actual property name and attribution. Home, Insights and article rendering prefer this DB photo, then the article's own/curated selection. City fallbacks remain and now carry a visible localized city-context label on Home and Insights; no candidate was promoted just to fill a card.

Remote approved assets use `next/image` with `unoptimized` to display the existing public URL without adding an unrestricted image optimizer host rule. Parsed URLs must use HTTPS, contain no embedded credentials, and include subject/name/source/attribution. Google references are not converted into invented direct image URLs.

`2026-09-19-treasure-entity-link.sql` is the conditional two-relationship patch applied by the parent after validation on isolated branch `br-floral-paper-b3ldpq9c`. It checks exact article body hashes and property identity, inserts idempotently, and returns the exact rollback set. The parent verified a second isolated run inserted zero rows, then applied the patch to production: exactly the English and Korean Treasure article relationships were inserted with `created_at=2026-09-19T14:46:23.893Z`. Thus initial link coverage was zero; the two explicit Treasure relationships are now corrected. No photograph was created or approved, and article publication timestamps were unchanged. The exact returned row identities/time are retained in the SQL file for a narrowly scoped rollback if ever required.

The actual modified full query was extracted from code and executed read-only against production with `EXPLAIN ANALYZE`: all 17 English articles retained, 0 selected property photos as expected for missing links, execution 0.952 ms, no written blocks. The plan uses `content_articles_public_lookup`, `content_entity_links_pkey` and existing media/property/legacy indexes. No index or schema migration is needed.

Verification: TypeScript passed; ESLint passed for all edited photo/content files; nine focused tests passed across article-property-photo, editorial-database-dates and published-photo-selection. Full application/browser verification is coordinated by the parent.

## Bounded follow-up: Seoul promotion and HDB cadence

HDB's seven-day interval is declared in `lib/data-operations/registry.ts` and implemented in `runHdbBuildingCollection`. Verified production state: last successful collection `2026-09-14T03:21:05.935Z`, next due `2026-09-21T03:21:05.935Z`, consecutive failures 0, no last error/anomaly. No forced refresh is needed.

Seoul cannot be safely republished from current normalized observations using an existing script. The protected Preview-only sale/rent snapshot runners collect their own full source-month cache; their finalizers require every planned coordinate and reject incomplete source coverage. There is no installed observation-to-Seoul-publication adapter equivalent to Singapore's publisher. The legacy `recent@1` samples and daily `live@1` rows have overlapping August coverage and different date precision, so concatenating them would fabricate completeness and risk double counting. This audit did not inspect Preview cache contents or claim they are absent.

A local no-network execution of the actual sale/rent planners for September 19 returned 700 coordinates each, covering February–August 2026. The intentional seven-completed-month policy excludes September until the October reference window. A rebuild today can incorporate later corrections to February–August; it must not pretend the current month is complete.

The feasible existing rebuild is the protected Preview `/api/internal/korea-rent-snapshot/` and `/api/internal/korea-sale-snapshot/` batch → finalize → artifact protocol. It needs the configured server-only MOLIT key, internal job token, and complete runtime cache. Production endpoints intentionally reject these jobs; do not alter the environment gate. Together this can require 1,400 source coordinates, which is outside a bounded read-only follow-up. After collection/finalization, verify artifact hashes/parsers and coverage/count changes, update all four compressed rent/sale/inventory/conversion files with matching installed-registry entries, rebuild the identity index, and validate before deploying. No source call, finalization, registry replacement or date change was performed. The existing `docs/data-audit-2026-09-19.md` already documents this workflow in detail and was corroborated against the current handlers and planners.
