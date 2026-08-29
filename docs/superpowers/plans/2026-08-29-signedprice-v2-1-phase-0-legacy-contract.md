# signedprice V2.1 Phase 0 Legacy Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a reproducible, versioned contract for KoreaHomeGuide routes, SEO metadata, APIs, calculations, critical browser behaviour, and the approved signedprice brand before V2.1 implementation starts.

**Architecture:** Add read-only inventory scripts and contract tests to the legacy repository. Generated JSON snapshots become the migration source of truth; scripts must not call mutation endpoints or modify production.

**Tech Stack:** Node.js CommonJS, built-in `node:test`, existing static application, Playwright for live read-only capture

**Spec:** `docs/superpowers/specs/2026-08-29-signedprice-v2-1-intelligence-marketplace-design.md`

## Global Constraints

- Legacy production baseline is commit `188f30fedf73367dbe564f8fcc458c98df205050`.
- Do not modify GitHub `main`, Vercel Production, redirects, canonical tags, or sitemaps during this phase.
- Classify the 23 known pre-existing failures separately from new failures.
- Never write credentials, raw environment variables, or private upstream payloads into snapshots.
- Production browser work is read-only and rate-limited to one request at a time.
- The approved public brand is lowercase `signedprice` and the primary domain is `signedprice.com`.
- The founder-provided logo package is the canonical visual source; Phase 0 records its contract but does not deploy it.
- The 5% Korea deposit adjustment is a signedprice comparison assumption, not a fixed statutory conversion rate.

---

### Task 1: Inventory schema and route collector

**Files:**
- Create: `scripts/v2-migration/inventory-schema.cjs`
- Create: `scripts/v2-migration/collect-static-routes.cjs`
- Create: `tests/v2-migration-inventory.test.cjs`
- Create: `artifacts/v2-migration/legacy-static-routes.json`

**Interfaces:**
- Produces: `collectStaticRoutes(rootDir): LegacyRoute[]`
- Produces: `validateLegacyRoute(value): void`
- Produces: `LegacyRoute = { path, sourceFile, kind, locales }`

- [ ] **Step 1: Write the failing route inventory test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { collectStaticRoutes } = require('../scripts/v2-migration/collect-static-routes.cjs');

test('collects stable public routes without test or artifact paths', () => {
  const routes = collectStaticRoutes(process.cwd());
  assert.ok(routes.some((route) => route.path === '/explore/'));
  assert.ok(routes.some((route) => route.path === '/tools/seoul-rent-check/'));
  assert.equal(routes.some((route) => route.path.startsWith('/tests/')), false);
  assert.deepEqual([...routes].sort((a, b) => a.path.localeCompare(b.path)), routes);
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `node --test tests/v2-migration-inventory.test.cjs`

Expected: FAIL with `Cannot find module '../scripts/v2-migration/collect-static-routes.cjs'`.

- [ ] **Step 3: Implement deterministic collection and validation**

```js
function validateLegacyRoute(route) {
  if (!route.path.startsWith('/') || !route.sourceFile.endsWith('index.html')) {
    throw new TypeError('Invalid LegacyRoute');
  }
}

function collectStaticRoutes(rootDir) {
  return walkHtml(rootDir)
    .filter((file) => file.endsWith('/index.html') || file === 'index.html')
    .filter((file) => !file.startsWith('tests/') && !file.startsWith('artifacts/'))
    .map(toLegacyRoute)
    .sort((a, b) => a.path.localeCompare(b.path));
}
```

The executable writes the JSON file with two-space indentation and a terminal newline.

- [ ] **Step 4: Generate and verify the inventory**

Run: `node scripts/v2-migration/collect-static-routes.cjs --write artifacts/v2-migration/legacy-static-routes.json && node --test tests/v2-migration-inventory.test.cjs`

Expected: PASS and the snapshot contains `/`, `/explore/`, and `/tools/seoul-rent-check/`.

- [ ] **Step 5: Commit the route inventory**

```bash
git add scripts/v2-migration/inventory-schema.cjs scripts/v2-migration/collect-static-routes.cjs tests/v2-migration-inventory.test.cjs artifacts/v2-migration/legacy-static-routes.json
git commit -m "test: inventory legacy public routes"
```

### Task 2: SEO and dynamic-route contract capture

**Files:**
- Create: `scripts/v2-migration/collect-seo-contracts.cjs`
- Create: `tests/v2-migration-seo-contract.test.cjs`
- Create: `artifacts/v2-migration/legacy-seo-contracts.json`
- Read: `seo/seo-route-utils.cjs`
- Read: `api/seo-building-page.js`
- Read: `api/seo-dong-page.js`
- Read: `api/sitemap-market.js`

**Interfaces:**
- Consumes: `LegacyRoute` from Task 1
- Produces: `SeoContract = { path, canonical, alternates, title, description, robots, schemaTypes, sitemapSources }`
- Produces: `collectSeoContracts(rootDir, routes): SeoContract[]`

- [ ] **Step 1: Write the failing SEO contract test**

```js
test('every indexable route has one canonical and non-empty title', () => {
  const contracts = collectSeoContracts(process.cwd(), routes);
  for (const page of contracts.filter((item) => item.robots !== 'noindex')) {
    assert.match(page.canonical, /^https:\/\/koreahomeguide\.com\//);
    assert.equal(page.title.trim().length > 0, true);
  }
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/v2-migration-seo-contract.test.cjs`

Expected: FAIL because `collectSeoContracts` is not defined.

- [ ] **Step 3: Implement HTML and dynamic SEO extraction**

```js
const contract = {
  path: route.path,
  canonical: readLink(html, 'canonical'),
  alternates: readAlternates(html),
  title: readTag(html, 'title'),
  description: readMeta(html, 'description'),
  robots: readMeta(html, 'robots') || 'index,follow',
  schemaTypes: readJsonLdTypes(html),
  sitemapSources: findSitemapMembership(route.path, rootDir),
};
```

Dynamic API routes are captured as route templates with representative, non-personal test fixtures.

- [ ] **Step 4: Generate and verify the SEO snapshot**

Run: `node scripts/v2-migration/collect-seo-contracts.cjs --routes artifacts/v2-migration/legacy-static-routes.json --write artifacts/v2-migration/legacy-seo-contracts.json && node --test tests/v2-migration-seo-contract.test.cjs`

Expected: PASS with stable sorted output.

- [ ] **Step 5: Commit the SEO contract**

```bash
git add scripts/v2-migration/collect-seo-contracts.cjs tests/v2-migration-seo-contract.test.cjs artifacts/v2-migration/legacy-seo-contracts.json
git commit -m "test: capture legacy SEO contracts"
```

### Task 3: API and calculation contract snapshots

**Files:**
- Create: `scripts/v2-migration/collect-api-contracts.cjs`
- Create: `tests/v2-migration-api-contract.test.cjs`
- Create: `artifacts/v2-migration/legacy-api-contracts.json`
- Create: `artifacts/v2-migration/korea-calculation-fixtures.json`
- Read: `deposit-conversion.js`
- Read: `lib/rent-check-core.cjs`
- Read: `api/*.js`

**Interfaces:**
- Produces: `ApiContract = { route, methods, requiredInputs, responseKeys, errorCodes }`
- Produces: `CalculationFixture = { depositKrw, monthlyRentKrw, areaSqm, annualRate, adjustedMonthlyKrw, adjustedPerSqmKrw }`

- [ ] **Step 1: Write failing calculation and API assertions**

```js
test('locks the Korea five-percent deposit policy', () => {
  const fixture = calculateFixture({ depositKrw: 100_000_000, monthlyRentKrw: 1_000_000, areaSqm: 50, annualRate: 0.05 });
  assert.equal(fixture.adjustedMonthlyKrw, 1_416_667);
  assert.equal(fixture.adjustedPerSqmKrw, 28_333);
});

test('captures all eleven Vercel API functions', () => {
  assert.equal(collectApiContracts(process.cwd()).length, 11);
});
```

- [ ] **Step 2: Run and verify the expected failures**

Run: `node --test tests/v2-migration-api-contract.test.cjs`

Expected: FAIL because the collector and fixture calculator do not exist.

- [ ] **Step 3: Implement redacted API inspection and calculation fixtures**

```js
function calculateFixture(input) {
  const adjusted = input.monthlyRentKrw + (input.depositKrw * input.annualRate) / 12;
  return {
    ...input,
    adjustedMonthlyKrw: Math.round(adjusted),
    adjustedPerSqmKrw: Math.round(adjusted / input.areaSqm),
  };
}
```

The API collector reads exported handlers and source contracts without invoking mutating endpoints. It records field names and status codes, never secret values.

- [ ] **Step 4: Generate snapshots and run focused legacy tests**

Run: `node scripts/v2-migration/collect-api-contracts.cjs --write artifacts/v2-migration/legacy-api-contracts.json --fixtures artifacts/v2-migration/korea-calculation-fixtures.json && node --test tests/v2-migration-api-contract.test.cjs tests/adjusted-per-sqm.test.cjs tests/rent-market-core.test.cjs tests/rent-check-coverage.test.cjs`

Expected: all selected tests PASS.

- [ ] **Step 5: Commit API and calculation contracts**

```bash
git add scripts/v2-migration/collect-api-contracts.cjs tests/v2-migration-api-contract.test.cjs artifacts/v2-migration/legacy-api-contracts.json artifacts/v2-migration/korea-calculation-fixtures.json
git commit -m "test: lock legacy API and calculation contracts"
```

### Task 4: Read-only production browser baseline

**Files:**
- Create: `tests/e2e/legacy-production-baseline.spec.ts`
- Create: `playwright.legacy.config.ts`
- Create: `artifacts/v2-migration/legacy-browser-baseline.json`
- Create: `docs/operations/v2-legacy-baseline.md`
- Modify: `package.json`
- Create: `package-lock.json`

**Interfaces:**
- Consumes: production URL and representative Dongjak-gu fixture
- Produces: viewport, selection-stability, modal, Street View, Rent Check, status-code, and disclosure evidence

- [ ] **Step 1: Write the browser contract**

```ts
test('neighborhood selection survives map idle time', async ({ page }) => {
  await page.goto('/explore/?lawdCd=11590&type=officetel');
  await page.getByRole('button', { name: /노량진동|Noryangjin-dong/ }).click();
  await expect(page).toHaveURL(/dong=/);
  await page.waitForTimeout(10_000);
  await expect(page).toHaveURL(/dong=/);
  await expect(page.locator('.building-row[data-building-key]')).toHaveCount(7);
});
```

- [ ] **Step 2: Run against a deliberately invalid base URL**

Run: `npm install --save-dev @playwright/test && npx playwright install chromium && LEGACY_BASE_URL=http://127.0.0.1:9 npx playwright test -c playwright.legacy.config.ts`

Expected: FAIL with connection refused, proving the test reaches the configured target.

- [ ] **Step 3: Add read-only evidence capture**

```ts
const evidence = {
  capturedAt: new Date().toISOString(),
  url: page.url(),
  mapBox: await page.locator('#explorerMap').boundingBox(),
  buildingCount: await page.locator('.building-row[data-building-key]').count(),
};
```

Write evidence only to the configured artifact path. Do not submit forms, create leads, or mutate user data.

- [ ] **Step 4: Run the production baseline and legacy suite classification**

Run: `LEGACY_BASE_URL=https://koreahomeguide.com npx playwright test -c playwright.legacy.config.ts && bash -lc 'set +e; node --test tests/*.test.cjs > artifacts/v2-migration/legacy-test-baseline.txt 2>&1; code=$?; test "$code" -ne 0'`

Expected: browser baseline PASS; the legacy suite output is saved and its non-zero result is explicitly classified against the known 23 failures in `docs/operations/v2-legacy-baseline.md`.

- [ ] **Step 5: Commit baseline evidence and classification**

```bash
git add tests/e2e/legacy-production-baseline.spec.ts playwright.legacy.config.ts artifacts/v2-migration/legacy-browser-baseline.json artifacts/v2-migration/legacy-test-baseline.txt docs/operations/v2-legacy-baseline.md package.json package-lock.json
git commit -m "test: freeze KoreaHomeGuide production contract"
```

### Task 5: Phase 0 verification gate

**Files:**
- Create: `scripts/v2-migration/verify-phase-0.cjs`
- Create: `tests/v2-migration-phase-0-gate.test.cjs`
- Modify: `docs/operations/v2-legacy-baseline.md`

**Interfaces:**
- Produces: `verifyPhase0(rootDir): { ok: boolean, missing: string[], mismatches: string[] }`

- [ ] **Step 1: Write a failing completeness test**

```js
test('phase zero artifacts form a complete reproducible baseline', () => {
  const result = verifyPhase0(process.cwd());
  assert.deepEqual(result, { ok: true, missing: [], mismatches: [] });
});
```

- [ ] **Step 2: Run and verify failure before the gate exists**

Run: `node --test tests/v2-migration-phase-0-gate.test.cjs`

Expected: FAIL because `verifyPhase0` is missing.

- [ ] **Step 3: Implement checksum and coverage verification**

```js
const required = [
  'legacy-static-routes.json',
  'legacy-seo-contracts.json',
  'legacy-api-contracts.json',
  'korea-calculation-fixtures.json',
  'legacy-browser-baseline.json',
  'legacy-test-baseline.txt',
];
```

The verifier regenerates deterministic inventories into a temporary directory, compares normalized JSON, and reports exact missing or changed artifacts.

- [ ] **Step 4: Run the complete Phase 0 gate**

Run: `node --test tests/v2-migration-*.test.cjs && node scripts/v2-migration/verify-phase-0.cjs && git diff --check`

Expected: PASS, `ok: true`, and no whitespace errors.

- [ ] **Step 5: Commit the gate**

```bash
git add scripts/v2-migration/verify-phase-0.cjs tests/v2-migration-phase-0-gate.test.cjs docs/operations/v2-legacy-baseline.md
git commit -m "test: enforce V2 phase zero migration gate"
```

### Task 6: Brand contract and legal-copy audit

**Files:**
- Create: `scripts/v2-migration/brand-contract.cjs`
- Create: `scripts/v2-migration/audit-methodology-copy.cjs`
- Create: `tests/v2-migration-brand-contract.test.cjs`
- Create: `artifacts/v2-migration/signedprice-brand-contract.json`
- Create: `artifacts/v2-migration/methodology-copy-audit.json`
- Create: `docs/operations/signedprice-brand-contract.md`

**Interfaces:**
- Produces: `buildBrandContract(): SignedPriceBrandContract`
- Produces: `auditMethodologyCopy(rootDir): MethodologyCopyFinding[]`
- Produces: `SignedPriceBrandContract = { brand, domain, casing, colors, descriptors, logoAssets, ogRules }`

- [ ] **Step 1: Write failing brand and methodology tests**

```js
test('locks the approved signedprice identity', () => {
  assert.deepEqual(buildBrandContract(), {
    brand: 'signedprice',
    domain: 'signedprice.com',
    casing: 'lowercase-public',
    colors: { ink:'#0f172a', white:'#ffffff', accent:'#2563eb', accentLight:'#60a5fa', muted:'#64748b' },
    descriptors: ['Real prices. Local rules. Trusted experts.', 'Global property intelligence and transaction network.'],
    logoAssets: ['logo-mark.svg', 'logo-mark-16.svg', 'logo-mark-inverse.svg', 'logo-mark-mono.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'og-image.svg'],
    ogRules: { defaultClaim: 'Property intelligence for Seoul, Singapore and Dubai', requireMarketCapabilityEvidence: true },
  });
});

test('finds the current misleading statutory-rate label', () => {
  const findings = auditMethodologyCopy(process.cwd());
  assert.ok(findings.some((item) => item.file === 'deposit-conversion.js' && item.code === 'fixed_rate_called_statutory'));
});
```

- [ ] **Step 2: Run and verify missing-module failure**

Run: `node --test tests/v2-migration-brand-contract.test.cjs`

Expected: FAIL because the brand contract and methodology auditor are missing.

- [ ] **Step 3: Implement deterministic brand and copy audit output**

```js
function buildBrandContract() {
  return Object.freeze({
    brand:'signedprice', domain:'signedprice.com', casing:'lowercase-public',
    colors:{ ink:'#0f172a', white:'#ffffff', accent:'#2563eb', accentLight:'#60a5fa', muted:'#64748b' },
    descriptors:['Real prices. Local rules. Trusted experts.', 'Global property intelligence and transaction network.'],
    logoAssets:['logo-mark.svg','logo-mark-16.svg','logo-mark-inverse.svg','logo-mark-mono.svg','favicon.svg','favicon.ico','apple-touch-icon.png','og-image.svg'],
    ogRules:{ defaultClaim:'Property intelligence for Seoul, Singapore and Dubai', requireMarketCapabilityEvidence:true },
  });
}
```

The auditor searches user-visible copy, comments, metadata, and methodology objects for fixed 5% claims described as statutory or legal. It records file, line, code, and excerpt without modifying production files.

- [ ] **Step 4: Generate and verify both artifacts**

Run: `node scripts/v2-migration/brand-contract.cjs --write artifacts/v2-migration/signedprice-brand-contract.json && node scripts/v2-migration/audit-methodology-copy.cjs --write artifacts/v2-migration/methodology-copy-audit.json && node --test tests/v2-migration-brand-contract.test.cjs && git diff --check`

Expected: PASS; brand output is stable and the current legal-copy issue is recorded as an unresolved migration finding.

- [ ] **Step 5: Commit the Phase 0 brand contract**

```bash
git add scripts/v2-migration/brand-contract.cjs scripts/v2-migration/audit-methodology-copy.cjs tests/v2-migration-brand-contract.test.cjs artifacts/v2-migration/signedprice-brand-contract.json artifacts/v2-migration/methodology-copy-audit.json docs/operations/signedprice-brand-contract.md
git commit -m "test: lock signedprice brand and methodology copy"
```
