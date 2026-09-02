# SignedPrice Check, Korea Data, and Building Map Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate Contract Check from a verified installed conversion artifact, render Naver building markers for coordinate-pending visible buildings, and install the complete verified Korea rent/sale artifacts through a temporary bounded Production export.

**Architecture:** Checked-in gzip artifacts remain the only public data activation boundary. Contract Check will resolve `kr-conversion` through the same digest/schema/identity-verified installed snapshot repository used by Explore, with environment variables retained only as a compatibility fallback. The existing Naver client map will geocode only the currently visible coordinate-pending buildings from district, legal-dong, and official-name queries; list and detail navigation remain independent of map success. Collection uses the previously reviewed Production-only, fixed-cursor bridge, then the bridge is removed after artifact installation.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, Vitest, pnpm 11.19.0, Vercel Functions/Runtime Cache, Naver Maps JavaScript API.

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-unified-market-explorer-v2-design.md`

## Global Constraints

- No new runtime dependency.
- Money remains integer KRW and area remains square metres internally.
- Internal links end in `/` in source.
- A price distribution requires at least five eligible contracts in its exact segment.
- A thin segment hides only its price statistics; it does not delete the building identity.
- No invented coordinates, photographs, building facts, prices, yields, forecasts, or provider rights.
- Map or coordinate failure affects only the map layer; the result rail and Detail link remain usable.
- Checked-in artifact digest, schema, market, period, and record count must verify before activation.
- The temporary collection bridge is Production-only, fixed to canonical cursors below 700, and removed after export.

---

### Task 1: Installed conversion artifact support

**Files:**
- Modify: `v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts`
- Test: `v2/apps/web/test/installed-snapshot-repository.test.ts`

**Interfaces:**
- Consumes: `installed://kr-conversion` registry entries whose payload is a Korea conversion artifact.
- Produces: `resolveInstalledSnapshotObject('installed://kr-conversion')` and `createInstalledSnapshotRepository(...).get('kr-seoul', 'kr-conversion')` with `recordCount` derived from `payload.totals.eligiblePairCount`.

- [ ] **Step 1: Write the failing resolver and identity tests**

Add a conversion fixture with `artifactVersion: 1`, `provenance.marketId`, `provenance.period`, `provenance.sha256`, `totals.eligiblePairCount`, and two curves. Assert that a checked-in conversion object URL resolves and that a repository accepts its literal pair count while rejecting a mismatched registry count.

- [ ] **Step 2: Run the focused test and observe the intended failure**

Run from `v2/`: `pnpm exec vitest run apps/web/test/installed-snapshot-repository.test.ts`

Expected: FAIL because `installed://kr-conversion` is unresolved and conversion payload identity has no record count.

- [ ] **Step 3: Implement the minimal resolver and identity branch**

Add a cached conversion artifact reader with the same two working-directory candidates as rent and sale. Extend `snapshotIdentity` so an object with `totals.eligiblePairCount` reports that safe integer as its record count; do not accept a missing, negative, or non-integer count.

- [ ] **Step 4: Run the focused test**

Run from `v2/`: `pnpm exec vitest run apps/web/test/installed-snapshot-repository.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts v2/apps/web/test/installed-snapshot-repository.test.ts
git commit -m "feat: resolve installed conversion snapshots"
```

### Task 2: Contract Check installed-data activation

**Files:**
- Modify: `v2/apps/web/lib/contract-check/route-model.server.ts`
- Test: `v2/apps/web/test/contract-check-route-model.test.ts`

**Interfaces:**
- Consumes: `resolveInstalledSnapshotRegistry()`, `resolveInstalledSnapshotObject()`, and an optional injected installed snapshot repository for deterministic tests.
- Produces: `buildContractCheckRouteModel()` that prefers a verified `kr-conversion` snapshot, derives the conversion parser expectation from the payload provenance, and falls back to the existing serialized environment contract.

- [ ] **Step 1: Write the failing installed-artifact route test**

Create a real `createInstalledSnapshotRepository` around the literal valid conversion fixture and a matching registry digest. Call `buildContractCheckRouteModel` with empty environment dependencies plus that repository and assert `status: 'ready'`, both housing curves, and the completed period.

- [ ] **Step 2: Run the focused test and observe the intended failure**

Run from `v2/`: `pnpm exec vitest run apps/web/test/contract-check-route-model.test.ts`

Expected: FAIL because the route model only consumes serialized environment evidence.

- [ ] **Step 3: Implement installed-first, environment-fallback dependencies**

Keep the public route model synchronous. Load the installed repository at module scope through existing checked-in resolvers, extract only exact `provenance.period` and `provenance.sha256` strings from the verified payload, and pass the payload to `createConversionRepository`. If snapshot lookup or provenance extraction fails, use the current environment fields and preserve the claim-free unavailable state.

- [ ] **Step 4: Run route and repository tests**

Run from `v2/`: `pnpm exec vitest run apps/web/test/contract-check-route-model.test.ts apps/web/test/contract-check-repository.test.ts apps/web/test/installed-snapshot-repository.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/lib/contract-check/route-model.server.ts v2/apps/web/test/contract-check-route-model.test.ts
git commit -m "feat: activate check from installed conversion data"
```

### Task 3: Coordinate-pending Naver building markers

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Verify: `v2/apps/web/test/naver-district-map.test.tsx`

**Interfaces:**
- Consumes: `naverMapClientId`, selected district name, building legal-dong, official building name, and nullable verified coordinates.
- Produces: `NaverDistrictMap` building props where `allowAddressGeocoding` is true only when the map client is configured and both coordinates are null.

- [ ] **Step 1: Write the failing rendered-props test**

Render the real public Explore page with a configured Naver client and a coordinate-pending building. Assert the server/client markup requests `submodules=geocoder`; render without the Naver client and assert no script URL or invented coordinate appears.

- [ ] **Step 2: Run the focused test and observe the intended failure**

Run from `v2/`: `pnpm exec vitest run apps/web/test/public-area-explorer.test.tsx`

Expected: FAIL because `mapBuildings` omits `allowAddressGeocoding`.

- [ ] **Step 3: Enable bounded visible-building geocoding**

Add `allowAddressGeocoding: naverMapClientId !== null && building.latitude === null && building.longitude === null` to each visible map building. Preserve the normalized query `서울특별시 <구> <동> <건물명>`, the current ten-item initial cap, map failure copy, and result/detail behavior.

- [ ] **Step 4: Run map tests**

Run from `v2/`: `pnpm exec vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx`

Expected: PASS, including SDK success, failure, stale-callback, and no-key branches.

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/test/public-area-explorer.test.tsx
git commit -m "feat: geocode visible Explore buildings on Naver"
```

### Task 4: Temporary bounded Korea artifact export

**Files:**
- Modify: `v2/apps/web/app/api/internal/korea-rent-snapshot/route.ts`
- Modify: `v2/apps/web/app/api/internal/korea-sale-snapshot/route.ts`
- Modify: `v2/apps/web/lib/public-market/korea-rent-job-handler.server.ts`
- Modify: `v2/apps/web/lib/public-market/korea-sale-job-handler.server.ts`
- Modify: `v2/apps/web/lib/public-market/snapshot-public-export.server.ts`
- Test: `v2/apps/web/test/korea-rent-job-handler.test.ts`
- Test: `v2/apps/web/test/korea-sale-job-handler.test.ts`

**Interfaces:**
- Consumes: Production `DATA_GO_KR_SERVICE_KEY`, fixed `referenceInstant`, Vercel Runtime Cache, and canonical cursor values `0,4,...,696`.
- Produces: privacy-safe progress, manifest metadata, and bounded gzip+base64 chunks for `kr-rent`, `kr-building-registry`, `kr-conversion`, and `kr-sale`.

- [ ] **Step 1: Restore the already-reviewed bridge and tests from commit `e2744c2`**

Reapply only the seven-file delta that adds `allowCollection`, Production-only fixed-plan `export=collect&cursor=...`, and the matching handler tests. Do not restore Preview exposure or any arbitrary request-body proxy.

- [ ] **Step 2: Run handler security tests**

Run from `v2/`: `pnpm exec vitest run apps/web/test/korea-rent-job-handler.test.ts apps/web/test/korea-sale-job-handler.test.ts`

Expected: PASS; local/Preview collection remains absent, non-multiple-of-four and out-of-range cursors return 400, POST returns 405, and secrets never appear in responses.

- [ ] **Step 3: Commit and deploy the exact bridge SHA**

```bash
git add v2/apps/web/app/api/internal v2/apps/web/lib/public-market v2/apps/web/test/korea-rent-job-handler.test.ts v2/apps/web/test/korea-sale-job-handler.test.ts
git commit -m "chore: restore bounded Korea artifact export"
```

- [ ] **Step 4: Verify Production configuration without exposing secrets**

Request rent and sale `export=collect&cursor=0` on the exact deployment. A 200 progress response proves the Production function sees the service key; `503 configuration_missing` stops the run and identifies Vercel scope/redeploy as the blocker without logging or returning the key.

- [ ] **Step 5: Complete and export both fixed plans**

Request canonical cursors in order through 696, retrying only the current cursor after transient 503. Finalize each manifest, verify `completedCoordinates: 700`, fetch every declared artifact chunk, gunzip, parse, and verify the declared SHA-256 and record count before writing any artifact.

### Task 5: Install and consume the verified artifacts

**Files:**
- Create: `v2/apps/web/data/korea-rent-evidence.json.gz`
- Create: `v2/apps/web/data/korea-sale-evidence.json.gz`
- Create: `v2/apps/web/data/korea-conversion-evidence.json.gz`
- Modify: `v2/apps/web/data/observed-building-inventory.json.gz`
- Modify: `v2/apps/web/data/installed-snapshots.json`
- Test: `v2/apps/web/test/installed-snapshot-repository.test.ts`
- Test: `v2/apps/web/test/public-korea-routes.test.tsx`

**Interfaces:**
- Consumes: locally verified exported payloads and manifest metadata.
- Produces: four active `kr-seoul` registry rows with canonical JSON object digests and payload identities matching schema, market, period, and record count.

- [ ] **Step 1: Add registry rows using hand-verified metadata**

Use `installed://kr-rent`, `installed://kr-sale`, `installed://kr-conversion`, and `installed://kr-building-registry`. The registry `sha256` is the canonical payload-object digest; the conversion payload's `provenance.sha256` remains its source-record digest and is not substituted for the object digest.

- [ ] **Step 2: Run repository and public-route integration tests**

Run from `v2/`: `pnpm exec vitest run apps/web/test/installed-snapshot-repository.test.ts apps/web/test/public-korea-routes.test.tsx apps/web/test/contract-check-route-model.test.ts`

Expected: PASS; Explore enables monthly rent and sale from their own artifacts, and Check enables both conversion curves.

- [ ] **Step 3: Commit artifacts and registry**

```bash
git add v2/apps/web/data v2/apps/web/test
git commit -m "data: install complete Korea market snapshots"
```

### Task 6: Remove the bridge and verify the release

**Files:**
- Revert the temporary collection-only portions of the seven Task 4 files.

**Interfaces:**
- Consumes: installed checked-in artifacts.
- Produces: Production routes that allow only fixed manifest/artifact reads, with collection no longer reachable.

- [ ] **Step 1: Remove `allowCollection` and the collect branch**

Retain the installed artifact consumers and all Check/map changes. Restore tests that require Production-only read exports and reject `export=collect`.

- [ ] **Step 2: Run all quality gates**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 3: Run browser verification**

At 390, 720, 1366, and 1440 pixels verify: Check is ready; Explore transaction links enable 전세/월세/매매; all 25 districts and full area filters remain available; a coordinate-pending visible building produces a Naver marker or an isolated factual map failure; result rows and detail links remain usable in both cases; there is no horizontal overflow at 390 pixels.

- [ ] **Step 4: Verify exact-SHA Preview, promote, and recheck Production**

Confirm the signedprice Vercel project—not KoreaHomeGuide—built the exact reviewed SHA. After promotion, verify `https://www.signedprice.com/kr/seoul/check/`, `https://www.signedprice.com/kr/seoul/explore/`, transaction query states, map SDK loading, and runtime logs without exposing provider credentials.

- [ ] **Step 5: Commit bridge removal**

```bash
git add v2/apps/web/app/api/internal v2/apps/web/lib/public-market v2/apps/web/test
git commit -m "chore: remove Korea collection bridge"
```
