# Localized Seoul Place and Housing Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered district, neighborhood, and housing-type copy with one global-ready English/Simplified-Chinese label registry while preserving Korean names and stable IDs.

**Architecture:** A browser/CommonJS UMD catalog owns display labels only; provider codes, URLs, and API payloads remain stable. Client explorers, static selectors, and the server-side SEO renderer consume the same catalog so adding another locale later is a data change instead of a routing rewrite.

**Tech Stack:** Static HTML/JavaScript, CommonJS, Node.js `node:test`, existing Seoul provider and SEO renderer.

**Spec:** `docs/superpowers/specs/2026-08-25-lead-privacy-localization-map-design.md`

## Global Constraints

- Stable values such as `11680`, `gangnam-gu`, `역삼동`, and `officetel` do not change.
- English uses official romanization plus the Korean reference, for example `Gangnam-gu (강남구)`.
- Simplified Chinese uses the established Chinese place name plus the Korean reference, for example `江南区（강남구）`.
- `Officetel` remains a market term and receives a Korean explanatory reference instead of being replaced.
- `Villa` is never the only English label for `연립·다세대`.
- Unknown labels fall back requested locale → English → Korean → stable ID.
- The current checkout has no Git metadata. Run commit steps only in the canonical Git checkout.

---

### Task 1: Create the Shared Location and Housing Label Catalog

**Files:**
- Create: `location-catalog.js`
- Create: `tests/location-catalog.test.cjs`

**Interfaces:**
- Produces: `KHGLocations.districtLabel(code, locale, options)`, `dongLabel(koreanName, locale, options)`, `propertyTypeLabel(type, locale, options)`, `districtSlug(code)`, and frozen `DISTRICTS`, `DONGS`, `PROPERTY_TYPES` records.
- Consumes: locale values `en` and `zh-CN`; accepts `zh` as a normalized alias for `zh-CN`.

- [ ] **Step 1: Read the shared JavaScript test rules**

Run: `cat /root/.codex/plugins/cache/openai-curated-remote/superpowers/6.3.0/skills/test-driven-development/writing-good-tests.md`

- [ ] **Step 2: Write failing public-API tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../location-catalog.js');

test('district labels preserve Korean search and contract names', () => {
  assert.equal(catalog.districtLabel('11680','en'), 'Gangnam-gu (강남구)');
  assert.equal(catalog.districtLabel('11680','zh-CN'), '江南区（강남구）');
  assert.equal(catalog.districtLabel('11440','en'), 'Mapo-gu (마포구)');
});

test('dong labels use established localized names and Korean references', () => {
  assert.equal(catalog.dongLabel('연남동','en'), 'Yeonnam-dong (연남동)');
  assert.equal(catalog.dongLabel('연남동','zh-CN'), '延南洞（연남동）');
  assert.equal(catalog.dongLabel('성수동1가','zh'), '圣水洞1街（성수동1가）');
});

test('housing labels avoid globally misleading standalone villa copy', () => {
  assert.equal(catalog.propertyTypeLabel('officetel','en'), 'Officetel (오피스텔)');
  assert.equal(catalog.propertyTypeLabel('villa','en'), 'Low-rise multifamily / Villa (연립·다세대)');
  assert.equal(catalog.propertyTypeLabel('studio','en'), 'Studio / One-room (원룸)');
});

test('unknown values use deterministic fallbacks', () => {
  assert.equal(catalog.districtLabel('99999','zh-CN'), '99999');
  assert.equal(catalog.dongLabel('새동','zh-CN'), '새동');
  assert.equal(catalog.propertyTypeLabel('new-type','en'), 'new-type');
});
```

- [ ] **Step 3: Verify tests fail for the absent catalog**

Run: `node --test tests/location-catalog.test.cjs`  
Expected: FAIL with `Cannot find module '../location-catalog.js'`.

- [ ] **Step 4: Implement the UMD wrapper and locale helpers**

Use this wrapper and signatures:

```js
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGLocations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function localeKey(locale) {
    return String(locale || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  }
  function withKorean(primary, korean, locale, includeKorean = true) {
    if (!includeKorean || !korean || primary === korean) return primary || korean;
    return localeKey(locale) === 'zh-CN' ? `${primary}（${korean}）` : `${primary} (${korean})`;
  }
  // Frozen records and exported functions follow.
});
```

- [ ] **Step 5: Populate all supported districts**

Use these exact records:

```js
const DISTRICTS = Object.freeze({
  '11680':{ slug:'gangnam-gu', ko:'강남구', en:'Gangnam-gu', 'zh-CN':'江南区' },
  '11440':{ slug:'mapo-gu', ko:'마포구', en:'Mapo-gu', 'zh-CN':'麻浦区' },
  '11170':{ slug:'yongsan-gu', ko:'용산구', en:'Yongsan-gu', 'zh-CN':'龙山区' },
  '11200':{ slug:'seongdong-gu', ko:'성동구', en:'Seongdong-gu', 'zh-CN':'城东区' },
  '11560':{ slug:'yeongdeungpo-gu', ko:'영등포구', en:'Yeongdeungpo-gu', 'zh-CN':'永登浦区' },
  '11620':{ slug:'gwanak-gu', ko:'관악구', en:'Gwanak-gu', 'zh-CN':'冠岳区' },
  '11230':{ slug:'dongdaemun-gu', ko:'동대문구', en:'Dongdaemun-gu', 'zh-CN':'东大门区' },
  '11410':{ slug:'seodaemun-gu', ko:'서대문구', en:'Seodaemun-gu', 'zh-CN':'西大门区' },
  '11290':{ slug:'seongbuk-gu', ko:'성북구', en:'Seongbuk-gu', 'zh-CN':'城北区' },
  '11215':{ slug:'gwangjin-gu', ko:'광진구', en:'Gwangjin-gu', 'zh-CN':'广津区' }
});
```

- [ ] **Step 6: Populate the currently supported neighborhood aliases**

Use records for every key in `providers/seoul-config.cjs` `DONG_SLUG_ALIASES`, including these localized names:

```js
const DONGS = Object.freeze({
  '역삼동':{ slug:'yeoksam-dong', en:'Yeoksam-dong', 'zh-CN':'驿三洞' },
  '논현동':{ slug:'nonhyeon-dong', en:'Nonhyeon-dong', 'zh-CN':'论岘洞' },
  '대치동':{ slug:'daechi-dong', en:'Daechi-dong', 'zh-CN':'大峙洞' },
  '삼성동':{ slug:'samseong-dong', en:'Samseong-dong', 'zh-CN':'三成洞' },
  '청담동':{ slug:'cheongdam-dong', en:'Cheongdam-dong', 'zh-CN':'清潭洞' },
  '연남동':{ slug:'yeonnam-dong', en:'Yeonnam-dong', 'zh-CN':'延南洞' },
  '서교동':{ slug:'seogyo-dong', en:'Seogyo-dong', 'zh-CN':'西桥洞' },
  '망원동':{ slug:'mangwon-dong', en:'Mangwon-dong', 'zh-CN':'望远洞' },
  '합정동':{ slug:'hapjeong-dong', en:'Hapjeong-dong', 'zh-CN':'合井洞' },
  '공덕동':{ slug:'gongdeok-dong', en:'Gongdeok-dong', 'zh-CN':'孔德洞' },
  '아현동':{ slug:'ahyeon-dong', en:'Ahyeon-dong', 'zh-CN':'阿岘洞' },
  '이태원동':{ slug:'itaewon-dong', en:'Itaewon-dong', 'zh-CN':'梨泰院洞' },
  '한남동':{ slug:'hannam-dong', en:'Hannam-dong', 'zh-CN':'汉南洞' },
  '후암동':{ slug:'huam-dong', en:'Huam-dong', 'zh-CN':'厚岩洞' },
  '보광동':{ slug:'bogwang-dong', en:'Bogwang-dong', 'zh-CN':'普光洞' },
  '성수동1가':{ slug:'seongsu-dong-1-ga', en:'Seongsu-dong 1-ga', 'zh-CN':'圣水洞1街' },
  '성수동2가':{ slug:'seongsu-dong-2-ga', en:'Seongsu-dong 2-ga', 'zh-CN':'圣水洞2街' },
  '옥수동':{ slug:'oksu-dong', en:'Oksu-dong', 'zh-CN':'玉水洞' },
  '금호동1가':{ slug:'geumho-dong-1-ga', en:'Geumho-dong 1-ga', 'zh-CN':'金湖洞1街' },
  '금호동2가':{ slug:'geumho-dong-2-ga', en:'Geumho-dong 2-ga', 'zh-CN':'金湖洞2街' },
  '금호동3가':{ slug:'geumho-dong-3-ga', en:'Geumho-dong 3-ga', 'zh-CN':'金湖洞3街' },
  '금호동4가':{ slug:'geumho-dong-4-ga', en:'Geumho-dong 4-ga', 'zh-CN':'金湖洞4街' },
  '여의도동':{ slug:'yeouido-dong', en:'Yeouido-dong', 'zh-CN':'汝矣岛洞' },
  '당산동':{ slug:'dangsan-dong', en:'Dangsan-dong', 'zh-CN':'堂山洞' },
  '문래동':{ slug:'mullae-dong', en:'Mullae-dong', 'zh-CN':'文来洞' },
  '영등포동':{ slug:'yeongdeungpo-dong', en:'Yeongdeungpo-dong', 'zh-CN':'永登浦洞' }
});
```

- [ ] **Step 7: Populate the housing label records**

```js
const PROPERTY_TYPES = Object.freeze({
  apartment:{ ko:'아파트', en:'Apartment', 'zh-CN':'公寓' },
  officetel:{ ko:'오피스텔', en:'Officetel', 'zh-CN':'Officetel' },
  villa:{ ko:'연립·다세대', en:'Low-rise multifamily / Villa', 'zh-CN':'低层多户住宅 / Villa' },
  detached:{ ko:'단독·다가구', en:'Detached & multi-unit house', 'zh-CN':'独栋及多户住宅' },
  studio:{ ko:'원룸', en:'Studio / One-room', 'zh-CN':'单间 / One-room' }
});
```

- [ ] **Step 8: Verify catalog tests pass**

Run: `node --test tests/location-catalog.test.cjs`  
Expected: PASS.

- [ ] **Step 9: Commit the catalog in the canonical repository**

```bash
git add location-catalog.js tests/location-catalog.test.cjs
git commit -m "feat: add shared localized location labels"
```

### Task 2: Make Provider and Explorer Utilities Consume Stable Catalog Data

**Files:**
- Modify: `providers/seoul-config.cjs`
- Modify: `explore/explorer-utils.js`
- Modify: `tests/explorer-provider.test.cjs`
- Modify: `tests/explorer-pages.test.cjs`

**Interfaces:**
- Consumes: `KHGLocations`/`require('../location-catalog.js')` from Task 1.
- Produces: provider constants derived from catalog IDs and locale-aware `KHGExplorer.propertyTypeLabel(type, locale)`.

- [ ] **Step 1: Write failing integration assertions**

```js
test('explorer utility exposes locale-aware housing labels', () => {
  const explorer = require('../explore/explorer-utils.js');
  assert.equal(explorer.propertyTypeLabel('villa','en'), 'Low-rise multifamily / Villa (연립·다세대)');
  assert.equal(explorer.propertyTypeLabel('villa','zh-CN'), '低层多户住宅 / Villa（연립·다세대）');
});

test('provider district codes remain unchanged after catalog adoption', () => {
  const config = require('../providers/seoul-config.cjs');
  assert.equal(config.SEOUL_DISTRICTS['11680'], 'Gangnam-gu');
  assert.equal(config.SEOUL_DISTRICT_SLUGS['gangnam-gu'], '11680');
});
```

- [ ] **Step 2: Verify the locale-aware assertion fails**

Run: `node --test tests/explorer-provider.test.cjs tests/explorer-pages.test.cjs`  
Expected: FAIL because `propertyTypeLabel` accepts only `type` and uses the old labels.

- [ ] **Step 3: Derive provider records without changing public values**

Require `location-catalog.js` and derive `SEOUL_DISTRICTS`, `SEOUL_DISTRICT_SLUGS`, and `DONG_SLUG_ALIASES` from its frozen records. Preserve `Gangnam-gu` rather than the parenthesized UI label in provider/API fields.

- [ ] **Step 4: Delegate explorer labels to the catalog**

Change the function signature to:

```js
function propertyTypeLabel(type, locale = 'en') {
  return rootCatalog.propertyTypeLabel(type, locale);
}
```

Pass the catalog into the UMD factory via `require('../location-catalog.js')` in CommonJS and `globalThis.KHGLocations` in the browser.

- [ ] **Step 5: Verify provider and utility tests pass**

Run: `node --test tests/location-catalog.test.cjs tests/explorer-provider.test.cjs tests/explorer-pages.test.cjs`  
Expected: PASS.

- [ ] **Step 6: Commit the integration in the canonical repository**

```bash
git add providers/seoul-config.cjs explore/explorer-utils.js tests/explorer-provider.test.cjs tests/explorer-pages.test.cjs
git commit -m "refactor: derive explorer labels from shared catalog"
```

### Task 3: Replace Explorer Runtime Label Tables

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `explore/building/index.html`
- Modify: `zh/explore/building/index.html`
- Create: `tests/explorer-localized-labels.test.cjs`

**Interfaces:**
- Consumes: browser global `KHGLocations` loaded before `KHGExplorer` and explorer app scripts.
- Produces: matching localized labels in filters, titles, cards, and building location strings.

- [ ] **Step 1: Write failing runtime source tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('explorer pages load the catalog before explorer utilities', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.ok(html.indexOf('/location-catalog.js') < html.indexOf('/explore/explorer-utils.js'), file);
  }
});

test('Chinese explorer no longer owns partial district/dong/type tables', () => {
  const source = fs.readFileSync('zh/explore/app.js','utf8');
  assert.doesNotMatch(source, /const DISTRICT_NAMES/);
  assert.doesNotMatch(source, /const TYPE_NAMES/);
  assert.doesNotMatch(source, /const DONG_NAMES_ZH/);
  assert.match(source, /KHGLocations\.districtLabel/);
  assert.match(source, /KHGLocations\.dongLabel/);
});
```

- [ ] **Step 2: Verify runtime tests fail**

Run: `node --test tests/explorer-localized-labels.test.cjs`  
Expected: FAIL because the catalog is not loaded and Chinese labels are duplicated locally.

- [ ] **Step 3: Load the catalog on all Explorer pages**

Insert this before `/explore/explorer-utils.js`:

```html
<script src="/location-catalog.js"></script>
```

- [ ] **Step 4: Replace English runtime labels**

Use:

```js
function areaName() { return KHGLocations.districtLabel(areaSelect.value, 'en'); }
function typeName(type = typeSelect.value) { return KHGLocations.propertyTypeLabel(type, 'en'); }
function dongDisplayName(dong) { return KHGLocations.dongLabel(dong, 'en'); }
```

Use `dongDisplayName(item.dong)` in cards and titles but keep raw `item.dong` for URLs and API parameters.

- [ ] **Step 5: Replace Chinese runtime tables**

Delete the three local label constants and use the same functions with `zh-CN`. Preserve raw Korean dongs in API parameters.

- [ ] **Step 6: Update static selector options**

Render English option text such as `Gangnam-gu (강남구)` and Chinese text such as `江南区（강남구）`. Property options use the Task 1 housing labels. `value` attributes remain unchanged.

- [ ] **Step 7: Verify explorer localization tests pass**

Run: `node --test tests/explorer-localized-labels.test.cjs tests/zh-explorer.test.cjs tests/explorer-pages.test.cjs`  
Expected: PASS.

- [ ] **Step 8: Commit Explorer localization in the canonical repository**

```bash
git add explore zh/explore tests/explorer-localized-labels.test.cjs
git commit -m "feat: localize explorer place and housing labels"
```

### Task 4: Make Rent Check and Calculator Selectors Use the Approved Copy

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Modify: `tools/brokerage-fee-calculator/index.html`
- Modify: `zh/tools/brokerage-fee-calculator/index.html`
- Create: `tests/housing-label-copy.test.cjs`

**Interfaces:**
- Consumes: catalog-approved static copy.
- Produces: consistent user-facing choices while preserving form values and calculator rules.

- [ ] **Step 1: Write failing copy tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('English product selectors use explanatory Korean market labels', () => {
  for (const file of ['index.html','tools/seoul-rent-check/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, />Officetel \(오피스텔\)</);
    assert.match(html, />Low-rise multifamily \/ Villa \(연립·다세대\)</);
    assert.match(html, />Detached &amp; multi-unit house \(단독·다가구\)</);
  }
});

test('calculator keeps the legal officetel rule while improving the label', () => {
  const html = fs.readFileSync('tools/brokerage-fee-calculator/index.html','utf8');
  assert.match(html, /value="officetel">Officetel \(오피스텔\) ≤85㎡/);
});
```

- [ ] **Step 2: Verify copy tests fail**

Run: `node --test tests/housing-label-copy.test.cjs`  
Expected: FAIL on the old short labels.

- [ ] **Step 3: Update all six static selectors**

Use the labels defined in the spec and Task 1. Do not change `value`, IDs, calculation formulas, or the existing “studio is not an official transaction category” explanation.

- [ ] **Step 4: Verify product behavior and copy**

Run: `node --test tests/housing-label-copy.test.cjs tests/rent-check-layout.test.cjs tests/tool-pages.test.cjs tests/currency-input.test.cjs`  
Expected: PASS.

- [ ] **Step 5: Commit product copy in the canonical repository**

```bash
git add index.html zh/index.html tools/seoul-rent-check zh/tools/seoul-rent-check tools/brokerage-fee-calculator zh/tools/brokerage-fee-calculator tests/housing-label-copy.test.cjs
git commit -m "feat: clarify Korean housing type labels"
```

### Task 5: Make Generated SEO Pages Use the Same Catalog

**Files:**
- Modify: `seo/seo-page-renderer.cjs`
- Modify: `tests/seo-page-renderer.test.cjs`
- Modify: `tests/seo-dong-data.test.cjs`

**Interfaces:**
- Consumes: CommonJS `require('../location-catalog.js')`.
- Produces: localized SEO titles, headings, breadcrumbs, and location text with unchanged canonical URLs.

- [ ] **Step 1: Add failing renderer assertions**

```js
test('SEO renderer uses the shared catalog for English and Chinese place labels', () => {
  const en = renderer.renderDongPage({ districtCode:'11680', dong:'역삼동', propertyType:'officetel', lang:'en', data:fixture });
  const zh = renderer.renderDongPage({ districtCode:'11680', dong:'역삼동', propertyType:'officetel', lang:'zh', data:fixture });
  assert.match(en, /Gangnam-gu \(강남구\)/);
  assert.match(en, /Yeoksam-dong \(역삼동\)/);
  assert.match(zh, /江南区（강남구）/);
  assert.match(zh, /驿三洞（역삼동）/);
});
```

- [ ] **Step 2: Verify renderer assertions fail**

Run: `node --test tests/seo-page-renderer.test.cjs tests/seo-dong-data.test.cjs`  
Expected: FAIL on the prior scattered display functions.

- [ ] **Step 3: Replace renderer label tables with catalog calls**

Require the catalog once. Use `districtLabel`, `dongLabel`, and `propertyTypeLabel` for visible strings. Continue using `districtSlugFromCode`/stable slug records for canonical and hreflang URLs.

- [ ] **Step 4: Verify renderer and routing regression tests**

Run: `node --test tests/seo-page-renderer.test.cjs tests/seo-dong-data.test.cjs tests/seo-dynamic-routes.test.cjs tests/seo-endpoints.test.cjs`  
Expected: PASS; URLs remain byte-for-byte stable.

- [ ] **Step 5: Commit SEO localization in the canonical repository**

```bash
git add seo/seo-page-renderer.cjs tests/seo-page-renderer.test.cjs tests/seo-dong-data.test.cjs
git commit -m "refactor: share localized labels with SEO renderer"
```

### Task 6: Localization Verification

**Files:**
- Modify only when a failing verification exposes a localization defect.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: a complete label-coverage checkpoint.

- [ ] **Step 1: Run focused localization tests**

Run:

```bash
node --test \
  tests/location-catalog.test.cjs \
  tests/explorer-localized-labels.test.cjs \
  tests/housing-label-copy.test.cjs \
  tests/zh-locale.test.cjs \
  tests/zh-explorer.test.cjs \
  tests/seo-page-renderer.test.cjs
```

Expected: PASS.

- [ ] **Step 2: Run the complete suite**

Run: `node --test tests/*.test.cjs`  
Expected: PASS.

- [ ] **Step 3: Browser-check representative labels**

Verify English and Chinese at home, Rent Check, Explore, a neighborhood SEO page, and a building page:

```text
- Korean reference is visible but not duplicated
- selector values still trigger the same API query
- Chinese punctuation uses full-width parentheses
- long housing labels wrap without horizontal overflow at 390px
- canonical and hreflang URLs are unchanged
```

- [ ] **Step 4: Record the final checkpoint**

In the canonical repository run `git status --short` and confirm only planned label changes remain.
