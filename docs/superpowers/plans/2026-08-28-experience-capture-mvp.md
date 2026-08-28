# Experience Capture MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Privately collect a short, structured rental experience after Rent Check on all English and Chinese surfaces.

**Architecture:** Reuse `POST /api/lead`, but route `experience_report` through an isolated normalizer and a separate Apps Script sheet. A shared progressive-enhancement module renders the localized teaser and form from the existing result event; it never publishes individual or aggregate reports.

**Tech Stack:** Static HTML/CSS/JavaScript, CommonJS Vercel Functions, Google Apps Script, Node test runner, GA4.

**Spec:** `docs/superpowers/specs/2026-08-28-experience-capture-design.md`

## Global Constraints

- Preserve existing Rent Check APIs, DOM IDs, URLs, saved-home behavior, lead capture, SEO metadata, and GA4 events.
- Support English and Simplified Chinese on home and standalone Rent Check surfaces.
- Do not collect names, emails, addresses, buildings, agencies, landlords, free text, or raw IP addresses.
- Do not publish aggregates or individual reports in this release.
- Compute brokerage ceilings only on the server and leave officetel ceilings undetermined.
- Use test-first development and run all repository tests before release.

---

### Task 1: Experience report domain contract

**Files:**
- Create: `lib/experience-report.cjs`
- Create: `tests/experience-report.test.cjs`

**Interfaces:**
- Consumes: `isRentCheckAreaCode()`, `isSupportedPropertyType()`, `calculateBrokerageFee()`.
- Produces: `normalizeExperiencePayload(body, now)` returning `{ ok:true, value }` or `{ ok:false, error }`.

- [ ] **Step 1: Write failing domain tests**

Cover a valid housing report, optional blank fee, invalid outcome, invalid report ID, unsupported district/type, negative money, officetel `cap_status=undetermined`, server-calculated housing ceiling, and bounded attribution.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test tests/experience-report.test.cjs`

Expected: FAIL because `lib/experience-report.cjs` does not exist.

- [ ] **Step 3: Implement the normalizer**

Use the exact outcomes from the design. Map all non-officetel supported housing types to `propertyType:'housing'`; for `officetel`, return `legal_cap_won:null`, `fee_above_cap:null`, and `cap_status:'undetermined'`. Store `brokerage_rule_version:'seoul-2026-08-28'` and never accept `legalCapWon` from the request.

- [ ] **Step 4: Verify green**

Run: `node --test tests/experience-report.test.cjs`

- [ ] **Step 5: Commit the domain contract**

Commit message: `Add experience report validation`

### Task 2: API routing and isolated Sheet storage

**Files:**
- Modify: `api/lead.js`
- Modify: `ops/google-apps-script/lead-webhook.gs`
- Modify: `tests/lead-api.test.cjs`
- Modify: `tests/google-sheet-webhook.test.cjs`
- Modify: `tests/google-sheet-webhook-behavior.test.cjs`

**Interfaces:**
- Consumes: `normalizeExperiencePayload()` from Task 1 and the existing `storeLead(row)` transport.
- Produces: `201 { ok:true }` for a valid experience report and an Apps Script `Experiences` row deduplicated by `report_id`.

- [ ] **Step 1: Write failing API and Apps Script tests**

Assert that experience reports require no email, invalid reports never reach storage, logs contain no report values, experience rows use `Experiences`, duplicate report IDs do not append, and lead behavior remains unchanged.

- [ ] **Step 2: Verify red**

Run: `node --test tests/lead-api.test.cjs tests/google-sheet-webhook*.test.cjs`

- [ ] **Step 3: Route and store reports**

Select the normalizer by `body.kind`. Add a fixed `EXPERIENCE_COLUMNS` schema and `appendExperienceRow_()` in Apps Script, route `experience_report` to `Experiences`, and leave the existing `Leads` upsert and notification functions untouched.

- [ ] **Step 4: Verify green**

Run: `node --test tests/lead-api.test.cjs tests/google-sheet-webhook*.test.cjs`

- [ ] **Step 5: Commit backend storage**

Commit message: `Store structured rental experiences`

### Task 3: Progressive experience form

**Files:**
- Create: `experience-capture.js`
- Create: `experience-capture.css`
- Create: `tests/experience-capture.test.cjs`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`

**Interfaces:**
- Consumes: `khg:rent-check-result` event detail and `POST /api/lead`.
- Produces: localized prompt/form/success/error UI and the three bounded GA4 events.

- [ ] **Step 1: Write failing frontend tests**

Assert four-page asset loading, localized no-identifier copy, exact outcome values, fee-excluding-VAT guidance, report ID/fingerprint persistence, no unsafe analytics fields, and server payload context.

- [ ] **Step 2: Verify red**

Run: `node --test tests/experience-capture.test.cjs`

- [ ] **Step 3: Implement the shared module and styles**

Mount after `[data-saved-quote-mount]`, prefill selects from `#rentCheckArea` and `#rentCheckType`, submit the latest result context, format KRW input, disable while sending, replace the form on success, and keep Rent Check functional on every failure.

- [ ] **Step 4: Verify green and accessibility**

Run: `node --test tests/experience-capture.test.cjs tests/accessibility-ui-contract.test.cjs`

- [ ] **Step 5: Commit frontend capture**

Commit message: `Add localized experience capture flow`

### Task 4: Operations and privacy handoff

**Files:**
- Modify: `docs/operations/google-sheet-lead-capture.md`
- Modify: `docs/operations/lead-rate-limit.md`
- Modify: `privacy/index.html`
- Modify: `zh/privacy/index.html`
- Modify: `tests/google-sheet-webhook.test.cjs`
- Modify: `tests/privacy-pages.test.cjs`

**Interfaces:**
- Produces: exact Apps Script redeployment steps, `Experiences` schema documentation, Production Firewall verification, and localized disclosure of structured self-reported data.

- [ ] **Step 1: Write failing documentation/privacy contract tests**

Require the new sheet name, no raw IP forwarding, redeployment warning, report fields/purpose/retention, and English/Chinese deletion contact.

- [ ] **Step 2: Verify red**

Run: `node --test tests/google-sheet-webhook.test.cjs tests/privacy-pages.test.cjs`

- [ ] **Step 3: Update operations and privacy content**

Document that Git deployment does not redeploy Apps Script, the live script must be updated manually, and the existing `/api/lead` Firewall rule covers experience reports.

- [ ] **Step 4: Verify green**

Run: `node --test tests/google-sheet-webhook.test.cjs tests/privacy-pages.test.cjs`

- [ ] **Step 5: Commit the handoff**

Commit message: `Document experience data handling`

### Task 5: Release verification and deployment

**Files:**
- Verify all modified files; no new product scope.

- [ ] **Step 1: Run the complete test suite**

Run: `node --test tests/*.test.cjs`

Expected: zero failures.

- [ ] **Step 2: Inspect the exact release diff**

Run: `git diff --check origin/main` and review `git diff --stat origin/main` plus all changed files.

- [ ] **Step 3: Commit the final integrated tree**

Commit message: `Launch private rental experience capture`

- [ ] **Step 4: Update GitHub main without force**

Create a commit whose parent is the freshly verified GitHub main and update `refs/heads/main` with `force:false`.

- [ ] **Step 5: Verify Vercel and production**

Wait for a Production deployment whose Git SHA matches GitHub main and state is `READY`. On all four Rent Check surfaces, verify prompt appearance after a result, form open/close behavior, localized labels, mutually exclusive outcomes, success/error handling without sending a real production report, and no console regression. Confirm the Apps Script manual redeployment requirement separately rather than claiming Sheet writes are live before it is done.
