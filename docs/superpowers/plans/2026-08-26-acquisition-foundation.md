# Acquisition Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing 37 English search entry pages into a measurable path that carries page context into a correctly prefilled Seoul Rent Check.

**Architecture:** Keep all 37 current URLs and avoid new search pages. Add one machine-readable acquisition catalogue for auditability and one small browser helper that rewrites existing Rent Check links with validated page context; extend the existing prefill and analytics contracts so the original entry page survives into Rent Check and lead events. Strengthen static guide-hub navigation without changing the rental-data algorithms.

**Tech Stack:** Static HTML, browser JavaScript (UMD), Node.js built-in test runner, existing GA4 consent controller, existing Rent Check and lead contracts.

**Spec:** `docs/superpowers/specs/2026-08-26-90-day-acquisition-singapore-seed-design.md`

## Global Constraints

- This release improves the seven existing English guides and 30 existing English district/property-type pages; it creates zero new indexable search pages.
- Every entry page keeps its canonical URL, current hreflang policy, official-data wording, and existing useful body content.
- Building-detail pages remain excluded from search and all sitemaps.
- Rent Check verdict logic, comparable selection, API request shape, and public route remain unchanged.
- GA4 receives no email, free-text help message, exact money amount, or other contact PII.
- Campaign context is carried with `origin_*` parameters, never internal `utm_*` parameters, so internal navigation does not overwrite GA campaign attribution.
- English acquisition is the priority; existing Chinese pages and behavior must not regress.
- AdSense code, partner offers, payments, and new service categories are outside this first release.
- The deployable API function count remains at most 11.

---

## File Structure

- Create `seo/acquisition-catalog.cjs`: canonical list of the 37 English entry pages, their search clusters, and initial primary queries.
- Create `acquisition-links.js`: validated browser helper that turns existing Rent Check links into contextual links without storing data or depending on analytics consent.
- Modify `tools/seoul-rent-check/prefill-utils.js`: accept every supported Seoul district and validated acquisition context.
- Modify `app.js`, `tools/seoul-rent-check/app.js`, `zh/app.js`, and `zh/tools/seoul-rent-check/app.js`: preserve the original entry page in GA4 and lead-result context.
- Modify `lead-capture.js`: use validated origin campaign values in lead storage while retaining the current referrer fallback.
- Modify the 37 English entry HTML files under `guides/*/index.html` and `rent/*/*/index.html`: load the acquisition-link helper and point the header Guides link at `/guides/`.
- Modify the seven English guide HTML files: add static sibling-guide links so crawlers and readers can move through the content cluster.
- Create `tests/acquisition-catalog.test.cjs`, `tests/acquisition-links.test.cjs`, and `tests/acquisition-navigation.test.cjs`.
- Modify `tests/rent-check-prefill.test.cjs`, `tests/cold-start-analytics.test.cjs`, and `tests/lead-capture-source.test.cjs`.
- Create `docs/operations/2026-08-26-acquisition-baseline.md`: repository baseline, live GSC/GA snapshot, and the first comparison date.

---

### Task 1: Lock the 37-page acquisition catalogue

**Files:**
- Create: `seo/acquisition-catalog.cjs`
- Create: `tests/acquisition-catalog.test.cjs`

**Interfaces:**
- Consumes: existing English guide files and `rent/<district>/<type>/index.html` files.
- Produces: `ENTRY_PAGES: Array<{ path, file, kind, cluster, primaryQuery, lawdCd?, propertyType? }>` and `findEntryPage(pathname)`.

- [ ] **Step 1: Write the failing catalogue test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES, findEntryPage } = require('../seo/acquisition-catalog.cjs');

test('catalogue contains exactly seven guides and 30 market pages', () => {
  assert.equal(ENTRY_PAGES.length, 37);
  assert.equal(ENTRY_PAGES.filter(item => item.kind === 'guide').length, 7);
  assert.equal(ENTRY_PAGES.filter(item => item.kind === 'market').length, 30);
  assert.equal(new Set(ENTRY_PAGES.map(item => item.path)).size, 37);
  assert.equal(new Set(ENTRY_PAGES.map(item => item.primaryQuery)).size, 37);
});

test('every catalogued page exists and owns its canonical metadata', () => {
  for (const item of ENTRY_PAGES) {
    assert.equal(fs.existsSync(item.file), true, item.file);
    const html = fs.readFileSync(item.file, 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://koreahomeguide\\.com${item.path}"`), item.file);
    assert.match(html, /<title>[^<]+<\/title>/, item.file);
    assert.match(html, /<meta name="description" content="[^"]+"/, item.file);
  }
});

test('lookup normalizes trailing slashes but rejects non-entry surfaces', () => {
  assert.equal(findEntryPage('/guides/wolse-vs-jeonse').path, '/guides/wolse-vs-jeonse/');
  assert.equal(findEntryPage('/rent/gangnam-gu/apartment/').lawdCd, '11680');
  assert.equal(findEntryPage('/explore/building/'), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/acquisition-catalog.test.cjs`

Expected: FAIL with `Cannot find module '../seo/acquisition-catalog.cjs'`.

- [ ] **Step 3: Implement the catalogue**

```js
'use strict';

const GUIDES = [
  ['wolse-vs-jeonse', 'rent-basics', 'wolse vs jeonse'],
  ['korea-rental-contract-checklist', 'contract-safety', 'korea rental contract checklist'],
  ['seoul-brokerage-fees', 'move-in-cost', 'seoul rental brokerage fee'],
  ['before-you-sign', 'contract-safety', 'checks before signing a rental contract in korea'],
  ['rent-apartment-korea-foreigner', 'rental-process', 'how to rent an apartment in korea as a foreigner'],
  ['korea-rental-scams', 'contract-safety', 'korea rental scams'],
  ['seoul-officetel-rent', 'housing-type', 'seoul officetel rent']
];

const DISTRICTS = [
  ['gangnam-gu', 'Gangnam-gu', '11680'],
  ['mapo-gu', 'Mapo-gu', '11440'],
  ['yongsan-gu', 'Yongsan-gu', '11170'],
  ['seongdong-gu', 'Seongdong-gu', '11200'],
  ['yeongdeungpo-gu', 'Yeongdeungpo-gu', '11560'],
  ['gwanak-gu', 'Gwanak-gu', '11620'],
  ['dongdaemun-gu', 'Dongdaemun-gu', '11230'],
  ['seodaemun-gu', 'Seodaemun-gu', '11410'],
  ['seongbuk-gu', 'Seongbuk-gu', '11290'],
  ['gwangjin-gu', 'Gwangjin-gu', '11215']
];

const TYPES = [
  ['apartment', 'apartment'],
  ['officetel', 'officetel'],
  ['villa', 'villa low-rise']
];

const guideEntries = GUIDES.map(([slug, cluster, primaryQuery]) => ({
  path:`/guides/${slug}/`, file:`guides/${slug}/index.html`, kind:'guide', cluster, primaryQuery
}));

const marketEntries = DISTRICTS.flatMap(([slug, label, lawdCd]) => TYPES.map(([propertyType, queryType]) => ({
  path:`/rent/${slug}/${propertyType}/`,
  file:`rent/${slug}/${propertyType}/index.html`,
  kind:'market',
  cluster:'district-market',
  primaryQuery:`${label.toLowerCase()} ${queryType} rent prices`,
  lawdCd,
  propertyType
})));

const ENTRY_PAGES = Object.freeze([...guideEntries, ...marketEntries].map(Object.freeze));

function normalizePath(pathname) {
  const value = String(pathname || '').split(/[?#]/, 1)[0];
  return value && value !== '/' ? `${value.replace(/\/+$/, '')}/` : value || '/';
}

function findEntryPage(pathname) {
  const normalized = normalizePath(pathname);
  return ENTRY_PAGES.find(item => item.path === normalized) || null;
}

module.exports = { ENTRY_PAGES, findEntryPage };
```

- [ ] **Step 4: Run the catalogue test**

Run: `node --test tests/acquisition-catalog.test.cjs`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the catalogue**

```bash
git add seo/acquisition-catalog.cjs tests/acquisition-catalog.test.cjs
git commit -m "test: lock acquisition entry page catalogue"
```

---

### Task 2: Carry entry-page context into Rent Check links

**Files:**
- Create: `acquisition-links.js`
- Create: `tests/acquisition-links.test.cjs`
- Modify: `guides/*/index.html`
- Modify: `rent/*/*/index.html`

**Interfaces:**
- Consumes: a page pathname, its current query string, and optional `data-lawd-cd` / `data-property-type` from `#rentMarketPage`.
- Produces: `buildRentCheckUrl({ basePath, sourcePage, lawdCd, propertyType, search }) -> string` and `wireRentCheckLinks({ doc, location }) -> number`.

- [ ] **Step 1: Write the failing link-builder tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRentCheckUrl, wireRentCheckLinks } = require('../acquisition-links.js');

test('market link carries district, type, source page, and renamed campaign context', () => {
  assert.equal(
    buildRentCheckUrl({
      sourcePage:'/rent/gangnam-gu/apartment/', lawdCd:'11680', propertyType:'apartment',
      search:'?utm_source=reddit&utm_medium=community&utm_campaign=seoul_rent'
    }),
    '/tools/seoul-rent-check/?lawdCd=11680&type=apartment&from=%2Frent%2Fgangnam-gu%2Fapartment%2F&origin_source=reddit&origin_medium=community&origin_campaign=seoul_rent'
  );
});

test('builder rejects unsupported page, district, type, and control characters', () => {
  const href = buildRentCheckUrl({
    sourcePage:'https://evil.example/', lawdCd:'99999', propertyType:'castle',
    search:'?utm_source=bad%0Avalue'
  });
  assert.equal(href, '/tools/seoul-rent-check/?origin_source=badvalue');
});

test('wire updates every generic Rent Check link on a market page', () => {
  const anchors = [{ value:'/tools/seoul-rent-check/', getAttribute(){ return this.value; }, setAttribute(_, value){ this.value = value; } }];
  const doc = {
    querySelector(selector){ return selector === '#rentMarketPage' ? { dataset:{ lawdCd:'11440', propertyType:'villa' } } : null; },
    querySelectorAll(){ return anchors; }
  };
  assert.equal(wireRentCheckLinks({ doc, location:{ pathname:'/rent/mapo-gu/villa/', search:'' } }), 1);
  assert.match(anchors[0].value, /lawdCd=11440&type=villa/);
  assert.match(anchors[0].value, /from=%2Frent%2Fmapo-gu%2Fvilla%2F/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/acquisition-links.test.cjs`

Expected: FAIL with `Cannot find module '../acquisition-links.js'`.

- [ ] **Step 3: Implement the UMD link helper**

```js
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGAcquisitionLinks = api;
  if (root && root.document) {
    const start = () => api.wireRentCheckLinks({ doc:root.document, location:root.location });
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const DISTRICTS = new Set(['11680','11200','11440','11170','11560','11620','11230','11410','11290','11215']);
  const TYPES = new Set(['apartment','officetel','villa']);
  const SOURCE_RE = /^\/(?:guides\/[a-z0-9-]+\/|rent\/[a-z0-9-]+\/(?:apartment|officetel|villa)\/)$/;

  function safeCampaign(value) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
  }

  function safeSourcePage(value) {
    const source = String(value || '');
    return SOURCE_RE.test(source) ? source : '';
  }

  function buildRentCheckUrl({ basePath='/tools/seoul-rent-check/', sourcePage='', lawdCd='', propertyType='', search='' } = {}) {
    const current = new URLSearchParams(String(search || ''));
    const next = new URLSearchParams();
    if (DISTRICTS.has(String(lawdCd))) next.set('lawdCd', String(lawdCd));
    if (TYPES.has(String(propertyType))) next.set('type', String(propertyType));
    const source = safeSourcePage(sourcePage);
    if (source) next.set('from', source);
    for (const [input, output] of [['utm_source','origin_source'],['utm_medium','origin_medium'],['utm_campaign','origin_campaign']]) {
      const value = safeCampaign(current.get(input) || current.get(output));
      if (value) next.set(output, value);
    }
    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function wireRentCheckLinks({ doc, location } = {}) {
    if (!doc || !location || typeof doc.querySelectorAll !== 'function') return 0;
    const market = typeof doc.querySelector === 'function' ? doc.querySelector('#rentMarketPage') : null;
    const values = {
      sourcePage:location.pathname,
      lawdCd:market && market.dataset ? market.dataset.lawdCd : '',
      propertyType:market && market.dataset ? market.dataset.propertyType : '',
      search:location.search || ''
    };
    let changed = 0;
    doc.querySelectorAll('a[href^="/tools/seoul-rent-check/"]').forEach(anchor => {
      const current = String(anchor.getAttribute('href') || '').split('?', 1)[0];
      if (current !== '/tools/seoul-rent-check/') return;
      anchor.setAttribute('href', buildRentCheckUrl({ ...values, basePath:current }));
      changed += 1;
    });
    return changed;
  }

  return { safeCampaign, safeSourcePage, buildRentCheckUrl, wireRentCheckLinks };
});
```

- [ ] **Step 4: Load the helper on all 37 English entry pages**

For every file returned by:

```bash
find guides rent -mindepth 2 -maxdepth 3 -name index.html | sort
```

insert this deferred script immediately after `privacy-consent.js`:

```html
<script defer src="/acquisition-links.js"></script>
```

Use `apply_patch` for the HTML changes. Do not add the helper to Chinese pages in this release.

- [ ] **Step 5: Extend the tests to verify page coverage**

Add to `tests/acquisition-links.test.cjs`:

```js
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

test('all English acquisition pages load the contextual link helper', () => {
  for (const item of ENTRY_PAGES) {
    assert.match(fs.readFileSync(item.file, 'utf8'), /<script defer src="\/acquisition-links\.js"><\/script>/, item.file);
  }
});
```

- [ ] **Step 6: Run the link tests**

Run: `node --test tests/acquisition-links.test.cjs tests/acquisition-catalog.test.cjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit contextual links**

```bash
git add acquisition-links.js seo/acquisition-catalog.cjs guides rent tests/acquisition-links.test.cjs
git commit -m "feat: connect search pages to contextual rent checks"
```

---

### Task 3: Preserve the original entry page through Rent Check and lead capture

**Files:**
- Modify: `tools/seoul-rent-check/prefill-utils.js`
- Modify: `app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `lead-capture.js`
- Modify: `tests/rent-check-prefill.test.cjs`
- Modify: `tests/cold-start-analytics.test.cjs`
- Modify: `tests/lead-capture-source.test.cjs`

**Interfaces:**
- Consumes: `lawdCd`, `type`, `from`, `origin_source`, `origin_medium`, and `origin_campaign` query parameters.
- Produces: `readRentCheckPrefill(search)` with optional `sourcePage`, `originSource`, `originMedium`, and `originCampaign`; GA4 events with `source_page` and `tool_page`; lead payload attribution using the same validated origin context.

- [ ] **Step 1: Add failing prefill and analytics assertions**

Add to `tests/rent-check-prefill.test.cjs`:

```js
test('prefill accepts all ten districts and validated acquisition context', () => {
  assert.deepEqual(
    readRentCheckPrefill('?lawdCd=11230&type=apartment&from=%2Frent%2Fdongdaemun-gu%2Fapartment%2F&origin_source=reddit&origin_medium=community&origin_campaign=seoul_rent'),
    {
      lawdCd:'11230', type:'apartment', sourcePage:'/rent/dongdaemun-gu/apartment/',
      originSource:'reddit', originMedium:'community', originCampaign:'seoul_rent'
    }
  );
  assert.deepEqual(readRentCheckPrefill('?lawdCd=99999&from=https://evil.example/&origin_source=x%0Ay'), { originSource:'xy' });
});
```

Add to `tests/cold-start-analytics.test.cjs`:

```js
test('Rent Check events distinguish the original source page from the tool page', () => {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /source_page/);
    assert.match(source, /tool_page/);
    assert.match(source, /acquisitionContext/);
  }
});
```

Add to `tests/lead-capture-source.test.cjs`:

```js
test('lead attribution reads validated origin campaign values without analytics PII', () => {
  const source = fs.readFileSync('lead-capture.js', 'utf8');
  assert.match(source, /originSource/);
  assert.match(source, /originMedium/);
  assert.match(source, /originCampaign/);
  assert.doesNotMatch(source, /gtag\([^\n]*(email|helpMessage)/);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `node --test tests/rent-check-prefill.test.cjs tests/cold-start-analytics.test.cjs tests/lead-capture-source.test.cjs`

Expected: FAIL because five districts and acquisition fields are not yet accepted, and `tool_page` is absent.

- [ ] **Step 3: Extend the prefill parser**

In `tools/seoul-rent-check/prefill-utils.js`:

```js
const AREAS = new Set(['11680','11200','11440','11170','11560','11620','11230','11410','11290','11215']);
const SOURCE_RE = /^\/(?:guides\/[a-z0-9-]+\/|rent\/[a-z0-9-]+\/(?:apartment|officetel|villa)\/)$/;

function safeCampaign(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
}
```

After the existing numeric fields are parsed, add:

```js
const sourcePage = String(params.get('from') || '');
if (SOURCE_RE.test(sourcePage)) result.sourcePage = sourcePage;
for (const [queryName, resultName] of [
  ['origin_source','originSource'],
  ['origin_medium','originMedium'],
  ['origin_campaign','originCampaign']
]) {
  const value = safeCampaign(params.get(queryName));
  if (value) result[resultName] = value;
}
```

- [ ] **Step 4: Carry context through all four Rent Check runtimes**

In each runtime, initialize:

```js
let acquisitionContext = {};
```

Update `applyExplorerPrefill()` so its parsed object is retained:

```js
acquisitionContext = KHGRentCheckPrefill.readRentCheckPrefill(location.search);
const prefill = acquisitionContext;
```

Update `trackBase()` to emit:

```js
source_page:acquisitionContext.sourcePage || location.pathname,
tool_page:location.pathname,
```

Update `emitResult()` so the event detail uses:

```js
sourcePage:acquisitionContext.sourcePage || location.pathname,
```

The embedded home runtimes keep `/` or `/zh/` because those pages do not load a `from` value.

- [ ] **Step 5: Preserve campaign values in the lead payload**

In `lead-capture.js`, make `attribution()` prefer the validated prefill context:

```js
const acquisition = root.KHGRentCheckPrefill
  ? root.KHGRentCheckPrefill.readRentCheckPrefill(root.location && root.location.search || '')
  : {};
return {
  utmSource:acquisition.originSource || params.get('utm_source') || '',
  utmMedium:acquisition.originMedium || params.get('utm_medium') || '',
  utmCampaign:acquisition.originCampaign || params.get('utm_campaign') || '',
  referrerHost
};
```

Do not add these campaign values to GA4 custom event params; GA4 maintains its own campaign session attribution.

- [ ] **Step 6: Run the targeted acquisition funnel tests**

Run: `node --test tests/rent-check-prefill.test.cjs tests/cold-start-analytics.test.cjs tests/lead-capture-source.test.cjs tests/lead-core.test.cjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit source preservation**

```bash
git add tools/seoul-rent-check/prefill-utils.js app.js tools/seoul-rent-check/app.js zh/app.js zh/tools/seoul-rent-check/app.js lead-capture.js tests/rent-check-prefill.test.cjs tests/cold-start-analytics.test.cjs tests/lead-capture-source.test.cjs
git commit -m "feat: preserve acquisition source through rent check"
```

---

### Task 4: Repair guide-hub navigation and static content discovery

**Files:**
- Create: `tests/acquisition-navigation.test.cjs`
- Modify: `guides/*/index.html`
- Modify: `rent/*/*/index.html`

**Interfaces:**
- Consumes: the seven approved guide slugs and 37 English entry pages.
- Produces: a consistent `/guides/` header destination and at least two static sibling-guide links from every English guide article.

- [ ] **Step 1: Write the failing navigation test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

const guideSlugs = [
  'wolse-vs-jeonse', 'korea-rental-contract-checklist', 'seoul-brokerage-fees',
  'before-you-sign', 'rent-apartment-korea-foreigner', 'korea-rental-scams', 'seoul-officetel-rent'
];

test('every English entry page sends its header Guides action to the hub', () => {
  for (const item of ENTRY_PAGES) {
    const html = fs.readFileSync(item.file, 'utf8');
    const header = (html.match(/<header[\s\S]*?<\/header>/) || [])[0] || '';
    assert.match(header, /href="\/guides\/"[^>]*>Guides<\/a>/, item.file);
  }
});

test('every guide article links at least two sibling guides', () => {
  for (const slug of guideSlugs) {
    const html = fs.readFileSync(`guides/${slug}/index.html`, 'utf8');
    const siblings = guideSlugs.filter(other => other !== slug && html.includes(`/guides/${other}/`));
    assert.ok(siblings.length >= 2, `${slug}: ${siblings.join(', ')}`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/acquisition-navigation.test.cjs`

Expected: FAIL because several headers still link to `/guides/wolse-vs-jeonse/` and some guides lack sibling links.

- [ ] **Step 3: Point every English entry-page header at the hub**

Within `<header>` only, replace:

```html
<a href="/guides/wolse-vs-jeonse/">Guides</a>
```

with:

```html
<a href="/guides/">Guides</a>
```

Do not replace in-body contextual links to the Wolse vs Jeonse article.

- [ ] **Step 4: Add two or more relevant sibling links to each guide**

Use this exact mapping and preserve existing tool links:

```js
const siblingMap = {
  'wolse-vs-jeonse': [
    { href:'/guides/rent-apartment-korea-foreigner/', title:'How to rent in Korea as a foreigner', description:'Follow the complete process from budget and documents to signing and move-in.' },
    { href:'/guides/before-you-sign/', title:'Before you sign', description:'Review the property, owner, deposit and contract checks before paying.' }
  ],
  'korea-rental-contract-checklist': [
    { href:'/guides/before-you-sign/', title:'Before you sign', description:'Put the highest-risk registry and deposit checks into the right order.' },
    { href:'/guides/korea-rental-scams/', title:'Korea rental scams and red flags', description:'Recognize the warning signs that should stop a payment or contract.' }
  ],
  'seoul-brokerage-fees': [
    { href:'/guides/rent-apartment-korea-foreigner/', title:'How to rent in Korea as a foreigner', description:'Place brokerage fees inside the full rental budget and move-in process.' },
    { href:'/guides/before-you-sign/', title:'Before you sign', description:'Check the documents and terms that matter before money changes hands.' }
  ],
  'before-you-sign': [
    { href:'/guides/korea-rental-contract-checklist/', title:'Korea rental contract checklist', description:'Use the complete contract-day checklist for the property, landlord and fees.' },
    { href:'/guides/korea-rental-scams/', title:'Korea rental scams and red flags', description:'Review seven warning signs before sending a holding payment or deposit.' }
  ],
  'rent-apartment-korea-foreigner': [
    { href:'/guides/wolse-vs-jeonse/', title:'Wolse vs Jeonse', description:'Understand how Korean deposits and monthly rent trade off.' },
    { href:'/guides/before-you-sign/', title:'Before you sign', description:'Verify the property, owner, contract and deposit protections before paying.' }
  ],
  'korea-rental-scams': [
    { href:'/guides/before-you-sign/', title:'Before you sign', description:'Follow the practical checks that reduce contract and deposit risk.' },
    { href:'/guides/korea-rental-contract-checklist/', title:'Korea rental contract checklist', description:'Work through the property, landlord, fee and clause checks on contract day.' }
  ],
  'seoul-officetel-rent': [
    { href:'/guides/seoul-brokerage-fees/', title:'Seoul brokerage fees', description:'Estimate the applicable agent-fee ceiling for your rental structure.' },
    { href:'/guides/rent-apartment-korea-foreigner/', title:'How to rent in Korea as a foreigner', description:'Compare officetels within the complete search, signing and move-in process.' }
  ]
};
```

Render the two mapped entries as this visible block before each article footer:

```html
<section class="related-links" aria-label="Related Korea rental guides">
  <a href="/guides/rent-apartment-korea-foreigner/"><strong>How to rent in Korea as a foreigner</strong><span>Follow the complete process from budget and documents to signing and move-in.</span></a>
  <a href="/guides/before-you-sign/"><strong>Before you sign</strong><span>Review the property, owner, deposit and contract checks before paying.</span></a>
</section>
```

The sample is the exact `wolse-vs-jeonse` block; use the corresponding two entries from `siblingMap` for each other guide. Do not duplicate full paragraphs.

- [ ] **Step 5: Run navigation and existing SEO tests**

Run: `node --test tests/acquisition-navigation.test.cjs tests/guide-pages.test.cjs tests/seo-discovery.test.cjs tests/rent-market-pages.test.cjs tests/v10-9-rent-market-expansion.test.cjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit navigation improvements**

```bash
git add guides rent tests/acquisition-navigation.test.cjs
git commit -m "fix: strengthen acquisition page discovery"
```

---

### Task 5: Record the first operating baseline and verify the release

**Files:**
- Create: `docs/operations/2026-08-26-acquisition-baseline.md`

**Interfaces:**
- Consumes: the catalogue, repository tests, Search Console trailing-28-day Performance totals, and GA4 trailing-28-day funnel totals.
- Produces: one dated baseline used for the Week 4, Week 8, and Week 12 comparisons in the design spec. If authenticated Search Console or GA4 access is unavailable, record the access blocker and capture instructions in a separate uncommitted handoff note; do not invent live values or commit an incomplete baseline document.

- [ ] **Step 1: Generate the repository baseline facts**

Run:

```bash
node - <<'NODE'
const { ENTRY_PAGES } = require('./seo/acquisition-catalog.cjs');
console.log(JSON.stringify({
  capturedAt:'2026-08-26',
  entryPages:ENTRY_PAGES.length,
  guides:ENTRY_PAGES.filter(x => x.kind === 'guide').length,
  marketPages:ENTRY_PAGES.filter(x => x.kind === 'market').length,
  queryClusters:[...new Set(ENTRY_PAGES.map(x => x.cluster))]
}, null, 2));
NODE
```

Expected: `entryPages: 37`, `guides: 7`, and `marketPages: 30`.

- [ ] **Step 2: Capture the live Search Console baseline**

In Search Console Performance, use Search type `Web` and Date `Last 28 days`. Record exact totals for clicks, impressions, average CTR, and average position. Export or record the top available queries and pages; if a metric is zero, write `0` rather than omitting it.

- [ ] **Step 3: Capture the live GA4 funnel baseline**

For the same 28-day window, record users, sessions, `rent_check_start`, `rent_check_result`, `lead_form_view`, `lead_submit`, and `help_request`. Record absent events as `0`.

- [ ] **Step 4: Write the baseline document**

Create `docs/operations/2026-08-26-acquisition-baseline.md` with these sections and only observed numeric values:

1. `# Acquisition Baseline`, the date `2026-08-26`, and comparison dates `2026-09-23`, `2026-10-21`, and `2026-11-18`.
2. Repository inventory listing 37 English entry pages, seven guides, and 30 district/type market pages.
3. A Search Console trailing-28-day table with columns `Clicks`, `Impressions`, `CTR`, and `Average position` and exactly one observed-data row.
4. A GA4 trailing-28-day table with columns `Users`, `Sessions`, `Starts`, `Results`, `Lead views`, `Leads`, and `Help requests` and exactly one observed-data row.
5. First release scope listing contextual links, preserved entry-page attribution, guide discovery improvements, zero new indexable URLs, and zero AdSense code.

Commit this document only if both live systems were read successfully. Enter zero for a genuinely absent event or metric; never estimate a value.

- [ ] **Step 5: Run the focused suite**

Run:

```bash
node --test \
  tests/acquisition-catalog.test.cjs \
  tests/acquisition-links.test.cjs \
  tests/acquisition-navigation.test.cjs \
  tests/rent-check-prefill.test.cjs \
  tests/cold-start-analytics.test.cjs \
  tests/lead-capture-source.test.cjs \
  tests/guide-pages.test.cjs \
  tests/rent-market-pages.test.cjs \
  tests/v10-9-rent-market-expansion.test.cjs
```

Expected: all focused tests PASS.

- [ ] **Step 6: Run the full repository verification**

Run:

```bash
node --test tests/*.test.cjs
git diff --check
find api -maxdepth 1 -type f -name '*.js' | wc -l
```

Expected after review hardening: `385/385` tests PASS, `git diff --check` prints nothing, and the API function count is `11`.

- [ ] **Step 7: Commit the verified baseline when live values are available**

```bash
git add docs/operations/2026-08-26-acquisition-baseline.md
git commit -m "docs: record acquisition operating baseline"
```

---

## Release Boundary

Stop after Task 5. The next independent plans are:

1. query-led copy revisions after the baseline identifies which pages have impressions but weak CTR;
2. AdSense application readiness and certified CMP integration; and
3. partner-service interest measurement and the first non-brokerage referral pilot.

Do not combine those projects into this acquisition-foundation release.
