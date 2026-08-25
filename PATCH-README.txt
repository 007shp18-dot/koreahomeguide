KoreaHomeGuide v11.3 — MOLIT Regional Runtime Cache
==================================================

Goal
----
Reduce MOLIT HTTP 429 / user-visible SEO 503 errors caused by many Vercel
serverless instances repeatedly fetching the same completed-month rental data.

Root cause addressed
--------------------
The existing v11.1 cache coalesces requests only inside one warm serverless
instance. Crawler requests to many distinct Building URLs are distributed across
multiple instances, so the same district + property type + completed month is
fetched repeatedly from MOLIT.

What changes
------------
1. Adds Vercel Runtime Cache through @vercel/functions.
2. Stores parsed MOLIT month rows for 24 hours using stable keys:
   molit-v1:<rent|sale>:<propertyType>:<lawdCd>:<dealYmd>:<pageSize>
3. The public API service key is NEVER included in a cache key or cache value.
4. Keeps the existing 10-minute warm-instance cache and retry/concurrency guard.
5. Runtime Cache is best-effort only:
   - cache read failure -> use existing MOLIT path
   - cache write failure -> still serve successful MOLIT data
   - upstream failure -> re-check cache once in case another instance populated it
6. Rental and apartment-sale month fetches use the same regional cache layer.
7. Custom/mock fetch implementations do not use Vercel Runtime Cache unless a
   cache provider is explicitly supplied, keeping tests and injected providers isolated.

Files
-----
NEW     package.json
NEW     lib/runtime-cache.cjs
MODIFY  lib/real-price-core.cjs
NEW     tests/v11-3-runtime-cache.test.cjs

No changes
----------
- No Rent Check threshold / Fair Rent Intelligence calculation changes
- No provider aggregation / median / deposit-band calculation changes
- No MOLIT endpoint changes
- No API timeout/retry/concurrency changes
- No SEO canonical/hreflang/sitemap changes
- No Building noindex quarantine changes
- No v12 Move Commerce changes
- No external Redis/KV/database account required

Dependency
----------
@vercel/functions is pinned to 3.9.5 in package.json.
There was no package.json in the project before this patch.
A package-lock is intentionally not included because this execution environment
could not reach npm to generate one. Vercel's production build after upload is
the required verification that dependency installation succeeds.

Cache scope / caveat
--------------------
Vercel Runtime Cache is regional. The current production deployment runs its
functions in iad1, so distinct Vercel Function instances in that region can reuse
the same MOLIT month entries.

Runtime Cache does not provide a documented atomic single-flight lock in this
implementation. A completely cold burst can therefore still produce more than
one upstream request before the first cache entry is populated. The goal is to
collapse repeated crawler traffic after the first successful month fill, not to
claim that every possible 429 becomes impossible immediately.

Verification performed before packaging
---------------------------------------
RED:
- v11.3 tests failed against the v11.2/v12 core because shared-cache functions,
  adapter, and package metadata did not exist.

GREEN / regression:
- node --check lib/runtime-cache.cjs
- node --check lib/real-price-core.cjs
- node --test tests/v11-1-molit-resilience.test.cjs tests/v11-3-runtime-cache.test.cjs

The focused suite verifies:
- retry behavior remains intact
- per-instance concurrency remains capped at 2
- warm-instance coalescing remains intact
- failed warm-cache requests are still evicted
- stable service-key-free regional cache keys
- cache hit avoids the upstream loader
- cache miss writes with ttl=86400
- read/write failures degrade safely
- rental and apartment-sale paths use the shared layer
- two simulated cold module instances reuse one shared month result

Upload instructions
-------------------
Extract the ZIP and upload/overwrite its contents at the GitHub repository root.
Do not delete unrelated existing files.

After Vercel deploys the commit, verify:
1. build is READY and @vercel/functions installs successfully
2. known Dong/Building pages still render
3. Building remains noindex,follow and Dong remains index,follow
4. recent runtime 503 and [seo-building-page] HTTP 429 counts fall over the next
   several minutes as regional month keys populate
5. do not declare the issue solved from a single short window; compare 2m, 5m,
   and 10m windows after cache warm-up
