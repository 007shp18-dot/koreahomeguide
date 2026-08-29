# KoreaHomeGuide Rent Decision UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved control, Result Card, Explorer toolbar and flicker-free Street-View-first building drawer polish in English and Simplified Chinese.

**Architecture:** Preserve the existing static HTML and vanilla JavaScript architecture. Add one explicit building-window opening state, make Panorama reset synchronous through an event before the drawer is revealed, group existing result evidence inside a native disclosure, and finish the visual hierarchy with shared CSS overrides rather than duplicating runtime logic.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js `node:test`, Vercel Functions.

**Spec:** `docs/superpowers/specs/2026-08-29-rent-decision-ui-polish-design.md`

## Global Constraints

- Preserve all existing public element IDs and API query shapes.
- Preserve KRW-first financial values and privacy-safe sharing.
- English and Simplified Chinese must expose the same hierarchy and interactions.
- No framework or dependency changes.
- Every behavior change follows RED, GREEN, refactor.

---

### Task 1: Stage the building drawer before reveal

**Files:**
- Modify: `tests/explorer-building-window.test.cjs`
- Modify: `explore/building-window.js`
- Modify: `explore/panorama.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `khg:building-window-open`, `khg:map-select-building`
- Produces: `khg:building-window-reset`, `data-state="preparing|loading|ready|error"`

- [ ] **Step 1: Write the failing regression test**

```js
test('building drawer prepares a stable loading frame before reveal', () => {
  const source = fs.readFileSync('explore/building-window.js', 'utf8');
  const openBody = source.match(/async function open\(selection, source\) \{([\s\S]*?)\n    \}/)[1];
  assert.ok(openBody.indexOf("dataset.state = 'preparing'") < openBody.indexOf('overlay.hidden = false'));
  assert.ok(openBody.indexOf('khg:building-window-reset') < openBody.indexOf('overlay.hidden = false'));
  assert.ok(openBody.indexOf('building-window-loading') < openBody.indexOf('overlay.hidden = false'));
});
```

- [ ] **Step 2: Run `node --test tests/explorer-building-window.test.cjs` and confirm it fails because the opening state is absent.**
- [ ] **Step 3: Prepare title, metadata, empty profile, final-size loading skeleton and links while hidden; synchronously reset Panorama; then reveal and publish the open state.**
- [ ] **Step 4: Set `ready` only for the current request and `error` only for the current request. Keep the outer drawer dimensions stable for every state.**
- [ ] **Step 5: Run the focused test and Panorama tests until green.**

### Task 2: Unify filter controls and form alignment

**Files:**
- Modify: `tests/trust-home-redesign.test.cjs`
- Modify: `tests/map-first-product-refresh.test.cjs`
- Modify: `styles.css`
- Modify: `cold-start.css`

**Interfaces:**
- Consumes: `.selection-native`, `.district-combobox-input`, `.rent-check-form`, `.rent-size-controls`
- Produces: one 52px primary-control geometry and an aligned two-row desktop form

- [ ] **Step 1: Add failing CSS-contract tests for the shared control selector, 52px height, consistent chevron, and explicit desktop Rent Check grid areas.**
- [ ] **Step 2: Run the two focused test files and confirm the new contracts fail.**
- [ ] **Step 3: Add final shared control styles, remove competing native-select geometry, and place area/type/size above deposit/rent/action without changing DOM order.**
- [ ] **Step 4: Keep presets compact below Size and stack cleanly below 760px.**
- [ ] **Step 5: Run the focused tests until green.**

### Task 3: Compress the Result Card into one decision surface

**Files:**
- Modify: `tests/rent-check-ui-utils.test.cjs`
- Modify: `tests/trust-home-redesign.test.cjs`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing verdict, distribution, evidence table and next-step nodes
- Produces: `.rent-check-primary-decision` and `.rent-check-evidence-disclosure`

- [ ] **Step 1: Add failing tests requiring the primary decision before evidence and one localized native disclosure around distribution, confidence and contracts.**
- [ ] **Step 2: Run focused Result tests and confirm they fail on the current always-expanded evidence.**
- [ ] **Step 3: Add the disclosure to all four static surfaces and make each runtime progressively create it for backwards-compatible cached HTML.**
- [ ] **Step 4: Move only evidence intelligence and the signed-contract table into the disclosure; keep verdict, annual impact, quote/median and next action visible.**
- [ ] **Step 5: Apply the flat ruled visual hierarchy and subordinate save/share/experience modules.**
- [ ] **Step 6: Run EN, ZH and mobile Result tests until green.**

### Task 4: Merge Explorer controls into one map toolbar

**Files:**
- Modify: `tests/map-first-product-refresh.test.cjs`
- Modify: `explore/index.html`
- Modify: `zh/explore/index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing toolbar and legend IDs/classes
- Produces: `.explorer-map-commandbar` wrapping title, actions and legend

- [ ] **Step 1: Add failing tests requiring one command bar and forbidding a separately positioned legend in the final CSS layer.**
- [ ] **Step 2: Run the Explorer test and confirm it fails on the two floating boxes.**
- [ ] **Step 3: Wrap the existing toolbar content and legend in one command bar in both locales without changing interactive IDs.**
- [ ] **Step 4: Style one glass surface that clears the discovery rail and wraps on mobile without covering map controls.**
- [ ] **Step 5: Run Explorer, locale and mobile tests until green.**

### Task 5: Verify and release

**Files:**
- Modify only source required by verification failures

**Interfaces:**
- Consumes: the completed UI slice
- Produces: verified production deployment

- [ ] **Step 1: Run `node --test tests/*.test.cjs`.**
- [ ] **Step 2: Run `node --check` for every changed JavaScript file and `git diff --check`.**
- [ ] **Step 3: Review the complete diff for untranslated copy, stale visual overrides and accidental uploaded artifacts.**
- [ ] **Step 4: Use the required code-review and verification skills; fix any important findings with a fresh failing regression test.**
- [ ] **Step 5: Commit, push the verified branch to `main` only if the remote parent is unchanged, wait for Vercel Production readiness, and verify live Rent Check and Explorer responses.**
