# SignedPrice Integrated Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the supplied SignedPrice identity, three-city homepage, v5 evidence improvements, readable charts, and building Explorer as one verified public product.

**Architecture:** Shared brand and market-tab components establish the visual and navigation foundation. Existing verified repositories and route models remain the only source of displayed data; each v5 enhancement extends those models before changing presentation. Data-dependent building features publish only when the artifact carries the required evidence.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, pnpm 11.19.0, Vitest 4.1.11, Playwright 1.62.1.

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-integrated-refresh-design.md`

## Global Constraints

- Add no dependencies.
- Keep all money as integer won until formatting.
- Never substitute missing evidence, coordinates, rights, or publication states.
- Keep the five-contract publication minimum and six-pair floor-coefficient minimum.
- Use two-pixel structural rules, zero radius, no shadow, and bundled Archivo.
- Use source links with trailing `/`.
- Do not publish predictive, superiority, appraisal, or accuracy claims.

---

### Task 1: Brand foundation and shared wordmark

**Files:**
- Create: `v2/apps/web/components/brand-mark.tsx`
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Test: `v2/apps/web/test/design-tokens.test.ts`
- Test: `v2/apps/web/test/brand-mark.test.tsx`

**Interfaces:**
- Produces: `BrandMark({ size, inverted? })` and `BrandWordmark({ compact?, inverted? })`.

- [ ] Write failing tests that assert the supplied three-path SVG geometry, `signed`/`price` weight split, new palette tokens, AA text contrast, and shared-header use.
- [ ] Run `pnpm vitest run apps/web/test/design-tokens.test.ts apps/web/test/brand-mark.test.tsx` and confirm failures name the old palette and missing component.
- [ ] Add the SVG and wordmark components, replace the root tokens, and migrate local hard-coded component palettes to global tokens without changing evidence-state semantics.
- [ ] Run the targeted tests, color-literal scan, typecheck, and commit `feat(v2): install signedprice brand system`.

### Task 2: Three-city homepage and product slots

**Files:**
- Modify: `v2/apps/web/app/page.tsx`
- Modify: `v2/apps/web/components/home-market-browser.tsx`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/app/globals.css`
- Test: `v2/apps/web/test/home-content.test.ts`
- Test: `v2/apps/web/test/home-layout.test.ts`
- Test: `v2/apps/web/test/singapore-navigation.test.tsx`
- Test: `v2/tests/e2e/visible-foundation.spec.ts`

**Interfaces:**
- Consumes: `SeoulLiveModel`, `SingaporeEntryModel`.
- Produces: accessible `role="tablist"` with `market-panel-seoul`, `market-panel-singapore`, and `market-panel-dubai` panels.

- [ ] Keep the existing red tests for permanent city tabs, Seoul initial selection, six consistent product slots, no dead Singapore/Dubai links, and mobile switching.
- [ ] Implement serializable city-panel props and keyboard-operable tabs; integrate Seoul counts inside its panel instead of rendering a standalone block.
- [ ] Render Singapore Explore only when ready and Dubai as rights-blocked without anchors.
- [ ] Run targeted tests and desktop/mobile homepage Playwright, then commit `feat(v2): make city markets the homepage entry`.

### Task 3: Canonical instant Contract Check

**Files:**
- Create: `v2/apps/web/app/kr/seoul/check/page.tsx`
- Create: `v2/apps/web/components/contract-check/conversion-curve.tsx`
- Modify: `v2/apps/web/app/kr/page.tsx`
- Modify: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Modify: `v2/apps/web/components/contract-check/contract-check.module.css`
- Modify: `v2/apps/web/lib/contract-check/client-state.ts`
- Modify: `v2/apps/web/lib/contract-check/route-model.server.ts`
- Test: `v2/packages/market-core/test/contract-check.test.ts`
- Test: `v2/apps/web/test/contract-check-workspace.test.tsx`
- Test: `v2/tests/e2e/contract-check.spec.ts`

**Interfaces:**
- Consumes: `conversionRateAt()` and `compareRentOffers()` from `@signedprice/market-core` plus verified repository curves.
- Produces: immediate `CALCULATE` results on valid edits, HTML-labelled inline SVG curve, four calculation rows, and canonical `/kr/seoul/check/`.

- [ ] Add failing cases for the v5 anchor values, held-range states, principal exclusion, flipped ranking, no submit button, four audit rows, and the new canonical route.
- [ ] Update client state to recalculate after each valid edit and render blank title/reason/action state for invalid drafts.
- [ ] Render curve markers at each filed deposit and keep all labels in HTML, not SVG text.
- [ ] Replace `/kr/` with a redirect or canonical entry to `/kr/seoul/check/`, update all Check links, run targeted tests and commit `feat(v2): restore measured contract check`.

### Task 4: District interpretation and incomplete-period honesty

**Files:**
- Create: `v2/apps/web/lib/public-market/evidence-interpretation.ts`
- Modify: `v2/apps/web/lib/public-market/route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/rankings-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-rankings.tsx`
- Modify: `v2/apps/web/components/public-market/public-market.module.css`
- Test: `v2/apps/web/test/public-district-detail.test.tsx`
- Test: `v2/apps/web/test/public-area-rankings-model.test.ts`

**Interfaces:**
- Produces: `spreadVerdict(summary)`, `changeReliability({ pct, nPrior, nLatest })`, and completed-month classification.

- [ ] Add literal failing tests for narrow/moderate/wide thresholds and every shaky condition.
- [ ] Extend route models with spread copy and `nPrior → nLatest`; do not derive copy in JSX.
- [ ] Mark incomplete months as hatched, add Complete / Filing in progress legend, and exclude them from comparison anchors.
- [ ] Reuse `BoxPlot` for district, ranking, building, and Check evidence; run targeted tests and commit `feat(v2): explain district evidence limits`.

### Task 5: Building detail evidence and map completion

**Files:**
- Modify: `v2/apps/web/lib/public-market/building-summary-schema.ts`
- Modify: `v2/apps/web/lib/public-market/building-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/maps/naver-district-map.tsx`
- Test: `v2/apps/web/test/public-building-artifact.test.ts`
- Test: `v2/apps/web/test/public-building-artifact-builder.test.ts`
- Test: `v2/apps/web/test/public-district-detail.test.tsx`
- Test: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**
- Produces: nullable `floor` plus `floorMissingReason`, `FloorCoefficientModel`, and marker/rail selection parity.

- [ ] Add failing schema and page tests for Floor, explicit missing reason, six-pair coefficient gate, and the single-band title/reason/next-action state.
- [ ] Extend schema and route models without accepting fabricated legacy defaults; existing v2 artifacts expose an explicit not-retained reason.
- [ ] Keep Naver geocoding fallback for null coordinates, verify marker and rail item select the same panel, and retain the full-detail CTA.
- [ ] Rebuild the public artifact only if the official source input containing floor is available; otherwise ship the honest missing-floor state and report the data blocker separately.
- [ ] Run targeted tests and Explorer Playwright, then commit `feat(v2): extend verified building evidence`.

### Task 6: Coverage, cohort default, and update promise

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/public-source-boundary.tsx`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Test: `v2/apps/web/test/public-area-route-model.test.ts`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`

**Interfaces:**
- Produces: calculated coverage model, configured next-update model, and default cohort `new`.

- [x] Add failing tests for calculated district/building/contract/unpublished counts, non-hardcoded next update, New default, and invariant three-row cohort comparison.
- [x] Implement repository-derived coverage and configured monthly update scheduling; omit the promise when scheduling is absent.
- [x] Switch initial cohort to New while keeping all three values visible.
- [x] Run targeted tests and commit `feat(v2): publish coverage and update boundary`.

### Task 7: Korean alternate routes

**Files:**
- Create: `v2/apps/web/app/ko/kr/seoul/...`
- Create: `v2/apps/web/lib/locale/ko.ts`
- Modify: `v2/apps/web/lib/public-metadata.ts`
- Modify: `v2/apps/web/app/sitemap.ts`
- Test: `v2/apps/web/test/public-route-contract.test.tsx`
- Test: `v2/apps/web/test/component-localization.type-test.tsx`

**Interfaces:**
- Produces: `/ko/kr/seoul/...` canonical pages, reciprocal English/Korean hreflang, and KRW 억/만원 formatters.

- [x] Add failing route, canonical, hreflang, sitemap, and formatting tests.
- [x] Add Korean copy models without branching data or calculation logic.
- [x] Generate reciprocal metadata and sitemap entries only for completed translations.
- [x] Run localization and route-contract tests, prohibited-copy scan, and commit `feat(v2): add Korean evidence routes`.

### Task 8: Full verification, review, and release

**Files:**
- Modify only files required by verified failures.

- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, client-boundary scans, and full Playwright.
- [ ] Run literal-color and prohibited-copy scans; trace sampled homepage, Check, district, and building numbers to their model functions.
- [ ] Inspect desktop and mobile Preview for logo, palette, all city panels, chart collisions, Naver marker selection, empty states, and Korean alternates.
- [ ] Review the complete diff against the spec and v5 acceptance conditions.
- [ ] Push the exact verified SHA, open the PR, verify Preview again, merge, verify Production status/canonical/runtime logs, and record any official-source blocker without overstating completion.
