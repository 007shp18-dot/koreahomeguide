# SignedPrice Seoul UI Handoff Implementation Plan

> **PAUSED 2026-08-31:** The user confirmed that New/Renewal, News, and structured Community are required product surfaces. The omission constraints below are superseded by `../specs/2026-08-31-signedprice-contract-split-news-community-design.md`. Preserve completed district-summary work, but do not execute Tasks 2–4 until this plan is rewritten against the amended design.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Seoul Explore and district/building detail around the approved map-and-evidence handoff without fabricating unavailable evidence.

**Architecture:** Preserve the current Next.js 16 App Router, validated server route models, NAVER Maps provider, public SEO policy, and KoreaHomeGuide deployment. Add one artifact-safe district summary component, reuse it in a 460px Explore panel and full detail page, and keep unsupported split/news/community/saved sections absent.

**Tech Stack:** Next.js 16.3.3, React 19, TypeScript, CSS Modules, Vitest, Playwright, NAVER Maps JavaScript API.

**Spec:** `docs/product/signedprice-ui-development-direction.md`, `docs/superpowers/specs/2026-08-31-signedprice-contract-decision-platform-design.md`, `docs/superpowers/specs/2026-08-31-signedprice-global-trust-detail-singapore-design.md`, and the approved Korea Home Guide UI Mockups handoff.

## Global Constraints

- Use the V2 cobalt Modernist system: `--canvas`, `--ink`, `--accent`, Archivo, square geometry, and 2px structural rules.
- Every money value and count comes from a validated public artifact.
- Current district evidence combines new and renewal contracts; no split control is rendered.
- No News, community, saved, supply, floor/orientation, or physical-fact placeholder is rendered.
- Withheld and unavailable states remain money-free and explain reason plus next action.
- Korea uses NAVER Maps; Singapore continues using Google place/geocoding.
- Current robots, canonical, sitemap, legacy route, and KoreaHomeGuide behavior remain unchanged.
- All actions are at least 44px and layouts have no horizontal overflow at 390, 720, 1366, and 1440px.

---

### Task 1: Artifact-Safe District Summary

**Files:**
- Create: `v2/apps/web/components/public-market/district-evidence-summary.tsx`
- Create: `v2/apps/web/components/public-market/district-evidence-summary.module.css`
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Create: `v2/apps/web/test/district-evidence-summary.test.tsx`

**Interfaces:**
- Consumes: validated `ExploreDistrictModel` and `PublicDistrictModel` data.
- Produces: `DistrictEvidenceSummary({ model, mode: 'compact' | 'full' })` with published, withheld, and unavailable states.

- [ ] Write tests proving published summaries render median, middle half, range, change, sample, period and detail link; withheld/unavailable summaries render no money or split controls.
- [ ] Run `cd v2 && pnpm exec vitest run apps/web/test/district-evidence-summary.test.tsx` and verify RED because the component is absent.
- [ ] Expose only already-validated presentation fields on `ExploreDistrictModel` and implement the compact/full summary.
- [ ] Run the focused summary and route-model tests until GREEN.
- [ ] Commit as `feat(v2): add shared district evidence summary`.

### Task 2: Explore Map Plus 460px Evidence Panel

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/components/maps/naver-district-map.tsx`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/naver-district-map.test.tsx`

**Interfaces:**
- Consumes: Task 1 summary and current 25-district model.
- Produces: district selection callback, `?district=` URL state, a non-overlay 460px panel, explicit detail navigation, and the complete keyboard table.

- [ ] Write tests proving marker selection returns a slug, updates the selected panel without opening detail, and desktop CSS uses `minmax(0, 1fr) 460px`.
- [ ] Run focused tests and verify RED against the current immediate-navigation map and 380px table rail.
- [ ] Change NAVER selection to `onSelect(slug)`, update local state and `router.replace`, and render Task 1 compact summary above the complete table.
- [ ] Add mobile one-column map → summary → table flow while preserving provider fallback and legend.
- [ ] Run focused tests, lint, and typecheck until GREEN; commit as `feat(v2): rebuild Seoul Explore map workspace`.

### Task 3: District and Building Detail Composition

**Files:**
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail.module.css`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`

**Interfaces:**
- Consumes: Task 1 full summary and existing QuoteInput, building availability, distributions, contracts, and source disclosures.
- Produces: main-plus-sticky-380px-rail documents with map return, evidence navigation, and mobile document flow.

- [ ] Write tests proving the main/rail structure, map-return action, actual evidence sections, and absence of unsupported mockup panels.
- [ ] Run district/building tests and verify RED because current pages are single-column.
- [ ] Recompose district detail with summary, quote, verified buildings, FAQ and source in main; period, publication state, corrections, rankings and nearby districts in the rail.
- [ ] Recompose building detail with validated distribution, area bands and recent contracts in main; supported deals, period, publication minimum, exclusions, Trust and corrections in the rail.
- [ ] Add responsive rail reordering, run focused tests/lint/typecheck, and commit as `feat(v2): align Seoul detail pages with evidence handoff`.

### Task 4: Full Release Gate

**Files:**
- Create: `v2/tests/e2e/seoul-ui-handoff.spec.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: responsive, keyboard, route, fallback, data-boundary, SEO, Singapore-regression, and KoreaHomeGuide-regression evidence.

- [ ] Add browser assertions for 390/720/1366/1440px, 44px targets, visible focus, zero overflow, selection/back/refresh, and map fallback.
- [ ] Assert withheld/unavailable states expose no money and no source-provider browser request.
- [ ] Run `cd v2 && pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary`.
- [ ] Run the focused Playwright suites and record exact results in the release gate.
- [ ] Commit as `test(v2): gate SignedPrice Seoul UI handoff`.

## Blocked Brand Asset Task

The official logo archive was lost when the transient workspace reset. Do not redraw or approximate it. Install the exact supplied mark, favicon, Apple icon, and OG image in a separate TDD task immediately after the user reattaches the archive.
