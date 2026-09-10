# Market data refresh operations

This runbook covers the internal Seoul, Singapore, and Dubai market-evidence refresh jobs. The ingestion layer does not itself publish or index Dubai pages.

## Production configuration

| Variable | Required for | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | All jobs | Neon Postgres connection |
| `CRON_SECRET` | Scheduled GET | Exact Vercel Cron bearer |
| `CONTENT_ADMIN_SECRET` | Manual DLD POST | Exact operator bearer |
| `SIGNEDPRICE_MARKET_REFRESH_JOBS` | Scheduled writes | Comma-separated exact job allow-list; empty disables every job |
| `SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY` or `DATA_GO_KR_SERVICE_KEY` | Seoul | Free MOLIT service key; the SignedPrice-specific name takes precedence when both are set |
| `SIGNEDPRICE_URA_ACCESS_KEY` | Singapore | Free URA Data Service access key |
| `SIGNEDPRICE_DLD_TRANSACTIONS_CSV_URL` | Dubai transaction auto-run | Direct official HTTPS CSV URL |
| `SIGNEDPRICE_DLD_RENTS_CSV_URL` | Dubai rent auto-run | Direct official HTTPS CSV URL |

Only `https://dubailand.gov.ae`, `https://dubaipulse.gov.ae`, and their subdomains are accepted for automatic DLD downloads. Redirects, embedded URL credentials, nonstandard ports, and other hosts fail closed. Missing provider configuration creates a `skipped` run; it does not remove the last valid evidence.

The ingestion jobs write internal observations only. They do not automatically
replace the installed public snapshots. Public promotion requires a separate
validated, versioned projection with last-good retention and rollback.

Deploy with `SIGNEDPRICE_MARKET_REFRESH_JOBS` empty. After the migration and capacity checks pass, enable one exact job such as `kr-seoul-sale`, run and repeat its canary, then add the next job to the comma-separated list. A job not present in the list records `job_disabled` without calling its provider or writing evidence.

## Schedule

All times are UTC.

| Job | Schedule | Incremental source window |
| --- | --- | --- |
| `kr-seoul-sale` | Daily 18:10 | Current and previous month, all 25 districts and four housing types |
| `kr-seoul-rent` | Daily 18:25 | Current and previous month, all 25 districts and four housing types |
| `sg-private-sale` | Tuesday and Friday 02:10 | Current and previous month from all four URA batches |
| `sg-private-rent` | Monthly on the 16th at 02:25 | Current and previous quarter |
| `ae-dubai-transaction` | Daily 01:10 | Current and previous registration month |
| `ae-dubai-rent` | Daily 01:25 | Current and previous registration month |

Each invocation runs one job. A ten-minute expiring lease prevents overlap, and a rerun classifies exact records as unchanged. Changed content supersedes the prior observation without deleting it.

## Storage gate before enabling Dubai

Do not configure the two DLD URL variables until the production database has enough headroom. Check it without returning credentials:

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;
```

The 2026-09-06 source canary contained 117,634 rent rows and 19,416 transaction rows in the current/previous-month windows. The parser completed both local canaries in about eight seconds at roughly 695MB peak RSS. Persistence is split into 2,000-record transactions; the largest measured normalized records payload was 1.82MB.

The existing free production database was already about 486MB at that checkpoint. Keep DLD scheduled runs in `job_disabled` until storage is upgraded or a dedicated market-data database and retention policy are approved. The raw 72MB rent and 36MB transaction CSV files were not committed.

## Manual DLD delta

Vercel Functions reject request bodies over 4.5MB, so the protected POST deliberately accepts at most 4MB. Use it only for a small official delta, not a full DLD export. Large official snapshots must use the allow-listed server-side URL path or a separately approved object-storage import flow.

```powershell
$headers = @{
  Authorization = "Bearer $env:CONTENT_ADMIN_SECRET"
  "Content-Type" = "text/csv"
}
Invoke-RestMethod `
  -Method Post `
  -Headers $headers `
  -InFile ".\dld-delta.csv" `
  -Uri "https://www.signedprice.com/api/internal/market-data-refresh/?job=ae-dubai-transaction"
```

Use `job=ae-dubai-rent` for rental-contract deltas. Seoul and Singapore jobs reject operator CSV bodies.

## Canary and run inspection

After the database migration and environment configuration deploy, invoke exactly one scheduled job with the cron secret:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod `
  -Headers $headers `
  -Uri "https://www.signedprice.com/api/internal/market-data-refresh/?job=kr-seoul-sale"
```

Inspect only aggregate state and stable error codes:

```sql
SELECT job, state, source_as_of, received, inserted, updated, unchanged,
       unlinked, error_code, started_at, completed_at
FROM market_data_refresh_runs
ORDER BY id DESC
LIMIT 30;
```

Expected canary behavior:

- First valid run: `succeeded`, with `received > 0`.
- Exact repeat: `succeeded`, with all received rows counted as `unchanged`.
- Missing key or DLD URL: `skipped` with `configuration_missing`.
- Job absent from the rollout allow-list: `skipped` with `job_disabled`.
- Active same-job lease: HTTP 202 with `state=busy`.
- Provider or schema failure: no prior evidence is deleted, and the run exposes only a stable code.
