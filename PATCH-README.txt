KoreaHomeGuide v11.1 combined stability patch — 2026-08-25

Upload the CONTENTS of this folder to repository root, preserving paths.

Included A — MOLIT 429 resilience
- Upstream data.go.kr concurrency capped at 2 requests per warm instance.
- HTTP 429/500/502/503/504 retry up to 2 times.
- Retry-After is honored when present (capped), otherwise short exponential backoff.
- Permanent 400/401/403 responses are not retried.
- Identical rental/sale month requests are coalesced and cached for 10 minutes in a warm instance.
- Warm cache is bounded and failed requests are removed.
- Existing 5-second timeout per attempt remains.

Included B — Dynamic SEO cache extension
- Successful Dong SEO HTML: s-maxage 3600 -> 86400.
- Successful Building SEO HTML: s-maxage 3600 -> 86400.
- stale-while-revalidate remains 86400.
- 503 responses remain no-store; 404/other non-success behavior is unchanged.
- Dynamic sitemap cache remains unchanged at 21600 (6 hours).

Why the cache change is safe
- Dynamic market pages are based on completed-month MOLIT data and a six-month rolling view.
- A 24-hour CDN cache materially reduces crawler-driven upstream bursts without making completed-month data meaningfully stale.

Unchanged
- Rent Check comparable tiers and +/-10% verdict.
- v11 Fair Rent Intelligence P25/Median/P75/percentile.
- Data source, calculation algorithms, SEO URLs, canonical/hreflang.
- No affiliate/referral changes.

Verification before packaging
- TDD RED confirmed for old one-hour Dong/Building cache.
- Combined regression: 20/20 tests passed.
- Syntax: 6/6 modified JS/CJS files passed node --check.
