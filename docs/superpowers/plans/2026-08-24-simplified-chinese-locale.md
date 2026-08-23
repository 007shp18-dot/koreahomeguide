# Simplified Chinese Locale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a fully usable Simplified Chinese KoreaHomeGuide page at `/zh/` with localized core flows and correct multilingual SEO.

**Architecture:** Keep the English page and all backend APIs unchanged. Add locale-specific Chinese HTML and UI JavaScript while reusing root CSS and shared calculation/data utilities through absolute paths; add reciprocal hreflang and sitemap entries.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Vercel Functions, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-24-simplified-chinese-locale-design.md`

## Global Constraints
- English canonical remains `https://koreahomeguide.com/`.
- Chinese canonical is `https://koreahomeguide.com/zh/`.
- Locale is Simplified Chinese (`zh-CN`).
- Reuse existing backend APIs unchanged.
- Keep GA4 measurement ID `G-6SXH5BREDP` on both locales.
- Do not introduce a frontend framework or new dependency.

---

### Task 1: Multilingual SEO and language navigation

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `sitemap.xml`
- Test: `tests/zh-locale.test.cjs`

**Interfaces:**
- Consumes: existing English HTML/CSS.
- Produces: `/zh/` language navigation contract and reciprocal SEO metadata consumed by Task 2.

- [x] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('English page advertises the Chinese alternate and sitemap lists /zh/', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  assert.match(html, /hreflang="zh-CN"[^>]+https:\/\/koreahomeguide\.com\/zh\//);
  assert.match(html, /href="\/zh\/"[^>]*>中文</);
  assert.match(sitemap, /<loc>https:\/\/koreahomeguide\.com\/zh\/<\/loc>/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/zh-locale.test.cjs`
Expected: FAIL because the alternate locale and sitemap entry do not exist yet.

- [x] **Step 3: Write minimal implementation**

Add reciprocal locale links to English `<head>`, add an `EN / 中文` header switch, style `.language-switch`, and add `/zh/` to `sitemap.xml`.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/zh-locale.test.cjs`
Expected: PASS for the English SEO/navigation test.

### Task 2: Chinese static page

**Files:**
- Create: `zh/index.html`
- Test: `tests/zh-locale.test.cjs`

**Interfaces:**
- Consumes: shared root `/styles.css`, shared utility scripts, and existing DOM IDs.
- Produces: Chinese DOM with the same IDs expected by the localized app script.

- [x] **Step 1: Extend the failing test**

Add assertions that `zh/index.html` exists, declares `lang="zh-CN"`, uses canonical `/zh/`, includes reciprocal hreflang, includes GA4 ID, contains `检查这个租金`, and links back to `/` as `EN`.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/zh-locale.test.cjs`
Expected: FAIL because `zh/index.html` does not exist.

- [x] **Step 3: Write minimal implementation**

Create the Chinese page by preserving the existing DOM structure/IDs and translating the visible copy for search, Rent Check, official prices, calculator, guide summaries, notices, tables, and footer.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/zh-locale.test.cjs`
Expected: PASS for static Chinese page assertions.

### Task 3: Localized dynamic behavior

**Files:**
- Create: `zh/app.js`
- Create: `zh/rent-check-ui-utils.js`
- Modify: `zh/index.html`
- Test: `tests/zh-locale.test.cjs`

**Interfaces:**
- Consumes: `KHGRealPrices`, `KHGBrokerage`, `KHGApiErrors`, `/api/real-prices`, `/api/rent-check`.
- Produces: Chinese search cards, validation messages, Rent Check verdicts, comparison statuses, real-price statuses, and calculator formula copy.

- [x] **Step 1: Extend the failing test**

Assert that `zh/app.js` includes Chinese dynamic phrases such as `正在查找类似的官方成交记录` and `已加载`, and `zh/rent-check-ui-utils.js` maps `above` to `高于近期成交水平` and `fair` to `价格合理`.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/zh-locale.test.cjs`
Expected: FAIL because localized runtime scripts do not exist.

- [x] **Step 3: Write minimal implementation**

Create localized runtime files by retaining the existing behavior and endpoint contracts while replacing user-facing strings and neighborhood copy with Simplified Chinese.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/zh-locale.test.cjs`
Expected: PASS.

### Task 4: Full regression verification and package

**Files:**
- Verify: all `.js` / `.cjs` files
- Package: `koreahomeguide-v7-zh.zip`

**Interfaces:**
- Consumes: completed locale implementation.
- Produces: upload-ready artifact.

- [x] **Step 1: Run locale tests**

Run: `node --test tests/zh-locale.test.cjs`
Expected: all tests PASS.

- [x] **Step 2: Run JavaScript syntax checks**

Run: `find . -type f \( -name '*.js' -o -name '*.cjs' \) -print0 | xargs -0 -n1 node --check`
Expected: exit code 0.

- [x] **Step 3: Confirm APIs are byte-identical to v6.1 source**

Run checksums for `api/*.js` and `lib/*.cjs` against the extracted v6.1 source and confirm no backend changes.

- [x] **Step 4: Build and verify ZIP**

Run: `zip -qr ../koreahomeguide-v7-zh.zip . && unzip -t ../koreahomeguide-v7-zh.zip`
Expected: archive integrity OK.
