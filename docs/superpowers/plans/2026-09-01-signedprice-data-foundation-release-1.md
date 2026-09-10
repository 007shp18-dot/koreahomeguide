# SignedPrice Data Foundation Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a verified Seoul observed-building inventory independently from the smaller price-ready jeonse cohort, using one digest-verified snapshot registry and fail-closed server repository.

**Architecture:** Add a provider-neutral installed-snapshot contract in `@signedprice/market-core` and a server-only resolver in the web app that verifies registry metadata and payload digests before exposing a dataset repository. The existing MOLIT complete-cohort collector remains the raw-data boundary; its privacy-safe observed-building projection becomes the primary Explore discovery inventory, while the existing 294-building artifact remains an independent price-evidence overlay.

**Tech Stack:** TypeScript 5.9.3, Vitest 4.1.11, Next.js 16.3.3 App Router, React 19.2.8, Vercel Runtime Cache, Naver Maps

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-korea-singapore-data-foundation-design.md`

## Global Constraints

- This plan implements Release 1 only; Korea sale and complete rent evidence remain Release 2, and Singapore sale/rent remains Release 3.
- Browser traffic must not call MOLIT, BuildingHUB, or URA.
- The observed inventory is labelled `Observed buildings`, never complete building stock.
- Price publication remains independently gated at five eligible records in the exact cohort.
- Cancelled records and records without deterministic building identity remain excluded and reconciled in artifact statistics.
- Snapshot activation is fail-closed: a missing registry record, schema mismatch, digest mismatch, or period mismatch must not become zero buildings.
- The checked-in payload contains only the privacy-safe route projection; credentials, raw provider rows, cache keys, and provider error bodies remain server-only.
- Identity-only detail pages are `noindex, follow` and never substitute district averages for unavailable building evidence.
- No page may regress the `reading`, `standard`, or `workspace` width frames shipped in Release 0.

---

### Task 1: Shared installed-snapshot contract

**Files:**
- Create: `v2/packages/market-core/src/snapshots.ts`
- Create: `v2/packages/market-core/test/snapshots.test.ts`
- Modify: `v2/packages/market-core/src/index.ts`

**Interfaces:**
- Produces: `InstalledSnapshot`, `InstalledSnapshotRegistry`, `parseInstalledSnapshotRegistry(value)`.
- Produces: dataset identifiers `kr-building-registry | kr-sale | kr-rent | kr-conversion | sg-private-sale | sg-private-rent | sg-market-context`.
- Consumed by: the server-only snapshot repository in Task 2.

- [ ] **Step 1: Write failing registry tests**

Assert exact root and record keys, unique `(marketId,dataset)` pairs, canonical UTC `generatedAt`, valid completed period, non-empty versions and rights policy, safe non-negative record counts, a 64-character lowercase SHA-256, and an opaque `installed://` or HTTPS object URL. Assert that unknown keys, duplicate datasets, malformed periods, and invalid hashes fail.

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run: `pnpm vitest run packages/market-core/test/snapshots.test.ts`

Expected: FAIL because `../src/snapshots` does not exist.

- [ ] **Step 3: Implement the strict parser**

Expose this public shape:

```ts
export type InstalledSnapshot = Readonly<{
  marketId: 'kr-seoul' | 'sg-singapore';
  dataset: MarketDataset;
  schemaVersion: string;
  sourceVersion: string;
  parserVersion: string;
  rightsPolicyId: string;
  period: string;
  generatedAt: string;
  objectUrl: string;
  sha256: string;
  recordCount: number;
}>;

export type InstalledSnapshotRegistry = Readonly<{
  registryVersion: 'signedprice-installed-snapshots-v1';
  snapshots: readonly InstalledSnapshot[];
}>;

export function parseInstalledSnapshotRegistry(value: unknown): InstalledSnapshotRegistry;
```

- [ ] **Step 4: Run the focused test and verify pass**

Run: `pnpm vitest run packages/market-core/test/snapshots.test.ts`

- [ ] **Step 5: Commit the shared contract**

```bash
git add v2/packages/market-core/src/snapshots.ts v2/packages/market-core/src/index.ts v2/packages/market-core/test/snapshots.test.ts
git commit -m "feat(core): add verified snapshot registry contract"
```

### Task 2: Digest-verified server snapshot repository

**Files:**
- Create: `v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts`
- Create: `v2/apps/web/test/installed-snapshot-repository.test.ts`
- Modify: `v2/apps/web/lib/public-market/observed-building-repository.server.ts`

**Interfaces:**
- Consumes: `parseInstalledSnapshotRegistry`, a registry source, and an injected `resolveObject(objectUrl)` function.
- Produces: `createInstalledSnapshotRepository(input).get(marketId, dataset)`.
- Produces: `observedBuildingRepositoryFromEnvironment()` backed by an installed snapshot when no explicit test artifact is supplied.

- [ ] **Step 1: Write failing repository tests**

Use real payload objects and SHA-256. Prove that the repository returns a matching payload, rejects an absent dataset, rejects a digest mismatch, rejects a registry/payload record-count mismatch, rejects an unresolved object URL, and never falls back to the 294-building price artifact as an observed inventory.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm vitest run apps/web/test/installed-snapshot-repository.test.ts`

Expected: FAIL because the server repository does not exist.

- [ ] **Step 3: Implement the minimal repository**

Use `node:crypto` over canonical JSON. The returned value is:

```ts
type VerifiedInstalledSnapshot = Readonly<{
  metadata: InstalledSnapshot;
  payload: unknown;
}>;
```

The production resolver accepts only explicitly registered `installed://` objects. It does not fetch arbitrary URLs from a request.

- [ ] **Step 4: Connect the observed-building repository**

Preserve explicit test dependency injection. Production first reads the installed registry/object pair; the legacy `SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT` input is accepted only as a one-release migration alias and must still pass the same observed-building schema.

- [ ] **Step 5: Run repository and observed-artifact tests**

Run: `pnpm vitest run apps/web/test/installed-snapshot-repository.test.ts apps/web/test/observed-building-artifact.test.ts`

- [ ] **Step 6: Commit the server boundary**

```bash
git add v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts v2/apps/web/lib/public-market/observed-building-repository.server.ts v2/apps/web/test/installed-snapshot-repository.test.ts
git commit -m "feat(web): verify installed snapshot payloads"
```

### Task 3: Merge observed identity with independent price evidence

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/test/public-area-route-model.test.ts`
- Modify: `v2/apps/web/test/public-area-explorer-state.test.ts`

**Interfaces:**
- Consumes: the observed-building repository plus the existing public-building repository.
- Produces: Explore buildings with `evidenceStatus: 'published' | 'withheld' | 'unavailable'` and nullable price labels.
- Produces: coverage with independent `observed` and `priceReady` building counts.

- [ ] **Step 1: Write failing route-model tests**

Inject an observed artifact containing one price-ready building, one one-record monthly-rent building, and one large-area detached building. Inject price evidence only for the first building. Assert that all three appear in search, only one has published money, observation counts reconcile, and absence of the observed artifact returns an explicit `not_loaded` state without changing the known price-ready count.

- [ ] **Step 2: Run the focused test and verify the expected assertions fail**

Run: `pnpm vitest run apps/web/test/public-area-route-model.test.ts`

- [ ] **Step 3: Implement the merge**

Build the discovery list from observed records. Overlay exact `buildingId` price evidence only when the district and identity also match. Never create an observed identity from a price summary during the ready path. Keep the current price-ready fallback only when the observed snapshot is unavailable and label it accordingly.

- [ ] **Step 4: Write and run failing state tests for nullable evidence**

Assert that district, dong, building name, housing type, `jeonse`, and `monthly` search tokens can find observed identities, while monetary labels are never required for filtering or selection.

Run: `pnpm vitest run apps/web/test/public-area-explorer-state.test.ts`

- [ ] **Step 5: Implement the state changes and verify both focused suites**

Run: `pnpm vitest run apps/web/test/public-area-route-model.test.ts apps/web/test/public-area-explorer-state.test.ts`

- [ ] **Step 6: Commit the merged route model**

```bash
git add v2/apps/web/lib/public-market/area-route-types.ts v2/apps/web/lib/public-market/area-route-model.server.ts v2/apps/web/lib/public-market/area-explorer-state.ts v2/apps/web/test/public-area-route-model.test.ts v2/apps/web/test/public-area-explorer-state.test.ts
git commit -m "feat(explore): separate building discovery from price evidence"
```

### Task 4: Publish the observed-building Explore states

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/lib/locale/product-copy.ts`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/explorer-ui-contract.test.ts`

**Interfaces:**
- Consumes: the merged `PublicAreaExploreModel` from Task 3.
- Produces: one searchable building rail with explicit observed, price-published, and evidence-unavailable states.

- [ ] **Step 1: Write failing component tests**

Assert that the toolbar shows `Observed buildings` and `Price-ready` separately, identity-only cards do not render a median, monthly observation availability is visible without implying a monthly price, published cards retain their detail action, and unavailable snapshots display the previous price-ready boundary rather than `0`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/explorer-ui-contract.test.ts`

- [ ] **Step 3: Implement the compact UI states**

Retain the `workspace` frame and existing Naver map geometry. Cards use the same row height and divider tokens; identity-only rows show observation period and evidence status where the price column previously assumed money. Transaction buttons for sale and monthly price evidence remain unavailable until Release 2.

- [ ] **Step 4: Run component tests and verify pass**

Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/explorer-ui-contract.test.ts`

- [ ] **Step 5: Commit the Explore UI**

```bash
git add v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/lib/locale/product-copy.ts v2/apps/web/test/public-area-explorer.test.tsx v2/apps/web/test/explorer-ui-contract.test.ts
git commit -m "feat(explore): show observed building availability"
```

### Task 5: Identity-only building detail route

**Files:**
- Create: `v2/apps/web/lib/public-market/observed-building-route-model.server.ts`
- Create: `v2/apps/web/components/public-market/observed-building-detail.tsx`
- Modify: `v2/apps/web/app/(en)/kr/seoul/explore/[district]/[buildingId]/page.tsx`
- Modify: `v2/apps/web/test/public-building-route-model.test.ts`
- Create: `v2/apps/web/test/observed-building-detail.test.tsx`

**Interfaces:**
- Produces: `buildObservedBuildingIdentityModel(districtSlug, buildingId)`.
- Produces: a detail state that shows official observed identity and explicit current-cohort price unavailability without a district-average substitute.

- [ ] **Step 1: Write failing identity-route tests**

Assert deterministic district/id lookup, wrong-district rejection, observation breakdown, source period, pending-coordinate disclosure, and `null` when the observed artifact is unavailable.

- [ ] **Step 2: Run the focused route test and verify failure**

Run: `pnpm vitest run apps/web/test/public-building-route-model.test.ts`

- [ ] **Step 3: Implement the server route model**

The model contains identity, housing type, first/last observed month, total/jeonse/monthly observation counts, coordinate state, source, period, and a fixed no-substitution evidence message.

- [ ] **Step 4: Write failing component and metadata tests**

Assert `noindex, follow`, the title and location identity, price unavailable copy, and a link back to Explore. Published price-ready buildings must continue through the existing `BuildingDetailPage` path.

- [ ] **Step 5: Implement the component and route fallback**

Set `dynamicParams = true`, keep current static parameters for price-ready routes, and resolve identity-only records server-side after the price-ready model returns `null`.

- [ ] **Step 6: Run focused building suites**

Run: `pnpm vitest run apps/web/test/public-building-route-model.test.ts apps/web/test/observed-building-detail.test.tsx apps/web/test/public-building-detail.test.tsx`

- [ ] **Step 7: Commit identity-only detail support**

```bash
git add 'v2/apps/web/app/(en)/kr/seoul/explore/[district]/[buildingId]/page.tsx' v2/apps/web/lib/public-market/observed-building-route-model.server.ts v2/apps/web/components/public-market/observed-building-detail.tsx v2/apps/web/test/public-building-route-model.test.ts v2/apps/web/test/observed-building-detail.test.tsx
git commit -m "feat(detail): add observed identity-only building state"
```

### Task 6: Generate, audit, and install the Production projection

**Files:**
- Create after successful generation: `v2/apps/web/data/observed-building-inventory.json`
- Create after successful generation: `v2/apps/web/data/installed-snapshots.json`
- Modify: `v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts`
- Modify: `v2/apps/web/test/installed-snapshot-repository.test.ts`
- Modify: `v2/apps/web/test/observed-building-artifact.test.ts`

**Interfaces:**
- Consumes: the existing protected Preview collector, complete 700-coordinate cached cohort, and the canonical Korean public-data credential.
- Produces: one reviewed `signedprice-observed-building-inventory-v1` file plus a digest-matching registry entry.

- [ ] **Step 1: Verify the deployment configuration without exposing secrets**

Confirm Preview has the Korean public-data service credential and an internal job token. If the credential is absent, stop and report the exact blocker; do not fabricate an artifact from the 294 price-ready buildings.

- [ ] **Step 2: Generate from the complete source cohort**

Deploy the exact branch SHA to Preview. Run bounded batch calls until all 700 coordinates are complete, then call finalize. Keep bearer tokens and raw responses out of console output and committed files.

- [ ] **Step 3: Audit the generated projection**

Verify exact source/observed/excluded reconciliation, unique building IDs, 25 district coverage, housing-type totals, observation-type totals, period bounds, coordinate bounds, and absence of source credentials, raw record IDs, unit numbers, names of people, and provider error bodies.

- [ ] **Step 4: Write the artifact and registry entry**

The registry entry uses dataset `kr-building-registry`, schema version `signedprice-observed-building-inventory-v1`, the artifact's actual period/generated time/count, object URL `installed://kr-building-registry`, and the canonical JSON digest of the checked-in payload.

- [ ] **Step 5: Run installed artifact tests**

Run: `pnpm vitest run apps/web/test/installed-snapshot-repository.test.ts apps/web/test/observed-building-artifact.test.ts apps/web/test/public-area-route-model.test.ts`

- [ ] **Step 6: Commit the reviewed projection**

```bash
git add v2/apps/web/data/observed-building-inventory.json v2/apps/web/data/installed-snapshots.json v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts v2/apps/web/test/installed-snapshot-repository.test.ts v2/apps/web/test/observed-building-artifact.test.ts
git commit -m "feat(data): install observed Seoul building snapshot"
```

### Task 7: Full verification, review, and Production promotion

**Files:**
- Verify all files changed in Tasks 1–6.

**Interfaces:**
- Consumes: the exact release candidate SHA.
- Produces: a reviewed and reversible Production release.

- [ ] **Step 1: Run all repository gates**

Run from `v2/`: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:rent-client-boundary`, and `pnpm check:singapore-client-boundary`.

- [ ] **Step 2: Run secret and source-boundary scans**

Search the source and built client output for the Korean service key names, internal job token, URA key values, authorization headers, and server-only snapshot modules. Confirm that only public variable names or redacted documentation remain.

- [ ] **Step 3: Run browser verification**

Verify `/kr/seoul/explore/`, one price-ready building, one identity-only building, `/kr/seoul/rankings/`, and `/kr/seoul/check/` at 390, 720, 1366, and 1440 pixels. Confirm no horizontal overflow, no runtime errors, keyboard-visible selection, Naver success/fallback behavior, and stable back/forward state.

- [ ] **Step 4: Review the exact diff**

Compare the branch to `origin/main`, verify that unrelated user files are untouched, and run the Release 1 acceptance checklist against the approved spec.

- [ ] **Step 5: Push, open a PR, and promote the reviewed SHA**

Push the branch, open a PR against `main`, wait for required checks, merge the exact reviewed commit, and deploy that saved source state to Production. Record the rollback target as Production commit `14585a8` until the new release is healthy.

- [ ] **Step 6: Verify Production**

Confirm the Production deployment SHA, health status, live routes, observed and price-ready counts, identity-only `noindex`, no browser runtime errors, and the prior price-ready building behavior. Roll back if any verification fails.
