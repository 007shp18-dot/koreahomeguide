# KoreaHomeGuide map-first product refresh implementation plan

**Goal:** Deliver the approved site-wide UI refresh and map-first Explorer, preserving financial meaning, privacy, bilingual parity and the existing static architecture.

**Architecture:** Extend existing provider helpers and API payloads, then consume the new fields in the current vanilla-JavaScript screens. Reflow existing HTML/CSS rather than introducing a framework. Use existing Explorer endpoints for compare and embed. Keep community network operations behind an explicit server-configured activation gate until durable storage exists.

**Tech stack:** Static HTML, CSS, browser JavaScript, Node CommonJS helpers and `node:test`, Vercel Functions, Google Maps plus NAVER Panorama.

---

## Task 1: Establish a green baseline and UI contracts

**Files:**
- Create: `tests/map-first-product-refresh.test.cjs`
- Modify: `tests/css-token-lint.test.cjs` only if the new test exposes an existing false positive

1. Run `npm test` and record the baseline.
2. Add failing DOM/CSS assertions for the integrated hero, map-first shell, mobile bottom sheet, sort control, search-area action, safe sponsor container, compare page and embed page.
3. Run the new test and confirm it fails because the new product surfaces are absent.
4. Do not add production markup until the failing behavior is confirmed.

## Task 2: Implement deposit-adjusted price per square metre

**Files:**
- Modify: `providers/provider-utils.cjs`
- Modify: `tests/explorer-building-market-position.test.cjs`
- Modify: `tests/provider-utils.test.cjs`
- Modify: `api/explore-area.js`
- Modify: `api/explore-building.js`

1. Add failing table-driven tests for `monthly + deposit * 0.05 / 12`, division by valid area, invalid or zero area, median aggregation and the three-contract threshold.
2. Run the focused tests and confirm the expected missing-field failures.
3. Add a small exported `adjustedMonthlyPerSqmWon` helper.
4. Include `adjustedPerSqmWon` in building summaries, the building representative, dong comparison, district comparison and valid recent contracts.
5. Run the focused tests, then provider/API tests.

## Task 3: Apply the global readability and Rent Check hierarchy pass

**Files:**
- Modify: `styles.css`
- Modify: `cold-start.css`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `rent-check-ui-utils.js`
- Modify: `tests/trust-home-redesign.test.cjs`
- Modify: `tests/rent-check-ui-utils.test.cjs`
- Modify: `tests/mobile-editorial-ui.test.cjs`

1. Add failing tests for a one-line capable English hero, compact six-control grid, idle/loading/error status state, annualized difference copy, word-based percentile labels and mobile evidence rows.
2. Confirm the failures.
3. Add explicit field classes and status data state without changing form IDs or API payloads.
4. Implement prose measures, compact size controls, ruled stage cells and the promoted verdict metric using existing tokens.
5. Add annualized difference and localized percentile labels in shared UI utilities.
6. Run focused EN/ZH and mobile tests.

## Task 4: Rebuild Explorer around the map

**Files:**
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `explore/map.js`
- Modify: `explore/map-controller.js`
- Create: `explore/map-viewport.js`
- Modify: `styles.css`
- Modify: `tests/explorer-map-source.test.cjs`
- Modify: `tests/map-first-product-refresh.test.cjs`

1. Add failing tests for the full-width filter bar, 64/36 desktop split, viewport status events, `Search this area`, cached-coordinate behavior and mobile bottom sheet.
2. Confirm the failures are caused by the current results-first layout.
3. Reorder existing markup into toolbar, map pane and list sheet while preserving all element IDs.
4. Publish debounced Google Maps `idle` bounds events and expose current zoom and layer.
5. Filter cached neighborhood/building markers immediately and show the explicit search action for a new range.
6. Persist verified building coordinates in bounded browser storage and retain the quota-safe new-geocode cap.
7. Add list sorting for strongest evidence, adjusted price per square metre and recent activity.
8. Mirror all UI copy and behavior in Chinese.
9. Run map, Explorer, locale and mobile tests.

## Task 5: Complete the three-panel building decision window

**Files:**
- Modify: `explore/building-window.js`
- Modify: `explore/panorama.js`
- Modify: `styles.css`
- Modify: `tests/explorer-building-window.test.cjs`
- Modify: `tests/explorer-building-market-position.test.cjs`

1. Add failing tests for Street View inside panel 0, adjusted per-square-metre values in all three panels, numeric market comparison pairs and mobile-only tabs.
2. Confirm each failure.
3. Move the existing Street View node from modal chrome into panel 0 while preserving its IDs and NAVER lifecycle.
4. Render the adjusted building value, dong/district medians, percentage relation and evidence counts.
5. Render adjusted per-square-metre values on valid recent contract rows.
6. Keep limited-evidence behavior for fewer than three contracts.
7. Run focused building-window, Panorama and accessibility tests.

## Task 6: Add privacy-safe share image, compare and embed

**Files:**
- Modify: `lead-capture.js`
- Create: `result-share-card.js`
- Create: `compare/index.html`
- Create: `compare/app.js`
- Create: `embed/index.html`
- Create: `embed/app.js`
- Create: `embed.js`
- Modify: `styles.css`
- Modify: `vercel.json`
- Modify: `sitemap-static.xml`
- Modify: `tests/rent-result-share.test.cjs`
- Create: `tests/compare-embed.test.cjs`

1. Add failing tests that a generated share model omits exact quote amounts and personal data, compare uses the existing area endpoint, and embed emits a crawlable credit link plus resize events.
2. Confirm the failures.
3. Generate a 1200×630 card in the browser from the privacy-safe verdict/evidence model and add a download action beside existing Web Share/copy actions.
4. Build the static two-district comparison tool with KRW-first deposit-adjusted metrics.
5. Build the iframe-friendly district snapshot and public embed loader without adding a Vercel Function.
6. Add only indexable, complete surfaces to the static sitemap.
7. Run focused privacy, compare, embed, CSP and SEO tests.

## Task 7: Add guarded sponsor and community foundations

**Files:**
- Modify: `move-commerce.js`
- Create: `community-core.js`
- Create: `community/add/index.html`
- Create: `community/add/app.js`
- Create: `community/index.html`
- Modify: `styles.css`
- Modify: `about/index.html`
- Modify: `zh/about/index.html`
- Create: `tests/community-foundation.test.cjs`
- Modify: `tests/v12-move-commerce-js.test.cjs`

1. Add failing tests for the post-result-only sponsor guard, allowed service categories, community payload validation, identifier stripping, aggregation threshold and the disabled persistence state.
2. Confirm the failures.
3. Enforce one sponsor slot and reject agent, brokerage and listing categories in code as well as CSS. Render nothing when no approved inventory exists.
4. Implement pure community validators, moderation transforms, first-year-monthly aggregation and three-independent-report publication rules.
5. Build contribution and Q&A information surfaces with an honest disabled submission state when the server activation flag is absent.
6. Publish revenue independence and community privacy/moderation rules on About.
7. Do not add public write endpoints until an approved durable store and moderation destination are configured.
8. Run focused sponsor, community, privacy and bilingual tests.

## Task 8: Full verification and production deployment

**Files:**
- Modify only files required by failures found in verification

1. Run `npm test` from a clean process.
2. Run syntax checks for every changed JavaScript file and `git diff --check`.
3. Start the local site and verify desktop/mobile English and Chinese home, Rent Check, Explorer, building window, Street View, compare, embed and community gate in a real browser.
4. Inspect the working tree and exclude `upload/` and all temporary extraction paths.
5. Commit the verified tree.
6. Fast-forward GitHub `main` only if the remote parent is unchanged; verify the remote tree SHA matches the local tree SHA.
7. Wait for Vercel Production READY and the `koreahomeguide.com` alias.
8. Re-run the critical browser journeys on production, confirm NAVER Panorama network/render state and inspect runtime error clusters.
9. Report shipped behavior, test count, deployment commit and the single external community-storage activation requirement if it remains unconfigured.
