# Street View Stability and Opportunity Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize building Street View and ship evidence-gated Seoul budget/deposit discovery pages without adding a Vercel function.

**Architecture:** Keep Explorer fixes inside its existing panorama and final CSS layer. Add a pure opportunity-market engine and focused renderer under `seo/`, then dispatch the new routes through the existing `api/seo-dong-page.js`; reuse `api/explore-area.js::loadAllSeoul` for three-month cached aggregates and extend `api/sitemap-market.js` for discovery.

**Tech Stack:** CommonJS Node.js, static HTML/CSS/JavaScript, NAVER Maps Panorama API, Vercel rewrites/functions, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-street-view-opportunity-pages-design.md`

## Global Constraints

- Do not add a twelfth deployable file under `api/`.
- Use reported signed MOLIT contracts; never imply current listing availability.
- Keep KRW primary and preserve English/Simplified Chinese parity.
- Index only pages with at least three qualifying neighborhoods and fifteen matching contracts.
- Follow test-first red-green-refactor for every behavior change.

---

### Task 1: Street View bearing and stable media frame

**Files:**
- Modify: `tests/explorer-panorama.test.cjs`
- Modify: `tests/explorer-spatial-workspace.test.cjs`
- Modify: `explore/panorama.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: `bearingDegrees(from, to) -> number|null`
- Produces: `panoramaFrameSize(element) -> { width:number, height:number }`
- Consumes: NAVER `Panorama#getLocation`, `Panorama#setPov`, and `Panorama#setSize`.

- [ ] Write failing unit tests with hand-derived north/east/south/west/diagonal bearings, invalid points, and 16:9 frame dimensions.
- [ ] Run `node --test tests/explorer-panorama.test.cjs tests/explorer-spatial-workspace.test.cjs` and confirm failures identify missing bearing/size behavior.
- [ ] Implement bearing normalization, visible-frame sizing, success-time `setPov`/`setSize`, resize observation, and stale-request cleanup.
- [ ] Consolidate the final CSS layer so every Street View state reserves the same 16:9 frame.
- [ ] Re-run the focused tests and keep them green.

### Task 2: Explorer sort control

**Files:**
- Modify: `tests/explorer-filter-controls.test.cjs`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `.building-section-head` and `.explorer-building-sort` markup already present in both locales.
- Produces: a full-width stacked sort field within narrow discovery rails.

- [ ] Write a failing responsive contract test that renders the heading and sort as separate rows and prevents option truncation.
- [ ] Run `node --test tests/explorer-filter-controls.test.cjs` and confirm the new assertions fail.
- [ ] Add the minimal final-layer grid/select CSS for desktop rail, tablet, and mobile.
- [ ] Re-run the focused test and keep it green.

### Task 3: Pure opportunity-market engine

**Files:**
- Create: `tests/opportunity-market.test.cjs`
- Create: `seo/opportunity-market.cjs`

**Interfaces:**
- Produces: `parseOpportunity({ mode, slug, propertyType }) -> normalized query|null`
- Produces: `buildOpportunityModel(dongs, query) -> { query, neighborhoods, qualifyingContracts, indexable }`
- Produces: `opportunityPath(query, lang) -> string`
- Produces: `approvedOpportunityQueries() -> query[]`

- [ ] Write failing tests for approved/invalid slugs, deposit-band boundaries, budget filtering, stable ranking, evidence thresholds, and EN/ZH paths.
- [ ] Run `node --test tests/opportunity-market.test.cjs` and confirm the module/API is missing.
- [ ] Implement the smallest pure parser, filter, ranking, and path builder satisfying the literals in the tests.
- [ ] Re-run the focused test and keep it green.

### Task 4: Server-rendered opportunity pages

**Files:**
- Create: `tests/opportunity-page.test.cjs`
- Create: `seo/opportunity-page.cjs`
- Modify: `api/seo-dong-page.js`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `buildOpportunityModel`, `loadAllSeoul`, location labels, FX rates, and existing HTML error handling.
- Produces: `renderOpportunityPage({ lang, model, fxRates }) -> string`
- Produces: `seo-dong-page` dispatch for `mode=budget|deposit`.

- [ ] Write failing renderer/handler tests for metadata, bilingual copy, KRW values, cards, dataset provenance, prefilled handoffs, sparse noindex, unsupported 404, and cache headers.
- [ ] Run `node --test tests/opportunity-page.test.cjs` and confirm failures are due to missing renderer/routes.
- [ ] Implement semantic server HTML, JSON-LD, safe escaping, canonical/hreflang, responsive CSS, and contextual CTAs.
- [ ] Add budget/deposit rewrites before the dong routes and dispatch them through the existing handler without creating another API file.
- [ ] Re-run the focused test and keep it green.

### Task 5: Evidence-gated sitemap and internal discovery

**Files:**
- Modify: `tests/v10-6-dynamic-sitemap.test.cjs`
- Modify: `tests/acquisition-navigation.test.cjs`
- Modify: `api/sitemap-market.js`
- Modify: `sitemap.xml`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`

**Interfaces:**
- Consumes: `approvedOpportunityQueries`, `buildOpportunityModel`, `opportunityPath`, and `loadAllSeoul`.
- Produces: `/sitemaps/seoul/opportunities/` with indexable opportunity URLs only.

- [ ] Write failing tests for the child sitemap, sparse-page exclusion, no building URLs, and visible localized discovery links.
- [ ] Run the two focused test files and confirm the expected failures.
- [ ] Extend the existing sitemap handler with an opportunity mode and add one root sitemap entry.
- [ ] Add compact localized budget/deposit discovery links to Explorer without changing its primary map workflow.
- [ ] Re-run the focused tests and keep them green.

### Task 6: Full verification and delivery

**Files:**
- Modify only if verification exposes a regression.

**Interfaces:**
- Consumes: all deliverables above.
- Produces: tested Git commit and verified production deployment.

- [ ] Run focused tests for panorama, Explorer, opportunity engine/page, sitemap, SEO metadata, security, and function budget.
- [ ] Run `node --test tests/*.test.cjs` and record the exact pass/fail count.
- [ ] Run `node --check` on every modified JavaScript/CommonJS file and `git diff --check`.
- [ ] Run the repository's deploy/build validation command available in the linked Vercel project.
- [ ] Verify desktop and mobile Explorer Street View geometry/direction hooks plus both example opportunity pages in a real browser.
- [ ] Commit only scoped files, push the approved branch/main path, verify Vercel Production is READY, and re-check the production URLs.
