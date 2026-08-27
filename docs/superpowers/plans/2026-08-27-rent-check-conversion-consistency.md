# Rent Check Conversion Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Rent Check size choices context-aware, simplify its result action, and unify money and visual behavior across the English and Chinese product surfaces.

**Architecture:** Extend the existing shared `rent-check-size.js` and `currency-utils.js` controllers instead of duplicating behavior in four localized runtimes. Keep the page apps responsible for API calls and result rendering, while shared modules own preset state and currency parsing/preference. Limit CSS cleanup to the core selectors touched by this sprint.

**Tech Stack:** Static HTML, browser JavaScript, CommonJS-compatible shared utilities, CSS, Node.js built-in test runner, GitHub, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-27-rent-check-conversion-consistency-design.md`

## Global Constraints

- Preserve existing API contracts, calculation rules, DOM IDs, URLs, analytics event names, SEO metadata, and saved-quote storage schema.
- Implement the same behavior in English and Simplified Chinese and verify desktop and mobile layouts.
- Make no external dependency additions.
- Use KRW for the official primary amount and foreign currency only as an approximate reference.

---

### Task 1: Property-type-aware size presets

**Files:**
- Modify: `tests/rent-check-size.test.cjs`
- Modify: `rent-check-size.js`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`

**Interfaces:**
- Produces: `presetConfig(propertyType, language)`, `controller.setPropertyType(type, options)`, and `controller.setPrefilledSqm(value)`.
- Preserves: `readSqm`, `displayedValue`, `setSqm`, and `init`.

- [ ] **Step 1: Write failing tests for all five type mappings, both languages, preset-origin replacement, and manual-value preservation.**
- [ ] **Step 2: Run `node --test tests/rent-check-size.test.cjs` and confirm the new assertions fail.**
- [ ] **Step 3: Add the fixed configuration table and state-aware controller methods, then replace duplicated button copy with three reusable preset slots.**
- [ ] **Step 4: Connect each Rent Check runtime to `setPropertyType` after query prefill and on property-type change.**
- [ ] **Step 5: Re-run `node --test tests/rent-check-size.test.cjs` and confirm it passes.**

### Task 2: KRW-first persistent currency and readable inputs

**Files:**
- Modify: `tests/currency-utils.test.cjs`
- Modify: `tests/currency-input.test.cjs`
- Create: `tests/currency-defaults.test.cjs`
- Modify: `currency-utils.js`
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `tools/brokerage-fee-calculator/app.js`
- Modify: `zh/tools/brokerage-fee-calculator/app.js`
- Modify: all 57 HTML files containing `#currencySelect` through a verified mechanical selection rewrite.

**Interfaces:**
- Produces: `parseInputAmount(value)`, `formatInputAmount(amount, currency, locale)`, `manwonLabel(amountWon, language)`, `readCurrencyPreference(storage)`, and `writeCurrencyPreference(storage, currency)`.
- Changes: `formatMoneyHtml` always renders KRW in `.money-primary` and an optional selected foreign reference in `.fx-secondary`.

- [ ] **Step 1: Write failing tests for grouped parsing/formatting, 만원 labels, persistent preference, KRW-primary output, and KRW-selected static pages.**
- [ ] **Step 2: Run the three focused currency tests and confirm the new assertions fail.**
- [ ] **Step 3: Implement the shared helpers and browser preference binding in `currency-utils.js`.**
- [ ] **Step 4: Update Rent Check and calculator input synchronization to parse grouped strings and render localized helpers.**
- [ ] **Step 5: Rewrite every static currency selector to select KRW and verify all 57 pages load the shared utility.**
- [ ] **Step 6: Re-run the focused currency tests and confirm they pass.**

### Task 3: One result action

**Files:**
- Modify: `tests/rent-check-feedback-response.test.cjs`
- Modify: `tests/rent-check-result-visuals.test.cjs`
- Modify: `rent-check-ui-utils.js`
- Modify: `zh/rent-check-ui-utils.js`
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `styles.css`

**Interfaces:**
- Changes: `resultNextStep(rating)` returns `{ heading, body, primary }` without `secondary`.

- [ ] **Step 1: Change contract tests to require one verdict-dependent action and no secondary action.**
- [ ] **Step 2: Run the focused result tests and confirm failure.**
- [ ] **Step 3: Remove secondary-action creation/rendering/tracking from the four runtimes while preserving `rent_check_next_action` for the primary action.**
- [ ] **Step 4: Re-run the focused result tests and confirm they pass.**

### Task 4: Core typography, color, and radius cleanup

**Files:**
- Create: `tests/design-token-consistency.test.cjs`
- Modify: `styles.css`
- Modify: `cold-start.css`

**Interfaces:**
- Produces: shared `--text-*`, leading, and tracking tokens in `:root`.
- Preserves: existing public classes and responsive breakpoints.

- [ ] **Step 1: Add failing CSS contract tests for the type tokens, result `h2` selector, minimum core evidence sizes, calculator palette, and touched radius tokens.**
- [ ] **Step 2: Run `node --test tests/design-token-consistency.test.cjs` and confirm failure.**
- [ ] **Step 3: Add tokens and update only the core Rent Check, Explorer, calculator, saved-home, and market selectors.**
- [ ] **Step 4: Re-run the CSS contract test and the existing UI tests.**

### Task 5: Full verification and release

**Files:**
- Verify all modified files.

**Interfaces:**
- Produces: one reviewed commit that fast-forwards GitHub `main` from the previously verified remote head.

- [ ] **Step 1: Run `node --test tests/*.test.cjs` and require zero failures.**
- [ ] **Step 2: Start the local server and verify English/Chinese Rent Check plus Explorer at desktop and mobile widths with no horizontal overflow or console errors.**
- [ ] **Step 3: Review `git diff --check`, the complete diff, and the exact changed-file list.**
- [ ] **Step 4: Re-fetch GitHub main; stop if it moved from the recorded base.**
- [ ] **Step 5: Commit and push the tested tree to GitHub main.**
- [ ] **Step 6: Wait for the matching Vercel production deployment and verify the deployed commit, English/Chinese presets, formatted amounts, single result CTA, Explorer, and console state.**
