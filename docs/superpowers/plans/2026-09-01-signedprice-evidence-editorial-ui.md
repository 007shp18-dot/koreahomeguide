# SignedPrice Evidence Editorial UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every public SignedPrice page around the approved Evidence Editorial direction while preserving verified data, calculation, rights, and publication behavior.

**Architecture:** Keep all repositories, route models, and calculation engines unchanged unless a test proves a presentation model is missing. Introduce a shared editorial shell and a focused homepage composition, then restyle existing page components through their current CSS modules. Page depth increases from decision entry to market context to auditable detail; unavailable markets and intents remain visible but never become fake links or figures.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5.9.3, CSS Modules and global CSS, Vitest 4.1.11, Playwright 1.62.1, pnpm 11.19.0.

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-evidence-editorial-ui-design.md`

## Global Constraints

- No new dependencies; HTML and inline SVG remain the only chart primitives.
- Preserve every repository, calculation, publication-minimum, rights, locale, and no-estimate boundary from the integrated refresh spec.
- Internal links end in `/` in source.
- Do not hard-code runtime evidence values in JSX; render them from route models.
- Do not invent search results, building images, market briefs, Dubai routes, or unavailable intent behavior.
- Archivo remains the only required application font.
- Square geometry, zero radius, no decorative shadows.
- Production remains unchanged until exact-SHA Preview review and explicit user approval.

---

## File responsibility map

- `app/globals.css`: shared tokens, typography, header/footer, generic page rhythm, and legacy global classes.
- `components/site-header.tsx`: one shared four-link product navigation with current-page state.
- `components/site-footer.tsx`: compact global evidence footer and legal destinations.
- `lib/site-copy.ts`: claim-safe navigation, homepage copy, decision-path and market-state presentation models.
- `components/home-market-browser.tsx`: accessible city and intent state plus evidence hero.
- `components/home-editorial-sections.tsx`: server-rendered decision, Explore, Market Brief, and trust homepage sections.
- `components/home-editorial.module.css`: homepage-only Evidence Editorial layout.
- Existing `*.module.css` files: page-specific layouts; behavior remains in existing TSX components.
- `components/public-market/area-explorer.tsx`: real district/neighborhood/building text filtering and map/rail flow.
- Existing Vitest files: semantic and fail-closed release contracts.
- Existing Playwright specs: desktop/mobile route and navigation verification.

---

### Task 1: Lock the shared Evidence Editorial shell

**Files:**
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/site-footer.tsx`
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/apps/web/test/home-layout.test.ts`
- Modify: `v2/apps/web/test/design-tokens.test.ts`
- Modify: `v2/apps/web/test/brand-mark.test.tsx`

**Interfaces:**
- Consumes: `SiteHeaderModel`, `SiteFooterModel`, `BrandWordmark`.
- Produces: shared header links `Check`, `Explore`, `Briefs`, `Guide`; current state remains controlled by `NavigationLinkModel.isCurrent`.

- [ ] **Step 1: Write the failing shared-shell tests**

```ts
it('uses the approved four-link product navigation', async () => {
  const markup = renderToStaticMarkup(await Home());
  const navigation = markup.match(/<nav aria-label="Primary navigation">([\s\S]*?)<\/nav>/)?.[1] ?? '';
  for (const link of ['Check', 'Explore', 'Briefs', 'Guide']) {
    expect(navigation).toContain(`>${link}</a>`);
  }
  expect(navigation.match(/<a /g) ?? []).toHaveLength(4);
});

it('keeps shared geometry square and shadow-free', () => {
  expect(css).toContain('--radius: 0px');
  expect(css).not.toMatch(/box-shadow:\s*0\s+\d/);
});
```

- [ ] **Step 2: Run the tests and verify the old two-link header fails**

Run: `pnpm vitest run apps/web/test/home-layout.test.ts apps/web/test/design-tokens.test.ts apps/web/test/brand-mark.test.tsx`

Expected: FAIL because the current header renders `Global home` and `Market overview`.

- [ ] **Step 3: Implement the shared shell**

Use one link model in `site-copy.ts`:

```ts
export const productNavigationLinks = Object.freeze([
  { label: 'Check', href: '/kr/seoul/check/' },
  { label: 'Explore', href: '/kr/seoul/explore/' },
  { label: 'Briefs', href: '/kr/seoul/news/' },
  { label: 'Guide', href: '/kr/seoul/guide/' },
] satisfies readonly NavigationLinkModel[]);
```

Keep the wordmark linked to `/`. Add a compact visible market label (`Seoul · EN`) outside the primary nav without creating unavailable Singapore or Dubai links. Replace oversized/brittle global type rules with one fluid H1 scale, one section-heading scale, normal body numerals, and a shared site gutter.

- [ ] **Step 4: Run the targeted tests**

Run: `pnpm vitest run apps/web/test/home-layout.test.ts apps/web/test/design-tokens.test.ts apps/web/test/brand-mark.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the shell**

```bash
git add v2/apps/web/lib/site-copy.ts v2/apps/web/components/site-header.tsx v2/apps/web/components/site-footer.tsx v2/apps/web/app/globals.css v2/apps/web/test/home-layout.test.ts v2/apps/web/test/design-tokens.test.ts v2/apps/web/test/brand-mark.test.tsx
git commit -m "feat(ui): add evidence editorial shell"
```

### Task 2: Build the complete Evidence Editorial homepage

**Files:**
- Create: `v2/apps/web/components/home-editorial-sections.tsx`
- Create: `v2/apps/web/components/home-editorial.module.css`
- Modify: `v2/apps/web/components/home-market-browser.tsx`
- Modify: `v2/apps/web/app/page.tsx`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/test/home-content.test.ts`
- Modify: `v2/apps/web/test/home-layout.test.ts`

**Interfaces:**
- Consumes: `HomepageMarketModel[]`, `SeoulLiveModel`, `NewsIndexModel`, existing guide content.
- Produces: `HomeEditorialSections({ seoul, news })` and the ordered homepage sections hero → live evidence → decision paths → Explore preview → Market Brief ledger → trust boundary.

- [ ] **Step 1: Write failing homepage structure tests**

```ts
it('renders the approved evidence editorial sequence', async () => {
  const markup = renderToStaticMarkup(await Home());
  const ids = ['home-decision', 'home-evidence', 'home-paths', 'home-explore', 'home-briefs', 'home-trust'];
  const positions = ids.map((id) => markup.indexOf(`id="${id}"`));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  expect(markup).toContain('>See what homes actually signed for.</h1>');
  expect(markup).toContain('>Rent</button>');
  expect(markup).toContain('>Buy</button>');
  expect(markup).toContain('>Invest</button>');
});

it('does not invent approved briefs for empty markets', async () => {
  const markup = renderToStaticMarkup(await Home());
  expect(markup).toContain('No approved brief yet');
  expect(markup).not.toMatch(/Singapore Market Brief<\/a>|Dubai Market Brief<\/a>/);
});
```

- [ ] **Step 2: Run tests and confirm the existing hero/product-card page fails**

Run: `pnpm vitest run apps/web/test/home-content.test.ts apps/web/test/home-layout.test.ts`

Expected: FAIL on the new H1, section IDs, decision tabs, and ledger boundary.

- [ ] **Step 3: Implement the hero and live evidence composition**

Keep city keyboard behavior in `HomeMarketBrowser`. Add local intent state with Rent initially selected. Rent renders real `/kr/seoul/check/` and `/kr/seoul/explore/` links. Buy and Invest render claim-safe staged copy and link only to their existing limitation-bearing intent routes. Render `SeoulLiveModel` values in both the hero evidence visual and the live strip; unavailable state must render `model.message` once and no numeric placeholders.

- [ ] **Step 4: Implement the lower homepage sections**

`HomeEditorialSections` renders:

```ts
type HomeEditorialSectionsProps = Readonly<{
  seoul: SeoulLiveModel;
  news: NewsIndexModel;
}>;
```

Use `news.records` for Seoul. Render static empty approval states for Singapore and Dubai. Use links to existing Explore, Rankings, News, Guide, and intent pages only. Replace the former `principles` grid and large `TrustStrip` with one compact trust boundary.

- [ ] **Step 5: Make the homepage responsive**

In `home-editorial.module.css`, use a two-column desktop hero and Explore split, one-column under 760px, no horizontal scrolling, and 44px controls. Give sections alternating `--canvas`, `--surface-strong`, and `--petrol` surfaces without shadows or rounded cards.

- [ ] **Step 6: Run homepage tests**

Run: `pnpm vitest run apps/web/test/home-content.test.ts apps/web/test/home-layout.test.ts apps/web/test/focus-contract.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the homepage**

```bash
git add v2/apps/web/components/home-editorial-sections.tsx v2/apps/web/components/home-editorial.module.css v2/apps/web/components/home-market-browser.tsx v2/apps/web/app/page.tsx v2/apps/web/lib/site-copy.ts v2/apps/web/test/home-content.test.ts v2/apps/web/test/home-layout.test.ts
git commit -m "feat(home): build evidence editorial entry"
```

### Task 3: Make Explore the real search and map entry

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/test/public-area-explorer-state.test.ts`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**
- Consumes: retained `ExploreBuildingModel[]`, `q` and `district` query parameters.
- Produces: `filterExploreBuildings(buildings, query, neighborhoodId)` returning only retained records; no synthetic results.

- [ ] **Step 1: Write the failing pure filter tests**

```ts
it('filters retained buildings by name and neighborhood case-insensitively', () => {
  expect(filterExploreBuildings(buildings, '역삼', 'all').map(({ id }) => id)).toEqual(['building-1']);
  expect(filterExploreBuildings(buildings, 'Yeoksam', 'all').map(({ id }) => id)).toEqual(['building-1']);
});

it('returns no result instead of substituting a district aggregate', () => {
  expect(filterExploreBuildings(buildings, 'not-retained', 'all')).toEqual([]);
});
```

- [ ] **Step 2: Run targeted tests and verify `filterExploreBuildings` is missing**

Run: `pnpm vitest run apps/web/test/public-area-explorer-state.test.ts apps/web/test/public-area-explorer.test.tsx`

Expected: FAIL with missing export/markup.

- [ ] **Step 3: Implement filter semantics and query initialization**

Normalize with `trim().toLocaleLowerCase('en-US')`. Match retained `name`, `neighborhoodName`, and district English/Korean labels already present in the model. Apply neighborhood selection and query together. When `q` is present, initialize the text input and reveal the matching retained buildings; when no match exists, render title, reason, and clear-filter action.

- [ ] **Step 4: Recompose the workspace**

Use an approximately `minmax(0, 1.62fr) minmax(320px, 1fr)` desktop map/rail grid. Keep the map visible above the fold, place text and neighborhood filters at the top of the rail, keep selected building evidence adjacent, and move the complete district table below the workspace. On mobile, map precedes rail and remains at least 420px tall without fixed viewport traps.

- [ ] **Step 5: Run Explore tests**

Run: `pnpm vitest run apps/web/test/public-area-explorer-state.test.ts apps/web/test/public-area-explorer.test.tsx apps/web/test/naver-district-map.test.tsx apps/web/test/explorer-ui-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Explore**

```bash
git add v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/lib/public-market/area-explorer-state.ts v2/apps/web/test/public-area-explorer-state.test.ts v2/apps/web/test/public-area-explorer.test.tsx v2/tests/e2e/area-explore.spec.ts
git commit -m "feat(explore): add map-first building search"
```

### Task 4: Unify Rankings and district decision pages

**Files:**
- Modify: `v2/apps/web/components/public-market/district-rankings.tsx`
- Modify: `v2/apps/web/components/public-market/district-rankings.module.css`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail.module.css`
- Modify: `v2/apps/web/components/public-market/district-evidence-summary.module.css`
- Modify: `v2/apps/web/test/public-area-rankings.test.tsx`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`

**Interfaces:**
- Consumes: existing `RankingsRouteModel` and district models.
- Produces: no new evidence values; only a single-view presentation and shared product-intro order.

- [ ] **Step 1: Write failing semantic-order tests**

```ts
it('orders district evidence from summary to distribution to cohorts to buildings to source', () => {
  const markup = renderToStaticMarkup(<DistrictDetailPage model={model} />);
  const markers = ['district-summary', 'district-distribution', 'district-cohorts', 'district-buildings', 'district-source'];
  const positions = markers.map((marker) => markup.indexOf(`data-section="${marker}"`));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});
```

- [ ] **Step 2: Run tests and verify missing section contracts**

Run: `pnpm vitest run apps/web/test/public-area-rankings.test.tsx apps/web/test/public-district-detail.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Recompose Rankings without changing values**

Keep the existing view selector and models. Present one view at a time, keep direct labels and signed-zero geometry, make the selected view control visibly primary, and render rows vertically at narrow widths. Do not calculate a new score or summary metric.

- [ ] **Step 4: Reorder district detail and compact coverage**

Add the five `data-section` markers. Keep `BoxPlot`, cohort comparison, building links, source boundary, and period strip. Move period/coverage into compact metadata near the intro and remove duplicate large bordered surfaces.

- [ ] **Step 5: Run targeted tests and commit**

Run: `pnpm vitest run apps/web/test/public-area-rankings.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/box-plot-layout.test.tsx apps/web/test/district-evidence-summary.test.tsx`

Expected: PASS.

```bash
git add v2/apps/web/components/public-market/district-rankings.tsx v2/apps/web/components/public-market/district-rankings.module.css v2/apps/web/components/public-market/district-detail-page.tsx v2/apps/web/components/public-market/district-detail.module.css v2/apps/web/components/public-market/district-evidence-summary.module.css v2/apps/web/test/public-area-rankings.test.tsx v2/apps/web/test/public-district-detail.test.tsx
git commit -m "feat(markets): unify rankings and district pages"
```

### Task 5: Redesign Check and comparison tools around the result

**Files:**
- Modify: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Modify: `v2/apps/web/components/contract-check/conversion-curve.tsx`
- Modify: `v2/apps/web/components/rent-check/rent-check-workspace.tsx`
- Modify: `v2/apps/web/components/rent-check/rent-check-result.tsx`
- Modify: `v2/apps/web/app/kr/seoul/tools/rent-check/rent-check.module.css`
- Modify: `v2/apps/web/components/same-cash-workspace.tsx`
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/apps/web/test/contract-check-workspace.test.tsx`
- Modify: `v2/apps/web/test/rent-check-result.test.ts`
- Modify: `v2/apps/web/test/intent-compare-modernist.test.ts`

**Interfaces:**
- Consumes: existing client state and route models.
- Produces: no calculation changes; only editable-assumption, verdict, evidence, and method presentation groups.

- [ ] **Step 1: Write failing result-first tests**

```ts
it('renders inputs before one primary verdict and evidence after it', () => {
  const markup = renderToStaticMarkup(<ContractCheckWorkspace model={model} />);
  const input = markup.indexOf('data-check-section="inputs"');
  const verdict = markup.indexOf('data-check-section="verdict"');
  const evidence = markup.indexOf('data-check-section="evidence"');
  expect(input).toBeLessThan(verdict);
  expect(verdict).toBeLessThan(evidence);
});
```

- [ ] **Step 2: Run tests and confirm the new grouping fails**

Run: `pnpm vitest run apps/web/test/contract-check-workspace.test.tsx apps/web/test/rent-check-result.test.ts apps/web/test/intent-compare-modernist.test.ts`

Expected: FAIL on missing section attributes.

- [ ] **Step 3: Implement result-first composition**

Add only semantic wrappers and presentation classes. Preserve immediate recalculation, lower-deposit reference, held-range labels, four auditable calculation rows, and eight-line evidence boundary. Put the main result sentence and difference before curve/table detail. Use Korean won display helpers at presentation boundaries only.

- [ ] **Step 4: Make calculator forms compact and mobile-safe**

Use two columns for offers at desktop and one column below 760px. Keep labels visible, inputs 44px high, and curve labels collision-safe. Do not hide the calculation trace behind a hover interaction.

- [ ] **Step 5: Run targeted tests and commit**

Run: `pnpm vitest run apps/web/test/contract-check-workspace.test.tsx apps/web/test/contract-check-route-model.test.ts apps/web/test/rent-check-result.test.ts apps/web/test/box-plot-layout.test.tsx apps/web/test/intent-compare-modernist.test.ts`

Expected: PASS.

```bash
git add v2/apps/web/components/contract-check v2/apps/web/components/rent-check v2/apps/web/components/same-cash-workspace.tsx v2/apps/web/app/kr/seoul/tools/rent-check/rent-check.module.css v2/apps/web/app/globals.css v2/apps/web/test/contract-check-workspace.test.tsx v2/apps/web/test/rent-check-result.test.ts v2/apps/web/test/intent-compare-modernist.test.ts
git commit -m "feat(check): make comparisons result first"
```

### Task 6: Align building detail with the Evidence Editorial system

**Files:**
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-header.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/components/public-market/building-decision-views.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`
- Modify: `v2/apps/web/test/public-building-decision-views.test.tsx`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`

**Interfaces:**
- Consumes: current decision model and building visual model.
- Produces: aligned header/media/evidence sections; Rent/Buy/Invest state semantics are unchanged.

- [ ] **Step 1: Add failing media-fallback and hierarchy tests**

```ts
it('renders an honest evidence visual when no rights-cleared image exists', () => {
  const markup = renderToStaticMarkup(<BuildingDetailPage model={model} />);
  expect(markup).toContain('data-building-media="evidence-fallback"');
  expect(markup).not.toMatch(/<img[^>]+src="(?:data:|https?:\/\/)/);
});
```

- [ ] **Step 2: Run building tests and verify the new media contract fails**

Run: `pnpm vitest run apps/web/test/public-building-detail.test.tsx apps/web/test/public-building-decision-views.test.tsx`

Expected: FAIL on the missing media marker.

- [ ] **Step 3: Implement the aligned detail lead**

Use the existing building visual as the no-photo lead media and label it as evidence, not photography. Keep name, district/neighborhood, period, source status, and one primary next action in the compact intro. Preserve decision tabs and their existing gated copy.

- [ ] **Step 4: Normalize evidence sections**

Use shared spacing/rules for overview, Rent, Buy, Invest, evidence, recent contracts, cohort comparison, floor absence, and source boundary. Keep recent-record floor and coefficient rules unchanged.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm vitest run apps/web/test/public-building-detail.test.tsx apps/web/test/public-building-decision-views.test.tsx apps/web/test/public-building-visual.test.tsx apps/web/test/public-building-route-model.test.ts`

Expected: PASS.

```bash
git add v2/apps/web/components/public-market/building-detail-page.tsx v2/apps/web/components/public-market/building-detail-header.tsx v2/apps/web/components/public-market/building-detail.module.css v2/apps/web/components/public-market/building-decision-views.tsx v2/apps/web/test/public-building-detail.test.tsx v2/apps/web/test/public-building-decision-views.test.tsx v2/tests/e2e/korea-detail.spec.ts
git commit -m "feat(building): align decision detail hierarchy"
```

### Task 7: Turn News into a Market Brief ledger and Guide into a decision library

**Files:**
- Modify: `v2/apps/web/components/news/news-index-page.tsx`
- Modify: `v2/apps/web/components/news/news-detail-page.tsx`
- Modify: `v2/apps/web/components/news/news.module.css`
- Modify: `v2/apps/web/components/news/detail-news-list.module.css`
- Modify: `v2/apps/web/components/guide/guide-index.tsx`
- Modify: `v2/apps/web/components/guide/guide-document.tsx`
- Modify: `v2/apps/web/components/guide/guide.module.css`
- Modify: `v2/apps/web/test/news-routes.test.tsx`
- Modify: `v2/apps/web/test/guide-routes.test.tsx`

**Interfaces:**
- Consumes: `NewsIndexModel`, `NewsDetailModel`, `GUIDES`, `GUIDE_GLOSSARY`.
- Produces: editorial ledger presentation; existing record category remains the truth for whether content is methodology or a brief.

- [ ] **Step 1: Write failing editorial-boundary tests**

```ts
it('labels the index Market Briefs without relabelling methodology records', () => {
  const markup = renderToStaticMarkup(<NewsIndexPage model={model} />);
  expect(markup).toContain('>Market Briefs</h1>');
  expect(markup).toContain('>Methodology</p>');
  expect(markup).toContain('Human approval required before publication');
});
```

- [ ] **Step 2: Run route tests and verify old headings fail**

Run: `pnpm vitest run apps/web/test/news-routes.test.tsx apps/web/test/guide-routes.test.tsx`

Expected: FAIL on the new index title and approval boundary.

- [ ] **Step 3: Implement the editorial ledger**

Render one lead record followed by a ruled list. Show market, category, published date, evidence status, headline, summary, source publisher, and detail link. Keep external source links clearly separate. Add a static operating boundary stating that publication requires human approval; do not claim nine daily briefs already exist.

- [ ] **Step 4: Implement the decision-library Guide layout**

Group the three existing guides by their real `stage`; do not render empty Buy/Invest links as documents. Keep the glossary below the guide list and use a narrow reading column on detail pages with a persistent real next-step link.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm vitest run apps/web/test/news-routes.test.tsx apps/web/test/news-evidence.test.ts apps/web/test/news-repository.test.ts apps/web/test/guide-routes.test.tsx`

Expected: PASS.

```bash
git add v2/apps/web/components/news v2/apps/web/components/guide v2/apps/web/test/news-routes.test.tsx v2/apps/web/test/guide-routes.test.tsx
git commit -m "feat(content): add market brief editorial ledger"
```

### Task 8: Apply the system to Singapore, generic market, trust, and legal routes

**Files:**
- Modify: `v2/apps/web/components/singapore/singapore.module.css`
- Modify: `v2/apps/web/components/singapore/singapore-shell.tsx`
- Modify: `v2/apps/web/components/market-hero.tsx`
- Modify: `v2/apps/web/components/market-overview-rows.tsx`
- Modify: `v2/apps/web/components/intent-decision-rows.tsx`
- Modify: `v2/apps/web/components/trust/trust.module.css`
- Modify: `v2/apps/web/components/operator/operator-page.module.css`
- Modify: `v2/apps/web/test/singapore-navigation.test.tsx`
- Modify: `v2/apps/web/test/market-overview-modernist.test.ts`
- Modify: `v2/apps/web/test/trust-routes.test.tsx`
- Modify: `v2/apps/web/test/operator-pages.test.tsx`

**Interfaces:**
- Consumes: existing market, Singapore, trust, and operator route models.
- Produces: visual consistency only; all current rights and indexability gates remain unchanged.

- [ ] **Step 1: Write failing shared-intro tests**

```ts
it('uses the compact product intro on a ready or unavailable Singapore route', () => {
  const markup = renderToStaticMarkup(<SingaporeShell model={model} />);
  expect(markup).toContain('data-product-intro="true"');
  expect(markup.match(/<h1/g) ?? []).toHaveLength(1);
});
```

- [ ] **Step 2: Run route tests and verify the new marker fails**

Run: `pnpm vitest run apps/web/test/singapore-navigation.test.tsx apps/web/test/market-overview-modernist.test.ts apps/web/test/trust-routes.test.tsx apps/web/test/operator-pages.test.tsx`

Expected: FAIL on the missing shared-intro marker.

- [ ] **Step 3: Apply shared intro and spacing**

Add `data-product-intro="true"` to the existing hero boundary. Use the same type hierarchy, section gutters, ruled rows, and deep-green evidence boundary. Do not create unavailable Singapore or Dubai anchors. Keep Privacy/Contact `noindex` and 503/empty operator behavior exactly as modeled.

- [ ] **Step 4: Run targeted tests and commit**

Run: `pnpm vitest run apps/web/test/singapore-navigation.test.tsx apps/web/test/singapore-routes.test.tsx apps/web/test/market-overview-modernist.test.ts apps/web/test/trust-routes.test.tsx apps/web/test/operator-pages.test.tsx`

Expected: PASS.

```bash
git add v2/apps/web/components/singapore v2/apps/web/components/market-hero.tsx v2/apps/web/components/market-overview-rows.tsx v2/apps/web/components/intent-decision-rows.tsx v2/apps/web/components/trust/trust.module.css v2/apps/web/components/operator/operator-page.module.css v2/apps/web/test/singapore-navigation.test.tsx v2/apps/web/test/market-overview-modernist.test.ts v2/apps/web/test/trust-routes.test.tsx v2/apps/web/test/operator-pages.test.tsx
git commit -m "feat(ui): unify global evidence pages"
```

### Task 9: Complete responsive, regression, Preview, and release verification

**Files:**
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/rankings.spec.ts`
- Modify: `v2/tests/e2e/contract-check.spec.ts`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`
- Modify: `v2/tests/e2e/korea-guide.spec.ts`
- Create: `docs/handoffs/2026-09-01-signedprice-evidence-editorial-ui-handoff.md`

**Interfaces:**
- Consumes: exact verified feature SHA.
- Produces: release evidence and a Vercel Preview URL; Production remains untouched.

- [ ] **Step 1: Add browser assertions for the full route story**

For 390px and 1440px viewports, assert one H1, zero horizontal overflow, visible focus, a 44px primary action, and no console error on: `/`, Check, Explore, Rankings, one district, one building, News index/detail, Guide index/detail, and Singapore Explore. Preserve each route's existing data-state assertions.

- [ ] **Step 2: Run the complete unit and static gates**

Run:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm check:rent-client-boundary
pnpm check:singapore-client-boundary
```

Expected: every command exits 0; the build emits the existing public route set without a new Dubai detail route.

- [ ] **Step 3: Run browser verification**

Run: `pnpm e2e`

Expected: all configured desktop/mobile projects pass. If the local Playwright browser is unavailable, record the exact blocker and perform the same route matrix against Vercel Preview with the connected browser; do not claim local E2E passed.

- [ ] **Step 4: Scan prohibited claims and unstable styling**

Run:

```bash
rg -n "guaranteed|forecast|appraisal|fair price|expected return|dummy|placeholder" apps/web --glob '*.{ts,tsx,css}'
rg -n "border-radius:\s*[1-9]|box-shadow:" apps/web --glob '*.css'
rg -n "href=\"/(sg|ae)/" apps/web --glob '*.tsx'
```

Expected: only intentional legal-boundary negatives or pre-existing, reviewed non-UI uses remain; unavailable routes are not linked.

- [ ] **Step 5: Commit verification evidence**

```bash
git add v2/tests/e2e docs/handoffs/2026-09-01-signedprice-evidence-editorial-ui-handoff.md
git commit -m "test(ui): lock evidence editorial release gates"
```

- [ ] **Step 6: Push the reviewed branch and create a Preview deployment**

Push `codex/signedprice-building-detail-preview` to its matching remote branch. Deploy the exact remote SHA as a Vercel Preview, verify its target is not Production, and record the deployment ID, SHA, route matrix, runtime logs, and temporary share URL in the handoff.

- [ ] **Step 7: Stop before Production**

Return the Preview URL and verification result to the user. Production promotion requires a separate explicit approval after visual review.

---

## Self-review result

- Spec coverage: homepage, shared shell, Check, Explore, Rankings, district, building, Briefs, Guide, Singapore/generic/trust/legal, responsive, Preview, and release gates each map to a task.
- Placeholder scan: no implementation step relies on `TBD`, `TODO`, invented content, or an undefined follow-up.
- Type consistency: all new props and helpers are defined in their producing task; later tasks consume current repository and route-model types without renaming them.
