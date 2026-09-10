# Explorer Building Status Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Explorer's small building selection card with a polished three-part building status window that explains the selected building, its signed-rent market position, and its recent contracts while preserving verified NAVER street view, official addresses, saving, and Rent Check handoff.

**Architecture:** Extend the existing `/api/explore-building` response with two independently optional enrichments: a market-position calculation derived only from already fetched official signed transactions, and an exact-match building profile from the official Building HUB API when configured and available. A locale-aware browser controller owns one reusable dialog/sheet for both list-row and map-marker entry points. NAVER panorama remains coordinate-gated through the existing verified map location flow. Any unavailable enrichment renders as an honest unavailable state instead of blocking the core transaction detail.

**Tech Stack:** Node.js CommonJS serverless functions, vanilla JavaScript UMD browser modules, HTML/CSS, Node test runner, NAVER Maps Panorama, data.go.kr MOLIT and Building HUB APIs, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-29-explorer-building-status-window-design.md`

## Global constraints

- English and Chinese Explorer must share behavior and have native locale copy.
- Never scrape NAVER Real Estate or infer a building profile from a fuzzy name match.
- Market comparisons use completed monthly-rent contracts only and must expose sample size.
- Deposit differences must be normalized before ranking monthly rent.
- No enrichment failure may prevent the selected building's own signed-contract data from rendering.
- Street view may render only for a map-verified building coordinate and must preserve capture-date metadata.
- Mobile uses tabs rather than squeezing three desktop columns.
- The existing `Explore → building → Rent Check` path and analytics event names remain compatible.
- Add no new Vercel function; extend the current endpoint and client assets.

---

### Task 1: Add market-position domain calculations

**Files:**
- Modify: `providers/provider-utils.cjs`
- Modify: `lib/real-price-core.cjs`
- Test: `tests/explorer-building-market-position.test.cjs`
- Test: `tests/explorer-provider.test.cjs`

**Step 1: Write failing calculation tests**

Cover:

- selected-building median deposit and monthly rent;
- equivalent monthly-rent normalization using the existing Rent Check deposit adjustment;
- dong and district percentile rank;
- comparable sample and distinct-building counts;
- 6-month trend derived from completed contracts;
- insufficient-sample states at the agreed thresholds;
- exclusion of cancelled, zero-rent, mismatched-property-type, and missing-area rows;
- preservation of floor and legal-region codes in parsed transactions.

**Step 2: Run the focused tests and confirm failure**

Run: `node --test tests/explorer-building-market-position.test.cjs tests/explorer-provider.test.cjs`

Expected: FAIL because market-position output and preserved fields do not exist.

**Step 3: Implement the smallest pure calculation**

Add an exported helper that accepts the already fetched district/property transaction set and selected building key. Return:

```js
{
  snapshot: { medianDeposit, medianMonthlyRent, typicalAreaSqm, contractCount },
  marketPosition: {
    dong: { percentile, sampleSize, buildingCount, status },
    district: { percentile, sampleSize, buildingCount, status },
    trend: { months: 6, changePct, status }
  }
}
```

Use null/status values instead of invented numbers. Preserve `floor`, `sggCd`, and `umdCd` from the source parser where present.

**Step 4: Run focused tests**

Expected: PASS.

**Step 5: Commit**

Commit message: `Add Explorer building market position`

---

### Task 2: Add optional official building profile enrichment

**Files:**
- Create: `providers/building-profile-provider.cjs`
- Modify: `providers/korea-provider.cjs`
- Modify: `api/explore-building.js`
- Test: `tests/building-profile-provider.test.cjs`
- Test: `tests/explorer-api.test.cjs`

**Step 1: Write failing provider tests**

Cover:

- exact legal-address lookup using the selected transaction's region codes and jibun;
- extraction of approval year/date, household or unit count, above-ground floors, and official address;
- omission of blank/zero fields;
- no profile on address mismatch;
- timeout, upstream error, and missing service configuration returning `unavailable` without throwing;
- the endpoint returning base detail when profile enrichment fails.

**Step 2: Confirm focused failure**

Run: `node --test tests/building-profile-provider.test.cjs tests/explorer-api.test.cjs`

Expected: FAIL because the provider and response section do not exist.

**Step 3: Implement optional provider**

Use the configured official Building HUB endpoint and `DATA_GO_KR_SERVICE_KEY`/dedicated override. Apply a short timeout and exact address validation. Return a source label and retrieval status. Do not query NAVER Real Estate.

**Step 4: Attach enrichments to existing detail flow**

Calculate market position from rows already loaded by `getBuildingDetail`. Fetch the profile independently. Preserve the current base response shape while adding `snapshot`, `marketPosition`, and `profile`.

**Step 5: Run focused tests**

Expected: PASS.

**Step 6: Commit**

Commit message: `Enrich Explorer building details`

---

### Task 3: Build the reusable status-window controller

**Files:**
- Create: `explore/building-window.js`
- Create: `explore/saved-buildings.js`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Test: `tests/explorer-building-window.test.cjs`
- Test: `tests/saved-explorer-buildings.test.cjs`

**Step 1: Write failing browser-module contract tests**

Cover:

- safe escaped rendering;
- loading, ready, partial, empty, and failure states;
- desktop three-panel landmarks;
- mobile tab controls with correct ARIA relationships;
- English and Chinese labels;
- close button, Escape, focus return, and background-scroll lock;
- save/toggle/remove persistence with a bounded versioned localStorage payload;
- `Check this rent` handoff without fabricated quote values.

**Step 2: Confirm focused failure**

Run: `node --test tests/explorer-building-window.test.cjs tests/saved-explorer-buildings.test.cjs`

Expected: FAIL because modules and markup are absent.

**Step 3: Implement state and persistence modules**

Create a controller with one state model and event-driven `open`, `close`, `selectTab`, `save`, and `retry` actions. Saved records contain only public building identity/address data and no user quote.

**Step 4: Add one shared dialog shell per locale**

The shell contains:

- header: localized building name, official address, source/status chips, close;
- mobile tabs: Overview, Market, Contracts;
- panel 1: building facts and verified street-view slot;
- panel 2: dong/district position, sample disclosure, trend;
- panel 3: recent contract rows and action bar;
- inline unavailable messages for optional sections.

**Step 5: Run focused tests**

Expected: PASS.

**Step 6: Commit**

Commit message: `Build Explorer building status window`

---

### Task 4: Connect building rows, map markers, NAVER panorama, and actions

**Files:**
- Modify: `explore/app.js`
- Modify: `explore/map.js`
- Modify: `explore/panorama.js`
- Modify: `zh/explore/app.js`
- Modify: `zh/explore/map.js`
- Modify: `zh/explore/panorama.js`
- Modify: `tests/explorer-panorama.test.cjs`
- Modify: `tests/map-controller.test.cjs`
- Modify: `tests/explorer-rent-check-handoff.test.cjs`

**Step 1: Write failing integration-contract tests**

Cover:

- clicking a building list row opens the new window;
- clicking a verified building marker opens the same window;
- verified lat/lng is supplied to panorama and unverified coordinates never render it;
- capture date remains visible;
- window close returns focus to the triggering row/marker;
- Rent Check action includes only known building/district/property context;
- analytics distinguish row and marker entry points.

**Step 2: Confirm focused failure**

Run the three affected test files and confirm failure.

**Step 3: Replace the small selection-card route**

Dispatch one normalized building-selection event from rows and markers. Keep neighborhood selection behavior unchanged. Fetch detail once per building with an in-memory cache and retry on failure.

**Step 4: Adapt panorama mounting**

Mount the existing NAVER panorama implementation into the Overview panel only after a verified coordinate resolves. Keep the existing 50m safety radius and captured-at copy.

**Step 5: Run focused tests**

Expected: PASS.

**Step 6: Commit**

Commit message: `Connect Explorer building interactions`

---

### Task 5: Apply the polished responsive visual system

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Test: `tests/explorer-building-window-ui.test.cjs`
- Modify: `tests/explorer-mobile-view.test.cjs`
- Modify: `tests/accessibility-ui-contract.test.cjs`

**Step 1: Write failing visual-contract tests**

Require:

- a restrained data-terminal visual language using current tokens;
- maximum readable dialog width and viewport-safe height;
- equal desktop columns with purposeful dividers rather than nested boxes;
- tabbed single-panel mobile layout at 767px and below;
- no clipped heading, address, percentile label, or transaction amount at 320px;
- 44px minimum touch targets;
- reduced-motion behavior;
- print-hidden dialog and no horizontal page overflow.

**Step 2: Confirm failure**

Run the new UI test plus the two regression suites.

**Step 3: Implement CSS and final markup refinements**

Use typography, rules, chips, compact metrics, and whitespace for hierarchy. Avoid dashboard-card stacking. The primary value is the selected building data; explanation and sources remain visually secondary.

**Step 4: Run focused tests**

Expected: PASS.

**Step 5: Commit**

Commit message: `Polish Explorer building status window`

---

### Task 6: Full verification and production deployment

**Files:**
- Modify only if verification exposes a defect.

**Step 1: Static and automated verification**

Run:

```bash
npm test
git diff --check
node --check explore/building-window.js
node --check explore/saved-buildings.js
node --check providers/building-profile-provider.cjs
```

Expected: all tests pass, no whitespace errors, no syntax errors.

**Step 2: Local browser verification**

Verify English and Chinese at desktop, 390px, and 320px:

- row and marker open paths;
- all tabs/panels;
- loading and partial-data states;
- street view and captured date;
- Save → Saved → Remove;
- Rent Check handoff;
- close/Escape/focus behavior;
- no horizontal overflow.

**Step 3: Review final diff and commit**

Ensure `upload/` and all temporary mockup extraction files remain untracked and excluded.

**Step 4: Deploy safely**

Rebase the verified tree onto the latest remote `main` without force. Push only a fast-forward commit/tree. Wait for Vercel Production `READY` and confirm `koreahomeguide.com` points to that deployment.

**Step 5: Verify production**

Repeat the critical English/Chinese row and marker paths on the production domain. Confirm API base detail survives profile unavailability and NAVER panorama renders for a known verified building.

**Step 6: Record handoff**

Report the production commit, Vercel state, automated-test count, browser paths verified, and whether official Building HUB profile fields are live or awaiting API-service authorization.
