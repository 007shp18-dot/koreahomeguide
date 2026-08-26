# Search CTR and Entry-Page Quality Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve search presentation across all 37 English acquisition pages and deepen ten representative entry pages without adding URLs or changing Rent Check data logic.

**Architecture:** Keep the 37-page acquisition catalogue as the single inventory and add only search-contract fields needed for auditing. Update static HTML metadata across the catalogue, strengthen seven guide pages and three representative market pages with explicit content markers and existing shared UI primitives, then add review-only distribution and measurement documents. Existing acquisition, Rent Check, API, lead, sitemap, and Chinese-locale contracts remain unchanged.

**Tech Stack:** Static HTML/CSS, CommonJS catalogue modules, browser JavaScript, Node.js built-in test runner, Git, ZIP packaging.

**Spec:** `docs/superpowers/specs/2026-08-26-search-ctr-entry-quality-sprint-design.md`

## Global Constraints

- Keep exactly 37 English acquisition entry pages: seven guides and 30 district/property market pages.
- Create zero new indexable URLs and do not add a sitemap entry.
- Keep every canonical URL, hreflang policy, robots rule, and building-page `noindex` rule unchanged.
- Keep title length at no more than 65 characters and meta-description length between 110 and 160 characters; these are repository guardrails, not Google display guarantees.
- Keep every title and description unique across the 37-page catalogue.
- Deepen exactly seven English guides plus `/rent/gangnam-gu/apartment/`, `/rent/mapo-gu/officetel/`, and `/rent/yongsan-gu/villa/`.
- Give every deep page at least three visible FAQ items, one direct answer/orientation, one method/source statement, one limitation statement, and one primary Rent Check path.
- Preserve `utm_*` on external entry URLs and the existing validated `origin_*` handoff inside the site.
- Send no email, help text, exact quote amount, phone number, or other PII to GA4.
- Add exactly one dormant guide ad mount to each English guide; load no AdSense script and reserve no visible space.
- Keep Rent Check, Explorer, calculators, result areas, and market-data interaction surfaces free of active ads and dormant ad mounts.
- Do not change Chinese content, MOLIT providers, API request volume, cache behavior, comparables, thresholds, verdict logic, lead storage, or Vercel routes.
- Keep the deployable API function count at no more than 11.
- Do not post, send, or submit any external-distribution draft.
- Use test-first changes, run the full existing 385-test baseline plus new tests, and commit after every task.

---

## File Structure

### Catalogue and tests

- Modify `seo/acquisition-catalog.cjs`: add the search-contract fields and exact deep-page priority set.
- Modify `tests/acquisition-catalog.test.cjs`: lock the ten deep pages and validate the new fields.
- Create `tests/acquisition-metadata.test.cjs`: enforce title/description quality across all 37 pages.
- Create `tests/acquisition-guide-quality.test.cjs`: enforce guide answer, source, limitation, FAQ, CTA, and dormant-ad contracts.
- Create `tests/acquisition-market-quality.test.cjs`: enforce the three representative market-page contracts.
- Create `tests/acquisition-operations.test.cjs`: validate the four tracked external drafts and measurement checkpoints.

### English guide pages

- Modify `guides/wolse-vs-jeonse/index.html`
- Modify `guides/korea-rental-contract-checklist/index.html`
- Modify `guides/seoul-brokerage-fees/index.html`
- Modify `guides/before-you-sign/index.html`
- Modify `guides/rent-apartment-korea-foreigner/index.html`
- Modify `guides/korea-rental-scams/index.html`
- Modify `guides/seoul-officetel-rent/index.html`

### English market metadata pages

- Modify `rent/gangnam-gu/apartment/index.html`, `rent/gangnam-gu/officetel/index.html`, `rent/gangnam-gu/villa/index.html`
- Modify `rent/mapo-gu/apartment/index.html`, `rent/mapo-gu/officetel/index.html`, `rent/mapo-gu/villa/index.html`
- Modify `rent/yongsan-gu/apartment/index.html`, `rent/yongsan-gu/officetel/index.html`, `rent/yongsan-gu/villa/index.html`
- Modify `rent/seongdong-gu/apartment/index.html`, `rent/seongdong-gu/officetel/index.html`, `rent/seongdong-gu/villa/index.html`
- Modify `rent/yeongdeungpo-gu/apartment/index.html`, `rent/yeongdeungpo-gu/officetel/index.html`, `rent/yeongdeungpo-gu/villa/index.html`
- Modify `rent/gwanak-gu/apartment/index.html`, `rent/gwanak-gu/officetel/index.html`, `rent/gwanak-gu/villa/index.html`
- Modify `rent/dongdaemun-gu/apartment/index.html`, `rent/dongdaemun-gu/officetel/index.html`, `rent/dongdaemun-gu/villa/index.html`
- Modify `rent/seodaemun-gu/apartment/index.html`, `rent/seodaemun-gu/officetel/index.html`, `rent/seodaemun-gu/villa/index.html`
- Modify `rent/seongbuk-gu/apartment/index.html`, `rent/seongbuk-gu/officetel/index.html`, `rent/seongbuk-gu/villa/index.html`
- Modify `rent/gwangjin-gu/apartment/index.html`, `rent/gwangjin-gu/officetel/index.html`, `rent/gwangjin-gu/villa/index.html`

Only the three representative market pages receive body-content changes; the other 27 market files receive metadata changes only.

### Operations documents

- Create `docs/operations/2026-08-26-external-acquisition-kit.md`: four review-only answer drafts, exact UTM URLs, disclosure, and placement log.
- Create `docs/operations/2026-08-26-acquisition-measurement.md`: baseline instructions, metrics, checkpoints, and decision rules.

No production JavaScript, API, provider, route, sitemap, Chinese HTML, or CSS file should change in this sprint. Existing `.ad-slot{display:none!important}` styling is the complete dormant-ad behavior.

---

### Task 1: Lock the search-contract catalogue

**Files:**
- Modify: `seo/acquisition-catalog.cjs`
- Modify: `tests/acquisition-catalog.test.cjs`

**Interfaces:**
- Consumes: `ENTRY_CONTEXTS` and `findEntryContext(pathname)` from `acquisition-context.js`.
- Produces: every `ENTRY_PAGES` record includes `cluster: string`, `primaryQuery: string`, `userQuestion: string`, `pagePromise: string`, and `priorityTier: 'deep' | 'metadata'`; `findEntryPage(pathname)` retains its current behavior.

- [ ] **Step 1: Add the failing catalogue-contract tests**

Append this exact test setup and tests to `tests/acquisition-catalog.test.cjs`:

```js
const DEEP_PATHS = [
  '/guides/wolse-vs-jeonse/',
  '/guides/korea-rental-contract-checklist/',
  '/guides/seoul-brokerage-fees/',
  '/guides/before-you-sign/',
  '/guides/rent-apartment-korea-foreigner/',
  '/guides/korea-rental-scams/',
  '/guides/seoul-officetel-rent/',
  '/rent/gangnam-gu/apartment/',
  '/rent/mapo-gu/officetel/',
  '/rent/yongsan-gu/villa/'
];

test('catalogue exposes one complete search contract per entry page', () => {
  for (const item of ENTRY_PAGES) {
    assert.ok(item.userQuestion && item.userQuestion.length >= 20, item.path);
    assert.ok(item.pagePromise && item.pagePromise.length >= 30, item.path);
    assert.ok(['deep', 'metadata'].includes(item.priorityTier), item.path);
  }
});

test('catalogue locks exactly the ten approved deep-improvement pages', () => {
  const actual = ENTRY_PAGES
    .filter(item => item.priorityTier === 'deep')
    .map(item => item.path)
    .sort();
  assert.deepEqual(actual, [...DEEP_PATHS].sort());
  assert.equal(ENTRY_PAGES.filter(item => item.priorityTier === 'metadata').length, 27);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/acquisition-catalog.test.cjs`

Expected: FAIL because `userQuestion`, `pagePromise`, and `priorityTier` do not exist.

- [ ] **Step 3: Replace guide array metadata with explicit search contracts**

Replace the existing `GUIDE_META` with this object and add the deep path set:

```js
const GUIDE_META = {
  'wolse-vs-jeonse': {
    cluster: 'rent-basics',
    primaryQuery: 'wolse vs jeonse',
    userQuestion: 'How do wolse and jeonse differ in monthly cost, cash need, and deposit risk?',
    pagePromise: 'Compare the two rental structures before choosing how much cash to place in a Korean lease.'
  },
  'korea-rental-contract-checklist': {
    cluster: 'contract-safety',
    primaryQuery: 'korea rental contract checklist',
    userQuestion: 'What should a foreign tenant verify before signing a Korean rental contract?',
    pagePromise: 'Work through the property, owner, money, clause, and move-in checks in a practical order.'
  },
  'seoul-brokerage-fees': {
    cluster: 'move-in-cost',
    primaryQuery: 'seoul rental brokerage fee',
    userQuestion: 'How is the maximum Seoul rental brokerage fee calculated?',
    pagePromise: 'Understand the transaction-value formula, legal ceiling, officetel branches, VAT, and negotiation.'
  },
  'before-you-sign': {
    cluster: 'contract-safety',
    primaryQuery: 'checks before signing a rental contract in korea',
    userQuestion: 'Which checks must happen before a foreign renter transfers a large Korean rental deposit?',
    pagePromise: 'Put registry, owner, payment, residence reporting, fixed-date, and guarantee checks in sequence.'
  },
  'rent-apartment-korea-foreigner': {
    cluster: 'rental-process',
    primaryQuery: 'how to rent an apartment in korea as a foreigner',
    userQuestion: 'How can a foreigner rent an apartment in Korea from budgeting through move-in?',
    pagePromise: 'Follow the search, quote-check, verification, contract, payment, and move-in process step by step.'
  },
  'korea-rental-scams': {
    cluster: 'contract-safety',
    primaryQuery: 'korea rental scams',
    userQuestion: 'Which warning signs should stop a Korean rental deposit or reservation payment?',
    pagePromise: 'Recognize seven breaks in the property, owner, contract, and payment chain before sending money.'
  },
  'seoul-officetel-rent': {
    cluster: 'housing-type',
    primaryQuery: 'seoul officetel rent',
    userQuestion: 'What does a Seoul officetel really cost after deposit, rent, management fees, and trade-offs?',
    pagePromise: 'Compare the full monthly structure, usable area, registered use, and contract checks before choosing.'
  }
};

const DEEP_PATHS = new Set([
  '/guides/wolse-vs-jeonse/',
  '/guides/korea-rental-contract-checklist/',
  '/guides/seoul-brokerage-fees/',
  '/guides/before-you-sign/',
  '/guides/rent-apartment-korea-foreigner/',
  '/guides/korea-rental-scams/',
  '/guides/seoul-officetel-rent/',
  '/rent/gangnam-gu/apartment/',
  '/rent/mapo-gu/officetel/',
  '/rent/yongsan-gu/villa/'
]);
```

- [ ] **Step 4: Emit the new fields without changing lookup behavior**

Replace the `ENTRY_PAGES` mapping with:

```js
const ENTRY_PAGES = Object.freeze(ENTRY_CONTEXTS.map(context => {
  if (context.kind === 'guide') {
    const contract = GUIDE_META[context.slug];
    return Object.freeze({
      ...context,
      file: `${context.path.slice(1)}index.html`,
      ...contract,
      priorityTier: DEEP_PATHS.has(context.path) ? 'deep' : 'metadata'
    });
  }
  const queryType = MARKET_QUERY_TYPES[context.propertyType];
  return Object.freeze({
    ...context,
    file: `${context.path.slice(1)}index.html`,
    cluster: 'district-market',
    primaryQuery: `${context.districtLabel.toLowerCase()} ${queryType} rent prices`,
    userQuestion: `What do recent signed ${queryType} rents show in ${context.districtLabel}?`,
    pagePromise: `Review official MOLIT ${queryType} contracts by deposit, floor area, and recent contract date.`,
    priorityTier: DEEP_PATHS.has(context.path) ? 'deep' : 'metadata'
  });
}));
```

- [ ] **Step 5: Run the catalogue tests**

Run: `node --test tests/acquisition-catalog.test.cjs`

Expected: all catalogue tests PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add seo/acquisition-catalog.cjs tests/acquisition-catalog.test.cjs
git commit -m "test: lock acquisition search contracts"
```

---

### Task 2: Normalize title and description metadata across all 37 pages

**Files:**
- Create: `tests/acquisition-metadata.test.cjs`
- Modify: the seven guide HTML files listed under File Structure
- Modify: the 30 market HTML files listed under File Structure

**Interfaces:**
- Consumes: `ENTRY_PAGES` from `seo/acquisition-catalog.cjs`.
- Produces: static unique `<title>` and `<meta name="description">` values that satisfy the repository guardrails while preserving all current canonical and hreflang tags.

- [ ] **Step 1: Create the failing metadata audit**

Create `tests/acquisition-metadata.test.cjs` with:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

function metadata(item) {
  const html = fs.readFileSync(item.file, 'utf8');
  const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
  const description = (html.match(/<meta name="description" content="([^"]+)"/i) || [])[1] || '';
  return { html, title: title.trim(), description: description.trim() };
}

test('all acquisition metadata is unique and within the sprint guardrails', () => {
  const rows = ENTRY_PAGES.map(item => ({ item, ...metadata(item) }));
  assert.equal(new Set(rows.map(row => row.title)).size, 37);
  assert.equal(new Set(rows.map(row => row.description)).size, 37);
  for (const row of rows) {
    assert.ok(row.title.length > 0 && row.title.length <= 65, `${row.item.path}: title ${row.title.length}`);
    assert.ok(row.description.length >= 110 && row.description.length <= 160, `${row.item.path}: description ${row.description.length}`);
    assert.doesNotMatch(row.title, /live listings|available now|guaranteed|appraisal|legal review/i, row.item.path);
    assert.doesNotMatch(row.description, /live listings|available now|guaranteed|appraisal|legal review/i, row.item.path);
  }
});

test('metadata edits preserve canonical and hreflang contracts', () => {
  for (const item of ENTRY_PAGES) {
    const { html } = metadata(item);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://koreahomeguide\\.com${item.path}"`), item.file);
    assert.match(html, /<link rel="alternate" hreflang="en"/, item.file);
    assert.match(html, /<link rel="alternate" hreflang="x-default"/, item.file);
  }
});
```

- [ ] **Step 2: Run the metadata test to verify it fails**

Run: `node --test tests/acquisition-metadata.test.cjs`

Expected: FAIL on existing titles above 65 characters, descriptions above 160 characters, and/or non-unique market descriptions.

- [ ] **Step 3: Patch the seven guide metadata pairs**

Use these exact target values:

| Guide slug | Title | Description |
|---|---|---|
| `wolse-vs-jeonse` | `Wolse vs Jeonse: Which Korean Rental Fits You?` | `Compare wolse and jeonse in Korea: deposits, monthly rent, cash needs and contract risks, with practical checks for foreign renters.` |
| `korea-rental-contract-checklist` | `Korea Rental Contract Checklist for Foreign Tenants` | `Use a practical Korea rental contract checklist covering the property, landlord, deposit, fees, clauses and move-in protections.` |
| `seoul-brokerage-fees` | `Seoul Rental Brokerage Fees: Maximum Rates Explained` | `Understand Seoul rental brokerage fee ceilings, the deposit-plus-rent formula, officetel rules, VAT and what renters can negotiate.` |
| `before-you-sign` | `Before Signing a Korea Rental Contract: 10 Checks` | `Check the registry, landlord, deposit protections, special clauses and move-in steps before signing a rental contract in Korea.` |
| `rent-apartment-korea-foreigner` | `How Foreigners Can Rent an Apartment in Korea` | `Follow the Korea apartment rental process for foreigners, from budgeting and housing types to contract checks, payment and move-in.` |
| `korea-rental-scams` | `Korea Rental Scams: 7 Deposit Red Flags` | `Recognize seven Korea rental scam and deposit-risk warning signs before paying a reservation fee, signing or transferring money.` |
| `seoul-officetel-rent` | `Seoul Officetel Rent: Deposits, Fees and Trade-offs` | `Compare Seoul officetel deposits, monthly rent, management fees, usable area and contract checks before choosing a unit.` |

Patch only the `<title>` and description tag in this step. Keep every canonical, alternate, script, and body node unchanged.

- [ ] **Step 4: Patch all 30 market metadata pairs from the exact copy contract**

Use this deterministic title contract:

```js
const TYPE_TITLE = {
  apartment: 'Apartment',
  officetel: 'Officetel',
  villa: 'Villa/Low-rise'
};
const title = `${districtLabel} ${TYPE_TITLE[propertyType]} Rent Prices | Official Seoul Data`;
```

Use this exact district-context map:

```js
const DISTRICT_CONTEXT = {
  'Gangnam-gu': 'office and transit market',
  'Mapo-gu': 'western Seoul market',
  'Yongsan-gu': 'central Seoul market',
  'Seongdong-gu': 'eastern-central market',
  'Yeongdeungpo-gu': 'Yeouido-area market',
  'Gwanak-gu': 'student and commuter market',
  'Dongdaemun-gu': 'east-Seoul market',
  'Seodaemun-gu': 'northwest university market',
  'Seongbuk-gu': 'northeast university market',
  'Gwangjin-gu': 'east-Seoul riverside market'
};
```

Use these exact type-specific description contracts, substituting only `districtLabel` and its mapped `context`:

```js
const DESCRIPTION = {
  apartment: (districtLabel, context) =>
    `See official MOLIT apartment rents for ${districtLabel}, grouped by deposit and floor area with recent contract dates for its ${context}.`,
  officetel: (districtLabel, context) =>
    `Compare official MOLIT officetel rents for ${districtLabel}, grouped by deposit and floor area with recent contract dates for its ${context}.`,
  villa: (districtLabel, context) =>
    `Review official MOLIT villa/low-rise rents for ${districtLabel}, grouped by deposit and floor area with recent contract dates for its ${context}.`
};
```

These formulas produce 30 unique titles of 47–64 characters and 30 unique descriptions of 138–159 characters. Apply the rendered values statically with `apply_patch`; do not add this generator to production code.

- [ ] **Step 5: Run metadata and catalogue tests**

Run: `node --test tests/acquisition-metadata.test.cjs tests/acquisition-catalog.test.cjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add tests/acquisition-metadata.test.cjs guides rent
git commit -m "feat: sharpen acquisition search metadata"
```

---

### Task 3: Deepen the seven English guides and prepare dormant content ad mounts

**Files:**
- Create: `tests/acquisition-guide-quality.test.cjs`
- Modify: the seven guide HTML files listed under File Structure
- Verify only: `styles.css`

**Interfaces:**
- Consumes: existing guide content, `/acquisition-context.js`, `/acquisition-links.js`, and the shared `.article-callout`, `.faq-list`, `.related-links`, and `.ad-slot` styles.
- Produces: each guide exposes `data-search-answer="true"`, `.article-method`, `.article-limit`, `.article-primary-cta`, at least three FAQ `<details>`, and exactly one hidden `data-slot="guide"` ad mount.

- [ ] **Step 1: Create the failing guide-quality tests**

Create `tests/acquisition-guide-quality.test.cjs`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const GUIDES = [
  'wolse-vs-jeonse',
  'korea-rental-contract-checklist',
  'seoul-brokerage-fees',
  'before-you-sign',
  'rent-apartment-korea-foreigner',
  'korea-rental-scams',
  'seoul-officetel-rent'
];

test('all deep guides expose the approved answer-to-Rent-Check contract', () => {
  for (const slug of GUIDES) {
    const html = fs.readFileSync(`guides/${slug}/index.html`, 'utf8');
    assert.match(html, /data-search-answer="true"/, slug);
    assert.match(html, /class="[^"]*article-method[^"]*"/, slug);
    assert.match(html, /class="[^"]*article-limit[^"]*"/, slug);
    assert.match(html, /class="[^"]*article-primary-cta[^"]*"[\s\S]*?href="\/tools\/seoul-rent-check\/"/, slug);
    assert.ok((html.match(/<details(?:\s|>)/g) || []).length >= 3, slug);
  }
});

test('each guide has one dormant ad mount after substantive content', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /\.ad-slot\s*\{[^}]*display:\s*none!important/i);
  for (const slug of GUIDES) {
    const html = fs.readFileSync(`guides/${slug}/index.html`, 'utf8');
    const mounts = html.match(/<div class="ad-slot" data-slot="guide" aria-hidden="true"><\/div>/g) || [];
    assert.equal(mounts.length, 1, slug);
    assert.ok(html.indexOf(mounts[0]) > html.indexOf('<h2'), slug);
  }
});

test('product and market surfaces remain free of ad mounts and AdSense scripts', () => {
  const productFiles = [
    'index.html', 'tools/seoul-rent-check/index.html', 'explore/index.html',
    'tools/brokerage-fee-calculator/index.html',
    'rent/gangnam-gu/apartment/index.html', 'rent/mapo-gu/officetel/index.html',
    'rent/yongsan-gu/villa/index.html'
  ];
  for (const file of productFiles) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /data-slot="guide"|adsbygoogle|pagead2\.googlesyndication/i, file);
  }
});

function collectHtml(dir = '.') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return collectHtml(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  });
}

test('no public HTML loads an active AdSense script', () => {
  for (const file of collectHtml()) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /adsbygoogle|pagead2\.googlesyndication/i, file);
  }
});
```

- [ ] **Step 2: Run the guide test to verify it fails**

Run: `node --test tests/acquisition-guide-quality.test.cjs`

Expected: FAIL because six guides have no ad mount, markers are absent, and three guides have fewer than three FAQs.

- [ ] **Step 3: Mark or add the direct answers, method notes, limitations, and primary CTAs**

Use the existing first substantive paragraph as the direct answer where it already states the answer clearly; add `data-search-answer="true"`. Apply these exact content contracts:

| Guide | Direct-answer meaning | Method/source text | Limitation text |
|---|---|---|---|
| Wolse vs Jeonse | Wolse combines deposit and monthly rent; jeonse uses a much larger deposit with little or no rent. | `KoreaHomeGuide keeps zero-rent jeonse contracts separate from monthly-rent medians so the two structures are not blended into one misleading number.` | `Neither structure is automatically safe or suitable; owner, registry, debt, contract and deposit-protection checks still depend on the exact lease.` |
| Contract checklist | Verify the exact unit, owner, money, clauses and move-in protections before transferring a large deposit. | `This checklist organizes practical verification steps and links price checks to official signed MOLIT rental transactions.` | `It is general information, not identity verification, legal due diligence or a conclusion about claim priority.` |
| Brokerage fees | The ceiling follows a transaction-value formula, not a rule of one month of rent. | `The explanation follows the same housing and officetel branches used by the existing KoreaHomeGuide brokerage calculator.` | `The calculated amount is a ceiling, not a required charge; the signed brokerage agreement and current official rule control.` |
| Before you sign | Check the registry, owner, receiving account, contract and protection timeline before balance payment. | Keep the existing official-source section and add `id="official-sources"` to its heading; mark that section `.article-method`. | Keep the existing general-information callout and mark it `.article-limit`. |
| How foreigners rent | The sequence is budget, housing type, quote check, property/owner verification, contract, payment, and move-in procedures. | `Price comparisons use recent official signed MOLIT transactions; legal and administrative steps should be checked against the official sources linked in the before-you-sign guide.` | `KoreaHomeGuide is not a listings service, broker, landlord verifier or legal adviser.` |
| Rental scams | The core warning is a broken chain among the property, registered owner, contract, receiving account and protection steps. | `The seven red flags are a decision framework for when to stop and verify, supported by the detailed official-source checklist linked below.` | `A red flag is not proof of fraud, and the absence of one does not prove that a deposit is safe.` |
| Officetel rent | Compare deposit, monthly rent, management fees, usable area and registered use together. | `The strongest price comparison uses official signed officetel contracts in the same district, similar floor area, similar deposit and recent completed months.` | `Official transactions do not include every management fee, furnishing, condition, noise, view or exact registered-use difference.` |

For every guide, add or adapt one visible method/source block using `class="article-callout article-method"`, one limitation block using `class="article-callout article-limit"`, and this primary CTA pattern after the direct answer:

```html
<section class="article-callout article-primary-cta">
  <strong>Have a rent quote already?</strong>
  <p>Compare its deposit, monthly rent, size and housing type with recent official signed contracts.</p>
  <a href="/tools/seoul-rent-check/">Check this rent →</a>
</section>
```

The exact link stays generic on guide pages; `acquisition-links.js` adds the validated source page and external campaign context.

- [ ] **Step 4: Add missing guide FAQs with exact answers**

Keep existing FAQ sections. Add this three-item `.faq-list` to `rent-apartment-korea-foreigner`:

```html
<h2>FAQ</h2><div class="faq-list"><details><summary>Can a foreigner sign a residential lease in Korea?</summary><p>Yes, but landlord, document and payment requirements vary. Verify the exact unit, party receiving money and contract terms before transferring a deposit.</p></details><details><summary>Do I need a Residence Card before I rent?</summary><p>Some agents or landlords may request one, while registration and move-in timing can differ. Confirm the current administrative steps for your status before contract day.</p></details><details><summary>Does KoreaHomeGuide find apartments or contact landlords?</summary><p>No. KoreaHomeGuide does not list homes or broker leases. It helps you compare a real quote with official signed transactions and prepare better questions.</p></details></div>
```

Add this three-item `.faq-list` to `korea-rental-scams`:

```html
<h2>FAQ</h2><div class="faq-list"><details><summary>Is an unusually low rent proof of a scam?</summary><p>No. It is a reason to compare the deposit, management fee, contract and property details more carefully, not proof by itself.</p></details><details><summary>Can a broker's assurance replace a registry check?</summary><p>No. Verify the current property and owner information independently when the deposit is meaningful to you.</p></details><details><summary>What should I do if the owner, contract and bank-account names do not align?</summary><p>Stop the transfer and verify the complete authority and payment chain before sending more money.</p></details></div>
```

Add this three-item `.faq-list` to `seoul-officetel-rent`:

```html
<h2>FAQ</h2><div class="faq-list"><details><summary>Is every officetel registered and used the same way?</summary><p>No. Confirm the exact unit's registered use, facilities and contract terms rather than relying only on the listing label.</p></details><details><summary>Are utilities included in an officetel management fee?</summary><p>Not necessarily. Ask for the itemized fee and recent bills because electricity, heating, cooling, water, parking and internet treatment varies.</p></details><details><summary>Should I compare an officetel quote with apartment rents?</summary><p>Use officetel contracts in the same district and a similar size and deposit range first. Apartments and low-rise homes are different rental markets.</p></details></div>
```

- [ ] **Step 5: Add exactly one dormant ad mount to each guide**

Keep the existing `Before You Sign` mount unchanged. Add this exact node once to each of the other six guides after at least one substantive `<h2>` section and before the FAQ or final related-links section:

```html
<div class="ad-slot" data-slot="guide" aria-hidden="true"></div>
```

Do not add `hidden`, inline dimensions, scripts, IDs, or additional ad classes. The existing global `.ad-slot{display:none!important}` rule prevents layout space and loading behavior.

- [ ] **Step 6: Run guide, navigation, privacy, and metadata tests**

Run: `node --test tests/acquisition-guide-quality.test.cjs tests/acquisition-navigation.test.cjs tests/privacy-pages.test.cjs tests/acquisition-metadata.test.cjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add tests/acquisition-guide-quality.test.cjs guides
git commit -m "feat: deepen foreign renter search guides"
```

---

### Task 4: Deepen the three representative market pages

**Files:**
- Create: `tests/acquisition-market-quality.test.cjs`
- Modify: `rent/gangnam-gu/apartment/index.html`
- Modify: `rent/mapo-gu/officetel/index.html`
- Modify: `rent/yongsan-gu/villa/index.html`

**Interfaces:**
- Consumes: existing `#rentMarketPage` `data-lawd-cd` and `data-property-type` values, the shared market runtime, and acquisition-link rewriting.
- Produces: each representative page exposes a direct answer, source/method block, limitation block, mid-page contextual Rent Check CTA, and at least three FAQs without an ad mount.

- [ ] **Step 1: Create the failing representative-market tests**

Create `tests/acquisition-market-quality.test.cjs`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const PAGES = [
  ['rent/gangnam-gu/apartment/index.html', '11680', 'apartment'],
  ['rent/mapo-gu/officetel/index.html', '11440', 'officetel'],
  ['rent/yongsan-gu/villa/index.html', '11170', 'villa']
];

test('representative market pages expose answer, evidence, limitation, CTA and FAQ', () => {
  for (const [file, lawdCd, type] of PAGES) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`data-lawd-cd="${lawdCd}"[^>]*data-property-type="${type}"`), file);
    assert.match(html, /data-search-answer="true"/, file);
    assert.match(html, /class="[^"]*market-method[^"]*"/, file);
    assert.match(html, /class="[^"]*market-limit[^"]*"/, file);
    assert.match(html, /class="[^"]*market-rent-check-cta[^"]*"[\s\S]*?href="\/tools\/seoul-rent-check\/"/, file);
    assert.ok((html.match(/<details(?:\s|>)/g) || []).length >= 3, file);
    assert.ok((html.match(/href="\/tools\/seoul-rent-check\/"/g) || []).length >= 2, file);
    assert.doesNotMatch(html, /data-slot="guide"|adsbygoogle|pagead2\.googlesyndication/i, file);
  }
});

test('representative market pages keep the existing dynamic renderer', () => {
  for (const [file] of PAGES) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /id="marketStatus"/, file);
    assert.match(html, /id="depositBandGrid"/, file);
    assert.match(html, /id="sizeBandGrid"/, file);
    assert.match(html, /id="recentContractsBody"/, file);
    assert.match(html, /<script src="\/rent-market-page\.js"><\/script>/, file);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/acquisition-market-quality.test.cjs`

Expected: FAIL because the answer marker, method/limitation classes, mid-page CTA, and FAQ sections do not exist.

- [ ] **Step 3: Mark the three hero answers and insert the shared evidence block**

Add `data-search-answer="true"` to the existing market-hero explanatory paragraph. Its meaning must remain page-specific:

- Gangnam apartment: recent signed apartment rents by deposit and floor area before assessing a Gangnam quote;
- Mapo officetel: recent signed officetel rents by deposit and floor area before assessing the full officetel cost; and
- Yongsan villa: recent signed villa/low-rise rents by deposit and floor area before assessing a Yongsan quote.

Immediately after `.market-summary-card`, insert the shared source and limitation blocks:

```html
<section class="market-section market-method">
  <div class="section-heading"><span class="eyebrow">SOURCE AND METHOD</span><h2>What this official data shows</h2><p>This page uses reported MOLIT rental transactions from the latest six completed months. Monthly rent is grouped with its deposit and floor area, while zero-rent jeonse contracts remain separate.</p></div>
</section>
<section class="article-callout market-limit"><strong>What it cannot show</strong><p>Official transactions do not capture every difference in floor, condition, furnishings, management fees, view, exact location or contract negotiation. Use the data as a market reference, not an appraisal.</p></section>
```

Then insert the exact page-specific CTA.

Gangnam apartment:

```html
<section class="article-callout market-rent-check-cta"><strong>Have a quote for this market?</strong><p>Compare its deposit, monthly rent and size with recent signed apartment contracts in Gangnam-gu.</p><a href="/tools/seoul-rent-check/">Check this rent →</a></section>
```

Mapo officetel:

```html
<section class="article-callout market-rent-check-cta"><strong>Have a quote for this market?</strong><p>Compare its deposit, monthly rent and size with recent signed officetel contracts in Mapo-gu.</p><a href="/tools/seoul-rent-check/">Check this rent →</a></section>
```

Yongsan villa/low-rise:

```html
<section class="article-callout market-rent-check-cta"><strong>Have a quote for this market?</strong><p>Compare its deposit, monthly rent and size with recent signed villa and low-rise contracts in Yongsan-gu.</p><a href="/tools/seoul-rent-check/">Check this rent →</a></section>
```

Keep each link generic; `acquisition-links.js` supplies the exact district, property type, source page, and campaign values.

- [ ] **Step 4: Add three visible FAQs to each representative page**

Insert the FAQ after the market-context article and before final related links. Use these exact common questions on all three pages:

```html
<details><summary>How current is the data on this page?</summary><p>The page uses the latest six completed contract months available through the official feed and displays the data-through month after loading.</p></details>
<details><summary>Does one median combine every deposit and home size?</summary><p>No. Monthly rent is shown with deposit bands and floor-area groups so unlike contract structures are not collapsed into one synthetic quote.</p></details>
```

Use this exact third item on Gangnam apartment:

```html
<details><summary>Why can two Gangnam apartments with similar sizes have different rents?</summary><p>Floor, building age, renovation, view, station distance, parking, furnishings and exact deposit terms can create meaningful differences.</p></details>
```

Use this exact third item on Mapo officetel:

```html
<details><summary>Does the official rent include officetel management fees?</summary><p>No. Ask for an itemized management fee and recent bills because utilities, parking and shared-service charges vary by building and unit.</p></details>
```

Use this exact third item on Yongsan villa:

```html
<details><summary>Why can nearby Yongsan villa or low-rise homes differ sharply?</summary><p>Building condition, exact street, floor, elevator, parking, sunlight, renovation and management arrangements may differ even at a similar size.</p></details>
```

Wrap the three exact items for each page with these opening and closing nodes:

```html
<section class="market-section market-faq"><div class="section-heading"><span class="eyebrow">FAQ</span><h2>Questions about this rental market</h2></div><div class="faq-list">
```

Place the two common `<details>` nodes and the page-specific third `<details>` node written immediately above inside that `.faq-list`, then close it with:

```html
</div></section>
```

- [ ] **Step 5: Run representative market and attribution tests**

Run: `node --test tests/acquisition-market-quality.test.cjs tests/acquisition-links.test.cjs tests/rent-market-pages.test.cjs tests/rent-market-api.test.cjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add tests/acquisition-market-quality.test.cjs rent/gangnam-gu/apartment/index.html rent/mapo-gu/officetel/index.html rent/yongsan-gu/villa/index.html
git commit -m "feat: strengthen representative rent market pages"
```

---

### Task 5: Add the review-only external acquisition kit and measurement handoff

**Files:**
- Create: `docs/operations/2026-08-26-external-acquisition-kit.md`
- Create: `docs/operations/2026-08-26-acquisition-measurement.md`
- Create: `tests/acquisition-operations.test.cjs`

**Interfaces:**
- Consumes: the canonical English entry-page paths in `ENTRY_PAGES` and the existing `utm_*` to `origin_*` handoff.
- Produces: four review-only tracked placement drafts and a baseline/checkpoint procedure; no network post or runtime dependency.

- [ ] **Step 1: Create the failing operations-document test**

Create `tests/acquisition-operations.test.cjs`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

test('external kit contains four approved tracked entry URLs and no auto-post instruction', () => {
  const markdown = fs.readFileSync('docs/operations/2026-08-26-external-acquisition-kit.md', 'utf8');
  const urls = [...markdown.matchAll(/https:\/\/koreahomeguide\.com(\/[^\s?)]+\/)\?utm_source=([^&\s]+)&utm_medium=([^&\s]+)&utm_campaign=([^\s)]+)/g)];
  assert.equal(urls.length, 4);
  const allowed = new Set(ENTRY_PAGES.map(item => item.path));
  for (const match of urls) {
    assert.equal(allowed.has(match[1]), true, match[1]);
    assert.ok(match[2] && match[3] && match[4]);
  }
  assert.match(markdown, /Do not post, send, or submit automatically\./);
  assert.doesNotMatch(markdown, /[?&]origin_(?:source|medium|campaign)=/);
});

test('measurement handoff contains exact checkpoints and funnel metrics', () => {
  const markdown = fs.readFileSync('docs/operations/2026-08-26-acquisition-measurement.md', 'utf8');
  for (const date of ['2026-09-09', '2026-09-23', '2026-10-21', '2026-11-18']) {
    assert.match(markdown, new RegExp(date));
  }
  for (const metric of ['impressions', 'clicks', 'CTR', 'average position', 'Rent Check starts', 'Rent Check results', 'follow-up actions']) {
    assert.match(markdown, new RegExp(metric, 'i'));
  }
  assert.match(markdown, /Do not invent or backfill unavailable values\./);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/acquisition-operations.test.cjs`

Expected: FAIL with `ENOENT` because the two operations documents do not exist.

- [ ] **Step 3: Write the external acquisition kit with four exact tracked links**

Create `docs/operations/2026-08-26-external-acquisition-kit.md`. Start with this boundary:

```markdown
# External Acquisition Kit

Status: Drafts for owner review only. Do not post, send, or submit automatically.

KoreaHomeGuide is not a listings service or broker. It uses recent official signed rental transactions to help a renter assess a quote and prepare better contract questions.
```

Include exactly these four destination URLs:

```text
https://koreahomeguide.com/guides/wolse-vs-jeonse/?utm_source=reddit&utm_medium=community&utm_campaign=wolse_jeonse
https://koreahomeguide.com/guides/rent-apartment-korea-foreigner/?utm_source=university_outreach&utm_medium=referral&utm_campaign=foreign_renter_process
https://koreahomeguide.com/guides/before-you-sign/?utm_source=expat_community&utm_medium=community&utm_campaign=deposit_safety
https://koreahomeguide.com/guides/seoul-officetel-rent/?utm_source=relocation_outreach&utm_medium=outreach&utm_campaign=officetel_costs
```

Write four sections titled `### Draft 1` through `### Draft 4`. Use these exact answer-first messages before each relevant link:

1. `Wolse and jeonse are not simply “rent” versus “free housing.” Wolse trades a smaller deposit for monthly rent; jeonse removes most monthly rent but puts far more deposit capital at risk. Compare cash need and protection steps before choosing.`
2. `For a foreign renter, the Korea apartment process is easier when handled in order: total budget, housing type, quote comparison, property and owner checks, written contract terms, then move-in registration steps.`
3. `Before paying a large Korean rental deposit, make the property, registered owner, contract, receiving account and protection timeline form one consistent chain. Urgency is not a substitute for verification.`
4. `An officetel's headline rent is only part of the cost. Compare the deposit, monthly rent, itemized management fee, usable area, registered use and contract terms together.`

End with a placement log table with these columns: `Date`, `Channel`, `Thread or recipient`, `Draft`, `Final URL`, `Response`, `Qualified visits`, `Rent Check starts`, `Rent Check results`, `Follow-up actions`, and `Notes`.

- [ ] **Step 4: Write the measurement handoff**

Create `docs/operations/2026-08-26-acquisition-measurement.md` with:

- baseline capture instructions for Search Console page/query exports and GA4 acquisition/funnel events;
- the exact statement `Do not invent or backfill unavailable values.`;
- the assumed-deployment checkpoints `2026-09-09`, `2026-09-23`, `2026-10-21`, and `2026-11-18`;
- an instruction to shift all four dates by the same number of days if actual deployment is later than 2026-08-26;
- Search Console fields: page, query, impressions, clicks, CTR, and average position;
- GA4 fields: qualified entry sessions, Rent Check starts, Rent Check results, lead form views, lead submits, help requests, and aggregate follow-up actions;
- dimensions: source page, query cluster, locale, district, property type, campaign, referrer host, and sufficient/insufficient result;
- PII exclusion: no email, free-text help content, phone, exact quote amount, raw IP, or complete comparable list;
- the five roadmap diagnosis rules for no impressions, impressions/no clicks, clicks/no starts, starts/no results, and results/no follow-up action.

- [ ] **Step 5: Run the operations tests**

Run: `node --test tests/acquisition-operations.test.cjs`

Expected: both tests PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add tests/acquisition-operations.test.cjs docs/operations/2026-08-26-external-acquisition-kit.md docs/operations/2026-08-26-acquisition-measurement.md
git commit -m "docs: add controlled acquisition operations kit"
```

---

### Task 6: Run regression, visual, integration, and release-package verification

**Files:**
- Verify: all changed files from Tasks 1–5
- Create outside the repository: incremental ZIP, full repository ZIP, and SHA-256 checksums

**Interfaces:**
- Consumes: the reviewed Task 1–5 commits and the current `origin/main` upload baseline.
- Produces: a reviewed branch suitable for local-main integration plus two integrity-checked upload artifacts.

- [ ] **Step 1: Run the focused acquisition suite**

Run:

```bash
node --test tests/acquisition-catalog.test.cjs tests/acquisition-context.test.cjs tests/acquisition-links.test.cjs tests/acquisition-navigation.test.cjs tests/acquisition-metadata.test.cjs tests/acquisition-guide-quality.test.cjs tests/acquisition-market-quality.test.cjs tests/acquisition-operations.test.cjs tests/rent-check-prefill.test.cjs tests/lead-capture-source.test.cjs tests/lead-core.test.cjs
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run the complete repository suite**

Run: `node --test tests/*.test.cjs`

Expected: exactly 397 tests PASS (the existing 385 plus 12 new tests), with zero failures, cancellations, skips, or todos.

- [ ] **Step 3: Run syntax, whitespace, sitemap, and function-budget checks**

Run each command separately:

```bash
node --check seo/acquisition-catalog.cjs
node --check tests/acquisition-metadata.test.cjs
node --check tests/acquisition-guide-quality.test.cjs
node --check tests/acquisition-market-quality.test.cjs
node --check tests/acquisition-operations.test.cjs
node --test tests/seo-discovery.test.cjs tests/v10-6-dynamic-sitemap.test.cjs tests/v11-2-building-seo-quarantine.test.cjs tests/vercel-function-budget.test.cjs
git diff --check origin/main..HEAD
```

Expected: every command exits 0 and the API-function test reports no more than 11 functions.

- [ ] **Step 4: Perform local browser layout checks**

Start a local static server from the worktree in a long-running PTY session and keep its session identifier for shutdown:

```bash
python3 -m http.server 4173
```

Using the browser-verification workflow, inspect at 390px and desktop width:

- `/guides/before-you-sign/`
- `/guides/seoul-officetel-rent/`
- `/rent/gangnam-gu/apartment/`
- `/rent/mapo-gu/officetel/`
- `/rent/yongsan-gu/villa/`
- `/tools/seoul-rent-check/`

Verify no horizontal overflow, no visible empty ad area, readable FAQ controls, one visually primary Rent Check CTA, unchanged white-first layout, and no site-controlled console error from the static content. Send `Ctrl-C` to the same PTY session after inspection and confirm the server exits.

- [ ] **Step 5: Request code review and resolve only verified findings**

Review the branch against `docs/superpowers/specs/2026-08-26-search-ctr-entry-quality-sprint-design.md`. Treat Critical and Important findings as blockers. Re-run the focused suite and the complete suite after any correction. Do not add unrelated refactors or loosen tests to obtain green output.

- [ ] **Step 6: Integrate the reviewed branch into local `main`**

Use the finishing-development-branch workflow. Confirm the feature worktree is clean, merge without force, then run from local `main`:

```bash
node --test tests/*.test.cjs
git diff --check origin/main..HEAD
git status --short --branch
```

Expected: all tests PASS, no whitespace errors, and the worktree is clean.

- [ ] **Step 7: Verify the web-upload delta before packaging**

Run each command separately:

```bash
git diff --name-only --diff-filter=ACMRT origin/main..HEAD
git diff --name-only --diff-filter=ACMRT origin/main..HEAD | wc -l
git diff --name-only --diff-filter=D origin/main..HEAD
```

Expected: fewer than 100 added/changed files and no deleted files. If a deletion appears, stop and document the exact web-upload deletion step before packaging.

- [ ] **Step 8: Create the incremental and full ZIPs**

From local `main`, set the release identifier and produce both artifacts outside the repository:

```bash
release_sha=$(git rev-parse --short HEAD)
git diff --name-only --diff-filter=ACMRT origin/main..HEAD | zip -@ "../koreahomeguide-github-upload-2026-08-26-${release_sha}.zip"
git archive --format=zip --output="../koreahomeguide-full-2026-08-26-${release_sha}.zip" HEAD
sha256sum "../koreahomeguide-github-upload-2026-08-26-${release_sha}.zip" "../koreahomeguide-full-2026-08-26-${release_sha}.zip"
unzip -t "../koreahomeguide-github-upload-2026-08-26-${release_sha}.zip"
unzip -t "../koreahomeguide-full-2026-08-26-${release_sha}.zip"
```

Expected: both integrity tests finish with `No errors detected`; record file counts, deletion count, sizes, and SHA-256 values in the handoff.

- [ ] **Step 9: Verify production after the user uploads the incremental package**

Fetch `origin/main` and confirm the remote file tree matches the reviewed local release except for explicitly documented upload exclusions. On `https://koreahomeguide.com`, verify:

- one improved guide and all three representative market pages serve the new metadata/body content;
- market-page Rent Check links prefill the exact district and property type and retain the original source page;
- one Gangnam apartment calculation returns official contracts, verdict, median, P25–P75 range, and percentile; and
- no visible guide ad space and no ad mount or AdSense script on Rent Check or Explorer.

Do not claim deployment success until these live checks pass.
