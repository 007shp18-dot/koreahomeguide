# SignedPrice Evidence UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the approved map-first Seoul UI with a 460px evidence panel and detail rails that compose contract split, verified News, and structured Community without fabricating missing values.

**Architecture:** Keep the current server route-model boundary and NAVER district map. A shared artifact-safe district summary renders compact/full evidence; Explore selection updates local and URL state before explicit navigation; district/building detail pages compose only server-validated News and Community models in a responsive contextual rail.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, NAVER Maps JavaScript API, Vitest 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-contract-split-news-community-design.md`

## Global Constraints

- Use the cobalt Modernist system: canvas `#f3f2f2`, ink `#201e1d`, accent `#1d4ed8`, square geometry, 2px structural rules, and no decorative card shadows.
- Keep current Next.js, server route models, NAVER Maps, Google geocoding boundary, SEO route contracts, and KoreaHomeGuide deployment.
- Explore map/table remain combined `All`; the selected evidence module may change All/New/Renewal.
- No under-threshold or unavailable state renders money.
- News and Community are visible only through their honest validated states; no placeholder number is used.
- Targets are at least 44px and layouts have no horizontal overflow at 390, 720, 1366, and 1440px.
- Exact official logo installation remains blocked until the original archive is reattached.

---

### Task 1: Finish the Shared Artifact-Safe District Summary

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Create: `v2/apps/web/components/public-market/district-evidence-summary.tsx`
- Create: `v2/apps/web/components/public-market/district-evidence-summary.module.css`
- Create: `v2/apps/web/test/district-evidence-summary.test.tsx`

**Interfaces:**
- Consumes: server-validated `PublicDistrictEvidenceSummaryModel`; after contract-split Task 4, consumes `ContractGroupEvidenceModel`.
- Produces: `DistrictEvidenceSummary({ model, mode: 'compact' | 'full' })` for published, withheld, unavailable, and v1 split-limitation states.

- [ ] **Step 1: Run the already-written focused test and inspect RED/GREEN honestly**

```bash
cd v2
pnpm exec vitest run apps/web/test/district-evidence-summary.test.tsx
```

If it fails, preserve the assertion and fix the smallest implementation issue. Do not weaken money-withholding or source-period assertions.

- [ ] **Step 2: Extend the test for group composition**

```tsx
expect(publishedHtml).toContain('Median refundable jeonse deposit');
expect(publishedHtml).toContain('Middle half');
expect(withheldHtml).not.toMatch(/₩|KRW/);
expect(unavailableHtml).not.toMatch(/₩|KRW/);
expect(v1Html).toContain('New/renewal split not available in this snapshot');
```

- [ ] **Step 3: Implement one semantic summary component**

Use one `<section>` with identity header, selected-group finding, metric `<dl>`, source period footer, and explicit detail link. Withheld/unavailable branches share no formatted money props. The full mode changes layout density, not evidence semantics.

- [ ] **Step 4: Run focused route-model tests, lint, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/district-evidence-summary.test.tsx apps/web/test/public-area-route-model.test.ts apps/web/test/public-district-detail.test.tsx
pnpm lint
git add apps/web/lib/public-market/area-route-types.ts apps/web/lib/public-market/area-route-model.server.ts apps/web/components/public-market/district-evidence-summary.tsx apps/web/components/public-market/district-evidence-summary.module.css apps/web/test/district-evidence-summary.test.tsx
git commit -m "feat(v2): add shared district evidence summary"
```

### Task 2: Explore Map Plus 460px Evidence Panel

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/components/maps/naver-district-map.tsx`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/app/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/naver-district-map.test.tsx`
- Modify: `v2/apps/web/test/public-area-explorer-state.test.ts`

**Interfaces:**
- Consumes: Task 1 summary and contract-split route model.
- Produces: `onSelect(slug)`, `?district=` URL state, map/table selection synchronization, 460px panel, and explicit detail navigation.

- [ ] **Step 1: Write failing selection and layout tests**

```tsx
expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+460px/);
expect(html).toContain('data-selected-evidence="jongno-gu"');
expect(html).toContain('Open Jongno-gu evidence');
expect(mapProps.onSelect).toBeTypeOf('function');
```

Reducer tests require marker/row selection to change `selectedSlug` without forcing navigation and invalid URL slugs to fall back to the server-selected district.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx apps/web/test/public-area-explorer-state.test.ts
```

- [ ] **Step 3: Separate selection from navigation**

Change map provider input from destination-only behavior to:

```ts
type NaverDistrictMapProps = Readonly<{
  selectedSlug: SeoulDistrictSlug;
  onSelect(slug: SeoulDistrictSlug): void;
  // existing safe district geometry/labels
}>;
```

Marker/fallback path calls `onSelect`; the panel's explicit link navigates. Row hover/focus selects, while its `Open` link navigates. `router.replace` updates `district` and selected `contract` without scrolling.

- [ ] **Step 4: Implement desktop/mobile composition**

Desktop workspace is map `minmax(0, 1fr)` plus 460px summary/table rail. Mobile order is map → selected summary → complete table. Keep map fallback, legend, all 25 legal-code rows, 44px controls, and visible focus. Do not duplicate the district summary markup.

- [ ] **Step 5: Run focused tests, typecheck, lint, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx apps/web/test/public-area-explorer-state.test.ts apps/web/test/district-evidence-summary.test.tsx
pnpm lint
pnpm typecheck
git add apps/web/components/public-market/area-explorer.tsx apps/web/components/public-market/area-explorer.module.css apps/web/components/maps/naver-district-map.tsx apps/web/lib/public-market/area-explorer-state.ts apps/web/app/kr/seoul/explore/page.tsx apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx apps/web/test/public-area-explorer-state.test.ts
git commit -m "feat(v2): rebuild Seoul Explore evidence workspace"
```

### Task 3: District and Building Detail Rails

**Files:**
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail.module.css`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/building-route-model.server.ts`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`

**Interfaces:**
- Consumes: full summary, verified News summaries, Community signal state, QuoteInput/building evidence, rankings, nearby districts, corrections, and source disclosure.
- Produces: main plus bounded 380px contextual rail on wide screens and a single semantic document flow on narrow screens.

- [ ] **Step 1: Write failing composition tests**

```tsx
expect(districtHtml).toContain('data-detail-main');
expect(districtHtml).toContain('data-detail-rail');
expect(districtHtml).toContain('Latest verified News');
expect(districtHtml).toContain('Community signal');
expect(districtHtml).toContain('Back to Seoul map');
expect(withheldHtml).not.toMatch(/₩|KRW/);
```

Building tests require the same modules only for a verified building scope. Missing building evidence renders neither invented physical facts nor a submit-capable Community form.

- [ ] **Step 2: Run detail tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx
```

- [ ] **Step 3: Extend route models with composed safe models**

Add only already-sanitized fields:

```ts
type DetailContextModel = Readonly<{
  news: readonly NewsCardModel[];
  community: CommunitySignalModel;
  rankingsHref: '/kr/seoul/rankings/';
  correctionsHref: '/kr/seoul/corrections/';
}>;
```

Repository/storage errors become `news: []` only when no authored items exist and a precise Community unavailable state. Do not expose internal error strings.

- [ ] **Step 4: Recompose pages**

District main: full split summary, Contract/Rent Check entry, verified buildings, methodology, source. Rail: relevant News, Community, Rankings/nearby, freshness/corrections. Building main: distribution, area bands, recent contracts, source; rail: relevant News, Community, period/publication state, corrections and district return.

- [ ] **Step 5: Add responsive ordering and commit**

At wide widths use `minmax(0, 1fr) 380px`; the rail is sticky only when its content fits safely. Below the breakpoint, render one DOM order after official evidence. No CSS `order` may make keyboard order differ from reading order.

```bash
cd v2
pnpm exec vitest run apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx
pnpm lint
pnpm typecheck
git add apps/web/components/public-market/district-detail-page.tsx apps/web/components/public-market/district-detail.module.css apps/web/components/public-market/building-detail-page.tsx apps/web/components/public-market/building-detail.module.css apps/web/lib/public-market/area-route-types.ts apps/web/lib/public-market/area-route-model.server.ts apps/web/lib/public-market/building-route-model.server.ts apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx
git commit -m "feat(v2): compose Seoul evidence detail rails"
```

### Task 4: Indexability and Full UI Release Gate

**Files:**
- Create: `v2/tests/e2e/seoul-evidence-ui.spec.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/apps/web/lib/public-metadata.ts`
- Modify: `v2/apps/web/lib/public-market/district-metadata.ts`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`
- Create: `docs/operations/koreahomeguide-signedprice-migration-map.md`

**Interfaces:**
- Consumes: completed contract split, News, Community-state, and UI tasks.
- Produces: responsive/browser/SEO evidence and a cohort-based KoreaHomeGuide migration map; does not perform redirects without parity.

- [ ] **Step 1: Write failing route and browser assertions**

Require evidence-complete Explore, district, Rankings, News index, and validated News detail routes to have `index, follow`, clean canonical, correct hreflang policy, and sitemap presence. Require API/private/query variants and unavailable market routes to remain excluded. Browser assertions cover 390/720/1366/1440, 44px targets, focus order, marker→panel→detail, back/refresh, group query, no overflow, console/5xx, and map fallback.

- [ ] **Step 2: Implement route-specific indexing policy**

Do not globally remove `noindex`. Classify each route through the existing metadata contract. Index only content-complete routes with installed verified artifacts; query `contract` variants canonicalize to the clean route. Community content never determines indexability.

- [ ] **Step 3: Write the KoreaHomeGuide cohort map**

For every existing KoreaHomeGuide URL, record intended SignedPrice destination, parity state, canonical state, redirect type, owner, and verification evidence. Mark unmatched or unique guide jobs `preserve`. No redirect is implemented in this task.

- [ ] **Step 4: Run the full local gate**

```bash
cd v2
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm check:rent-client-boundary
pnpm check:singapore-client-boundary
pnpm exec playwright test tests/e2e/seoul-evidence-ui.spec.ts tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts
git diff --check
```

- [ ] **Step 5: Verify exact-SHA Preview and commit**

Verify real map keys, Google geocoding server boundary, artifacts, split states, News, Community unavailable/ready state as configured, raw HTML, metadata, sitemap, runtime errors, and KoreaHomeGuide production preservation. Record the exact SHA/deployment. Production promotion and each KoreaHomeGuide redirect cohort remain separate approved actions.

```bash
git add tests/e2e/seoul-evidence-ui.spec.ts tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts apps/web/app/sitemap.ts apps/web/lib/public-metadata.ts apps/web/lib/public-market/district-metadata.ts apps/web/test/public-route-contract.test.tsx docs/operations/signedprice-public-p1-release-gate.md docs/operations/koreahomeguide-signedprice-migration-map.md
git commit -m "test(v2): gate SignedPrice evidence UI and indexing"
```
