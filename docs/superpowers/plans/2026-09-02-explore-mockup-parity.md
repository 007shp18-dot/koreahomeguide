# Explore Mockup Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore SignedPrice Seoul Explore to the approved Korea Home Guide mockup interaction: one bounded 65/35 map workspace, in-place district/neighborhood selection, and a centered building evidence modal.

**Architecture:** Keep the current server-built `PublicAreaExploreModel`, evidence rules, NAVER map adapter, canonical Detail routes, and SEO table. Replace the client composition only: all discovery selection URLs target the canonical Explore query route, the primary workspace owns map and discovery rail state, and a focused modal presents the selected building while retaining an explicit canonical Detail link.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5.9.3, CSS Modules, Vitest 4.1.11, Playwright 1.62.1, pnpm 11.19.0.

**Spec:** `docs/superpowers/specs/2026-08-29-explorer-choropleth-modal-design.md`

## Global Constraints

- Preserve integer KRW, official evidence provenance, five-contract publication threshold, and fail-closed unavailable states.
- Preserve `/kr/seoul/explore/[district]/` and building Detail routes as crawlable SEO destinations, but do not use them for interactive district selection.
- Keep selection query state deterministic and restore it on refresh/back/forward.
- Keep English and Korean Explorer behavior equivalent.
- No new runtime dependency.
- Desktop primary workspace is approximately 65% map and 35% discovery rail; mobile is map plus bounded bottom sheet.
- All interactive targets remain at least 44px; modal supports close button, Escape, backdrop dismissal, focus containment/restoration, and body scroll lock.
- 390px viewport has no horizontal overflow.

---

### Task 1: In-place district and discovery URL contract

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**
- Consumes: `createSelectionHref(basePath, selection, defaults)` and current `KoreaExploreLinkSelection`.
- Produces: `createKoreaExploreDistrictSelectionHref(districtSlug, selection, locale): string`, always rooted at the localized canonical Explore route.

- [ ] **Step 1: Write the failing URL and browser tests**

  Assert that selecting `gangnam-gu` produces `/kr/seoul/explore/?district=gangnam-gu`, clears neighborhood/building descendants, retains transaction/evidence/proximity state, and leaves the browser on `/explore/` rather than `/explore/gangnam-gu/`.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx`

  Expected: FAIL because `createKoreaDistrictHref` currently returns the district Detail route.

- [ ] **Step 3: Implement the minimal in-place helper**

  Change the interactive district helper base path to `/kr/seoul/explore/`, serialize the chosen district, and clear `neighborhood`, `buildingId`, `q`, and `buildingPage`. Keep explicit district evidence links on the crawlable table pointed at `/kr/seoul/explore/[district]/` through a separate helper.

- [ ] **Step 4: Run focused tests and verify GREEN**

  Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/explorer-selection.test.ts`

- [ ] **Step 5: Commit**

  Commit message: `fix: keep Explore discovery on the map workspace`

### Task 2: Centered public building evidence modal

**Files:**
- Create: `v2/apps/web/components/public-market/area-building-dialog.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`

**Interfaces:**
- Consumes: `ExploreBuildingModel`, `ProductLocale`, canonical building Detail href, and the current selected building.
- Produces: `AreaBuildingDialog({ building, detailHref, locale, onClose }): ReactElement` with `role="dialog"`, `aria-modal="true"`, and `data-building-dialog=<buildingId>`.

- [ ] **Step 1: Write failing dialog rendering and accessibility tests**

  Assert that a URL-selected building renders a centered dialog containing building identity, transaction-specific median or the factual unavailable state, sample/period, proximity facts when available, and an explicit canonical Detail link. Assert the source contains Escape handling, focus containment/restoration, body scroll lock, and backdrop dismissal.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx`

  Expected: FAIL because the current selection is an inline card and no public-area dialog exists.

- [ ] **Step 3: Implement the dialog and connect row/marker selection**

  Render the dialog when `selectedBuilding` exists. Keep list rows as buttons that select and open the dialog, use the same callback for NAVER markers, keep `router.replace()` selection state, and close by removing only `buildingId` from the Explore URL. Keep the canonical Detail action inside the modal.

- [ ] **Step 4: Add modal geometry and reduced-motion CSS**

  Use a fixed backdrop, `width: min(1080px, calc(100% - 32px))`, `max-height: 88dvh`, internal body scrolling, sticky header/footer actions, and a mobile bottom-aligned presentation within the viewport.

- [ ] **Step 5: Run focused tests and verify GREEN**

  Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx`

- [ ] **Step 6: Commit**

  Commit message: `feat: open Explore building evidence in a modal`

### Task 3: Mockup-first 65/35 workspace composition

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**
- Consumes: current map, filters, district/neighborhood/building state, evidence coverage, and crawlable district table.
- Produces: one `data-explorer-layout="mockup-workspace"` primary region with map first in DOM and a bounded discovery rail second.

- [ ] **Step 1: Write failing composition and CSS contract tests**

  Assert there is no four-view switcher, the primary workspace is map plus one discovery rail, the map begins in the first viewport after a compact header/filter row, the rail has an internal scroll boundary, and the SEO table/source boundary remain below the workspace as secondary content.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx`

  Expected: FAIL because the current component exposes Split/List/Table/Map and three workspace columns.

- [ ] **Step 3: Recompose the primary workspace**

  Reduce the hero to a compact market header, place transaction/search/area/property controls in a compact toolbar, render map as the approximately 65% primary pane, and combine district/neighborhood/building discovery into the approximately 35% rail. Remove the primary inline selected-building panel and view switcher; retain Rankings and canonical district evidence as secondary links.

- [ ] **Step 4: Repair graph and evidence typography**

  Increase label line height and spacing, prevent percentile/median labels from touching, keep one clear primary number per block, and preserve all published/withheld semantics.

- [ ] **Step 5: Implement mobile bottom-sheet geometry**

  At `max-width: 720px`, render the map full width and the discovery rail below it with `max-height: 64dvh`, internal scrolling, 44px controls, and no horizontal overflow at 320px or 390px.

- [ ] **Step 6: Run focused tests and verify GREEN**

  Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/korea-proximity-explore.test.tsx apps/web/test/contract-check-evidence-navigation.test.tsx`

- [ ] **Step 7: Commit**

  Commit message: `feat: restore the mockup-first Explore workspace`

### Task 4: Browser flow, regression, and release evidence

**Files:**
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify only if a regression is reproduced: files owned by Tasks 1–3.

**Interfaces:**
- Consumes: the completed Explore workspace.
- Produces: browser evidence for desktop, 390px mobile, tablet, and wide viewports.

- [ ] **Step 1: Run the React quality review**

  Check component boundaries, hook dependencies, focus behavior, direct imports, serialized props, and avoid unnecessary memoization or new client data waterfalls.

- [ ] **Step 2: Run all static and unit gates**

  Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm check:rent-client-boundary && pnpm check:singapore-client-boundary && pnpm check:korea-proximity-client-boundary`

- [ ] **Step 3: Start the production server and perform the mandatory browser gut-check**

  Run the built app, then verify `/kr/seoul/explore/` loads meaningful content with no framework overlay or console errors before continuing.

- [ ] **Step 4: Run the focused browser scenarios**

  Run: `pnpm playwright test tests/e2e/area-explore.spec.ts`

  Verify district selection stays on the Explore route, neighborhood selection reveals buildings, row and marker selection open the same modal, canonical Detail remains available, Escape/backdrop/close work, focus returns, 390px has no horizontal overflow, and the map/rail workspace remains bounded.

- [ ] **Step 5: Run the full Chromium release gate**

  Run: `pnpm playwright test`

- [ ] **Step 6: Commit**

  Commit message: `test: lock Explore mockup interaction parity`

