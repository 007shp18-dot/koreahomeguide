# Explorer Choropleth and Building Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken document-length Explorer with a 25-district full-map workspace, a bounded district-to-neighborhood-to-building panel, a centered building modal, explicit price methodology, and aligned Rent Check controls.

**Architecture:** Keep the current static HTML, vanilla JavaScript, CommonJS APIs, official-data providers, Google Maps configuration, and NAVER Panorama controller. Add a small district-map model module and simplified Seoul district GeoJSON, extend the existing Seoul-wide API payload with district summaries, and change only presentation/state orchestration around the existing building-window controller.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript UMD modules, Node.js CommonJS Vercel Functions, `node:test`, Google Maps JavaScript API, NAVER Panorama.

**Spec:** `docs/superpowers/specs/2026-08-29-explorer-choropleth-modal-design.md`

## Global Constraints

- No framework, bundler, or new runtime dependency.
- Preserve `/rent/<district>/<type>/`, localized Dong/building pages, `api/seo-*`, sitemap endpoints, header, footer, and crawlable Explore directory.
- Use current API names (`scope=all`, `type`) and the existing map configuration endpoint.
- Display deposit-adjusted ₩/㎡ using `monthly rent + deposit × 5% ÷ 12`, divided by area; never divide medians on the client.
- Keep English and Chinese behavior equivalent.
- Keep `explore/building-window.js` as the only building-detail data controller.
- Building detail must use verified NAVER nearby street view and must not scrape NAVER Real Estate.
- Every production behavior change starts with a failing test and ends with the targeted test plus the full suite.

---

### Task 1: Stop the null-bounds building crash

**Files:**
- Modify: `explore/map-viewport.js`
- Test: `tests/map-first-product-refresh.test.cjs`

**Interfaces:**
- Consumes: `normalizedBounds(bounds)` calls from `selectModelsForViewport` and `pointWithinBounds`.
- Produces: `normalizedBounds(null): null` without throwing.

- [ ] **Step 1: Write the failing regression test**

Add to `map viewport filters located points without inventing coordinates`:

```js
assert.equal(viewport.normalizedBounds(null), null);
assert.equal(viewport.normalizedBounds(undefined), null);
assert.deepEqual(
  viewport.selectModelsForViewport(models, null, 10).map(item => item.id),
  ['inside', 'north', 'missing']
);
```

- [ ] **Step 2: Run the targeted test and verify the production crash is reproduced**

Run: `node --test --test-name-pattern="map viewport filters" tests/map-first-product-refresh.test.cjs`

Expected: FAIL with `Cannot read properties of null (reading 'north')`.

- [ ] **Step 3: Normalize only object inputs**

Change the helper to:

```js
function normalizedBounds(bounds) {
  if (!bounds || typeof bounds !== 'object') return null;
  const value = {
    north:Number(bounds.north), south:Number(bounds.south),
    east:Number(bounds.east), west:Number(bounds.west)
  };
  return Object.values(value).every(Number.isFinite) ? value : null;
}
```

- [ ] **Step 4: Run the targeted test**

Run: `node --test --test-name-pattern="map viewport filters" tests/map-first-product-refresh.test.cjs`

Expected: PASS.

- [ ] **Step 5: Commit the isolated crash fix**

```bash
git add explore/map-viewport.js tests/map-first-product-refresh.test.cjs
git commit -m "fix: tolerate unavailable explorer map bounds"
```

---

### Task 2: Add authoritative district geometry and district summaries

**Files:**
- Create: `data/seoul-districts.geojson`
- Create: `explore/district-map.js`
- Modify: `api/explore-area.js`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Test: `tests/explorer-district-map.test.cjs`
- Test: `tests/v10-9-seoul-wide-explorer.test.cjs`

**Interfaces:**
- Consumes: SGIS/Seoul public WGS84 district boundaries, `SEOUL_DISTRICTS`, `buildAreaSummary(rows, options)`.
- Produces: `payload.districts: Array<{ districtCode, slug, districtName, summary, contractCount }>` and `KHGExplorerDistrictMap` helpers.

- [ ] **Step 1: Write failing geometry and model tests**

Create `tests/explorer-district-map.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const districtMap = require('../explore/district-map.js');

test('Seoul district geometry contains one slugged feature per district', () => {
  const geo = JSON.parse(fs.readFileSync('data/seoul-districts.geojson', 'utf8'));
  assert.equal(geo.type, 'FeatureCollection');
  assert.equal(geo.features.length, 25);
  assert.equal(new Set(geo.features.map(feature => feature.properties.slug)).size, 25);
  assert.ok(geo.features.every(feature => /^\d{5}$/.test(feature.properties.districtCode)));
});

test('district rows expose the same server-computed metric used by map labels', () => {
  const row = districtMap.normalizeDistrict({
    districtCode:'11680', slug:'gangnam-gu', districtName:'Gangnam-gu',
    summary:{ adjustedPerSqmWon:37861, medianMonthlyRentWon:830000,
      medianDepositWon:20000000, totalContracts:2183, monthsUsed:6 }
  });
  assert.equal(districtMap.metricValue(row, 'adjusted-per-sqm'), 37861);
  assert.equal(districtMap.metricValue(row, 'monthly'), 830000);
  assert.equal(districtMap.metricValue(row, 'deposit'), 20000000);
  assert.equal(row.contractCount, 2183);
});
```

Extend the Seoul-wide API test to assert:

```js
assert.equal(payload.districts.length, 25);
assert.equal(payload.districts[0].summary.adjustedPerSqmWon, 27083);
assert.equal(payload.districts[0].contractCount, payload.districts[0].summary.totalContracts);
```

- [ ] **Step 2: Run both tests and verify missing contracts**

Run: `node --test tests/explorer-district-map.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs`

Expected: FAIL because the module, GeoJSON, and `payload.districts` do not exist.

- [ ] **Step 3: Add simplified public district geometry**

Obtain WGS84 (`EPSG:4326`) 시군구 boundaries from the SGIS administrative boundary API documented at `https://sgis.kostat.go.kr/developer/html/newOpenApi/api/dataApi/addressBoundary.html`, filter Seoul, simplify coordinates to approximately `0.001°`, and normalize each feature to:

```json
{
  "type": "Feature",
  "properties": {
    "districtCode": "11680",
    "slug": "gangnam-gu",
    "nameEn": "Gangnam-gu",
    "nameKo": "강남구"
  },
  "geometry": { "type": "Polygon", "coordinates": [] }
}
```

Validate the committed file with:

```bash
node -e "const fs=require('node:fs'); const g=JSON.parse(fs.readFileSync('./data/seoul-districts.geojson','utf8')); const s=new Set(g.features.map(f=>f.properties.slug)); console.log(g.features.length,s.size)"
```

Expected: `25 25`.

- [ ] **Step 4: Implement the focused district map model**

Create a UMD module exporting:

```js
function normalizeDistrict(row = {}) {
  const summary = row.summary || {};
  return {
    districtCode:String(row.districtCode || ''),
    slug:String(row.slug || ''),
    districtName:String(row.districtName || ''),
    summary,
    contractCount:Number(row.contractCount ?? summary.totalContracts ?? 0)
  };
}

function metricValue(row, metric) {
  const summary = row && row.summary || {};
  if (metric === 'monthly') return Number.isFinite(Number(summary.medianMonthlyRentWon)) ? Number(summary.medianMonthlyRentWon) : null;
  if (metric === 'deposit') return Number.isFinite(Number(summary.medianDepositWon)) ? Number(summary.medianDepositWon) : null;
  return Number.isFinite(Number(summary.adjustedPerSqmWon)) ? Number(summary.adjustedPerSqmWon) : null;
}
```

Also export pure helpers for quantile/ramp selection, feature-slug lookup, and metric labels so DOM/map adapters remain thin.

- [ ] **Step 5: Return per-district summaries from the existing Seoul-wide loader**

Inside each district batch, calculate `districtSummary = buildSummary(rows, { referenceDate, months:SEOUL_WIDE_MONTHS })`, preserve `monthsUsed`, and return a district row. Accumulate those rows into `districts` while retaining existing `summary`, `dongs`, and `buildings` fields so current consumers do not break.

- [ ] **Step 6: Load the new browser module in both locales**

Insert `/explore/district-map.js?v=26` before `/explore/map.js` in both Explorer HTML files.

- [ ] **Step 7: Run the geometry, API, and full adjusted-price tests**

Run: `node --test tests/explorer-district-map.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs tests/adjusted-per-sqm.test.cjs tests/explorer-api.test.cjs`

Expected: PASS.

- [ ] **Step 8: Commit district data and summaries**

```bash
git add data/seoul-districts.geojson explore/district-map.js api/explore-area.js explore/index.html zh/explore/index.html tests/explorer-district-map.test.cjs tests/v10-9-seoul-wide-explorer.test.cjs
git commit -m "feat: expose Seoul district map summaries"
```

---

### Task 3: Replace the document-length Explorer with a bounded full-map workspace

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `explore/map.js`
- Modify: `styles.css`
- Test: `tests/explorer-spatial-workspace.test.cjs`
- Test: `tests/map-first-product-refresh.test.cjs`
- Test: `tests/zh-explorer.test.cjs`

**Interfaces:**
- Consumes: `payload.districts`, `KHGExplorerDistrictMap`, existing Dong/building APIs, existing request gates.
- Produces: workspace states `districts`, `neighborhoods`, `buildings`; one bounded discovery panel; choropleth data layer and price labels.

- [ ] **Step 1: Replace old document-flow assertions with failing bounded-workspace assertions**

Assert the final CSS layer contains:

```js
assert.match(css, /\/\* v27 choropleth Explorer workspace \*\/[\s\S]*?\.map-first-workspace\{[^}]*height:calc\(100dvh - 148px\)[^}]*overflow:hidden/);
assert.match(css, /\.map-first-workspace \.explorer-discovery-rail\{[^}]*position:absolute[^}]*top:16px[^}]*bottom:16px[^}]*width:370px[^}]*overflow:hidden/);
assert.match(css, /\.map-first-workspace \.explorer-discovery-rail \.explorer-results\{[^}]*height:100%[^}]*overflow-y:auto/);
assert.doesNotMatch(css.slice(css.indexOf('/* v27 choropleth Explorer workspace */')), /height:auto;[^}]*overflow:visible/);
```

Assert both HTML pages contain housing and metric segmented controls with `aria-pressed`, a metric legend, and a district panel state.

- [ ] **Step 2: Run the three Explorer tests and verify they fail against v22 document flow**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/map-first-product-refresh.test.cjs tests/zh-explorer.test.cjs`

Expected: FAIL on fixed-height workspace and new controls.

- [ ] **Step 3: Add the ZIP-derived map controls without replacing site chrome**

Inside the current workspace, add:

```html
<div class="explorer-map-segments" aria-label="Map controls">
  <div class="kg-segmented" role="group" aria-label="Housing type">
    <button type="button" data-map-housing="officetel" aria-pressed="true">Officetel</button>
    <button type="button" data-map-housing="apartment" aria-pressed="false">Apartment</button>
    <button type="button" data-map-housing="villa" aria-pressed="false">Villa</button>
  </div>
  <div class="kg-segmented" role="group" aria-label="Metric shown">
    <button type="button" data-map-metric="adjusted-per-sqm" aria-pressed="true">Adjusted per ㎡</button>
    <button type="button" data-map-metric="monthly" aria-pressed="false">Monthly</button>
    <button type="button" data-map-metric="deposit" aria-pressed="false">Deposit</button>
  </div>
</div>
<div class="kg-map-legend" aria-live="polite">
  <strong data-map-legend-title>Deposit-adjusted monthly cost per ㎡</strong>
  <div data-map-legend-ramp></div>
  <small data-map-legend-method>Monthly rent + deposit × 5% ÷ 12, divided by floor area.</small>
</div>
```

Keep the current header, footer, static directory, Rent Check handoff, and canonical metadata.

- [ ] **Step 4: Add explicit state transitions to both locale runtimes**

Use one state object:

```js
let explorerLevel = 'districts';
let selectedDistrictCode = '';

function setExplorerLevel(level, { districtCode = selectedDistrictCode, dong = currentDong } = {}) {
  explorerLevel = ['districts','neighborhoods','buildings'].includes(level) ? level : 'districts';
  selectedDistrictCode = explorerLevel === 'districts' ? '' : String(districtCode || '');
  currentDong = explorerLevel === 'buildings' ? String(dong || '') : '';
  resultsShell.dataset.workspaceState = explorerLevel;
}
```

On first load call `loadSeoulDistricts()` with `scope=all`. District selection calls the existing area load for that district. Neighborhood selection calls the existing Dong load. Every transition invalidates requests from the lower level before rendering.

- [ ] **Step 5: Draw and synchronize the district data layer**

Extend `explore/map.js` to load the GeoJSON once, map features by slug/code, and style them using `KHGExplorerDistrictMap.metricValue`. Polygon and price-label clicks dispatch `khg:map-select-district`. Metric changes only restyle existing features; housing changes refetch district rows and then restyle.

Do not remove existing verified neighborhood/building marker paths. Clear district polygons/labels when moving to building markers and restore them on back navigation.

- [ ] **Step 6: Add only the final v27 CSS layer**

Override earlier experimental layers at the end of `styles.css` rather than editing unrelated historic CSS. Desktop uses a 370px left rail over a full map; mobile converts the rail to a bounded bottom sheet. Map attribution remains unobstructed.

- [ ] **Step 7: Run Explorer state, locale, and page-contract tests**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/map-first-product-refresh.test.cjs tests/zh-explorer.test.cjs tests/explorer-pages.test.cjs tests/explorer-map-source.test.cjs`

Expected: PASS.

- [ ] **Step 8: Commit the full-map workspace**

```bash
git add explore/index.html zh/explore/index.html explore/app.js zh/explore/app.js explore/map.js styles.css tests/explorer-spatial-workspace.test.cjs tests/map-first-product-refresh.test.cjs tests/zh-explorer.test.cjs
git commit -m "feat: build bounded choropleth explorer workspace"
```

---

### Task 4: Make price methodology and comparison operands explicit

**Files:**
- Modify: `explore/building-window.js`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `styles.css`
- Test: `tests/explorer-building-market-position.test.cjs`
- Test: `tests/adjusted-per-sqm.test.cjs`

**Interfaces:**
- Consumes: server-computed `adjustedPerSqmWon`, `medianAdjustedPerSqmWon`, evidence counts, `monthsUsed`.
- Produces: labeled building/market values and formula disclosure in English and Chinese.

- [ ] **Step 1: Write failing copy and operand tests**

Assert the building window includes localized labels for `This building`, `Neighborhood median`, and the complete 5% formula. Assert it never recomputes `monthly / area` in the browser.

- [ ] **Step 2: Run the focused tests**

Run: `node --test tests/explorer-building-market-position.test.cjs tests/adjusted-per-sqm.test.cjs`

Expected: FAIL because comparison operands are currently rendered as an unlabeled slash pair.

- [ ] **Step 3: Render a labeled comparison block**

Replace the ambiguous pair with semantic markup:

```html
<dl class="building-market-comparison">
  <div><dt>This building</dt><dd>${perSqmMoney(buildingAdjustedWon)}</dd></div>
  <div><dt>Neighborhood median</dt><dd>${perSqmMoney(market.medianAdjustedPerSqmWon)}</dd></div>
</dl>
```

Add: `Adjusted monthly cost = monthly rent + deposit × 5% ÷ 12; divided by floor area. Latest 6 completed months.` Use localized Chinese copy in the same controller.

- [ ] **Step 4: Add the same methodology note to map legend and building panel**

The map legend names the selected metric, period, and contract count. Building rows retain the server-provided adjusted value.

- [ ] **Step 5: Run focused and locale tests**

Run: `node --test tests/explorer-building-market-position.test.cjs tests/adjusted-per-sqm.test.cjs tests/zh-explorer.test.cjs`

Expected: PASS.

- [ ] **Step 6: Commit explicit price methodology**

```bash
git add explore/building-window.js explore/app.js zh/explore/app.js explore/index.html zh/explore/index.html styles.css tests/explorer-building-market-position.test.cjs
git commit -m "fix: label explorer price comparison basis"
```

---

### Task 5: Present building detail as an accessible centered modal

**Files:**
- Modify: `explore/building-window.js`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `styles.css`
- Test: `tests/explorer-building-window.test.cjs`
- Test: `tests/explorer-spatial-workspace.test.cjs`
- Test: `tests/explorer-panorama.test.cjs`

**Interfaces:**
- Consumes: existing `KGBuildingWindow.open(selection, trigger)`, existing verified-location events, current Panorama IDs.
- Produces: modal open/close lifecycle, focus restoration, stable 16:9 media frame.

- [ ] **Step 1: Write failing modal behavior tests**

Assert generated markup uses `role="dialog"`, `aria-modal="true"`, and a backdrop. Assert the controller stores `triggerEl`, closes on Escape/backdrop/close button, restores focus, and toggles `body.has-building-status-window`.

Update CSS assertions to require:

```js
assert.match(finalCss, /\.building-status-overlay\{[^}]*position:fixed[^}]*display:grid[^}]*place-items:center/);
assert.match(finalCss, /\.building-status-window\{[^}]*width:min\(1080px,calc\(100vw - 32px\)\)[^}]*max-height:88dvh/);
assert.match(finalCss, /\.building-status-body\{[^}]*overflow-y:auto/);
```

- [ ] **Step 2: Run modal and Panorama tests and verify failure**

Run: `node --test tests/explorer-building-window.test.cjs tests/explorer-spatial-workspace.test.cjs tests/explorer-panorama.test.cjs`

Expected: FAIL because detail is currently mounted inline.

- [ ] **Step 3: Restore one reusable fixed overlay mount**

Stop moving the overlay into `.explorer-building-detail-mount`. Keep one overlay under `document.body`, set dialog semantics, and retain all existing element IDs used by Panorama.

- [ ] **Step 4: Implement close and focus lifecycle**

Store the opening trigger; on open lock document scrolling and focus the close button. Close only when the actual backdrop is clicked, not when content is clicked. On close invalidate the detail request, clear open-building state, unlock scrolling, and return focus to the trigger when it is still connected.

- [ ] **Step 5: Add the final centered-modal CSS layer**

Use `place-items:center`, `padding:clamp(12px,3vw,32px)`, modal max height `88dvh`, internal body scrolling, sticky header/actions, a 16:9 Street View frame, and a 44px minimum close target. Mobile uses `width:100%`, `max-height:94dvh`, and safe-area padding without reverting to inline flow.

- [ ] **Step 6: Run modal, Panorama, save, and acquisition handoff tests**

Run: `node --test tests/explorer-building-window.test.cjs tests/explorer-spatial-workspace.test.cjs tests/explorer-panorama.test.cjs tests/saved-explorer-buildings.test.cjs tests/acquisition-links.test.cjs`

Expected: PASS.

- [ ] **Step 7: Commit the modal conversion**

```bash
git add explore/building-window.js explore/app.js zh/explore/app.js styles.css tests/explorer-building-window.test.cjs tests/explorer-spatial-workspace.test.cjs
git commit -m "fix: center explorer building detail modal"
```

---

### Task 6: Repair Rent Check control geometry

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Modify: `styles.css`
- Test: `tests/ui-layout-regressions.test.cjs`
- Test: `tests/rent-check-layout.test.cjs`

**Interfaces:**
- Consumes: existing inputs, IDs, size presets, pyeong toggle, property-type guidance.
- Produces: two equal primary rows and one compact assistance row without changing form data or handlers.

- [ ] **Step 1: Write failing layout-contract tests**

Assert each locale has one `.rent-check-assist-row` outside primary `.field` elements, the property guide remains inside/adjacent to the housing-type field, and final CSS uses equal three-column rows with shared 52px control height.

- [ ] **Step 2: Run the targeted tests**

Run: `node --test tests/ui-layout-regressions.test.cjs tests/rent-check-layout.test.cjs`

Expected: FAIL on missing assist-row structure.

- [ ] **Step 3: Move existing assist controls without renaming runtime hooks**

Keep all IDs and data attributes. Move only size presets and pyeong control into:

```html
<div class="rent-check-assist-row">
  <div class="size-presets" aria-label="Size presets">
    <button type="button" data-size-preset="compact">Compact</button>
    <button type="button" data-size-preset="standard">Standard</button>
    <button type="button" data-size-preset="family">Family</button>
  </div>
  <button type="button" data-size-unit-toggle>Use pyeong</button>
  <small data-size-assist>Choose a rough size or switch units.</small>
</div>
```

- [ ] **Step 4: Add final geometry CSS**

Use one six-column grid whose primary fields each span two columns; Area/Housing/Size occupy row one and Deposit/Rent/Check row two. The assistance row spans all columns but remains one compact flex row. At mobile width, fields stack and the assist row wraps naturally.

- [ ] **Step 5: Run layout, input, and Rent Check behavior tests**

Run: `node --test tests/ui-layout-regressions.test.cjs tests/rent-check-layout.test.cjs tests/rent-check-prefill.test.cjs tests/currency-input.test.cjs`

Expected: PASS.

- [ ] **Step 6: Commit Rent Check alignment**

```bash
git add index.html zh/index.html tools/seoul-rent-check/index.html zh/tools/seoul-rent-check/index.html styles.css tests/ui-layout-regressions.test.cjs tests/rent-check-layout.test.cjs
git commit -m "fix: align Rent Check primary controls"
```

---

### Task 7: Complete regression, production build, and browser verification

**Files:**
- Modify only if verification exposes a reproducible defect, with a failing regression test first.

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: review-ready commit series and verified production deployment.

- [ ] **Step 1: Run syntax and diff checks**

```bash
node --check explore/app.js
node --check zh/explore/app.js
node --check explore/map.js
node --check explore/district-map.js
node --check explore/building-window.js
node --check api/explore-area.js
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Run the complete test suite**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Review the full diff against the approved spec**

Check that no SEO route, sitemap, header/footer markup, evidence threshold, currency source, or Panorama safety rule was removed. Confirm only approved files changed.

- [ ] **Step 4: Verify a preview in a real browser**

At desktop and 390px mobile widths verify:

1. Explorer loads 25 district polygons without filling a form.
2. Housing and metric controls redraw values and legend.
3. District → neighborhood → building works without `null.north`, jumping, or stale reversal.
4. Map and discovery panel stay the same height; only the panel body scrolls.
5. Building modal is centered, bounded, and closes via ×, Escape, and backdrop.
6. Street View frame dimensions do not change between loading and ready/unavailable states.
7. Price operands, formula, period, and evidence count are visible.
8. Rent Check has no tall blank assistance panel or baseline mismatch.
9. English and Chinese flows have no horizontal overflow.
10. Browser console has no application errors or warnings.

- [ ] **Step 5: Verify SEO and API surfaces**

Check representative district, Dong, qualified building, sitemap, `/api/explore-area?scope=all&type=officetel`, and `/api/explore-dong` URLs return successful, indexable or intentionally non-indexable responses as designed.

- [ ] **Step 6: Request code review and resolve every Critical/Important finding**

Run the repository's read-only review workflow against the complete diff. For every accepted defect, add a failing test, fix it, and rerun the targeted and full suites.

- [ ] **Step 7: Merge and deploy only the reviewed commit**

Push the reviewed branch, merge it to `main`, wait for Vercel Production `READY`, and confirm the deployed commit SHA matches the merged SHA.

- [ ] **Step 8: Repeat the critical production journey**

Repeat the desktop district → neighborhood → building → modal journey on `https://koreahomeguide.com/explore/`, inspect console logs and runtime error clusters, and verify no `null.north` or application error occurs.
