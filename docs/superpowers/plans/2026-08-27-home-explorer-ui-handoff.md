# Home and Explorer UI Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compress the homepage Rent Check funnel and make Explorer quote CTAs preserve the selected district and housing type through navigation and analytics.

**Architecture:** Extend the existing `acquisition-links.js` boundary with one scoped Explorer-link updater and make click tracking read the final link context at click time. EN and ZH Explorer runtimes call that shared updater; HTML supplies stable data hooks, while visual density stays in the existing shared and cold-start stylesheets.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js `node:test`

**Spec:** `docs/superpowers/specs/2026-08-27-home-explorer-ui-handoff-design.md`

## Global Constraints

- Baseline commit is `c77c7e658474c892937e1dc1bdd3b1e852908a49`.
- Preserve existing public URLs, Rent Check DOM IDs, API endpoints, analytics event names and fields, SEO behavior, and the 11-function deployment budget.
- Ship English and Simplified Chinese parity.
- Explorer budget limits must never be copied into Rent Check quote fields.
- Do not deploy to `main` until branch verification and review are complete.

---

### Task 1: Shared Dynamic Explorer Handoff

**Files:**
- Modify: `tests/acquisition-links.test.cjs`
- Modify: `acquisition-links.js`

**Interfaces:**
- Consumes: existing `buildRentCheckUrl()` and `buildRentCheckCtaEvent()`.
- Produces: `updateRentCheckLinksForSelection({ doc, location, lawdCd, propertyType }) -> number`.

- [ ] **Step 1: Write the failing navigation test**

Add a test with two fake anchors selected by `[data-explorer-rent-check]`. Call:

```js
updateRentCheckLinksForSelection({
  doc,
  location:{ pathname:'/explore/', search:'?utm_source=google' },
  lawdCd:'11680',
  propertyType:'officetel'
});
```

Assert both links equal `/tools/seoul-rent-check/?lawdCd=11680&type=officetel&from=%2Fexplore%2F&origin_source=google` and that unsupported selections produce a source-only URL.

- [ ] **Step 2: Run the test to verify RED**

Run:

```powershell
& $node --test tests/acquisition-links.test.cjs
```

Expected: FAIL because `updateRentCheckLinksForSelection` is not exported.

- [ ] **Step 3: Implement the scoped updater**

In `acquisition-links.js`, query only `[data-explorer-rent-check]`, preserve each localized Rent Check base path, and rebuild its URL with the current bounded page, district, property type, and campaign search. Return the number of updated links and export the function.

- [ ] **Step 4: Write the failing click-time attribution test**

Wire an Explorer anchor, change its `href` after wiring to include `lawdCd=11440&type=villa`, invoke the captured click handler, and assert the event contains:

```js
{
  source_page:'/explore/',
  district_code:'11440',
  property_type:'villa'
}
```

- [ ] **Step 5: Run the test to verify RED**

Expected: FAIL because the current handler captures empty selection values at page load.

- [ ] **Step 6: Make click tracking read the current link**

At click time, parse the anchor's current `href`, validate `lawdCd` and `type`, build the event, and call the existing non-blocking tracker. Preserve the market-page fallback values.

- [ ] **Step 7: Run the targeted tests to verify GREEN**

Run:

```powershell
& $node --test tests/acquisition-links.test.cjs tests/acquisition-context.test.cjs tests/rent-check-prefill.test.cjs
```

Expected: all pass.

- [ ] **Step 8: Commit**

```powershell
git add acquisition-links.js tests/acquisition-links.test.cjs
git commit -m "feat: preserve Explorer context in Rent Check handoff"
```

### Task 2: EN/ZH Explorer Integration and CTA UI

**Files:**
- Create: `tests/explorer-rent-check-handoff.test.cjs`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `KHGAcquisitionLinks.updateRentCheckLinksForSelection()` from Task 1.
- Produces: `[data-explorer-rent-check]` CTA hooks and `updateRentCheckHandoff()` in both locale runtimes.

- [ ] **Step 1: Write the failing page-integration test**

For both locale pages, assert the search card contains a localized `[data-explorer-rent-check]` link and all quote CTAs carry that hook. For both runtimes, assert selection changes and initial query application call `updateRentCheckHandoff()`.

- [ ] **Step 2: Run the test to verify RED**

Run:

```powershell
& $node --test tests/explorer-rent-check-handoff.test.cjs
```

Expected: FAIL because the hooks and runtime updater do not exist.

- [ ] **Step 3: Add the localized handoff UI**

Inside each `.explorer-search-card`, add a full-width `.explorer-search-handoff` row with these actions:

```html
<a data-explorer-rent-check data-rent-check-cta="explorer_filter_handoff" href="/tools/seoul-rent-check/">Check this area and housing type →</a>
```

Use the localized `/zh/tools/seoul-rent-check/` path and Chinese copy on the Chinese page. Add the same data hook and distinct bounded CTA IDs to the context-rail and final Explorer CTAs.

- [ ] **Step 4: Wire selection changes**

In each runtime, implement `updateRentCheckHandoff()` using the current area and property selectors. Call it after query selection, before/after result loading, and from `change` listeners on both selectors.

- [ ] **Step 5: Style the handoff row**

Add a quiet full-width row with a short explanatory sentence and blue text action. Stack it cleanly below 620px and preserve a 44px minimum tap target.

- [ ] **Step 6: Run the targeted tests to verify GREEN**

Run:

```powershell
& $node --test tests/explorer-rent-check-handoff.test.cjs tests/explorer-pages.test.cjs tests/find-home-flow.test.cjs tests/acquisition-links.test.cjs
```

Expected: all pass.

- [ ] **Step 7: Commit**

```powershell
git add explore/index.html zh/explore/index.html explore/app.js zh/explore/app.js styles.css tests/explorer-rent-check-handoff.test.cjs
git commit -m "feat: surface contextual Rent Check from Explorer"
```

### Task 3: Compact Homepage Entry Flow

**Files:**
- Create: `tests/home-entry-density.test.cjs`
- Modify: `cold-start.css`

**Interfaces:**
- Consumes: existing `.funnel-hero`, `.funnel-trust`, `.funnel-section`, and mobile media-query classes.
- Produces: a shorter first-screen path to `#rent-check` with unchanged HTML and behavior.

- [ ] **Step 1: Write the failing density-contract test**

Parse the authored cold-start rules and assert desktop hero top padding is at most 60px, the trust strip bottom margin is at most 20px, and the mobile hero top padding is at most 40px. The production regression caught is restoring enough vertical padding to push Rent Check out of the first desktop viewport.

- [ ] **Step 2: Run the test to verify RED**

Run:

```powershell
& $node --test tests/home-entry-density.test.cjs
```

Expected: FAIL against the current 84px desktop and 52px mobile hero top padding.

- [ ] **Step 3: Apply the minimal spacing change**

Reduce hero, trust, and first Rent Check section spacing without changing copy, hierarchy, CTA count, form IDs, or lead order. Keep the desktop H1 visually dominant and preserve readable mobile line length.

- [ ] **Step 4: Run UI regression tests to verify GREEN**

Run:

```powershell
& $node --test tests/home-entry-density.test.cjs tests/v10-7-home-ui.test.cjs tests/cold-start-home-funnel.test.cjs tests/home-positioning.test.cjs tests/header-alignment.test.cjs
```

Expected: all pass.

- [ ] **Step 5: Commit**

```powershell
git add cold-start.css tests/home-entry-density.test.cjs
git commit -m "style: shorten homepage path to Rent Check"
```

### Task 4: Full Verification and Review Handoff

**Files:**
- Verify only; no production files unless a failing regression requires its own RED/GREEN cycle.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: test, desktop/mobile browser, and branch-diff evidence.

- [ ] **Step 1: Run all repository tests**

Run `node --test` with the bundled Node executable. Expected: no new failures; only the two recorded Windows `find` portability failures may remain.

- [ ] **Step 2: Serve the branch locally**

Start a local static server with the bundled runtime and open the homepage and Explorer in the in-app browser.

- [ ] **Step 3: Verify desktop and mobile**

Check home and Explore at 1280×720 and 390×844. Confirm no horizontal overflow, visible focus states, readable controls, and a shorter path to Rent Check.

- [ ] **Step 4: Verify the complete handoff**

Select Gangnam-gu + Officetel, click each Explorer quote CTA, and confirm the Rent Check page selects Gangnam-gu + Officetel. Repeat one Chinese flow and one changed selection.

- [ ] **Step 5: Review branch state**

Run status, diff summary, and the three most recent commits. Confirm no unrelated files changed and no secrets or generated artifacts are staged.

- [ ] **Step 6: Prepare review handoff**

Report the branch name, exact verification results, pre-existing test caveat, and whether the branch is ready to push/PR. Do not merge or deploy without explicit user direction.
