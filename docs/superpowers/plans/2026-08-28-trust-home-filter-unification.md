# Trust, Home, and Filter Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repeated SaaS-style homepage with a task-first editorial layout, add bilingual About & Methodology pages with commercial-independence disclosure, and unify district selection across Rent Check and Explorer without turning short property-type lists into searchable controls.

**Architecture:** Keep the existing static HTML and progressive-enhancement architecture. Restructure only the English and Chinese home markup, add two static About pages, and generalize `district-combobox.js` so it enhances either `#rentCheckArea` or `#exploreArea` while continuing to dispatch native `change` events. Existing form IDs, API calls, analytics, data providers, and native-select fallbacks remain unchanged.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js built-in test runner, Vercel static hosting and serverless functions

**Spec:** `docs/superpowers/specs/2026-08-28-trust-home-filter-unification-design.md`

## Global Constraints

- English and Simplified Chinese must keep equivalent hierarchy, disclosures, links, and accessible behavior.
- Preserve all existing Rent Check form/result IDs, saved-home mounts, experience-report mounts, lead capture, API contracts, and GA4 event names.
- Do not add gradients, glassmorphism, stock photography, generated illustrations, testimonials, founder identity, or unverified statistics.
- Do not add advertising, affiliate links, lead buyers, checkout, or paid-placement behavior.
- District selection is searchable; property type remains a native select with four or five options.
- Custom controls must progressively enhance native selects and fall back safely when JavaScript or storage is unavailable.
- Interactive targets remain at least `44px` high and must not create horizontal overflow at `320px` CSS width.
- Do not edit, stage, delete, or commit the user-provided `upload/` directory.

---

### Task 1: Lock the editorial homepage contract

**Files:**
- Create: `tests/trust-home-redesign.test.cjs`
- Modify: `index.html`
- Modify: `zh/index.html`

**Interfaces:**
- Consumes: existing Rent Check IDs, `data-home-stage` values, lead/experience/saved-home mounts, locale URLs
- Produces: `.home-evidence-line`, `.home-stage-route`, `.home-rent-workspace`, `.home-trust-note`, `.home-proof-metric`, `.home-guide-row`

- [ ] **Step 1: Write the failing structural test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  { file:'index.html', about:'/about/', guide:'/guides/before-you-sign/' },
  { file:'zh/index.html', about:'/zh/about/', guide:'/zh/guides/before-you-sign/' }
];

test('homepages use the approved five-part editorial structure', () => {
  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    assert.match(html, /class="funnel-hero"/);
    assert.match(html, /class="home-stage-entry[^\"]*home-stage-route/);
    assert.match(html, /id="rent-check"[^>]*class="[^"]*home-rent-workspace|class="[^"]*home-rent-workspace[^"]*"[^>]*id="rent-check"/);
    assert.match(html, /class="home-trust-note"/);
    assert.match(html, /class="funnel-proof-band"/);
    assert.match(html, /class="[^"]*funnel-updated-guides/);
    assert.doesNotMatch(html, /funnel-how|funnel-final-cta/);
    assert.equal((html.match(/data-home-proof-metric/g) || []).length, 2, page.file);
    assert.equal((html.match(/data-home-guide-row/g) || []).length, 4, page.file);
    assert.match(html, new RegExp(`href="${page.about}"`));
    assert.match(html, new RegExp(`href="${page.guide}"`));
  }
});

test('homepages remove redundant marketing labels but preserve product hooks', () => {
  for (const page of pages) {
    const html = fs.readFileSync(page.file, 'utf8');
    assert.doesNotMatch(html, /YOUR NEXT STEP|FREE RENT CHECK|READY TO COMPARE|下一步<\/span>|免费租金检查|准备好比较了吗/);
    for (const id of ['rentCheckForm','rentCheckArea','rentCheckType','rentCheckDeposit','rentCheckRent','rentCheckAreaSqm','rentCheckButton','rentCheckResult']) {
      assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${page.file} ${id}`);
    }
    for (const stage of ['budget','looking','quote','signed']) assert.match(html, new RegExp(`data-home-stage="${stage}"`));
    assert.match(html, /data-lead-capture/);
    assert.match(html, /data-saved-quote-mount/);
  }
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node --test tests/trust-home-redesign.test.cjs`

Expected: FAIL because `.home-stage-route`, `.home-rent-workspace`, `.home-trust-note`, two proof metrics, four guide rows, and About links do not exist and the two redundant sections remain.

- [ ] **Step 3: Restructure both homepages without changing runtime hooks**

Use this structural order in both locale files:

1. Keep `.funnel-hero`, replace its separate three-span `.funnel-trust` sibling with `<p class="home-evidence-line">Official transaction data, explained for foreign renters. <a href="/about/">See how KoreaHomeGuide works →</a></p>` inside the hero, and use the equivalent `/zh/about/` sentence in Chinese.
2. Add `home-stage-route` to the existing `.home-stage-entry`. Remove only its eyebrow span. Keep all four existing anchors, their `data-home-stage` values, destinations, and `.home-stage-return` status node unchanged.
3. Add `home-rent-workspace` to the existing `#rent-check` section. Remove only `FREE RENT CHECK` / `免费租金检查`. Preserve every node from `<form id="rentCheckForm">` through the closing lead-capture section in its current order and with unchanged attributes.
4. After `#rent-check`, insert `<aside class="home-trust-note"><strong>Independent and evidence-led.</strong> KoreaHomeGuide uses reported official rental transactions, does not promote live listings, and does not accept payment to change Rent Check calculations or evidence order. <a href="/about/">Read the method and commercial policy →</a></aside>` and a natural Chinese equivalent with `/zh/about/`.
5. In `.funnel-proof-grid`, keep the `25` and `15` items, add `data-home-proof-metric` to each, and replace the third `Official` item with `<p class="home-proof-source">Source: reported MOLIT rental transactions—not asking prices.</p>` plus the Chinese equivalent.
6. Replace the three `.funnel-guide` anchors with four `.home-guide-row` anchors and add `data-home-guide-row` to each. Use the four titles and destinations from the approved spec.

Delete the complete `.funnel-how` and `.funnel-final-cta` blocks. Add “Before you sign” as the third guide row and move “Seoul officetel rent” to the fourth row. Mirror the meaning and URL prefixes in Chinese.

- [ ] **Step 4: Run the focused structural tests**

Run: `node --test tests/trust-home-redesign.test.cjs tests/cold-start-home-funnel.test.cjs tests/home-stage-entry.test.cjs tests/experience-capture.test.cjs`

Expected: PASS with no changed Rent Check IDs, stages, lead mount, saved-home mount, or experience capture contract.

- [ ] **Step 5: Commit the structural homepage change**

```bash
git add tests/trust-home-redesign.test.cjs index.html zh/index.html
git commit -m "Restructure home around the rent decision"
```

---

### Task 2: Implement the editorial visual rhythm

**Files:**
- Modify: `tests/trust-home-redesign.test.cjs`
- Modify: `cold-start.css`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Task 1 homepage class contract
- Produces: responsive editorial layout and shared native selection-control styling

- [ ] **Step 1: Add failing visual-contract tests**

Append:

```js
test('editorial home styling varies section rhythm and avoids card repetition', () => {
  const css = fs.readFileSync('cold-start.css', 'utf8');
  assert.match(css, /\.home-stage-route\{/);
  assert.match(css, /\.home-stage-route\s+\.home-stage-grid\{/);
  assert.match(css, /\.home-rent-workspace\{/);
  assert.match(css, /\.home-trust-note\{/);
  assert.match(css, /\.home-guide-row\{/);
  assert.match(css, /\.home-proof-source\{/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.doesNotMatch(css, /\.home-guide-row\{[^}]*box-shadow:/);
});

test('closed native property selectors share the district control geometry', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.selection-native\{[^}]*min-height:49px/);
  assert.match(css, /\.selection-native:focus-visible\{[^}]*box-shadow:/);
});
```

- [ ] **Step 2: Run the visual-contract test and verify failure**

Run: `node --test tests/trust-home-redesign.test.cjs`

Expected: FAIL because the new layout selectors and `.selection-native` do not exist.

- [ ] **Step 3: Add the editorial homepage CSS**

Implement these concrete rules in `cold-start.css`:

```css
.home-evidence-line{max-width:680px;margin:22px auto 0;color:var(--muted);font-size:14px}
.home-evidence-line a{color:var(--accent);font-weight:700;text-decoration-thickness:1px;text-underline-offset:4px}
.home-stage-route{padding-top:18px;padding-bottom:44px}
.home-stage-route .home-stage-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.home-stage-route .home-stage-grid a{min-height:88px;padding:18px 20px;border:0;border-right:1px solid var(--line);border-radius:0;background:transparent;box-shadow:none}
.home-stage-route .home-stage-grid a:last-child{border-right:0}
.home-rent-workspace{padding-top:56px;padding-bottom:78px}
.home-trust-note{max-width:1040px;margin:-42px auto 92px;padding:20px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);color:var(--muted)}
.home-trust-note strong{color:var(--ink)}
.funnel-proof-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.home-proof-source{grid-column:1/-1;margin:8px 0 0;color:rgba(255,255,255,.78)}
.funnel-guides{display:block;border-top:1px solid var(--line)}
.home-guide-row{display:grid;grid-template-columns:minmax(110px,.35fr) minmax(220px,.8fr) minmax(260px,1.2fr);gap:28px;align-items:baseline;padding:22px 0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;box-shadow:none}
.home-guide-row:hover{background:var(--surface-soft)}
@media(max-width:720px){
  .home-stage-route .home-stage-grid{grid-template-columns:1fr 1fr}
  .home-stage-route .home-stage-grid a:nth-child(2){border-right:0}
  .home-stage-route .home-stage-grid a:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .home-trust-note{margin:-28px 20px 64px}
  .home-guide-row{grid-template-columns:1fr;gap:6px;padding:20px 0}
}
```

Adjust existing selectors that override these rules so the final computed intent is not restored to equal rounded cards. Use existing color and radius tokens only.

- [ ] **Step 4: Add shared native selector styling**

Add `class="selection-native"` to `#rentCheckType` on four Rent Check pages and `#exploreType` on two Explorer pages. Implement:

```css
.selection-native{width:100%;min-height:49px;padding:0 38px 0 13px;border:1px solid var(--line);border-radius:var(--radius-action);background-color:var(--surface);color:var(--ink);font-weight:600}
.selection-native:focus-visible{border-color:var(--accent);outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
```

Do not add `.selection-native` to district selects because the native district select is visually hidden only after the custom combobox succeeds.

- [ ] **Step 5: Run focused layout and accessibility tests**

Run: `node --test tests/trust-home-redesign.test.cjs tests/accessibility-ui-contract.test.cjs tests/core-ui-consistency.test.cjs tests/rent-check-layout.test.cjs tests/explorer-pages.test.cjs`

Expected: PASS with 44px controls, visible focus, and existing product layout contracts intact.

- [ ] **Step 6: Commit the visual system change**

```bash
git add tests/trust-home-redesign.test.cjs cold-start.css styles.css index.html zh/index.html tools/seoul-rent-check/index.html zh/tools/seoul-rent-check/index.html explore/index.html zh/explore/index.html
git commit -m "Give the home an editorial visual rhythm"
```

---

### Task 3: Add bilingual About & Methodology pages

**Files:**
- Create: `tests/about-methodology.test.cjs`
- Create: `about/index.html`
- Create: `zh/about/index.html`
- Modify: `styles.css`
- Modify: `sitemap-static.xml`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`

**Interfaces:**
- Consumes: existing header/footer, canonical/hreflang, `hello@koreahomeguide.com`, Privacy and Terms conventions
- Produces: `/about/`, `/zh/about/`, `.trust-page`, `.trust-section`, `.trust-principles`, `.commercial-disclosure`

- [ ] **Step 1: Write the failing About-page test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  {file:'about/index.html', canonical:'https://koreahomeguide.com/about/', alt:'https://koreahomeguide.com/zh/about/', privacy:'/privacy/', terms:'/terms/'},
  {file:'zh/about/index.html', canonical:'https://koreahomeguide.com/zh/about/', alt:'https://koreahomeguide.com/about/', privacy:'/zh/privacy/', terms:'/zh/terms/'}
];

test('About and Methodology pages expose source, method, limits and commercial independence', () => {
  for (const page of pages) {
    assert.equal(fs.existsSync(page.file), true, page.file);
    const html = fs.readFileSync(page.file, 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`));
    assert.match(html, new RegExp(`hreflang="(?:en|zh-CN)" href="${page.alt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    for (const marker of ['data-about-why','data-about-sources','data-about-method','data-about-limits','data-about-commercial','data-about-corrections']) assert.match(html, new RegExp(marker));
    assert.match(html, /MOLIT|国土交通部/);
    assert.match(html, /independent project|独立项目/);
    assert.match(html, /advertising|广告/);
    assert.match(html, /referral|推荐合作|合作推荐/);
    assert.match(html, /will not change|不会改变/);
    assert.match(html, /hello@koreahomeguide\.com/);
    assert.match(html, new RegExp(`href="${page.privacy}"`));
    assert.match(html, new RegExp(`href="${page.terms}"`));
    assert.doesNotMatch(html, /one person in Seoul|25 days|25日|founder|创始人/i);
  }
});

test('About pages are discoverable from the sitemap and touched product footers', () => {
  const sitemap = fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/about\//);
  assert.match(sitemap, /https:\/\/koreahomeguide\.com\/zh\/about\//);
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html','explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /href="\/(?:zh\/)?about\/"/, file);
  }
});
```

- [ ] **Step 2: Run the About test and verify failure**

Run: `node --test tests/about-methodology.test.cjs`

Expected: FAIL because the two pages and sitemap/footer links do not exist.

- [ ] **Step 3: Create the English About page**

Create semantic static HTML with this exact English section contract:

```html
<main class="page-shell trust-page">
  <header class="trust-hero"><span class="eyebrow">ABOUT &amp; METHODOLOGY</span><h1>Check the method, not just the answer.</h1><p>KoreaHomeGuide is an independent project that makes Korean public rental data easier for foreign renters to use.</p></header>
  <section class="trust-section" data-about-why><h2>Why this exists</h2><p>Korean rental data and rules are difficult to use when the renter does not read Korean. KoreaHomeGuide organizes public information around the decisions a foreign renter has to make before paying a deposit or signing a lease.</p></section>
  <section class="trust-section" data-about-sources><h2>Data and sources</h2><p>Rent comparisons use rental transactions reported through Korea's Ministry of Land, Infrastructure and Transport (MOLIT). Brokerage calculations follow published Korean rules. Foreign-currency amounts are reference conversions; legal thresholds and calculations remain in Korean won.</p></section>
  <section class="trust-section" data-about-method><h2>How the tools work</h2><p>Rent Check begins with recent contracts in the same district and housing category, then uses bounded size and deposit ranges. It widens the comparison only when evidence is limited and avoids a confident verdict when the sample is insufficient. Officetel calculations do not assume residential-facility eligibility when the required facts are unknown.</p></section>
  <section class="trust-section" data-about-limits><h2>What the data cannot show</h2><p>Official transactions do not fully capture floor, condition, furnishings, management fees, view, exact location, renovation, or negotiation. KoreaHomeGuide is a market reference—not a listing service, appraisal, broker, legal opinion, or guarantee.</p></section>
  <section class="trust-section commercial-disclosure" data-about-commercial><h2>Commercial independence</h2><p>Official transaction data, Rent Check calculations, and evidence order are not paid placements. KoreaHomeGuide may later use clearly labeled advertising or referral partnerships. A commercial relationship will not change the official data, calculation result, or order of evidence shown.</p><p>Individual rental-experience reports are not sold or published as identifiable testimonials.</p></section>
  <section class="trust-section" data-about-corrections><h2>Corrections and contact</h2><p>To report a source, calculation, or translation problem, email <a href="mailto:hello@koreahomeguide.com">hello@koreahomeguide.com</a>. Read the <a href="/privacy/">Privacy notice</a> and <a href="/terms/">Service terms</a>.</p></section>
</main>
```

Use direct prose from the approved spec, not claims about a founder, company size, credentials, or partnerships. Link official primary sources already used by the brokerage and deposit-protection guides.

- [ ] **Step 4: Create the Chinese About page**

Mirror the section order and factual scope in natural Simplified Chinese. Use `独立项目`, `韩国国土交通部申报的租赁成交`, `广告或推荐合作会明确标注`, and `不会改变官方成交数据、租金检查计算或依据排序`. Keep Korean program names in parentheses only where they improve verification.

- [ ] **Step 5: Add About styling, discovery, and footer links**

Add restrained `.trust-page`, `.trust-hero`, `.trust-section`, `.trust-principles`, and `.commercial-disclosure` styles to `styles.css`. Use a readable article width, alternating border emphasis rather than cards, and the existing mobile type scale. Add the two sitemap entries with `lastmod` `2026-08-28`. Add localized About links to the six touched product footers.

- [ ] **Step 6: Run About, privacy, SEO, and navigation tests**

Run: `node --test tests/about-methodology.test.cjs tests/privacy-pages.test.cjs tests/seo-discovery.test.cjs tests/acquisition-navigation.test.cjs tests/contact.test.cjs`

Expected: PASS with canonical/hreflang, sitemap, contact, Privacy, Terms, and navigation contracts intact.

- [ ] **Step 7: Commit the About pages**

```bash
git add tests/about-methodology.test.cjs about/index.html zh/about/index.html styles.css sitemap-static.xml index.html zh/index.html tools/seoul-rent-check/index.html zh/tools/seoul-rent-check/index.html explore/index.html zh/explore/index.html
git commit -m "Add transparent About and methodology pages"
```

---

### Task 4: Generalize the district combobox

**Files:**
- Modify: `tests/district-combobox.test.cjs`
- Modify: `district-combobox.js`

**Interfaces:**
- Consumes: `KHGLocations.RENT_CHECK_DISTRICTS`, native selects with stable option values, `khg_recent_rent_check_districts_v1`
- Produces: `buildSelectOptions(select, catalog, language)`, `mount({ selector, ... })`, `mountAll({ root, doc })`

- [ ] **Step 1: Add failing model and mount tests**

Extend the fake select so it exposes `options`, then add:

```js
test('select-backed district rows keep Explorer options and localized All Seoul', () => {
  const combo = require(comboPath);
  const select = fakeElement('select');
  select.options = [
    {value:'11680', textContent:'Gangnam-gu (강남구)'},
    {value:'11440', textContent:'Mapo-gu (마포구)'},
    {value:'all', textContent:'All supported Seoul'}
  ];
  const rows = combo.buildSelectOptions(select, locations.RENT_CHECK_DISTRICTS, 'en');
  assert.deepEqual(rows.map(row => row.code), ['11680','11440','all']);
  assert.deepEqual(combo.filterDistricts(rows,'서울 전체').map(row => row.code), ['all']);
  assert.deepEqual(combo.filterDistricts(rows,'江南').map(row => row.code), ['11680']);
});

test('Explorer mount selects All Seoul and dispatches the existing change event', () => {
  const combo = require(comboPath);
  const label = fakeElement('label');
  const select = fakeElement('select');
  select.id = 'exploreArea';
  select.value = '11680';
  select.options = [
    {value:'11680', textContent:'Gangnam-gu (강남구)'},
    {value:'11440', textContent:'Mapo-gu (마포구)'},
    {value:'all', textContent:'All supported Seoul'}
  ];
  label.appendChild(select);
  const doc = {
    documentElement:{lang:'en'},
    querySelector(selector){ return selector === '#exploreArea' ? select : null; },
    createElement:fakeElement
  };
  const root = {
    KHGLocations:locations,
    localStorage:memoryStorage(),
    Event:class FakeEvent{constructor(type,options){this.type=type;this.bubbles=options.bubbles;}},
    setTimeout(callback){callback();}
  };
  const wrapper = combo.mount({root,doc,selector:'#exploreArea'});
  const input = wrapper.children[0];
  input.listeners.focus();
  input.value = 'All Seoul';
  input.listeners.input();
  input.listeners.keydown({key:'Enter',preventDefault(){}});
  assert.equal(select.value,'all');
  assert.equal(select.lastEvent.type,'change');
  assert.equal(input.value,'All supported Seoul');
});

test('mountAll enhances Rent Check and Explorer independently', () => {
  const combo = require(comboPath);
  assert.equal(typeof combo.mountAll,'function');
  assert.match(fs.readFileSync(comboPath,'utf8'), /mountAll\(\{root,doc:root\.document\}\)/);
});
```

- [ ] **Step 2: Run the combobox tests and verify failure**

Run: `node --test tests/district-combobox.test.cjs`

Expected: FAIL because `buildSelectOptions`, selector-aware mounting, `all` search, and `mountAll` are absent.

- [ ] **Step 3: Implement option-aware row construction**

Add:

```js
function optionValues(select){
  return Array.from(select && select.options || []).map(option => ({
    code:String(option.value || ''),
    text:String(option.textContent || option.label || '').trim()
  })).filter(option => option.code);
}

function buildSelectOptions(select,catalog,language='en'){
  const catalogRows=new Map(buildDistrictOptions(catalog,language).map(row=>[row.code,row]));
  return optionValues(select).map(option=>{
    if(catalogRows.has(option.code)) return catalogRows.get(option.code);
    if(option.code==='all') return {
      code:'all',
      primary:option.text || (language==='zh-CN'?'全首尔支持地区':'All supported Seoul'),
      secondary:language==='zh-CN'?'15个地图覆盖行政区':'15 mapped districts',
      label:option.text || (language==='zh-CN'?'全首尔支持地区':'All supported Seoul'),
      search:normalizeSearchText(`${option.text} all seoul 서울 전체 全首尔`)
    };
    return null;
  }).filter(Boolean);
}
```

When a fake or legacy select has no `options`, retain the existing full-catalog behavior so current unit tests and native fallback remain stable.

- [ ] **Step 4: Make mount selector-aware and add mountAll**

Change the signature to:

```js
function mount({root=globalThis,doc=root&&root.document,storage,catalog,selector='#rentCheckArea'}={})
```

Use `doc.querySelector(selector)`, build rows from the mounted select, and localize the accessible label as `Area` / `地区`. Do not write `all` to recent storage. Add:

```js
function mountAll({root=globalThis,doc=root&&root.document}={}){
  if(!doc) return [];
  return ['#rentCheckArea','#exploreArea']
    .map(selector=>mount({root,doc,selector}))
    .filter(Boolean);
}
```

Change automatic startup to `api.mountAll({root,doc:root.document})` and export both new functions. Preserve the catch block that restores the native select.

- [ ] **Step 5: Run the complete combobox tests**

Run: `node --test tests/district-combobox.test.cjs tests/accessibility-ui-contract.test.cjs`

Expected: PASS for multilingual search, recent options, current-selection omission, search reselection, Escape, Enter, native change dispatch, All Seoul, and fallback restoration.

- [ ] **Step 6: Commit the generic combobox**

```bash
git add tests/district-combobox.test.cjs district-combobox.js
git commit -m "Share district search with Explorer"
```

---

### Task 5: Integrate district search into both Explorers

**Files:**
- Modify: `tests/district-combobox.test.cjs`
- Modify: `tests/explorer-pages.test.cjs`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`

**Interfaces:**
- Consumes: Task 4 automatic `mountAll`, Explorer native `#exploreArea` change handlers, popular-area chips
- Produces: searchable district selection on both Explorer locales with existing compare/map/history behavior

- [ ] **Step 1: Add failing integration tests**

Append:

```js
test('both Explorer pages load district search before their locale app', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    assert.equal((html.match(/id="exploreArea"/g)||[]).length,1,file);
    assert.ok(html.indexOf('/location-catalog.js') < html.indexOf('/district-combobox.js'),file);
    assert.ok(html.indexOf('/district-combobox.js') < html.indexOf(file.startsWith('zh/')?'/zh/explore/app.js':'/explore/app.js'),file);
    assert.match(html,/id="exploreType"[^>]*class="[^"]*selection-native/);
  }
});
```

Add to `tests/explorer-pages.test.cjs`:

```js
test('Explorer keeps native area and property values for progressive enhancement', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html,/id="exploreArea"/);
    assert.match(html,/value="all"/);
    for (const type of ['officetel','apartment','villa','detached']) assert.match(html,new RegExp(`value="${type}"`));
  }
});
```

- [ ] **Step 2: Run integration tests and verify failure**

Run: `node --test tests/district-combobox.test.cjs tests/explorer-pages.test.cjs`

Expected: FAIL because Explorer does not load `district-combobox.js` and property selects lack `.selection-native` until Task 2 markup is complete.

- [ ] **Step 3: Wire the script in safe order**

On both Explorer pages, load:

```html
<script src="/location-catalog.js"></script>
<script src="/district-combobox.js"></script>
<script src="/explore/explorer-utils.js"></script>
```

Keep the existing locale app last. Do not change `explore/app.js` or `zh/explore/app.js`; they must continue reading and writing the native select and listening for `change`.

- [ ] **Step 4: Run Explorer handoff, map, and page tests**

Run: `node --test tests/district-combobox.test.cjs tests/explorer-pages.test.cjs tests/explorer-rent-check-handoff.test.cjs tests/explorer-map-source.test.cjs tests/explorer-map-layout.test.cjs tests/explorer-discovery.test.cjs`

Expected: PASS with filter changes clearing stale map selection, updating history and handoff links, and preserving All Seoul behavior.

- [ ] **Step 5: Commit Explorer integration**

```bash
git add tests/district-combobox.test.cjs tests/explorer-pages.test.cjs explore/index.html zh/explore/index.html
git commit -m "Use shared district search in Explorer"
```

---

### Task 6: Verify the complete local story

**Files:**
- Modify only if a test or browser check exposes a regression; each fix requires a failing regression test first

**Interfaces:**
- Consumes: Tasks 1–5
- Produces: verified local candidate ready for main and Production

- [ ] **Step 1: Run focused feature tests**

Run:

```bash
node --test \
  tests/trust-home-redesign.test.cjs \
  tests/about-methodology.test.cjs \
  tests/district-combobox.test.cjs \
  tests/explorer-pages.test.cjs \
  tests/cold-start-home-funnel.test.cjs \
  tests/accessibility-ui-contract.test.cjs \
  tests/privacy-pages.test.cjs \
  tests/seo-discovery.test.cjs
```

Expected: all focused tests pass with zero failures.

- [ ] **Step 2: Run the full automated suite and syntax checks**

Run:

```bash
node --test
node --check district-combobox.js
node --check app.js
node --check zh/app.js
node --check explore/app.js
node --check zh/explore/app.js
git diff --check
```

Expected: all tests and syntax checks exit `0`; diff check prints nothing.

- [ ] **Step 3: Start the local static server**

Run: `python3 -m http.server 4173`

Keep the session ID for shutdown after browser verification.

- [ ] **Step 4: Verify desktop and mobile visual states with browser automation**

Open and inspect:

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/zh/`
- `http://127.0.0.1:4173/about/`
- `http://127.0.0.1:4173/zh/about/`
- `http://127.0.0.1:4173/explore/`
- `http://127.0.0.1:4173/zh/explore/`

Capture full-page screenshots at a desktop viewport and a `390px`-wide mobile viewport. Confirm five home groups, no repeated final CTA, two Explorer metrics, four guide rows, readable About disclosure, 44px controls, and no horizontal overflow.

- [ ] **Step 5: Verify interactions in both locales**

In browser automation:

1. Search `강남`, `Gangnam`, or `江南` in a home Rent Check district combobox and select Gangnam.
2. Change property type with the native selector.
3. Submit the existing default quote and wait for `Comparison complete` / localized status and visible evidence.
4. Open each Explorer, search for Mapo / 麻浦, select it, choose Apartment, and click Compare.
5. Confirm URL state uses `lawdCd=11440&type=apartment`, results title matches the locale, and the map/result shell appears.
6. Search and select All supported Seoul / 全首尔支持地区 and confirm `lawdCd=all` behavior remains available.
7. Follow the About and language-switch links in both directions.
8. Check console errors; allow only the already-known external/deprecation noise if it is unchanged and unrelated.

- [ ] **Step 6: Stop the local server and inspect the final diff**

Stop the stored server session with `Ctrl-C`, then run:

```bash
git status --short
git diff --stat main...HEAD
git diff --check main...HEAD
```

Expected: only planned project files plus the two docs are committed; `upload/` remains untracked and untouched.

---

### Task 7: Integrate, deploy, and verify Production

**Files:**
- No source edits unless Production exposes a reproducible regression; write a failing test before any fix

**Interfaces:**
- Consumes: verified feature branch
- Produces: GitHub `main`, Vercel Production deployment, live English/Chinese verification report

- [ ] **Step 1: Review branch history and tree**

Run:

```bash
git log --oneline main..HEAD
git diff --stat main...HEAD
git status --short
```

Expected: focused commits for design, home structure, visual rhythm, About pages, generic combobox, and Explorer integration; only `upload/` remains untracked.

- [ ] **Step 2: Merge without rewriting user history**

Use a normal fast-forward or merge commit consistent with the branch relationship. Do not force-push, reset, rebase published commits, or stage `upload/`.

- [ ] **Step 3: Push GitHub main and wait for Vercel Production**

Push with the configured GitHub connection. Verify the returned remote `main` SHA, then inspect the Vercel deployment until it is `READY`, `target=production`, and its `githubCommitSha` equals that remote SHA.

- [ ] **Step 4: Repeat the critical Production browser checks**

Verify:

- `https://koreahomeguide.com/`
- `https://koreahomeguide.com/zh/`
- `https://koreahomeguide.com/about/`
- `https://koreahomeguide.com/zh/about/`
- `https://koreahomeguide.com/explore/`
- `https://koreahomeguide.com/zh/explore/`

Repeat one English Rent Check, one Chinese About check, one English Explorer district search, and one Chinese Explorer district search. Confirm the deployed source contains no quote money in navigation URLs and no new console errors.

- [ ] **Step 5: Inspect post-deploy runtime errors**

Query Vercel runtime errors for the project since deployment. Report the existing `url.parse()` deprecation warning separately and do not attribute it to this static redesign unless its route/count changes materially.

- [ ] **Step 6: Report outcome and remaining risks**

Report:

- remote `main` SHA;
- Vercel deployment ID and READY status;
- total automated test count and failures;
- pages and interactions verified;
- whether GA4 event names and API payloads remained unchanged;
- any remaining warning or visual limitation;
- confirmation that no operational Sheet row or user upload file was changed.
