# SignedPrice Observed Building Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate every recently observed Seoul rental building from the smaller set of building-price cohorts that meet SignedPrice publication minimums.

**Architecture:** Introduce one canonical building-identity module consumed by both discovery and evidence aggregation. Derive a versioned observed-building inventory from the same complete 700-coordinate MOLIT rental cohort without applying transaction, area, or sample-size presentation filters; retain the existing five-contract evidence gate independently.

**Tech Stack:** TypeScript 5.9.3, Vitest 4.1.11, Next.js 16.3.3 server artifacts, Vercel Runtime Cache

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-unified-market-explorer-v2-design.md`

## Global Constraints

- Inventory means `Observed buildings` until a complete official building-stock source is installed.
- Cancelled records and records without both legal dong and building name do not create inventory identities.
- Apartment, officetel, villa/multifamily, and detached sources are supported.
- Pure jeonse, monthly rent, every positive area, and every completed source month contribute to observation counts.
- A thin cohort remains discoverable but publishes no price.
- Existing public building IDs remain stable for apartment, officetel, and villa records.
- Coordinates are verified or explicitly pending; they are never invented.
- No provider credentials or raw source records enter browser bundles.
- No new runtime dependency.

---

### Task 1: Canonical building identity

**Files:**
- Create: `v2/packages/korea-rent/src/building-identity.ts`
- Create: `v2/packages/korea-rent/test/building-identity.test.ts`
- Modify: `v2/packages/korea-rent/src/public-building-summary.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`

**Interfaces:**
- Produces: `buildKoreaBuildingIdentity(input): KoreaBuildingIdentity | null`.
- Produces: `KoreaBuildingHousingType` with `apartment | officetel | villa_multifamily | detached`.
- Consumed by: observed inventory and existing price evidence aggregation.

- [ ] **Step 1: Write failing identity tests**

Cover NFKC and whitespace normalization, stable IDs, villa mapping, detached support, and missing identity refusal. Assert that the existing apartment fixture retains its current `districtSlug-hash` ID.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm vitest run packages/korea-rent/test/building-identity.test.ts`

Expected: module and function are missing.

- [ ] **Step 3: Implement the identity module**

```ts
export type KoreaBuildingIdentity = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  buildingName: string;
  housingType: KoreaBuildingHousingType;
}>;

export function buildKoreaBuildingIdentity(input: Readonly<{
  districtSlug: SeoulDistrictSlug;
  legalDong?: string;
  buildingLabel?: string;
  sourceHousingType: SourceHousingType;
}>): KoreaBuildingIdentity | null;
```

Use the existing FNV-1a hash inputs exactly so current IDs remain stable.

- [ ] **Step 4: Refactor public building summaries to consume the identity**

Keep the current price artifact limited to apartment, officetel, and villa/multifamily. The refactor must not add detached price claims or change installed artifact IDs.

- [ ] **Step 5: Run focused and existing building tests**

Run: `pnpm vitest run packages/korea-rent/test/building-identity.test.ts packages/korea-rent/test/public-building-summary.test.ts`

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add v2/packages/korea-rent/src/building-identity.ts v2/packages/korea-rent/src/public-building-summary.ts v2/packages/korea-rent/src/index.ts v2/packages/korea-rent/test/building-identity.test.ts
git commit -m "refactor(korea): centralize building identity"
```

### Task 2: Observed-building derivation

**Files:**
- Create: `v2/packages/korea-rent/src/observed-building-inventory.ts`
- Create: `v2/packages/korea-rent/test/observed-building-inventory.test.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`

**Interfaces:**
- Consumes: `buildKoreaBuildingIdentity` and `KoreaPublicBuildingSourceRecord`-shaped district records.
- Produces: `buildKoreaObservedBuildingInventory(input): KoreaObservedBuildingInventory`.

```ts
type KoreaObservedBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: KoreaBuildingHousingType;
  observationCount: number;
  jeonseObservationCount: number;
  monthlyObservationCount: number;
  firstObservedMonth: string;
  lastObservedMonth: string;
  coordinate: KoreaObservedBuildingCoordinate;
}>;
```

- [ ] **Step 1: Write failing inventory tests**

Prove that one valid monthly-rent observation, a non-45–55㎡ observation, and a detached observation each create inventory rows; five-contract publication minimum is not applied; cancelled and missing-identity records are counted as exclusions; normalized duplicates reconcile to one identity.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm vitest run packages/korea-rent/test/observed-building-inventory.test.ts`

- [ ] **Step 3: Implement minimal derivation**

Return immutable records plus exact stats:

```ts
type KoreaObservedBuildingInventoryStats = Readonly<{
  sourceRecordCount: number;
  observedRecordCount: number;
  observedBuildingCount: number;
  cancelledRecordCount: number;
  missingIdentityRecordCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
}>;
```

Every unresolved row uses `{ state: 'pending', reason: 'coordinate_not_resolved' }`.

- [ ] **Step 4: Run the focused test and confirm pass**

Run: `pnpm vitest run packages/korea-rent/test/observed-building-inventory.test.ts`

- [ ] **Step 5: Commit**

```bash
git add v2/packages/korea-rent/src/observed-building-inventory.ts v2/packages/korea-rent/src/index.ts v2/packages/korea-rent/test/observed-building-inventory.test.ts
git commit -m "feat(korea): derive observed building inventory"
```

### Task 3: Complete-cohort inventory finalization

**Files:**
- Modify: `v2/packages/korea-rent/src/public-summary-job.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Modify: `v2/packages/korea-rent/test/public-summary-job.test.ts`

**Interfaces:**
- Consumes: the complete cached 700-coordinate source cohort.
- Produces: `finalizeKoreaObservedBuildingInventoryJob(input, dependencies)`.

- [ ] **Step 1: Write a failing complete-cohort test**

Seed all 700 coordinate manifests. Include a one-record monthly building, a large-area detached building, a published jeonse building, a cancelled row, and a missing-name row. Assert exact inventory and exclusion totals and that finalization refuses one missing manifest.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm vitest run packages/korea-rent/test/public-summary-job.test.ts`

- [ ] **Step 3: Implement finalization**

Reuse `loadPublicSummaryRecords`; do not fetch in finalization. Return the completed period, generated time, 700 completed coordinates, records, and stats.

- [ ] **Step 4: Run finalization tests and confirm pass**

Run: `pnpm vitest run packages/korea-rent/test/public-summary-job.test.ts`

- [ ] **Step 5: Commit**

```bash
git add v2/packages/korea-rent/src/public-summary-job.ts v2/packages/korea-rent/src/index.ts v2/packages/korea-rent/test/public-summary-job.test.ts
git commit -m "feat(korea): finalize observed inventory from complete cohort"
```

### Task 4: Versioned web artifact

**Files:**
- Create: `v2/apps/web/lib/public-market/observed-building-schema.ts`
- Create: `v2/apps/web/lib/public-market/observed-building-artifact-builder.server.ts`
- Create: `v2/apps/web/lib/public-market/observed-building-repository.server.ts`
- Create: `v2/apps/web/test/observed-building-artifact.test.ts`

**Interfaces:**
- Consumes: `KoreaObservedBuildingInventory`.
- Produces: strict `signedprice-observed-building-inventory-v1` artifact and fail-closed repository lookup.

- [ ] **Step 1: Write failing schema and artifact tests**

Cover strict keys, hash mismatch, duplicate IDs, invalid counts, invalid period, coordinate bounds, pending reasons, provenance, and `records.length === stats.observedBuildingCount`.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `pnpm vitest run apps/web/test/observed-building-artifact.test.ts`

- [ ] **Step 3: Implement schema, builder, and repository**

The repository reads `SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT` first and an installed artifact only after one exists. Invalid artifacts return unavailable and never fall back to the 294-price artifact while claiming broader coverage.

- [ ] **Step 4: Run focused tests and confirm pass**

Run: `pnpm vitest run apps/web/test/observed-building-artifact.test.ts`

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/lib/public-market/observed-building-schema.ts v2/apps/web/lib/public-market/observed-building-artifact-builder.server.ts v2/apps/web/lib/public-market/observed-building-repository.server.ts v2/apps/web/test/observed-building-artifact.test.ts
git commit -m "feat(web): add observed building artifact boundary"
```

### Task 5: Safe generator and installed artifact

**Files:**
- Create: `v2/apps/web/app/api/internal/observed-building-inventory/route.ts`
- Create: `v2/apps/web/lib/public-market/observed-building-job-handler.server.ts`
- Create: `v2/apps/web/test/observed-building-job-handler.test.ts`
- Create after verified generation: `v2/apps/web/data/observed-building-inventory.json`
- Modify: `v2/apps/web/lib/public-market/observed-building-repository.server.ts`

**Interfaces:**
- Consumes: Vercel Runtime Cache, `DATA_GO_KR_SERVICE_KEY`, and `SIGNEDPRICE_INTERNAL_JOB_TOKEN`.
- Produces: authenticated Preview-only batch/finalize responses and a reviewed installed artifact.

- [ ] **Step 1: Write failing route-handler tests**

Prove POST-only, bearer authentication, Preview-only execution, canonical cursor validation, batch progress, missing source key refusal, finalize refusal on incomplete coverage, and successful signed artifact output.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `pnpm vitest run apps/web/test/observed-building-job-handler.test.ts`

- [ ] **Step 3: Implement the protected handler and route**

The public response contains only progress diagnostics or the privacy-safe artifact. It never returns raw source records, provider messages, credentials, or cache keys.

- [ ] **Step 4: Run focused tests and confirm pass**

Run: `pnpm vitest run apps/web/test/observed-building-job-handler.test.ts`

- [ ] **Step 5: Deploy Preview and generate**

Configure a random Preview-only internal token without printing it. Attempt finalize from the existing verified cache. If coverage is incomplete, run bounded batches until all 700 coordinates are stored, then finalize.

- [ ] **Step 6: Audit the artifact before installation**

Verify source period, source completeness, unique identities, type/district totals, observation reconciliation, no raw source IDs, coordinate states, and that the count is labelled observed rather than complete stock.

- [ ] **Step 7: Install and verify**

Add the exact generated artifact, run focused tests, full tests, typecheck, lint, build, and browser checks. Remove or disable the Preview generator before the Production candidate unless continued operation has a separately approved need.

- [ ] **Step 8: Commit**

```bash
git add v2/apps/web/app/api/internal/observed-building-inventory/route.ts v2/apps/web/lib/public-market/observed-building-job-handler.server.ts v2/apps/web/lib/public-market/observed-building-repository.server.ts v2/apps/web/data/observed-building-inventory.json v2/apps/web/test/observed-building-job-handler.test.ts
git commit -m "feat(data): install observed Seoul building inventory"
```

### Task 6: Release verification

**Files:**
- Verify all files changed in Tasks 1–5.

**Interfaces:**
- Consumes: exact release candidate SHA.
- Produces: a deployable data-foundation release with no public claim regression.

- [ ] **Step 1: Run repository gates**

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` from `v2/`.

- [ ] **Step 2: Run safety scans**

Confirm the browser bundle contains no provider secret, raw source record, internal token, or server-only module.

- [ ] **Step 3: Preview verification**

Verify existing homepage, Explore, Detail, Rankings, and Check routes. The new artifact is not labelled complete stock; the existing 294 price artifact remains independently disclosed.

- [ ] **Step 4: Merge and Production verification**

Merge the exact reviewed SHA, confirm Vercel Production READY, then verify public routes and runtime errors.
