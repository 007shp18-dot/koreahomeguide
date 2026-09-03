# Seoul Explore Mockup Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inferred Seoul Explore layout with the exact `Explore.dc.html` structure and `Map Detail Panels.dc.html` selection behavior while preserving verified evidence, URL state, and accessibility.

**Architecture:** Keep the existing server-owned `PublicAreaExploreModel` and URL selection parser. Split the client UI into a view switcher, discovery content, map workspace, and a non-modal desktop detail drawer that becomes a mobile bottom sheet. The default `split` view renders a 420 px left discovery rail and a fluid map; list, table, and map modes reuse the same evidence and URL state rather than maintaining parallel data models.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Vitest, React server rendering tests, Playwright, NAVER Maps.

**Spec:** `docs/superpowers/specs/2026-09-02-mockup-recovery-singapore-check-design.md`

> **2026-09-03 amendment:** Tasks 11–17 supersede any remaining surface-level
> work that would keep Seoul and Singapore on separate visual shells. Existing
> completed tasks remain valid only where they satisfy the shared contracts.

## Global Constraints

- `Korea Home Guide UI Mockups.zip` with SHA-256 `f7901bab66e99f4ed023aa3f863330c35fb5473554fffaa8bd15e10ddb9f2daa` is the visual source of truth.
- `signedprice - Explore.dc.html` owns the main Explore composition.
- `signedprice - Map Detail Panels.dc.html` owns selected neighborhood/building presentation.
- Default desktop split is `minmax(0, 420px) minmax(0, 1fr)` in discovery-then-map DOM order.
- A desktop selection is a 420 px drawer inside the map; a 390 px selection is a bottom sheet.
- `List`, `Table`, `Map`, and `Split` are real URL-addressable views; `Split` is the default and is omitted from the canonical query string.
- Money and evidence values come only from installed public evidence. Mockup example values never enter production.
- Median, P25–P75, percentile, and sample use the verified completed-month window capped at 12 months.
- Controls have a minimum 44 px interactive target and the 390 px viewport has no horizontal overflow.
- Unsupported proximity, physical, and contract-split facts remain explicitly unavailable.
- Preserve the current uncommitted building evidence ordering change: published rows first, then descending observation count, then Korean name and ID.

---

### Task 11: Lock shared market shell contracts

**Files:**

- Create: `v2/apps/web/components/market-ui/market-explore-shell.tsx`
- Create: `v2/apps/web/components/market-ui/market-detail-shell.tsx`
- Create: `v2/apps/web/components/market-ui/market-shell.module.css`
- Create: `v2/apps/web/test/market-shell-contract.test.tsx`

**Interfaces:**

- Produces: `MarketExploreShell`, `MarketDetailShell`, `MarketLayerControl`
- Consumes: shared evidence tokens and market-owned React regions

- [ ] Write RED SSR and CSS contract tests for 1480/420/380 geometry, DOM
  order, 44 px controls, shared type tokens, and mobile stacking.
- [ ] Implement the minimum shared shells without market copy or evidence
  logic.
- [ ] Run the focused contract test and web typecheck.
- [ ] Commit as `feat: establish shared market page shells`.

### Task 12: Migrate Seoul surfaces without changing evidence logic

**Files:**

- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/observed-building-detail.tsx`
- Modify: `v2/apps/web/app/(en)/kr/seoul/explore/[district]/[buildingId]/page.tsx`
- Modify: `v2/apps/web/app/(ko)/ko/kr/seoul/explore/[district]/[buildingId]/page.tsx`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/apps/web/test/korea-detail-mockup-contract.test.tsx`

**Interfaces:**

- Consumes: `MarketExploreShell`, `MarketDetailShell`
- Preserves: installed evidence, URL view state, drawer state, proximity state

- [ ] Add RED assertions that Seoul consumes both shared shells.
- [ ] Replace page-owned geometry with shared shell slots.
- [ ] Verify Split/List/Table/Map, district/building selection, and EN/KO.
- [ ] Commit as `refactor: move Seoul evidence onto shared shells`.

### Task 13: Migrate Singapore Explore and Detail through adapters

**Files:**

- Create: `v2/apps/web/components/singapore/singapore-explore-adapter.tsx`
- Create: `v2/apps/web/components/singapore/singapore-detail-adapter.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-explorer.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-project-detail.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-segment-detail.tsx`
- Modify: `v2/apps/web/components/singapore/hdb-town-detail.tsx`
- Modify: `v2/apps/web/components/singapore/hdb-block-detail.tsx`
- Test: `v2/apps/web/test/singapore-routes.test.tsx`

**Interfaces:**

- Consumes: shared shells plus existing URA/HDB models
- Produces: market-native rows and modules with shared geometry

- [ ] Add RED cross-market computed-style and DOM-order contracts.
- [ ] Move URA/HDB layer, results, map, and unavailable regions into the
  shared Explore slots.
- [ ] Move URA project/segment and HDB town/block evidence into the shared
  Detail slots.
- [ ] Remove superseded Singapore hero/card/layout CSS.
- [ ] Commit as `refactor: unify Singapore evidence composition`.

### Task 14: Centralize market-owned navigation

**Files:**

- Create: `v2/apps/web/lib/navigation/market-route-resolver.ts`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-shell.tsx`
- Modify: Seoul shell and breadcrumb callers
- Test: `v2/apps/web/test/market-route-isolation.test.tsx`

**Interfaces:**

- Produces: `resolveMarketNavigation({ market, locale, surface })`
- Guarantees: exact current item and same-market product routes

- [ ] Render complete Seoul and Singapore route families in a RED test.
- [ ] Implement one resolver for header, footer, breadcrumbs, and return URLs.
- [ ] Assert no opposite-market product link while preserving the intentional
  upper market switcher.
- [ ] Commit as `fix: isolate market-owned navigation`.

### Task 15: Complete Singapore Check UI and route model

**Files:**

- Create: `v2/apps/web/lib/singapore/check-route-model.server.ts`
- Modify: `v2/apps/web/components/singapore/singapore-check-workspace.tsx`
- Modify: `v2/apps/web/app/(en)/sg/singapore/check/page.tsx`
- Test: `v2/apps/web/test/singapore-check-route-model.test.ts`
- Test: `v2/apps/web/test/singapore-check-workspace.test.tsx`

**Interfaces:**

- Consumes: the three independent Check repositories and check engine
- Produces: URL-addressable single/A-B modes and native market forms

- [ ] Add RED tests for all three forms, invalid/unavailable/insufficient/ready
  results, same-market comparison, and cross-market neutral trade-off.
- [ ] Parse prefixed A/B query fields strictly on the server.
- [ ] Derive option catalogs server-side without exposing raw records.
- [ ] Render native fields, recent window, scope fallback, P25/median/P75,
  percentile, sample, and sources.
- [ ] Commit as `feat: complete Singapore Check workflow`.

### Task 16: Verify visual parity and all navigation

**Files:**

- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Create: `v2/tests/e2e/singapore-explore-check.spec.ts`
- Modify: browser fixture configuration only through scoped fixture paths

- [ ] Verify Seoul and Singapore at 390, 720, 1440, and wide desktop.
- [ ] Assert matching shell geometry, zero overflow, 44 px targets, and exact
  current navigation.
- [ ] Submit representative single and A/B Singapore Check queries.
- [ ] Run full Vitest, typecheck, lint, build, client-boundary scans, and full
  Playwright collection/execution.
- [ ] Commit as `test: verify unified market experience`.

### Task 17: Release without activating unverified proximity data

**Files:**

- Modify release notes and reports only when generated by verified commands.

- [ ] Push the reviewed branch and open/update the PR.
- [ ] Verify the exact head SHA in CI and Preview.
- [ ] Merge only with all gates green.
- [ ] Verify Production routes, metadata, navigation, and representative
  interactions on the merge SHA.
- [ ] Keep `kr-proximity` absent until official coordinate sources and the
  public provenance descriptor pass their independent activation review.

## File structure

| File | Responsibility |
| --- | --- |
| `v2/apps/web/components/evidence-ui/evidence-ui.module.css` | Own archive-derived typography, spacing, rule, and control primitives |
| `v2/apps/web/components/evidence-ui/section-heading.tsx` | Render one reusable eyebrow/title/source heading pattern |
| `v2/apps/web/components/evidence-ui/segmented-control.tsx` | Render one reusable navigation/control pattern with 44 px targets |
| `v2/apps/web/test/evidence-ui-contract.test.tsx` | Prevent duplicate token values and visual-role drift |
| `v2/apps/web/components/public-market/area-explorer.tsx` | Own URL-aware Explore state and compose the four views |
| `v2/apps/web/components/public-market/area-explorer-view-switcher.tsx` | Render the four accessible view links |
| `v2/apps/web/components/public-market/area-building-drawer.tsx` | Render desktop selection drawer/mobile bottom sheet and restore focus |
| `v2/apps/web/components/public-market/area-explorer.module.css` | Implement archive-derived spacing, type scale, split geometry, drawer, and responsive behavior |
| `v2/apps/web/lib/navigation/explorer-selection.ts` | Continue validating and serializing `ExplorerView` URL state |
| `v2/apps/web/test/public-area-explorer.test.tsx` | Lock SSR structure, view URLs, evidence ordering, and CSS geometry |
| `v2/apps/web/test/area-building-drawer.test.tsx` | Lock drawer semantics, escape behavior, and focus restoration |
| `v2/tests/e2e/area-explore.spec.ts` | Verify real browser geometry, interaction, URL state, and mobile containment |

### Task 0: Establish the shared evidence composition system

**Files:**

- Create: `v2/apps/web/components/evidence-ui/evidence-ui.module.css`
- Create: `v2/apps/web/components/evidence-ui/section-heading.tsx`
- Create: `v2/apps/web/components/evidence-ui/segmented-control.tsx`
- Create: `v2/apps/web/test/evidence-ui-contract.test.tsx`
- Modify: `v2/apps/web/app/globals.css`

**Interfaces:**

- Consumes: archive typography, spacing, frame, border, and active-state values
- Produces: `EvidenceSectionHeading`, `SegmentedControl<T>`, and shared `--evidence-*`/`--space-*` tokens for Explore and Detail

- [ ] **Step 1: Write the shared component behavior contract test**

```ts
const markup = renderToStaticMarkup(<SegmentedControl
  label="Explorer view"
  value="split"
  items={[
    { value: 'list', label: 'List', href: '/explore/?view=list' },
    { value: 'split', label: 'Split', href: '/explore/' },
  ]}
/>);
expect(markup).toContain('aria-label="Explorer view"');
expect(markup).toContain('aria-current="page"');
expect(markup).toContain('href="/explore/?view=list"');
expect(markup).toContain('href="/explore/"');

const heading = renderToStaticMarkup(<EvidenceSectionHeading
  eyebrow="01 / Evidence"
  title="Reported contracts"
  source="MOLIT"
/>);
expect(heading.indexOf('01 / Evidence')).toBeLessThan(heading.indexOf('Reported contracts'));
expect(heading.indexOf('Reported contracts')).toBeLessThan(heading.indexOf('MOLIT'));
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `cd v2 && pnpm vitest run apps/web/test/evidence-ui-contract.test.tsx`

Expected: FAIL because the shared tokens and primitives do not exist.

- [ ] **Step 3: Add the archive-derived tokens without changing legacy token values**

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --evidence-type-label: 10px;
  --evidence-type-caption: 12px;
  --evidence-type-ui: 13px;
  --evidence-type-body: 15px;
  --evidence-type-section: 19px;
  --evidence-type-subhead: 25px;
  --evidence-type-page: 42px;
  --evidence-type-editorial: 54px;
  --evidence-reading-frame: 760px;
  --evidence-content-frame: 1120px;
  --evidence-workspace-frame: 1480px;
  --evidence-page-gutter: 40px;
  --evidence-page-gutter-mobile: 20px;
}
```

Do not replace existing site-wide frame or hero tokens in this task; migration occurs surface by surface.

- [ ] **Step 4: Implement one section heading and one generic segmented control**

```tsx
export function EvidenceSectionHeading({ eyebrow, title, source }: Readonly<{
  eyebrow: string;
  title: string;
  source?: string;
}>) {
  return <header className={styles.sectionHeading}>
    <p>{eyebrow}</p><h2>{title}</h2>{source ? <small>{source}</small> : null}
  </header>;
}

export function SegmentedControl<T extends string>({ label, value, items }: Readonly<{
  label: string;
  value: T;
  items: readonly Readonly<{ value: T; label: string; href: string }>[];
}>) {
  return <nav className={styles.segmentedControl} aria-label={label}>
    {items.map((item) => <Link key={item.value} href={item.href}
      aria-current={item.value === value ? 'page' : undefined}>{item.label}</Link>)}
  </nav>;
}
```

- [ ] **Step 5: Encode shared appearance only in the primitive module**

```css
.sectionHeading p,
.sectionHeading small {
  font-size: var(--evidence-type-label);
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.sectionHeading h2 {
  font-size: var(--evidence-type-section);
  letter-spacing: -.03em;
}
.segmentedControl { display: flex; border: var(--rule-strong); }
.segmentedControl a {
  min-height: 44px;
  padding-inline: var(--space-4);
  display: inline-grid;
  place-items: center;
  border-right: var(--rule-default);
  font-size: var(--evidence-type-ui);
  font-weight: 800;
}
.segmentedControl a[aria-current='page'] { color: var(--canvas); background: var(--ink); }
```

Actual size, tracking, border, and spacing behavior is verified with computed styles after Explore consumes the primitive in Tasks 2–5. Do not add source-text assertions for CSS variables.

- [ ] **Step 6: Run the contract test and typecheck**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/evidence-ui-contract.test.tsx
pnpm --filter @signedprice/web typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the design-system foundation**

```bash
git add v2/apps/web/app/globals.css v2/apps/web/components/evidence-ui v2/apps/web/test/evidence-ui-contract.test.tsx
git commit -m "feat: establish shared evidence UI tokens"
```

### Task 1: Lock the archive structure in failing tests

**Files:**

- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**

- Consumes: `ExplorerSelection.view: 'split' | 'list' | 'table' | 'map'`
- Produces: executable DOM and geometry contracts used by Tasks 2–5

- [ ] **Step 1: Replace the incorrect one-workspace assertions with the four-view contract**

```ts
expect(markup).toContain('aria-label="Explorer view"');
expect(markup).toContain('data-explore-view="split"');
for (const view of ['List', 'Table', 'Map', 'Split']) {
  expect(markup).toMatch(new RegExp(`>${view}</a>`));
}
expect(markup.indexOf('data-explorer-region="results"'))
  .toBeLessThan(markup.indexOf('data-explorer-region="map"'));
```

- [ ] **Step 2: Add exact view URL assertions**

```ts
expect(splitHref).toBe('/kr/seoul/explore/?district=gangnam-gu');
expect(listHref).toBe('/kr/seoul/explore/?district=gangnam-gu&view=list');
expect(tableHref).toBe('/kr/seoul/explore/?district=gangnam-gu&view=table');
expect(mapHref).toBe('/kr/seoul/explore/?district=gangnam-gu&view=map');
```

- [ ] **Step 3: Replace centered-modal expectations with selection-drawer expectations**

```ts
expect(markup).toContain('data-building-drawer="gangnam-evidence-tower"');
expect(markup).toContain('data-selection-presentation="map-drawer"');
expect(markup).not.toContain('aria-modal="true"');
expect(markup).not.toContain('data-building-dialog=');
```

- [ ] **Step 4: Add browser geometry assertions for desktop split and selected drawer**

```ts
expect(Math.abs(resultsBox!.width - 420)).toBeLessThanOrEqual(2);
expect(mapBox!.x).toBeGreaterThanOrEqual(resultsBox!.x + resultsBox!.width - 2);
expect(Math.abs(drawerBox!.width - 420)).toBeLessThanOrEqual(2);
expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(mapBox!.x + mapBox!.width + 2);
```

- [ ] **Step 5: Run focused tests and verify RED**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/public-area-explorer.test.tsx
pnpm exec playwright test tests/e2e/area-explore.spec.ts --list
```

Expected: Vitest fails on missing switcher, incorrect DOM order, and modal selection. Playwright collection succeeds.

- [ ] **Step 6: Commit the RED contract**

```bash
git add v2/apps/web/test/public-area-explorer.test.tsx v2/tests/e2e/area-explore.spec.ts
git commit -m "test: lock supplied Explore mockup structure"
```

### Task 2: Restore URL-addressable view switching

**Files:**

- Create: `v2/apps/web/components/public-market/area-explorer-view-switcher.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`

**Interfaces:**

- Consumes: `ExplorerView`, current `ExplorerSelection`, and `(view: ExplorerView) => string`
- Produces: `AreaExplorerViewSwitcher` and `createExploreViewHref(view)` integration

- [ ] **Step 1: Add the switcher component with a typed contract**

```tsx
import type { ExplorerView } from '../../lib/navigation/explorer-selection';

export type AreaExplorerViewSwitcherProps = Readonly<{
  current: ExplorerView;
  hrefFor: (view: ExplorerView) => string;
  locale: 'en' | 'ko';
}>;

export function AreaExplorerViewSwitcher({ current, hrefFor, locale }: AreaExplorerViewSwitcherProps) {
  const labels = locale === 'ko'
    ? { list: '목록', table: '표', map: '지도', split: '분할' }
    : { list: 'List', table: 'Table', map: 'Map', split: 'Split' };
  return <SegmentedControl label="Explorer view" value={current}
    items={(['list', 'table', 'map', 'split'] as const).map((view) => ({
      value: view, label: labels[view], href: hrefFor(view),
    }))} />;
}
```

- [ ] **Step 2: Extend the existing evidence URL builder to accept a view**

```ts
const evidenceHref = useCallback((changes: Readonly<{
  transaction?: 'sale' | 'jeonse' | 'monthly';
  area?: ExplorerArea;
  propertyType?: string;
  view?: ExplorerView;
}> = Object.freeze({})): string => createSelectionHref('/kr/seoul/explore/', {
  ...initialSelection,
  view: changes.view ?? currentView,
  // existing evidence selections remain unchanged
}, { market: 'kr', transaction: 'jeonse' }), [/* existing dependencies plus currentView */]);
```

- [ ] **Step 3: Resolve the current view once and render the switcher before the view body**

```tsx
const currentView: ExplorerView = initialSelection.view ?? 'split';

<AreaExplorerViewSwitcher
  current={currentView}
  hrefFor={(view) => evidenceHref({ view })}
  locale={locale}
/>
<div data-explore-view={currentView}>{/* Task 3 supplies the view body */}</div>
```

- [ ] **Step 4: Run the focused SSR tests**

Run: `cd v2 && pnpm vitest run apps/web/test/public-area-explorer.test.tsx`

Expected: view labels, `aria-current`, and exact URLs pass; layout and drawer assertions remain RED.

- [ ] **Step 5: Commit the view switcher**

```bash
git add v2/apps/web/components/public-market/area-explorer-view-switcher.tsx v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/test/public-area-explorer.test.tsx
git commit -m "feat: restore Explore view switching"
```

### Task 3: Recompose Split, List, Table, and Map from one evidence model

**Files:**

- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`

**Interfaces:**

- Consumes: `currentView`, `model.districts`, `filteredBuildings`, existing selection callbacks, and `NaverDistrictMap`
- Produces: mutually exclusive `[data-explore-view]` layouts with shared filters and evidence

- [ ] **Step 1: Put discovery before map in the Split DOM and remove the redundant coverage/article blocks from inside the workspace**

```tsx
<div className={styles.workspace} data-explorer-layout="split">
  <aside className={styles.discoveryRail} data-explorer-region="results">
    {discoveryContent}
  </aside>
  <section className={styles.mapPanel} data-explorer-region="map">
    {mapContent}
  </section>
</div>
```

- [ ] **Step 2: Render the four modes from the same prepared content**

```tsx
{currentView === 'split' ? splitView : null}
{currentView === 'list' ? <section data-explorer-layout="list">{buildingList}</section> : null}
{currentView === 'table' ? <section data-explorer-layout="table">{districtTable}</section> : null}
{currentView === 'map' ? <section data-explorer-layout="map">{mapContent}</section> : null}
```

The list mode contains the compact result list, table mode contains a building-evidence table, and map mode contains the map, legend, and selected summary. The shared filter/result toolbar remains directly above every mode. Keep the 25-district directory available in discovery controls for SSR and navigation, but do not repeat it as a giant table below the workspace. Do not duplicate calculation or filtering state.

- [ ] **Step 3: Apply the supplied desktop split geometry and type scale**

```css
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  min-height: 640px;
  border-block: var(--rule-strong);
}
```

- [ ] **Step 4: Reduce emphasis to the archive token hierarchy**

Remove the entire independent hero and the four-cell market tape. Put the accessible Explore heading, period, selected scope, result count, and publication limit in the compact toolbar/result line where `Explore.dc.html` places them. Keep orange to active accents and warnings.

- [ ] **Step 5: Preserve evidence ordering in the building rows**

```ts
const filteredBuildings = useMemo(
  () => [...filterExploreBuildings(/* existing arguments */)]
    .sort(compareExploreBuildingsByEvidence),
  [/* existing dependencies */],
);
```

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/explorer-selection.test.ts
pnpm --filter @signedprice/web typecheck
```

Expected: all view and geometry source assertions pass; drawer assertions remain RED.

- [ ] **Step 7: Commit the four view layouts**

```bash
git add v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/test/public-area-explorer.test.tsx
git commit -m "feat: match supplied Explore workspace"
```

### Task 4: Replace the centered modal with a map-owned drawer

**Files:**

- Create: `v2/apps/web/components/public-market/area-building-drawer.tsx`
- Create: `v2/apps/web/test/area-building-drawer.test.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Remove: `v2/apps/web/components/public-market/area-building-dialog.tsx`

**Interfaces:**

- Consumes: selected building identity, detail href, locale, close callback, and existing `BuildingEvidencePanel`
- Produces: `AreaBuildingDrawer`, `[data-building-drawer]`, Escape dismissal, and trigger focus restoration

- [ ] **Step 1: Write drawer SSR semantics tests and keep keyboard interaction in Playwright**

```tsx
const markup = renderToStaticMarkup(createElement(AreaBuildingDrawer, {
  building,
  detailHref: '/detail/',
  locale: 'en',
  onClose: () => undefined,
  children: createElement('p', null, 'Verified evidence'),
}));
expect(markup).toContain('role="complementary"');
expect(markup).toContain('data-selection-presentation="map-drawer"');
expect(markup).toContain('Open full building evidence');
expect(markup).not.toContain('aria-modal');
```

- [ ] **Step 2: Implement a non-modal complementary drawer**

```tsx
<aside
  ref={drawerRef}
  className={styles.buildingDrawer}
  aria-labelledby={titleId}
  data-building-drawer={building.id}
  data-selection-presentation="map-drawer"
>
  <header>{/* identity and close button */}</header>
  <div className={styles.buildingDrawerBody}>{children}</div>
  <footer><Link href={detailHref}>Open full building evidence</Link></footer>
</aside>
```

Add an Escape listener and restore focus to the element active before mount. Do not lock `document.body`, do not render a dark viewport backdrop, and do not trap focus on desktop.

The existing Playwright building-selection test must press Escape, assert drawer removal and URL cleanup, and assert focus returns to the trigger. This repository does not install a DOM component-test library, so real browser behavior is the interaction contract.

- [ ] **Step 3: Mount the drawer as the last child of the map panel**

```tsx
<section className={styles.mapPanel} data-explorer-region="map">
  {mapContent}
  {selectedBuilding && selectedBuildingDetailHref ? (
    <AreaBuildingDrawer /* existing identity and callbacks */>
      <NaverBuildingStreetView /* existing source-safe props */ />
      <BuildingEvidencePanel building={selectedBuilding} locale={locale} />
    </AreaBuildingDrawer>
  ) : null}
</section>
```

- [ ] **Step 4: Apply exact desktop and mobile presentation rules**

```css
.mapPanel { position: relative; min-width: 0; overflow: hidden; }
.buildingDrawer {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: 5;
  width: min(420px, 100%);
  overflow-y: auto;
  border-left: var(--rule-strong);
  background: var(--area-ground);
}

@media (max-width: 720px) {
  .buildingDrawer {
    position: fixed;
    inset: auto 0 0;
    width: 100%;
    max-height: 72dvh;
    border-top: var(--rule-strong);
    border-left: 0;
  }
}
```

- [ ] **Step 5: Run drawer and Explore tests**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/area-building-drawer.test.tsx apps/web/test/public-area-explorer.test.tsx
pnpm --filter @signedprice/web typecheck
```

Expected: all tests pass, with no centered modal markers.

- [ ] **Step 6: Commit the drawer replacement**

```bash
git add v2/apps/web/components/public-market/area-building-drawer.tsx v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/test/area-building-drawer.test.tsx v2/apps/web/test/public-area-explorer.test.tsx
git add -u v2/apps/web/components/public-market/area-building-dialog.tsx
git commit -m "feat: open Explore evidence in a map drawer"
```

### Task 5: Match narrow-width behavior without hiding evidence

**Files:**

- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**

- Consumes: the four view layouts and `AreaBuildingDrawer`
- Produces: 390 px containment, bottom-sheet selection, 44 px controls, and restorable URL state

- [ ] **Step 1: Replace the permanent 64dvh discovery overlay with view-aware narrow layouts**

```css
@media (max-width: 720px) {
  .workspace { display: grid; grid-template-columns: minmax(0, 1fr); }
  .discoveryRail { position: static; max-height: none; border-left: 0; }
  .mapPanel { min-height: 480px; }
  [data-explore-view='split'] .mapPanel { min-height: 56dvh; }
}
```

- [ ] **Step 2: Assert mobile sheet geometry and retained selection state**

```ts
const sheet = page.locator('[data-selection-presentation="map-drawer"]');
const style = await sheet.evaluate((element) => {
  const computed = getComputedStyle(element);
  return { position: computed.position, bottom: computed.bottom, width: element.getBoundingClientRect().width };
});
expect(style.position).toBe('fixed');
expect(style.bottom).toBe('0px');
expect(Math.abs(style.width - 390)).toBeLessThanOrEqual(1);
```

- [ ] **Step 3: Verify all switcher and drawer controls are touch-safe**

Use the existing `expectTouchTarget` helper for all four view links, close, full detail, transaction filters, and active scope controls.

- [ ] **Step 4: Run the local browser spec at desktop and mobile**

Run:

```bash
cd v2
pnpm exec playwright test tests/e2e/area-explore.spec.ts --project=desktop-chromium --project=mobile-chromium
```

Expected: split rail is 420 px on desktop, bottom sheet is viewport width on mobile, all views round-trip through URLs, and both viewports have zero horizontal overflow.

- [ ] **Step 5: Commit responsive recovery**

```bash
git add v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/test/public-area-explorer.test.tsx v2/tests/e2e/area-explore.spec.ts
git commit -m "fix: match Explore mobile sheet behavior"
```

### Task 6: Verify visual parity and repository safety

**Files:**

- Modify only if a verification failure identifies a defect in a file owned by Tasks 2–5

**Interfaces:**

- Consumes: completed Explore recovery
- Produces: a reviewable commit series and objective verification evidence

- [ ] **Step 1: Inspect the complete diff for unrelated changes**

Run:

```bash
git status --short
git diff origin/main...HEAD -- v2/apps/web/components/public-market v2/apps/web/test/public-area-explorer.test.tsx v2/apps/web/test/area-building-drawer.test.tsx v2/tests/e2e/area-explore.spec.ts
```

Expected: only Explore recovery files and the previously preserved evidence-order comparator are present in the product diff.

- [ ] **Step 2: Run focused unit and E2E collection gates**

```bash
cd v2
pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/area-building-drawer.test.tsx apps/web/test/explorer-selection.test.ts
pnpm exec playwright test --list
```

Expected: all focused tests pass and the complete Playwright suite collects without a loader error.

- [ ] **Step 3: Run the complete repository gate**

```bash
cd v2
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:korea-proximity-client-boundary
```

Expected: every command exits 0.

- [ ] **Step 4: Run the full Chromium gate**

Run: `cd v2 && pnpm e2e`

Expected: all required desktop, mobile, tablet, and wide projects pass; policy skips remain unchanged.

- [ ] **Step 5: Compare rendered pages against the archive at reference widths**

At 1480 px and 390 px, verify:

- heading scale and whitespace are visibly within the supplied hierarchy
- Split order is discovery then map
- discovery width is 420 px at desktop
- selected evidence is a right drawer, not a centered modal
- orange appears only as an accent/warning
- no page or element causes horizontal overflow
- values and unavailable states match installed evidence rather than mockup example numbers

- [ ] **Step 6: Record the verified head and keep PR #77 blocked until independent review**

Run:

```bash
git rev-parse HEAD
git status --short
```

Expected: a clean planned file set and an exact SHA ready for the Detail recovery gate; do not merge from this step.

### Task 7: Recover District and Building Detail from `Detail View.dc.html`

**Files:**

- Modify: `v2/apps/web/components/evidence-ui/section-heading.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail.module.css`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/components/public-market/building-decision-views.tsx`
- Modify: `v2/apps/web/components/public-market/building-evidence-details.tsx`
- Test: `v2/apps/web/test/evidence-ui-contract.test.tsx`
- Test: `v2/apps/web/test/public-district-detail.test.tsx`
- Test: `v2/apps/web/test/public-building-detail.test.tsx`
- Test: `v2/tests/e2e/korea-detail.spec.ts`

**Interfaces:**

- Consumes: existing district/building route models and the shared evidence typography tokens
- Produces: a fluid evidence column plus a 380 px context rail, 38 px identity headings, shared 19 px section headings, and 390 px single-column containment

- [x] Move district breadcrumb and identity into the main evidence column so the context rail begins at the top of the supplied two-column shell.
- [x] Split district identity into a restrained 38 px title block and a 300 px evidence metric block; do not put a full finding sentence in the H1.
- [x] Reuse `EvidenceSectionHeading` for repeated section-heading roles and add an optional heading id for existing `aria-labelledby` contracts.
- [x] Align Building Detail typography, padding, metric grids, and frames to the same shared tokens without inventing fields absent from its server model.
- [ ] Verify computed 380 px rail geometry, desktop heading size, mobile single-column flow, 44 px targets, and zero horizontal overflow in Chromium.
- [x] Run district/building focused tests, full Vitest, typecheck, lint, production build, and collect the full `korea-detail.spec.ts` matrix before review.
- [ ] Run the full `korea-detail.spec.ts` matrix in the repository's fixed Chromium environment before visual approval.

### Task 8: Build the Singapore Check evidence foundation

**Files:**

- Create: `v2/packages/singapore-property/src/check-artifact.ts`
- Create: `v2/packages/singapore-property/src/check-engine.ts`
- Modify: `v2/packages/singapore-property/src/index.ts`
- Create: `v2/packages/singapore-property/test/check-artifact.test.ts`
- Create: `v2/packages/singapore-property/test/check-engine.test.ts`
- Create: `v2/apps/web/lib/singapore/check-evidence-repository.server.ts`
- Create: `v2/apps/web/test/singapore-check-repository.test.ts`
- Create: `v2/scripts/build-singapore-check-snapshots.mts`

**Interfaces:**

- Consumes: verified URA private-sale records and raw HDB resale/rental records
- Produces: three independently signed Check artifacts, strict server-only repositories, and neutral single/A-B evaluation results

- [x] RED: lock exact artifact keys, digest rejection, per-market independence, maximum 12-month filtering, year-boundary behavior, P25/median/P75, percentile, five-record minimum, and explicit scope fallback.
- [x] Build one market-specific artifact contract for `ura-private-sale`, `hdb-resale`, and `hdb-rent`; one valid artifact must not make either other market ready.
- [x] Retain only filtering/calculation fields, source identifier, exact available period, row count, schema version, generated time, and digest.
- [x] Evaluate offers only inside the selected completed-month window; never widen time for sparse evidence and never infer conversion, finance, tax, lease decay, or future value.
- [x] Build strict Check-only server loaders. Do not read the public Explore/HDB summary repository as a substitute.
- [x] Add a builder that derives the three artifacts from verified raw source snapshots without committing synthetic data as production evidence.
- [x] Run package/server focused tests, full Vitest, typecheck, and lint before exposing any route.

### Task 9: Add the native Singapore Check product

**Files:**

- Create: `v2/apps/web/lib/singapore/check-route-model.server.ts`
- Create: `v2/apps/web/lib/singapore/check-metadata.server.ts`
- Create: `v2/apps/web/components/singapore/singapore-check-workspace.tsx`
- Create: `v2/apps/web/components/singapore/singapore-check.module.css`
- Create: `v2/apps/web/app/(en)/sg/singapore/check/page.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-shell.tsx`
- Test: `v2/apps/web/test/singapore-check-route.test.tsx`
- Test: `v2/apps/web/test/singapore-routes.test.tsx`

**Interfaces:**

- Consumes: three independent Check repositories plus validated URL form state
- Produces: Singapore-owned single/A-B route with URA private sale, HDB resale, and HDB rent native forms

- [ ] RED: lock empty, invalid, insufficient, ready, same-market A/B, and cross-market A/B states plus self-owned navigation and metadata.
- [ ] Reuse global evidence typography, spacing, frame, section-heading, segmented-control, unavailable-state, and result patterns instead of redefining them.
- [ ] Keep A, B, and Result in reading order; show native SGD amounts side by side and return a neutral trade-off for cross-market pairs.
- [ ] Keep metadata `noindex, nofollow` for every state until production evidence and the full browser gate pass.
- [ ] Expose Singapore Check in the Singapore header/footer only after the route and fail-closed loader exist; assert no `/kr/seoul/*` link is emitted.

### Task 10: Verify and release Singapore Check

- [ ] Inject deterministic URA/HDB Check fixtures through Check-only environment inputs without replacing Explore or HDB page fixtures.
- [ ] Submit all three single-market forms and representative same/cross-market A/B combinations at desktop, mobile, tablet, and wide viewports.
- [ ] Verify 390 px containment, 44 px targets, exact month labels, neutral trade-off copy, source boundaries, and zero opposite-market links.
- [ ] Run full Vitest, typecheck, lint, production build, Singapore client-boundary scan, complete Playwright collection, and fixed-Chromium suite.
- [ ] Review the exact diff and deployment SHA before enabling any indexability or production navigation.
