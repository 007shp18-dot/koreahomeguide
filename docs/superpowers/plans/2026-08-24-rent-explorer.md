# KoreaHomeGuide v9 Rent Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a simple Seoul building-level rent explorer that aggregates official MOLIT rental transactions and hands users into Rent Check, without adding live listings.

**Architecture:** Keep the existing static frontend + Vercel serverless API architecture. Add a city-neutral provider contract implemented by `KoreaHousingProvider`, expose area/building JSON APIs, and render a sparse `/explore/` surface plus a query-driven `/explore/building/` detail surface. All calculations stay in KRW and existing FX helpers are presentation-only.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js CommonJS serverless functions, `node:test`, existing MOLIT parser/fetch helpers.

**Spec:** `docs/superpowers/specs/2026-08-24-rent-explorer-design.md`

## Global Constraints
- Visible v9 city: Seoul only.
- Supported districts: Gangnam-gu, Mapo-gu, Yongsan-gu, Seongdong-gu, Yeongdeungpo-gu.
- Supported property types: apartment, officetel, villa.
- Use six completed contract months by default.
- Monthly-rent medians exclude rows with monthly rent = 0.
- Do not introduce live listings, brokerage contact, landlord contact, reviews, accounts, favorites, or alerts.
- Every explorer surface must say it uses historical signed transactions and is not a live-listings search.
- Existing Rent Check, calculator, FX, Chinese pages, guides, and SEO rent pages must remain functional.
- No production-code change is made before a failing test demonstrates the intended behavior.

---

### Task 1: Provider utilities and Korea provider

**Files:**
- Create: `providers/provider-utils.cjs`
- Create: `providers/korea-provider.cjs`
- Test: `tests/explorer-provider.test.cjs`

**Interfaces:**
- `normalizeBuildingName(name) -> string`
- `buildingKeyFromName(name) -> string`
- `aggregateBuildings(items, options) -> BuildingSummary[]`
- `buildBuildingDetail(items, { buildingKey, months, referenceDate }) -> BuildingDetail | null`
- `createKoreaHousingProvider({ serviceKey, fetchImpl, referenceDate }) -> HousingDataProvider`

- [x] Write failing provider tests covering normalized grouping, monthly-rent zero exclusion, medians, typical size, recent change, trend points, and contract shape.
- [x] Run `node --test tests/explorer-provider.test.cjs` and confirm RED because provider modules do not exist.
- [x] Implement provider utilities and provider methods using `fetchRentalMonth` and existing rent-stat helpers.
- [x] Run provider tests and confirm GREEN.

### Task 2: Explorer APIs

**Files:**
- Create: `api/explore-area.js`
- Create: `api/explore-building.js`
- Test: `tests/explorer-api.test.cjs`

**Interfaces:**
- `GET /api/explore-area?lawdCd=11680&type=officetel`
- `GET /api/explore-building?lawdCd=11680&type=officetel&buildingKey=<key>`

- [x] Write failing API tests for method validation, district/type validation, missing building key, response contract, and provider errors.
- [x] Run API tests and confirm RED.
- [x] Implement the two endpoints with one-hour CDN cache headers and safe user-facing errors.
- [x] Run API tests and confirm GREEN.

### Task 3: Minimal `/explore/` product surface

**Files:**
- Create: `explore/index.html`
- Create: `explore/app.js`
- Create: `explore/explorer-utils.js`
- Modify: `styles.css`
- Test: `tests/explorer-pages.test.cjs`

**Interfaces:**
- Area selector + property selector + `Explore rents` button.
- Area metric cards: monthly rent, deposit, signed contracts, 3-month change.
- Building list links to `/explore/building/?lawdCd=...&type=...&buildingKey=...`.

- [x] Write failing page tests asserting canonical/meta, no-live-listings wording, five districts, three property types, metric placeholders, and building-detail URL helper.
- [x] Run page tests and confirm RED.
- [x] Implement sparse explorer UI, FX presentation, loading/empty/error states, and building rows.
- [x] Run page tests and confirm GREEN.

### Task 4: Building detail surface and Rent Check handoff

**Files:**
- Create: `explore/building/index.html`
- Create: `explore/building/app.js`
- Test: `tests/explorer-building-page.test.cjs`

**Interfaces:**
- Reads `lawdCd`, `type`, and `buildingKey` query parameters.
- Displays building summary, monthly trend, recent signed contracts, and Rent Check CTA.
- `noindex,follow` prevents arbitrary query combinations from becoming programmatic SEO pages in v9.

- [x] Write failing building-page tests for noindex, historical-data wording, trend container, recent contract table, and Rent Check CTA.
- [x] Run tests and confirm RED.
- [x] Implement building detail rendering, simple six-month trend bars/line-like SVG-free CSS presentation, currency switching, and URL-safe empty/error states.
- [x] Run tests and confirm GREEN.

### Task 5: Discovery, internal links, and regression protection

**Files:**
- Modify: `index.html`
- Modify: `sitemap.xml`
- Modify: `rent/*/*/index.html` (15 files)
- Test: `tests/explorer-discovery.test.cjs`

**Interfaces:**
- Home navigation/footer links to `/explore/`.
- Every existing rent SEO page links to `/explore/` with preselected `lawdCd` and `type` query parameters.
- `/explore/` is in sitemap; `/explore/building/` is not.

- [x] Write failing discovery tests.
- [x] Run tests and confirm RED.
- [x] Add internal links and sitemap URL while preserving existing canonicals.
- [x] Run discovery tests and confirm GREEN.

### Task 6: Full verification and artifact

**Files:**
- All production JS and tests.
- Output: `/mnt/data/koreahomeguide-v9-rent-explorer.zip`

- [x] Run `node --test tests/*.test.cjs` and require zero failures.
- [x] Run `node --check` for every production `.js`/`.cjs` file.
- [x] Verify live-listing prohibited phrases are absent from explorer surfaces and required disclaimer is present.
- [x] Verify sitemap contains `/explore/` but not `/explore/building/`.
- [x] Create ZIP and run `unzip -t` successfully.
