# v11 Fair Rent Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add P25/median/P75 and quote percentile context to reliable Rent Check results in English and Simplified Chinese while preserving the existing verdict methodology.

**Architecture:** Extend `lib/rent-check-core.cjs` so distribution statistics are derived from the exact comparable set already selected for the verdict. Render the returned fields in the existing Rent Check result component; do not add a new endpoint or data source.

**Tech Stack:** Node.js CommonJS, browser JavaScript, static HTML, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-fair-rent-intelligence-design.md`

## Global Constraints

- Existing `below / fair / above` thresholds remain at ±10% from the median.
- Existing tier rules and comparable-selection logic remain unchanged.
- New distribution fields are null when the result is insufficient.
- All statistical calculations remain in KRW.
- EN and Simplified Chinese must expose equivalent information.
- No safety score, referral, advertising, new provider, or opaque recommendation score.

---

### Task 1: Core distribution statistics

**Files:**
- Modify: `lib/rent-check-core.cjs`
- Test: `tests/v11-fair-rent-intelligence.test.cjs`

**Interfaces:**
- Consumes: existing `resultFromComparables(comparables, quote, config)` and its exact comparable set.
- Produces: `percentile(values, p)`, `percentileRank(values, askingValue)`, plus result fields `p25ValueWon`, `p75ValueWon`, `percentileRank`.

- [x] **Step 1: Write failing core tests**

```js
const core = require('../lib/rent-check-core.cjs');
assert.equal(core.percentile([100, 200, 300, 400], 0.25), 175);
assert.equal(core.percentile([100, 200, 300, 400], 0.75), 325);
assert.equal(core.percentileRank([100, 200, 300, 400], 300), 75);
```

Add a result test proving reliable monthly-rent output contains P25/P75/rank and an insufficient result returns null for all three.

- [x] **Step 2: Run test and verify RED**

Run: `node --test tests/v11-fair-rent-intelligence.test.cjs`
Expected: FAIL because percentile helpers/fields do not exist.

- [x] **Step 3: Implement minimal statistics**

Add deterministic sorted-value helpers. In the reliable branch of `resultFromComparables`, calculate distribution values from `values`. In both insufficient branches return `p25ValueWon:null`, `p75ValueWon:null`, `percentileRank:null`.

- [x] **Step 4: Run test and verify GREEN**

Run: `node --test tests/v11-fair-rent-intelligence.test.cjs`
Expected: core assertions PASS.

### Task 2: EN/ZH Rent Check rendering

**Files:**
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `rent-check-ui-utils.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `zh/rent-check-ui-utils.js`
- Test: `tests/v11-fair-rent-intelligence.test.cjs`

**Interfaces:**
- Consumes: API result fields `p25ValueWon`, `medianValueWon`, `p75ValueWon`, `percentileRank`.
- Produces: runtime DOM ids `rentCheckDistribution`, `rentCheckRange`, `rentCheckPercentile`, and locale helper `percentileSentence(result)`.

- [x] **Step 1: Add failing UI contract tests**

Assert both app files create `rentCheckDistribution`, `rentCheckRange`, and `rentCheckPercentile`, render P25/P75, and hide the block for null fields; EN/ZH UI helpers export localized `percentileSentence`.

- [x] **Step 2: Run test and verify RED**

Run: `node --test tests/v11-fair-rent-intelligence.test.cjs`
Expected: FAIL on missing DOM ids/helper/rendering.

- [x] **Step 3: Implement minimal UI**

Create one distribution panel at runtime immediately before the existing evidence section. Render `P25 – P75` through existing currency display helpers and render the localized percentile sentence. Hide the panel when any distribution field is null or result rating is `insufficient`.

- [x] **Step 4: Run test and verify GREEN**

Run: `node --test tests/v11-fair-rent-intelligence.test.cjs`
Expected: PASS.

### Task 3: Regression and packaging

**Files:**
- Verify all modified JS/CJS above.
- Package only modified files plus spec/plan/test.

**Interfaces:**
- Consumes: completed Tasks 1–2.
- Produces: uploadable ZIP preserving repository paths.

- [x] **Step 1: Run syntax checks**

```bash
node --check lib/rent-check-core.cjs
node --check rent-check-ui-utils.js
node --check zh/rent-check-ui-utils.js
node --check tools/seoul-rent-check/app.js
node --check zh/tools/seoul-rent-check/app.js
```

Expected: exit 0 for each.

- [x] **Step 2: Run targeted regression tests**

Run the new v11 test plus copied existing Rent Check layout/tool/UI tests available in the isolated workspace.
Expected: 0 failures.

- [x] **Step 3: Verify constraints by source inspection**

Confirm `rateDifference()` still uses `<= -10` and `>= 10`; `TIERS` remains unchanged; no API endpoint/provider code changed; no affiliate/referral text added.

- [x] **Step 4: Create upload ZIP**

Create `koreahomeguide-v11-fair-rent-intelligence.zip` with repository-relative paths and a README listing verification results.
