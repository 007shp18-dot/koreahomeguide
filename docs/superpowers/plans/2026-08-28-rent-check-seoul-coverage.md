# Rent Check Seoul Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Rent Check from 10 to all 25 Seoul districts while keeping Explorer, Seoul-wide aggregation, and SEO at their current bounded coverage.

**Architecture:** Add a separate `RENT_CHECK_DISTRICTS` catalogue instead of widening the existing Explorer/SEO `DISTRICTS`. The Rent Check endpoint will validate against the new catalogue, while every Explorer and SEO API continues to use the existing `SEOUL_DISTRICTS`. Browser-saved quotes will consume the shared catalogue so new districts survive save, compare, and recheck flows.

**Tech Stack:** Static HTML, browser JavaScript, CommonJS Vercel Functions, Node.js built-in test runner.

**Spec:** `docs/superpowers/plans/2026-08-28-rent-check-seoul-coverage-spec.md`

## Global Constraints

- Preserve current Rent Check DOM IDs, URLs, API query keys, and GA4 event names.
- Keep Korean district names visible in English and Chinese selectors.
- Keep `SEOUL_DISTRICTS`, Explorer selectors, and Seoul-wide aggregation at exactly 10 districts.
- Keep the Seoul-wide endpoint at exactly 30 monthly upstream calls per cache miss.
- Do not create neighborhood labels, coordinates, market pages, or indexable SEO URLs in this stage.
- Implement with failing tests first and run the complete test suite before upload.

---

### Task 1: Separate Rent Check coverage from Explorer coverage

**Files:**
- Modify: `location-catalog.js`
- Modify: `providers/seoul-config.cjs`
- Modify: `api/rent-check.js`
- Test: `tests/seoul-rent-check-coverage.test.cjs`

**Interfaces:**
- Produces: `RENT_CHECK_DISTRICTS: Readonly<Record<string, DistrictRecord>>`
- Produces: `isRentCheckAreaCode(code: string): boolean`
- Preserves: `SEOUL_DISTRICTS` and `isSupportedAreaCode(code)` as the 10-district Explorer/SEO boundary.

- [ ] **Step 1: Write the failing catalogue and API-boundary tests**

```js
assert.equal(Object.keys(catalog.RENT_CHECK_DISTRICTS).length, 25);
assert.equal(Object.keys(config.SEOUL_DISTRICTS).length, 10);
assert.equal(config.isRentCheckAreaCode('11710'), true);
assert.equal(config.isSupportedAreaCode('11710'), false);
assert.equal(rentCheck.parseRentCheckQuery(validQuery('11710')).ok, true);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/seoul-rent-check-coverage.test.cjs`

Expected: FAIL because `RENT_CHECK_DISTRICTS` and `isRentCheckAreaCode` do not exist.

- [ ] **Step 3: Add the 25-district catalogue and Rent Check-only validator**

Define the complete official five-digit Seoul district code set in `location-catalog.js`. Derive `RENT_CHECK_DISTRICTS` and `isRentCheckAreaCode` in `providers/seoul-config.cjs`, then switch only `api/rent-check.js` to that validator.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `node --test tests/seoul-rent-check-coverage.test.cjs`

Expected: PASS.

### Task 2: Expose all districts in both Rent Check locales

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Test: `tests/seoul-rent-check-coverage.test.cjs`

**Interfaces:**
- Consumes: the same 25 codes accepted by `isRentCheckAreaCode`.
- Preserves: `#rentCheckArea`, Gangnam-gu default, and existing API/analytics payload keys.

- [ ] **Step 1: Add failing selector and analytics tests**

For each of the four HTML files, extract `#rentCheckArea`, assert 25 unique district values, assert Korean text remains visible, and assert new district labels are localized. For each runtime, assert its analytics allowlist contains all 25 codes.

- [ ] **Step 2: Run the focused test and confirm the new assertions fail**

Run: `node --test tests/seoul-rent-check-coverage.test.cjs`

Expected: FAIL with selectors and analytics still limited to 10.

- [ ] **Step 3: Append the 15 additional district options and widen only Rent Check analytics**

Keep the original first option unchanged. Use English labels such as `Songpa-gu (송파구)` and Chinese labels such as `松坡区（송파구）`. Do not add the options to Explorer.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/seoul-rent-check-coverage.test.cjs tests/rent-check-analytics.test.cjs`

Expected: PASS.

### Task 3: Preserve new districts through saved-home comparison

**Files:**
- Modify: `saved-rent-quotes.js`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Modify: `saved-homes/index.html`
- Modify: `zh/saved-homes/index.html`
- Test: `tests/saved-rent-quotes.test.cjs`
- Test: `tests/saved-homes-pages.test.cjs`

**Interfaces:**
- Consumes: `KHGLocations.RENT_CHECK_DISTRICTS` in the browser and `require('./location-catalog.js')` in Node.
- Produces: saved quotes that normalize, label, compare, and recheck all 25 district codes.

- [ ] **Step 1: Add failing tests for a new district save and script order**

```js
const songpa = saved.normalizeQuote(quote({ districtCode:'11710' }));
assert.equal(songpa.districtCode, '11710');
assert.equal(saved.districtLabel('11710', 'zh-CN'), '松坡区');
```

Also assert `/location-catalog.js` loads before `/saved-rent-quotes.js` on every page that mounts the saved-home runtime.

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `node --test tests/saved-rent-quotes.test.cjs tests/saved-homes-pages.test.cjs`

Expected: FAIL because the saved runtime still owns a 10-code copy.

- [ ] **Step 3: Inject the shared location catalogue into the saved runtime**

Use the shared catalogue for accepted codes and localized labels, retain deterministic fallbacks, and add the shared script before the saved runtime in all six localized entry pages.

- [ ] **Step 4: Run focused tests and confirm they pass**

Run: `node --test tests/saved-rent-quotes.test.cjs tests/saved-homes-pages.test.cjs tests/seoul-rent-check-coverage.test.cjs`

Expected: PASS.

### Task 4: Regression, boundary, and production verification

**Files:**
- Verify: all modified files

**Interfaces:**
- Consumes: the completed 25-district Rent Check flow.
- Produces: a deployable commit whose Explorer/SEO boundary is unchanged.

- [ ] **Step 1: Run syntax and whitespace checks**

Run: `node --check location-catalog.js && node --check providers/seoul-config.cjs && node --check api/rent-check.js && git diff --check`

- [ ] **Step 2: Run the full suite**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass, including the existing 10-district/30-call Seoul-wide test.

- [ ] **Step 3: Review the diff and commit**

Run: `git diff --stat && git status --short`

Commit message: `Expand Rent Check to all Seoul districts`

- [ ] **Step 4: Upload and verify production**

Confirm GitHub main has not advanced, update it without force, wait for the matching Vercel production deployment to reach `READY`, verify the changed production assets, and scan new-deployment runtime errors.
