# SignedPrice Market Data Refresh Design

## Goal

Keep SignedPrice's Seoul, Singapore, and Dubai market evidence current using free official sources, without replacing valid database state when an upstream source fails.

## Scope

- Seoul sale and rent observations from the existing MOLIT clients.
- Singapore private sale and rent observations from URA.
- Dubai DLD transaction and rent CSV ingestion from configured official URLs, plus the same parser for operator-uploaded snapshots.
- A single authenticated internal refresh route, scheduled production jobs, idempotent database persistence, and operator-visible run records.
- No CAPTCHA bypass, paid provider, listing ingestion, or public Dubai property-detail release.

## Architecture

Each source adapter returns a provider-neutral batch of entities, source records, and observations. A database writer persists a complete batch transactionally: it upserts market metadata and entities, stores versioned source records, supersedes an older observation only when the same business key changes, and records the run result. The route selects exactly one job per request so failures and function time limits remain isolated by market and evidence kind.

The Seoul adapter refreshes the current and previous calendar months for all 25 districts and four supported housing types. The Singapore adapter uses four URA sales batches and the current and previous rental quarters. The Dubai adapter accepts only configured HTTPS URLs and parses official DLD CSV schemas. Automatic DLD runs retain the current and previous months from a full snapshot before normalization. An operator POST uses the identical parser for CSV deltas within the hosting request-body limit when unattended download is unavailable.

## Scheduling

- Seoul sale: daily at 18:10 UTC (03:10 KST).
- Seoul rent: daily at 18:25 UTC (03:25 KST).
- Singapore private sale: Tuesday and Friday at 02:10 UTC.
- Singapore private rent: 16th of each month at 02:25 UTC.
- Dubai transaction and rent: daily at 01:10 and 01:25 UTC; a missing official URL is a recorded `skipped` run, not a deployment failure.

## Data Integrity

- Business keys never contain price or rent, allowing corrections to replace the value instead of creating a false second deal.
- Duplicate source rows receive a deterministic occurrence suffix after stable sorting.
- Content hashes include the normalized observation payload.
- Exact reruns insert nothing and report unchanged rows.
- Changed content creates a new source-record version and marks the prior active observation `superseded`.
- Provider cancellations remain stored with `cancelled` status.
- Empty or malformed non-empty provider responses fail closed before persistence.
- Errors exposed by the route use stable codes and never include credentials or upstream URLs containing query secrets.

## Operations

`market_data_refresh_runs` stores job, state, source-as-of time, counters, stable error code, and timestamps. `market_data_refresh_leases` prevents overlapping executions. A lease expires automatically so a killed function cannot block future runs permanently.

Large batches are written in bounded 2,000-record transactions. This keeps each Neon HTTP request well below its transport limit while retaining idempotent retry behavior if a later chunk fails.

Required environment variables are `DATABASE_URL`, `CRON_SECRET`, and the relevant free-provider credential: `SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY` for MOLIT and `SIGNEDPRICE_URA_ACCESS_KEY` for URA. Dubai's optional URLs are `SIGNEDPRICE_DLD_TRANSACTIONS_CSV_URL` and `SIGNEDPRICE_DLD_RENTS_CSV_URL`; operator uploads require `CONTENT_ADMIN_SECRET`.

Scheduled writes are disabled by default. `SIGNEDPRICE_MARKET_REFRESH_JOBS` must explicitly list each enabled job, allowing one canary to be activated at a time after database-capacity verification. Authenticated operator CSV uploads remain explicit actions and do not depend on the schedule allow-list.

## Release Boundary

The ingestion system updates internal evidence only. Existing rights and publication gates continue to decide what is public and indexable. In particular, importing DLD data does not automatically open Dubai transaction or property-detail pages.

## Verification

Tests cover date windows, authorization, lease behavior, parser validation, duplicate identity, correction/supersession behavior, fail-closed persistence, and cron configuration. Release verification runs focused tests, the entire Vitest suite, typecheck, lint, and the production build.
