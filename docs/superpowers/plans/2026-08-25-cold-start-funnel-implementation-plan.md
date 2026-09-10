# KoreaHomeGuide Cold Start Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn KoreaHomeGuide Phase 1 into a single trust-and-lead funnel centered on Rent Check, while preserving neutral official-data results and existing SEO surfaces.

**Architecture:** Reuse the existing Rent Check calculation and rendering flows, add one shared browser lead-capture module triggered by a stable `khg:rent-check-result` event, and add one Vercel `/api/lead` endpoint that validates and forwards sanitized lead payloads to a server-side Google Apps Script webhook backed by Google Sheets. Keep GA4 analytics PII-free and keep future Japanese localization structurally possible without shipping Japanese content now.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Node.js CommonJS Vercel Functions, Google Apps Script webhook, Google Sheets, GA4, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-25-cold-start-funnel-design.md` (local working copy supplied as `2026-08-25-cold-start-funnel-design.md` until GitHub write access is restored)

## Global Constraints

- Phase 1 objective is traffic + trust + lead capture, not monetization.
- Rent Check verdict and comparable selection remain neutral and unchanged.
- Core Rent Check result must be visible before any email request.
- Supported locales in this release: `en` and `zh-CN` only.
- Japanese remains deferred; locale-specific copy must stay isolated so `ja` can be added later without changing storage contracts.
- Never send email addresses, help messages, names, phone numbers, or other PII to GA4.
- Browser must never receive the Google Apps Script webhook URL or shared secret.
- Google Sheet storage failure must never hide or invalidate an already-rendered Rent Check result.
- Existing canonical URLs, hreflang, Explorer URLs, Guide URLs, sitemap behavior, and official-data disclaimers must remain intact.
- No paid ads, affiliate/referral CTAs, marketplace booking, or paid consultation in this release.
- Do not use an in-memory serverless `Map` as a global rate limiter or global dedupe store.

---

## File Structure

### New production files

- `lead-capture.js`
  - Shared EN/ZH lead module controller.
  - Listens for `khg:rent-check-result`.
  - Renders lead form after a result.
  - Submits `lead_capture` and `help_request` payloads.
  - Emits PII-free GA4 funnel events.

- `lib/lead-core.cjs`
  - Pure payload validation/normalization.
  - Email normalization.
  - Locale/district/type/value constraints.
  - Safe attribution extraction.
  - Help-message ceiling.

- `lib/lead-store.cjs`
  - Server-only forwarding to Google Apps Script.
  - Uses `LEAD_SHEET_WEBHOOK_URL` and `LEAD_SHEET_SHARED_SECRET`.
  - Applies timeout and returns normalized storage status.

- `api/lead.js`
  - POST-only Vercel endpoint.
  - Request-source guard.
  - JSON body validation.
  - Safe logging without PII.
  - Calls `lead-core` then `lead-store`.

- `ops/google-apps-script/lead-webhook.gs`
  - Deployable Apps Script code.
  - Shared-secret validation.
  - Header creation.
  - Append-only Google Sheet storage.

- `docs/operations/google-sheet-lead-capture.md`
  - Exact setup/deployment/environment-variable instructions.

### Modified production files

- `index.html`
  - Replace feature-directory first impression with funnel-first homepage.
  - Remove primary visual prominence of future service cards.
  - Embed lead container after home Rent Check result.
  - Add `lead-capture.js`.

- `zh/index.html`
  - Same information architecture in natural Simplified Chinese.
  - Add `lead-capture.js`.

- `app.js`
  - Dispatch normalized `khg:rent-check-result` event after successful homepage Rent Check result.
  - Emit `rent_check_start` and `rent_check_result` analytics events without PII.

- `zh/app.js`
  - Same event contract and analytics behavior for `zh-CN`.

- `tools/seoul-rent-check/index.html`
  - Add shared lead container after result.
  - Add `lead-capture.js`.

- `zh/tools/seoul-rent-check/index.html`
  - Same in Chinese.

- `tools/seoul-rent-check/app.js`
  - Dispatch shared result event after successful result.
  - Funnel analytics.

- `zh/tools/seoul-rent-check/app.js`
  - Same in Chinese.

- `styles.css`
  - Funnel-first homepage spacing.
  - Lead card/form/success/help states.
  - Remove dependence on future-services grid being visible.

### New tests

- `tests/cold-start-home-funnel.test.cjs`
- `tests/lead-core.test.cjs`
- `tests/lead-api.test.cjs`
- `tests/lead-capture-source.test.cjs`
- `tests/cold-start-analytics.test.cjs`
- `tests/google-sheet-webhook.test.cjs`

---

### Task 1: Pure lead payload contract

**Files:**
- Create: `lib/lead-core.cjs`
- Create: `tests/lead-core.test.cjs`

**Interfaces:**
- Consumes: `SEOUL_DISTRICTS`, `isSupportedAreaCode`, and existing property-type conventions.
- Produces:
  - `normalizeLeadPayload(body, now?) -> { ok:true, value } | { ok:false, error }`
  - `normalizeEmail(value) -> string`
  - `normalizeLocale(value) -> 'en' | 'zh-CN' | null`
  - `sanitizeAttribution(body) -> { sourcePage, utmSource, utmMedium, utmCampaign, referrerHost }`

- [ ] **Step 1: Write the failing validation tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeLeadPayload,
  normalizeEmail,
  normalizeLocale
} = require('../lib/lead-core.cjs');

test('normalizes email and accepts a valid lead_capture payload', () => {
  const result = normalizeLeadPayload({
    kind:'lead_capture',
    email:'  USER@Example.COM ',
    language:'en',
    districtCode:'11440',
    propertyType:'villa',
    depositWon:10000000,
    monthlyRentWon:800000,
    areaSqm:25,
    rating:'fair',
    confidence:'medium',
    askingValueWon:800000,
    medianValueWon:780000,
    differencePct:2.6,
    comparableCount:14,
    monthsUsed:6,
    dataThroughMonth:'2026-07',
    sourcePage:'/tools/seoul-rent-check/'
  }, new Date('2026-08-25T00:00:00Z'));

  assert.equal(result.ok, true);
  assert.equal(result.value.email, 'user@example.com');
  assert.equal(result.value.language, 'en');
  assert.equal(result.value.district_code, '11440');
  assert.equal(result.value.help_requested, false);
});

test('rejects unsupported locale, district, property type, and invalid email', () => {
  for (const body of [
    { kind:'lead_capture', email:'bad', language:'en', districtCode:'11440', propertyType:'villa', areaSqm:25 },
    { kind:'lead_capture', email:'a@b.com', language:'ja', districtCode:'11440', propertyType:'villa', areaSqm:25 },
    { kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'99999', propertyType:'villa', areaSqm:25 },
    { kind:'lead_capture', email:'a@b.com', language:'en', districtCode:'11440', propertyType:'castle', areaSqm:25 }
  ]) {
    assert.equal(normalizeLeadPayload(body).ok, false);
  }
});

test('help_request requires a valid normalized email and caps message length', () => {
  const good = normalizeLeadPayload({
    kind:'help_request',
    email:'user@example.com',
    language:'zh-CN',
    districtCode:'11440',
    propertyType:'villa',
    areaSqm:25,
    helpMessage:'I am signing next week.'
  });
  assert.equal(good.ok, true);
  assert.equal(good.value.help_requested, true);

  const tooLong = normalizeLeadPayload({
    kind:'help_request',
    email:'user@example.com',
    language:'en',
    districtCode:'11440',
    propertyType:'villa',
    areaSqm:25,
    helpMessage:'x'.repeat(2001)
  });
  assert.equal(tooLong.ok, false);
});

test('locale contract deliberately excludes Japanese for this release', () => {
  assert.equal(normalizeLocale('en'), 'en');
  assert.equal(normalizeLocale('zh-CN'), 'zh-CN');
  assert.equal(normalizeLocale('ja'), null);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tests/lead-core.test.cjs
```

Expected: FAIL because `lib/lead-core.cjs` does not exist.

- [ ] **Step 3: Implement the minimal pure validation module**

Implementation requirements:

```js
const { isSupportedAreaCode, isSupportedPropertyType } = require('../providers/seoul-config.cjs');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALES = new Set(['en','zh-CN']);
const RATINGS = new Set(['above','fair','below','insufficient']);
const CONFIDENCE = new Set(['high','medium','low']);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLocale(value) {
  const locale = String(value || '').trim();
  return LOCALES.has(locale) ? locale : null;
}
```

Rules:
- email max 254 chars
- source page max 200 chars
- UTM values max 120 chars each
- referrer host max 255 chars
- help message max 2000 chars
- `areaSqm > 0 && areaSqm <= 1000`
- deposit and monthly rent must be finite and `>= 0`
- property type must map to an existing supported official type; permit `studio` only if normalized by caller to its official mapped type before API submission
- missing optional result metrics become `null`
- output keys use the Google Sheet schema names from the spec
- `created_at` is server generated, never trusted from the browser

- [ ] **Step 4: Re-run the test and verify GREEN**

```bash
node --test tests/lead-core.test.cjs
```

Expected: PASS.

---

### Task 2: Server-only Google Sheet storage adapter

**Files:**
- Create: `lib/lead-store.cjs`
- Create: `tests/lead-api.test.cjs`

**Interfaces:**
- Consumes: normalized lead row from `normalizeLeadPayload`.
- Produces:
  - `createLeadStore({ fetchImpl, webhookUrl, sharedSecret, timeoutMs })`
  - returned function `storeLead(row) -> Promise<{ ok:true }>` or throws sanitized storage error

- [ ] **Step 1: Write failing storage tests**

```js
test('lead store sends webhook URL and secret only server-side', async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return { ok:true, json:async()=>({ ok:true }) };
  };

  const store = createLeadStore({
    fetchImpl,
    webhookUrl:'https://script.google.com/macros/s/test/exec',
    sharedSecret:'server-secret',
    timeoutMs:5000
  });

  await store({ email:'user@example.com', kind:'lead_capture' });

  assert.equal(seen.url, 'https://script.google.com/macros/s/test/exec');
  const body = JSON.parse(seen.options.body);
  assert.equal(body.secret, 'server-secret');
  assert.equal(body.row.email, 'user@example.com');
});

test('lead store throws a generic error on webhook failure', async () => {
  const store = createLeadStore({
    fetchImpl:async()=>({ ok:false, status:500, text:async()=>'' }),
    webhookUrl:'https://script.google.com/macros/s/test/exec',
    sharedSecret:'server-secret'
  });
  await assert.rejects(() => store({ email:'u@example.com' }), /storage unavailable/i);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/lead-api.test.cjs
```

Expected: FAIL because `lib/lead-store.cjs` does not exist.

- [ ] **Step 3: Implement storage adapter**

Use an `AbortController` with a 5-second default timeout.

Request body:

```js
{
  secret: sharedSecret,
  row
}
```

Headers:

```js
{
  'content-type':'application/json'
}
```

Never include webhook URL, secret, email, or message in thrown error text.

- [ ] **Step 4: Run and verify GREEN**

```bash
node --test tests/lead-api.test.cjs
```

Expected: storage tests PASS.

---

### Task 3: `/api/lead` Vercel endpoint

**Files:**
- Create: `api/lead.js`
- Modify: `tests/lead-api.test.cjs`
- Reuse: existing `lib/api-guard.cjs` if present after the v10.9 combined patch; otherwise implement the same request-source policy locally without weakening other APIs.

**Interfaces:**
- Consumes: JSON POST body.
- Produces:
  - `201 { ok:true }` for successful `lead_capture`
  - `201 { ok:true }` for successful `help_request`
  - `400` invalid payload
  - `403` disallowed production source
  - `405` non-POST
  - `503` storage unavailable

- [ ] **Step 1: Add failing endpoint tests**

```js
test('lead endpoint rejects GET', async () => {
  const handler = createHandler({ storeLead:async()=>({ ok:true }) });
  const res = responseRecorder();
  await handler({ method:'GET', headers:{}, body:{} }, res);
  assert.equal(res.statusCode, 405);
});

test('lead endpoint validates before storage', async () => {
  let calls = 0;
  const handler = createHandler({ storeLead:async()=>{ calls += 1; } });
  const res = responseRecorder();
  await handler({
    method:'POST',
    headers:{ origin:'https://koreahomeguide.com' },
    body:{ kind:'lead_capture', email:'not-email' }
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 0);
});

test('storage failure returns 503 without exposing PII', async () => {
  const handler = createHandler({ storeLead:async()=>{ throw new Error('storage unavailable'); } });
  const res = responseRecorder();
  await handler({
    method:'POST',
    headers:{ origin:'https://koreahomeguide.com' },
    body:{
      kind:'lead_capture',
      email:'private@example.com',
      language:'en',
      districtCode:'11440',
      propertyType:'villa',
      areaSqm:25
    }
  }, res);
  assert.equal(res.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(res.body), /private@example\.com/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/lead-api.test.cjs
```

Expected: FAIL because `api/lead.js` is missing.

- [ ] **Step 3: Implement endpoint**

Key pattern:

```js
function createHandler({
  storeLead = defaultStore,
  now = () => new Date()
} = {}) {
  return async function handler(req, res) {
    if (!req || req.method !== 'POST') {
      return res.status(405).json({ error:'Method not allowed' });
    }

    // Reuse production source validation.
    const parsed = normalizeLeadPayload(req.body || {}, now());
    if (!parsed.ok) {
      return res.status(400).json({ error:parsed.error });
    }

    try {
      await storeLead(parsed.value);
      res.setHeader('Cache-Control','no-store');
      return res.status(201).json({ ok:true });
    } catch (err) {
      console.error('[lead]', {
        kind:parsed.value.kind,
        language:parsed.value.language,
        districtCode:parsed.value.district_code,
        message:String(err && err.message || 'storage failure')
      });
      return res.status(503).json({ error:'Lead storage is temporarily unavailable.' });
    }
  };
}
```

Logging rule:
- allowed: kind, language, district code, generic error message
- forbidden: email, help message, secret, webhook URL

- [ ] **Step 4: Run endpoint tests and verify GREEN**

```bash
node --test tests/lead-api.test.cjs
```

Expected: PASS.

---

### Task 4: Google Apps Script append-only webhook

**Files:**
- Create: `ops/google-apps-script/lead-webhook.gs`
- Create: `tests/google-sheet-webhook.test.cjs`
- Create: `docs/operations/google-sheet-lead-capture.md`

**Interfaces:**
- Consumes JSON `{ secret, row }`
- Produces JSON `{ ok:true }` or `{ ok:false, error:'...' }`
- Appends one row per accepted interaction.

- [ ] **Step 1: Write source-contract test**

```js
test('Apps Script validates secret and appends a fixed schema', () => {
  const source = fs.readFileSync('ops/google-apps-script/lead-webhook.gs','utf8');
  assert.match(source, /PropertiesService\.getScriptProperties\(\)/);
  assert.match(source, /LEAD_SHARED_SECRET/);
  assert.match(source, /appendRow/);
  assert.doesNotMatch(source, /doGet\s*\(/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/google-sheet-webhook.test.cjs
```

Expected: FAIL because script is missing.

- [ ] **Step 3: Implement Apps Script**

Required fixed columns:

```js
const COLUMNS = [
  'kind','email','language','district_code','property_type',
  'deposit_won','monthly_rent_won','area_sqm','rating','confidence',
  'asking_value_won','median_value_won','difference_pct',
  'comparable_count','months_used','data_through_month',
  'source_page','utm_source','utm_medium','utm_campaign',
  'referrer_host','help_requested','help_message','created_at'
];
```

Security:
- secret read from Apps Script Script Properties `LEAD_SHARED_SECRET`
- reject mismatched secret before sheet write
- no GET handler
- spreadsheet ID stored in Script Properties `LEAD_SHEET_ID`
- sheet name defaults to `Leads`
- create header row only if empty

- [ ] **Step 4: Document exact deployment steps**

`docs/operations/google-sheet-lead-capture.md` must include:

1. Create a Google Sheet.
2. Open Extensions → Apps Script.
3. Paste `lead-webhook.gs`.
4. Script Properties:
   - `LEAD_SHARED_SECRET`
   - `LEAD_SHEET_ID`
5. Deploy as Web App:
   - execute as owner
   - access limited to deployment mode supported by the account; webhook secret is still mandatory
6. Copy execution URL into Vercel:
   - `LEAD_SHEET_WEBHOOK_URL`
   - same secret into `LEAD_SHEET_SHARED_SECRET`
7. Redeploy.
8. Test one lead and confirm one row.

- [ ] **Step 5: Run test and verify GREEN**

```bash
node --test tests/google-sheet-webhook.test.cjs
```

Expected: PASS.

---

### Task 5: Shared lead-capture browser component

**Files:**
- Create: `lead-capture.js`
- Create: `tests/lead-capture-source.test.cjs`

**Interfaces:**
- Consumes: `khg:rent-check-result` browser event.
- Produces:
  - lead form shown after latest result
  - POST `/api/lead`
  - optional help request after successful lead
  - PII-free GA events

Public DOM contract:

```html
<section
  class="lead-capture"
  data-lead-capture
  data-language="en"
  hidden
>
  ...
</section>
```

- [ ] **Step 1: Write failing source tests**

```js
test('lead module listens for rent-check result and posts only to /api/lead', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.match(source, /khg:rent-check-result/);
  assert.match(source, /fetch\(['"`]\/api\/lead/);
  assert.doesNotMatch(source, /script\.google\.com/);
  assert.doesNotMatch(source, /LEAD_SHEET_SHARED_SECRET/);
});

test('GA tracking source never adds email or helpMessage to analytics params', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.doesNotMatch(source, /gtag\([^)]*email/);
  assert.doesNotMatch(source, /gtag\([^)]*helpMessage/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/lead-capture-source.test.cjs
```

Expected: FAIL because `lead-capture.js` is missing.

- [ ] **Step 3: Implement shared module**

Behavior:
1. On `khg:rent-check-result`, save `event.detail` as the latest result.
2. Unhide all `[data-lead-capture]` modules matching locale.
3. Fire `lead_form_view` once per new result.
4. Submit normalized lead payload to `/api/lead`.
5. Disable submit button while pending.
6. On `201`, render success state and optional help form.
7. On failure, keep Rent Check result untouched and show only lead-module error.
8. Help submit reuses the captured email plus latest result context.
9. Do not promise an email was sent unless an email-delivery backend is actually added later.

Recommended early-access success copy:

English:
`Saved. We'll use this to improve the detailed rent-check follow-up for early users.`

Chinese:
`已记录。我们会用这次结果完善面向早期用户的详细租金检查后续服务。`

- [ ] **Step 4: Run source tests and verify GREEN**

```bash
node --test tests/lead-capture-source.test.cjs
```

Expected: PASS.

---

### Task 6: Stable Rent Check result event contract

**Files:**
- Modify: `app.js`
- Modify: `zh/app.js`
- Modify: `tools/seoul-rent-check/app.js`
- Modify: `zh/tools/seoul-rent-check/app.js`
- Create: `tests/cold-start-analytics.test.cjs`

**Interfaces:**
- Produces `khg:rent-check-result` detail:

```js
{
  language:'en' | 'zh-CN',
  sourcePage:location.pathname,
  districtCode,
  propertyType,
  depositWon,
  monthlyRentWon,
  areaSqm,
  rating,
  confidence,
  askingValueWon,
  medianValueWon,
  differencePct,
  comparableCount,
  monthsUsed,
  dataThroughMonth
}
```

- [ ] **Step 1: Write failing event-contract tests**

```js
test('all four Rent Check runtimes dispatch the shared result event', () => {
  for (const file of [
    'app.js',
    'zh/app.js',
    'tools/seoul-rent-check/app.js',
    'zh/tools/seoul-rent-check/app.js'
  ]) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /khg:rent-check-result/);
    assert.match(source, /CustomEvent/);
  }
});

test('analytics uses funnel event names without PII fields', () => {
  for (const file of [
    'app.js',
    'zh/app.js',
    'tools/seoul-rent-check/app.js',
    'zh/tools/seoul-rent-check/app.js'
  ]) {
    const source = fs.readFileSync(file,'utf8');
    assert.match(source, /rent_check_start/);
    assert.match(source, /rent_check_result/);
    assert.doesNotMatch(source, /gtag\([^)]*email/);
  }
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/cold-start-analytics.test.cjs
```

Expected: FAIL because current runtimes do not emit the shared event.

- [ ] **Step 3: Implement minimal shared event helper in each runtime**

Immediately before the `/api/rent-check` request:
- fire `rent_check_start`

Immediately after a successful response and after `renderResult` / `renderRentCheckResult`:
- fire `rent_check_result`
- dispatch `khg:rent-check-result`

Never dispatch a result event for HTTP/network errors.

For `insufficient`, still dispatch the result with `rating:'insufficient'` because it is a completed user journey.

- [ ] **Step 4: Run and verify GREEN**

```bash
node --test tests/cold-start-analytics.test.cjs
```

Expected: PASS.

---

### Task 7: Funnel-first EN/ZH homepage

**Files:**
- Modify: `index.html`
- Modify: `zh/index.html`
- Modify: `styles.css`
- Create: `tests/cold-start-home-funnel.test.cjs`

**Interfaces:**
- Consumes existing embedded Rent Check IDs used by `app.js` / `zh/app.js`.
- Produces one primary homepage path without changing those JavaScript selectors.

- [ ] **Step 1: Write failing homepage structure tests**

```js
test('English homepage presents Rent Check as the single primary action', () => {
  const html = fs.readFileSync('index.html','utf8');
  assert.match(html, /Is your Seoul rent actually fair\?/);
  assert.match(html, />Check my rent</);
  assert.match(html, /Official signed transactions/);
  assert.match(html, /Built for foreign renters/);
  assert.match(html, /data-lead-capture/);
  assert.doesNotMatch(html, /Make your move easier/);
  assert.doesNotMatch(html, /Coming soon/);
});

test('Chinese homepage mirrors the same funnel in localized copy', () => {
  const html = fs.readFileSync('zh/index.html','utf8');
  assert.match(html, /租金|月租/);
  assert.match(html, /data-lead-capture/);
  assert.doesNotMatch(html, /Coming soon/);
});

test('homepage preserves existing Rent Check DOM IDs', () => {
  for (const file of ['index.html','zh/index.html']) {
    const html = fs.readFileSync(file,'utf8');
    for (const id of [
      'rentCheckForm','rentCheckArea','rentCheckType',
      'rentCheckDeposit','rentCheckRent','rentCheckAreaSqm',
      'rentCheckButton','rentCheckResult'
    ]) {
      assert.match(html, new RegExp(`id="${id}"`));
    }
  }
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/cold-start-home-funnel.test.cjs
```

Expected: FAIL because old future-service and multi-path homepage remains.

- [ ] **Step 3: Reorder homepage content**

Required order:
1. header
2. hero
3. trust strip
4. embedded Rent Check
5. result + lead module
6. secondary Explorer-by-budget link/section
7. before-signing Guides
8. footer

Remove from primary homepage markup:
- `move-journey-section`
- `move-services-section`
- Internet / SIM / moving / cleaning / insurance / relocation `Coming soon` cards

Keep underlying future-service JavaScript files in repository unless unused references break tests; do not delete roadmap code unnecessarily.

- [ ] **Step 4: Add shared lead module markup**

English:

```html
<section class="lead-capture" data-lead-capture data-language="en" hidden>
  <div class="lead-capture-copy">
    <span class="eyebrow">KEEP THIS RENT CHECK</span>
    <h3>Keep your result for later.</h3>
    <p>Leave your email to join the early detailed rent-check follow-up and get the before-you-sign checklist.</p>
  </div>
  <form data-lead-form>
    <label class="field">
      <span>Email</span>
      <input type="email" name="email" autocomplete="email" required maxlength="254">
    </label>
    <button class="search-button" type="submit">Save my rent check</button>
  </form>
  <div data-lead-status aria-live="polite"></div>
  <form data-help-form hidden>
    <label class="field">
      <span>Signing soon and need help?</span>
      <textarea name="helpMessage" maxlength="2000" placeholder="Tell us what you're worried about."></textarea>
    </label>
    <button type="submit">Ask KoreaHomeGuide</button>
  </form>
</section>
```

Chinese should be naturally localized and preserve the same data attributes.

- [ ] **Step 5: Include script on both homepages**

Before closing body:

```html
<script src="/lead-capture.js"></script>
```

- [ ] **Step 6: Run tests and verify GREEN**

```bash
node --test tests/cold-start-home-funnel.test.cjs
```

Expected: PASS.

---

### Task 8: Standalone EN/ZH Rent Check lead funnel

**Files:**
- Modify: `tools/seoul-rent-check/index.html`
- Modify: `zh/tools/seoul-rent-check/index.html`
- Extend: `tests/cold-start-home-funnel.test.cjs`

**Interfaces:**
- Uses the same `[data-lead-capture]` markup contract and shared `lead-capture.js`.

- [ ] **Step 1: Add failing tests**

```js
test('standalone Rent Check pages expose the shared post-result lead module', () => {
  for (const file of [
    'tools/seoul-rent-check/index.html',
    'zh/tools/seoul-rent-check/index.html'
  ]) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html, /data-lead-capture/);
    assert.match(html, /src="\/lead-capture\.js"/);
  }
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/cold-start-home-funnel.test.cjs
```

Expected: FAIL.

- [ ] **Step 3: Insert lead module immediately after the existing result section**

Do not move or hide:
- verdict
- comparables
- disclaimer
- Fair Rent distribution intelligence

The lead module remains `hidden` until `lead-capture.js` receives the result event.

- [ ] **Step 4: Run and verify GREEN**

```bash
node --test tests/cold-start-home-funnel.test.cjs
```

Expected: PASS.

---

### Task 9: PII-free GA4 funnel instrumentation

**Files:**
- Modify: `lead-capture.js`
- Extend: `tests/cold-start-analytics.test.cjs`

**Interfaces:**
- Events:
  - `rent_check_start`
  - `rent_check_result`
  - `lead_form_view`
  - `lead_submit`
  - `help_request`

- [ ] **Step 1: Add failing event-name and PII tests**

```js
test('lead component emits only approved funnel events', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  for (const event of ['lead_form_view','lead_submit','help_request']) {
    assert.match(source, new RegExp(event));
  }
});

test('lead component never passes email or message into gtag params', () => {
  const source = fs.readFileSync('lead-capture.js','utf8');
  assert.doesNotMatch(source, /safeTrack\([^)]*email/);
  assert.doesNotMatch(source, /safeTrack\([^)]*helpMessage/);
});
```

- [ ] **Step 2: Run and verify RED if events are not yet wired**

```bash
node --test tests/cold-start-analytics.test.cjs
```

- [ ] **Step 3: Implement analytics helper**

Allowed params:

```js
{
  language,
  source_page,
  district_code,
  property_type,
  rating,
  confidence,
  comparable_count_bucket,
  sufficient
}
```

Comparable-count bucket:

```js
function comparableCountBucket(n) {
  const count = Number(n || 0);
  if (count < 3) return '0-2';
  if (count < 10) return '3-9';
  if (count < 30) return '10-29';
  return '30+';
}
```

- [ ] **Step 4: Run and verify GREEN**

```bash
node --test tests/cold-start-analytics.test.cjs
```

Expected: PASS.

---

### Task 10: Regression and trust-boundary verification

**Files:**
- No new production files unless a regression requires a scoped correction.
- Update existing test expectations only when the product change intentionally changes the asserted behavior.

**Interfaces:**
- Verifies no monetization, SEO, data, or locale regression.

- [ ] **Step 1: Run all Cold Start Funnel tests**

```bash
node --test \
  tests/lead-core.test.cjs \
  tests/lead-api.test.cjs \
  tests/lead-capture-source.test.cjs \
  tests/google-sheet-webhook.test.cjs \
  tests/cold-start-home-funnel.test.cjs \
  tests/cold-start-analytics.test.cjs
```

Expected: all PASS.

- [ ] **Step 2: Run existing Rent Check / Explorer / SEO locale regressions**

At minimum:

```bash
node --test \
  tests/explorer-pages.test.cjs \
  tests/explorer-api.test.cjs \
  tests/zh-explorer.test.cjs \
  tests/zh-locale.test.cjs \
  tests/seo-discovery.test.cjs \
  tests/v10-6-dynamic-sitemap.test.cjs \
  tests/v10-9-explorer-ranking.test.cjs
```

Expected: all PASS.

- [ ] **Step 3: Syntax-check every modified JS/CJS file**

```bash
node --check lead-capture.js
node --check api/lead.js
node --check lib/lead-core.cjs
node --check lib/lead-store.cjs
node --check app.js
node --check zh/app.js
node --check tools/seoul-rent-check/app.js
node --check zh/tools/seoul-rent-check/app.js
```

Expected: exit code 0 for each.

- [ ] **Step 4: Verify the monetization boundary**

```bash
grep -RniE "affiliate|referral|sponsored|wise|commission" \
  index.html zh/index.html lead-capture.js api/lead.js \
  tools/seoul-rent-check zh/tools/seoul-rent-check
```

Expected: no new monetization CTA in the funnel or verdict path.

- [ ] **Step 5: Verify Japanese was not accidentally shipped**

```bash
find . -maxdepth 3 \( -path "./ja" -o -path "./ja/*" \)
```

Expected: no new Japanese site tree.

- [ ] **Step 6: Verify no secret is client-visible**

```bash
grep -RniE "LEAD_SHEET_WEBHOOK_URL|LEAD_SHEET_SHARED_SECRET|script\.google\.com/macros" \
  index.html zh/index.html lead-capture.js tools zh
```

Expected: no matches in browser-delivered files.

- [ ] **Step 7: Produce one combined deployment patch**

Include:
- all modified/new production files
- all new tests
- Apps Script
- operations guide
- spec
- implementation plan
- `PATCH-README.txt` listing environment variables and verification results

Do not include real secrets or a real Apps Script deployment URL.

---

## Self-Review

### Spec coverage

Covered:
- funnel-first homepage: Tasks 7–8
- result-before-email rule: Tasks 5–8
- Google Sheet architecture: Tasks 2–4
- optional help request: Tasks 1, 5
- PII-free GA4: Tasks 6, 9
- EN/ZH only, Japanese deferred: Global Constraints, Tasks 1, 10
- SEO preservation: Task 10
- no monetization in verdict path: Task 10
- replaceable storage layer: Task 2
- storage failure does not invalidate Rent Check: Tasks 3, 5
- future service cards demoted from homepage: Task 7

### Placeholder scan

No implementation placeholders or undefined task dependencies remain.

### Interface consistency

- Browser result event name is consistently `khg:rent-check-result`.
- Locale values are consistently `en` / `zh-CN`.
- API accepts `kind:'lead_capture' | 'help_request'`.
- Server storage uses normalized snake_case row schema.
- GA event names are consistent across Tasks 6 and 9.
