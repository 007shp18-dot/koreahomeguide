# Explorer Map Decision Layer v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Explorer map markers communicate budget fit and evidence strength, reveal a localized neighborhood decision card, and measure the map-to-Rent-Check path.

**Architecture:** Extend the pure map controller to derive marker decision models from existing neighborhood summaries and budget-band logic. Keep Google Maps rendering and bounded analytics in the map adapter, while the locale runtimes own formatted money, the static decision card, and the existing Rent Check link updater. The map receives all neighborhoods plus the active limits; card filtering remains unchanged.

**Tech Stack:** Browser JavaScript, CommonJS-compatible pure utilities, Google Maps JavaScript API, static HTML/CSS, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-08-27-explorer-map-decision-layer-design.md`

## Global Constraints

- Use only curated neighborhood centroids and the existing Maps JavaScript API.
- Do not add geocoding, Places, Routes, building markers, listings, safety scores, or new API responses.
- Do not put budget amounts, quote amounts, free text, contact data, or errors into analytics.
- Preserve Explorer card usability and Rent Check handoffs when the map is unavailable.
- Ship English and Simplified Chinese parity.
- Keep budget limits out of Rent Check quote fields.

---

### Task 1: Pure Marker Decision Model

**Files:**
- Modify: `explore/map-controller.js`
- Test: `tests/map-controller.test.cjs`

**Interfaces:**
- Consumes: `KHGExplorer.budgetFitForDong(item, limits)` and existing neighborhood location/label catalogs.
- Produces: `buildMarkerModels({ lawdCd, propertyType, dongs, locale, limits })`, marker fields `districtCode`, `propertyType`, `rentWon`, `depositWon`, `evidenceCount`, `evidenceLevel`, `budgetStatus`, `tone`, and `scale`; `buildMapAnalyticsEvent(name, context)`.

- [ ] **Step 1: Write failing marker-decision tests**

Add literal fixtures proving: 10 matching contracts produce `strong`; fewer than 10 produce `limited`; a non-fitting neighborhood produces `outside`; matching deposit-band values are used for displayed rent/deposit; missing coordinates are omitted.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/map-controller.test.cjs`

Expected: FAIL because the decision fields and analytics builder do not exist.

- [ ] **Step 3: Implement the minimal pure model**

Derive fit with the shared budget helper, normalize contract counts and amounts, freeze every model, select the matching representative band, and return only the approved bounded analytics fields.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `node --test tests/map-controller.test.cjs`

Expected: all marker-controller tests pass.

### Task 2: Localized Decision Card and All-Neighborhood Map Feed

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Test: `tests/explorer-map-layout.test.cjs`
- Test: `tests/explorer-map-source.test.cjs`

**Interfaces:**
- Consumes: marker selection event detail `{ model }`; existing `moneyHtml`, locale labels, budget values, and `updateRentCheckHandoff()`.
- Produces: static `#explorerMapSelection` live region with name, classification, rent, deposit, evidence, and `data-rent-check-cta="explorer_map_handoff"`; the `khg:explorer-dongs` event includes all dongs, type, and limits.

- [ ] **Step 1: Write failing structure and feed tests**

Require both locales to contain the legend and hidden live decision card, and require both runtimes to publish all neighborhood models with property type and budget limits and render marker selection detail.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/explorer-map-layout.test.cjs tests/explorer-map-source.test.cjs`

Expected: FAIL because the legend, decision card, and enriched event are absent.

- [ ] **Step 3: Add static localized markup and runtime rendering**

Add the localized legend and decision card to each map card. Publish unfiltered area dongs with `{ propertyType, limits }`, render safely escaped selection values, unhide the decision card, and refresh the existing bounded Rent Check link.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/explorer-map-layout.test.cjs tests/explorer-map-source.test.cjs`

Expected: both test files pass.

### Task 3: Marker Styling, Selection, and Bounded Analytics

**Files:**
- Modify: `explore/map.js`
- Modify: `tests/explorer-map-source.test.cjs`
- Test: `tests/map-controller.test.cjs`

**Interfaces:**
- Consumes: Task 1 marker `tone`, `scale`, and bounded event builder; Task 2 event detail and static selection card.
- Produces: green/amber/grey/blue Google marker icons, enriched `khg:map-select-dong` detail, one `explorer_map_view` event per map instance, and one `explorer_map_select` event per marker click.

- [ ] **Step 1: Write failing adapter and analytics tests**

Require the adapter to apply model-driven marker icons, preserve selected styling, send the selected marker model, and call the pure analytics builder for view and select events.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/map-controller.test.cjs tests/explorer-map-source.test.cjs`

Expected: FAIL because styling and bounded events are absent.

- [ ] **Step 3: Implement minimal marker and analytics behavior**

Use circle symbols with the approved colors/scales, restore the model tone when selection changes, dispatch the complete frozen model, and safely call `window.gtag` without delaying interaction.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/map-controller.test.cjs tests/explorer-map-source.test.cjs`

Expected: both test files pass.

### Task 4: Responsive Styling and End-to-End Verification

**Files:**
- Modify: `styles.css`
- Modify: `tests/explorer-map-layout.test.cjs`

**Interfaces:**
- Consumes: Task 2 legend and decision-card class names.
- Produces: desktop map-card hierarchy, readable legend chips, selected decision panel, and a bounded mobile layout below the map.

- [ ] **Step 1: Write the failing responsive-style assertions**

Require legend, selection card, selected-status, and mobile decision-panel rules without changing the existing map-first mobile grid order.

- [ ] **Step 2: Run the layout test and verify RED**

Run: `node --test tests/explorer-map-layout.test.cjs`

Expected: FAIL because the new classes are not styled.

- [ ] **Step 3: Add the minimal responsive styles**

Add compact legend chips, decision metrics, evidence badge states, blue selected treatment, readable focus state, and 390px-safe wrapping.

- [ ] **Step 4: Run focused and full automated verification**

Run: `node --test tests/map-controller.test.cjs tests/explorer-map-layout.test.cjs tests/explorer-map-source.test.cjs`

Then run: `node --test tests/*.test.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 5: Verify in a browser**

Check English and Chinese Explorer at 1280×720 and 390×844. Confirm map failure fallback, marker/card synchronization, localized decision content, no horizontal overflow, and the prefilled Rent Check URL.

- [ ] **Step 6: Review the complete diff**

Compare against `origin/main`, check every success criterion in the design, and resolve all critical or important findings before integration.
