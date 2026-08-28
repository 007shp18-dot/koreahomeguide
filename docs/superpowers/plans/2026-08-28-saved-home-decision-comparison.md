# Saved-home Decision Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve privacy versions as literal Sheet text and turn saved homes into a localized, private shortlist with notes, visit/candidate state, and a non-scoring contract checklist.

**Architecture:** Keep the current browser storage key and normalize missing decision fields to safe defaults, so old quotes migrate on read. Add one store update boundary and pure checklist progress helper, then render one compact editor per card and four honest comparison rows. Replace submission-row `appendRow` with a text-formatted range write while keeping header appends and deduplication unchanged.

**Tech Stack:** Browser JavaScript, static HTML/CSS, Node.js `node:test`, Google Apps Script.

**Spec:** `docs/superpowers/specs/2026-08-28-saved-home-decision-comparison-design.md`

## Global Constraints

- Keep `khg_saved_rent_quotes_v1`, the eight-quote cap, and 90-day retention.
- Do not send note text, checklist values, home IDs, quote amounts, district, or candidate state to analytics.
- Do not create an account, server sync, public review, address, landlord, or broker field.
- Present checklist progress only; never present legal verification or a risk score.
- Preserve the session-storage Rent Check recheck handoff and existing URL privacy.
- Preserve Leads upsert, Experiences isolation/deduplication, and formula neutralization.

---

### Task 1: Preserve privacy notice versions as Sheet text

**Files:**
- Modify: `tests/google-sheet-webhook-behavior.test.cjs`
- Modify: `ops/google-apps-script/lead-webhook.gs`

**Interfaces:**
- Consumes: `COLUMNS`, `EXPERIENCE_COLUMNS`, and `sanitizeCell_(value)`.
- Produces: `appendSubmissionRow_(sheet, columns, row)` used by Leads and Experiences.

- [ ] **Step 1: Make the Sheet fake reproduce date coercion**

Track per-cell number formats in `FakeSheet`. Coerce an unformatted `YYYY-MM-DD` string to a numeric serial in `appendRow`/`setValues`, while preserving it when the cell format is `@`.

- [ ] **Step 2: Add the failing behavior test**

```js
test('privacy notice versions stay literal text in both submission sheets', () => {
  // Store one lead and one experience report with 2026-08-28.
  assert.equal(leads.rows[1][COLUMNS privacy index], '2026-08-28');
  assert.equal(experiences.rows[1][EXPERIENCE_COLUMNS privacy index], '2026-08-28');
});
```

- [ ] **Step 3: Run RED**

Run: `node --test tests/google-sheet-webhook-behavior.test.cjs`

Expected: the versions are numeric because submission rows still use `appendRow` without plain-text formatting.

- [ ] **Step 4: Implement the formatted row writer**

Create the next-row range, call `setNumberFormat('@')` on the `privacy_notice_version` cell, then call `setValues([columns.map(key => sanitizeCell_(row[key]))])`. Use it for new Leads and Experiences rows.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/google-sheet-webhook-behavior.test.cjs tests/google-sheet-webhook.test.cjs`

Expected: all Apps Script tests pass.

### Task 2: Add migration-safe saved-home decision state

**Files:**
- Modify: `tests/saved-rent-quotes.test.cjs`
- Modify: `saved-rent-quotes.js`

**Interfaces:**
- Produces: `CHECKLIST_KEYS`, `cleanNote(value)`, `checklistProgress(quote)`, and `store.updateDecisionDetails(id, details)`.
- Quote fields: `note:string`, `isVisited:boolean`, `isContractCandidate:boolean`, `checklist:Record<string,boolean>`.

- [ ] **Step 1: Add failing normalization and update tests**

Assert old quotes default to empty/false/0-of-4, invalid checklist keys are dropped, notes are sanitized/capped, decision updates preserve price/label fields, and re-saving/rechecking preserves decision state.

- [ ] **Step 2: Add the failing sort test**

Assert a contract candidate sorts before a favorite, then retain the existing favorite/cost order for the remaining homes.

- [ ] **Step 3: Run RED**

Run: `node --test tests/saved-rent-quotes.test.cjs`

Expected: new fields/functions are missing.

- [ ] **Step 4: Implement minimal state and store behavior**

Normalize the four fields, freeze the checklist, preserve private fields on duplicate/recheck save, update them through one dedicated method, and add contract-candidate priority to `sortForComparison`.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/saved-rent-quotes.test.cjs`

Expected: all saved-quote model tests pass.

### Task 3: Render localized decision editing and comparison

**Files:**
- Modify: `tests/saved-homes-pages.test.cjs`
- Modify: `saved-homes-page.js`
- Modify: `saved-homes/index.html`
- Modify: `zh/saved-homes/index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `updateDecisionDetails`, `checklistProgress`, `CHECKLIST_KEYS`.
- Produces: accessible `.saved-home-decision-editor` UI and localized comparison rows.

- [ ] **Step 1: Add failing page-contract tests**

Require the localized editor, private note cap, visited and candidate controls, four checklist controls, `n/4 checked` comparison output, non-risk-score disclosure, 44px targets, and the existing recheck URL/session-storage contract.

- [ ] **Step 2: Run RED**

Run: `node --test tests/saved-homes-pages.test.cjs tests/accessibility-ui-contract.test.cjs`

Expected: new decision UI and copy are absent.

- [ ] **Step 3: Implement the card editor**

Create a collapsed `<details>` editor with a 240-character textarea, visited/candidate checkboxes, a four-item fieldset, and a save button. Save through `updateDecisionDetails` and emit only `saved_quote_decision_updated` with the existing bounded analytics parameters.

- [ ] **Step 4: Extend comparison and page copy**

Add private note, visit status, contract candidate, and checklist progress rows. Mark candidate cards visually and state in both locales that checklist completion is not legal verification or a risk score. Clarify the existing recheck action without changing its privacy behavior.

- [ ] **Step 5: Add responsive styles**

Keep card layout compact, preserve readable label wrapping, and give all new interactive controls a minimum 44px target.

- [ ] **Step 6: Run GREEN**

Run: `node --test tests/saved-rent-quotes.test.cjs tests/saved-homes-pages.test.cjs tests/accessibility-ui-contract.test.cjs tests/core-ui-consistency.test.cjs`

Expected: all focused saved-home/UI tests pass.

### Task 4: Full verification and release

**Files:**
- Verify all modified files.

**Interfaces:**
- Produces: one verified commit suitable for main and production deployment.

- [ ] **Step 1: Syntax checks**

Run: `node --check saved-rent-quotes.js && node --check saved-homes-page.js`

- [ ] **Step 2: Full automated suite**

Run: `node --test`

- [ ] **Step 3: Review the diff and privacy constraints**

Run: `git diff --check && git diff --stat && git status --short`

Confirm no note/checklist fields enter URLs, requests, or analytics.

- [ ] **Step 4: Browser verification**

Verify English and Chinese saved-home pages with seeded legacy/new quotes on desktop and approximately 390px mobile widths. Exercise save, reload, compare, recheck, and keyboard focus.

- [ ] **Step 5: Commit and integrate**

Commit the verified feature branch, fast-forward main, push, deploy production, and confirm the production SHA and both localized pages.

