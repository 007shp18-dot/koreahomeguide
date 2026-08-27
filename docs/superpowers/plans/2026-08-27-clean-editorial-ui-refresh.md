# Clean Editorial UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply one calm editorial UI system to Home, Rent Check, and Explorer without changing product behavior or burying the Rent Check form.

**Architecture:** Extend the existing white-first CSS system rather than adding a framework or replacing markup wholesale. Add only semantic homepage sections, then use shared tokens and page-scoped rules to align headers, surfaces, actions, typography, and responsive spacing across the three product entry points.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js `node:test`

**Spec:** `docs/superpowers/specs/2026-08-27-clean-editorial-ui-refresh-design.md`

## Global Constraints

- Preserve the current blue `#2563eb` primary identity, public URLs, DOM IDs, analytics hooks, API behavior, and 11-function Vercel budget.
- Keep Rent Check immediately usable near the top of the homepage.
- Ship English and Simplified Chinese parity.
- Do not copy reference-site text, images, code, or exact layout.
- Do not alter Rent Check calculations, Explorer data, map behavior, lead capture, or SEO eligibility.

---

### Task 1: Shared Editorial Design Contract

**Files:**
- Create: `tests/clean-editorial-ui.test.cjs`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing `.core-ui`, `.site-header`, `.compact-header`, `.search-button`, `.rent-check-card`, `.tool-card`, `.explorer-search-card`, `.explorer-map-card`, and `.context-module` selectors.
- Produces: shared `--radius-card`, `--radius-action`, `--section-space`, and `--section-space-mobile` tokens plus consistent core surface rules.

- [ ] **Step 1: Write the failing shared-system test**

Assert that `styles.css` defines the four approved tokens, caps `.core-ui` product hero headings at 56px, applies 16px card radii to the three primary product surfaces, keeps action radii at 11px, and removes large shadows from core cards.

- [ ] **Step 2: Run the test to verify RED**

Run `node --test tests/clean-editorial-ui.test.cjs`.

Expected: FAIL because the editorial tokens and unified selectors do not exist.

- [ ] **Step 3: Implement the shared system**

Add the tokens to `:root`; compact the two core headers; unify primary product surface borders/radii; constrain Home, Rent Check, and Explorer hero typography; normalize button radii and focus states; and add mobile overrides at 760px without modifying layout behavior.

- [ ] **Step 4: Run the targeted UI tests to verify GREEN**

Run `node --test tests/clean-editorial-ui.test.cjs tests/core-ui-consistency.test.cjs tests/v10-7-ui-system.test.cjs tests/header-alignment.test.cjs tests/rent-check-layout.test.cjs`.

Expected: all pass.

### Task 2: Homepage Editorial Bands and Content Module

**Files:**
- Modify: `tests/clean-editorial-ui.test.cjs`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `cold-start.css`

**Interfaces:**
- Consumes: shared editorial tokens from Task 1 and the existing homepage Rent Check markup and IDs.
- Produces: `.funnel-how`, `.funnel-proof-band`, `.funnel-proof-grid`, `.funnel-updated-guides`, and `.funnel-final-cta` presentation hooks in both locales.

- [ ] **Step 1: Write the failing homepage-structure test**

For both locale homepages, assert one three-step section with exactly three items, one evidence/map proof band linking to localized Explorer, one recently updated guide module with three real guide links, and one final CTA linking back to `#rent-check`. Assert the Rent Check section still occurs before all new sections.

- [ ] **Step 2: Run the test to verify RED**

Run `node --test tests/clean-editorial-ui.test.cjs`.

Expected: FAIL because the new semantic sections are absent.

- [ ] **Step 3: Add localized semantic sections**

Preserve the current hero, trust strip, Rent Check form, IDs, and scripts. Replace the two undifferentiated lower homepage sections with: a localized three-step explanation; a dark evidence-led Explorer band; a recently updated guide grid using existing guide URLs; and a restrained final anchor CTA to `#rent-check`.

- [ ] **Step 4: Style the editorial bands**

Use shared section spacing, flat 16px cards, alternating white/soft backgrounds, one navy proof band, strong contrast, 24px card padding, restrained hover lift, and one-column mobile stacking. Cap the homepage H1 at 56px desktop and 44px mobile.

- [ ] **Step 5: Run localized homepage tests to verify GREEN**

Run `node --test tests/clean-editorial-ui.test.cjs tests/v10-7-home-ui.test.cjs tests/cold-start-home-funnel.test.cjs tests/home-positioning.test.cjs tests/home-entry-density.test.cjs tests/zh-locale.test.cjs`.

Expected: all pass.

### Task 3: Product Surface Alignment

**Files:**
- Modify: `tests/clean-editorial-ui.test.cjs`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing Rent Check and Explorer HTML classes and shared tokens from Task 1.
- Produces: page-scoped visual alignment for `.tool-product-layout`, `.tool-card`, `.explorer-page`, `.explorer-search-card`, `.explorer-map-card`, `.explorer-metrics`, and `.context-card`.

- [ ] **Step 1: Write the failing product-alignment test**

Assert that Rent Check and Explorer share the same card radius token, section-spacing token, neutral border, shadow-free primary surface, and mobile page gutters. Assert the Explorer map and decision card retain their existing selectors.

- [ ] **Step 2: Run the test to verify RED**

Run `node --test tests/clean-editorial-ui.test.cjs`.

Expected: FAIL until the new page-scoped alignment block exists.

- [ ] **Step 3: Apply scoped alignment rules**

Shorten product hero spacing, align tool/explorer surface padding and radii, make evidence modules visually distinct with soft backgrounds, normalize context-card hover/focus behavior, and preserve the existing Explorer grid and mobile map order.

- [ ] **Step 4: Run product regression tests to verify GREEN**

Run `node --test tests/clean-editorial-ui.test.cjs tests/explorer-pages.test.cjs tests/explorer-map-layout.test.cjs tests/explorer-rent-check-handoff.test.cjs tests/rent-check-layout.test.cjs tests/rent-check-result-visuals.test.cjs tests/core-ui-consistency.test.cjs`.

Expected: all pass.

### Task 4: Full Verification and Release Handoff

**Files:**
- Verify only; production changes require a new RED/GREEN cycle.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: fresh full-suite, build, repository-state, and deployment evidence.

- [ ] **Step 1: Run the full repository test suite**

Run `node --test` and record the exact pass/fail counts.

- [ ] **Step 2: Run the production build or repository deployment check**

Use the repository's existing build/deployment validation path without changing hosting providers or environment configuration.

- [ ] **Step 3: Review changed files and secrets**

Run repository status, diff summary, and staged-secret checks. Confirm only the approved UI, localized markup, tests, spec, and plan changed.

- [ ] **Step 4: Integrate through the existing main/deployment flow**

Commit the verified change, update `main` through the repository's established workflow, and confirm the resulting deployment status if credentials and network access are available.
