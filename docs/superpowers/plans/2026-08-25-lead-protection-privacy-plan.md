# Lead Protection, Privacy, and Form Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop lead spam and duplicate rows, disclose email processing, gate GA4 behind consent, and repair the email/help form layout shown in the 2026-08-25 production screenshot.

**Architecture:** Vercel Firewall handles IP-rate limiting, while the existing serverless endpoint keeps validation and forwards normalized records to a lock-protected Google Apps Script writer. Privacy/analytics behavior is implemented in one shared browser module, and the four lead forms share explicit grid layout rules that honor the `hidden` attribute.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js `node:test`, Vercel Functions and Firewall, Google Apps Script, Google Sheets, GA4.

**Spec:** `docs/superpowers/specs/2026-08-25-lead-privacy-localization-map-design.md`

## Global Constraints

- Operator name is `KoreaHomeGuide`; contact and deletion email is `hello@koreahomeguide.com`.
- Lead retention is 12 months.
- `POST /api/lead` is limited to 10 requests per client IP per rolling hour at the firewall layer.
- Duplicate status is not disclosed to the browser; new and repeated valid requests receive the same public success shape.
- Client IP addresses are not written to the lead sheet.
- GA4 is not loaded before affirmative analytics consent.
- Rent Check, lead submission, and all navigation remain functional when analytics is rejected.
- `move_service_interest` remains dormant: this release does not restore homepage service cards or present that event as a live funnel metric.
- The current checkout has no Git metadata. Run commit steps only after applying this plan in the canonical Git checkout; otherwise record each passing test command as the checkpoint.

---

### Task 1: Restore the Lead API Guard Baseline

**Files:**
- Create: `lib/api-guard.cjs`
- Create: `tests/api-guard.test.cjs`
- Test: `tests/lead-api.test.cjs`

**Interfaces:**
- Produces: `trustedRequestSource(req: { headers?: object }): boolean`.
- Consumes: `process.env.VERCEL_ENV` and request `origin`/`host` headers.

- [ ] **Step 1: Write the failing guard tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('production accepts the two KoreaHomeGuide origins only', () => {
  const { trustedRequestSource } = require('../lib/api-guard.cjs');
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  try {
    assert.equal(trustedRequestSource({ headers:{ origin:'https://koreahomeguide.com' } }), true);
    assert.equal(trustedRequestSource({ headers:{ origin:'https://www.koreahomeguide.com' } }), true);
    assert.equal(trustedRequestSource({ headers:{ origin:'https://evil.example' } }), false);
    assert.equal(trustedRequestSource({ headers:{} }), false);
  } finally {
    if (previous == null) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test('non-production permits local test requests', () => {
  const { trustedRequestSource } = require('../lib/api-guard.cjs');
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'development';
  try { assert.equal(trustedRequestSource({ headers:{} }), true); }
  finally {
    if (previous == null) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});
```

- [ ] **Step 2: Verify the tests fail for the missing module**

Run: `node --test tests/api-guard.test.cjs tests/lead-api.test.cjs`  
Expected: FAIL with `Cannot find module '../lib/api-guard.cjs'`.

- [ ] **Step 3: Implement the minimal guard**

```js
'use strict';

const PRODUCTION_ORIGINS = new Set([
  'https://koreahomeguide.com',
  'https://www.koreahomeguide.com'
]);

function header(req, name) {
  const headers = req && req.headers || {};
  return String(headers[name] || headers[name.toLowerCase()] || '').trim();
}

function trustedRequestSource(req) {
  if (process.env.VERCEL_ENV !== 'production') return true;
  return PRODUCTION_ORIGINS.has(header(req, 'origin'));
}

module.exports = { trustedRequestSource };
```

- [ ] **Step 4: Verify the API baseline passes**

Run: `node --test tests/api-guard.test.cjs tests/lead-api.test.cjs`  
Expected: PASS.

- [ ] **Step 5: Commit the guard in the canonical repository**

```bash
git add lib/api-guard.cjs tests/api-guard.test.cjs
git commit -m "fix: restore lead request source guard"
```

### Task 2: Repair the Email and Help Form Layout

**Files:**
- Modify: `cold-start.css`
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Create: `tests/lead-capture-layout.test.cjs`

**Interfaces:**
- Consumes: existing `[data-lead-form]`, `[data-help-form]`, `.lead-consent-note`, and `.search-button` hooks.
- Produces: one visible form at a time, a full readable email input, and consistently styled submit buttons at desktop and mobile widths.

- [ ] **Step 1: Write a failing source-level layout regression test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const forms = ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html'];

test('lead CSS preserves hidden forms and gives consent its own row', () => {
  const css = fs.readFileSync('cold-start.css','utf8');
  assert.match(css, /\.lead-capture form\[hidden\]\{display:none!important\}/);
  assert.match(css, /\[data-lead-form\][^{]*\{[^}]*grid-template-columns:minmax\(240px,1fr\) max-content/);
  assert.match(css, /\.lead-consent-note\{[^}]*grid-column:1\/-1/);
});

test('all help submit buttons use the shared primary button style', () => {
  for (const file of forms) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /data-help-form[^]*?<button class="search-button" type="submit">/, file);
  }
});
```

- [ ] **Step 2: Verify the regression test fails for the screenshot cause**

Run: `node --test tests/lead-capture-layout.test.cjs`  
Expected: FAIL because nested hidden forms are overridden by `.lead-capture form{display:flex}`, the consent note shares the flex row, and help buttons lack `.search-button`.

- [ ] **Step 3: Replace the broad flex rule with explicit form grids**

Add these rules after the existing lead styles and remove `.lead-capture form{display:flex;align-items:end;gap:10px;margin-top:16px}`:

```css
.lead-capture form[hidden]{display:none!important}
.lead-capture [data-lead-form],.lead-capture [data-help-form]{display:grid;grid-template-columns:minmax(240px,1fr) max-content;align-items:end;gap:10px;margin-top:16px}
.lead-capture form .field{min-width:0}
.lead-capture .lead-consent-note{grid-column:1/-1;display:block;margin-top:0;color:#667085;font-size:11px;line-height:1.5}
@media(max-width:760px){
  .lead-capture [data-lead-form],.lead-capture [data-help-form]{grid-template-columns:1fr}
  .lead-capture form button{width:100%}
  .lead-capture .lead-consent-note{grid-column:1}
}
```

- [ ] **Step 4: Add the shared class to every help button**

Change each help submit button to this structure, preserving localized text:

```html
<button class="search-button" type="submit">Ask KoreaHomeGuide</button>
```

- [ ] **Step 5: Verify the focused layout tests pass**

Run: `node --test tests/lead-capture-layout.test.cjs tests/cold-start-home-funnel.test.cjs`  
Expected: PASS.

- [ ] **Step 6: Commit the layout repair in the canonical repository**

```bash
git add cold-start.css index.html zh/index.html tools/seoul-rent-check/index.html zh/tools/seoul-rent-check/index.html tests/lead-capture-layout.test.cjs
git commit -m "fix: prevent lead form clipping and hidden form leakage"
```

### Task 3: Make Google Sheet Writes Unique by Normalized Email

**Files:**
- Modify: `ops/google-apps-script/lead-webhook.gs`
- Modify: `tests/google-sheet-webhook.test.cjs`
- Create: `tests/google-sheet-webhook-behavior.test.cjs`
- Modify: `docs/operations/google-sheet-lead-capture.md`

**Interfaces:**
- Produces: `normalizeEmail_(value)`, `findEmailRow_(sheet, email)`, `ensureHeaders_(sheet)`, and `upsertLeadRow_(sheet, row)` Apps Script helpers.
- Consumes: the existing 24-column lead row; adds `updated_at` as column 25 without deleting existing data.

- [ ] **Step 1: Add failing source assertions for unique behavior**

```js
test('Apps Script treats normalized email as the unique lead key', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /function normalizeEmail_\(/);
  assert.match(source, /function findEmailRow_\(/);
  assert.match(source, /row\.kind === 'lead_capture'/);
  assert.match(source, /row\.kind === 'help_request'/);
  assert.match(source, /sheet\.getRange\([^)]*\)\.setValues/);
  assert.match(source, /duplicate:true/);
  assert.match(source, /'updated_at'/);
});
```

- [ ] **Step 2: Verify the unique-email test fails**

Run: `node --test tests/google-sheet-webhook.test.cjs`  
Expected: FAIL because the webhook unconditionally calls `appendRow`.

- [ ] **Step 3: Write failing behavior tests against the Apps Script helpers**

Load the `.gs` file in `node:vm` and test it with a small in-memory sheet:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadWebhook() {
  const context = { console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8'), context);
  return context;
}

class FakeSheet {
  constructor(rows = []) { this.rows = rows.map(row => [...row]); }
  getLastRow() { return this.rows.length; }
  appendRow(row) { this.rows.push([...row]); }
  getRange(row, column, rowCount, columnCount) {
    return {
      getValues:() => Array.from({ length:rowCount }, (_, r) =>
        Array.from({ length:columnCount }, (_, c) => this.rows[row - 1 + r]?.[column - 1 + c] ?? '')
      ),
      setValues:values => values.forEach((source, r) => source.forEach((value, c) => {
        if (!this.rows[row - 1 + r]) this.rows[row - 1 + r] = [];
        this.rows[row - 1 + r][column - 1 + c] = value;
      }))
    };
  }
}

test('repeated lead capture keeps one normalized email row', () => {
  const webhook = loadWebhook();
  const sheet = new FakeSheet();
  webhook.upsertLeadRow_(sheet, { kind:'lead_capture', email:' User@Example.com ', created_at:'2026-08-25T00:00:00Z' });
  webhook.upsertLeadRow_(sheet, { kind:'lead_capture', email:'user@example.com', created_at:'2026-08-25T01:00:00Z' });
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[1][1], 'user@example.com');
});

test('help request merges into the existing email row', () => {
  const webhook = loadWebhook();
  const sheet = new FakeSheet();
  webhook.upsertLeadRow_(sheet, { kind:'lead_capture', email:'user@example.com', created_at:'2026-08-25T00:00:00Z' });
  webhook.upsertLeadRow_(sheet, { kind:'help_request', email:'USER@example.com', help_message:'Need help', created_at:'2026-08-25T02:00:00Z' });
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[1][21], true);
  assert.equal(sheet.rows[1][22], 'Need help');
  assert.equal(sheet.rows[1][24], '2026-08-25T02:00:00Z');
});
```

Run: `node --test tests/google-sheet-webhook-behavior.test.cjs`  
Expected: FAIL because `upsertLeadRow_` does not exist.

- [ ] **Step 4: Add the backward-compatible column and helpers**

Extend `COLUMNS` with `updated_at`. Implement normalization and lookup under the existing script lock:

```js
function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  else sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
}

function findEmailRow_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const target = normalizeEmail_(email);
  const index = values.findIndex(item => normalizeEmail_(item[0]) === target);
  return index < 0 ? 0 : index + 2;
}
```

- [ ] **Step 5: Implement idempotent append-or-merge behavior**

Move the branch into `upsertLeadRow_(sheet, row)`, return `{ ok:true, duplicate:true }`, `{ ok:true, updated:true }`, or `{ ok:true, created:true }`, and make `doPost` serialize that result with `jsonResponse_`. The helper normalizes `row.email`, calls `ensureHeaders_`, and executes:

```js
row.email = normalizeEmail_(row.email);
const existingRowNumber = findEmailRow_(sheet, row.email);
if (existingRowNumber && row.kind === 'lead_capture') return { ok:true, duplicate:true };
if (existingRowNumber && row.kind === 'help_request') {
  const existing = sheet.getRange(existingRowNumber, 1, 1, COLUMNS.length).getValues()[0];
  existing[COLUMNS.indexOf('help_requested')] = true;
  existing[COLUMNS.indexOf('help_message')] = sanitizeCell_(row.help_message);
  existing[COLUMNS.indexOf('updated_at')] = sanitizeCell_(row.created_at);
  sheet.getRange(existingRowNumber, 1, 1, COLUMNS.length).setValues([existing]);
  return { ok:true, updated:true };
}
row.updated_at = row.created_at;
sheet.appendRow(COLUMNS.map(key => sanitizeCell_(row[key])));
return { ok:true, created:true };
```

Keep `releaseLock()` in `finally`. Returning from inside the nested `try` is safe because `finally` still executes.

- [ ] **Step 6: Document the one-row-per-email sheet semantics**

Add an operations section stating:

```markdown
The normalized lowercase email is the unique key. Repeating `lead_capture` is a no-op. A later `help_request` updates `help_requested`, `help_message`, and `updated_at` on the existing row. Existing rows are preserved when the `updated_at` header is added.
```

- [ ] **Step 7: Verify sheet-writer tests pass**

Run: `node --test tests/google-sheet-webhook.test.cjs tests/google-sheet-webhook-behavior.test.cjs tests/lead-core.test.cjs tests/lead-api.test.cjs`  
Expected: PASS.

- [ ] **Step 8: Commit the unique writer in the canonical repository**

```bash
git add ops/google-apps-script/lead-webhook.gs tests/google-sheet-webhook.test.cjs tests/google-sheet-webhook-behavior.test.cjs docs/operations/google-sheet-lead-capture.md
git commit -m "feat: deduplicate lead sheet rows by email"
```

### Task 4: Add Localized Privacy Pages and Contextual Notices

**Files:**
- Create: `privacy/index.html`
- Create: `zh/privacy/index.html`
- Modify: every static `index.html` footer under the project
- Modify: `seo/seo-page-renderer.cjs`
- Modify: the four lead-form HTML files from Task 2
- Create: `tests/privacy-pages.test.cjs`

**Interfaces:**
- Produces: `/privacy/` and `/zh/privacy/`.
- Consumes: locale-specific footer and lead-form copy.

- [ ] **Step 1: Write failing privacy coverage tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

test('privacy pages disclose the approved operator, data, purpose, retention, and deletion channel', () => {
  const en = fs.readFileSync('privacy/index.html','utf8');
  const zh = fs.readFileSync('zh/privacy/index.html','utf8');
  for (const html of [en, zh]) {
    assert.match(html, /KoreaHomeGuide/);
    assert.match(html, /hello@koreahomeguide\.com/);
    assert.match(html, /12/);
    assert.match(html, /Vercel/);
    assert.match(html, /Google/);
  }
});

test('every static page links to the matching privacy locale', () => {
  const files = execSync("find . -name index.html -not -path './docs/*' | sort", { encoding:'utf8' }).trim().split('\n');
  for (const file of files) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, file.startsWith('./zh/') ? /href="\/zh\/privacy\/"/ : /href="\/privacy\/"/, file);
  }
});

test('all lead notices link directly to privacy details', () => {
  for (const file of ['index.html','zh/index.html','tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    assert.match(fs.readFileSync(file,'utf8'), /lead-consent-note[^]*?privacy\//, file);
  }
});
```

- [ ] **Step 2: Verify privacy tests fail**

Run: `node --test tests/privacy-pages.test.cjs`  
Expected: FAIL because the pages and links do not exist.

- [ ] **Step 3: Create the English privacy page**

Use the site's normal header/footer and these exact section headings and commitments:

```html
<h1>Privacy at KoreaHomeGuide</h1>
<h2>Information we collect</h2>
<h2>Why we use it</h2>
<h2>Services that process information</h2>
<h2>How long we keep it</h2>
<h2>Your choices and deletion requests</h2>
<h2>International processing</h2>
<h2>Changes to this notice</h2>
```

State the fields from the spec verbatim in plain language, the 12-month deletion/anonymization rule, Vercel/Google processors, and `hello@koreahomeguide.com` for access, correction, and deletion.

- [ ] **Step 4: Create the Simplified Chinese privacy page**

Use the equivalent localized headings:

```html
<h1>KoreaHomeGuide 隐私说明</h1>
<h2>我们收集的信息</h2>
<h2>使用目的</h2>
<h2>处理信息的服务提供商</h2>
<h2>保存期限</h2>
<h2>你的权利与删除请求</h2>
<h2>跨境处理</h2>
<h2>本说明的变更</h2>
```

- [ ] **Step 5: Add locale-correct footer and form links**

English form notice:

```html
<small class="lead-consent-note">By saving, you agree KoreaHomeGuide may contact you about this rent check and related rental guidance. <a href="/privacy/">Privacy details</a>.</small>
```

Chinese form notice:

```html
<small class="lead-consent-note">点击保存即表示你同意 KoreaHomeGuide 就本次租金检查及相关租房指南与你联系。<a href="/zh/privacy/">查看隐私说明</a>。</small>
```

Add the matching privacy link to every static footer and to both locale branches rendered by `seo/seo-page-renderer.cjs`.

- [ ] **Step 6: Verify privacy tests pass**

Run: `node --test tests/privacy-pages.test.cjs tests/seo-page-renderer.test.cjs tests/contact.test.cjs`  
Expected: PASS.

- [ ] **Step 7: Commit privacy disclosure in the canonical repository**

```bash
git add privacy zh/privacy index.html zh/index.html tools/seoul-rent-check/index.html zh/tools/seoul-rent-check/index.html rent guides zh/rent zh/guides explore zh/explore tools zh/tools seo/seo-page-renderer.cjs tests/privacy-pages.test.cjs
git commit -m "feat: add localized privacy disclosures"
```

### Task 5: Gate GA4 Behind Explicit Consent

**Files:**
- Create: `privacy-consent.js`
- Create: `tests/privacy-consent.test.cjs`
- Modify: every static `index.html`
- Modify: `seo/seo-page-renderer.cjs`
- Modify: `tests/analytics-pages.test.cjs`
- Modify: `tests/cold-start-analytics.test.cjs`
- Modify: `styles.css`

**Interfaces:**
- Produces: `KHGPrivacy.getConsent()`, `KHGPrivacy.setConsent(value)`, `KHGPrivacy.loadAnalytics()`, and `KHGPrivacy.init()`.
- Persists: localStorage key `khg_privacy_consent_v1` with `accepted` or `rejected`.
- Consumes: GA4 measurement ID `G-6SXH5BREDP` inside the shared module only.

- [ ] **Step 1: Read the shared JavaScript test guidance before changing tests**

Run: `cat /root/.codex/plugins/cache/openai-curated-remote/superpowers/6.3.0/skills/test-driven-development/writing-good-tests.md`  
Expected: the test author records which production change would make each test fail and asserts behavior rather than a mock call count.

- [ ] **Step 2: Write failing consent behavior tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('analytics is not loaded when consent is absent or rejected', () => {
  const privacy = require('../privacy-consent.js');
  assert.equal(privacy.shouldLoadAnalytics(null), false);
  assert.equal(privacy.shouldLoadAnalytics('rejected'), false);
});

test('analytics loads only for the accepted value', () => {
  const privacy = require('../privacy-consent.js');
  assert.equal(privacy.shouldLoadAnalytics('accepted'), true);
  assert.equal(privacy.normalizeConsent('anything-else'), null);
});
```

Update page-source tests so they reject direct `googletagmanager.com` tags and require `/privacy-consent.js`.

- [ ] **Step 3: Verify consent tests fail**

Run: `node --test tests/privacy-consent.test.cjs tests/analytics-pages.test.cjs`  
Expected: FAIL because GA4 currently loads unconditionally and the shared module does not exist.

- [ ] **Step 4: Implement the UMD consent module**

Implement a browser/CommonJS module with this public behavior:

```js
const STORAGE_KEY = 'khg_privacy_consent_v1';
const MEASUREMENT_ID = 'G-6SXH5BREDP';
function normalizeConsent(value) { return value === 'accepted' || value === 'rejected' ? value : null; }
function shouldLoadAnalytics(value) { return normalizeConsent(value) === 'accepted'; }
```

`loadAnalytics()` creates `window.dataLayer`, defines `window.gtag`, pushes `js`/`config`, then appends one async script for `https://www.googletagmanager.com/gtag/js?id=G-6SXH5BREDP`. It is idempotent via a module-level flag and a `data-khg-analytics` script attribute.

`init()` reads localStorage safely. When no choice exists, it appends a localized fixed banner containing two real buttons: `Accept analytics`/`Reject` or `同意分析 Cookie`/`拒绝`. It also appends a footer button labeled `Privacy choices` or `隐私设置` that reopens the banner. Storage failures must leave analytics disabled.

- [ ] **Step 5: Remove every unconditional GA snippet**

Replace both the external gtag script and inline configuration in every static page with:

```html
<script defer src="/privacy-consent.js"></script>
```

Update `seo/seo-page-renderer.cjs` to emit the same deferred script for generated pages.

- [ ] **Step 6: Add localized consent styles**

Add fixed banner styling with a high but bounded z-index, readable text, focus-visible outlines, wrapping buttons, and a one-column layout below 620px. Do not cover page controls on small screens; reserve bottom padding while the banner is open.

- [ ] **Step 7: Verify analytics and existing event code**

Run: `node --test tests/privacy-consent.test.cjs tests/analytics-pages.test.cjs tests/cold-start-analytics.test.cjs tests/v12-move-commerce-js.test.cjs`  
Expected: PASS. Existing `safeTrack` calls remain no-ops until `window.gtag` exists.

- [ ] **Step 8: Commit consent-aware analytics in the canonical repository**

```bash
git add privacy-consent.js styles.css seo/seo-page-renderer.cjs tests/privacy-consent.test.cjs tests/analytics-pages.test.cjs tests/cold-start-analytics.test.cjs
find . -name index.html -not -path './docs/*' -print0 | xargs -0 git add --
git commit -m "feat: require consent before loading analytics"
```

### Task 6: Stage the Vercel Firewall Rule and Document Operations

**Files:**
- Create: `docs/operations/lead-rate-limit.md`
- Create: `tests/lead-rate-limit-doc.test.cjs`

**Interfaces:**
- Produces: a staged Vercel Firewall rule for `POST /api/lead`, keyed by IP, 10 requests per 3600 seconds, deny action.
- Consumes: authenticated Vercel CLI or Vercel dashboard access to the linked project.

- [ ] **Step 1: Write a failing operations-document test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('lead rate-limit runbook records the exact production policy and rollout', () => {
  const doc = fs.readFileSync('docs/operations/lead-rate-limit.md','utf8');
  for (const term of ['POST','/api/lead','10','3600','IP','log','preview','production','429']) {
    assert.match(doc, new RegExp(term, 'i'));
  }
});
```

- [ ] **Step 2: Verify the runbook test fails**

Run: `node --test tests/lead-rate-limit-doc.test.cjs`  
Expected: FAIL because the runbook does not exist.

- [ ] **Step 3: Create the runbook with the exact rule definition**

Document:

```markdown
Name: Lead submissions — 10/hour/IP
Match: request method equals POST AND request path equals /api/lead
Window: 3600 seconds
Requests: 10
Key: IP
Rate-limit action: deny (HTTP 429)
Rollout: log → review logs → preview → user publishes to production
Rollback: disable this named rule; do not alter other firewall rules
```

Include the warning that Vercel counters are regional and that the API's source validation remains defense in depth.

- [ ] **Step 4: Inspect the linked project before mutation**

Run: `vercel project inspect` and `vercel firewall rules ls`  
Expected: the intended KoreaHomeGuide project is linked and no equivalent rule already exists. If the CLI is unavailable, perform the same read-only check in the Vercel dashboard before creating the rule.

- [ ] **Step 5: Create the rule in log mode, then preview mode**

Use the Vercel Firewall rule editor with the exact values in Step 3. Save in log mode, review matching requests, then change the staged action to preview deny. Do not publish to production from the agent session; the user publishes after reviewing the staged rule.

- [ ] **Step 6: Verify the runbook test passes**

Run: `node --test tests/lead-rate-limit-doc.test.cjs`  
Expected: PASS.

- [ ] **Step 7: Commit the runbook in the canonical repository**

```bash
git add docs/operations/lead-rate-limit.md tests/lead-rate-limit-doc.test.cjs
git commit -m "docs: add lead rate limit rollout"
```

### Task 7: End-to-End Lead and Privacy Verification

**Files:**
- Modify only if a failing verification exposes a defect in the files above.

**Interfaces:**
- Consumes: all deliverables from Tasks 1–6.
- Produces: a deployable lead/privacy checkpoint and evidence that the screenshot regression is closed.

- [ ] **Step 1: Run the focused automated suite**

Run:

```bash
node --test \
  tests/api-guard.test.cjs \
  tests/lead-api.test.cjs \
  tests/lead-core.test.cjs \
  tests/google-sheet-webhook.test.cjs \
  tests/google-sheet-webhook-behavior.test.cjs \
  tests/lead-capture-layout.test.cjs \
  tests/privacy-pages.test.cjs \
  tests/privacy-consent.test.cjs \
  tests/analytics-pages.test.cjs \
  tests/cold-start-home-funnel.test.cjs \
  tests/v12-move-commerce-home.test.cjs
```

Expected: PASS with no warnings.

- [ ] **Step 2: Run the complete available suite**

Run: `node --test tests/*.test.cjs`  
Expected: PASS. If a reconstruction-only missing module is reported, restore that module from the canonical source before judging this feature.

- [ ] **Step 3: Verify the lead UI in a browser at four widths**

Open English and Chinese home and Rent Check pages at 1440, 1024, 768, and 390 CSS pixels. Trigger a Rent Check result and confirm:

```text
- you@example.com is fully visible at 1024 and above
- only the email form is visible before save
- only the help form is visible after save
- both buttons use the blue primary style
- privacy link wraps below the input/button row
- no horizontal overflow appears at 390px
```

- [ ] **Step 4: Verify consent behavior in a fresh browser profile**

Reject analytics and confirm no `googletagmanager.com` request occurs. Reset privacy choices, accept, and confirm one GA script request occurs. Reload and confirm the stored choice is respected.

- [ ] **Step 5: Verify sheet idempotency with a controlled test address**

Submit `khg-idempotency-test+20260825@example.com` twice as `lead_capture`, then once as `help_request`. Confirm exactly one sheet row exists and that `help_requested`, `help_message`, and `updated_at` are populated. Delete the controlled test row after verification.

- [ ] **Step 6: Record the final checkpoint**

In the canonical repository:

```bash
git status --short
git log -6 --oneline
```

Expected: only intended changes are present and each task commit is visible.
