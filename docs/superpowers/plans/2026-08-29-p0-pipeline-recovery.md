# KoreaHomeGuide P0 and Pipeline Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining P0 UX defects and restore the official rental fields and renewal aggregates required by later KoreaHomeGuide features.

**Architecture:** Keep the existing static HTML and browser JavaScript architecture. Replace Explorer's bounded rail with document-flow layout CSS, centralize evidence gating in shared render helpers, and extend the existing rental normalization/aggregation pipeline rather than adding an endpoint or data source.

**Tech Stack:** Static HTML/CSS/JavaScript, CommonJS Node modules, Vercel Functions, `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-29-p0-pipeline-recovery-design.md`

## Global Constraints

- Use only the existing design tokens; do not introduce new colors.
- Hide price medians and bars when `n < 5`; omit rows when `n = 0`.
- Preserve existing API fields and routes for backward compatibility.
- Preserve the two-step neighborhood preview and activation flow.
- Keep English and Simplified Chinese behavior aligned.
- Do not add a Vercel Function or external data source.

---

### Task 1: Restore document-flow Explorer layout

**Files:**
- Modify: `styles.css`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Test: `tests/explorer-spatial-workspace.test.cjs`

**Interfaces:**
- Consumes: existing `.map-first-workspace`, `.explorer-map-column`, `.explorer-discovery-rail`, and `.explorer-results` DOM classes.
- Produces: a desktop sticky map and normal-flow result rail with no vertically overflowing `auto|scroll` container.

- [ ] Add failing CSS contract tests that reject fixed workspace height, absolute discovery rail positioning, and `overflow-y:auto|scroll` on Explorer result containers.
- [ ] Run `node --test tests/explorer-spatial-workspace.test.cjs` and verify the new assertions fail.
- [ ] Replace the final Explorer CSS layer with a 64/36 grid, sticky map, normal-flow rail, and mobile map-then-results layout.
- [ ] Bump the shared stylesheet query in both Explorer HTML files.
- [ ] Re-run the focused test and verify it passes.
- [ ] Commit with `fix: remove Explorer nested scrolling`.

### Task 2: Apply evidence hierarchy and sample gates

**Files:**
- Modify: `rent-market-page.js`
- Modify: `zh/rent-market-page.js`
- Modify: `explore/building/app.js`
- Modify: `zh/explore/building/app.js`
- Modify: `styles.css`
- Test: `tests/rent-market-pages.test.cjs`
- Test: `tests/v10-5-transaction-quality.test.cjs`

**Interfaces:**
- Consumes: `depositBands[]` and `areaGroups[]` with `count`, medians, and observed bounds.
- Produces: localized market rows that expose medians only when `count >= 5`.

- [ ] Add failing tests for `1 contract`, `Under 5`, hidden medians for `n < 5`, Chinese `份合同`, and rent-first DOM hierarchy.
- [ ] Run the focused market-page tests and verify the assertions fail.
- [ ] Implement localized sample labels and shared row markup in both locale runtimes.
- [ ] Apply the same gate to building detail deposit and area groups.
- [ ] Add token-only CSS for 21px primary rent and 12px secondary counts.
- [ ] Re-run the focused tests and verify they pass.
- [ ] Commit with `fix: enforce market evidence thresholds`.

### Task 3: Fix mobile Rent Check completion feedback

**Files:**
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `styles.css`
- Test: `tests/rent-check-feedback-response.test.cjs`
- Test: `tests/cold-start-analytics.test.cjs`

**Interfaces:**
- Consumes: `#rentCheckResult`, `window.matchMedia`, and the existing `setStatus(text, state)` helper.
- Produces: `revealRentCheckResult()` and success completion represented by `data-state="idle"`.

- [ ] Add failing tests that require reduced-motion-aware mobile `scrollIntoView`, reject `data-state="success"`, and reject the literal `Comparison complete.` success line.
- [ ] Run the focused tests and verify the new assertions fail.
- [ ] Implement `revealRentCheckResult()` in all four runtimes and call it after rendering a successful or insufficient result.
- [ ] Return status to `idle` after result rendering and keep only loading/error status copy.
- [ ] Add result scroll margins and mobile bottom padding.
- [ ] Re-run the focused tests and verify they pass.
- [ ] Commit with `fix: reveal mobile Rent Check results`.

### Task 4: Expand the Seoul sitemap and normalize headers

**Files:**
- Modify: `sitemap.xml`
- Modify: shared/static product HTML where header labels differ
- Modify: `seo/seo-page-renderer.cjs`
- Test: `tests/v10-6-dynamic-sitemap.test.cjs`
- Test: `tests/header-unification.test.cjs`

**Interfaces:**
- Consumes: all 25 district slugs in `location-catalog.js` and existing child sitemap rewrites.
- Produces: 25 districts × 3 types in the root sitemap while child quality gates remain unchanged.

- [ ] Add failing tests requiring all 75 district/type child sitemap entries and consistent `Explore` navigation labels and controls.
- [ ] Run the focused tests and verify the new assertions fail.
- [ ] Generate the 75 deterministic child sitemap entries from the supported location catalog and update the checked-in XML.
- [ ] Normalize product header labels and renderer output without changing contextual CTAs.
- [ ] Re-run the focused tests and verify they pass.
- [ ] Commit with `feat: cover all Seoul market sitemaps`.

### Task 5: Restore rental observation fields

**Files:**
- Modify: `lib/real-price-core.cjs`
- Modify: `lib/rent-check-core.cjs`
- Modify: `lib/rent-market-core.cjs`
- Modify: `providers/provider-utils.cjs`
- Test: `tests/v10-5-transaction-quality.test.cjs`
- Test: `tests/rent-market-field-recovery.test.cjs`

**Interfaces:**
- Produces: `parseLeaseEnd(term)`, `renewalDelta(row)`, and `buildObservedFieldStats(rows)` from `lib/rent-market-core.cjs`.
- Produces on summaries: `buildYearMin`, `buildYearMax`, `buildYearMedian`, `floorMin`, `floorMax`, `leaseEndHistogram`, and `renewalDeltas`.

- [ ] Add failing parser tests for `buildYear`, floor aliases, prior prices, contract term, and renewal-right values.
- [ ] Add failing aggregation tests for lease ends, build/floor ranges, valid renewal deltas, zero changes, above-5% counts, and invalid pair exclusion.
- [ ] Run the focused tests and verify failures point to missing output fields.
- [ ] Extend XML parsing and transaction normalization with nullable numeric build year and floor.
- [ ] Implement lease-end parsing, renewal delta calculation, percentiles, histogram, and observed-field aggregation.
- [ ] Merge observed fields into area, Dong, and building summaries and preserve them on recent transaction rows.
- [ ] Re-run the focused tests and verify they pass.
- [ ] Commit with `feat: restore rental observation fields`.

### Task 6: Verify and deploy the release

**Files:**
- Modify only files required by verified review findings.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: a reviewed GitHub commit on `main` and a `READY` Vercel production deployment.

- [ ] Run `node --test tests/*.test.cjs` and require zero failures.
- [ ] Run `node --check` on every changed JavaScript file and `git diff --check`.
- [ ] Request a read-only code review and resolve every Critical or Important finding.
- [ ] Deploy the reviewed commit to a Vercel preview.
- [ ] Verify desktop 1280px and mobile 390px Explorer/Rent Check flows, overflow diagnostics, console errors, sitemap responses, and API field presence.
- [ ] Fast-forward GitHub `main`, wait for Vercel Production `READY`, and repeat the production checks.
