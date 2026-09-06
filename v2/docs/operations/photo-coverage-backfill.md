# Photo coverage backfill operations

This runbook covers the bounded photo discovery and coverage projection for the
seeded `kr-seoul` and `sg-singapore` markets. Dubai is outside the job scope.

## Required production configuration

Configure these values as Vercel secrets. Never print, commit, or copy the
values into command history.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon production pooled connection |
| `CONTENT_ADMIN_SECRET` | Private coverage and NAVER review routes |
| `CRON_SECRET` | Scheduled building-enrichment route |
| `GOOGLE_MAPS_API_KEY` | Server key, restricted to Places API (New) |
| `GOOGLE_MAPS_BROWSER_KEY` | Browser key, restricted by SignedPrice origins and Maps JavaScript API |
| `GOOGLE_MAPS_BROWSER_ENABLED` | Explicit browser opt-in; keep `false` for zero Google photo/map requests |
| `NAVER_SEARCH_CLIENT_ID` | NAVER Search API application ID |
| `NAVER_SEARCH_CLIENT_SECRET` | NAVER Search API application secret |
| `NAVER_MAP_CLIENT_ID` | Existing NAVER Maps browser client ID |

The scheduled guardrails are `PHOTO_GOOGLE_DAILY_REQUEST_CAP`,
`PHOTO_GOOGLE_DAILY_SPEND_CAP_USD`, and `PHOTO_NAVER_DAILY_REQUEST_CAP`.
Google discovery defaults to an estimated five-dollar daily spend cap. With the
default 0.032 USD request estimate this permits at most 156 provider requests a
day, and the lower request cap still wins. Browser Google requests default to
disabled so ordinary page views do not add a second Google cost path. Keep every
enabled cap finite and change it only after an explicit budget decision.

Production runs one bounded slice per provider each hour: Wikimedia at minute
7, official Seoul apartment facts at minute 17, NAVER at minute 27, and Google
at minute 47. The two markets share each provider's daily request and spend
caps. Each enabled job is resumable because terminal attempts receive a future
retry time and are skipped.

## Storage and approval boundaries

- Google discovery stores the stable place ID, attribution, match decision, and
  evidence. It does not store photo bytes or expiring photo resource names.
- NAVER Image Search is a private live-review source. It stores only aggregate
  attempt status and result count; image URLs, thumbnails, and response payloads
  are never persisted or published.
- Wikimedia candidates may be stored only with their source and license data.
- Only approved rows may reach public entity media. Street view and a parent
  project's photo remain explicitly labelled fallbacks and do not count as an
  exact building photo.
- Name and locality alone require review. Automatic approval requires an exact
  name plus postal-code agreement, or an exact name plus locality agreement and
  coordinates within 250 metres. This intentionally rejects cross-country name
  collisions such as a London photo for Singapore's The Interlace.

## Safe health and canary checks

Use an interactive shell where the secret already exists as an environment
variable. The commands below emit only aggregate JSON and never echo secrets.

```powershell
$headers = @{ Authorization = "Bearer $env:CONTENT_ADMIN_SECRET" }
Invoke-RestMethod -Headers $headers -Uri 'https://www.signedprice.com/api/internal/photo-coverage'
```

Dry-run one market and provider before any write:

```powershell
$body = @{ market = 'kr-seoul'; provider = 'google'; limit = 50; dryRun = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post -Headers $headers -ContentType 'application/json' -Body $body -Uri 'https://www.signedprice.com/api/internal/photo-coverage'
```

Run a bounded provider slice only after the dry run succeeds:

```powershell
$body = @{ market = 'kr-seoul'; provider = 'google'; limit = 50; dryRun = $false } | ConvertTo-Json
Invoke-RestMethod -Method Post -Headers $headers -ContentType 'application/json' -Body $body -Uri 'https://www.signedprice.com/api/internal/photo-coverage'
```

For the cron route, pass `CRON_SECRET` as a bearer token and request one
provider explicitly. Do not put the token in the URL.

```powershell
$cronHeaders = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod -Headers $cronHeaders -Uri 'https://www.signedprice.com/api/internal/building-enrichment?market=seoul&source=google&limit=1'
```

## Database rollout evidence

On 2026-09-06, migration `0008_building_photo_coverage.sql` was applied twice to
Neon test branch `br-patient-sky-b3ssnche`. Both applications completed without
duplicate schema objects. The branch contains the three coverage tables, five
photo match-evidence columns, and one confidence constraint. A coverage sync
updated ten rows on the first run and zero on the identical second run.

Seed invariants on that branch were:

| Population | Rows |
| --- | ---: |
| Seoul | 48,999 |
| Singapore private | 3,862 |
| Singapore HDB | 10,011 |
| Total target entities | 62,872 |

Every target entity had a verified name, address, and `legacyBuildingKey` that
resolved to a building row. No target entity or building had coordinates, and
no target had a postal code. Therefore provider results remain in review unless
another exact identity signal is added; the matching rule must not be relaxed
to manufacture coverage.

Expected immutable seed digests:

- `legacyIdDigest=d86ae08ab146e07570ccbd7b15f07a80f3ca5fd537d7199f58628348439e446a`
- `entityIdDigest=92be10891460d8604c8b6661cd4884c3eaee9ce5791a14ec6c59a49a2d9e3729`

At the same checkpoint, the production database contained 12 approved Seoul
photo rows and 22 approved Singapore photo rows. `building_facts` and
`nearby_places` both contained zero rows. The Vercel project did not have
`SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY`, and the repository did not contain an
installed `kr-proximity` artifact or its reviewed public-source descriptor.
The scheduled official-facts worker therefore remains safely `not-configured`,
and school/station projection remains `missing`, until those source inputs are
installed. The public page continues to use its existing compressed-data
fallback where one exists.

## Completion criteria

Run resumable slices until the private coverage summary reports `complete =
62,872`. The exact, provider, parent, street-view, and unavailable totals must
also add to `62,872`. Then repeat the final due slice and confirm zero new
approvals, media, attempts, and coverage rows. Recheck both seed digests and
confirm Dubai row and media counts are unchanged. Keep the compressed JSON
fallback in place through this verification.
