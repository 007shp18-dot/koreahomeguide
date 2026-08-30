# signedprice V2 Phase 1 Visible Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real signedprice Preview with a global homepage, Seoul/Singapore/Dubai market overviews, intent routes, and a comparison workspace while preserving the existing KoreaHomeGuide application and SEO surface unchanged.

**Architecture:** Add a self-contained `v2/` pnpm workspace inside the existing GitHub repository. Its Next.js App Router application deploys as an independent Vercel Preview project rooted at `v2/apps/web`; the legacy repository root remains the KoreaHomeGuide Vercel project. Shared market, rights, and readiness contracts live in focused workspace packages, and public pages render only approved static market profiles without inventing transaction values.

**Tech Stack:** pnpm 11.19.0, TypeScript, Next.js App Router, React, Zod, Vitest, Playwright, plain CSS with design tokens, Vercel Preview

**Spec:** `docs/superpowers/specs/2026-08-29-signedprice-v2-1-intelligence-marketplace-design.md`

## Global Constraints

- Brand is exactly lowercase `signedprice`; do not render DwellSpan as an active brand.
- Primary message is `Real prices. Better property decisions.`
- Supporting descriptors are `Real prices. Local rules. One property journey.` and `Real prices. Local context. One clear decision.`
- Legacy KoreaHomeGuide root files, URLs, canonical tags, hreflang, sitemaps, APIs, and Production deployment configuration remain unchanged.
- The V2 application lives entirely under `v2/` and uses a separate Vercel project/root directory.
- Initial markets are exactly `kr-seoul`, `sg-singapore`, and `ae-dubai`.
- English routes have no locale prefix. Chinese and Korean locale routing are outside this Phase 1 slice.
- Public route shapes are `/kr/seoul/`, `/sg/singapore/`, `/ae/dubai/`, and their `/rent/`, `/buy/`, and `/invest/` children.
- No account, enquiry form, partner submission, payment, listing publication, or personal-data collection is added.
- Missing data rights are false. Rights-blocked capabilities are labelled and do not produce indexable detail pages.
- No fake price, yield, tax, transaction, inventory, or partner count is displayed.
- Every V2 page emits `noindex,follow` until signedprice domain, rights, content, and migration readiness are approved.
- Phase 1 may create a Vercel Preview project after the branch passes its release gate; it must not attach `signedprice.com`, promote to Production, change DNS, or modify the legacy Production project.
- The supplied signedprice logo ZIP is not present in this workspace. Use a typographic lowercase wordmark; asset replacement is a separate bounded task after the user reattaches the source logo.

---

### Task 1: Scaffold an isolated V2 workspace without touching the legacy root runtime

**Files:**
- Create: `v2/package.json`
- Create: `v2/pnpm-lock.yaml`
- Create: `v2/pnpm-workspace.yaml`
- Create: `v2/tsconfig.base.json`
- Create: `v2/vitest.config.ts`
- Create: `v2/apps/web/package.json`
- Create: `v2/apps/web/next.config.ts`
- Create: `v2/apps/web/tsconfig.json`
- Create: `v2/apps/web/app/layout.tsx`
- Create: `v2/apps/web/app/page.tsx`
- Create: `v2/apps/web/app/globals.css`
- Create: `v2/apps/web/public/.gitkeep`
- Create: `v2/tests/workspace.test.ts`
- Create: `.github/workflows/signedprice-v2-ci.yml`
- Test: `v2/tests/workspace.test.ts`

**Interfaces:**
- Produces root V2 commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`.
- Produces the Next.js application package `@signedprice/web`.
- Preserves the root `package.json`, `vercel.json`, and legacy build contract byte-for-byte.

- [ ] **Step 1: Write the failing isolation test**

```ts
import { describe, expect, it } from 'vitest';
import v2Package from '../package.json';
import legacyPackage from '../../package.json';

describe('signedprice V2 workspace', () => {
  it('owns an independent release gate', () => {
    expect(v2Package.name).toBe('signedprice-platform');
    expect(v2Package.packageManager).toBe('pnpm@11.19.0');
    expect(Object.keys(v2Package.scripts)).toEqual(
      expect.arrayContaining(['lint', 'typecheck', 'test', 'build', 'e2e']),
    );
  });

  it('does not convert the legacy root into a workspace', () => {
    expect(legacyPackage.name).toBe('koreahomeguide');
    expect(legacyPackage).not.toHaveProperty('workspaces');
  });
});
```

- [ ] **Step 2: Run the test before scaffolding**

Run: `cd v2 && pnpm exec vitest run tests/workspace.test.ts`

Expected: FAIL because `v2/package.json` and the web application do not exist.

- [ ] **Step 3: Scaffold the nested workspace**

Create `v2/package.json` with these scripts and pin the exact package versions resolved into `v2/pnpm-lock.yaml`:

```json
{
  "name": "signedprice-platform",
  "private": true,
  "packageManager": "pnpm@11.19.0",
  "scripts": {
    "lint": "pnpm --filter @signedprice/web lint",
    "typecheck": "pnpm -r typecheck",
    "test": "vitest run",
    "build": "pnpm --filter @signedprice/web build",
    "e2e": "playwright test"
  }
}
```

Use `pnpm dlx create-next-app@latest apps/web --ts --eslint --app --no-tailwind --src-dir=false --use-pnpm --import-alias='@/*'`, remove generated demo copy, and set `v2/apps/web/package.json` name to `@signedprice/web`. Do not run scaffolding from the repository root.

Add `vitest`, `@playwright/test`, `typescript`, and `zod` as V2 workspace development/runtime dependencies with `pnpm add -Dw vitest @playwright/test typescript` and `pnpm add -w zod`. Configure `v2/tsconfig.base.json` with `strict: true`, `resolveJsonModule: true`, `noUncheckedIndexedAccess: true`, and `moduleResolution: "Bundler"`. Configure `v2/pnpm-workspace.yaml` with both `apps/*` and `packages/*` so Task 2 packages resolve without changing the legacy root.

- [ ] **Step 4: Add CI scoped to `v2/**`**

The workflow uses `pnpm/action-setup`, Node 24, `pnpm install --frozen-lockfile`, and runs lint, typecheck, test, and build with `working-directory: v2`. It must not replace or modify existing legacy workflows.

- [ ] **Step 5: Run the workspace gate**

Run: `cd v2 && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`

Expected: PASS and `.next` output is produced only under `v2/apps/web`.

- [ ] **Step 6: Run the legacy isolation gate**

Run: `node scripts/v2-migration/verify-phase-0.cjs && git diff --check`

Expected: Phase 0 returns `ok:true` with `890/867/23`; legacy artifacts and source contracts have no mismatch.

- [ ] **Step 7: Commit the workspace**

```bash
git add v2 .github/workflows/signedprice-v2-ci.yml
git commit -m "chore: scaffold isolated signedprice web app"
```

### Task 2: Define market, rights, readiness, and navigation contracts

**Files:**
- Create: `v2/packages/market-core/package.json`
- Create: `v2/packages/market-core/tsconfig.json`
- Create: `v2/packages/market-core/src/markets.ts`
- Create: `v2/packages/market-core/src/rights.ts`
- Create: `v2/packages/market-core/src/readiness.ts`
- Create: `v2/packages/market-core/src/routes.ts`
- Create: `v2/packages/market-core/src/index.ts`
- Create: `v2/packages/market-core/test/markets.test.ts`
- Modify: `v2/pnpm-workspace.yaml`
- Modify: `v2/apps/web/package.json`

**Interfaces:**
- Produces `MarketId = 'kr-seoul' | 'sg-singapore' | 'ae-dubai'`.
- Produces `Intent = 'rent' | 'buy' | 'invest'`.
- Produces `MarketProfile`, `CapabilityState`, `RightsPolicy`, `RouteReadiness`.
- Produces `getMarketProfile(marketId)`, `getMarketByRoute(country, city)`, `getIntentHref(marketId, intent)`, and `evaluateReadiness(input)`.

- [ ] **Step 1: Write failing market-contract tests**

```ts
import { describe, expect, it } from 'vitest';
import { evaluateReadiness, getIntentHref, getMarketByRoute, getMarketProfile } from '../src';

describe('market contracts', () => {
  it('keeps exactly three initial markets', () => {
    expect(['kr-seoul', 'sg-singapore', 'ae-dubai'].map(getMarketProfile)).toHaveLength(3);
  });

  it('keeps intent separate from market identity', () => {
    expect(getIntentHref('ae-dubai', 'invest')).toBe('/ae/dubai/invest/');
    expect(getMarketByRoute('ae', 'dubai')?.id).toBe('ae-dubai');
  });

  it('denies indexing until every readiness condition passes', () => {
    expect(evaluateReadiness({ contentReady: true, rightsCanIndex: false, domainReady: false }))
      .toBe('noindex');
  });
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `cd v2 && pnpm exec vitest run packages/market-core/test/markets.test.ts`

Expected: FAIL because the market-core exports do not exist.

- [ ] **Step 3: Implement explicit market profiles**

Each profile contains only approved, non-invented content:

```ts
type MarketProfile = {
  id: MarketId;
  countryCode: 'kr' | 'sg' | 'ae';
  citySlug: 'seoul' | 'singapore' | 'dubai';
  cityName: string;
  nativeCurrency: 'KRW' | 'SGD' | 'AED';
  productDepth: 'full_product' | 'market_intelligence';
  dataLabel: string;
  limitations: string[];
  capabilities: Record<'rent' | 'buy' | 'invest', CapabilityState>;
};
```

Seoul is `full_product`. Singapore and Dubai are `market_intelligence`. Singapore private-residential detail and Dubai transaction detail remain `rights_blocked`; do not replace them with synthetic data.

- [ ] **Step 4: Implement deny-by-default readiness**

```ts
export function evaluateReadiness(input: {
  contentReady: boolean;
  rightsCanIndex: boolean;
  domainReady: boolean;
}): RouteReadiness {
  return input.contentReady && input.rightsCanIndex && input.domainReady
    ? 'indexable'
    : 'noindex';
}
```

- [ ] **Step 5: Run contract tests and typecheck**

Run: `cd v2 && pnpm exec vitest run packages/market-core && pnpm --filter @signedprice/market-core typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the market kernel slice**

```bash
git add v2/packages/market-core v2/pnpm-workspace.yaml v2/apps/web/package.json v2/pnpm-lock.yaml
git commit -m "feat: define signedprice market readiness contracts"
```

### Task 3: Build the signedprice global homepage and design system

**Files:**
- Create: `v2/apps/web/components/site-header.tsx`
- Create: `v2/apps/web/components/market-card.tsx`
- Create: `v2/apps/web/components/intent-tabs.tsx`
- Create: `v2/apps/web/components/trust-strip.tsx`
- Create: `v2/apps/web/components/site-footer.tsx`
- Create: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/app/layout.tsx`
- Modify: `v2/apps/web/app/page.tsx`
- Modify: `v2/apps/web/app/globals.css`
- Create: `v2/apps/web/test/home-content.test.ts`

**Interfaces:**
- Consumes `MarketProfile` and `getIntentHref` from `@signedprice/market-core`.
- Produces accessible components used by the market pages.
- Produces the first visible signedprice route at `/`.

- [ ] **Step 1: Write the failing content-contract test**

```ts
import { describe, expect, it } from 'vitest';
import { homepageCopy } from '../lib/site-copy';

describe('signedprice homepage copy', () => {
  it('uses the approved identity and avoids unsupported claims', () => {
    expect(homepageCopy.brand).toBe('signedprice');
    expect(homepageCopy.headline).toBe('Real prices. Better property decisions.');
    expect(homepageCopy.marketIds).toEqual(['kr-seoul', 'sg-singapore', 'ae-dubai']);
    expect(JSON.stringify(homepageCopy)).not.toMatch(/millions of listings|guaranteed return|licensed broker/i);
  });
});
```

- [ ] **Step 2: Run the content test and verify failure**

Run: `cd v2 && pnpm exec vitest run apps/web/test/home-content.test.ts`

Expected: FAIL because `site-copy.ts` does not exist.

- [ ] **Step 3: Implement the visual thesis**

Use a calm editorial intelligence aesthetic: warm off-white background, ink text, restrained cobalt accent, lime status accent only for verified/available states, square-to-soft `12px` radii, thin borders, and Geist typography. Avoid oversized gradients, glass cards, capsule-heavy controls, stock-property photography, fake dashboards, and decorative maps.

The first viewport contains:

1. lowercase typographic `signedprice` wordmark;
2. headline `Real prices. Better property decisions.`;
3. one-sentence explanation of official/rights-cleared market intelligence;
4. Rent, Buy, Invest intent navigation; and
5. three market cards with honest product-depth and rights labels.

Below the fold, add `Market truth`, `Decision tools`, and `Verified connections` pillars, followed by the methodology trust strip. Do not add enquiry buttons.

- [ ] **Step 4: Implement metadata and noindex**

`layout.tsx` exports title `signedprice | Real prices. Better property decisions.`, a precise description, and robots `{ index: false, follow: true }`. Do not emit canonical or hreflang before the signedprice domain gate.

- [ ] **Step 5: Run unit, lint, typecheck, and build gates**

Run: `cd v2 && pnpm test && pnpm lint && pnpm typecheck && pnpm build`

Expected: PASS; the generated homepage contains all three market links and `noindex,follow`.

- [ ] **Step 6: Commit the visible homepage**

```bash
git add v2/apps/web
git commit -m "feat: build signedprice global homepage"
```

### Task 4: Build market overview, intent, and comparison routes

**Files:**
- Create: `v2/apps/web/app/[country]/[city]/page.tsx`
- Create: `v2/apps/web/app/[country]/[city]/[intent]/page.tsx`
- Create: `v2/apps/web/app/compare/page.tsx`
- Create: `v2/apps/web/components/market-hero.tsx`
- Create: `v2/apps/web/components/capability-grid.tsx`
- Create: `v2/apps/web/components/market-limitations.tsx`
- Create: `v2/apps/web/components/comparison-matrix.tsx`
- Create: `v2/apps/web/lib/route-model.ts`
- Create: `v2/apps/web/test/route-model.test.ts`
- Create: `v2/apps/web/app/not-found.tsx`

**Interfaces:**
- Consumes `getMarketByRoute`, `getMarketProfile`, `getIntentHref`, and `evaluateReadiness`.
- Produces exactly three market overviews, nine intent routes, and `/compare/`.
- Unknown country, city, or intent returns `notFound()`.

- [ ] **Step 1: Write failing route-model tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildMarketPageModel } from '../lib/route-model';

describe('market page model', () => {
  it('builds Seoul as a full product without inventing figures', () => {
    const model = buildMarketPageModel('kr', 'seoul');
    expect(model.productDepth).toBe('full_product');
    expect(model.serialized).not.toMatch(/median|yield|transaction count/i);
  });

  it('labels blocked detail honestly', () => {
    const model = buildMarketPageModel('ae', 'dubai');
    expect(model.capabilities.some((item) => item.state === 'rights_blocked')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the route tests and verify failure**

Run: `cd v2 && pnpm exec vitest run apps/web/test/route-model.test.ts`

Expected: FAIL because the route model and pages do not exist.

- [ ] **Step 3: Implement market overviews**

Each page shows market name, product depth, native currency, supported intents, official/licensed source posture, known limitations, and next available action. Seoul links to the existing KoreaHomeGuide Explorer with clear cross-brand text. Singapore identifies HDB public intelligence separately from rights-gated private residential detail. Dubai identifies area/project intelligence separately from rights-gated transaction and partner detail.

- [ ] **Step 4: Implement intent routes**

Rent, Buy, and Invest pages explain what signedprice will compare, which source classes are usable, and which capability is blocked. They are real navigable pages, not empty placeholders, but display no unsupported metric or enquiry form.

- [ ] **Step 5: Implement the comparison matrix**

Rows are `Rent evidence`, `Sale evidence`, `Foreign-buyer rules`, `Ownership costs`, `Yield analysis`, and `Full local workflow`. Cells render `available`, `limited`, or `rights blocked` with explanatory text. The table never reduces missing data to zero and never combines HDB with private residential.

- [ ] **Step 6: Run route tests and production build**

Run: `cd v2 && pnpm test && pnpm lint && pnpm typecheck && pnpm build`

Expected: PASS; all thirteen public routes build, unknown routes return 404, and all pages remain `noindex,follow`.

- [ ] **Step 7: Commit the market experience**

```bash
git add v2/apps/web
git commit -m "feat: add signedprice market and comparison pages"
```

### Task 5: Add browser release evidence and create an independent Vercel Preview

**Files:**
- Create: `v2/playwright.config.ts`
- Create: `v2/tests/e2e/visible-foundation.spec.ts`
- Create: `v2/apps/web/app/api/status/route.ts`
- Create: `v2/apps/web/lib/release-status.ts`
- Create: `v2/apps/web/test/release-status.test.ts`
- Create: `docs/operations/signedprice-v2-phase-1-preview-gate.md`

**Interfaces:**
- Produces `GET /api/status` with public commit, environment, markets, and readiness only.
- Produces a browser contract for desktop and mobile navigation.
- Produces an independent Vercel Preview rooted at `v2/apps/web`.

- [ ] **Step 1: Write failing release-status and browser tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildReleaseStatus } from '../lib/release-status';

describe('release status', () => {
  it('exposes public readiness without secrets', () => {
    const status = buildReleaseStatus({ commit: 'abc123', environment: 'preview' });
    expect(status.markets).toEqual(['kr-seoul', 'sg-singapore', 'ae-dubai']);
    expect(JSON.stringify(status)).not.toMatch(/token|secret|password|apiKey/i);
  });
});
```

```ts
test('navigates the first signedprice decision flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Real prices. Better property decisions.' })).toBeVisible();
  await page.getByRole('link', { name: /Seoul/ }).click();
  await expect(page).toHaveURL(/\/kr\/seoul\/$/);
  await page.getByRole('link', { name: /Compare markets/ }).click();
  await expect(page).toHaveURL(/\/compare\/$/);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `cd v2 && pnpm exec vitest run apps/web/test/release-status.test.ts && pnpm e2e tests/e2e/visible-foundation.spec.ts`

Expected: FAIL because the status route and browser contract do not exist.

- [ ] **Step 3: Implement public release status**

Return only `brand`, `commit`, `environment`, `markets`, and `indexing: 'blocked'`. Read `VERCEL_GIT_COMMIT_SHA` and `VERCEL_ENV` through a narrow adapter and use `local` when absent. Do not serialize the process environment.

- [ ] **Step 4: Run the complete dual-product gate**

Run:

```bash
cd v2
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e tests/e2e/visible-foundation.spec.ts
cd ..
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

Expected: V2 commands pass, Phase 0 returns `ok:true` with the approved legacy failure identity, and the legacy root has no contract mismatch.

- [ ] **Step 5: Commit the release gate**

```bash
git add v2 docs/operations/signedprice-v2-phase-1-preview-gate.md
git commit -m "test: verify signedprice visible foundation"
```

- [ ] **Step 6: Run independent code and visual review**

Review the complete branch for Critical/Important defects. Then deploy a Vercel Preview from `v2/apps/web`, verify `READY`, check build errors and Preview 5xx, and run one desktop plus one mobile browser pass over `/`, `/kr/seoul/`, `/sg/singapore/`, `/ae/dubai/`, and `/compare/`.

- [ ] **Step 7: Preserve the authorization boundary**

Keep the branch in Draft after Preview verification. Do not merge to `main`, attach `signedprice.com`, promote the Preview, change the legacy Vercel project, or add redirects until the user approves the visible Preview.

## Release Acceptance

- The user can open a real signedprice Preview and navigate the global homepage, three market overviews, nine intent pages, and comparison page.
- The interface visibly distinguishes Seoul Full Product from Singapore/Dubai Market Intelligence.
- No fake figures, fake listings, fake partners, or unsupported legal claims appear.
- Every page remains `noindex,follow` and emits no premature canonical.
- The existing KoreaHomeGuide Production and Phase 0 contract remain unchanged.
- V2 lint, typecheck, unit tests, build, and browser tests pass.
- Preview build errors and observed Preview 5xx are zero.
- The branch remains unmerged until the user reviews the visible Preview.
