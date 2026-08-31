# signedprice Seoul Rent Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the noindex signedprice Seoul Rent Check at `/kr/seoul/tools/rent-check/` with official MOLIT data, the approved Korea quote-normalization method, Claude Modernist UI, safe server boundaries, and desktop/mobile verification.

**Architecture:** Add portable rent-check contracts and statistics to `market-core`, then add a typed `@signedprice/korea-rent` package containing Seoul registries, Korea calculation policy, MOLIT parsing, rights enforcement, and cache-aware orchestration. A dynamic Next.js Route Handler injects Vercel Runtime Cache and the server-only service key; a small client workspace owns form state and calls only the same-origin route.

**Tech Stack:** TypeScript 5.9, Next.js 16.3 App Router, React 19.2, Vitest 4, Playwright 1.62, Vercel Runtime Cache, Vercel Firewall, pnpm workspaces

**Spec:** `docs/superpowers/specs/2026-08-30-signedprice-seoul-rent-check-design.md`

## Global Constraints

- Work directly on local `main`; the user explicitly authorized this workflow. Never stage or edit `upload/`.
- Use strict TDD: write one behavioral test, run it and confirm the expected failure, then write the minimum production code.
- Read and follow `v2/apps/web/AGENTS.md` and the bundled Next.js 16 Route Handler, server/client boundary, environment-variable, caching, Vitest, and Playwright guides before editing V2 code.
- Route is exactly `/kr/seoul/tools/rent-check/`; API is exactly `/api/markets/kr-seoul/rent-check/`.
- Keep `/kr/seoul/rent/` as the editorial intent route and keep KoreaHomeGuide production, canonical, hreflang, sitemap, and redirects unchanged.
- Keep signedprice `noindex, follow`; add no canonical, hreflang, or sitemap entry.
- Never browser-call a government source or KoreaHomeGuide API. Never import legacy CommonJS runtime into V2.
- `DATA_GO_KR_SERVICE_KEY` is server-only and never uses a `NEXT_PUBLIC_` prefix.
- Never fall back to fixtures, another market, scraped data, or zero-valued evidence when official data is unavailable.
- Annual deposit rate is exactly `0.05` and copy is exactly `5.0%/year signedprice comparison assumption`; never call it statutory or legal.
- Evidence thresholds remain `<3 insufficient`, `3–4 median fallback`, `>=5 P25–P75 typical range`.
- Known-cancelled records are excluded; confirmed-active and status-unknown records remain eligible with an explicit unknown-status limitation.
- All HTTP responses are `Cache-Control: private, no-store`; reuse happens only through versioned Vercel Runtime Cache entries.
- Modernist tokens remain Archivo, `#f3f2f2`, `#201e1d`, `#1d4ed8`, square `0px` corners, and two-pixel structural rules.
- All primary controls are 52px high, every target is at least 44px, mobile is one natural document flow, and evidence dates are never hidden.
- Do not merge remote `main`, publish Production, enable indexing, publish a Firewall rule, or create a legacy redirect before all local, Preview, review, and explicit side-effect gates pass.

---

### Task 1: Portable Rent Check Contracts and Statistics

**Files:**
- Create: `v2/packages/market-core/src/rent-check.ts`
- Modify: `v2/packages/market-core/src/index.ts`
- Create: `v2/packages/market-core/test/rent-check.test.ts`

**Interfaces:**
- Produces only portable contracts: generic `RentQuote<TRequestedHousingType, TSourceHousingType>`, generic `ComparableRentContract<TContractType>`, `RentComparisonResult`, and generic source-coverage primitives. No Seoul name, Korean housing classification, MOLIT field, or Seoul error/envelope type belongs in this package.
- Produces pure functions: `median(values)`, `percentile(values, fraction)`, `percentileRank(values, asking)`, `roundWon(value)`, and `roundDifferencePct(value)`.
- Later tasks import these symbols only from `@signedprice/market-core`.

- [ ] **Step 1: Write failing contract and statistic tests**

```ts
expect(median([100, 200, 900, 1_000])).toBe(550);
expect(percentile([100, 200, 900, 1_000], 0.25)).toBe(175);
expect(percentileRank([100, 200, 900, 1_000], 200)).toBe(50);
expect(roundWon(1000.5)).toBe(1001);
expect(roundDifferencePct(12.349)).toBe(12.3);
```

Add a compile-time fixture that constructs the portable quote, comparable-contract, result, and source-coverage primitives. The Seoul envelope and Korea-specific count/status fields are tested in Task 2 instead.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd v2 && pnpm vitest run packages/market-core/test/rent-check.test.ts`

Expected: FAIL because `src/rent-check.ts` and its exports do not exist.

- [ ] **Step 3: Implement the minimum portable types and statistics**

Use sorted finite copies, linear percentile interpolation, whole-percent percentile rank, positive-value `Math.round`, and one-decimal difference rounding. Throw `TypeError` for an empty or non-finite statistic input rather than returning a fabricated zero.

- [ ] **Step 4: Run focused and package tests**

Run:

```bash
cd v2
pnpm vitest run packages/market-core/test/rent-check.test.ts packages/market-core/test/markets.test.ts
pnpm --filter @signedprice/market-core typecheck
```

Expected: PASS with no warnings.

- [ ] **Step 5: Commit Task 1**

```bash
git add v2/packages/market-core
git commit -m "feat(v2): add portable rent check contracts"
```

---

### Task 2: Korea Quote Policy, Validation, and Golden Parity

**Files:**
- Create: `v2/packages/korea-rent/package.json`
- Create: `v2/packages/korea-rent/tsconfig.json`
- Create: `v2/packages/korea-rent/src/districts.ts`
- Create: `v2/packages/korea-rent/src/input.ts`
- Create: `v2/packages/korea-rent/src/calculation.ts`
- Create: `v2/packages/korea-rent/src/index.ts`
- Create: `v2/packages/korea-rent/test/input.test.ts`
- Create: `v2/packages/korea-rent/test/calculation.test.ts`
- Modify: `v2/apps/web/package.json`
- Modify: `v2/pnpm-lock.yaml`

**Interfaces:**
- Consumes Task 1 contracts and statistics.
- Produces Korea-owned `RentCheckHousingType`, `SourceHousingType`, `RentCheckQuote`, `ComparableContract`, `SeoulRentCheckEnvelope`, `SeoulRentCheckErrorCode`, and `SeoulRentCheckErrorEnvelope` by specializing the portable Task 1 contracts.
- Produces `SEOUL_RENT_CHECK_DISTRICTS`, `HOUSING_TYPE_PRESETS`, `parseSeoulRentCheckQuery(searchParams)`, `canonicalAreaFromPyeong(pyeong)`, `completedSeoulMonthKeys(referenceInstant, count)`, `restateMonthlyRentAtDeposit(record, userDepositWon)`, and `buildKoreaRentCheckResult(records, quote, referenceInstant)`.
- Produces `KoreaRentRecord`, with raw integer KRW, `recordStatus: 'active' | 'cancelled' | 'unknown'`, and contract type.

- [ ] **Step 1: Scaffold the package and write failing input tests**

Declare `@signedprice/korea-rent` as a private ESM workspace package depending on `@signedprice/market-core`. Add it to `@signedprice/web` dependencies.

Add `"@signedprice/korea-rent": "workspace:*"` to the web package, then run `pnpm install` from `v2` so `v2/pnpm-lock.yaml` records both the package and web importer edge. Verify the resulting graph with `pnpm install --frozen-lockfile` before any package test.

Test all 25 codes, all five requested housing types, `studio → detached` server mapping, exact single query values, safe-integer KRW, `0 + 0` rejection, upper bounds, area with at most two decimals, and type-specific presets. Include literal failures for `deposit=01`, `rent=1e6`, repeated `area`, and `area=-0`.

Add a compile-time full-envelope fixture including versioned source fields, earliest/latest retrieval instants, nullable `contractSelection`, eligible/selected type counts, source status counts, narrow public comparables, and every typed error code.

- [ ] **Step 2: Run input tests and verify RED**

Run: `cd v2 && pnpm vitest run packages/korea-rent/test/input.test.ts`

Expected: FAIL because the Korea package exports do not exist.

- [ ] **Step 3: Implement the minimum registries and strict parser**

The canonical parsed value is:

```ts
{
  lawdCd: '11590',
  requestedHousingType: 'studio',
  sourceHousingType: 'detached',
  depositWon: 10_000_000,
  monthlyRentWon: 900_000,
  areaSqm: 28,
}
```

Pyeong edit uses `Math.round(pyeong * 3.3058 * 100) / 100`; unit display toggles never mutate the stored square metres.

- [ ] **Step 4: Write failing calculation tests from hand-derived fixtures**

Include these literal expectations:

```ts
expect(restateMonthlyRentAtDeposit({ monthlyRentWon: 900_000, depositWon: 20_000_000 }, 10_000_000))
  .toBeCloseTo(941_666.6666666666);

// Five values: range verdict uses P25/P75.
expect(result).toMatchObject({
  rating: 'fair',
  verdictBasis: 'typical-range',
  comparableCount: 5,
});

// Three values: median fallback remains limited.
expect(limited).toMatchObject({
  verdictBasis: 'median-fallback',
  confidence: 'low',
  comparableCount: 3,
});
```

Also cover: Seoul month boundary at `2026-08-31T15:30:00Z` becoming September 1 in Seoul; zero-deposit exact matching; jeonse-only comparison; Tier 1/2/3; new-only preference; active plus unknown inclusion; known-cancelled exclusion; unrounded calculation before whole-won output; and fewer than three contracts returning no median, range, difference, confidence, or rows.

- [ ] **Step 5: Run calculation tests and verify RED**

Run: `cd v2 && pnpm vitest run packages/korea-rent/test/calculation.test.ts`

Expected: FAIL because calculation functions do not exist.

- [ ] **Step 6: Implement the minimum Korea calculation policy**

Use the exact tiers `3/15%/25%/5`, `6/20%/35%/5`, and `12/25%/50%/3`. Compute normalized values without per-record rounding; fix verdict before rounding public amounts. Return at most 10 newest evidence rows. Policy ID is `kr-rent-check-quote-normalization`, version `1`, annual rate `0.05` for monthly rent and `null` for jeonse.

- [ ] **Step 7: Run Korea package tests and typecheck**

Run:

```bash
cd v2
pnpm install --frozen-lockfile
pnpm vitest run packages/korea-rent/test/input.test.ts packages/korea-rent/test/calculation.test.ts
pnpm --filter @signedprice/korea-rent typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```bash
git add v2/packages/korea-rent v2/apps/web/package.json v2/pnpm-lock.yaml
git commit -m "feat(v2): port Seoul rent comparison policy"
```

---

### Task 3: MOLIT Client, Rights Gate, and Versioned Cache Service

**Files:**
- Create: `v2/packages/korea-rent/src/rights.ts`
- Create: `v2/packages/korea-rent/src/xml.ts`
- Create: `v2/packages/korea-rent/src/cache.ts`
- Create: `v2/packages/korea-rent/src/service.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Create: `v2/packages/korea-rent/test/rights.test.ts`
- Create: `v2/packages/korea-rent/test/xml.test.ts`
- Create: `v2/packages/korea-rent/test/service.test.ts`

**Interfaces:**
- Consumes Task 2 parser and calculation policy.
- Produces immutable `KR_MOLIT_RENT_RIGHTS`, `RuntimeCachePort` (including stable-tag hard deletion), `fetchMolitRentalMonth(input, dependencies)`, and `createSeoulRentCheckService(dependencies)`.
- `createSeoulRentCheckService().check(quote)` returns `{ envelope, cacheStatus: 'hit' | 'miss' | 'stale' }` or throws a typed `KoreaRentServiceError`.
- Produces `deriveCoverageNamespace(referenceInstant)`, computed before cache lookup from one `Asia/Seoul` reference instant as the newest completed month plus the fixed 12-month maximum window and namespace version. It never depends on the later selected tier or provider rows.

- [ ] **Step 1: Write failing deny-by-default rights tests**

Test that `kr-molit-rent-v1` permits fetch, storage, cache, derivation, display, commercial use, and 24-hour cache/retention only when attribution and a non-placeholder `evidenceRef` exist. Test that an unknown policy, missing permission, requested TTL or retention over policy bounds, or missing evidence blocks before a loader runs.

Also test a verified cached hit is denied before display when the current registry no longer grants `canDisplay` or `canUseCommercially`; a previously permitted cache object cannot bypass the live rights gate.

- [ ] **Step 2: Run rights tests and verify RED**

Run: `cd v2 && pnpm vitest run packages/korea-rent/test/rights.test.ts`

Expected: FAIL because rights registry and enforcement do not exist.

- [ ] **Step 3: Implement the rights registry and operation assertions**

Use `createRightsPolicy` from `market-core`. The ID itself carries the version; do not add a parallel rights version field.

- [ ] **Step 4: Write failing XML and pagination tests**

Use complete literal MOLIT XML pages. Cover result code, response/body completeness, `totalCount`, page-number consistency, all pages through total count, retry replacement without double append, known cancellation fields, missing status as unknown, malformed page rejection, and a cross-page duplicate without provider identity rejecting the month.

- [ ] **Step 5: Run XML tests and verify RED**

Run: `cd v2 && pnpm vitest run packages/korea-rent/test/xml.test.ts`

Expected: FAIL because the client/parser do not exist.

- [ ] **Step 6: Implement the four official endpoints and validated parser**

Use the current MOLIT rent endpoints for apartment, officetel, villa, and detached/multi-unit. `fetch` uses `cache: 'no-store'`, five-second attempts, two retries, and an injected budget/deadline signal. Read each response body once. Append a page only after full validation.

- [ ] **Step 7: Write failing source and derived cache service tests**

Use an in-memory `RuntimeCachePort` fake that exercises the real service. Verify:

- source key contains market, endpoint, source type, district, month, page size, parser, and `kr-molit-rent-v1`;
- page chunks are written before an atomic manifest and an incomplete manifest never serves;
- source TTL is 86,400 seconds;
- storage is rejected when `canStore` or the policy retention bound is absent;
- derived key includes canonical quote, precomputed coverage namespace, parser, policy ID/version, and rights ID;
- the coverage namespace changes at the completed-month rollover in `Asia/Seoul` and remains stable within a month;
- fresh hit skips provider calls;
- every source and derived entry carries `kr-seoul-rent-check` plus market, parser, methodology, and rights tags;
- invoking the port's stable-tag hard-delete contract removes otherwise valid cached hits;
- cached source and derived hits re-run current fetch/cache/derive/display/commercial rights assertions before use;
- stale entry revalidates, and only a failed revalidation within 60 minutes returns labelled stale;
- no stale entry returns source unavailable;
- earliest/latest retrieval instants span every used month;
- total deadline is 55 seconds, concurrency is at most three, and total provider calls never exceed 48.

- [ ] **Step 8: Run service tests and verify RED**

Run: `cd v2 && pnpm vitest run packages/korea-rent/test/service.test.ts`

Expected: FAIL because cache orchestration does not exist.

- [ ] **Step 9: Implement the minimum cache-aware service**

Compute the coverage namespace before the first derived lookup from the single request reference instant. Store source pages plus manifest under stable tag `kr-seoul-rent-check`. Store derived responses in the same port with `freshUntil` and `staleUntil`. Re-check the live immutable rights registry on every hit as well as every write. Never cache errors or partial data. In-process promise coalescing may reduce work but must not be required for correctness.

- [ ] **Step 10: Run all Korea package tests**

Run:

```bash
cd v2
pnpm vitest run packages/korea-rent/test
pnpm --filter @signedprice/korea-rent typecheck
```

Expected: PASS.

- [ ] **Step 11: Commit Task 3**

```bash
git add v2/packages/korea-rent
git commit -m "feat(v2): add official Seoul rent data service"
```

---

### Task 4: Same-Origin Next.js API and Vercel Runtime Adapter

**Files:**
- Create: `v2/apps/web/lib/rent-check/runtime-cache.server.ts`
- Create: `v2/apps/web/lib/rent-check/request-security.ts`
- Create: `v2/apps/web/lib/rent-check/route-handler.ts`
- Create: `v2/apps/web/app/api/markets/kr-seoul/rent-check/route.ts`
- Create: `v2/apps/web/test/rent-check-api.test.ts`
- Create: `v2/apps/web/test/runtime-cache.test.ts`
- Modify: `v2/apps/web/package.json`
- Modify: `v2/playwright.config.ts`
- Modify: `v2/pnpm-lock.yaml`

**Interfaces:**
- Consumes `createSeoulRentCheckService` and `parseSeoulRentCheckQuery`.
- Produces `createRentCheckGetHandler(dependencies)` for real route and tests.
- Production `GET` uses `getCache()` from `@vercel/functions`; local/tests inject a deterministic port.

- [ ] **Step 1: Add `@vercel/functions` and write failing route tests**

Run dependency command from `v2`:

```bash
pnpm --filter @signedprice/web add @vercel/functions@3.9.5
```

Run `pnpm install --frozen-lockfile` after the add command. Test real `Request`/`Response` behavior for 200 success, 200 insufficient, 400 repeated/invalid query, 403 bad host or origin, 500 internal invariant, 502 malformed provider response, and 503 missing key/timeout/rights/unavailable. Assert every response contains `Cache-Control: private, no-store`; success adds a validated `X-Signedprice-Cache`.

Define and test an explicit method-not-allowed handler. The real route exports it for `HEAD`, `OPTIONS`, `POST`, `PUT`, `PATCH`, and `DELETE`, returning HTTP 405, `Allow: GET`, and `Cache-Control: private, no-store` with zero service/provider calls. Non-HEAD methods use the existing typed error envelope with `code: 'invalid_request'`; HEAD has no body. Do not rely on Next.js automatic HEAD-to-GET or automatic OPTIONS behavior.

- [ ] **Step 2: Run API tests and verify RED**

Run: `cd v2 && pnpm vitest run apps/web/test/rent-check-api.test.ts`

Expected: FAIL because the route handler does not exist.

- [ ] **Step 3: Implement request security and typed response mapping**

Allowed hosts are signedprice apex/`www`, exact `VERCEL_PROJECT_PRODUCTION_URL`, and exact `VERCEL_URL`. A present Origin or Referer must match. Reject cross-site fetch metadata. Branch on missing `DATA_GO_KR_SERVICE_KEY` before any provider call. Never serialize raw errors or secrets.

The handler factory accepts an explicit allowed-host set for unit tests. It never adds a generic localhost exception. For the real built-app Playwright server, set exact `VERCEL_URL=127.0.0.1:3100` in `v2/playwright.config.ts`; this exercises the same exact-environment-host path as a real Preview. Preview and Production retain only their exact platform environment hosts; lock both acceptance and rejection with tests.

- [ ] **Step 4: Implement the Vercel Runtime Cache port**

Wrap `getCache().get/set/delete` behind the Task 3 interface and call the top-level `dangerouslyDeleteByTag(tag)` export from `@vercel/functions` for hard deletion. Add adapter tests that assert TTLs, namespace, all stable/version tags, and that stable-tag deletion invokes the top-level export exactly once. Keep hard deletion an explicit release operation rather than a request-path side effect. Export the production Route Handler with:

```ts
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const GET = createRentCheckGetHandler(/* production dependencies */);
export const HEAD = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
```

- [ ] **Step 5: Run focused tests, lint, and typecheck**

Run:

```bash
cd v2
pnpm install --frozen-lockfile
pnpm vitest run apps/web/test/rent-check-api.test.ts apps/web/test/runtime-cache.test.ts
pnpm --filter @signedprice/web lint
pnpm --filter @signedprice/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add v2/apps/web/lib/rent-check v2/apps/web/app/api/markets/kr-seoul/rent-check v2/apps/web/test/rent-check-api.test.ts v2/apps/web/test/runtime-cache.test.ts v2/apps/web/package.json v2/playwright.config.ts v2/pnpm-lock.yaml
git commit -m "feat(v2): expose same-origin Seoul rent check API"
```

---

### Task 5: Rent Check Form, Input State, and Page Shell

**Files:**
- Create: `v2/apps/web/lib/rent-check/client-state.ts`
- Create: `v2/apps/web/lib/rent-check/explorer-context.ts`
- Create: `v2/apps/web/components/rent-check/rent-check-form.tsx`
- Create: `v2/apps/web/components/rent-check/rent-check-workspace.tsx`
- Create: `v2/apps/web/app/kr/seoul/tools/rent-check/page.tsx`
- Create: `v2/apps/web/app/kr/seoul/tools/rent-check/rent-check.module.css`
- Create: `v2/apps/web/test/rent-check-state.test.ts`
- Create: `v2/apps/web/test/rent-check-page.test.ts`

**Interfaces:**
- Consumes the canonical input parser values and API envelope types.
- Produces `RentCheckApiSuccess = { envelope: SeoulRentCheckEnvelope; cacheStatus: 'hit' | 'miss' | 'stale' }`; the request function validates `X-Signedprice-Cache` and never discards stale provenance.
- Produces reducer states `idle | loading | success | insufficient | error`, separate `draftInput`/`checkedInput`, stored `cacheStatus` for completed results, monotonic `requestId`, and `AbortController` ownership.
- Produces page metadata with no route-level canonical/hreflang and inherited `noindex, follow`.

- [ ] **Step 1: Write failing reducer and conversion tests**

Test initial state, submit/loading, stale response ignored by request ID, new submit abort semantics, checked result invalidation on edit, error keeping draft but clearing verdict, retryable versus non-retryable mapping, response-header `hit | miss | stale` propagation into state, invalid/missing cache-header rejection, and drift-free pyeong toggles. Derive all expected state literals by hand.

- [ ] **Step 2: Run state tests and verify RED**

Run: `cd v2 && pnpm vitest run apps/web/test/rent-check-state.test.ts`

Expected: FAIL because the reducer does not exist.

- [ ] **Step 3: Implement the minimum client state and request function**

The request function handles HTTP 429 before JSON: use valid `Retry-After`, otherwise 60 seconds. Other non-2xx bodies use the typed envelope or one generic unavailable fallback. For 200 responses it validates the typed envelope and `X-Signedprice-Cache`, then returns both together. Editing any checked field clears the old result and its cache status.

- [ ] **Step 4: Write failing page and form markup tests**

Render the page and form to static markup. Assert one H1, real labels/fieldset/legend, 25 districts, five housing choices, type-specific presets, 52px-authored control class, no idle live-region placeholder, and the exact comparison-assumption copy. Inspect the route's exported metadata plus the built `<head>` contract for inherited `noindex, follow` and the absence of canonical/hreflang; static body markup alone is not evidence for head metadata.

- [ ] **Step 5: Run page tests and verify RED**

Run: `cd v2 && pnpm vitest run apps/web/test/rent-check-page.test.ts`

Expected: FAIL because the route and components do not exist.

- [ ] **Step 6: Implement the Modernist page shell and form**

Keep `page.tsx` a Server Component and `RentCheckWorkspace` the narrow Client Component boundary. At 1,180px and above use `minmax(720px, 3fr) minmax(360px, 2fr)`; below it stack evidence under the quote. At 720px and below make the form one column. Do not add decorative cards or rounded containers.

- [ ] **Step 7: Run focused tests, lint, and typecheck**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/rent-check-state.test.ts apps/web/test/rent-check-page.test.ts
pnpm --filter @signedprice/web lint
pnpm --filter @signedprice/web typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add v2/apps/web/lib/rent-check/client-state.ts v2/apps/web/lib/rent-check/explorer-context.ts v2/apps/web/components/rent-check v2/apps/web/app/kr/seoul/tools/rent-check v2/apps/web/test/rent-check-state.test.ts v2/apps/web/test/rent-check-page.test.ts
git commit -m "feat(v2): add Modernist Seoul rent quote form"
```

---

### Task 6: Verdict, Range, Evidence, and Disclosure UI

**Files:**
- Create: `v2/apps/web/components/rent-check/trust-label.tsx`
- Create: `v2/apps/web/components/rent-check/evidence-strength.tsx`
- Create: `v2/apps/web/components/rent-check/rent-range.tsx`
- Create: `v2/apps/web/components/rent-check/comparable-contracts.tsx`
- Create: `v2/apps/web/components/rent-check/source-disclosure.tsx`
- Create: `v2/apps/web/components/rent-check/rent-check-result.tsx`
- Modify: `v2/apps/web/components/rent-check/rent-check-workspace.tsx`
- Modify: `v2/apps/web/app/kr/seoul/tools/rent-check/rent-check.module.css`
- Create: `v2/apps/web/test/rent-check-result.test.ts`

**Interfaces:**
- Consumes `RentCheckApiSuccess` (`SeoulRentCheckEnvelope` plus validated cache status) and typed error envelopes.
- Produces complete success, limited, insufficient, stale, retryable error, non-retry unavailable, and named rights-blocked presentations.

- [ ] **Step 1: Write failing result markup tests**

Use full literal envelopes, not partial mocks. Assert:

- `Asking quote`, `Official reported contracts`, and `signedprice estimate` provenance;
- P25/P75 text equivalent to the visual range;
- 3–4 contracts show Limited and median only;
- fewer than three hide median/range/difference/confidence/rows;
- at most 10 newest contract rows and dates remain in markup;
- `cacheStatus: 'stale'` is explicitly labelled and `hit | miss` is not mislabelled;
- unknown status count and studio mapping warning are visible;
- rights-blocked has no retry, while retryable errors do;
- source, coverage month, earliest/latest retrieval, assumptions, correction/cancellation caveat, not-listing, and not-appraisal/legal-advice copy are present;
- missing maintenance/furnishings/floor/view/fees/return risk are limitations, never zero.

- [ ] **Step 2: Run result tests and verify RED**

Run: `cd v2 && pnpm vitest run apps/web/test/rent-check-result.test.ts`

Expected: FAIL because result components do not exist.

- [ ] **Step 3: Implement the minimum semantic result components**

The range graphic is `aria-hidden`; equivalent values and verdict are text. The table uses full semantic headers. On mobile, use complete contract rows or a labelled inner scroller; never hide the date.

- [ ] **Step 4: Complete route-scoped Modernist CSS**

Use the existing global tokens and a connected frame. Add visible two-pixel focus, 52px controls, `min-width: 0`, overflow containment, reduced-motion behavior, and natural mobile document flow. Do not change global tokens.

- [ ] **Step 5: Run focused tests, lint, and typecheck**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/rent-check-page.test.ts apps/web/test/rent-check-result.test.ts apps/web/test/design-tokens.test.ts
pnpm --filter @signedprice/web lint
pnpm --filter @signedprice/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit Task 6**

```bash
git add v2/apps/web/components/rent-check v2/apps/web/app/kr/seoul/tools/rent-check/rent-check.module.css v2/apps/web/test/rent-check-result.test.ts
git commit -m "feat(v2): render Seoul rent evidence and disclosures"
```

---

### Task 7: Explorer and Rent Intent Handoff

**Files:**
- Modify: `v2/apps/web/components/building-dialog.tsx`
- Modify: `v2/apps/web/components/explorer-workspace.tsx`
- Modify: `v2/apps/web/lib/route-model.ts`
- Modify: `v2/apps/web/test/explorer-ui-contract.test.ts`
- Modify: `v2/apps/web/test/route-model.test.ts`
- Modify: `v2/apps/web/test/rent-check-page.test.ts`

**Interfaces:**
- Consumes `resolveExplorerRentCheckContext` from Task 5.
- `ExplorerWorkspace`, which owns the selected district, property type, neighborhood, and building relationship, produces the complete verified href and passes it to `BuildingDialog`; the dialog never guesses a property type from the building alone.
- Produces only verified `lawdCd`, `type`, `dong`, and `building` query context.
- Keeps the result scope district-level and never fabricates deposit, rent, or area.

- [ ] **Step 1: Write failing handoff tests**

Assert the selected Dongjak/officetel/Noryangjin/building link points to:

```text
/kr/seoul/tools/rent-check/?lawdCd=11590&type=officetel&dong=noryangjin-dong&building=noryangjin-dream-square
```

Assert no deposit/rent/area parameters. Assert orphan building, wrong district, raw HTML, and unknown context are ignored rather than rendered. Assert `/kr/seoul/rent/` has a `Check a Seoul rent quote` action to the tool.

- [ ] **Step 2: Run handoff tests and verify RED**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/explorer-ui-contract.test.ts apps/web/test/route-model.test.ts apps/web/test/rent-check-page.test.ts
```

Expected: FAIL because the dialog still links to `/kr/seoul/rent/` and the intent action is absent.

- [ ] **Step 3: Implement verified context serialization and navigation**

Derive context in `ExplorerWorkspace` from the V2 Explorer registry and its current typed state, never raw query labels. Use `URLSearchParams` for the link and pass the completed href as a dialog prop. Keep the current dialog scroll/focus behavior unchanged.

- [ ] **Step 4: Run focused Explorer and route tests**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/explorer-ui-contract.test.ts apps/web/test/explorer-state-contract.test.ts apps/web/test/route-model.test.ts apps/web/test/rent-check-page.test.ts
pnpm --filter @signedprice/web lint
pnpm --filter @signedprice/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit Task 7**

```bash
git add v2/apps/web/components/building-dialog.tsx v2/apps/web/components/explorer-workspace.tsx v2/apps/web/lib/route-model.ts v2/apps/web/test/explorer-ui-contract.test.ts v2/apps/web/test/route-model.test.ts v2/apps/web/test/rent-check-page.test.ts
git commit -m "feat(v2): connect Explorer to Seoul Rent Check"
```

---

### Task 8: End-to-End, Release Gate, and Full Verification

**Files:**
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Create: `v2/tests/e2e/rent-check.spec.ts`
- Create: `docs/operations/signedprice-seoul-rent-check-release-gate.md`

**Interfaces:**
- Exercises the built application in desktop Chromium 1366×768 and mobile Chromium 390×844.
- Intercepts only the same-origin API boundary with complete success, insufficient, stale, 429, and rights-blocked envelopes; Route Handler behavior remains covered by Task 4 integration tests.
- Adds a separate, non-intercepted exact-SHA Vercel Preview smoke gate for one monthly-rent and one jeonse API request before remote-main merge.

- [ ] **Step 1: Write failing Playwright flows**

Cover desktop and mobile form completion, aligned 52px desktop controls, one-column mobile order, no horizontal page overflow, keyboard submission, result focus, full evidence date visibility, source/period/sample/limitations visibility, stale label, retryable and non-retry errors, 44px targets, Explorer handoff without fabricated quote values, and `HEAD`, `OPTIONS`, and `POST` to the GET-only API returning 405 with `Allow: GET` and `no-store` without invoking the provider.

- [ ] **Step 2: Run the focused E2E test and verify RED**

Run: `cd v2 && pnpm playwright test tests/e2e/rent-check.spec.ts --project=desktop-chromium`

Expected: FAIL on the first missing or incorrect browser contract.

- [ ] **Step 3: Fix only browser-discovered defects within the approved route scope**

For every defect, add or retain the failing assertion, then make the minimum route-scoped component or CSS correction. Do not weaken size, accessibility, evidence, or overflow assertions.

- [ ] **Step 4: Write the exact release runbook**

Document:

- V2 Preview and Production server-only key presence checks without printing its value;
- new exact-SHA deployment after any environment change;
- stable tag hard delete before parser/method/rights changes;
- Vercel Firewall log-only → Preview rate-limit → production log review → founder publish sequence for `GET /api/markets/kr-seoul/rent-check/`, 30 requests/60 seconds/IP;
- live monthly-rent and jeonse smoke requests;
- exact-SHA Preview smoke before merge, with no Playwright route interception: assert 200 success-or-insufficient typed JSON, MOLIT source metadata, completed-month coverage, `Cache-Control: private, no-store`, valid `X-Signedprice-Cache`, and no secret/raw endpoint in the response;
- cache status, 5xx, redacted logs, TLS, apex-to-`www`, `noindex`, and legacy unchanged checks;
- explicit prohibition on redirect or indexing in this slice.

- [ ] **Step 5: Run full local V2 gates**

Run:

```bash
cd v2
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm e2e
```

Expected: every V2 suite passes in desktop and mobile projects.

- [ ] **Step 6: Run legacy separation gate**

Run from the repository root:

```bash
node scripts/v2-migration/verify-phase-0.cjs
```

Expected: `ok: true`, exactly 23 approved pre-existing failures, and no new failure title or class.

- [ ] **Step 7: Commit Task 8**

```bash
git add v2/tests/e2e/public-route-contract.ts v2/tests/e2e/rent-check.spec.ts docs/operations/signedprice-seoul-rent-check-release-gate.md
git commit -m "test(v2): verify Seoul Rent Check release story"
```

- [ ] **Step 8: Independent final review and deployment sequence**

Request broad code review; resolve all Critical and Important findings. Create an exact-SHA Vercel Preview and confirm the server-only key is present without printing it. Verify the UI in Chromium, then call the deployed API directly without interception for one monthly-rent quote and one jeonse quote. Both must return a typed success-or-insufficient official MOLIT envelope with source/coverage metadata, `Cache-Control: private, no-store`, a valid cache-status header, no secret or raw endpoint, and no corresponding unredacted runtime log before preparing the remote-main merge. A missing key, Preview protection blocker, malformed source, or unavailable live smoke blocks merge rather than activating a fallback.

Production and Firewall publication remain explicit side-effect gates: show the verified Preview and Firewall diff before executing them. After authorized publication, verify `www.signedprice.com`, apex redirect, TLS, real monthly-rent and jeonse responses, cache status, 5xx/log redaction, noindex, and unchanged KoreaHomeGuide production.
