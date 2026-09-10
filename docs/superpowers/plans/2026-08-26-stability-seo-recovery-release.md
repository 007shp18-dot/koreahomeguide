# KoreaHomeGuide Stability and SEO Recovery Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the partially implemented v10.8-v11.3 repository state into one deployable release with resilient MOLIT access, 11 or fewer Vercel functions, controlled SEO indexing, reliable Rent Check distributions, and a green test suite.

**Architecture:** Keep all official transaction loading behind `lib/real-price-core.cjs`, with request safety in `lib/api-guard.cjs` and optional shared storage through `lib/runtime-cache.cjs`. Preserve public URLs through Vercel rewrites while consolidating duplicate function handlers. Complete the existing Explorer, Dong SEO, and Rent Check presentation layers without expanding the product into listings, brokerage, advertising, or another content batch.

**Tech Stack:** Node.js CommonJS, Node's built-in test runner, static HTML/CSS/JavaScript, Vercel Functions and rewrites, `@vercel/functions` Runtime Cache 3.9.5.

**Spec:** `docs/superpowers/specs/2026-08-26-stability-seo-recovery-release-design.md`

## Global Constraints

- Start from local commit `710a64e`, whose functional baseline is `bb06fa0` on remote `main` commit `0333af4`.
- Preserve the public paths `/api/maps-config` and `/api/explore-seoul` through rewrites.
- Finish with at most 11 JavaScript, CommonJS, or ES module files in `api/`.
- Use a five-second upstream timeout and at most two concurrent upstream attempts per warm function instance.
- Runtime Cache entries use a TTL of exactly 86,400 seconds and tag `molit-month`.
- Runtime cache keys use `molit-v1:{rent|sale}:{propertyType}:{districtCode}:{dealMonth}:{pageSize}` and never contain the public-data service key.
- Dynamic sitemaps contain only Dong URLs whose six-month sample has at least 10 reported contracts.
- English Dong URLs may cover all 10 supported districts; Chinese Dong URLs are limited to district codes `11680`, `11440`, `11170`, `11200`, and `11560`.
- Building pages remain accessible but use `noindex,follow`, `X-Robots-Tag: noindex,follow`, and no sitemap entries.
- Fair Rent Intelligence requires at least five comparables; the existing `below`, `fair`, and `above` boundaries remain exactly -10% and +10%.
- English static market coverage is 30 district/type pages; Chinese static market coverage remains 15 pages in five districts.
- Do not add guides, cities, languages, accounts, ads, payments, live listings, or brokerage behavior.
- Do not delete passing tests or weaken assertions merely to make the suite green. The only approved policy migration changes the obsolete Dong threshold assertion from three contracts to 10.
- Use `apply_patch` for repository edits and commit after every task's focused suite passes.

## File Responsibility Map

| Area | Files | Responsibility |
|---|---|---|
| Request safety | `lib/api-guard.cjs` | Origin/referrer validation, completed-month validation, timeout, retry, warm-instance semaphore, safe logs |
| Official data loading | `lib/real-price-core.cjs`, `lib/runtime-cache.cjs` | Paging, parsing, in-flight coalescing, Runtime Cache, stable month keys |
| API consumers | `api/real-prices.js`, `api/rent-check.js`, `api/rent-market.js`, `api/explore-*.js`, `api/seo-*.js`, `api/sitemap-market.js` | Input validation, public status contracts, shared loading, safe error responses |
| Function consolidation | `api/explore-area.js`, `api/fx.js`, `vercel.json` | Serve district/all-Seoul and FX/maps-config through shared handlers |
| Explorer | `explore/explorer-utils.js`, EN/ZH Explorer HTML and app files | Budget evidence ranking, all-Seoul selection, localized links and medians |
| Dong SEO | `providers/seoul-config.cjs`, `seo/dong-seo-v10-8.cjs`, `api/seo-dong-page.js` | Shared quality gate, localized nearby links, metrics, floor context, JSON-LD |
| Crawl control | `api/sitemap-market.js`, `sitemap-static.xml` | Thresholded Dong discovery and complete static market coverage |
| Rent Check | `lib/rent-check-core.cjs`, EN/ZH UI helpers and apps, `styles.css` | Quartiles, empirical rank, localization, reliable hide/show behavior |
| Small UI fixes | `cold-start.css`, `tests/date-localization.test.cjs` | Lead form layout and correct EN/ZH static page inventory assertions |

---

### Task 1: Shared API Guard, Timeout, Retry, and Safe Logging

**Files:**
- Modify: `lib/api-guard.cjs:1-18`
- Test: `tests/v10-9-security-hardening.test.cjs`
- Test: `tests/v11-1-molit-resilience.test.cjs`
- Test: `tests/api-guard.test.cjs`

**Interfaces:**
- Produces: `DEFAULT_UPSTREAM_TIMEOUT_MS = 5000`
- Produces: `trustedRequestSource(req) -> boolean`
- Produces: `isRecentCompletedMonth(dealYmd, { referenceDate, maxMonths }) -> boolean`
- Produces: `fetchWithTimeout(fetchImpl, url, options, timeoutMs) -> Promise<Response>`
- Produces: `fetchWithRetry(fetchImpl, url, options, timeoutMs, retryOptions) -> Promise<Response>`
- Produces: `logApiError(scope, error, context) -> void`
- Consumed by: Tasks 2-4 and 6-7.

- [ ] **Step 1: Confirm the existing guard tests are red**

Run:

```bash
node --test tests/api-guard.test.cjs tests/v10-9-security-hardening.test.cjs tests/v11-1-molit-resilience.test.cjs
```

Expected: failures for missing `isRecentCompletedMonth`, `fetchWithTimeout`, `fetchWithRetry`, and `logApiError`, plus production referrer handling.

- [ ] **Step 2: Add an assertion that retry never exceeds its configured attempt count**

Add this case to `tests/v11-1-molit-resilience.test.cjs`:

```js
test('fetchWithRetry stops after the configured retry budget', async () => {
  let calls = 0;
  const result = await guard.fetchWithRetry(
    async () => { calls += 1; return response(503); },
    'https://example.test',
    {},
    100,
    { retries:2, sleepImpl:async () => {} }
  );
  assert.equal(result.status, 503);
  assert.equal(calls, 3);
});
```

- [ ] **Step 3: Implement the shared guard exports**

Replace `lib/api-guard.cjs` with focused helpers following these exact contracts:

```js
'use strict';

const DEFAULT_UPSTREAM_TIMEOUT_MS = 5000;
const MAX_CONCURRENT_UPSTREAM = 2;
const PRODUCTION_ORIGINS = new Set([
  'https://koreahomeguide.com',
  'https://www.koreahomeguide.com'
]);
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const SAFE_CONTEXT_FIELDS = ['lawdCd', 'type', 'dealYmd'];

let activeUpstream = 0;
const upstreamWaiters = [];

async function withUpstreamSlot(work) {
  if (activeUpstream >= MAX_CONCURRENT_UPSTREAM) {
    await new Promise(resolve => upstreamWaiters.push(resolve));
  }
  activeUpstream += 1;
  try { return await work(); }
  finally {
    activeUpstream -= 1;
    const next = upstreamWaiters.shift();
    if (next) next();
  }
}

function requestHeader(req, name) {
  const headers = (req && req.headers) || {};
  const target = String(name).toLowerCase();
  const key = Object.keys(headers).find(item => item.toLowerCase() === target);
  return String(key ? headers[key] : '').trim();
}

function trustedRequestSource(req) {
  const origin = requestHeader(req, 'origin');
  if (origin) return PRODUCTION_ORIGINS.has(origin);
  if (requestHeader(req, 'sec-fetch-site') === 'same-origin') return true;
  const referer = requestHeader(req, 'referer');
  if (referer) {
    try { return PRODUCTION_ORIGINS.has(new URL(referer).origin); }
    catch (_) { return false; }
  }
  return process.env.VERCEL_ENV !== 'production';
}

function isRecentCompletedMonth(dealYmd, { referenceDate = new Date(), maxMonths = 60 } = {}) {
  const value = String(dealYmd || '');
  if (!/^\d{6}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4));
  if (month < 1 || month > 12) return false;
  const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const candidate = year * 12 + month;
  const current = reference.getFullYear() * 12 + reference.getMonth() + 1;
  const age = current - candidate;
  return age >= 1 && age <= Math.max(1, Number(maxMonths) || 60);
}
```

Add the timeout and retry implementation below. Each individual attempt, rather than the whole retry loop, enters `withUpstreamSlot` so waiting retries do not occupy a concurrency slot:

```js
async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, Number(timeoutMs) || DEFAULT_UPSTREAM_TIMEOUT_MS));
  try {
    return await fetchImpl(url, { ...options, signal:controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function retryDelay(response, attempt, baseDelayMs) {
  const raw = response?.headers?.get?.('retry-after');
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  return baseDelayMs * (2 ** attempt);
}

async function fetchWithRetry(fetchImpl, url, options = {}, timeoutMs = DEFAULT_UPSTREAM_TIMEOUT_MS, {
  retries = 2,
  sleepImpl = ms => new Promise(resolve => setTimeout(resolve, ms)),
  baseDelayMs = 500
} = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withUpstreamSlot(() =>
        fetchWithTimeout(fetchImpl, url, options, timeoutMs)
      );
      if (!RETRYABLE_STATUS.has(response.status) || attempt === retries) return response;
      await sleepImpl(retryDelay(response, attempt, baseDelayMs));
    } catch (error) {
      if (attempt === retries) throw error;
      await sleepImpl(baseDelayMs * (2 ** attempt));
    }
  }
  throw new Error('Retry loop exhausted.');
}
```

Implement safe logging with this output shape:

```js
function logApiError(scope, error, context = {}) {
  const payload = {};
  for (const field of SAFE_CONTEXT_FIELDS) {
    if (context[field] !== undefined) payload[field] = context[field];
  }
  payload.message = String(error && error.message || 'upstream failure')
    .replace(/https?:\/\/\S+/gi, '[redacted-url]');
  console.error(`[${String(scope || 'api')}]`, payload);
}
```

Export the public surface exactly as follows; do not export service keys, queue state, or origin internals:

```js
module.exports = {
  DEFAULT_UPSTREAM_TIMEOUT_MS,
  trustedRequestSource,
  isRecentCompletedMonth,
  fetchWithTimeout,
  fetchWithRetry,
  logApiError
};
```

- [ ] **Step 4: Run the guard-level tests**

Run:

```bash
node --test tests/api-guard.test.cjs tests/v10-9-security-hardening.test.cjs tests/v11-1-molit-resilience.test.cjs
```

Expected: helper behavior passes; source-wiring assertions may remain red until Task 3.

- [ ] **Step 5: Commit the shared guard**

```bash
git add lib/api-guard.cjs tests/v11-1-molit-resilience.test.cjs
git commit -m "feat: harden official data requests"
```

---

### Task 2: Coalesced MOLIT Paging and Vercel Runtime Cache

**Files:**
- Modify: `lib/real-price-core.cjs:1-209`
- Verify: `lib/runtime-cache.cjs:1-25`
- Test: `tests/v11-1-molit-resilience.test.cjs`
- Test: `tests/v11-3-runtime-cache.test.cjs`
- Test: `tests/rent-market-api.test.cjs`
- Test: `tests/public-api-throttling.test.cjs`

**Interfaces:**
- Consumes: `fetchWithRetry` and `DEFAULT_UPSTREAM_TIMEOUT_MS` from Task 1.
- Consumes: `getRuntimeCache() -> Promise<Cache|null>` from `lib/runtime-cache.cjs`.
- Produces: `runtimeMonthCacheKey({ kind, type, lawdCd, dealYmd, pageSize }) -> string`
- Produces: `loadWithRuntimeCache({ cacheProvider, cacheKey, loader }) -> Promise<Array>`
- Produces: `fetchRentalMonth(options) -> Promise<Array<RentalRow>>`
- Produces: `fetchSaleMonth(options) -> Promise<Array<SaleRow>>`

- [ ] **Step 1: Confirm cache and coalescing tests are red**

Run:

```bash
node --test tests/v11-1-molit-resilience.test.cjs tests/v11-3-runtime-cache.test.cjs tests/rent-market-api.test.cjs tests/public-api-throttling.test.cjs
```

Expected: missing cache functions and repeated warm calls fail; existing XML parsing and sequential provider tests continue to pass.

- [ ] **Step 2: Add stable month-key and cache loaders**

At the top of `lib/real-price-core.cjs`, import the shared dependencies and define the warm cache:

```js
'use strict';
const { fetchWithRetry, DEFAULT_UPSTREAM_TIMEOUT_MS } = require('./api-guard.cjs');
const { getRuntimeCache } = require('./runtime-cache.cjs');

const RUNTIME_CACHE_TTL_SECONDS = 86400;
const WARM_CACHE_TTL_MS = 5 * 60 * 1000;
const warmMonthRequests = new Map();

function runtimeMonthCacheKey({ kind, type, lawdCd, dealYmd, pageSize = 1000 }) {
  return `molit-v1:${kind}:${type}:${lawdCd}:${dealYmd}:${pageSize}`;
}

async function loadWithRuntimeCache({ cacheProvider = getRuntimeCache, cacheKey, loader }) {
  let cache = null;
  try { cache = await cacheProvider(); } catch (_) { cache = null; }
  if (cache) {
    try {
      const hit = await cache.get(cacheKey);
      if (hit !== null && hit !== undefined) return hit;
    } catch (_) {}
  }
  const value = await loader();
  if (cache) {
    try {
      await cache.set(cacheKey, value, { ttl:RUNTIME_CACHE_TTL_SECONDS, tags:['molit-month'] });
    } catch (_) {}
  }
  return value;
}
```

- [ ] **Step 3: Route every page fetch through the shared retry helper**

Change `fetchPagedXml` to accept `retryImpl = fetchWithRetry` and call it with the shared timeout:

```js
const upstream = await retryImpl(
  fetchImpl,
  `${endpoint}?${params.toString()}`,
  { headers:{ Accept:'application/xml,text/xml,*/*' } },
  DEFAULT_UPSTREAM_TIMEOUT_MS,
  { retries:2, sleepImpl }
);
```

Fetch remaining result pages sequentially so pagination itself does not produce another uncontrolled burst:

```js
const items = [...first.items];
for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
  const page = await fetchPage(pageNo);
  items.push(...page.items);
}
return items;
```

- [ ] **Step 4: Wrap rental and sale month calls with warm and regional caches**

Add one internal loader with failure eviction:

```js
async function loadMonth({ kind, type, lawdCd, dealYmd, pageSize, runtimeCacheProvider, loader }) {
  const cacheKey = runtimeMonthCacheKey({ kind, type, lawdCd, dealYmd, pageSize });
  const now = Date.now();
  const warm = warmMonthRequests.get(cacheKey);
  if (warm && warm.expiresAt > now) return warm.promise;

  const promise = loadWithRuntimeCache({
    cacheProvider:runtimeCacheProvider || getRuntimeCache,
    cacheKey,
    loader
  });
  warmMonthRequests.set(cacheKey, { promise, expiresAt:now + WARM_CACHE_TTL_MS });
  try { return await promise; }
  catch (error) {
    if (warmMonthRequests.get(cacheKey)?.promise === promise) warmMonthRequests.delete(cacheKey);
    throw error;
  }
}
```

Extend `fetchRentalMonth` and `fetchSaleMonth` with optional `runtimeCacheProvider` and `retryImpl` arguments. Pass the correct `kind` (`rent` or `sale`) and keep parser output unchanged.

When `fetchPage` receives a non-success response, retain only the numeric status for endpoint compatibility and never include the request URL:

```js
if (!upstream.ok) {
  const error = new Error(`Public API returned HTTP ${upstream.status}.`);
  error.upstreamStatus = upstream.status;
  throw error;
}
```

- [ ] **Step 5: Export the new stable interfaces**

The final export object must contain:

```js
module.exports = {
  decodeXml, tag, normalizeServiceKey, completedMonths,
  endpointForType, saleEndpointForType, parseItems, parseSaleItems,
  runtimeMonthCacheKey, loadWithRuntimeCache,
  fetchWithRetry, fetchRentalMonth, fetchSaleMonth
};
```

Remove the obsolete `fetchWith429Retry` export after all callers and tests use `fetchWithRetry`.

- [ ] **Step 6: Run the complete data-loader suite**

Run:

```bash
node --test tests/v11-1-molit-resilience.test.cjs tests/v11-3-runtime-cache.test.cjs tests/rent-market-api.test.cjs tests/public-api-throttling.test.cjs tests/explorer-provider.test.cjs
```

Expected: all tests pass, including one upstream call for concurrent identical months and reuse across two cold module instances through the supplied Runtime Cache.

- [ ] **Step 7: Commit the resilient month loader**

```bash
git add lib/real-price-core.cjs lib/runtime-cache.cjs tests/v11-3-runtime-cache.test.cjs
git commit -m "feat: cache and coalesce MOLIT month data"
```

---

### Task 3: Wire Safety and Generic Errors into Every MOLIT Endpoint

**Files:**
- Modify: `api/real-prices.js`
- Modify: `api/rent-check.js`
- Modify: `api/rent-market.js`
- Modify: `api/explore-area.js`
- Modify: `api/explore-dong.js`
- Modify: `api/explore-building.js`
- Modify: `api/seo-dong-page.js`
- Modify: `api/seo-building-page.js`
- Modify: `api/sitemap-market.js`
- Test: `tests/v10-9-security-hardening.test.cjs`

**Interfaces:**
- Consumes: Task 1 guard functions and Task 2 `fetchRentalMonth`.
- Preserves: each endpoint's current success shape and public status codes.
- Produces: source-guarded browser JSON endpoints and safe logging on every upstream failure.

- [ ] **Step 1: Add a runtime foreign-origin endpoint test**

Add a response recorder and this case to `tests/v10-9-security-hardening.test.cjs`:

```js
test('real-prices rejects an explicit foreign browser origin before upstream work', async () => {
  const api = require('../api/real-prices.js');
  const res = {
    statusCode:200, body:null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    setHeader() {}
  };
  await api({
    method:'GET',
    headers:{ origin:'https://evil.example' },
    query:{ type:'apartment', lawdCd:'11680', dealYmd:'202607' }
  }, res);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error:'Request origin is not allowed.' });
});
```

- [ ] **Step 2: Replace the raw real-prices fetch with the shared month loader**

Use these imports in `api/real-prices.js`:

```js
const {
  normalizeServiceKey, endpointForType, fetchRentalMonth, fetchWithRetry
} = require('../lib/real-price-core.cjs');
const {
  trustedRequestSource, isRecentCompletedMonth, logApiError
} = require('../lib/api-guard.cjs');
const { isSupportedAreaCode } = require('../providers/seoul-config.cjs');
```

Validate source, supported district, completed month, and type before calling:

```js
const items = await fetchRentalMonth({
  serviceKey, type, lawdCd, dealYmd, pageSize:100,
  retryImpl:fetchWithRetry
});
```

Return the existing `{ items }` success body and cache header. Return the existing `500` missing-config response and `400` invalid-input responses. In the catch path, use the retained numeric upstream status without exposing it in the body:

```js
logApiError('real-prices', error, { lawdCd, type, dealYmd });
const status = Number.isInteger(error && error.upstreamStatus) ? 502 : 500;
const message = status === 502
  ? 'Public transaction data is temporarily unavailable.'
  : 'Failed to reach the public transaction API.';
return res.status(status).json({ error:message });
```

- [ ] **Step 3: Add source guards and safe logs to Rent Check and Rent Market**

In both files import:

```js
const { trustedRequestSource, logApiError } = require('../lib/api-guard.cjs');
```

In `api/rent-check.js`, also import `isSupportedAreaCode` and `fetchWithRetry`, reject unsupported Seoul codes in `parseRentCheckQuery`, and pass `retryImpl:fetchWithRetry` to month loads. Keep the public upstream response at `502` with `FRIENDLY_UPSTREAM_ERROR`.

In `api/rent-market.js`, use `isSupportedAreaCode` instead of the five-digit regex, keep month calls sequential, log `{ lawdCd, type }`, and preserve its current `500` failure response.

- [ ] **Step 4: Add source guards and safe logs to all three Explorer JSON handlers**

For `api/explore-area.js`, `api/explore-dong.js`, and `api/explore-building.js`, perform this check immediately after the method check:

```js
if (!trustedRequestSource(req)) {
  return res.status(403).json({ error:'Request origin is not allowed.' });
}
```

Change each anonymous catch to `catch (error)`, call `logApiError` with only `lawdCd`/`type`, and preserve each endpoint's current status and generic body.

- [ ] **Step 5: Log failures in crawler-facing endpoints without origin-blocking crawlers**

Do not call `trustedRequestSource` in SEO HTML or sitemap handlers. In `api/seo-dong-page.js`, `api/seo-building-page.js`, and `api/sitemap-market.js`, import `logApiError`, name the caught error, log only district/type context, and keep their `503` noindex/empty-sitemap behavior.

- [ ] **Step 6: Run endpoint safety and compatibility tests**

Run:

```bash
node --test tests/v10-9-security-hardening.test.cjs tests/api-guard.test.cjs tests/explorer-api.test.cjs tests/rent-market-api.test.cjs tests/seo-endpoints.test.cjs tests/public-api-throttling.test.cjs
```

Expected: all tests pass and no response contains a service key or upstream URL.

- [ ] **Step 7: Commit endpoint hardening**

```bash
git add api lib tests/v10-9-security-hardening.test.cjs
git commit -m "feat: guard and safely log public data APIs"
```

---

### Task 4: Consolidate All-Seoul and Maps Configuration Functions

**Files:**
- Modify: `api/explore-area.js`
- Delete: `api/explore-seoul.js`
- Delete: `api/maps-config.js`
- Modify: `vercel.json`
- Create: `docs/operations/github-upload-delete-files.txt`
- Modify: `tests/v10-9-seoul-wide-explorer.test.cjs`
- Verify: `tests/maps-config-api.test.cjs`
- Verify: `tests/vercel-function-budget.test.cjs`

**Interfaces:**
- Consumes: shared guard/data functions from Tasks 1-3.
- Preserves: public `GET /api/explore-seoul?type=...` and `GET /api/maps-config`.
- Produces: `api/explore-area.js.createHandler(optionsOrProviderFactory)` with single-district and `scope=all` modes.
- Produces: `SUPPORTED_DISTRICT_CODES`, `SEOUL_WIDE_MONTHS`, and `DEFAULT_BATCH_SIZE` exports from `api/explore-area.js`.

- [ ] **Step 1: Update the all-Seoul test to target the consolidated handler**

In `tests/v10-9-seoul-wide-explorer.test.cjs`, replace both imports of `../api/explore-seoul.js` with `../api/explore-area.js`. Send `query:{ scope:'all', type:'officetel' }` in the success and guard cases. Add this rewrite assertion:

```js
test('public Seoul-wide path rewrites to the consolidated area handler', () => {
  const config = require('../vercel.json');
  assert.equal(config.rewrites.some(route =>
    route.source === '/api/explore-seoul' &&
    route.destination === '/api/explore-area?scope=all'
  ), true);
});
```

Run the test and confirm it fails because `explore-area.js` does not yet expose all-Seoul mode.

- [ ] **Step 2: Refactor `createHandler` without breaking existing provider-factory tests**

Normalize the old and new call styles:

```js
function normalizeOptions(input) {
  if (typeof input === 'function') return { providerFactory:input };
  return input || {};
}

function createHandler(input = {}) {
  const {
    providerFactory = options => createKoreaHousingProvider(options),
    fetchMonth = fetchRentalMonth,
    aggregateDongs:aggregate = aggregateDongs,
    buildAreaSummary:buildSummary = buildAreaSummary,
    referenceDate = null,
    batchSize = DEFAULT_BATCH_SIZE
  } = normalizeOptions(input);
  return async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    if (!trustedRequestSource(req)) return res.status(403).json({ error:'Request origin is not allowed.' });
    const query = req.query || {};
    const allSeoul = String(query.scope || '') === 'all';
    const propertyType = String(query.type || 'officetel');
    if (!isSupportedPropertyType(propertyType)) {
      return res.status(400).json({ error:'Unsupported property type.' });
    }
    const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
    if (!serviceKey) return res.status(500).json({ error:'Official transaction data is not configured.' });
    try {
      if (allSeoul) {
        const payload = await loadAllSeoul({
          serviceKey, propertyType,
          referenceDate:referenceDate || new Date(),
          fetchMonth, aggregate, buildSummary, batchSize
        });
        res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
        return res.status(200).json(payload);
      }
      const areaCode = String(query.lawdCd || '');
      if (!isSupportedAreaCode(areaCode)) {
        return res.status(400).json({ error:'Unsupported Seoul district.' });
      }
      const provider = providerFactory({ serviceKey, referenceDate:referenceDate || new Date() });
      const [summary, dongs, buildings] = await Promise.all([
        provider.getAreaSummary({ areaCode, propertyType, months:6 }),
        provider.getDongs({ areaCode, propertyType, months:6 }),
        provider.getBuildings({ areaCode, propertyType, months:6 })
      ]);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({
        city:'seoul', districtCode:areaCode, districtName:SEOUL_DISTRICTS[areaCode],
        propertyType, summary, dongs, buildings
      });
    } catch (error) {
      logApiError(allSeoul ? 'explore-seoul' : 'explore-area', error, {
        lawdCd:allSeoul ? undefined : String(query.lawdCd || ''), type:propertyType
      });
      return res.status(allSeoul ? 502 : 500).json({
        error:'Official transaction data is temporarily unavailable.'
      });
    }
  };
}
```

Define `loadAllSeoul({ serviceKey, propertyType, referenceDate, fetchMonth, aggregate, buildSummary, batchSize })` by moving the all-Seoul loop from the deleted handler. The all-Seoul function:

- uses all 10 `Object.keys(SEOUL_DISTRICTS)` codes;
- loads exactly three completed months;
- processes district chunks of five;
- adds `districtCode` and `districtName` to every Dong;
- returns `districtCode:'all'`, `districtName:'All supported Seoul'`, `buildings:[]`;
- uses `s-maxage=21600, stale-while-revalidate=86400`; and
- logs failures as `explore-seoul` while returning the existing generic `502` response.

- [ ] **Step 3: Add rewrites and remove duplicate functions**

Add this rewrite immediately after `/api/maps-config` in `vercel.json`:

```json
{
  "source": "/api/explore-seoul",
  "destination": "/api/explore-area?scope=all"
}
```

Delete `api/explore-seoul.js` and `api/maps-config.js`. Keep `api/fx.js` unchanged because its `resource=maps-config` branch already passes `tests/maps-config-api.test.cjs`.

- [ ] **Step 4: Record the two GitHub-web-upload deletions**

Create `docs/operations/github-upload-delete-files.txt` with exactly:

```text
Delete these repository files before or immediately after uploading the replacement files:

api/explore-seoul.js
api/maps-config.js
```

- [ ] **Step 5: Verify public routes and the function budget**

Run:

```bash
node --test tests/explorer-api.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs tests/maps-config-api.test.cjs tests/vercel-function-budget.test.cjs
find api -maxdepth 1 -type f | sort
```

Expected: all tests pass and exactly 11 deployable files remain in `api/`.

- [ ] **Step 6: Commit function consolidation**

```bash
git add api vercel.json docs/operations/github-upload-delete-files.txt tests/v10-9-seoul-wide-explorer.test.cjs
git commit -m "refactor: consolidate Vercel API functions"
```

---

### Task 5: Complete All-Seoul Explorer and Evidence-Based Ranking

**Files:**
- Modify: `explore/explorer-utils.js:75-116`
- Modify: `explore/index.html:41-46`
- Modify: `zh/explore/index.html:41-46`
- Modify: `explore/app.js:31-248`
- Modify: `zh/explore/app.js:31-251`
- Test: `tests/v10-9-explorer-ranking.test.cjs`
- Test: `tests/v10-9-median-display.test.cjs`
- Test: `tests/v10-9-seoul-wide-explorer.test.cjs`

**Interfaces:**
- Consumes: public `/api/explore-seoul` rewrite from Task 4.
- Produces: `budgetFitForDong(item, limits) -> { fits, matchingContractCount, representativeBand }`.
- Preserves: provider order when no filter is active.
- Produces: district-correct Dong URLs in all-Seoul mode.

- [ ] **Step 1: Confirm ranking, medians, and client tests are red**

Run:

```bash
node --test tests/v10-9-explorer-ranking.test.cjs tests/v10-9-median-display.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs
```

Expected: failures for missing all-Seoul options/calls, missing budget evidence, incorrect ordering, and summary values derived from a deposit band.

- [ ] **Step 2: Implement budget evidence as one shared calculation**

Add this function to `explore/explorer-utils.js` and export it:

```js
function budgetFitForDong(item, { maxRent = 0, maxDeposit = 0 } = {}) {
  const rentLimit = Math.max(0, Number(maxRent) || 0);
  const depositLimit = Math.max(0, Number(maxDeposit) || 0);
  const bands = Array.isArray(item?.depositBands) ? item.depositBands : [];
  const matching = bands.filter(band => {
    const rent = Number(band.medianMonthlyRentWon);
    const deposit = Number(band.medianDepositWon);
    if (rentLimit && (!Number.isFinite(rent) || rent > rentLimit)) return false;
    if (depositLimit && (!Number.isFinite(deposit) || deposit > depositLimit)) return false;
    return true;
  });
  if (bands.length) {
    const representativeBand = [...matching]
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0] || null;
    return {
      fits:matching.length > 0,
      matchingContractCount:matching.reduce((sum, band) => sum + Number(band.count || 0), 0),
      representativeBand
    };
  }
  const rent = Number(item?.contextualMedianMonthlyRentWon ?? item?.medianMonthlyRentWon);
  const deposit = Number(item?.contextualMedianDepositWon ?? item?.medianDepositWon);
  const fits = (!rentLimit || (Number.isFinite(rent) && rent <= rentLimit)) &&
    (!depositLimit || (Number.isFinite(deposit) && deposit <= depositLimit));
  return { fits, matchingContractCount:fits ? Number(item?.contractCount || 0) : 0, representativeBand:null };
}
```

Rewrite `filterDongsByBudget` so no limits returns a shallow copy in original order. With limits, calculate `budgetFitForDong`, remove non-fits, and stable-sort descending by `matchingContractCount` with original index as the tie-breaker.

- [ ] **Step 3: Add the all-Seoul option without making it the default**

Append these options after the 10 district options. Keep Gangnam as the first and therefore default selection so the first page load remains a six-month single-district request instead of a 30-month-call Seoul-wide request:

```html
<option value="all">All supported Seoul</option>
```

```html
<option value="all">全首尔支持地区</option>
```

- [ ] **Step 4: Route all-Seoul client requests and preserve district identity**

In each Explorer app, make `loadArea` choose its endpoint exactly once:

```js
const isAllSeoul = areaSelect.value === 'all';
const endpoint = isAllSeoul
  ? `/api/explore-seoul?type=${encodeURIComponent(typeSelect.value)}`
  : `/api/explore-area?${apiParams.toString()}`;
const response = await fetch(endpoint);
```

When rendering each Dong, resolve:

```js
const districtCode = item.districtCode || areaSelect.value;
const districtName = item.districtName || KHGLocations.districtLabel(
  districtCode,
  document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en'
);
```

Use `districtCode` in `buildDongSeoUrl`, show `districtName` alongside the Dong in all-Seoul mode, and keep the single-district card copy unchanged.

- [ ] **Step 5: Render overall summary medians directly**

In both `renderSummary` functions, replace representative-band selection with:

```js
const rentValue = summary.medianMonthlyRentWon;
const depositValue = summary.medianDepositWon;
```

Use `data.districtName` for the all-Seoul title instead of displaying the raw selector value `all`.

- [ ] **Step 6: Run all Explorer tests**

Run:

```bash
node --test tests/v10-9-explorer-ranking.test.cjs tests/v10-9-median-display.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs tests/explorer-pages.test.cjs tests/explorer-api.test.cjs tests/explorer-map-layout.test.cjs tests/explorer-localized-labels.test.cjs tests/zh-explorer.test.cjs
```

Expected: all tests pass; unfiltered cards preserve provider order and filtered cards rank by matching contract evidence.

- [ ] **Step 7: Commit Explorer completion**

```bash
git add explore zh/explore tests/v10-9-explorer-ranking.test.cjs tests/v10-9-median-display.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs
git commit -m "feat: complete Seoul-wide rent exploration"
```

---

### Task 6: Enforce Dong Quality and Complete Localized SEO Pages

**Files:**
- Modify: `providers/seoul-config.cjs`
- Modify: `seo/dong-seo-v10-8.cjs`
- Modify: `api/seo-dong-page.js`
- Modify: `tests/v10-8-dong-seo.test.cjs`
- Modify: `tests/seo-endpoints.test.cjs`
- Verify: `tests/v10-8-1-dong-seo.test.cjs`
- Verify: `tests/v10-8-3-structured-data.test.cjs`

**Interfaces:**
- Produces: `SEOUL_DONGS_BY_DISTRICT` for same-district related links.
- Produces: `MIN_DONG_CONTRACTS = 10` and `isDongIndexable(summary)` as the single quality policy.
- Consumes: `renderDongPage(...)` and post-processes it through `enhanceDongHtml(...)`.

- [ ] **Step 1: Migrate only the obsolete three-contract threshold assertion**

Change the first test in `tests/v10-8-dong-seo.test.cjs` to:

```js
test('Dong index-quality gate requires at least ten reported contracts', () => {
  assert.equal(MIN_DONG_CONTRACTS, 10);
  assert.equal(isDongIndexable({ contractCount:9 }), false);
  assert.equal(isDongIndexable({ contractCount:10 }), true);
  assert.equal(isDongIndexable({ totalContracts:18 }), true);
});
```

Change the shared `dongSummary` fixture in `tests/seo-endpoints.test.cjs` from five contracts to 12 so the success test remains a valid substantial page. Add a separate endpoint case with nine contracts that expects `404` and `noindex,follow`.

- [ ] **Step 2: Export curated same-district Dong groups**

Add this frozen map to `providers/seoul-config.cjs` and export it:

```js
const SEOUL_DONGS_BY_DISTRICT = Object.freeze({
  '11680':Object.freeze(['역삼동','논현동','대치동','삼성동','청담동']),
  '11440':Object.freeze(['연남동','서교동','망원동','합정동','공덕동','아현동']),
  '11170':Object.freeze(['이태원동','한남동','후암동','보광동']),
  '11200':Object.freeze(['성수동1가','성수동2가','옥수동','금호동1가','금호동2가','금호동3가','금호동4가']),
  '11560':Object.freeze(['여의도동','당산동','문래동','영등포동'])
});
```

The other five districts still support dynamic English Dongs from official data; they simply do not invent nearby-link romanizations that are absent from the catalog.

- [ ] **Step 3: Set the shared quality threshold to 10**

In `seo/dong-seo-v10-8.cjs`, change only:

```js
const MIN_DONG_CONTRACTS = 10;
```

Keep the existing localized metrics, six-month coverage, floor insertion, duplicate transparency note, and nearby links. With `SEOUL_DONGS_BY_DISTRICT` available, the currently failing localization tests should execute those paths instead of throwing.

- [ ] **Step 4: Apply quality and enhancement in the Dong endpoint**

Import:

```js
const { isDongIndexable, enhanceDongHtml } = require('../seo/dong-seo-v10-8.cjs');
```

Replace the endpoint's `< 1` gate with `!isDongIndexable(summary)`. Render and post-process in this order:

```js
const rendered = renderDongPage({
  lang, areaCode, districtName:SEOUL_DISTRICTS[areaCode],
  dong, propertyType, summary, buildings, fxRates
});
const enhanced = enhanceDongHtml(rendered, {
  lang, areaCode, districtName:SEOUL_DISTRICTS[areaCode],
  dong, propertyType, summary
});
const html = normalizeGuideHubLinks(nofollowBuildingLinks(enhanced), lang);
return sendHtml(res, 200, html, { cache:true });
```

Retain the existing interactive Explorer building links and `rel="nofollow"` behavior.

- [ ] **Step 5: Run Dong SEO and endpoint tests**

Run:

```bash
node --test tests/v10-8-dong-seo.test.cjs tests/v10-8-1-dong-seo.test.cjs tests/v10-8-3-structured-data.test.cjs tests/seo-page-renderer.test.cjs tests/seo-endpoints.test.cjs tests/seo-explorer-links.test.cjs tests/v11-2-building-seo-quarantine.test.cjs
```

Expected: all tests pass, Chinese JSON-LD uses `2026-02/2026-07`, and ambiguous identical-looking contracts remain as separate rows with floor context.

- [ ] **Step 6: Commit substantial Dong pages**

```bash
git add providers/seoul-config.cjs seo/dong-seo-v10-8.cjs api/seo-dong-page.js tests/v10-8-dong-seo.test.cjs tests/seo-endpoints.test.cjs
git commit -m "feat: enforce substantial localized Dong pages"
```

---

### Task 7: Align Dynamic and Static Sitemaps with Localization Coverage

**Files:**
- Modify: `api/sitemap-market.js`
- Modify: `sitemap-static.xml`
- Modify: `tests/v10-6-dynamic-sitemap.test.cjs`
- Verify: `tests/v10-9-rent-market-expansion.test.cjs`
- Verify: `tests/v11-2-building-seo-quarantine.test.cjs`

**Interfaces:**
- Consumes: `isDongIndexable(item)` from Task 6.
- Produces: English dynamic Dong URLs for 10 supported districts and Chinese dynamic Dong URLs for five localized districts.
- Produces: 71 static sitemap URLs total: the existing 56 plus 15 new English market pages.

- [ ] **Step 1: Add explicit language-coverage assertions to the dynamic sitemap test**

Extend `tests/v10-6-dynamic-sitemap.test.cjs` with a second handler request for `gwanak-gu`. Its 12-contract Dong must appear in English and must not appear under `/zh/`. Keep the existing Mapo assertion that both languages appear:

```js
test('new English districts do not emit thin Chinese Dong URLs', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const sitemapApi = require('../api/sitemap-market.js');
  const handler = sitemapApi.createHandler({
    providerFactory:() => ({
      getDongs:async () => [{ dong:'신림동', contractCount:12 }]
    })
  });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'gwanak-gu', type:'villa' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/gwanak-gu\//);
  assert.doesNotMatch(res.body, /https:\/\/koreahomeguide\.com\/zh\/seoul\/gwanak-gu\//);
  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY;
  else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});
```

Change the root/static inventory assertion from 56 to 71 static URLs:

```js
assert.equal((staticMap.match(/<url>/g) || []).length, 71);
```

- [ ] **Step 2: Share the Dong quality helper and language allowlist**

In `api/sitemap-market.js`, remove the local threshold constant and import:

```js
const { MIN_DONG_CONTRACTS, isDongIndexable } = require('../seo/dong-seo-v10-8.cjs');

const ZH_INDEXABLE_DISTRICT_CODES = Object.freeze([
  '11680', '11440', '11170', '11200', '11560'
]);

function supportsZhIndexing(areaCode) {
  return ZH_INDEXABLE_DISTRICT_CODES.includes(String(areaCode || ''));
}
```

Filter with `.filter(item => item && item.dong && isDongIndexable(item))`. Always add the English URL and add the Chinese URL only inside:

```js
if (supportsZhIndexing(areaCode)) {
  urls.push(absoluteUrl(buildDongSeoUrl({
    areaCode, dong:item.dong, propertyType, lang:'zh'
  })));
}
```

Export `MIN_DONG_CONTRACTS`, `ZH_INDEXABLE_DISTRICT_CODES`, and `supportsZhIndexing` for direct policy tests.

- [ ] **Step 3: Add the missing 15 English static market URLs**

Add apartment, officetel, and villa `<url>` entries for:

```text
https://koreahomeguide.com/rent/gwanak-gu/apartment/
https://koreahomeguide.com/rent/gwanak-gu/officetel/
https://koreahomeguide.com/rent/gwanak-gu/villa/
https://koreahomeguide.com/rent/dongdaemun-gu/apartment/
https://koreahomeguide.com/rent/dongdaemun-gu/officetel/
https://koreahomeguide.com/rent/dongdaemun-gu/villa/
https://koreahomeguide.com/rent/seodaemun-gu/apartment/
https://koreahomeguide.com/rent/seodaemun-gu/officetel/
https://koreahomeguide.com/rent/seodaemun-gu/villa/
https://koreahomeguide.com/rent/seongbuk-gu/apartment/
https://koreahomeguide.com/rent/seongbuk-gu/officetel/
https://koreahomeguide.com/rent/seongbuk-gu/villa/
https://koreahomeguide.com/rent/gwangjin-gu/apartment/
https://koreahomeguide.com/rent/gwangjin-gu/officetel/
https://koreahomeguide.com/rent/gwangjin-gu/villa/
```

Each URL uses `<lastmod>2026-08-26</lastmod>`, `<changefreq>weekly</changefreq>`, and `<priority>0.75</priority>`. Do not add corresponding `/zh/rent/...` URLs.

- [ ] **Step 4: Run sitemap and market-expansion tests**

Run:

```bash
node --test tests/v10-6-dynamic-sitemap.test.cjs tests/v10-9-rent-market-expansion.test.cjs tests/v11-2-building-seo-quarantine.test.cjs tests/seo-discovery.test.cjs tests/seo-dynamic-routes.test.cjs
```

Expected: all tests pass, 30 English market pages are discoverable, only 15 Chinese market pages exist, and generated sitemap XML contains no building URL.

- [ ] **Step 5: Commit crawl-control alignment**

```bash
git add api/sitemap-market.js sitemap-static.xml tests/v10-6-dynamic-sitemap.test.cjs
git commit -m "fix: align sitemap coverage with SEO quality"
```

---

### Task 8: Finish Fair Rent Intelligence for Wolse and Jeonse

**Files:**
- Modify: `lib/rent-check-core.cjs`
- Modify: `rent-check-ui-utils.js`
- Modify: `zh/rent-check-ui-utils.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `styles.css`
- Modify: `tests/v11-fair-rent-intelligence.test.cjs`
- Verify: `tests/v11-fair-rent-regression.test.cjs`

**Interfaces:**
- Produces: `percentile(values, fraction) -> number|null` using linear interpolation.
- Produces: `percentileRank(values, asking) -> number|null` using empirical `<= asking` share.
- Adds result fields: `p25ValueWon`, `p75ValueWon`, and `percentileRank` as numbers or `null`.
- Produces: EN/ZH `percentileSentence(result) -> string` and `hasDistribution(result) -> boolean`.

- [ ] **Step 1: Extend the red tests for a valid verdict with fewer than five distribution samples**

Add to `tests/v11-fair-rent-intelligence.test.cjs`:

```js
test('a low-confidence three-comparable verdict hides distribution intelligence', () => {
  const result = core.buildResultForTier(reliableItems.slice(0, 3), quote, core.TIERS[2]);
  assert.notEqual(result.rating, 'insufficient');
  assert.equal(result.p25ValueWon, null);
  assert.equal(result.p75ValueWon, null);
  assert.equal(result.percentileRank, null);
  assert.equal(enUI.hasDistribution(result), false);
  assert.equal(zhUI.hasDistribution(result), false);
});
```

- [ ] **Step 2: Implement percentile math and complete result shapes**

Add to `lib/rent-check-core.cjs`:

```js
const MIN_DISTRIBUTION_COMPARABLES = 5;

function percentile(values, fraction) {
  const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const bounded = Math.min(1, Math.max(0, Number(fraction)));
  const index = (clean.length - 1) * bounded;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return clean[lower];
  return clean[lower] + (clean[upper] - clean[lower]) * (index - lower);
}

function percentileRank(values, asking) {
  const clean = values.map(Number).filter(Number.isFinite);
  const target = Number(asking);
  if (!clean.length || !Number.isFinite(target)) return null;
  return Math.round((clean.filter(value => value <= target).length / clean.length) * 100);
}
```

Every insufficient return object must explicitly include all three fields with `null`. In the successful branch, derive `values` from monthly rent for `monthly-rent` and deposit for `jeonse-deposit`, then set:

```js
const hasDistribution = comparables.length >= MIN_DISTRIBUTION_COMPARABLES;
p25ValueWon:hasDistribution ? percentile(values, 0.25) : null,
p75ValueWon:hasDistribution ? percentile(values, 0.75) : null,
percentileRank:hasDistribution ? percentileRank(values, askingValueWon) : null,
```

Export `MIN_DISTRIBUTION_COMPARABLES`, `percentile`, and `percentileRank`. Do not change `rateDifference`.

- [ ] **Step 3: Add localized distribution helpers**

In `rent-check-ui-utils.js`, add correct English ordinal handling:

```js
function ordinal(value) {
  const n = Math.max(0, Math.min(100, Math.round(Number(value))));
  const mod100 = n % 100;
  const suffix = mod100 >= 11 && mod100 <= 13
    ? 'th'
    : ({ 1:'st', 2:'nd', 3:'rd' }[n % 10] || 'th');
  return `${n}${suffix}`;
}

function hasDistribution(result) {
  return Boolean(result && result.rating !== 'insufficient' &&
    [result.p25ValueWon, result.p75ValueWon, result.percentileRank]
      .every(value => value !== null && value !== undefined && Number.isFinite(Number(value))));
}

function percentileSentence(result) {
  if (!hasDistribution(result)) return '';
  const subject = result.comparisonMode === 'jeonse-deposit'
    ? 'This jeonse deposit'
    : 'This quote';
  return `${subject} is around the ${ordinal(result.percentileRank)} percentile of comparable signed contracts.`;
}
```

In the Chinese helper, use the same `hasDistribution` contract and return:

```js
return `这个报价约处于可比已签约成交的第 ${Math.round(Number(result.percentileRank))} 百分位。`;
```

For `comparisonMode:'jeonse-deposit'`, use `这笔全租押金` as the subject. Export both helpers in both locale modules.

- [ ] **Step 4: Make UI visibility null-safe and add presentation styles**

In both Rent Check apps replace the numeric coercion visibility expression with:

```js
const valid = KHGRentCheckUI.hasDistribution(data);
```

Add to `styles.css` near the existing Rent Check evidence rules:

```css
.rent-check-intelligence{margin-top:18px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface-soft)}
.rent-check-intelligence .rent-check-evidence-head{margin-top:0;margin-bottom:12px}
.rent-check-intelligence .rent-check-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
@media(max-width:760px){.rent-check-intelligence .rent-check-metrics{grid-template-columns:1fr}}
```

- [ ] **Step 5: Run Rent Check core, UI, and regression tests**

Run:

```bash
node --test tests/v11-fair-rent-intelligence.test.cjs tests/v11-fair-rent-regression.test.cjs tests/rent-check-coverage.test.cjs tests/rent-check-layout.test.cjs tests/rent-check-prefill.test.cjs
```

Expected: all tests pass; five monthly-rent comparables yield P25/median/P75 of ₩800k/₩900k/₩1m and three tier-3 comparables keep the distribution hidden.

- [ ] **Step 6: Commit Fair Rent Intelligence**

```bash
git add lib/rent-check-core.cjs rent-check-ui-utils.js zh/rent-check-ui-utils.js tools/seoul-rent-check/app.js zh/tools/seoul-rent-check/app.js styles.css tests/v11-fair-rent-intelligence.test.cjs
git commit -m "feat: complete fair rent distribution intelligence"
```

---

### Task 9: Resolve Lead Layout, Static Inventory Assertion, and Release Verification

**Files:**
- Modify: `cold-start.css`
- Modify: `tests/date-localization.test.cjs`
- Verify: all repository runtime files and tests
- Produce outside repository: full and incremental release ZIP archives plus SHA-256 checksums

**Interfaces:**
- Preserves: the homepage's Rent Check-first action hierarchy.
- Produces: a two-column email row, a full-width consent row, a primary help CTA, and valid mobile stacking.
- Produces: verified release artifacts based on the final commit.

- [ ] **Step 1: Split lead and help form layout rules**

Replace the combined form selector in `cold-start.css` with:

```css
.lead-capture [data-lead-form]{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:10px;margin-top:16px}
.lead-capture [data-help-form]{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:10px;margin-top:16px}
.lead-capture [data-lead-form] .lead-consent-note{grid-column:1/-1}
.lead-capture [data-help-form] button{background:var(--accent);color:#fff;border-color:var(--accent)}
```

Inside the 760px media query, keep both forms at one column and both buttons at full width.

- [ ] **Step 2: Correct the locale page-inventory expectations**

In `tests/date-localization.test.cjs`, replace the shared `15` assertion with:

```js
const expectedPages = root === 'rent' ? 30 : 15;
assert.equal(files.length, expectedPages, `${root} has ${expectedPages} market pages`);
```

Do not change script-order assertions; every page must still load `/date-utils.js` before its localized market runtime.

- [ ] **Step 3: Run the focused small-UI tests**

Run:

```bash
node --test tests/cold-start-lead-layout.test.cjs tests/date-localization.test.cjs tests/lead-capture-layout.test.cjs tests/privacy-consent.test.cjs tests/ui-readability-and-officetel-rules.test.cjs
```

Expected: all tests pass.

- [ ] **Step 4: Run syntax, whitespace, policy, and complete-suite verification**

Run:

```bash
git diff --check
git diff --name-only --diff-filter=ACMRT 710a64e..HEAD | rg '\.(js|cjs)$' | xargs -r -n1 node --check
node --test tests/*.test.cjs
find api -maxdepth 1 -type f -regextype posix-extended -regex '.*\.(js|cjs|mjs)' | wc -l
rg -n '/seoul/.+/.+/(apartment|officetel|villa|detached)/.+/' sitemap*.xml
```

Expected:

```text
All tests pass.
API file count: 11 or fewer.
The building-URL sitemap search returns no matches.
git diff --check returns no output.
```

- [ ] **Step 5: Perform browser verification at mobile and desktop widths**

Before starting the preview server, load and follow `vercel:agent-browser-verify`. Start a static preview from the repository root, then verify at 390px and 1440px:

```text
/
/zh/
/tools/seoul-rent-check/
/zh/tools/seoul-rent-check/
/explore/
/zh/explore/
/guides/
/zh/guides/
```

Check that email fields do not clip, consent stays below the input/button row, the help CTA is full-height, Explorer selectors fit, the map fallback remains readable without a key, and the Rent Check distribution block is hidden before a valid result. Record any console error attributable to the application.

- [ ] **Step 6: Commit the final UI and verification fixes**

```bash
git add cold-start.css tests/date-localization.test.cjs
git commit -m "fix: finish responsive lead and date loading"
```

- [ ] **Step 7: Build and integrity-check both release archives**

Create the full repository archive from the verified commit:

```bash
git archive --format=zip --output=../koreahomeguide-stability-seo-recovery-2026-08-26.zip HEAD
```

Confirm the full remote-baseline diff contains fewer than 100 paths, then build the incremental archive from added/modified files:

```bash
git diff --name-only 0333af4..HEAD | wc -l
git archive --format=zip --output=../koreahomeguide-incremental-2026-08-26.zip HEAD $(git diff --name-only --diff-filter=ACMRT 0333af4..HEAD)
unzip -t ../koreahomeguide-stability-seo-recovery-2026-08-26.zip
unzip -t ../koreahomeguide-incremental-2026-08-26.zip
sha256sum ../koreahomeguide-stability-seo-recovery-2026-08-26.zip ../koreahomeguide-incremental-2026-08-26.zip
```

The incremental archive must include `docs/operations/github-upload-delete-files.txt`; the two listed API files must be deleted in GitHub or the function-count fix will not deploy.

- [ ] **Step 8: Inspect final repository state**

Run:

```bash
git status --short
git log --oneline 0333af4..HEAD
```

Expected: clean working tree and an auditable commit series beginning with the guide/SEO patch, followed by the approved design, plan, and implementation commits.
