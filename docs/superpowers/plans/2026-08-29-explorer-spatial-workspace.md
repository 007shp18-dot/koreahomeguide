# Explorer Spatial Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved full-canvas Explorer with a switching left discovery rail, Street-View-first right building drawer, mobile bottom sheet, and repaired homepage size controls.

**Architecture:** Keep the existing APIs and data controllers. Add a small shared workspace-state contract in `explorer-utils.js`, let the English and Chinese apps project that state onto the results shell, let the map controller calculate panel-aware padding through `map-viewport.js`, and convert the existing building modal controller into a non-blocking desktop drawer and mobile sheet.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Google Maps JavaScript API, NAVER Panorama integration, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-29-explorer-spatial-workspace-design.md`

## Global Constraints

- English and Simplified Chinese Explorer pages must expose equivalent structure and localized controls.
- Do not add APIs, databases, map providers, analytics providers, or listing photographs.
- Preserve the existing rent, deposit, adjusted-price, evidence-threshold, save, Rent Check, geocoding, and full-detail behavior.
- Street View must precede price and contract evidence in DOM and visual order.
- The 1363 px desktop viewport and every rail or drawer must have zero horizontal overflow.
- Mobile must retain Street View and support neighborhood, building-list, and building-detail states without reloading data.
- Homepage preset values, validation, and square-metre/pyeong conversion behavior must not change.

---

### Task 1: Repair the homepage size field

**Files:**
- Modify: `cold-start.css`
- Modify: `tests/ui-layout-regressions.test.cjs`

**Interfaces:**
- Consumes: Existing `.rent-check-size`, `.rent-size-controls`, `.rent-size-presets`, and `.rent-size-unit-toggle` markup.
- Produces: A two-row `.rent-check-size-field` layout with three equal preset columns and no intrinsic-width overflow.

- [ ] **Step 1: Write the failing regression test**

Add a test that reads the final homepage repair block and requires the size field to use an explicit row flow, the input to be width constrained, and the presets to be a three-column grid:

```js
test('homepage size controls use a contained two-row layout', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  assert.match(css, /\.home-rent-workspace \.rent-check-size-field\{[^}]*min-width:0[^}]*grid-template-columns:1fr/);
  assert.match(css, /\.home-rent-workspace \.rent-check-size\{[^}]*width:100%[^}]*min-width:0/);
  assert.match(css, /\.home-rent-workspace \.rent-size-presets\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css.slice(css.indexOf('/* v17 homepage size-field containment */')), /flex:1 1 210px/);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/ui-layout-regressions.test.cjs`

Expected: FAIL because the final size-field containment block and three-column preset grid do not exist.

- [ ] **Step 3: Implement the minimal CSS**

Append a `v17 homepage size-field containment` block that gives the field `min-width:0`, makes the numeric control `width:100%;min-width:0`, changes presets to `display:grid;grid-template-columns:repeat(3,minmax(0,1fr))`, and places the pyeong toggle below the presets. Preserve the existing six-column desktop form and one-column mobile form.

- [ ] **Step 4: Run targeted tests and confirm GREEN**

Run: `node --test tests/ui-layout-regressions.test.cjs tests/rent-check-size.test.cjs tests/rent-check-layout.test.cjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add cold-start.css tests/ui-layout-regressions.test.cjs
git commit -m "fix: contain homepage size controls"
```

### Task 2: Add the shared Explorer workspace state contract

**Files:**
- Modify: `explore/explorer-utils.js`
- Create: `tests/explorer-spatial-workspace.test.cjs`

**Interfaces:**
- Consumes: `{ dong:string, buildingKey:string }` selection state.
- Produces: `workspaceState({ dong, buildingKey }): 'neighborhoods'|'buildings'|'building-detail'`.

- [ ] **Step 1: Write the failing state tests**

```js
const Explorer = require('../explore/explorer-utils.js');

test('workspace state follows neighborhood then building selection', () => {
  assert.equal(Explorer.workspaceState({}), 'neighborhoods');
  assert.equal(Explorer.workspaceState({ dong:'역삼동' }), 'buildings');
  assert.equal(Explorer.workspaceState({ dong:'역삼동', buildingKey:'역삼동::테스트' }), 'building-detail');
  assert.equal(Explorer.workspaceState({ buildingKey:'orphan' }), 'neighborhoods');
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/explorer-spatial-workspace.test.cjs`

Expected: FAIL because `workspaceState` is not exported.

- [ ] **Step 3: Implement the pure state function**

```js
function workspaceState({ dong = '', buildingKey = '' } = {}) {
  const neighborhood = String(dong || '').trim();
  if (!neighborhood) return 'neighborhoods';
  return String(buildingKey || '').trim() ? 'building-detail' : 'buildings';
}
```

Export it through the existing frozen API.

- [ ] **Step 4: Run targeted tests and confirm GREEN**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/explorer-mobile-view.test.cjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add explore/explorer-utils.js tests/explorer-spatial-workspace.test.cjs
git commit -m "feat: define explorer workspace states"
```

### Task 3: Convert results into a switching discovery rail

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `styles.css`
- Modify: `tests/explorer-spatial-workspace.test.cjs`
- Modify: `tests/explorer-information-hierarchy.test.cjs`

**Interfaces:**
- Consumes: `KHGExplorer.workspaceState`, existing `currentDong`, `khg:map-select-dong`, and `khg:map-back-neighborhoods`.
- Produces: `data-workspace-state` on `#explorerResultsShell`, `#explorerRailBack`, and a left rail that displays neighborhoods or buildings, never both long lists at once.

- [ ] **Step 1: Add failing structure and locale tests**

```js
test('both locales expose a switching discovery rail', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /class="product-main explorer-map-main explorer-discovery-rail"/);
    assert.match(html, /class="product-main explorer-map-main explorer-discovery-rail"[^>]*aria-label=/);
    assert.match(html, /id="explorerRailBack"/);
  }
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /resultsShell\.dataset\.workspaceState\s*=\s*KHGExplorer\.workspaceState/);
  }
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/explorer-information-hierarchy.test.cjs tests/zh-explorer.test.cjs`

Expected: FAIL because the discovery rail contract and state projection do not exist.

- [ ] **Step 3: Implement the shared interaction in both locale apps**

Add `const resultsShell = document.querySelector('#explorerResultsShell')` and:

```js
let currentBuildingKey = '';
function syncWorkspaceState() {
  if (!resultsShell) return;
  resultsShell.dataset.workspaceState = KHGExplorer.workspaceState({ dong:currentDong, buildingKey:currentBuildingKey });
}
```

Call it after area load, neighborhood load, building open, building close, and back-to-neighborhood events. The rail back button clears `currentDong`, restores the cached area summary and neighborhood markers, updates the URL, and retains current filters.

- [ ] **Step 4: Implement full-canvas and rail CSS**

Make `.map-first-workspace` a viewport-height positioned canvas, make the map fill it, and position `.explorer-discovery-rail` over the left map edge at 360 px/320 px widths. Use `[data-workspace-state='neighborhoods']` to hide `.building-section` and `[data-workspace-state='buildings'],[data-workspace-state='building-detail']` to hide `.dong-section`. Give only the rail body vertical scrolling.

- [ ] **Step 5: Run targeted tests and confirm GREEN**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/explorer-information-hierarchy.test.cjs tests/explorer-map-layout.test.cjs tests/zh-explorer.test.cjs`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add explore/index.html zh/explore/index.html explore/app.js zh/explore/app.js styles.css tests/explorer-spatial-workspace.test.cjs tests/explorer-information-hierarchy.test.cjs
git commit -m "feat: switch explorer discovery rail by selection"
```

### Task 4: Convert the building modal into a Street-View-first drawer

**Files:**
- Modify: `explore/building-window.js`
- Modify: `styles.css`
- Modify: `tests/explorer-building-window.test.cjs`
- Modify: `tests/explorer-spatial-workspace.test.cjs`

**Interfaces:**
- Consumes: Existing `khg:building-window-open`, `khg:map-select-building`, building-detail API, Panorama controller, saved-building store, and opening trigger.
- Produces: Non-modal desktop drawer, mobile detail sheet, `khg:building-window-state` events with `{ open:boolean, selection }`, and the vertical evidence order defined by the spec.

- [ ] **Step 1: Write failing render-order and state-event tests**

```js
test('building drawer keeps Street View before every evidence section', () => {
  const source = fs.readFileSync('explore/building-window.js', 'utf8');
  const shell = source.match(/overlay\.innerHTML = `([\s\S]*?)`;/)?.[1] || '';
  assert.ok(shell.indexOf('id="explorerStreetView"') > shell.indexOf('building-status-head'));
  assert.ok(shell.indexOf('id="explorerStreetView"') < shell.indexOf('id="buildingStatusBody"'));
  assert.doesNotMatch(source, /appendChild\(streetView\)/);
  const html = renderContent(detail, selection, 'en');
  assert.ok(html.indexOf('building-snapshot') < html.indexOf('building-market-stack'));
  assert.ok(html.indexOf('building-window-profile') < html.indexOf('building-contract-list'));
  assert.doesNotMatch(html, /building-window-tabs/);
  assert.match(source, /khg:building-window-state/);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/explorer-building-window.test.cjs tests/explorer-spatial-workspace.test.cjs`

Expected: FAIL because Street View is currently moved below the price snapshot and no drawer-state event exists.

- [ ] **Step 3: Implement the vertical content renderer**

Keep Street View in its template position. Render price, market, profile, and contracts as four stacked sections inside `#buildingStatusBody`; do not append Street View into a data panel. Preserve escaping, missing-value handling, evidence rules, API URLs, save state, and stale-request guards.

- [ ] **Step 4: Implement desktop drawer behavior**

Change the overlay to a pointer-transparent fixed layer without backdrop. Give the 520 px/460 px drawer pointer events, viewport-height internal scrolling, and sticky identity/action regions. Do not add `has-building-status-window` overflow locking on desktop. Update `syncLayout()` to set `role="complementary"` and `aria-modal="false"` on desktop, and `role="dialog"` plus `aria-modal="true"` on mobile.

- [ ] **Step 5: Publish drawer state without changing data flow**

Dispatch:

```js
windowObject.dispatchEvent(new CustomEvent('khg:building-window-state', {
  detail:{ open:true, selection }
}));
```

after opening, and the same event with `open:false` on close. Preserve `khg:building-window-close` for existing consumers and restore focus to the opening row.

- [ ] **Step 6: Run targeted tests and confirm GREEN**

Run: `node --test tests/explorer-building-window.test.cjs tests/explorer-panorama.test.cjs tests/saved-explorer-buildings.test.cjs tests/explorer-spatial-workspace.test.cjs`

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add explore/building-window.js styles.css tests/explorer-building-window.test.cjs tests/explorer-spatial-workspace.test.cjs
git commit -m "feat: open street view first in building drawer"
```

### Task 5: Make map fitting aware of both panels

**Files:**
- Modify: `explore/map-viewport.js`
- Modify: `explore/map.js`
- Modify: `tests/map-first-product-refresh.test.cjs`
- Modify: `tests/explorer-spatial-workspace.test.cjs`

**Interfaces:**
- Consumes: viewport width, mobile breakpoint, drawer open state, and existing Google Maps `fitBounds` padding.
- Produces: `workspacePadding({ viewportWidth, mobile, drawerOpen })` returning `{ top,right,bottom,left }`.

- [ ] **Step 1: Write failing literal padding tests**

```js
test('workspace padding keeps selected markers clear of desktop panels', () => {
  assert.deepEqual(Viewport.workspacePadding({ viewportWidth:1440, mobile:false, drawerOpen:false }), { top:72, right:32, bottom:72, left:392 });
  assert.deepEqual(Viewport.workspacePadding({ viewportWidth:1440, mobile:false, drawerOpen:true }), { top:72, right:552, bottom:72, left:392 });
  assert.deepEqual(Viewport.workspacePadding({ viewportWidth:390, mobile:true, drawerOpen:true }), { top:56, right:32, bottom:300, left:32 });
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `node --test tests/map-first-product-refresh.test.cjs tests/explorer-spatial-workspace.test.cjs`

Expected: FAIL because `workspacePadding` does not exist.

- [ ] **Step 3: Implement padding and wire drawer events**

Add the pure function to `map-viewport.js`, export it, replace `buildingViewportPadding()` internals with it, and maintain a `buildingDrawerOpen` boolean updated by `khg:building-window-state`. Refit or pan only when the drawer state changes; do not reset a user-moved map or reintroduce the previous fit loop.

- [ ] **Step 4: Run targeted tests and confirm GREEN**

Run: `node --test tests/map-first-product-refresh.test.cjs tests/explorer-map-source.test.cjs tests/explorer-spatial-workspace.test.cjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add explore/map-viewport.js explore/map.js tests/map-first-product-refresh.test.cjs tests/explorer-map-source.test.cjs tests/explorer-spatial-workspace.test.cjs
git commit -m "fix: keep map markers clear of explorer panels"
```

### Task 6: Finish the mobile bottom sheet and release verification

**Files:**
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `styles.css`
- Modify: `tests/explorer-mobile-view.test.cjs`
- Modify: `tests/explorer-spatial-workspace.test.cjs`

**Interfaces:**
- Consumes: the three workspace states, existing `#explorerSheetToggle`, Map/Results controls, and drawer state events.
- Produces: 96 px collapsed, 62dvh list, and 92dvh building-detail sheet states with correct back behavior.

- [ ] **Step 1: Write failing mobile state tests**

```js
test('mobile workspace exposes collapsed, list, and detail sheet heights', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  const mobile = css.slice(css.lastIndexOf('@media(max-width:760px)'));
  assert.match(mobile, /data-workspace-state='neighborhoods'[^}]*max-height:96px/);
  assert.match(mobile, /data-workspace-state='buildings'[^}]*max-height:62dvh/);
  assert.match(mobile, /data-workspace-state='building-detail'[^}]*max-height:92dvh/);
  assert.match(mobile, /building-window-street-view\{[^}]*display:block/);
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /khg:building-window-state/);
  }
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `node --test tests/explorer-mobile-view.test.cjs tests/explorer-spatial-workspace.test.cjs tests/explorer-building-window.test.cjs`

Expected: FAIL because the current sheet has only collapsed and 68dvh states.

- [ ] **Step 3: Implement the three mobile sheet states**

Use the shell's `data-workspace-state` and `is-sheet-expanded` class to select the snap height. Building detail always expands to 92dvh; closing it restores the building-list sheet and its scroll position. The first back action closes detail, and the second clears the neighborhood.

- [ ] **Step 4: Run all static and unit verification**

Run:

```bash
git diff --check
node --check explore/app.js
node --check zh/explore/app.js
node --check explore/building-window.js
node --check explore/map.js
node --test tests/*.test.cjs
```

Expected: all syntax checks exit 0 and the complete test suite reports 0 failures.

- [ ] **Step 5: Verify a Vercel preview in a real browser**

At desktop width, verify the map canvas fills the workspace, the left rail switches lists, the right drawer is 520/460 px, Street View precedes data, the map and panels have no horizontal overflow, and close preserves building-list position. At mobile width, verify all three sheet states and Street View visibility. Repeat the structural checks on `/zh/explore/` and verify the homepage size field at desktop and narrow widths.

- [ ] **Step 6: Commit release-ready code**

```bash
git add explore/app.js zh/explore/app.js styles.css tests/explorer-mobile-view.test.cjs tests/explorer-spatial-workspace.test.cjs
git commit -m "feat: complete responsive explorer workspace"
```

- [ ] **Step 7: Promote only the verified commit**

Push the verified commit to a preview branch, wait for Vercel `READY`, complete browser checks, fast-forward `main`, wait for the production deployment to become `READY`, and repeat the desktop production checks on `https://koreahomeguide.com/` and `https://koreahomeguide.com/explore/`.
