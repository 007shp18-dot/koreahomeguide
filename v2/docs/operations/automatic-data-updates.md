# Automatic source updates — 2026-09-10 audit

Government-source collection and eligible headline metadata publication are authorized on a recurring basis. They do not need a new human approval on every run. Existing authentication, source rights, validation, last-good retention and provider limits still apply. Never invent a publication date or describe a successful ingestion as a successful public release.

## Operational schedule (UTC)

| Source / operation | Existing schedule | Public effect |
| --- | --- | --- |
| MOLIT Seoul sales | Daily 18:10 | Current/previous month, 25 districts, four housing types; validated observations feed public projections |
| MOLIT Seoul rent | Daily 18:25 | Same scope, keeping deposits/monthly rent and transaction types distinct |
| URA private sales | Daily 02:10 | Four batches; validated release and compact Explore index published after successful collection; daily 02:50 publisher retries deferred publication |
| URA private rent | Daily 02:25 | Current/previous quarters; range-based rental groups, never pretending to have exact area |
| HDB collections / buildings | Daily 03:05 / 03:20 | Official collections and block facts; public release remains separately validated |
| OneMap locations | Every four hours at :35 | Only verified entity locations; credentials/provider failures preserve the prior valid location |
| Dubai DLD sales/rent | Daily 01:10 / 01:25 configured, job allow-list currently disabled | Must resolve source URL, capacity and validated public-release path before calling this automatic updating |
| MLIT Tokyo housing | See `japan-area-refresh.md` | Bounded missing ward/quarter collection and verified release; no operator approval per run |
| Naver News + Google News RSS | Daily 00:17 | Metadata-only external headline links become visible after date, URL, city and housing-topic validation; cache refresh within 15 minutes |
| Official building facts | Every six hours at :17 | Verified facts; missing values remain unknown |
| Public entity projection | Daily 00:57; media-only every six hours | Public projection after checked inputs; separate from source collection |
| Scheduled editorial articles | Every 15 minutes | Publishes already eligible scheduled editorial content, not automatic unreviewed articles |

The deployment's `v2/apps/web/vercel.json` is authoritative for schedule changes.

## News repair

The September 10 run fetched and stored 602 items successfully, but all discovery rows remained `new`: the old public reader required an already reviewed article/source linkage. Consequently the scheduler worked while the visible news remained stale.

The new reader publishes only external title, publisher, original link and the source publication date from active Naver/Google discoveries. Descriptions, photographs, inferred buyer advice and financial assertions are not copied or generated. Future-dated, older-than-90-day, unrelated, malformed, inactive and rejected entries are withheld; caps are per city. Google links must remain on the official Google News hostname. Reviewed publications take precedence for the same URL; rejection or withdrawal still removes that URL globally. The public UI explicitly distinguishes automatically collected links from SignedPrice verified analysis. No editorial status or reviewer field is fabricated. Browser requests never collect or write data.

## Live audit evidence / unresolved operational blockers

At inspection:

- Seoul sale latest run succeeded with 5,959 source records; Seoul rent with 43,589 (September 9 UTC).
- September 10 URA sale failed `provider_unavailable`, rental failed `source_invalid`. The collector records only these broad codes; actual provider response is required to identify the rental incompatibility. Do not loosen the parser or claim it repaired without a valid source response.
- Both Dubai jobs recorded `job_disabled`. The earlier capacity runbook described a 486 MB database; current `pg_database_size` is 823 MB. This does not reveal the account's storage allowance. Do not enable the large normalized ingest based on an outdated free-tier assumption or purchase capacity implicitly.
- News cron succeeded September 8, 9 and 10. Latest run lasted about four seconds and stored 602 items. The publication repair consumes the existing persisted collection after deployment.

## Health verification

Check `market_data_refresh_runs` latest state/error/count per job and `ingestion_runs` for `external-news-discovery`. Then check the active publication pointer, source period and actual public result. A `skipped`, `failed`, or `withheld` state must not change the visible latest-source date. Keep provider failures distinct from an empty published dataset.
