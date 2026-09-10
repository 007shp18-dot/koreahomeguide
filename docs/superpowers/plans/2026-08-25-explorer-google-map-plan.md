# Explorer Google Maps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lazy-loaded, bilingual Google map to Explore that stays synchronized with neighborhood cards and fails safely without blocking rental data.

**Architecture:** A serverless config endpoint exposes the domain-restricted browser key at runtime, a data-only coordinate module supplies curated district/neighborhood centroids, and a testable controller converts Explorer data into marker models. The browser adapter owns Google Maps loading and DOM synchronization; Explorer cards remain the accessible source of truth.

**Tech Stack:** Google Maps JavaScript API, static HTML/CSS/JavaScript, Vercel Function, Node.js `node:test`, existing English/Chinese Explorer runtimes.

**Spec:** `docs/superpowers/specs/2026-08-25-lead-privacy-localization-map-design.md`

## Global Constraints

- Map appears on English and Simplified Chinese Explore pages only.
- No Places, Routes, Geocoding, Street View, or building-level markers are enabled.
- The browser key is read from `GOOGLE_MAPS_BROWSER_KEY`, restricted to KoreaHomeGuide domains and the Maps JavaScript API.
- The map lazy-loads only when its container approaches the viewport.
- Cards, filters, and APIs continue working when the key is missing, blocked, or over quota.
- Map locations are neighborhood or district centroids, never exact property locations.
- Card links preserve the existing SEO navigation behavior.
- The current checkout has no Git metadata. Run commit steps only in the canonical Git checkout.

---

### Task 1: Add Runtime Map Configuration

**Files:**
- Create: `api/maps-config.js`
- Create: `tests/maps-config-api.test.cjs`
- Modify: `docs/operations/google-maps.md`

**Interfaces:**
- Produces: `GET /api/maps-config` → `{ enabled:boolean, apiKey?:string }` with `Cache-Control: private, max-age=300` when configured and `{ enabled:false }` when absent.
- Consumes: `process.env.GOOGLE_MAPS_BROWSER_KEY`.

- [ ] **Step 1: Write failing endpoint tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const maps = require('../api/maps-config.js');

function responseRecorder() {
  return { statusCode:200, headers:{}, body:null, status(code){this.statusCode=code;return this;}, setHeader(k,v){this.headers[k]=v;}, json(v){this.body=v;return this;} };
}

test('maps config returns disabled without exposing an empty key', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'' })({ method:'GET' }, res);
  assert.deepEqual(res.body, { enabled:false });
});

test('maps config returns the configured browser key without public caching', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key' })({ method:'GET' }, res);
  assert.deepEqual(res.body, { enabled:true, apiKey:'browser-key' });
  assert.match(res.headers['Cache-Control'], /private/);
});

test('maps config rejects non-GET methods', () => {
  const res = responseRecorder();
  maps.createHandler({ apiKey:'browser-key' })({ method:'POST' }, res);
  assert.equal(res.statusCode, 405);
});
```

- [ ] **Step 2: Verify endpoint tests fail**

Run: `node --test tests/maps-config-api.test.cjs`  
Expected: FAIL because the endpoint does not exist.

- [ ] **Step 3: Implement the endpoint**

```js
'use strict';

function createHandler({ apiKey = process.env.GOOGLE_MAPS_BROWSER_KEY } = {}) {
  return function handler(req, res) {
    if (!req || req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
    res.setHeader('Cache-Control', 'private, max-age=300');
    const key = String(apiKey || '').trim();
    return res.status(200).json(key ? { enabled:true, apiKey:key } : { enabled:false });
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
```

- [ ] **Step 4: Document key restrictions and cost controls**

Create/update `docs/operations/google-maps.md` with:

```markdown
Environment variable: GOOGLE_MAPS_BROWSER_KEY
Allowed referrers: https://koreahomeguide.com/* and https://www.koreahomeguide.com/*
Allowed API: Maps JavaScript API only
Billing alert: 50%, 80%, and 100% of the selected monthly budget
Quota: begin below the monthly 10,000 Dynamic Maps free usage cap and raise only after reviewing traffic
```

State that browser keys are visible by design and protected through HTTP-referrer and API restrictions.

- [ ] **Step 5: Verify endpoint tests pass**

Run: `node --test tests/maps-config-api.test.cjs`  
Expected: PASS.

- [ ] **Step 6: Commit runtime configuration in the canonical repository**

```bash
git add api/maps-config.js tests/maps-config-api.test.cjs docs/operations/google-maps.md
git commit -m "feat: add runtime Google Maps configuration"
```

### Task 2: Add Curated Seoul Map Coordinates

**Files:**
- Create: `explore/map-locations.js`
- Create: `tests/map-locations.test.cjs`

**Interfaces:**
- Produces: `KHGMapLocations.district(code)`, `neighborhood(koreanName)`, `centerFor(code, koreanName)`, `DISTRICTS`, and `DONGS`.
- Consumes: stable district codes and raw Korean dong names from Explorer API data.

- [ ] **Step 1: Write failing coordinate tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const locations = require('../explore/map-locations.js');

test('all ten supported districts have finite Seoul coordinates', () => {
  for (const code of ['11680','11440','11170','11200','11560','11620','11230','11410','11290','11215']) {
    const point = locations.district(code);
    assert.ok(point);
    assert.ok(Number.isFinite(point.lat) && Number.isFinite(point.lng));
    assert.ok(point.lat > 37.4 && point.lat < 37.7);
    assert.ok(point.lng > 126.7 && point.lng < 127.2);
  }
});

test('curated SEO neighborhoods resolve by raw Korean name', () => {
  assert.deepEqual(locations.neighborhood('연남동'), { lat:37.5624, lng:126.9217 });
  assert.deepEqual(locations.centerFor('11440','unknown'), locations.district('11440'));
});
```

- [ ] **Step 2: Verify coordinate tests fail**

Run: `node --test tests/map-locations.test.cjs`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the UMD coordinate module**

Use a frozen data-only module with these district centroids:

```js
const DISTRICTS = Object.freeze({
  '11680':{ lat:37.5172, lng:127.0473 },
  '11440':{ lat:37.5663, lng:126.9014 },
  '11170':{ lat:37.5326, lng:126.9906 },
  '11200':{ lat:37.5633, lng:127.0369 },
  '11560':{ lat:37.5264, lng:126.8963 },
  '11620':{ lat:37.4784, lng:126.9516 },
  '11230':{ lat:37.5744, lng:127.0396 },
  '11410':{ lat:37.5791, lng:126.9368 },
  '11290':{ lat:37.5894, lng:127.0167 },
  '11215':{ lat:37.5385, lng:127.0823 }
});
```

Add every current `DONG_SLUG_ALIASES` entry with these neighborhood-centroid coordinates:

```js
const DONGS = Object.freeze({
  '역삼동':{ lat:37.5007, lng:127.0365 },
  '논현동':{ lat:37.5112, lng:127.0287 },
  '대치동':{ lat:37.4930, lng:127.0567 },
  '삼성동':{ lat:37.5140, lng:127.0565 },
  '청담동':{ lat:37.5240, lng:127.0471 },
  '연남동':{ lat:37.5624, lng:126.9217 },
  '서교동':{ lat:37.5555, lng:126.9220 },
  '망원동':{ lat:37.5560, lng:126.9100 },
  '합정동':{ lat:37.5495, lng:126.9140 },
  '공덕동':{ lat:37.5445, lng:126.9510 },
  '아현동':{ lat:37.5575, lng:126.9560 },
  '이태원동':{ lat:37.5345, lng:126.9946 },
  '한남동':{ lat:37.5340, lng:127.0000 },
  '후암동':{ lat:37.5500, lng:126.9765 },
  '보광동':{ lat:37.5263, lng:127.0002 },
  '성수동1가':{ lat:37.5436, lng:127.0445 },
  '성수동2가':{ lat:37.5397, lng:127.0563 },
  '옥수동':{ lat:37.5417, lng:127.0177 },
  '금호동1가':{ lat:37.5540, lng:127.0210 },
  '금호동2가':{ lat:37.5520, lng:127.0190 },
  '금호동3가':{ lat:37.5480, lng:127.0220 },
  '금호동4가':{ lat:37.5470, lng:127.0185 },
  '여의도동':{ lat:37.5219, lng:126.9245 },
  '당산동':{ lat:37.5349, lng:126.9027 },
  '문래동':{ lat:37.5173, lng:126.8990 },
  '영등포동':{ lat:37.5133, lng:126.9073 }
});
```

`centerFor` returns the neighborhood point when known, otherwise the district centroid. These points represent neighborhood centers, not buildings.

- [ ] **Step 4: Verify coordinate tests pass**

Run: `node --test tests/map-locations.test.cjs`  
Expected: PASS.

- [ ] **Step 5: Commit coordinate data in the canonical repository**

```bash
git add explore/map-locations.js tests/map-locations.test.cjs
git commit -m "feat: add curated Seoul map centroids"
```

### Task 3: Build the Testable Map/Card Controller

**Files:**
- Create: `explore/map-controller.js`
- Create: `tests/map-controller.test.cjs`

**Interfaces:**
- Consumes: `{ lawdCd, dongs, locale }`, `KHGMapLocations`, and `KHGLocations`.
- Produces: `buildMarkerModels({ lawdCd, dongs, locale })` and `selectDong(state, dong)`.
- Marker model: `{ id:string, dong:string, label:string, lat:number, lng:number, contractCount:number }`.

- [ ] **Step 1: Write failing controller tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../explore/map-controller.js');

test('marker models preserve raw dong IDs and localize labels', () => {
  const models = controller.buildMarkerModels({
    lawdCd:'11440',
    locale:'zh-CN',
    dongs:[{ dong:'연남동', contractCount:12 }]
  });
  assert.deepEqual(models, [{
    id:'dong:연남동', dong:'연남동', label:'延南洞（연남동）',
    lat:37.5624, lng:126.9217, contractCount:12
  }]);
});

test('missing neighborhood coordinates are omitted rather than guessed', () => {
  const models = controller.buildMarkerModels({ lawdCd:'11440', locale:'en', dongs:[{ dong:'없는동', contractCount:1 }] });
  assert.deepEqual(models, []);
});

test('selection returns a new immutable state', () => {
  const before = { selectedDong:'', markerIds:['dong:연남동'] };
  const after = controller.selectDong(before, '연남동');
  assert.equal(before.selectedDong, '');
  assert.equal(after.selectedDong, '연남동');
});
```

- [ ] **Step 2: Verify controller tests fail**

Run: `node --test tests/map-controller.test.cjs`  
Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement the UMD controller**

Inject `KHGMapLocations` and `KHGLocations` through the UMD factory. `buildMarkerModels` filters out dongs without curated points, converts counts to finite non-negative integers, and never replaces raw `dong` with translated text.

- [ ] **Step 4: Verify controller tests pass**

Run: `node --test tests/map-controller.test.cjs tests/map-locations.test.cjs tests/location-catalog.test.cjs`  
Expected: PASS.

- [ ] **Step 5: Commit controller logic in the canonical repository**

```bash
git add explore/map-controller.js tests/map-controller.test.cjs
git commit -m "feat: model Explorer neighborhood markers"
```

### Task 4: Add the Explorer Map Layout and Safe Fallback

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `styles.css`
- Create: `tests/explorer-map-layout.test.cjs`

**Interfaces:**
- Produces: `#explorerMap`, `#explorerMapStatus`, `.explorer-map-layout`, `.explorer-map-column`, and `.explorer-map-card` hooks in both locales.
- Consumes: existing result section and related-tool modules.

- [ ] **Step 1: Write failing structural tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('both Explorer locales contain an accessible map with a visible fallback', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /id="explorerMap"/);
    assert.match(html, /id="explorerMapStatus"[^>]*aria-live="polite"/);
    assert.match(html, /class="explorer-map-layout"/);
  }
});

test('map layout is right-hand sticky on desktop and first on mobile', () => {
  const css = fs.readFileSync('styles.css','utf8');
  assert.match(css, /grid-template-areas:"main map"/);
  assert.match(css, /\.explorer-map-column\{[^}]*grid-area:map/);
  assert.match(css, /@media\(max-width:980px\)[^]*grid-template-areas:"map" "main"/);
});
```

- [ ] **Step 2: Verify layout tests fail**

Run: `node --test tests/explorer-map-layout.test.cjs`  
Expected: FAIL because the map hooks do not exist.

- [ ] **Step 3: Restructure the two Explorer pages**

Wrap the current results and related-tools column in:

```html
<div class="explorer-map-layout">
  <div class="product-main explorer-map-main">…existing results…</div>
  <aside class="explorer-map-column" aria-label="Neighborhood map">
    <div class="explorer-map-sticky">
      <section class="explorer-map-card">
        <div class="explorer-map-heading"><span class="eyebrow">NEIGHBORHOOD MAP</span><h2>See where the neighborhoods are.</h2></div>
        <div id="explorerMap" class="explorer-map-canvas" role="region" aria-label="Map of selected Seoul neighborhoods"></div>
        <p id="explorerMapStatus" class="explorer-map-status" aria-live="polite">Map loads when it enters view.</p>
      </section>
      …existing related-tool modules…
    </div>
  </aside>
</div>
```

Use localized Chinese heading, region label, and status text.

- [ ] **Step 4: Add layout, sizing, and fallback styles**

```css
.explorer-map-layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(320px,1fr);grid-template-areas:"main map";gap:32px;align-items:start;margin-top:30px}
.explorer-map-main{grid-area:main;min-width:0}
.explorer-map-column{grid-area:map;min-width:0}
.explorer-map-sticky{position:sticky;top:88px;display:grid;gap:12px}
.explorer-map-card{overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#fff}
.explorer-map-heading{padding:18px 18px 12px}
.explorer-map-heading h2{margin:5px 0 0;font-size:20px;line-height:1.25}
.explorer-map-canvas{width:100%;height:420px;background:var(--surface-soft)}
.explorer-map-status{margin:0;padding:10px 14px;color:var(--muted);font-size:11px;line-height:1.45}
@media(max-width:980px){
  .explorer-map-layout{grid-template-columns:1fr;grid-template-areas:"map" "main"}
  .explorer-map-sticky{position:static}
  .explorer-map-canvas{height:340px}
}
@media(max-width:560px){.explorer-map-canvas{height:280px}}
```

Reserve map dimensions before the API loads to prevent layout shift.

- [ ] **Step 5: Verify layout tests pass**

Run: `node --test tests/explorer-map-layout.test.cjs tests/v10-7-explorer-ui.test.cjs tests/zh-explorer.test.cjs`  
Expected: PASS.

- [ ] **Step 6: Commit the map shell in the canonical repository**

```bash
git add explore/index.html zh/explore/index.html styles.css tests/explorer-map-layout.test.cjs
git commit -m "feat: add responsive Explorer map shell"
```

### Task 5: Implement Lazy Google Maps Loading and Synchronization

**Files:**
- Create: `explore/map.js`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `styles.css`
- Create: `tests/explorer-map-source.test.cjs`

**Interfaces:**
- Consumes: `/api/maps-config`, `KHGMapController`, `KHGMapLocations`, `KHGLocations`, and custom event `khg:explorer-dongs`.
- Produces: custom event `khg:map-select-dong` with `{ dong }`; DOM classes `.is-map-selected` and Google marker selection state.

- [ ] **Step 1: Write failing source-contract tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('map adapter is lazy and has explicit failure states', () => {
  const source = fs.readFileSync('explore/map.js','utf8');
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /\/api\/maps-config/);
  assert.match(source, /maps\.googleapis\.com\/maps\/api\/js/);
  assert.match(source, /Map temporarily unavailable/);
});

test('Explorer runtimes publish raw dong models after rendering', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /khg:explorer-dongs/);
    assert.match(source, /data-dong=/);
  }
});
```

- [ ] **Step 2: Verify source-contract tests fail**

Run: `node --test tests/explorer-map-source.test.cjs`  
Expected: FAIL because the adapter and events do not exist.

- [ ] **Step 3: Load map dependencies in both locales**

Insert scripts in this order after `location-catalog.js` and before the locale Explorer app:

```html
<script src="/explore/map-locations.js"></script>
<script src="/explore/map-controller.js"></script>
<script src="/explore/map.js"></script>
```

- [ ] **Step 4: Publish render events and card hooks**

In both `renderDongs` functions, add escaped `data-dong="…"` to each card and dispatch after setting `innerHTML`:

```js
window.dispatchEvent(new CustomEvent('khg:explorer-dongs', {
  detail:{ lawdCd:areaSelect.value, locale:'en', dongs:items }
}));
```

Use `locale:'zh-CN'` in the Chinese runtime. Also dispatch an empty `dongs:[]` event for empty/error states so stale markers are cleared.

- [ ] **Step 5: Implement the lazy SDK loader**

`explore/map.js` must:

1. Observe `#explorerMap` with `rootMargin:'240px'`.
2. Fetch `/api/maps-config` only on first intersection.
3. Show localized missing-key fallback when `enabled` is false.
4. Append one script URL using `encodeURIComponent(apiKey)`, `v=weekly`, and a unique callback.
5. Create `new google.maps.Map` centered on the selected district, with street-view, fullscreen, and map-type controls disabled.
6. Catch fetch, script, callback, and constructor failures and show the localized unavailable message.
7. Respect `prefers-reduced-motion` by using immediate pan/fit operations.

- [ ] **Step 6: Synchronize markers and cards**

On `khg:explorer-dongs`, call `buildMarkerModels`, remove prior markers, create the new markers, and fit bounds when at least two exist. A marker click:

```js
window.dispatchEvent(new CustomEvent('khg:map-select-dong', { detail:{ dong:model.dong } }));
```

The adapter listens for card `focusin` and `pointerover`, selects the matching marker, and pans without navigating. The Explorer runtime listens for `khg:map-select-dong`, adds `.is-map-selected` to the matching card, calls `scrollIntoView({ block:'nearest' })`, and focuses the card. Card clicks continue to open the existing SEO neighborhood URL.

- [ ] **Step 7: Add selected-state and reduced-motion styles**

```css
.neighborhood-card.is-map-selected{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
@media(prefers-reduced-motion:reduce){.neighborhood-card{scroll-behavior:auto;transition:none}}
```

- [ ] **Step 8: Verify synchronization tests pass**

Run: `node --test tests/explorer-map-source.test.cjs tests/map-controller.test.cjs tests/explorer-map-layout.test.cjs tests/explorer-pages.test.cjs tests/zh-explorer.test.cjs`  
Expected: PASS.

- [ ] **Step 9: Commit the map adapter in the canonical repository**

```bash
git add explore/map.js explore/app.js zh/explore/app.js explore/index.html zh/explore/index.html styles.css tests/explorer-map-source.test.cjs
git commit -m "feat: synchronize Explorer cards with Google Maps"
```

### Task 6: Google Cloud and Browser Verification

**Files:**
- Modify only if verification exposes a defect in Tasks 1–5.

**Interfaces:**
- Consumes: all map deliverables and a restricted Google Maps browser key.
- Produces: a production-ready map checkpoint.

- [ ] **Step 1: Configure the deployment environment**

Set `GOOGLE_MAPS_BROWSER_KEY` in the Vercel project for Preview and Production. In Google Cloud, restrict it to:

```text
https://koreahomeguide.com/*
https://www.koreahomeguide.com/*
the exact Vercel preview hostname used for verification
```

Restrict API access to Maps JavaScript API only. Do not enable Places, Routes, or Geocoding.

- [ ] **Step 2: Configure cost controls**

Set budget alerts at 50%, 80%, and 100%. Set an initial Dynamic Maps quota below 10,000 monthly loads, using a daily cap that matches observed Explore traffic rather than total site traffic.

- [ ] **Step 3: Run focused automated tests**

Run:

```bash
node --test \
  tests/maps-config-api.test.cjs \
  tests/map-locations.test.cjs \
  tests/map-controller.test.cjs \
  tests/explorer-map-layout.test.cjs \
  tests/explorer-map-source.test.cjs \
  tests/explorer-pages.test.cjs \
  tests/zh-explorer.test.cjs
```

Expected: PASS.

- [ ] **Step 4: Run the complete suite**

Run: `node --test tests/*.test.cjs`  
Expected: PASS.

- [ ] **Step 5: Verify missing-key fallback locally**

Without `GOOGLE_MAPS_BROWSER_KEY`, open both Explore locales, scroll near the map, and confirm localized unavailable copy appears while filters and cards keep working.

- [ ] **Step 6: Verify the real map in Preview**

At 1440, 1024, 768, and 390 CSS pixels confirm:

```text
- map loads only near the viewport
- map is right of cards on desktop and above cards on mobile
- changing district/type/budget clears stale markers
- hovering or focusing a card highlights and pans to the matching marker
- clicking a marker focuses the matching card
- clicking a card still opens its neighborhood page
- Chinese marker labels use Chinese plus Korean
- no horizontal overflow or cumulative layout shift occurs
```

- [ ] **Step 7: Verify key restriction failure**

Open the Preview from an unapproved hostname and confirm the map fails into the localized fallback without breaking Explore. Re-add only the intended verification hostname; never use an unrestricted wildcard.

- [ ] **Step 8: Record the final checkpoint**

In the canonical repository run `git status --short` and `git log -6 --oneline`; confirm only planned map changes are present.
