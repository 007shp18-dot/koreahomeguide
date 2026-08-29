# SEO Entry Paths and Inline Explorer Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every indexable neighborhood discoverable from crawlable site entry points, publish only evidence-qualified building pages, align the homepage form, and replace Explorer's modal building sheet with a stable inline Street View detail section.

**Architecture:** Preserve the static HTML/CommonJS/Vercel Functions stack. Add shared server-rendered market-directory helpers, use the existing deterministic Dong/building route utilities and evidence gates, and keep Explorer detail in normal document flow with a bounded panorama frame. English and Chinese remain structurally identical.

**Tech Stack:** Static HTML/CSS/JavaScript, CommonJS Node.js, Vercel Functions/rewrites, NAVER Maps Panorama, `node:test`.

**Spec:** `upload/01-koreahomeguide-spec-v2.md` plus the approved 2026-08-29 inline-detail design in the conversation.

## Global Constraints

- Building pages are indexable only when `contractCount >= 5 AND monthlyRentCount >= 3`.
- `noindex` is removed only after SSR body, path URL, self-canonical and sitemap inclusion are all verified.
- A price or median with fewer than five observations is never rendered.
- Street View stays before all building evidence and uses a fixed 16:9 frame.
- Explorer keeps `district -> neighborhood -> buildings -> building detail` as one explicit state transition per click.
- All user-facing behavior is implemented in both English and Simplified Chinese.
- Use existing design tokens and shared radius values; add no new literal UI colors.
- No body scroll lock or nested scrolling container is allowed for building detail.

---

### Task 1: Align the homepage Rent Check form and controls

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `cold-start.css`
- Test: `tests/rent-check-feedback-response.test.cjs`
- Test: `tests/ui-refresh-v10-13.test.cjs`

**Interfaces:**
- Consumes: existing Rent Check DOM IDs and `property-type-guide.js` hooks.
- Produces: `.rent-check-assist-row`, equal-height primary fields, and a property hint placed beside size shortcuts rather than after the form.

- [ ] **Step 1: Write failing structural tests**

```js
test('homepage form uses two equal field rows plus one compact assist row', () => {
  for (const file of ['index.html','zh/index.html']) {
    const html = read(file);
    assert.match(html, /class="rent-check-assist-row"/);
    assert.match(html, /rent-check-assist-row[\s\S]*data-property-type-guide[\s\S]*rent-size-controls/);
    assert.doesNotMatch(html, /<\/form><p class="property-type-hint"/);
  }
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/rent-check-feedback-response.test.cjs tests/ui-refresh-v10-13.test.cjs`

- [ ] **Step 3: Move the hint and size controls into one assist row**

Keep Area, Housing type and Size input in the first row; Deposit, Monthly rent and Check in the second primary row. Put the conditional type hint and all rough-size/pyeong controls in a full-width `.rent-check-assist-row` between them without changing input IDs.

- [ ] **Step 4: Apply one shared control geometry**

Set primary `select`, text/number inputs and submit actions to `min-height:52px`, `border-radius:var(--radius-md)`, shared padding, shared chevron spacing and the existing focus ring. Keep the assist row compact and wrapping below 760px.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tests/rent-check-feedback-response.test.cjs tests/ui-refresh-v10-13.test.cjs tests/district-combobox.test.cjs`

Commit: `fix: align home rent check controls`

---

### Task 2: Add crawlable neighborhood entry paths and Dong currency controls

**Files:**
- Create: `seo/market-directory.cjs`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `rent-market-page.js`
- Modify: `zh/rent-market-page.js`
- Modify: `seo/seo-page-renderer.cjs`
- Create: `seo/seo-currency.js`
- Modify: `styles.css`
- Test: `tests/seo-entry-links.test.cjs`
- Test: `tests/currency-ui.test.cjs`
- Test: `tests/rent-market-pages.test.cjs`

**Interfaces:**
- Produces: `renderStaticNeighborhoodDirectory({ lang, groups }) -> string` and currency-aware SEO money nodes with `data-won`.
- Consumes: `location-catalog.js`, `buildDongSeoUrl`, existing district/property configuration, and `/api/rent-market` Dong summaries.

- [ ] **Step 1: Write failing entry-link and currency tests**

```js
test('home, district hubs and Explorer expose raw crawlable paths into indexed markets', () => {
  assert.match(read('index.html'), /href="\/rent\/gangnam-gu\/officetel\/"/);
  assert.match(read('explore/index.html'), /class="explorer-static-directory"/);
  assert.match(read('rent-market-page.js'), /buildDongSeoUrl/);
});

test('dynamic Dong header has a working currency selector', () => {
  const html = renderDongPage(fixture());
  assert.match(html, /id="currencySelect"/);
  assert.match(html, /src="\/seo\/seo-currency\.js"/);
  assert.match(html, /data-won="900000"/);
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `node --test tests/seo-entry-links.test.cjs tests/currency-ui.test.cjs tests/rent-market-pages.test.cjs`

- [ ] **Step 3: Implement static entry directories**

Add a compact home market-hub block. Add a server-visible, grouped neighborhood directory to both Explorer HTML files. Ensure district hub runtime outputs every eligible Dong returned by `/api/rent-market` as a normal `<a>` with contract count and contextual rent.

- [ ] **Step 4: Implement dynamic-page currency switching**

Render KRW as the primary value with `data-won`, add KRW/USD/CNY to the generated header, load `currency-utils.js` and `seo/seo-currency.js`, fetch `/api/fx`, and rerender only money nodes. Failure falls back to KRW without hiding official values.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tests/seo-entry-links.test.cjs tests/currency-ui.test.cjs tests/rent-market-pages.test.cjs tests/seo-page-renderer.test.cjs`

Commit: `feat: connect crawlable neighborhood entry paths`

---

### Task 3: Publish evidence-qualified server-rendered building pages

**Files:**
- Modify: `seo/seo-page-renderer.cjs`
- Modify: `api/seo-building-page.js`
- Modify: `api/seo-dong-page.js`
- Modify: `api/sitemap-market.js`
- Modify: `vercel.json`
- Modify: `seo/seo-route-utils.cjs`
- Modify: `tests/building-seo-retirement.test.cjs`
- Modify: `tests/v11-2-building-seo-quarantine.test.cjs`
- Modify: `tests/seo-endpoints.test.cjs`
- Modify: `tests/seo-page-renderer.test.cjs`
- Modify: `tests/v10-6-dynamic-sitemap.test.cjs`

**Interfaces:**
- Produces: `isBuildingIndexable(detail)` with the hard evidence gate; building SSR endpoint; building sitemap mode.
- Consumes: deterministic `buildingSlug`, `resolveBuildingSlug`, provider `getBuildings` and `getBuildingDetail`.

- [ ] **Step 1: Replace retirement expectations with failing publication-gate tests**

```js
test('building index gate requires five contracts and three monthly-rent contracts', () => {
  assert.equal(isBuildingIndexable({ contractCount:5, monthlyRentCount:3 }), true);
  assert.equal(isBuildingIndexable({ contractCount:4, monthlyRentCount:3 }), false);
  assert.equal(isBuildingIndexable({ contractCount:5, monthlyRentCount:2 }), false);
});
```

Endpoint tests must assert: eligible exact slug returns 200, raw HTML contains the building name and amounts, canonical is self-referential, `X-Robots-Tag` is `index,follow`; sparse and unknown slugs return 404 `noindex,nofollow`.

- [ ] **Step 2: Run building tests and confirm RED**

Run: `node --test tests/building-seo-retirement.test.cjs tests/v11-2-building-seo-quarantine.test.cjs tests/seo-endpoints.test.cjs tests/seo-page-renderer.test.cjs tests/v10-6-dynamic-sitemap.test.cjs`

- [ ] **Step 3: Implement the endpoint in the required order**

Load the Dong building list, resolve only the exact deterministic slug, reject sparse buildings before detail rendering, load detail and FX, render SSR HTML, and set self-canonical/index headers. Do not loosen Chinese indexing beyond `supportsZhIndexing(areaCode)`.

- [ ] **Step 4: Stop link leakage from Dong pages**

Only evidence-qualified buildings render as canonical path anchors. Render the first eight in the open list and remaining eligible buildings inside one semantic `<details>` block. Sparse buildings may render as non-link evidence rows only when their public values already obey the n<5 hiding rule. Remove the `nofollowBuildingLinks` postprocessor.

- [ ] **Step 5: Add building sitemap output**

Add `/sitemaps/seoul/:district/:type/buildings/` before the general market sitemap rewrite. Emit only eligible exact canonical building URLs and matching Chinese URLs for supported districts.

- [ ] **Step 6: Run focused tests and commit**

Run: `node --test tests/building-seo-retirement.test.cjs tests/v11-2-building-seo-quarantine.test.cjs tests/seo-endpoints.test.cjs tests/seo-page-renderer.test.cjs tests/v10-6-dynamic-sitemap.test.cjs tests/seo-dong-data.test.cjs`

Commit: `feat: publish qualified building market pages`

---

### Task 4: Replace Explorer's building modal with inline document-flow detail

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `explore/building-window.js`
- Modify: `explore/panorama.js`
- Modify: `styles.css`
- Modify: `tests/explorer-spatial-workspace.test.cjs`
- Modify: `tests/explorer-map-source.test.cjs`
- Modify: `tests/panorama.test.cjs`

**Interfaces:**
- Produces: `#explorerBuildingDetailMount`, an inline complementary region, and a 10-at-a-time building-list reveal state.
- Consumes: existing `khg:building-window-*` event contract and panorama location/resize events.

- [ ] **Step 1: Write failing inline-layout and pagination tests**

```js
test('Explorer reserves inline building detail after the workspace', () => {
  for (const file of ['explore/index.html','zh/explore/index.html']) {
    const html = read(file);
    assert.match(html, /id="explorerBuildingDetailMount"/);
  }
  assert.doesNotMatch(read('styles.css'), /body\.has-building-status-window\{overflow:hidden/);
});

test('building lists reveal ten rows at a time', () => {
  const source = read('explore/app.js');
  assert.match(source, /buildingVisibleCount/);
  assert.match(source, /Show 10 more buildings/);
  assert.doesNotMatch(source, /slice\(0,\s*60\)/);
});
```

- [ ] **Step 2: Run Explorer tests and confirm RED**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/explorer-map-source.test.cjs tests/panorama.test.cjs`

- [ ] **Step 3: Mount detail in normal flow**

Create one hidden full-width region immediately after `#explorerResultsShell`. Move the existing building status DOM into that mount, remove backdrop/dialog/body-lock behavior, preserve close/Escape/focus return, and scroll to the detail once after selection with reduced-motion support.

- [ ] **Step 4: Bound loading and Street View geometry**

Reserve the final header, 16:9 media and data regions before the request resolves. Keep frame height within `clamp(260px, 48vw, 560px)`. Synchronize panorama size from the canvas content box without feeding border width back into the observer, and calculate heading from panorama capture coordinates toward the verified building coordinate.

- [ ] **Step 5: Paginate building rows**

Reset `buildingVisibleCount` to 10 when Dong/sort changes, retain map markers independently, append ten per click, and place detail before the long list so selection never requires traversing every row.

- [ ] **Step 6: Run focused tests and commit**

Run: `node --test tests/explorer-spatial-workspace.test.cjs tests/explorer-map-source.test.cjs tests/panorama.test.cjs tests/explorer-map.test.cjs tests/explorer-spatial-workspace.test.cjs`

Commit: `fix: move Explorer building detail inline`

---

### Task 5: Full verification and production release

**Files:**
- Modify: asset query versions in touched EN/ZH HTML files.
- Test: all `tests/*.test.cjs`.

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: one reviewed, deployable commit and verified production behavior.

- [ ] **Step 1: Run the full automated suite**

Run: `node --test tests/*.test.cjs`

Expected: zero failed tests.

- [ ] **Step 2: Run syntax and diff checks**

Run: `node --check explore/app.js && node --check zh/explore/app.js && node --check explore/building-window.js && node --check explore/panorama.js && node --check api/seo-building-page.js && node --check api/sitemap-market.js`

Run: `git diff --check`

- [ ] **Step 3: Run local browser verification**

Verify at 1280px and 390px: home form alignment; district -> Dong -> buildings; ten-row reveal; inline detail open/close; stable Street View size and bearing; normal page scroll; EN/ZH currency switch; no console errors.

- [ ] **Step 4: Verify raw SEO HTML**

Confirm raw HTML contains normal Dong anchors from Explorer and district hubs. Confirm one eligible building raw response contains its building name/data/self-canonical and one sparse slug returns 404/noindex.

- [ ] **Step 5: Review, merge and deploy**

Run the requesting-code-review and finishing-a-development-branch skills. Push the reviewed branch, merge to `main`, allow the Git integration to deploy, and inspect Vercel until production is `READY`.

- [ ] **Step 6: Verify production**

Repeat the critical browser and raw-HTML checks against `https://koreahomeguide.com`, then scan production error logs.

