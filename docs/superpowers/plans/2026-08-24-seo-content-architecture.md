# KoreaHomeGuide SEO Content Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing single-page KoreaHomeGuide into a search-oriented site with standalone tools, 15 MOLIT-backed rent-market pages, six localized guides, and crawlable internal linking while preserving the current homepage and v7.3.1 behavior.

**Architecture:** Keep the homepage and existing browser utilities as the product shell. Add a shared six-month market-statistics core/API, then render static SEO landing pages that fetch fresh statistics at runtime. Tool and guide pages reuse existing calculation/rent-check utilities rather than duplicating business logic.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Vercel Node serverless functions, Node.js built-in `node:test`, existing MOLIT public-data API integration.

**Spec:** `docs/superpowers/specs/2026-08-24-seo-content-architecture-design.md`

## Global Constraints

- Preserve the existing `/` and `/zh/` homepage behavior, including native USD/CNY input, FX API, Rent Check, calculator, and Contact.
- Do not add a database, account system, listing marketplace, Google Maps migration, paid FX provider, or 25-district rollout.
- Market pages use only completed months and never blend zero-rent jeonse transactions into monthly-rent medians.
- Data copy must describe reported MOLIT transactions as market references, never appraisals.
- Chinese equivalents exist only for tool and guide pages in Phase 1; market pages remain English-only.
- Every indexable page must have a self-canonical URL and must be reachable by internal links as well as sitemap.

---

### Task 1: Shared six-month rent-market statistics core

**Files:**
- Create: `lib/rent-market-core.cjs`
- Test: `tests/rent-market-core.test.cjs`

**Interfaces:**
- Consumes: transaction objects shaped like `{ building, area, deposit, monthlyRent, contractDate, type }` from `lib/real-price-core.cjs`.
- Produces: `buildRentMarketStats(items, { referenceDate, months })` returning `{ monthsUsed, totalContracts, monthlyRentCount, medianDepositWon, medianMonthlyRentWon, jeonseCount, medianJeonseDepositWon, sizeBands, quarterChangePct, recentContracts, dataThroughMonth }`.

- [ ] **Step 1: Write the failing core-statistics test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRentMarketStats } = require('../lib/rent-market-core.cjs');

test('buildRentMarketStats separates monthly rent from jeonse and uses completed months only', () => {
  const items = [
    { building:'A', area:'25', deposit:'1,000', monthlyRent:'80', contractDate:'2026-07-10', type:'officetel' },
    { building:'B', area:'28', deposit:'2,000', monthlyRent:'100', contractDate:'2026-06-10', type:'officetel' },
    { building:'C', area:'30', deposit:'10,000', monthlyRent:'0', contractDate:'2026-05-10', type:'officetel' },
    { building:'Current month', area:'25', deposit:'1,000', monthlyRent:'500', contractDate:'2026-08-03', type:'officetel' }
  ];
  const stats = buildRentMarketStats(items, { referenceDate:new Date('2026-08-24T00:00:00Z'), months:6 });
  assert.equal(stats.totalContracts, 3);
  assert.equal(stats.monthlyRentCount, 2);
  assert.equal(stats.medianMonthlyRentWon, 900000);
  assert.equal(stats.medianDepositWon, 15000000);
  assert.equal(stats.jeonseCount, 1);
  assert.equal(stats.medianJeonseDepositWon, 100000000);
  assert.equal(stats.dataThroughMonth, '2026-07');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/rent-market-core.test.cjs`
Expected: FAIL because `../lib/rent-market-core.cjs` does not exist.

- [ ] **Step 3: Implement the statistics core**

Create `lib/rent-market-core.cjs` with:

```js
const { median, completedMonthKeys, normalizeTransaction } = require('./rent-check-core.cjs');

const SIZE_BANDS = [
  { key:'under20', label:'Under 20㎡', min:0, max:20 },
  { key:'20to30', label:'20–30㎡', min:20, max:30 },
  { key:'30to40', label:'30–40㎡', min:30, max:40 },
  { key:'40to60', label:'40–60㎡', min:40, max:60 },
  { key:'60plus', label:'60㎡+', min:60, max:Infinity }
];

function monthKey(date) {
  const m = String(date || '').match(/^(\d{4})-(\d{2})-/);
  return m ? `${m[1]}${m[2]}` : '';
}

function pctChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return Math.round((((current - previous) / previous) * 100) * 10) / 10;
}

function buildRentMarketStats(items, options = {}) {
  const months = Number(options.months || 6);
  const referenceDate = options.referenceDate || new Date();
  const validMonths = completedMonthKeys(referenceDate, months);
  const validMonthSet = new Set(validMonths);
  const normalized = (items || []).map(normalizeTransaction).filter(Boolean)
    .filter(item => validMonthSet.has(monthKey(item.contractDate)));

  const monthly = normalized.filter(item => item.monthlyRentWon > 0);
  const jeonse = normalized.filter(item => item.monthlyRentWon === 0);
  const firstQuarterMonths = new Set(validMonths.slice(0, 3));
  const priorQuarterMonths = new Set(validMonths.slice(3, 6));
  const currentQuarter = monthly.filter(item => firstQuarterMonths.has(monthKey(item.contractDate)));
  const previousQuarter = monthly.filter(item => priorQuarterMonths.has(monthKey(item.contractDate)));
  const currentMedian = median(currentQuarter.map(item => item.monthlyRentWon));
  const previousMedian = median(previousQuarter.map(item => item.monthlyRentWon));

  const sizeBands = SIZE_BANDS.map(band => {
    const rows = monthly.filter(item => item.areaSqm >= band.min && item.areaSqm < band.max);
    return {
      key: band.key,
      label: band.label,
      count: rows.length,
      medianMonthlyRentWon: median(rows.map(item => item.monthlyRentWon)),
      medianDepositWon: median(rows.map(item => item.depositWon))
    };
  });

  const recentContracts = [...normalized]
    .sort((a,b) => String(b.contractDate).localeCompare(String(a.contractDate)))
    .slice(0,10);

  const latestMonth = validMonths[0] || '';
  return {
    monthsUsed: months,
    totalContracts: normalized.length,
    monthlyRentCount: monthly.length,
    medianDepositWon: median(monthly.map(item => item.depositWon)),
    medianMonthlyRentWon: median(monthly.map(item => item.monthlyRentWon)),
    jeonseCount: jeonse.length,
    medianJeonseDepositWon: median(jeonse.map(item => item.depositWon)),
    sizeBands,
    quarterChangePct: pctChange(currentMedian, previousMedian),
    recentContracts,
    dataThroughMonth: latestMonth ? `${latestMonth.slice(0,4)}-${latestMonth.slice(4)}` : null
  };
}

module.exports = { SIZE_BANDS, pctChange, buildRentMarketStats };
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/rent-market-core.test.cjs`
Expected: PASS.

- [ ] **Step 5: Commit the statistics core**

```bash
git add lib/rent-market-core.cjs tests/rent-market-core.test.cjs
git commit -m "feat: add rent market statistics core"
```

---

### Task 2: Six-month MOLIT market API

**Files:**
- Create: `api/rent-market.js`
- Modify: `lib/real-price-core.cjs`
- Test: `tests/rent-market-api.test.cjs`

**Interfaces:**
- Consumes: GET query `type`, `lawdCd`, optional `months=6`.
- Produces: JSON `{ districtCode, propertyType, ...buildRentMarketStats(...) }`.

- [ ] **Step 1: Write the failing API-contract test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('rent-market API exists and validates five-digit district plus supported type', () => {
  assert.equal(fs.existsSync('api/rent-market.js'), true);
  const source = fs.readFileSync('api/rent-market.js','utf8');
  assert.match(source, /buildRentMarketStats/);
  assert.match(source, /completedMonths/);
  assert.match(source, /s-maxage=3600/);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/rent-market-api.test.cjs`
Expected: FAIL because `api/rent-market.js` does not exist.

- [ ] **Step 3: Export a reusable single-month fetch helper**

Add to `lib/real-price-core.cjs`:

```js
async function fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd, fetchImpl = fetch }) {
  const endpoint = endpointForType(type);
  if (!endpoint) throw new TypeError('Unsupported property type.');
  const params = new URLSearchParams({ serviceKey, LAWD_CD:String(lawdCd), DEAL_YMD:String(dealYmd), numOfRows:'1000', pageNo:'1' });
  const upstream = await fetchImpl(`${endpoint}?${params.toString()}`, { headers:{ Accept:'application/xml,text/xml,*/*' } });
  const xml = await upstream.text();
  if (!upstream.ok) throw new Error(`Public API returned HTTP ${upstream.status}.`);
  const resultCode = tag(xml, 'resultCode');
  if (resultCode && resultCode !== '00' && resultCode !== '000') throw new Error(tag(xml,'resultMsg') || `Public API error (${resultCode}).`);
  return parseItems(xml, type);
}
```

Update `module.exports` to include `fetchRentalMonth`.

- [ ] **Step 4: Create `api/rent-market.js`**

```js
const { normalizeServiceKey, completedMonths, fetchRentalMonth } = require('../lib/real-price-core.cjs');
const { buildRentMarketStats } = require('../lib/rent-market-core.cjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error:'Method not allowed' });
  const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);
  if (!serviceKey) return res.status(500).json({ error:'DATA_GO_KR_SERVICE_KEY is not configured in Vercel.' });
  const type = String(req.query.type || 'apartment');
  const lawdCd = String(req.query.lawdCd || '');
  const months = 6;
  if (!['apartment','officetel','villa'].includes(type)) return res.status(400).json({ error:'Unsupported property type.' });
  if (!/^\d{5}$/.test(lawdCd)) return res.status(400).json({ error:'Invalid lawdCd.' });
  try {
    const keys = completedMonths(new Date(), months);
    const batches = await Promise.all(keys.map(dealYmd => fetchRentalMonth({ serviceKey, type, lawdCd, dealYmd })));
    const stats = buildRentMarketStats(batches.flat(), { referenceDate:new Date(), months });
    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ districtCode:lawdCd, propertyType:type, ...stats });
  } catch (_) {
    return res.status(500).json({ error:'Failed to load rent market statistics.' });
  }
};
```

- [ ] **Step 5: Run API tests and existing backend tests**

Run: `node --test tests/rent-market-api.test.cjs tests/fx-api.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit the API**

```bash
git add api/rent-market.js lib/real-price-core.cjs tests/rent-market-api.test.cjs
git commit -m "feat: add six month rent market API"
```

---

### Task 3: Standalone Rent Check and brokerage calculator pages in English and Chinese

**Files:**
- Create: `tools/seoul-rent-check/index.html`
- Create: `tools/seoul-rent-check/app.js`
- Create: `tools/brokerage-fee-calculator/index.html`
- Create: `tools/brokerage-fee-calculator/app.js`
- Create: `zh/tools/seoul-rent-check/index.html`
- Create: `zh/tools/seoul-rent-check/app.js`
- Create: `zh/tools/brokerage-fee-calculator/index.html`
- Create: `zh/tools/brokerage-fee-calculator/app.js`
- Modify: `styles.css`
- Test: `tests/tool-pages.test.cjs`

**Interfaces:**
- Rent Check pages consume `/api/rent-check`, `currency-utils.js`, and locale-specific `rent-check-ui-utils.js`.
- Calculator pages consume `brokerage-utils.js`, `currency-utils.js`, and `/api/fx`.

- [ ] **Step 1: Write the failing tool-page existence/SEO test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = [
  ['tools/seoul-rent-check/index.html','https://koreahomeguide.com/tools/seoul-rent-check/'],
  ['tools/brokerage-fee-calculator/index.html','https://koreahomeguide.com/tools/brokerage-fee-calculator/'],
  ['zh/tools/seoul-rent-check/index.html','https://koreahomeguide.com/zh/tools/seoul-rent-check/'],
  ['zh/tools/brokerage-fee-calculator/index.html','https://koreahomeguide.com/zh/tools/brokerage-fee-calculator/']
];

test('standalone tool pages expose canonical URLs and working utility scripts', () => {
  for (const [file, canonical] of pages) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(html, /currency-utils\.js/);
  }
  assert.match(fs.readFileSync('tools/seoul-rent-check/app.js','utf8'), /api\/rent-check/);
  assert.match(fs.readFileSync('tools/brokerage-fee-calculator/index.html','utf8'), /brokerage-utils\.js/);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/tool-pages.test.cjs`
Expected: FAIL because the tool directories do not exist.

- [ ] **Step 3: Build the four pages using existing form IDs and utilities**

Use the existing homepage Rent Check and calculator markup, but each page must include:

```html
<header class="compact-header">
  <a class="brand" href="/">KoreaHomeGuide</a>
  <nav><a href="/tools/seoul-rent-check/">Rent Check</a><a href="/tools/brokerage-fee-calculator/">Calculator</a><a href="/guides/wolse-vs-jeonse/">Guides</a></nav>
</header>
```

English Rent Check `<title>`: `Seoul Rent Check | Compare Your Quote with Official Rental Data`

English calculator `<title>`: `Korea Brokerage Fee Calculator | Seoul Rental Agent Fee`

Chinese titles respectively:
- `首尔租金检查 | 用韩国官方成交数据比较报价`
- `韩国租房中介费计算器 | 首尔中介费上限`

Each English/Chinese equivalent includes reciprocal `hreflang` links.

- [ ] **Step 4: Add standalone-page layout classes to `styles.css`**

Add reusable `.compact-header`, `.page-shell`, `.tool-hero`, `.tool-card`, `.related-links`, and mobile rules; reuse existing card/input variables and do not alter homepage layout selectors.

- [ ] **Step 5: Run tool-page and v7.3.1 regression tests**

Run: `node --test tests/tool-pages.test.cjs tests/currency-input.test.cjs tests/currency-ui.test.cjs tests/rent-check-layout.test.cjs tests/zh-locale.test.cjs tests/contact.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit standalone tools**

```bash
git add tools zh/tools styles.css tests/tool-pages.test.cjs
git commit -m "feat: add standalone rent and brokerage tools"
```

---

### Task 4: Fifteen English district/property rent-market pages

**Files:**
- Create: `rent-market-page.js`
- Create: 15 files matching `rent/{district}/{type}/index.html`
- Modify: `styles.css`
- Test: `tests/rent-market-pages.test.cjs`

**Interfaces:**
- Each page provides `data-lawd-cd`, `data-property-type`, and district display copy on `<main id="rentMarketPage">`.
- `rent-market-page.js` calls `/api/rent-market?type=...&lawdCd=...` and renders summary metrics, size bands, and recent contracts.

- [ ] **Step 1: Write the failing 15-page metadata test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const districts = {
  'gangnam-gu':'11680', 'mapo-gu':'11440', 'yongsan-gu':'11170', 'seongdong-gu':'11200', 'yeongdeungpo-gu':'11560'
};
const types = ['apartment','officetel','villa'];

test('all 15 rent pages exist with unique canonical, district code, type, and substantial copy', () => {
  const titles = new Set();
  for (const [district, code] of Object.entries(districts)) {
    for (const type of types) {
      const file = `rent/${district}/${type}/index.html`;
      assert.equal(fs.existsSync(file), true);
      const html = fs.readFileSync(file,'utf8');
      assert.match(html, new RegExp(`data-lawd-cd="${code}"`));
      assert.match(html, new RegExp(`data-property-type="${type}"`));
      assert.match(html, new RegExp(`https://koreahomeguide.com/rent/${district}/${type}/`));
      const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
      assert.ok(title && !titles.has(title));
      titles.add(title);
      assert.ok(html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length >= 180);
    }
  }
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/rent-market-pages.test.cjs`
Expected: FAIL because the market pages do not exist.

- [ ] **Step 3: Create `rent-market-page.js`**

The script must:

```js
const root = document.querySelector('#rentMarketPage');
const lawdCd = root.dataset.lawdCd;
const propertyType = root.dataset.propertyType;
const response = await fetch(`/api/rent-market?type=${encodeURIComponent(propertyType)}&lawdCd=${encodeURIComponent(lawdCd)}`);
```

Render `totalContracts`, `medianMonthlyRentWon`, `medianDepositWon`, separate jeonse median if present, `quarterChangePct`, all five `sizeBands`, up to 10 `recentContracts`, and an explicit insufficient-data state for null medians or zero monthly contracts. Money display uses `KHGCurrency.formatMoneyHtml(...)` so the existing KRW/USD/CNY selector remains usable.

- [ ] **Step 4: Create the 15 HTML pages with unique human copy**

Use these district positioning themes, with distinct 3–4 paragraph copy per page and property-type-specific advice:

```text
Gangnam-gu: business access, high rent, officetel supply, deposit/rent trade-off.
Mapo-gu: Hongdae/Yeonnam access, student/creative demand, older villa stock, noise/management-fee checks.
Yongsan-gu: central access, Itaewon/Hannam variation, international demand, wide price dispersion.
Seongdong-gu: Seongsu/Wangsimni contrast, east-central access, newer officetels vs residential streets.
Yeongdeungpo-gu: Yeouido business demand, transit, wider value range outside Yeouido, building-age variation.
```

Every page includes links to `/tools/seoul-rent-check/`, `/tools/brokerage-fee-calculator/`, and at least two related market pages.

- [ ] **Step 5: Run page tests**

Run: `node --test tests/rent-market-pages.test.cjs tests/rent-market-core.test.cjs tests/rent-market-api.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit market pages**

```bash
git add rent rent-market-page.js styles.css tests/rent-market-pages.test.cjs
git commit -m "feat: add MOLIT-backed district rent pages"
```

---

### Task 5: Three English guides plus three localized Chinese guides

**Files:**
- Create: `guides/wolse-vs-jeonse/index.html`
- Create: `guides/korea-rental-contract-checklist/index.html`
- Create: `guides/seoul-brokerage-fees/index.html`
- Create: `zh/guides/wolse-vs-jeonse/index.html`
- Create: `zh/guides/korea-rental-contract-checklist/index.html`
- Create: `zh/guides/seoul-brokerage-fees/index.html`
- Modify: `styles.css`
- Test: `tests/guide-pages.test.cjs`

**Interfaces:**
- Static educational pages linking to tool pages and relevant official references already used by the site.

- [ ] **Step 1: Write the failing guide-page test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const slugs = ['wolse-vs-jeonse','korea-rental-contract-checklist','seoul-brokerage-fees'];
test('guide pairs exist, are substantial, and cross-link via hreflang', () => {
  for (const slug of slugs) {
    const en = fs.readFileSync(`guides/${slug}/index.html`,'utf8');
    const zh = fs.readFileSync(`zh/guides/${slug}/index.html`,'utf8');
    assert.match(en, new RegExp(`hreflang="zh-CN"[^>]+/zh/guides/${slug}/`));
    assert.match(zh, new RegExp(`hreflang="en"[^>]+/guides/${slug}/`));
    assert.ok(en.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length >= 450);
    assert.ok(zh.replace(/<[^>]+>/g,'').replace(/\s+/g,'').length >= 900);
  }
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/guide-pages.test.cjs`
Expected: FAIL because guide files do not exist.

- [ ] **Step 3: Write the six complete guide pages**

Each guide must include a concise disclaimer, examples, FAQ section, related-tool CTA, and not use placeholder text. The Chinese versions must use native terms `月租（Wolse）`, `全租（Jeonse）`, `押金`, `管理费`, and `中介费上限` rather than literal English phrasing.

- [ ] **Step 4: Add article styles**

Add `.article-shell`, `.article-body`, `.article-toc`, `.article-callout`, `.faq-list`, and responsive typography without altering homepage component geometry.

- [ ] **Step 5: Run guide tests**

Run: `node --test tests/guide-pages.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit guides**

```bash
git add guides zh/guides styles.css tests/guide-pages.test.cjs
git commit -m "feat: add English and Chinese rental guides"
```

---

### Task 6: Sitewide discovery, sitemap, and homepage internal links

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `sitemap.xml`
- Modify: `robots.txt` only if its existing sitemap URL is missing or incorrect
- Test: `tests/seo-discovery.test.cjs`

**Interfaces:**
- Homepage footer exposes links to Tools, Rent by district, Guides, Language, and Contact.
- Sitemap contains all 27 Phase 1 indexable URLs: 2 homepages + 4 tools + 15 market pages + 6 guides = 27 total URLs.

- [ ] **Step 1: Write the failing discovery test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('homepage and sitemap expose Phase 1 SEO pages', () => {
  const home = fs.readFileSync('index.html','utf8');
  const sitemap = fs.readFileSync('sitemap.xml','utf8');
  assert.match(home, /\/tools\/seoul-rent-check\//);
  assert.match(home, /\/rent\/gangnam-gu\/officetel\//);
  assert.match(home, /\/guides\/wolse-vs-jeonse\//);
  assert.equal((sitemap.match(/<url>/g) || []).length, 27);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/seo-discovery.test.cjs`
Expected: FAIL because the homepage and sitemap do not yet expose the Phase 1 URLs.

- [ ] **Step 3: Add footer discovery blocks to English and Chinese homepages**

English footer includes `Tools`, `Rent by district`, `Guides`, `Language`, and `Contact`. Chinese footer includes `工具`, `租房数据`, `指南`, `语言`, and `联系我们`; it may link to the English market pages with an `English market data` label rather than creating duplicate Chinese pages.

- [ ] **Step 4: Regenerate `sitemap.xml` with all 27 URLs**

Use absolute `https://koreahomeguide.com/...` URLs; set `lastmod` to `2026-08-24` for the initial artifact. Keep only indexable pages and do not add API endpoints.

- [ ] **Step 5: Run discovery and locale tests**

Run: `node --test tests/seo-discovery.test.cjs tests/zh-locale.test.cjs tests/contact.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit discovery changes**

```bash
git add index.html zh/index.html sitemap.xml robots.txt tests/seo-discovery.test.cjs
git commit -m "feat: expose SEO pages through navigation and sitemap"
```

---

### Task 7: Full regression and deployable artifact verification

**Files:**
- Verify all production files
- Create deployable ZIP from repository root

**Interfaces:**
- Produces a deployment artifact preserving all existing v7.3.1 functionality plus the Phase 1 SEO architecture.

- [ ] **Step 1: Run the full Node test suite**

Run: `node --test tests/*.test.cjs`
Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run JavaScript syntax checks**

Run:

```bash
for f in $(find . -type f \( -name '*.js' -o -name '*.cjs' \) -not -path './node_modules/*'); do node --check "$f" || exit 1; done
```

Expected: exit code 0.

- [ ] **Step 3: Verify planned URL/file count**

Run:

```bash
find tools zh/tools rent guides zh/guides -name index.html | sort
```

Expected: 25 new `index.html` files: 4 tools + 15 market pages + 6 guides.

- [ ] **Step 4: Verify sitemap URL count and no API URLs**

Run:

```bash
python - <<'PY'
from pathlib import Path
s=Path('sitemap.xml').read_text()
assert s.count('<url>') == 27
assert '/api/' not in s
print('sitemap: 27 indexable URLs')
PY
```

Expected: `sitemap: 27 indexable URLs`.

- [ ] **Step 5: Build and verify ZIP**

Run:

```bash
zip -qr /mnt/data/koreahomeguide-v8-seo.zip . -x '*.git*'
unzip -t /mnt/data/koreahomeguide-v8-seo.zip
```

Expected: `No errors detected in compressed data`.

- [ ] **Step 6: Commit final verification-only changes if any**

If verification changed no files, make no commit. If a deterministic generated sitemap or metadata file changed during verification, commit only that generated file with:

```bash
git add sitemap.xml
git commit -m "chore: finalize SEO sitemap"
```
