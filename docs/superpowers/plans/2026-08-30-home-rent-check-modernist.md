# KoreaHomeGuide Home and Rent Check Modernist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the live English and Chinese home and Rent Check surfaces the approved Claude Modernist visual language without changing their data, form, API, SEO, or conversion behavior.

**Architecture:** Add one page-scoped stylesheet after the existing legacy stylesheets and load it from the four affected HTML documents. Reuse the already proven Explorer palette and geometry without importing Explorer-specific selectors or changing global root tokens.

**Tech Stack:** Static HTML, scoped CSS, Node test runner

**Spec:** `docs/product/signedprice-ui-development-direction.md` and the approved 2026-08-30 Claude Modernist handoff supplied by the user.

## Global Constraints

- Affected pages are exactly `/`, `/zh/`, `/tools/seoul-rent-check/`, and `/zh/tools/seoul-rent-check/`.
- Keep all existing element IDs, data attributes, scripts, canonical tags, hreflang tags, form order, API calls, analytics events, and calculation behavior unchanged.
- Do not modify `styles.css`, `cold-start.css`, Explorer CSS, JavaScript, or any API file.
- Use page-scoped tokens equivalent to ink `#201e1d`, ground `#f3f2f2`, surface `#eae9e9`, cobalt action `#1d4ed8`, and structural divider `#8c8a89`.
- Use square `0px` corners, structural `2px` borders, and flush-left content.
- Keep the current English and Chinese font fallback behavior; no network font dependency is added.
- All numeric values use tabular numerals.
- Preserve the existing form grid and mobile field order.
- Maintain visible focus, 44px minimum button/select targets, and reduced-motion behavior.
- No fake claims, new status semantics, new lead flow, or new marketplace capability.
- Existing Explorer Modernist contracts and the exact Phase 0 legacy failure baseline must not change.

---

### Task 1: Add the scoped Modernist presentation layer

**Files:**
- Create: `rent-check-modernist.css`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Create: `tests/rent-check-modernist-ui.test.cjs`

**Interfaces:**
- Produces one stylesheet loaded after `styles.css`, `cold-start.css`, and `experience-capture.css` on all four pages.
- Consumes the existing `.core-ui`, home, tool, form, result, and header classes without changing DOM contracts.

- [ ] Write failing tests for four-page stylesheet loading order and scoped Modernist contracts.
- [ ] Run the focused test and confirm it fails because the stylesheet does not exist or load.
- [ ] Implement the page-scoped tokens and presentation rules.
- [ ] Link the stylesheet from all four pages with the same cache-busting version.
- [ ] Verify that no rule resets the established form grid areas or mobile order.
- [ ] Run focused home, Rent Check, design-token, accessibility, and Explorer Modernist tests.
- [ ] Run the exact Phase 0 baseline gate and `git diff --check`.
- [ ] Commit the task.

### Task 2: Browser verification and independent review

**Files:**
- Modify only if browser or review evidence reveals a defect within Task 1 scope.

- [ ] Verify desktop home, desktop standalone Rent Check, and mobile standalone Rent Check in Chromium.
- [ ] Confirm no horizontal overflow, aligned form controls, 44px targets, visible focus, and readable result/evidence regions.
- [ ] Run an independent review for accessibility, DOM/SEO preservation, and CSS leakage.
- [ ] Resolve all Critical and Important findings and repeat focused verification.
- [ ] Create a GitHub Preview candidate; do not merge or deploy Production until its checks are green.
