# SignedPrice Entry, Graph, and Building Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shipped Seoul evidence visible from SignedPrice entry routes, replace the cramped distribution graph, and launch a verified district-to-neighborhood-to-building Explorer.

**Architecture:** Shared server-only Seoul snapshot models feed `/`, `/kr/`, and `/kr/seoul/`; a reusable HTML-annotation plot renders all evidence views; a v2 building artifact adds contract groups, neighborhoods, and verified coordinates; one client Explorer reducer owns URL-restorable district, neighborhood, building, pagination, and contract state. A temporary protected Preview job generates the real artifact and is deleted before the final candidate.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, NAVER Maps JavaScript API, MOLIT adapters, Vercel Runtime Cache, Vitest 4, Playwright 1.62, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-entry-graph-building-explorer-design.md`

## Global Constraints

- Preserve `main` at `a8e34e7` as the release baseline and make all work on `codex/signedprice-entry-building-explorer`.
- Do not change or redirect KoreaHomeGuide routes.
- Do not invent building names, coordinates, money, physical facts, Community responses, or News claims.
- New/Renewal/unknown counts remain visible and independently thresholded.
- Server provider keys, raw records, cache bodies, source IDs, and temporary job code must not enter client assets or the final route manifest.
- Use canvas `#f3f2f2`, ink `#201e1d`, cobalt `#1d4ed8`, square geometry, and 2px structural rules.
- Keep controls at least 44px and prevent horizontal overflow at 390, 720, 1366, and 1440px.
- Production promotion happens only after exact-SHA CI and Preview verification.

---

### Task 1: Shared Seoul Live Entry Model

**Files:**
- Create: `v2/apps/web/lib/public-market/seoul-live-model.server.ts`
- Create: `v2/apps/web/components/public-market/seoul-live.tsx`
- Create: `v2/apps/web/components/public-market/seoul-live.module.css`
- Modify: `v2/apps/web/app/page.tsx`
- Modify: `v2/apps/web/app/kr/page.tsx`
- Modify: `v2/apps/web/components/public-market/public-market-page.tsx`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Test: `v2/apps/web/test/seoul-live.test.tsx`
- Test: `v2/apps/web/test/home-content.test.ts`
- Test: `v2/apps/web/test/public-korea-routes.test.tsx`

**Interfaces:**
- Consumes: `PublicAreaSummaryRepository`, `buildContractCheckRouteModel()`, and current verified News/Guide routes.
- Produces: `buildSeoulLiveModel(): SeoulLiveModel` with `ready` and `unavailable` branches and `SeoulLive({ model, mode })` for `global | korea | seoul` composition.

- [ ] **Step 1: Write failing entry-route tests**

Require a ready model to expose `totalCount`, `newCount`, `renewalCount`, `unknownCount`, `period`, and links for Check, Explore, Rankings, News, and Guide. Require unavailable HTML to contain all links but no number formatted as a contract count or money.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/seoul-live.test.tsx apps/web/test/home-content.test.ts apps/web/test/public-korea-routes.test.tsx`

Expected: FAIL because the shared model and visible Seoul module do not exist and `/kr/` renders only Contract Check.

- [ ] **Step 3: Implement the server model and semantic module**

Read the installed area artifact once, use the `all`, `new`, and `renewal` city summaries plus unknown count, and return fixed route links. Catch only the public artifact boundary and produce `{ status: 'unavailable' }` without internal errors.

- [ ] **Step 4: Compose all three entry routes**

Add `Seoul live` to the global home after the main market browser. Recompose `/kr/` as a market hub whose first module is Contract Check and second module is the shared Seoul evidence navigation. Keep `/kr/seoul/` as the full overview and remove `Full product`/generic `Available` copy only where it overstates the installed dependency state.

- [ ] **Step 5: Run tests, lint, typecheck, and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/seoul-live.test.tsx apps/web/test/home-content.test.ts apps/web/test/public-korea-routes.test.tsx apps/web/test/public-section-tabs.test.tsx && pnpm lint && pnpm typecheck`

Commit: `feat(v2): expose Seoul live entry routes`

### Task 2: Collision-Safe Distribution Graph

**Files:**
- Modify: `v2/apps/web/components/public-market/box-plot.tsx`
- Modify: `v2/apps/web/components/public-market/public-market.module.css`
- Modify: `v2/apps/web/components/public-market/quote-input.tsx`
- Test: `v2/apps/web/test/public-market-components.test.tsx`
- Test: `v2/apps/web/test/public-quote-input.test.tsx`
- Create: `v2/apps/web/test/box-plot-layout.test.tsx`

**Interfaces:**
- Consumes: `PublicMarketSummary`, `QuotePositionAxis`, optional quote marker.
- Produces: HTML annotations identified by `data-plot-label=min|p25|median|p75|max|quote` and three collision lanes.

- [ ] **Step 1: Write failing semantic and layout tests**

Assert the five-column `<dl>` class is absent, all values remain in HTML, Median and quote have accent hooks, minimum/maximum use end-label hooks, P25/Median/P75 have different lane assignments when their positions are within eight percentage points, and withheld HTML contains no money.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/box-plot-layout.test.tsx apps/web/test/public-market-components.test.tsx apps/web/test/public-quote-input.test.tsx`

Expected: FAIL on the old five-cell `plotLabels` implementation.

- [ ] **Step 3: Implement deterministic annotation lanes**

Create a pure `assignPlotLanes(points)` helper. Sort P25/Median/P75 by position, place each in the first lane whose previous point is at least eight percentage points away, and cap at three lanes. Render the plot, absolute annotations, and a separate caption/evidence row.

- [ ] **Step 4: Add responsive CSS**

Use a minimum 180px plot canvas, clamped label transforms, end anchors for min/max, cobalt median/quote, and a mobile rule that shortens end labels while preserving their accessible text. Do not use SVG text or horizontal scrolling.

- [ ] **Step 5: Run focused tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/box-plot-layout.test.tsx apps/web/test/public-market-components.test.tsx apps/web/test/public-quote-input.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx && pnpm lint && pnpm typecheck`

Commit: `feat(v2): redesign evidence distribution graph`

### Task 3: Building Artifact v2 and Pure Generator

**Files:**
- Modify: `v2/apps/web/lib/public-market/building-summary-schema.ts`
- Modify: `v2/apps/web/lib/public-market/building-summary-repository.server.ts`
- Create: `v2/apps/web/lib/public-market/building-artifact-builder.server.ts`
- Create: `v2/packages/korea-rent/src/public-building-summary.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Test: `v2/apps/web/test/public-building-artifact.test.ts`
- Test: `v2/apps/web/test/public-building-route-model.test.ts`
- Create: `v2/apps/web/test/public-building-artifact-builder.test.ts`
- Create: `v2/packages/korea-rent/test/public-building-summary.test.ts`

**Interfaces:**
- Consumes: the complete seven-month MOLIT record cohort used by the area job and verified geocode results.
- Produces: strict `signedprice-public-building-summary-v2`, `buildKoreaPublicBuildingSummaries(records, geocodes)`, and `buildPublicBuildingArtifact(finalization)`.

- [ ] **Step 1: Write failing v2 schema tests**

Require exact record keys for neighborhood identity, nullable verified coordinates, `groups.all/new/renewal`, and `unknownContractCount`. Reject extra keys, out-of-Seoul coordinates, partial coordinate pairs, invalid group reconciliation, duplicate district/neighborhood/name identities, and digest mismatch.

- [ ] **Step 2: Run parser tests and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-building-artifact.test.ts`

Expected: FAIL because v1 has only `overall` and no neighborhood, coordinates, or contract groups.

- [ ] **Step 3: Write failing pure aggregation tests**

Use records containing new, renewal, unknown, cancelled, monthly-rent, outside-band, duplicate building-name spelling, and missing-geocode cases. Assert exact count reconciliation, independent five-record publication, stable slug IDs, deterministic ordering, and no marker coordinate for an unresolved geocode.

- [ ] **Step 4: Implement aggregation and artifact validation**

Normalize legal dong and official building name, aggregate jeonse 45–55㎡ records by district/dong/building, compute all three distributions directly, keep privacy-safe recent rows, join only verified Seoul geocodes, encode the canonical digest, and preserve a v1 read transition only for existing tests—not for the new Explorer marker model.

- [ ] **Step 5: Run package and app tests and commit**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-building-summary.test.ts apps/web/test/public-building-artifact.test.ts apps/web/test/public-building-artifact-builder.test.ts apps/web/test/public-building-route-model.test.ts && pnpm --filter @signedprice/korea-rent typecheck && pnpm --filter @signedprice/web typecheck`

Commit: `feat(v2): add verified building artifact v2`

### Task 4: Protected Preview Building Job

**Files:**
- Create temporarily: `v2/apps/web/lib/public-market/public-building-job-cache.server.ts`
- Create temporarily: `v2/apps/web/lib/public-market/public-building-job-handler.server.ts`
- Create temporarily: `v2/apps/web/app/api/internal/public-building-job/route.ts`
- Test temporarily: `v2/apps/web/test/public-building-job-handler.test.ts`
- Modify: `v2/scripts/scan-rent-check-client-boundary.mjs`
- Modify: `v2/tests/public-area-runner-absence.test.ts`
- Create: `artifacts/public-buildings/preview-building-job.json`

**Interfaces:**
- Consumes: server-only `DATA_GO_KR_SERVICE_KEY`, isolated Runtime Cache source-month records, and server-side geocoding.
- Produces: sanitized progress, final v2 artifact bytes, and non-secret generation evidence; all temporary source files are deleted before final release.

- [ ] **Step 1: Write failing authorization and sanitization tests**

Require Preview-only execution, POST, same-origin/admin token, bounded batch size, sanitized categorical progress, no provider key/raw row/cache body in JSON or logs, and an artifact download available only after all source coordinates and geocodes complete.

- [ ] **Step 2: Implement the isolated resumable job**

Reuse the public-summary cache namespace without mutating Rent Check keys, checkpoint deterministic source coordinates and geocode identities, make retries idempotent, and refuse finalization until every source coordinate is complete and each marker candidate is resolved or explicitly recorded unresolved.

- [ ] **Step 3: Deploy a protected Preview candidate and run to completion**

Record exact SHA, deployment ID, completed source coordinate count, eligible record count, building count, marker count, unresolved-geocode count, artifact SHA-256, and period in `artifacts/public-buildings/preview-building-job.json`. Do not store artifact contents or keys in git.

- [ ] **Step 4: Install the artifact in Preview and verify route models**

Set `SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT` only in Preview first, redeploy the exact candidate, and verify 25 district lists, New/Renewal reconciliation, marker bounds, and at least one shareable building route.

- [ ] **Step 5: Remove every temporary job file and commit**

Run: `cd v2 && pnpm exec vitest run tests/public-area-runner-absence.test.ts tests/rent-check-client-boundary.test.ts && pnpm check:rent-client-boundary && pnpm build`

Commit: `chore(v2): remove protected building generator`

### Task 5: District -> Neighborhood -> Building Explorer State

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/components/maps/naver-district-map.tsx`
- Create: `v2/apps/web/components/maps/naver-building-layer.ts`
- Create: `v2/apps/web/components/public-market/building-evidence-panel.tsx`
- Create: `v2/apps/web/components/public-market/building-evidence-panel.module.css`
- Test: `v2/apps/web/test/public-area-explorer-state.test.ts`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/apps/web/test/naver-district-map.test.tsx`
- Create: `v2/apps/web/test/building-evidence-panel.test.tsx`

**Interfaces:**
- Consumes: v2 building repository and current district geometry.
- Produces: `AreaExplorerState { level, selectedDistrict, selectedNeighborhood, selectedBuilding, visibleBuildingCount, contractGroup }`, validated query parsing, deterministic 10-row pagination, and marker/list selection callbacks.

- [ ] **Step 1: Write failing reducer and query tests**

Cover district selection, neighborhood selection, building open/close, `loadMore` increments of ten, contract changes, invalid query fallback, refresh restoration, and back from building to its neighborhood without resetting the map.

- [ ] **Step 2: Write failing render and map tests**

Require neighborhood controls, ten initial building rows, marker coordinates only from the v2 artifact, marker click opening `data-building-panel`, explicit full-detail navigation, All/New/Renewal evidence, and no invented physical facts.

- [ ] **Step 3: Implement the normalized Explorer model and reducer**

Build district neighborhoods and buildings server-side, sort neighborhoods by legal name and buildings by published sample descending then stable ID, validate every query value against the installed model, and use `router.replace(..., { scroll: false })` for selection state.

- [ ] **Step 4: Implement the NAVER building layer and panel**

Expose selected district/neighborhood/building callbacks instead of direct marker navigation. Reuse one map instance, replace only the active marker layer, fit bounds only on an explicit district/neighborhood transition, and preserve the user's viewport while a building panel is open.

- [ ] **Step 5: Implement responsive three-level composition**

Desktop: map plus bounded evidence rail. Mobile DOM: map, current selection/panel, neighborhood/building list. Keep every control 44px, use `aria-current`/`aria-expanded`, and avoid CSS reordering that differs from keyboard order.

- [ ] **Step 6: Run focused tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-explorer-state.test.ts apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx apps/web/test/building-evidence-panel.test.tsx apps/web/test/public-building-detail.test.tsx && pnpm lint && pnpm typecheck`

Commit: `feat(v2): add building-level Seoul Explorer`

### Task 6: Full Release Gate and Production Promotion

**Files:**
- Create: `v2/tests/e2e/signedprice-entry-building-explorer.spec.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/apps/web/lib/public-metadata.ts`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`
- Modify: `docs/operations/koreahomeguide-signedprice-migration-map.md`

**Interfaces:**
- Consumes: Tasks 1–5 and the installed exact-period artifacts.
- Produces: exact-SHA CI/Preview evidence, public route/indexing verification, and an explicit Production deployment while preserving KoreaHomeGuide.

- [ ] **Step 1: Add failing browser scenarios**

At 390/720/1366/1440 verify root -> Seoul live -> Explore, `/kr/` feature visibility, no overstated state copy, graph labels without intersection, district -> neighborhood -> building marker/list parity, ten-row pagination, query reload/back, All/New/Renewal counts, building detail navigation, 44px targets, no overflow, no console errors, and no 5xx.

- [ ] **Step 2: Run the complete local gate**

Run: `cd v2 && pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary && pnpm check:singapore-client-boundary && pnpm exec playwright test tests/e2e/signedprice-entry-building-explorer.spec.ts tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts && git diff --check`

- [ ] **Step 3: Verify exact-SHA protected Preview**

Check real root, Korea hub, Seoul overview, Explore, one district, one building, Rankings, News, Guide, sitemap, canonical/hreflang, runtime/build logs, mobile overflow, and both map provider success and fallback. Confirm the temporary internal job route is absent.

- [ ] **Step 4: Merge and promote the verified SHA to Production**

Promote only the SHA whose CI and Preview evidence passed. Verify `www.signedprice.com`, `/kr/`, `/kr/seoul/`, and one building journey after promotion. Confirm KoreaHomeGuide canonical/hreflang and production routes remain unchanged.

- [ ] **Step 5: Record final evidence and commit**

Update the release gate with PR number, merge SHA, Production deployment ID/state, artifact periods/digests, test totals, and observed runtime/5xx result.

Commit: `test(v2): gate SignedPrice building Explorer release`

