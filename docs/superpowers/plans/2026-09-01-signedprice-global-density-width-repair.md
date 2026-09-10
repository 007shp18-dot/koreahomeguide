# SignedPrice Global Density and Width Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove viewport-spanning empty layouts and give Home, intent, evidence, Rankings, Check, Detail, and Singapore pages consistent readable frames, typography, and rule density.

**Architecture:** Add three global frame tokens (`reading`, `standard`, `workspace`) and make every page declare one. Full-bleed backgrounds remain possible, but internal grids are centred and bounded. Existing components and data contracts remain unchanged; this release is a layout-only P0 that can ship before the data-foundation work.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, CSS Modules, global CSS tokens, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-korea-singapore-data-foundation-design.md`

## Global Constraints

- `reading` maximum is exactly `760px`.
- `standard` maximum is exactly `1120px`.
- `workspace` maximum is exactly `1320px`.
- Mobile, tablet, and desktop gutters are `20px`, `24px`, and `32px` per side.
- Only Explore and data-dense Detail may use `workspace` by default.
- Check uses a maximum `1040px` working surface.
- `2px` rules are reserved for page and major section boundaries.
- `1px solid var(--divider)` separates components.
- `1px solid var(--line)` separates rows and cells.
- No raw `100vw` width controls an internal content grid.
- No data, routes, labels, source periods, or evidence decisions change in this release.
- Internal source links continue to end in `/` where the current route contract requires it.

---

### Task 1: Establish the three-frame global contract

**Files:**
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/apps/web/test/design-tokens.test.ts`

**Interfaces:**
- Consumes: existing `:root`, `.site-shell`, and header frame rules
- Produces: `--reading-frame`, `--content-frame`, `--workspace-frame`, `--page-gutter`, `.reading-shell`, `.site-shell`, and `.workspace-shell`

- [ ] **Step 1: Write the failing token and shell tests**

Replace the old `1240px` and `1440px` expectations and add exact shell declarations:

```ts
expect(css).toMatch(/--reading-frame:\s*760px;/);
expect(css).toMatch(/--content-frame:\s*1120px;/);
expect(css).toMatch(/--workspace-frame:\s*1320px;/);
expect(css).toMatch(/--page-gutter:\s*32px;/);
expect(declarationsFor(css, '.reading-shell')).toMatchObject({
  width: 'min(calc(100% - (2 * var(--page-gutter))), var(--reading-frame))',
  'margin-inline': 'auto',
});
expect(declarationsFor(css, '.site-shell')).toMatchObject({
  width: 'min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))',
  'margin-inline': 'auto',
});
expect(declarationsFor(css, '.workspace-shell')).toMatchObject({
  width: 'min(calc(100% - (2 * var(--page-gutter))), var(--workspace-frame))',
  'margin-inline': 'auto',
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `pnpm vitest run apps/web/test/design-tokens.test.ts` from `v2/`  
Expected: FAIL because the current values are `1240px` and `1440px` and the new shell classes do not exist.

- [ ] **Step 3: Implement the global frame tokens and responsive gutters**

Use these exact declarations in `globals.css`:

```css
:root {
  --reading-frame: 760px;
  --content-frame: 1120px;
  --workspace-frame: 1320px;
  --site-width: var(--content-frame);
  --page-gutter: 32px;
}

.reading-shell,
.site-shell,
.workspace-shell {
  margin-inline: auto;
}

.reading-shell {
  width: min(calc(100% - (2 * var(--page-gutter))), var(--reading-frame));
}

.site-shell {
  width: min(calc(100% - (2 * var(--page-gutter))), var(--content-frame));
}

.workspace-shell {
  width: min(calc(100% - (2 * var(--page-gutter))), var(--workspace-frame));
}

@media (max-width: 980px) {
  :root { --page-gutter: 24px; }
}

@media (max-width: 720px) {
  :root { --page-gutter: 20px; }
}
```

Update `.site-header__inner` to consume the same gutter expression instead of a separate hard-coded `48px` subtraction.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `pnpm vitest run apps/web/test/design-tokens.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the frame contract**

```bash
git add v2/apps/web/app/globals.css v2/apps/web/test/design-tokens.test.ts
git commit -m "style: add bounded global content frames"
```

### Task 2: Contain and compact the homepage

**Files:**
- Modify: `v2/apps/web/components/home-editorial.module.css`
- Modify: `v2/apps/web/test/home-layout.test.ts`

**Interfaces:**
- Consumes: global `--content-frame`, `--page-gutter`, rule, color, and type tokens
- Produces: bounded Home hero, live evidence strip, decision grid, Explore preview, briefs, and trust boundary

- [ ] **Step 1: Write failing Home layout assertions**

Add a helper that extracts CSS declarations and assert:

```ts
expect(declarationsFor(css, '.heroGrid').width)
  .toBe('min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))');
expect(declarationsFor(css, '.heroGrid')['margin-inline']).toBe('auto');
expect(declarationsFor(css, '.liveStrip').width)
  .toBe('min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))');
expect(declarationsFor(css, '.exploreSection').width)
  .toBe('min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))');
expect(declarationsFor(css, '.exploreSection')['min-height']).toBe('540px');
expect(declarationsFor(css, '.exploreSection')['grid-template-columns'])
  .toBe('minmax(0, 1.16fr) minmax(320px, .84fr)');
```

Also reject any internal Home grid rule containing `100vw`.

- [ ] **Step 2: Run the Home layout test and confirm RED**

Run: `pnpm vitest run apps/web/test/home-layout.test.ts`  
Expected: FAIL because the Home structural sections currently span the viewport.

- [ ] **Step 3: Bound the primary Home sections**

Apply the shared frame declaration to `.heroGrid`, `.liveStrip`, `.decisionSection`, `.exploreSection`, `.briefSection`, and `.trustBoundary`:

```css
.heroGrid,
.liveStrip,
.decisionSection,
.exploreSection,
.briefSection,
.trustBoundary {
  width: min(calc(100% - (2 * var(--page-gutter))), var(--content-frame));
  margin-inline: auto;
}
```

Keep full-bleed background color on the outer `.hero` or page canvas, not by widening the internal grid. Replace the viewport-derived left padding in `.heroCopy`, `.decisionSection`, `.briefSection`, and `.trustBoundary` with bounded component padding using `clamp(24px, 4vw, 56px)`.

- [ ] **Step 4: Reduce oversized empty Home regions**

Use:

```css
.heroGrid { min-height: 590px; }
.exploreSection {
  min-height: 540px;
  grid-template-columns: minmax(0, 1.16fr) minmax(320px, .84fr);
}
.exploreCopy { padding: clamp(32px, 4vw, 56px); }
.decisionGrid article,
.briefLedger article { min-height: 250px; }
```

Keep the five evidence metrics compact. The methodology action remains the final auto-width cell and must wrap below the metrics before any label or value clips.

- [ ] **Step 5: Run Home tests**

Run: `pnpm vitest run apps/web/test/home-layout.test.ts apps/web/test/home-content.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit the Home repair**

```bash
git add v2/apps/web/components/home-editorial.module.css v2/apps/web/test/home-layout.test.ts
git commit -m "style: contain homepage editorial sections"
```

### Task 3: Repair intent capability rows and status placement

**Files:**
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/apps/web/test/intent-compare-modernist.test.ts`

**Interfaces:**
- Consumes: `.intent-decision`, `.intent-decision-row`, and existing semantic row markup
- Produces: a centred standard frame with adjacent status labels and no right-edge clipping

- [ ] **Step 1: Write the failing contained-frame test**

Add:

```ts
expect(declarationsFor(css, '.intent-decision.site-shell')).toMatchObject({
  width: 'min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))',
  margin: '24px auto 0',
  padding: '0',
});
expect(declarationsFor(css, '.intent-decision-row__summary')).toMatchObject({
  'grid-template-columns': 'minmax(0, 1fr) minmax(96px, max-content)',
});
expect(declarationsFor(css, '.intent-decision-row__items li')).toMatchObject({
  'grid-template-columns': 'minmax(0, 1fr) minmax(96px, max-content)',
});
```

- [ ] **Step 2: Run the intent test and confirm RED**

Run: `pnpm vitest run apps/web/test/intent-compare-modernist.test.ts`  
Expected: FAIL because `.intent-decision.site-shell` currently overrides the shell to full width.

- [ ] **Step 3: Remove the full-width override**

Set the exact bounded width and margin from Step 1. Keep row labels at `220px` maximum, reduce content horizontal padding to `24px`, and set the summary/item status columns to `minmax(96px, max-content)`. Status labels use `justify-self: end` and never use absolute positioning.

- [ ] **Step 4: Run the intent and route-model tests**

Run: `pnpm vitest run apps/web/test/intent-compare-modernist.test.ts apps/web/test/route-model.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the capability repair**

```bash
git add v2/apps/web/app/globals.css v2/apps/web/test/intent-compare-modernist.test.ts
git commit -m "style: contain market capability rows"
```

### Task 4: Compact source and methodology disclosures

**Files:**
- Modify: `v2/apps/web/components/public-market/public-market.module.css`
- Modify: `v2/apps/web/components/trust/trust.module.css`
- Modify: `v2/apps/web/test/public-source-boundary.test.tsx`
- Modify: `v2/apps/web/test/trust-components.test.tsx`

**Interfaces:**
- Consumes: `PublicSourceBoundary` and `EvidenceDisclosure` markup without changing their evidence models
- Produces: centred source boundaries, four-column disclosure metadata, and three-column dataset metadata

- [ ] **Step 1: Add failing density contract tests**

Read both CSS Modules and assert:

```ts
expect(publicCss).toMatch(/\.publicSourceBoundary\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*var\(--content-frame\)\)/);
expect(publicCss).toMatch(/\.publicSourceBoundary\s*\{[\s\S]*?margin-inline:\s*auto/);
expect(publicCss).toMatch(/\.publicSourceBoundary dl\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
expect(trustCss).toMatch(/\.disclosureGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
```

- [ ] **Step 2: Run source/trust tests and confirm RED**

Run: `pnpm vitest run apps/web/test/public-source-boundary.test.tsx apps/web/test/trust-components.test.tsx`  
Expected: FAIL because the boundary is viewport-wide and disclosure metadata uses two columns.

- [ ] **Step 3: Implement compact evidence metadata**

Make `.publicSourceBoundary` a centred standard frame with `padding: clamp(24px, 4vw, 48px)`. Keep the dataset metadata at three columns. Change `.disclosureGrid` to four columns at desktop and update borders so only internal cells divide; preserve the enclosing two-pixel boundary.

At `max-width: 980px`, both grids become two columns. At `max-width: 720px`, both become one column and all odd-column border overrides are cleared.

- [ ] **Step 4: Run focused evidence tests**

Run: `pnpm vitest run apps/web/test/public-source-boundary.test.tsx apps/web/test/trust-components.test.tsx apps/web/test/public-market-components.test.tsx`  
Expected: PASS with unchanged visible evidence content.

- [ ] **Step 5: Commit the disclosure repair**

```bash
git add v2/apps/web/components/public-market/public-market.module.css v2/apps/web/components/trust/trust.module.css v2/apps/web/test/public-source-boundary.test.tsx v2/apps/web/test/trust-components.test.tsx
git commit -m "style: compact source evidence disclosures"
```

### Task 5: Apply page-specific frame tiers

**Files:**
- Modify: `v2/apps/web/components/contract-check/contract-check.module.css`
- Modify: `v2/apps/web/components/public-market/district-rankings.module.css`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/components/singapore/singapore.module.css`
- Modify: `v2/apps/web/test/contract-check-workspace.test.tsx`
- Modify: `v2/apps/web/test/public-area-rankings.test.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`
- Modify: `v2/apps/web/test/singapore-routes.test.tsx`

**Interfaces:**
- Consumes: frame tokens from Task 1
- Produces: Check `1040px`, Rankings `standard`, building Detail `workspace`, and Singapore `standard` frames

- [ ] **Step 1: Write failing exact frame tests**

Assert these exact declarations:

```ts
// Contract Check
expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*1040px\)/);

// Rankings
expect(css).toMatch(/\.frame\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*var\(--content-frame\)\)/);

// Building Detail
expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*var\(--workspace-frame\)\)/);

// Singapore
expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*var\(--content-frame\)\)/);
```

- [ ] **Step 2: Run the four focused suites and confirm RED**

Run: `pnpm vitest run apps/web/test/contract-check-workspace.test.tsx apps/web/test/public-area-rankings.test.tsx apps/web/test/public-building-detail.test.tsx apps/web/test/singapore-routes.test.tsx`  
Expected: FAIL on the old hard-coded widths.

- [ ] **Step 3: Apply the exact frame widths and gutters**

Replace hard-coded `48px`, `1120px`, and `1240px` layout expressions with the tier expressions from Step 1. Keep Explore governed by `--workspace-frame`; do not reduce its map/list frame to `standard`.

Reduce wide-screen hero padding to a maximum of `48px`, cap paragraph lines at `68ch`, and keep result/evidence grids from creating tracks wider than their content requires.

- [ ] **Step 4: Normalize page rule density**

In the four modules, use major `2px` borders only around the page frame, selected decision regions, and major section boundaries. Replace cell-to-cell `2px` borders with `var(--rule-default)` or `var(--rule-subtle)`. Ensure adjacent elements do not draw both a bottom and top two-pixel border.

- [ ] **Step 5: Run focused route tests**

Run the command from Step 2.  
Expected: PASS.

- [ ] **Step 6: Commit the page-tier repair**

```bash
git add v2/apps/web/components/contract-check/contract-check.module.css v2/apps/web/components/public-market/district-rankings.module.css v2/apps/web/components/public-market/building-detail.module.css v2/apps/web/components/singapore/singapore.module.css v2/apps/web/test/contract-check-workspace.test.tsx v2/apps/web/test/public-area-rankings.test.tsx v2/apps/web/test/public-building-detail.test.tsx v2/apps/web/test/singapore-routes.test.tsx
git commit -m "style: apply page-specific content frames"
```

### Task 6: Verify responsive density and release the P0 UI repair

**Files:**
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`
- Modify: `v2/tests/e2e/rankings.spec.ts`
- Modify: `v2/tests/e2e/contract-check.spec.ts`
- Modify: `v2/tests/e2e/singapore.spec.ts`

**Interfaces:**
- Consumes: all frame and density changes from Tasks 1–5
- Produces: browser proof for 390, 720, 1366, 1440, and 2048-pixel viewports

- [ ] **Step 1: Add browser assertions for bounded widths and overflow**

For each relevant route, measure the principal frame and assert:

```ts
const frame = page.locator('[data-ranking-frame="contained"], main').first();
const box = await frame.boundingBox();
expect(box).not.toBeNull();
expect(box!.width).toBeLessThanOrEqual(expectedMaximum + 1);
expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
```

Use `1120` for Home/intent/Rankings/Singapore, `1040` for Check, and `1320` for Explore/Detail. At 390 and 720 pixels, assert the frame keeps the expected gutter and no status badge, metric, or navigation label clips.

- [ ] **Step 2: Run the focused browser suites**

Run: `pnpm playwright test tests/e2e/visible-foundation.spec.ts tests/e2e/rankings.spec.ts tests/e2e/contract-check.spec.ts tests/e2e/singapore.spec.ts`  
Expected: PASS at all configured projects.

- [ ] **Step 3: Run complete automated verification**

Run from `v2/`:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check:rent-client-boundary
pnpm check:singapore-client-boundary
```

Expected: every command exits `0`; no secret, API endpoint, or artifact contract enters a client bundle.

- [ ] **Step 4: Commit the browser contract**

```bash
git add v2/tests/e2e/visible-foundation.spec.ts v2/tests/e2e/rankings.spec.ts v2/tests/e2e/contract-check.spec.ts v2/tests/e2e/singapore.spec.ts
git commit -m "test: verify bounded layouts across viewports"
```

- [ ] **Step 5: Deploy an exact-SHA Preview and inspect priority routes**

Inspect:

- `/`
- `/kr/seoul/explore/`
- `/kr/seoul/rankings/`
- `/kr/seoul/check/`
- `/kr/seoul/buy/`
- one published building Detail route
- `/sg/`
- `/sg/singapore/explore/`

At 390, 720, 1440, and 2048 pixels verify no horizontal overflow, no clipped badge, bounded evidence tables, compact Home sections, and no runtime console error.

- [ ] **Step 6: Promote the verified SHA and retain the previous Production deployment as rollback**

Promote only the exact Preview SHA that passed Step 5. Re-open the same routes on `https://www.signedprice.com/`, verify the Production SHA and runtime state, and record the immediately previous READY deployment before ending the release.
