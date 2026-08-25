KoreaHomeGuide v11.2 — Building SEO quarantine

Goal
Reduce crawler-driven MOLIT 429/503 load while keeping Building detail URLs usable for people.

Changes
1. Dynamic market sitemap now emits Dong SEO URLs only.
   - Building URLs are removed.
   - sitemap generation no longer calls provider.getBuildings().
2. Building SEO detail pages remain accessible but are marked:
   - <meta name="robots" content="noindex,follow">
   - X-Robots-Tag: noindex, follow
3. Building links rendered inside Dong pages remain clickable but receive rel="nofollow".
4. Existing 24-hour CDN cache for successful Dong/Building pages remains unchanged.
5. Existing 503 no-store behavior remains unchanged.

Unchanged
- Rent Explorer / Rent Check behavior
- MOLIT data calculations
- Dong page indexability thresholds
- EN/ZH routes
- canonical URLs
- v11 Fair Rent Intelligence
- v11.1 retry/backoff/warm-instance cache

Why
Production logs showed crawler traffic repeatedly opening distinct Building URLs, causing HTTP 429 from MOLIT across multiple Vercel instances. Warm-instance throttling cannot coordinate across instances. This patch reduces Building crawl discovery and concentrates SEO on stable Dong-level pages.

Verification
- TDD RED confirmed the previous state failed all three new quarantine requirements.
- New focused test: 4/4 passed after implementation.
- node --check passed for all 3 modified production files.

Next architecture if 429 persists
- Cross-instance remote cache for district/type/month data.
- Keep Dong pages indexable; do not re-enable Building indexing until 5xx/429 stays near zero.
