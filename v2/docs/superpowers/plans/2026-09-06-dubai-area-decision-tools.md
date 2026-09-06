# Dubai Area Decision Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fast Dubai area comparison, indexable area evidence pages, and an area-backed price/yield Check without exposing raw DLD rows or implying property-level coverage.

**Architecture:** A deterministic offline builder converts the uploaded transaction and rent CSVs into a small validated aggregate snapshot. Server-only repository and route-model modules are the single publication gate for Explore, area pages, Check, metadata, and sitemap; the client receives aggregates only. Neon mirrors release and metric rows after branch verification, while the installed aggregate snapshot remains the fast public read path.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Node.js ESM builder scripts, Vitest, Neon Postgres 18.

**Spec:** `docs/superpowers/specs/2026-09-06-dubai-area-decision-tools-design.md`

## Global Constraints

- Preserve existing SignedPrice visual tokens, shared site chrome, and `MarketExploreShell` layout.
- Never call area evidence a property, building, unit, listing, or complete history.
- Never commit or serve raw Dubai CSV rows.
- Real aggregates stay local until the dataset licence permits commercial derived display and required attribution is recorded.
- `ACTUAL_AREA` is square metres; `TRANS_VALUE` is labelled AED only after the release record documents that currency decision.
- A public area needs at least 30 qualifying new-rent rows and at least 30 rows for at least one displayed sale stage; stage counts are never combined.
- Query-bearing Explore and Check URLs are `noindex, follow` and canonicalize to their base route.
- No new runtime dependency is added for CSV parsing.

---

### Task 1: Aggregate evidence contract and offline builder

**Files:**
- Create: `apps/web/lib/dubai/evidence-contract.ts`
- Create: `apps/web/scripts/build-dubai-area-evidence.mjs`
- Create: `apps/web/test/dubai-evidence-contract.test.ts`
- Create: `apps/web/test/dubai-area-evidence-builder.test.ts`

**Interfaces:**
- Produces `parseDubaiAreaEvidence(value: unknown): DubaiAreaEvidenceSnapshot`.
- Produces strict `buildDubaiAreaEvidence(...)` plus `buildDubaiAreaEvidenceBundle(...)` for a reviewable slug-registry proposal.
- The CLI always accepts `--transactions`, `--rents`, `--lands`, `--generated-at`, `--rights-record`, and `--slug-registry`; proposal mode adds `--slug-registry-output`, while artifact mode adds `--output`.

- [ ] **Step 1: Write failing contract tests**

```ts
expect(parseDubaiAreaEvidence(validSnapshot).version)
  .toBe('signedprice-dubai-area-evidence-v1');
expect(() => parseDubaiAreaEvidence({ ...validSnapshot, units: { area: 'sqft' } }))
  .toThrow('Dubai area evidence unavailable');
expect(parseDubaiAreaEvidence({ ...validSnapshot, rights: pendingRights }).rights.state)
  .toBe('pending');
```

- [ ] **Step 2: Run the contract test and verify missing-module failure**

Run: `pnpm vitest run apps/web/test/dubai-evidence-contract.test.ts`

Expected: FAIL because `evidence-contract.ts` does not exist.

- [ ] **Step 3: Implement the strict parser**

```ts
export type DubaiSaleStage = 'ready' | 'off-plan';
export type DubaiAreaEvidenceSnapshot = Readonly<{
  version: 'signedprice-dubai-area-evidence-v1';
  marketId: 'ae-dubai';
  generatedAt: string;
  periods: Readonly<{ sale: DateRange; rent: DateRange }>;
  units: Readonly<{ currency: 'AED'; area: 'sqm'; rentPeriod: 'year' }>;
  rights: DubaiEvidenceRights;
  publication: DubaiEvidencePublication;
  publicationMinimum: 30;
  totals: DubaiEvidenceTotals;
  areas: readonly DubaiAreaEvidence[];
}>;

export function parseDubaiAreaEvidence(value: unknown): DubaiAreaEvidenceSnapshot {
  return freezeValidatedSnapshot(value);
}
```

Validate exact enum values, finite positive metrics, ordered quartiles, unique IDs/slugs/aliases, distinct periods, stage counts, comparable IDs, canonical instants, 64-character digests, explicit pending/approved rights, and source totals. The runtime repository—not the shape parser—rejects pending rights.

- [ ] **Step 4: Run the contract test and verify pass**

Run: `pnpm vitest run apps/web/test/dubai-evidence-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing builder tests**

```ts
const snapshot = buildDubaiAreaEvidence({
  transactionsCsv: csvWithQuotedCommaAndNewline,
  rentsCsv: rentFixture,
  landsCsv: landFixture,
  generatedAt: '2026-09-06T00:00:00.000Z',
  rights: approvedRightsFixture,
});
expect(snapshot.areas[0]?.ready?.medianPriceAed).toBe(1_500_000);
expect(snapshot.areas[0]?.rent?.renewedShare).toBe(0.5);
expect(snapshot.areas[0]?.ready?.estimatedGrossYieldPct).toBe(6);
```

Also assert that mortgages, gifts, commercial rows, multi-unit rents, invalid stage labels, out-of-range values, and ambiguous aliases are excluded; duplicate rows remain in source and qualifying counts.

- [ ] **Step 6: Run the builder test and verify export failure**

Run: `pnpm vitest run apps/web/test/dubai-area-evidence-builder.test.ts`

Expected: FAIL because `buildDubaiAreaEvidence` is not implemented.

- [ ] **Step 7: Implement CSV parsing, filters, aggregation, and deterministic output**

```js
export function buildDubaiAreaEvidence(input) {
  const sales = qualifyingSales(parseCsv(input.transactionsCsv));
  const rents = qualifyingRents(parseCsv(input.rentsCsv));
  const identities = resolveAreaIdentities(sales, rents, input.landsCsv);
  return finalizeSnapshot({ sales, rents, identities, ...input });
}
```

The parser must handle UTF-8 BOM, CRLF/LF, escaped quotes, commas, and embedded newlines. Quantiles use a single documented interpolation rule. Canonical areas come from the Land export; transaction aliases require at least three distinct shared projects, 20 transaction rows, and 100% agreement after excluding projects that occur in multiple Land areas. Fuzzy matching is forbidden. A persisted slug registry keeps existing routes immutable and adds a suffix only for a new collision. Comparable areas use the same housing segment, available sale stage, and comparison period and are never labelled geographically nearby.

- [ ] **Step 8: Run builder and contract tests**

Run: `pnpm vitest run apps/web/test/dubai-area-evidence-builder.test.ts apps/web/test/dubai-evidence-contract.test.ts`

Expected: PASS.

- [ ] **Step 9: Build the real snapshot locally with pending publication**

Run:

```bash
node apps/web/scripts/build-dubai-area-evidence.mjs \
  --transactions /workspace/scratch/c6531e12b8d9/upload/03-transactions-2026-09-06-2-.csv \
  --rents /workspace/scratch/c6531e12b8d9/upload/01-rents-2026-09-06.csv \
  --lands /workspace/scratch/c6531e12b8d9/upload/02-lands-2026-09-06.csv \
  --generated-at 2026-09-06T00:00:00.000Z \
  --rights-record /workspace/scratch/dubai-rights.pending.json \
  --slug-registry /workspace/scratch/dubai-area-slugs.pending.json \
  --slug-registry-output /workspace/scratch/dubai-area-slugs.proposed.json

# Review the append-only proposal, then use it as the persisted input.
node apps/web/scripts/build-dubai-area-evidence.mjs \
  --transactions /workspace/scratch/c6531e12b8d9/upload/03-transactions-2026-09-06-2-.csv \
  --rents /workspace/scratch/c6531e12b8d9/upload/01-rents-2026-09-06.csv \
  --lands /workspace/scratch/c6531e12b8d9/upload/02-lands-2026-09-06.csv \
  --output /workspace/scratch/dubai-area-evidence.pending.json.gz \
  --generated-at 2026-09-06T00:00:00.000Z \
  --rights-record /workspace/scratch/dubai-rights.pending.json \
  --slug-registry /workspace/scratch/dubai-area-slugs.proposed.json
```

Expected: proposal mode writes no artifact. Artifact mode succeeds only when it adds no registry entry, and reports row counts, exclusion counts, alias method/version, periods, and digest. Both outputs stay outside Git while rights are pending.

- [ ] **Step 10: Commit the builder slice**

```bash
git add apps/web/lib/dubai/evidence-contract.ts apps/web/scripts/build-dubai-area-evidence.mjs apps/web/test/dubai-evidence-contract.test.ts apps/web/test/dubai-area-evidence-builder.test.ts
git commit -m "feat(dubai): build guarded area evidence"
```

---

### Task 2: Installed snapshot repository and route models

**Files:**
- Modify: `packages/market-core/src/snapshots.ts`
- Modify: `apps/web/lib/snapshots/installed-snapshot-repository.server.ts`
- Create: `apps/web/lib/dubai/evidence-repository.server.ts`
- Create: `apps/web/lib/dubai/route-types.ts`
- Create: `apps/web/lib/dubai/route-model.server.ts`
- Create: `apps/web/lib/dubai/check-model.ts`
- Create: `apps/web/test/dubai-evidence-repository.test.ts`
- Create: `apps/web/test/dubai-route-model.test.ts`
- Create: `apps/web/test/dubai-check-model.test.ts`

**Interfaces:**
- Consumes `DubaiAreaEvidenceSnapshot` from Task 1.
- Produces `DubaiEvidenceRepository` with `getContext`, `listAreas`, `getArea`, and `listAreaRouteParams`.
- Produces `buildDubaiExploreModel`, `buildDubaiAreaModel`, `buildDubaiCheckModel`, `calculateDubaiCheck`, and `createDubaiCheckHref`.

- [ ] **Step 1: Write failing repository tests**

```ts
const repository = await createDubaiEvidenceRepository({
  serialized: JSON.stringify(validSnapshot),
  expectedDigest: validSnapshot.digest,
});
expect(repository.listAreaRouteParams()).toEqual([{ area: 'business-bay' }]);
await expect(createDubaiEvidenceRepository({
  serialized: JSON.stringify(validSnapshot),
  expectedDigest: '0'.repeat(64),
})).rejects.toThrow('Dubai area evidence unavailable');
await expect(createDubaiEvidenceRepository({
  serialized: JSON.stringify({ ...validSnapshot, rights: pendingRights }),
  expectedDigest: pendingDigest,
})).rejects.toThrow('Dubai area evidence unavailable');
```

- [ ] **Step 2: Run repository tests and verify failure**

Run: `pnpm vitest run apps/web/test/dubai-evidence-repository.test.ts`

Expected: FAIL because the repository is missing.

- [ ] **Step 3: Extend installed snapshot support and implement repository**

Add market `ae-dubai`, dataset `ae-area-evidence`, and object URL `installed://ae-area-evidence`. Read `data/dubai-area-evidence.json.gz` only after the registry digest, schema, period, market, rights policy, record count, and embedded digest all agree.

- [ ] **Step 4: Run repository and existing installed-snapshot tests**

Run: `pnpm vitest run apps/web/test/dubai-evidence-repository.test.ts apps/web/test/installed-snapshot-repository.test.ts packages/market-core/test/markets.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing route-model and Check tests**

```ts
expect(buildDubaiExploreModel(repository)).toMatchObject({
  status: 'ready',
  areas: [expect.objectContaining({ href: '/ae/dubai/explore/business-bay/' })],
});
expect(calculateDubaiCheck({
  askingPriceAed: 1_500_000,
  areaSqm: 70,
  annualRentAed: 91_500,
  benchmark: area.ready!,
})).toMatchObject({ grossYieldPct: 6.1, verdict: 'above-middle-range' });
```

- [ ] **Step 6: Run route-model and Check tests and verify failure**

Run: `pnpm vitest run apps/web/test/dubai-route-model.test.ts apps/web/test/dubai-check-model.test.ts`

Expected: FAIL because the models are missing.

- [ ] **Step 7: Implement pure route and Check models**

```ts
export function calculateDubaiCheck(input: DubaiCheckInput): DubaiCheckResult {
  const askingPerSqm = input.askingPriceAed / input.areaSqm;
  return Object.freeze({
    askingPerSqm,
    priceDifferencePct: percentDifference(input.askingPriceAed, input.benchmark.medianPriceAed),
    perSqmDifferencePct: percentDifference(askingPerSqm, input.benchmark.medianPricePerSqmAed),
    grossYieldPct: round1(input.annualRentAed / input.askingPriceAed * 100),
    verdict: classifyMiddleHalf(askingPerSqm, input.benchmark.perSqmP25Aed, input.benchmark.perSqmP75Aed),
  });
}
```

Reject arrays, exponents, non-finite values, zero/negative amounts, unsafe slugs, unknown areas/stages, and values beyond defensive input bounds.

- [ ] **Step 8: Run repository/model tests**

Run: `pnpm vitest run apps/web/test/dubai-evidence-repository.test.ts apps/web/test/dubai-route-model.test.ts apps/web/test/dubai-check-model.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit the read-model slice**

```bash
git add packages/market-core/src/snapshots.ts apps/web/lib/snapshots/installed-snapshot-repository.server.ts apps/web/lib/dubai apps/web/test/dubai-evidence-repository.test.ts apps/web/test/dubai-route-model.test.ts apps/web/test/dubai-check-model.test.ts
git commit -m "feat(dubai): add guarded area read models"
```

---

### Task 3: Dubai Explore and area evidence pages

**Files:**
- Modify: `apps/web/components/dubai/dubai-explorer.tsx`
- Modify: `apps/web/components/dubai/dubai-research.module.css`
- Create: `apps/web/components/dubai/dubai-area-detail.tsx`
- Modify: `apps/web/app/(en)/ae/dubai/explore/page.tsx`
- Create: `apps/web/app/(en)/ae/dubai/explore/[area]/page.tsx`
- Modify: `apps/web/app/sitemap.ts`
- Modify: `apps/web/test/dubai-research.test.tsx`
- Create: `apps/web/test/dubai-area-routes.test.tsx`

**Interfaces:**
- Consumes `DubaiExploreModel` and `DubaiAreaModel` from Task 2.
- Produces query-backed Explore state and static area routes using one repository gate.

- [ ] **Step 1: Replace curated-only tests with failing aggregate Explore assertions**

```ts
const html = renderToStaticMarkup(<DubaiExplorer model={readyModel} browserKey={null} />);
expect(html).toContain('Ready');
expect(html).toContain('Off-Plan');
expect(html).toContain('Median annual rent');
expect(html).toContain('Estimated gross ratio');
expect(html).not.toContain('individual building');
```

Add filter-function tests for `AED 1.5M maximum`, `6% minimum`, stage switching, deferred search, pagination, and a zero-result state.

- [ ] **Step 2: Run Dubai research tests and verify failure**

Run: `pnpm vitest run apps/web/test/dubai-research.test.tsx`

Expected: FAIL because the component still receives curated constants.

- [ ] **Step 3: Implement aggregate Explore without changing the shell geometry**

Use `useDeferredValue`, memoized normalized search terms, 24 results per page, `history.replaceState`, semantic stage tabs, numeric select/input filters, area-level Google query markers, and detail links. Keep all large metric values in fixed-height rows with `font-variant-numeric: tabular-nums`, `min-width: 0`, and controlled wrapping.

- [ ] **Step 4: Run Explore tests**

Run: `pnpm vitest run apps/web/test/dubai-research.test.tsx apps/web/test/market-shell-contract.test.tsx apps/web/test/mobile-content-visibility.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing area-route tests**

```ts
expect(generateStaticParams()).toEqual([{ area: 'business-bay' }]);
expect((await generateMetadata({ params: Promise.resolve({ area: 'business-bay' }) })).title)
  .toContain('Business Bay apartment prices');
expect(renderToStaticMarkup(<DubaiAreaDetail model={areaModel} />))
  .toContain('Ready vs Off-Plan');
```

Also assert unknown/pending/insufficient areas fail closed, the page identifies separate sale/rent periods, and comparable links are not called nearby.

- [ ] **Step 6: Run area-route tests and verify failure**

Run: `pnpm vitest run apps/web/test/dubai-area-routes.test.tsx`

Expected: FAIL because the route and component do not exist.

- [ ] **Step 7: Implement area page, metadata, static params, and sitemap entries**

Metadata is composed from the model: apartment/villa, Ready/Off-Plan, and yield appear only when that evidence is published; the year comes from `asOfDate`. The page uses released metrics to write a short comparison sentence, shows both source periods, links to prefilled Check, and renders up to three same-cohort comparable areas. `generateStaticParams` and sitemap enumerate only repository route params.

- [ ] **Step 8: Run route and sitemap tests**

Run: `pnpm vitest run apps/web/test/dubai-area-routes.test.tsx apps/web/test/seo-platform-files.test.ts apps/web/test/public-route-contract.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit Explore and area pages**

```bash
git add apps/web/components/dubai apps/web/app/'(en)'/ae/dubai/explore apps/web/app/sitemap.ts apps/web/test/dubai-research.test.tsx apps/web/test/dubai-area-routes.test.tsx
git commit -m "feat(dubai): compare publishable areas"
```

---

### Task 4: Dubai Check and cross-page handoffs

**Files:**
- Create: `apps/web/components/dubai/dubai-check-workspace.tsx`
- Create: `apps/web/app/(en)/ae/dubai/check/page.tsx`
- Modify: `apps/web/components/dubai/dubai-overview.tsx`
- Modify: `apps/web/components/dubai/dubai-guide.tsx`
- Modify: `apps/web/components/price-market-search.tsx`
- Modify: `packages/market-core/src/market-capabilities.ts`
- Modify: `apps/web/lib/site-copy.ts`
- Create: `apps/web/test/dubai-check-workspace.test.tsx`
- Modify: `apps/web/test/dubai-research.test.tsx`
- Modify: `packages/market-core/test/market-capabilities.test.ts`
- Modify: affected navigation/home contract tests

**Interfaces:**
- Consumes Check parsing and calculation functions from Task 2.
- Produces `/ae/dubai/check/` and prefilled links from Explore/area/guide.

- [ ] **Step 1: Write failing Check UI and route tests**

```ts
const html = renderToStaticMarkup(<DubaiCheckWorkspace model={checkModel} initialState={validInput} />);
expect(html).toContain('AED 1,500,000');
expect(html).toContain('+17.2%');
expect(html).toContain('6.1%');
expect(html).toContain('Above the released middle range');
```

Assert required inputs, invalid/empty state, stage-specific benchmark, query round trip, query `noindex`, source period, disclaimer, and neutral calculator handoff.

- [ ] **Step 2: Run Check tests and verify failure**

Run: `pnpm vitest run apps/web/test/dubai-check-workspace.test.tsx`

Expected: FAIL because Check is not implemented.

- [ ] **Step 3: Implement the Check workspace and route**

Use controlled inputs and a pure parsed query state. Results appear only when all inputs are valid. The neutral calculator link is created with:

```ts
createPropertyScenarioHref({
  locale: 'en', market: 'ae-dubai', currency: 'AED',
  propertyName: area.name, price: askingPriceAed, areaSqm,
  transaction: 'sale', returnTo: currentCheckHref,
});
```

The verdict is based on asking AED/m² versus the released p25–p75 range, not a guessed recommendation.

- [ ] **Step 4: Run Check tests**

Run: `pnpm vitest run apps/web/test/dubai-check-workspace.test.tsx apps/web/test/property-scenario-context.test.ts apps/web/test/analytics-url-redaction.test.ts`

Expected: PASS.

- [ ] **Step 5: Update capabilities and discovery surfaces only after the rights gate**

Change Dubai Explore and Check to `limited`, link Prices to searchable Dubai areas, and replace rights-blocked home copy with the exact released periods and limitations. Keep property and transaction detail blocked because this release remains area-level. Do not expose Rankings or project detail.

- [ ] **Step 6: Run navigation and home regression tests**

Run: `pnpm vitest run packages/market-core/test/market-capabilities.test.ts apps/web/test/three-market-home-model.test.ts apps/web/test/home-layout.test.ts apps/web/test/market-overview-modernist.test.ts apps/web/test/global-roadmap-routes.test.tsx`

Expected: PASS with unchanged card geometry and updated Dubai capability wording.

- [ ] **Step 7: Commit Check and handoffs**

```bash
git add apps/web/components/dubai apps/web/app/'(en)'/ae/dubai/check apps/web/components/price-market-search.tsx apps/web/lib/site-copy.ts packages/market-core/src/market-capabilities.ts apps/web/test packages/market-core/test/market-capabilities.test.ts
git commit -m "feat(dubai): add area price and yield check"
```

---

### Task 5: Neon aggregate mirror and release verification

**Files:**
- Create: `apps/web/scripts/dubai-evidence-seed-source.mjs`
- Create: `apps/web/scripts/seed-dubai-evidence.mjs`
- Modify: `apps/web/package.json`
- Create: `apps/web/test/dubai-evidence-seed-source.test.ts`
- Create: `apps/web/test/dubai-evidence-seed-runner.test.ts`
- Modify: `docs/product/signedprice-product-roadmap.md`
- Create: `docs/operations/2026-09-06-dubai-area-evidence-release.md`

**Interfaces:**
- Consumes the approved installed aggregate snapshot.
- Produces idempotent geography, release, metric-definition, and metric-observation batches without raw source records.

- [ ] **Step 1: Write failing seed-source and runner tests**

```ts
expect(dubaiEvidenceSeedPage(snapshot, 0, 100)).toMatchObject({
  total: expect.any(Number),
  rows: [expect.objectContaining({ marketId: 'ae-dubai', subjectEntityId: null })],
});
await expect(runDubaiEvidenceSeed({ sql, snapshot })).resolves.toMatchObject({
  releaseRows: 2,
  rawSourceRecords: 0,
});
```

- [ ] **Step 2: Run seed tests and verify failure**

Run: `pnpm vitest run apps/web/test/dubai-evidence-seed-source.test.ts apps/web/test/dubai-evidence-seed-runner.test.ts`

Expected: FAIL because the seed source and runner are missing.

- [ ] **Step 3: Implement idempotent aggregate-only batches**

Upsert the rights record, two evidence releases, area geographies, six sale metrics per stage, four rent metrics, and sample counts. Do not insert `source_records`, `observations`, project entities, coordinates, or raw JSON. A verify-only mode compares counts, periods, digests, units, and publication state.

- [ ] **Step 4: Run seed tests**

Run: `pnpm vitest run apps/web/test/dubai-evidence-seed-source.test.ts apps/web/test/dubai-evidence-seed-runner.test.ts apps/web/test/property-evidence-seed-runner.test.ts`

Expected: PASS.

- [ ] **Step 5: Test on a temporary Neon branch after licence approval**

Create a branch from production, run `pnpm --filter @signedprice/web db:seed:dubai`, run verify-only, and query row counts grouped by release and metric. Expected database growth is aggregate-sized, not proportional to 465,617 source rows.

- [ ] **Step 6: Run full verification**

Run:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0; the build emits the base Dubai routes, every gated area route, and Dubai Check.

- [ ] **Step 7: Update roadmap and operations record**

Mark Tools shipped, record the Dubai aggregate periods/counts/digest/rights decision, distinguish area evidence from property evidence, and make project-detail acquisition the next Dubai data milestone.

- [ ] **Step 8: Commit the release slice**

```bash
git add apps/web/scripts apps/web/package.json apps/web/test docs/product/signedprice-product-roadmap.md docs/operations/2026-09-06-dubai-area-evidence-release.md
git commit -m "chore(dubai): mirror and document area evidence"
```

---

## Self-review

- Spec coverage: builder, rights, units, Explore, area SEO, Check, sitemap, database mirror, and roadmap closeout each have an implementation task.
- Placeholder scan: no task depends on an unspecified implementation or a later project.
- Type consistency: the snapshot contract is the only aggregate source; repository, route model, UI, sitemap, and seed all consume it.
- Scope boundary: automated news, project detail, accounts, saved comparisons, and raw-row display remain outside this plan.
