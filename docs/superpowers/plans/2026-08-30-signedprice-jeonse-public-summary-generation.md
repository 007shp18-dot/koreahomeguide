# signedprice Jeonse Public Summary Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and publish a verified seven-completed-month Seoul jeonse-deposit summary for the protected Korea Public P1 Preview without exposing provider data or changing Production.

**Architecture:** A server-only Korea generator enumerates the complete 25-district × four-source × seven-month matrix, fetches it through existing MOLIT parsing and rights boundaries, and checkpoints verified pages in an isolated Vercel Runtime Cache namespace. A temporary protected Preview route advances the bounded job and finalizes a v2 aggregate artifact; after the artifact is installed in Preview, the runner is removed and the final SSR candidate reads only the environment artifact.

**Tech Stack:** TypeScript 5.9, Next.js 16.3 App Router, React 19.2, Vitest 4.1, Playwright 1.62, pnpm 11, Vercel Runtime Cache and protected Preview deployments.

**Spec:** `docs/superpowers/specs/2026-08-30-signedprice-jeonse-public-summary-generation-design.md`

## Global Constraints

- Public Korea compares refundable jeonse deposit, not monthly rent or monthly-equivalent cost.
- Public Korea uses `deal: "jeonse"`, `band: "45-55sqm"`, and artifact version `signedprice-public-summary-v2`.
- Eligible records have `depositWon > 0`, `monthlyRentWon === 0`, `45 <= areaSqm <= 55`, and `recordStatus !== "cancelled"`.
- The source period is exactly seven contiguous completed calendar months across all 25 verified Seoul lawd codes and apartment, officetel, villa, and detached sources.
- `n < 5` serializes no `min`, `p25`, `med`, `p75`, `max`, or `chg3m` key.
- `chg3m` is one-decimal percentage change between the latest-three-month median and preceding-three-month median, or `null` when either window has fewer than five eligible records.
- `DATA_GO_KR_SERVICE_KEY` remains server-only, sensitive, absent from commits, logs, responses, artifacts, and client bundles.
- The generator cache uses its own namespace and tag and never purges or mutates the protected Rent Check cache cohort.
- The temporary job route exists only on protected Vercel Preview and is deleted before the final candidate.
- Never edit, stage, or publish `upload/`.
- No Production, indexing, DNS, redirect, Firewall, Runtime Cache purge, or KoreaHomeGuide migration change is authorized.

---

## File responsibility map

- `v2/packages/market-core/src/public-market-config.ts`: market-driven input scaling, label, unit, fixed axis, and Korea deal identity.
- `v2/packages/korea-rent/src/public-summary.ts`: deny-safe pure-jeonse distribution and `chg3m` calculation.
- `v2/packages/korea-rent/src/source-month-store.ts`: configurable manifest/page cache repository with isolated namespace and corrupt-tag handling.
- `v2/packages/korea-rent/src/public-summary-job.ts`: deterministic 700-coordinate plan, bounded resumable fetch, completeness finalization, and aggregate job report.
- `v2/apps/web/lib/public-market/artifact-builder.server.ts`: v2 JSON assembly, canonical digest, and validation through the production parser.
- `v2/apps/web/lib/public-market/public-summary-job-cache.server.ts`: Vercel adapter using only the public-summary job namespace.
- `v2/apps/web/lib/public-market/job-handler.server.ts`: exact request parsing, Preview guard, categorical progress, and sanitized output.
- `v2/apps/web/app/api/internal/public-summary-job/route.ts`: temporary POST-only execution surface, deleted before the final candidate.
- `v2/apps/web/lib/public-market/summary-schema.ts`: exact v2 artifact consumer contract.
- `v2/apps/web/lib/public-market/route-model.server.ts`: required `jeonse`/`45-55sqm` identity and public copy.
- `artifacts/public-p1/preview-summary-job.json`: non-served sanitized generation evidence without artifact contents or secrets.

---

### Task 1: Correct the Korea public metric and input scaling

**Files:**
- Modify: `v2/packages/market-core/src/public-market-config.ts`
- Modify: `v2/packages/market-core/test/public-market-config.test.ts`
- Modify: `v2/apps/web/components/public-market/quote-input.tsx`
- Modify: `v2/apps/web/test/public-quote-input.test.tsx`

**Interfaces:**
- Consumes: existing `PublicMarketConfig`, `parsePublicQuoteInput()`, and `positionQuote()`.
- Produces: `PublicMarketConfig.quoteInputMultiplier: number` and `parsePublicQuoteInput(raw, multiplier)` returning whole-won values.

- [ ] **Step 1: Write the failing Korea config test**

```ts
expect(getPublicMarketConfig('kr-seoul')).toMatchObject({
  quoteLabel: 'Refundable deposit',
  quoteUnit: 'KRW million',
  quoteInputMultiplier: 1_000_000,
  axis: { min: 160_000_000, max: 620_000_000, step: 10_000_000 },
  dealTypes: ['jeonse'],
});
```

- [ ] **Step 2: Write failing quote parsing tests**

```ts
expect(parsePublicQuoteInput('380', 1_000_000)).toEqual({
  status: 'valid',
  value: 380_000_000,
});
expect(parsePublicQuoteInput('380.5', 1_000_000)).toEqual({
  status: 'valid',
  value: 380_500_000,
});
expect(parsePublicQuoteInput('380.555', 1_000_000)).toEqual({ status: 'invalid' });
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run packages/market-core/test/public-market-config.test.ts apps/web/test/public-quote-input.test.tsx`

Expected: FAIL because `quoteInputMultiplier` is absent and decimal input is rejected.

- [ ] **Step 4: Implement market-driven scaling**

Add `quoteInputMultiplier` to `PublicMarketConfigDefinition`. Set Korea to
`1_000_000` and Singapore/Dubai to `1`. Parse canonical non-negative input with
at most two decimal places, multiply by the configured multiplier, and reject a
non-safe-integer stored value. Seed the Korea draft as
`String(summary.med / config.quoteInputMultiplier)`.

```ts
const QUOTE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const storedValue = Number(raw) * multiplier;
return Number.isSafeInteger(storedValue)
  ? { status: 'valid', value: storedValue }
  : { status: 'invalid' };
```

- [ ] **Step 5: Run focused tests and typechecks**

Run: `cd v2 && pnpm exec vitest run packages/market-core/test/public-market-config.test.ts apps/web/test/public-quote-input.test.tsx && pnpm --filter @signedprice/market-core typecheck && pnpm --filter @signedprice/web typecheck`

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add v2/packages/market-core/src/public-market-config.ts v2/packages/market-core/test/public-market-config.test.ts v2/apps/web/components/public-market/quote-input.tsx v2/apps/web/test/public-quote-input.test.tsx
git commit -m "fix(v2): align Korea public quote with jeonse deposit"
```

---

### Task 2: Derive the seven-month deny-safe jeonse summary

**Files:**
- Modify: `v2/packages/korea-rent/src/public-summary.ts`
- Modify: `v2/packages/korea-rent/test/public-summary.test.ts`

**Interfaces:**
- Consumes: `KoreaRentRecord`, `median()`, `percentile()`, `roundWon()`, and existing rights/provenance checks.
- Produces: `buildKoreaPublicMarketSummary(input)` with fixed `deal: "jeonse"`, seven-month validation, 45–55㎡ eligibility, and `chg3m`.

- [ ] **Step 1: Replace monthly-equivalent fixtures with failing jeonse fixtures**

```ts
function jeonse(depositWon: number, month = '2026-07', overrides = {}): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 50,
    depositWon,
    monthlyRentWon: 0,
    contractDate: `${month}-15`,
    contractType: 'new',
    recordStatus: 'active',
    ...overrides,
  };
}
```

Use `completedMonths: ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07']`, `period: '2026-01/2026-07'`, and `band: '45-55sqm'` in the canonical test input.

- [ ] **Step 2: Add failing eligibility and suppression tests**

```ts
const summary = buildKoreaPublicMarketSummary(input([
  jeonse(100_000_000),
  jeonse(200_000_000),
  jeonse(300_000_000),
  jeonse(400_000_000),
  jeonse(900_000_000, '2026-07', { monthlyRentWon: 1 }),
  jeonse(900_000_000, '2026-07', { areaSqm: 55.01 }),
]));
expect(summary).toEqual({
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
  band: '45-55sqm', period: '2026-01/2026-07', n: 4, published: false,
});
expect(JSON.stringify(summary)).not.toMatch(/min|p25|med|p75|max|chg3m/);
```

- [ ] **Step 3: Add failing `chg3m` tests**

Create five deposits of `200_000_000` in each of February–April and five
deposits of `220_000_000` in each of May–July. Expect `chg3m: 10`. Reduce April
to four eligible records and expect `chg3m: null` while the seven-month summary
remains published.

- [ ] **Step 4: Run the focused test and confirm RED**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-summary.test.ts`

Expected: FAIL on deal, band, eligibility, seven-month enforcement, values, and change.

- [ ] **Step 5: Implement the minimal jeonse policy**

```ts
function eligible(record: KoreaRentRecord): boolean {
  return record.recordStatus !== 'cancelled'
    && record.depositWon > 0
    && record.monthlyRentWon === 0
    && record.areaSqm >= 45
    && record.areaSqm <= 55;
}

function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
```

Require exactly seven completed months. Use `depositWon` for the full-period
five-number summary. Compute each three-month median only when that window has
at least five eligible records and set `chg3m` to
`oneDecimal((latest - prior) / prior * 100)`; otherwise use `null`.

- [ ] **Step 6: Run the focused test and package typecheck**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-summary.test.ts && pnpm --filter @signedprice/korea-rent typecheck`

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add v2/packages/korea-rent/src/public-summary.ts v2/packages/korea-rent/test/public-summary.test.ts
git commit -m "feat(v2): derive seven-month jeonse public summary"
```

---

### Task 3: Isolate a configurable verified source-month store

**Files:**
- Create: `v2/packages/korea-rent/src/source-month-store.ts`
- Create: `v2/packages/korea-rent/test/source-month-store.test.ts`
- Modify: `v2/packages/korea-rent/src/cache.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Modify: `v2/packages/korea-rent/test/cache.test.ts`

**Interfaces:**
- Consumes: source manifest/page validators and `RuntimeCachePort`.
- Produces: `createSourceMonthStore(policy): SourceMonthStore`; existing `readSourceMonthCache()` and `writeSourceMonthCache()` remain backward-compatible wrappers.

```ts
export type SourceMonthStorePolicy = Readonly<{
  namespacePrefix: string;
  ttlSeconds: number;
  tags: readonly string[];
  corruptTag: string;
}>;

export type SourceMonthIdentity = Readonly<{
  sourceHousingType: SourceHousingType;
  lawdCd: string;
  dealYmd: string;
  pageSize: number;
}>;

export type SourceMonthStore = Readonly<{
  read(cache: RuntimeCachePort, input: SourceMonthIdentity, signal?: AbortSignal): Promise<MolitRentalMonth | null>;
  write(cache: RuntimeCachePort, month: MolitRentalMonth, beforeWrite?: () => void, signal?: AbortSignal): Promise<void>;
}>;
```

- [ ] **Step 1: Add failing namespace-isolation tests**

Create one store with prefix `signedprice:kr-public-summary-job:v1` and tag
`kr-public-summary-job:v1`. Assert its manifest/page keys start with that prefix,
its `set()` calls contain only job tags, and a corrupt manifest calls
`hardDeleteByTag('kr-public-summary-job:v1')` rather than
`hardDeleteByTag('kr-seoul-rent-check')`.

- [ ] **Step 2: Add a failing compatibility test**

Assert the existing `sourceCacheNamespace()` output and existing Rent Check
source tags are byte-for-byte unchanged when the default wrappers are used.

- [ ] **Step 3: Run source cache tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/source-month-store.test.ts packages/korea-rent/test/cache.test.ts`

Expected: FAIL because the configurable store does not exist.

- [ ] **Step 4: Extract manifest/page persistence behind the policy**

Move source-month namespace construction, generation digest, reconstruction,
read, write, and corruption handling into `source-month-store.ts`. Construct the
existing Rent Check wrappers with this exact policy:

```ts
const RENT_CHECK_SOURCE_POLICY = {
  namespacePrefix: 'kr-seoul-rent-check:source',
  ttlSeconds: SOURCE_CACHE_TTL_SECONDS,
  tags: RENT_CHECK_CACHE_TAGS,
  corruptTag: STABLE_RENT_CHECK_TAG,
} as const;
```

- [ ] **Step 5: Run source cache, service, and typecheck gates**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/source-month-store.test.ts packages/korea-rent/test/cache.test.ts packages/korea-rent/test/service.test.ts && pnpm --filter @signedprice/korea-rent typecheck`

Expected: PASS with no Rent Check namespace or behavior diff.

- [ ] **Step 6: Commit Task 3**

```bash
git add v2/packages/korea-rent/src/source-month-store.ts v2/packages/korea-rent/test/source-month-store.test.ts v2/packages/korea-rent/src/cache.ts v2/packages/korea-rent/src/index.ts v2/packages/korea-rent/test/cache.test.ts
git commit -m "refactor(v2): isolate verified source month stores"
```

---

### Task 4: Build the deterministic resumable Korea job

**Files:**
- Create: `v2/packages/korea-rent/src/public-summary-job.ts`
- Create: `v2/packages/korea-rent/test/public-summary-job.test.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`

**Interfaces:**
- Consumes: `SEOUL_RENT_CHECK_DISTRICTS`, `completedSeoulMonthKeys()`, `fetchMolitRentalMonth()`, `createSourceMonthStore()`, and `buildKoreaPublicMarketSummary()`.
- Produces: the following server-only API.

```ts
export type KoreaPublicSummaryCoordinate = Readonly<{
  index: number;
  lawdCd: SeoulLawdCd;
  sourceHousingType: SourceHousingType;
  dealYmd: string;
}>;

export type KoreaPublicSummaryBatchResult = Readonly<{
  status: 'progress' | 'retryable' | 'blocked';
  nextCursor: number;
  completedCoordinates: number;
  totalCoordinates: 700;
  code?: 'source_timeout' | 'source_unavailable' | 'source_malformed' | 'rights_blocked';
}>;

export type KoreaPublicSummaryFinalization = Readonly<{
  summary: PublicMarketSummary;
  period: string;
  generatedAt: string;
  completedCoordinates: 700;
  eligibleRecords: number;
  activeRecords: number;
  unknownStatusRecords: number;
  newContracts: number;
  renewalContracts: number;
  unknownContracts: number;
}>;

export type KoreaPublicSummaryJobDependencies = Readonly<{
  serviceKey: string;
  cache: RuntimeCachePort;
  fetch: MolitFetch;
  now: () => Date;
  rightsLookup?: MolitRightsLookup;
  coordinateLimit?: number;
  createDeadlineSignal?: (timeoutMs: number) => AbortSignal;
  createProviderBudget?: (limit: number) => ProviderCallBudget;
}>;

export function runKoreaPublicSummaryBatch(
  input: Readonly<{ referenceInstant: string; cursor: number }>,
  dependencies: KoreaPublicSummaryJobDependencies,
): Promise<KoreaPublicSummaryBatchResult>;

export function finalizeKoreaPublicSummaryJob(
  input: Readonly<{ referenceInstant: string }>,
  dependencies: Omit<KoreaPublicSummaryJobDependencies, 'serviceKey' | 'fetch'>,
): Promise<KoreaPublicSummaryFinalization>;
```

- [ ] **Step 1: Write the failing coordinate-plan test**

At reference instant `2026-08-30T00:00:00.000Z`, expect 700 unique coordinates
covering `202601` through `202607`. Assert district-major,
source-type-second, month-last ordering and no duplicate serialized identity.

- [ ] **Step 2: Write failing batch resume tests**

Use an in-memory `RuntimeCachePort` and a fake `fetchMolitRentalMonth` dependency.
Start at cursor 0 with `coordinateLimit: 4`; expect exactly four verified writes
and `nextCursor: 4`. Repeat from cursor 0 and assert source fetch is not called
for cached coordinates. Make coordinate 4 time out and expect `status:
'retryable'`, `nextCursor: 4`, and no advancement past the failure.

- [ ] **Step 3: Write failing finalization tests**

Seed all 700 coordinates with complete frozen months. Expect one `45-55sqm`
jeonse summary and exact status/contract-type counts. Remove one coordinate and
expect finalization to throw `Public summary source coverage is incomplete.`

- [ ] **Step 4: Run the job tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-summary-job.test.ts`

Expected: FAIL because the job module does not exist.

- [ ] **Step 5: Implement the ordered plan and bounded batch**

Use `pageSize: 1_000`, a job store policy with 24-hour TTL, tag
`kr-public-summary-job:v1`, provider concurrency `2`, coordinate limit `4`, and
a request deadline of 50 seconds. Check rights before cache read, fetch, store,
derive, display, and commercial operations. Advance the cursor only after the
coordinate can be read back and its generation digest validates.

- [ ] **Step 6: Implement completeness finalization**

Read every coordinate in plan order; refuse on the first missing or invalid
month. Concatenate reconstructed records, calculate the operational counts, and
call `buildKoreaPublicMarketSummary()` with the exact seven-month period and
source provenance constants.

- [ ] **Step 7: Run job/package regression and typecheck**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-summary-job.test.ts packages/korea-rent/test/public-summary.test.ts packages/korea-rent/test/service.test.ts && pnpm --filter @signedprice/korea-rent typecheck`

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add v2/packages/korea-rent/src/public-summary-job.ts v2/packages/korea-rent/test/public-summary-job.test.ts v2/packages/korea-rent/src/index.ts
git commit -m "feat(v2): add resumable Seoul public summary job"
```

---

### Task 5: Advance the artifact contract to v2 and correct public copy

**Files:**
- Create: `v2/apps/web/lib/public-market/artifact-builder.server.ts`
- Create: `v2/apps/web/test/public-summary-artifact-builder.test.ts`
- Modify: `v2/apps/web/lib/public-market/summary-schema.ts`
- Modify: `v2/apps/web/lib/public-market/route-model.server.ts`
- Modify: `v2/apps/web/test/public-summary-repository.test.ts`
- Modify: `v2/apps/web/test/public-summary-environment.test.ts`
- Modify: `v2/apps/web/test/public-korea-routes.test.tsx`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`
- Modify: `v2/tests/e2e/public-summary-fixture.ts`

**Interfaces:**
- Consumes: `KoreaPublicSummaryFinalization` and `parsePublicSummaryArtifact()`.
- Produces: `PUBLIC_SUMMARY_ARTIFACT_VERSION = "signedprice-public-summary-v2"`, canonical v2 JSON, SHA-256 digest, and required identity `{area:"seoul", deal:"jeonse", band:"45-55sqm"}`.

```ts
export type BuiltPublicSummaryArtifact = Readonly<{
  artifact: PublicSummaryArtifactInput;
  serialized: string;
  sha256: string;
}>;

export function buildPublicSummaryArtifact(
  finalization: KoreaPublicSummaryFinalization,
): Promise<BuiltPublicSummaryArtifact>;
```

- [ ] **Step 1: Write failing v2 refusal and identity tests**

```ts
expect(PUBLIC_SUMMARY_ARTIFACT_VERSION).toBe('signedprice-public-summary-v2');
expect(() => repository(v1Artifact)).toThrow(PublicSummaryUnavailableError);
expect(repository(v2Artifact).getSummary({
  area: 'seoul', deal: 'jeonse', band: '45-55sqm',
})).toEqual(publishedJeonseSummary);
```

- [ ] **Step 2: Write the failing artifact builder test**

Pass a literal finalization at `2026-08-30T00:00:00.000Z`. Expect exact root and
provenance keys, deep-frozen output, successful production-parser validation,
and a lowercase 64-character SHA-256 digest. Search the serialized return for
`serviceKey`, `apis.data.go.kr`, raw records, cache keys, and rights evidence and
expect zero matches.

- [ ] **Step 3: Write failing route/copy tests**

Expect `diagnosePublicSummaryEnvironment()` to return `ready` only for the
jeonse/45–55㎡ v2 summary. Assert public metadata, headings, labels, and initial
HTML say refundable deposit and never say monthly-rent distribution.

- [ ] **Step 4: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-summary-artifact-builder.test.ts apps/web/test/public-summary-repository.test.ts apps/web/test/public-summary-environment.test.ts apps/web/test/public-korea-routes.test.tsx apps/web/test/public-route-contract.test.tsx`

Expected: FAIL on v1 version, old identity, and monthly-rent copy.

- [ ] **Step 5: Implement canonical v2 assembly and route identity**

Build the artifact with exact keys `artifactVersion`, `generatedAt`,
`provenance`, and `summaries`. Canonicalize object keys before hashing. Validate
the assembled object with `parsePublicSummaryArtifact()` before returning it.
Update the required repository query and all public copy to jeonse deposit.

- [ ] **Step 6: Update the deterministic browser fixture without treating it as operational data**

Keep synthetic values, advance the fixture version/period/identity, and retain
the release-gate warning that the fixture must never be copied into Vercel.

- [ ] **Step 7: Run focused tests, web typecheck, and client-boundary scan**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-summary-artifact-builder.test.ts apps/web/test/public-summary-repository.test.ts apps/web/test/public-summary-environment.test.ts apps/web/test/public-korea-routes.test.tsx apps/web/test/public-route-contract.test.tsx && pnpm --filter @signedprice/web typecheck && pnpm build && pnpm check:rent-client-boundary`

Expected: PASS and no provider/key marker in client assets.

- [ ] **Step 8: Commit Task 5**

```bash
git add v2/apps/web/lib/public-market/artifact-builder.server.ts v2/apps/web/test/public-summary-artifact-builder.test.ts v2/apps/web/lib/public-market/summary-schema.ts v2/apps/web/lib/public-market/route-model.server.ts v2/apps/web/test/public-summary-repository.test.ts v2/apps/web/test/public-summary-environment.test.ts v2/apps/web/test/public-korea-routes.test.tsx v2/apps/web/test/public-route-contract.test.tsx v2/tests/e2e/public-summary-fixture.ts
git commit -m "feat(v2): advance public summary to jeonse v2"
```

---

### Task 6: Add the temporary protected Preview runner

**Files:**
- Create: `v2/apps/web/lib/public-market/public-summary-job-cache.server.ts`
- Create: `v2/apps/web/lib/public-market/job-handler.server.ts`
- Create: `v2/apps/web/app/api/internal/public-summary-job/route.ts`
- Create: `v2/apps/web/test/public-summary-job-cache.test.ts`
- Create: `v2/apps/web/test/public-summary-job-handler.test.ts`

**Interfaces:**
- Consumes: `runKoreaPublicSummaryBatch()`, `finalizeKoreaPublicSummaryJob()`, `buildPublicSummaryArtifact()`, and `DATA_GO_KR_SERVICE_KEY`.
- Produces: POST actions `{action:"batch", referenceInstant, cursor}` and `{action:"finalize", referenceInstant}` with exact sanitized responses.

- [ ] **Step 1: Write failing cache-adapter isolation tests**

Assert `getCache({namespace:'signedprice:kr-public-summary-job:v1'})`, job-only
tags, and no use of `VERCEL_RENT_CHECK_CACHE_NAMESPACE` or
`STABLE_RENT_CHECK_TAG`.

- [ ] **Step 2: Write failing request-boundary tests**

Cover duplicate/extra keys, invalid cursor, non-canonical instant, missing key,
non-Preview environment, GET/HEAD/OPTIONS, batch progress, retryable source
failure, and finalization. Non-Preview returns 404; missing key returns a
categorical 503; malformed input returns 400; unsupported methods return 405.

- [ ] **Step 3: Add the no-leak response assertion**

For every error and progress response, assert serialized JSON does not match
`DATA_GO_KR_SERVICE_KEY|serviceKey|apis.data.go.kr|RTMSDataSvc|records|cache`.
Only a successful `finalize` response may contain the aggregate artifact and
operational report.

- [ ] **Step 4: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-summary-job-cache.test.ts apps/web/test/public-summary-job-handler.test.ts`

Expected: FAIL because the runner files do not exist.

- [ ] **Step 5: Implement the Preview-only POST handler**

Set `dynamic = 'force-dynamic'` and `maxDuration = 60`. Read the API key only
inside the route module. Parse exact JSON and use injected dependencies in
tests. Return `Cache-Control: private, no-store` and `X-Robots-Tag: noindex,
nofollow` on every response.

- [ ] **Step 6: Run handler, API security, lint, typecheck, and build gates**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-summary-job-cache.test.ts apps/web/test/public-summary-job-handler.test.ts apps/web/test/rent-check-api.test.ts && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary`

Expected: PASS.

- [ ] **Step 7: Commit Task 6**

```bash
git add v2/apps/web/lib/public-market/public-summary-job-cache.server.ts v2/apps/web/lib/public-market/job-handler.server.ts v2/apps/web/app/api/internal/public-summary-job/route.ts v2/apps/web/test/public-summary-job-cache.test.ts v2/apps/web/test/public-summary-job-handler.test.ts
git commit -m "feat(v2): add protected public summary preview runner"
```

---

### Task 7: Run the full local gate and generate the protected Preview artifact

**Files:**
- Create: `artifacts/public-p1/preview-summary-job.json`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: temporary runner deployment and the sensitive Preview API key.
- Produces: exact artifact JSON installed in Vercel Preview, exact period, digest-only operational evidence, and a fresh artifact-backed deployment.

- [ ] **Step 1: Run the complete pre-deploy gate**

```bash
cd v2
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:rent-client-boundary
pnpm exec playwright test --list
cd ..
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Push the exact runner SHA to the existing PR branch**

Push `HEAD` to `origin/codex/signedprice-seoul-rent-check-v2`. Record the SHA
and wait for both GitHub jobs and the signedprice Vercel Preview check to pass.

- [ ] **Step 3: Verify Preview key scope without printing the value**

Call one protected batch request. `configuration_missing` means stop and repair
Preview scope; `progress` or a source-category response proves the key is
present. Never copy the key into local files or tool output.

- [ ] **Step 4: Advance the batch cursor to 700**

Use authenticated browser execution against the protected Preview. POST the
returned `nextCursor` until `completedCoordinates === 700`. Retry only the same
cursor after `source_timeout` or `source_unavailable`; stop on
`source_malformed`, rights failure, or any cursor regression.

- [ ] **Step 5: Finalize and validate the artifact**

POST
`{"action":"finalize","referenceInstant":"2026-08-30T00:00:00.000Z"}`.
Re-run the production artifact parser locally against the returned aggregate,
verify the digest, the seven-month period, 700 coordinates, `deal:"jeonse"`,
`band:"45-55sqm"`, and the absence of sensitive markers.

- [ ] **Step 6: Save only sanitized operational evidence**

Write `artifacts/public-p1/preview-summary-job.json` by whitelisting these exact
fields from the finalization response and deployment metadata:

```ts
const evidence = {
  jobId: finalized.report.jobId,
  generatorSha: runnerSha,
  finalCandidateSha: null,
  artifactSha256: finalized.artifactSha256,
  generatedAt: finalized.artifact.generatedAt,
  period: finalized.artifact.provenance.period,
  expectedCoordinates: finalized.report.expectedCoordinates,
  completedCoordinates: finalized.report.completedCoordinates,
  eligibleRecords: finalized.report.eligibleRecords,
  activeRecords: finalized.report.activeRecords,
  unknownStatusRecords: finalized.report.unknownStatusRecords,
  newContracts: finalized.report.newContracts,
  renewalContracts: finalized.report.renewalContracts,
  unknownContracts: finalized.report.unknownContracts,
  parserVersion: finalized.artifact.provenance.parserVersion,
  rightsPolicyId: finalized.artifact.provenance.rightsPolicyId,
  generationDeploymentId,
};
```

Serialize `evidence` with two-space indentation. Never include the artifact
body, source rows, endpoints, cache keys, or API key.

- [ ] **Step 7: Install the two Preview environment values**

Using the authenticated Vercel dashboard, set the returned compact JSON as
`SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT` and its exact period as
`SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD`, scoped to Preview and all Preview branches.
Do not add either value to Production.

- [ ] **Step 8: Trigger a fresh exact-SHA Preview and verify `ready`**

Confirm the new deployment build logs emit only
`[signedprice:public-summary] ready` or no warning, and that `/kr/`,
`/kr/check/seoul/`, and `/kr/seoul/` return artifact-backed HTML rather than
fail-closed 404.

- [ ] **Step 9: Update the release gate and commit evidence**

Document the generator SHA, artifact digest, period, generated instant, and
deployment ID without values or source details.

```bash
git add artifacts/public-p1/preview-summary-job.json docs/operations/signedprice-public-p1-release-gate.md
git commit -m "docs(v2): record verified public summary preview evidence"
```

---

### Task 8: Remove the runner and close the final P1 Preview gate

**Files:**
- Delete: `v2/apps/web/app/api/internal/public-summary-job/route.ts`
- Delete: `v2/apps/web/lib/public-market/job-handler.server.ts`
- Delete: `v2/apps/web/lib/public-market/public-summary-job-cache.server.ts`
- Delete: `v2/apps/web/test/public-summary-job-handler.test.ts`
- Delete: `v2/apps/web/test/public-summary-job-cache.test.ts`
- Modify: `artifacts/public-p1/preview-summary-job.json`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: reviewed Preview artifact and environment values from Task 7.
- Produces: a final candidate with no execution surface and complete P1 evidence.

- [ ] **Step 1: Add a failing absence gate before cleanup**

Extend `v2/tests/rent-check-client-boundary.test.ts` or a focused release test
to assert no final built route or source file contains
`/api/internal/public-summary-job` and no app route imports
`runKoreaPublicSummaryBatch` or `finalizeKoreaPublicSummaryJob`.

- [ ] **Step 2: Run the absence test and confirm RED**

Run: `cd v2 && pnpm exec vitest run tests/rent-check-client-boundary.test.ts`

Expected: RED because the temporary runner is still present.

- [ ] **Step 3: Delete the temporary execution surface and adapter**

Delete only the five temporary files listed above. Keep the pure generator,
source store, artifact builder, tests, environment consumer, and operational
evidence.

- [ ] **Step 4: Re-run the absence test and confirm GREEN**

Run: `cd v2 && pnpm exec vitest run tests/rent-check-client-boundary.test.ts`

Expected: PASS.

- [ ] **Step 5: Run the final complete local gate**

```bash
cd v2
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:rent-client-boundary
pnpm e2e --project=desktop-chromium --project=mobile-chromium
cd ..
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 6: Commit runner removal**

```bash
git add -A v2/apps/web/app/api/internal/public-summary-job v2/apps/web/lib/public-market/job-handler.server.ts v2/apps/web/lib/public-market/public-summary-job-cache.server.ts v2/apps/web/test/public-summary-job-handler.test.ts v2/apps/web/test/public-summary-job-cache.test.ts v2/tests/rent-check-client-boundary.test.ts
git commit -m "chore(v2): remove public summary preview runner"
```

- [ ] **Step 7: Push and verify the final exact-SHA Preview**

Push the cleanup SHA to the existing PR branch. Require green GitHub verify,
browser, and signedprice Vercel checks. Confirm the deployment commit equals the
cleanup SHA and Vercel Authentication remains enabled.

- [ ] **Step 8: Run the final served-story checks**

Verify at desktop 1366×768 and mobile 390×844:

- all three Korea public routes render the same period, five-number jeonse
  summary, and sample count in initial HTML;
- quote input `380` represents KRW 380,000,000 and typing performs zero network
  requests;
- mobile controls are at least 44px, focus is visible, and there is no overflow;
- Preview protection blocks indexing; no Production promotion occurs;
- SG/AE public paths remain custom 404;
- the internal Rent Check remains `noindex, follow` and unlinked;
- client assets and logs contain no key, provider endpoint, raw record, cache
  content, rights evidence, or removed runner marker.

- [ ] **Step 9: Finalize the evidence report**

Set `finalCandidateSha` and the final deployment ID in
`artifacts/public-p1/preview-summary-job.json`, run `git diff --check`, commit the
two-field evidence update, and push one last exact-SHA Preview if the evidence
file is part of the candidate tree.

- [ ] **Step 10: Request final code and release review**

Review the diff from `056da5b` through final candidate for Critical, Important,
and Minor findings across summary math, source coverage, deduplication, rights,
cache isolation, artifact validation, UI semantics, accessibility, and release
boundaries. Fix Important-or-higher findings with new RED tests and repeat this
task's gates before declaring P1 complete.

---

## P2 continuation boundary

After Task 8 passes, start P2 in three independently approved and testable
subprojects, without reopening P1 semantics:

1. Explore and generated district detail surfaces;
2. Guide and evidence-backed News/content surfaces;
3. Compare, Budget, and Rankings computation surfaces.

Each subproject receives its own design spec, implementation plan, RED → GREEN
commits, browser gates, and protected Preview before the next begins. P3 auth,
saved checks, alerts, and history remain outside P2.
