# DwellSpan V2 Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a separately deployable V2 monorepo with global routing, typed market data, rights enforcement, versioned publication, and an index-safe web shell.

**Architecture:** A pnpm/Turborepo repository contains one Next.js App Router web application, one data-jobs application, market adapters, and focused domain packages. The web app reads only versioned published datasets and denies undeclared capabilities by default.

**Tech Stack:** TypeScript, pnpm, Turborepo, Next.js App Router, React, Zod, Vitest projects, Playwright, PostgreSQL/PostGIS, Drizzle ORM

**Spec:** `docs/superpowers/specs/2026-08-29-dwellspan-v2-global-rebuild-design.md`

## Global Constraints

- Create the V2 repository only after explicit authorization; this plan does not itself create a remote repository or Vercel project.
- DwellSpan remains a working name until the brand gate passes.
- English has no locale prefix; Chinese uses `/zh/`; Korean uses `/ko/` only when content is approved.
- Initial markets are exactly `kr-seoul`, `sg-singapore`, and `ae-dubai`.
- A missing data right is false.
- The browser never calls official government sources directly.
- No V2 page is indexable until its route-readiness and rights gates pass.
- Install with current official scaffolding, then commit exact resolved versions in `pnpm-lock.yaml` before application code is added.

Official implementation references:

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [Turborepo repository structure](https://turborepo.com/docs/crafting-your-repository/structuring-a-repository)
- [Vitest projects for monorepos](https://vitest.dev/guide/projects)
- [Playwright web server configuration](https://playwright.dev/docs/test-webserver)

---

### Task 1: Scaffold the isolated monorepo and quality gate

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/data-jobs/package.json`
- Create: `tests/smoke/workspace.test.ts`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces root commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`
- Produces workspace packages under `@dwellspan/*`

- [ ] **Step 1: Write the failing workspace smoke test**

```ts
import { describe, expect, it } from 'vitest';
import rootPackage from '../../package.json';

describe('workspace', () => {
  it('exposes all release gates', () => {
    expect(rootPackage.packageManager).toMatch(/^pnpm@/);
    expect(Object.keys(rootPackage.scripts)).toEqual(
      expect.arrayContaining(['lint', 'typecheck', 'test', 'build', 'e2e']),
    );
  });
});
```

- [ ] **Step 2: Run the smoke test before scaffolding**

Run: `pnpm exec vitest run tests/smoke/workspace.test.ts`

Expected: FAIL because the V2 workspace does not exist.

- [ ] **Step 3: Scaffold and lock the workspace**

```json
{
  "name": "dwellspan-platform",
  "private": true,
  "packageManager": "pnpm@10.15.0",
  "scripts": {
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "vitest run",
    "build": "turbo run build",
    "e2e": "playwright test"
  }
}
```

Use `pnpm dlx create-turbo@latest . --package-manager pnpm`, remove example apps, add the declared files, run `pnpm install`, and retain the generated lockfile. If the installed pnpm major differs from the declared value, update `packageManager` to the exact `pnpm --version` used before committing.

- [ ] **Step 4: Run the empty-platform quality gate**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`

Expected: all commands exit 0 and the web application renders a static shell.

- [ ] **Step 5: Commit the workspace**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json vitest.config.ts apps tests .github
git commit -m "chore: scaffold DwellSpan V2 workspace"
```

### Task 2: Define market, locale, money, area, asset, and event schemas

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/src/market.ts`
- Create: `packages/domain/src/data-state.ts`
- Create: `packages/domain/src/geo-area.ts`
- Create: `packages/domain/src/asset.ts`
- Create: `packages/domain/src/money.ts`
- Create: `packages/domain/src/area.ts`
- Create: `packages/domain/src/market-event.ts`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/test/domain.test.ts`

**Interfaces:**
- Produces: `MarketId`, `Market`, `DataState`, `GeoArea`, `Asset`, `Money`, `Area`, `MarketEvent`
- Produces: Zod schemas named `<TypeName>Schema`

- [ ] **Step 1: Write failing schema tests**

```ts
it('preserves native money and rejects an unknown area basis', () => {
  expect(MoneySchema.parse({ amount: 1200000, currency: 'KRW' })).toEqual({ amount: 1200000, currency: 'KRW' });
  expect(() => AreaSchema.parse({ value: 50, unit: 'sqm', squareMetres: 50, basis: 'usable-ish' })).toThrow();
});

it('requires provenance and rights on every market event', () => {
  expect(() => MarketEventSchema.parse({ marketId: 'kr-seoul', eventType: 'rent_contract' })).toThrow();
});
```

- [ ] **Step 2: Run the domain test and verify failure**

Run: `pnpm vitest run packages/domain/test/domain.test.ts`

Expected: FAIL because schema exports are missing.

- [ ] **Step 3: Implement the exact core unions**

```ts
export const MarketIdSchema = z.enum(['kr-seoul', 'sg-singapore', 'ae-dubai']);
export const AreaBasisSchema = z.enum(['exclusive', 'net', 'gross', 'built_up', 'transaction', 'unknown']);
export const MarketEventTypeSchema = z.enum([
  'rent_contract', 'sale_contract', 'developer_sale', 'asking_rent', 'asking_sale',
  'valuation', 'price_index', 'rental_index', 'service_charge', 'mortgage_rate',
]);
```

`MarketEventSchema` requires `marketId`, `eventType`, `period`, `money`, `source`, `sourceRecordId`, `recordStatus`, `retrievedAt`, `methodologyVersion`, `rightsPolicyId`, and `limitations`.

- [ ] **Step 4: Run domain tests and typecheck**

Run: `pnpm vitest run packages/domain/test/domain.test.ts && pnpm --filter @dwellspan/domain typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the domain model**

```bash
git add packages/domain
git commit -m "feat: define global property domain model"
```

### Task 3: Implement deny-by-default data rights and market capabilities

**Files:**
- Create: `packages/data-rights/package.json`
- Create: `packages/data-rights/src/rights-policy.ts`
- Create: `packages/data-rights/src/authorize.ts`
- Create: `packages/data-rights/src/index.ts`
- Create: `packages/data-rights/test/authorize.test.ts`
- Create: `packages/market-core/src/capabilities.ts`
- Create: `packages/market-core/test/capabilities.test.ts`

**Interfaces:**
- Produces: `RightsAction = 'fetch' | 'store' | 'cache' | 'display' | 'derive' | 'commercial' | 'index'`
- Produces: `authorize(policy, action): { allowed: true } | { allowed: false, reason: string }`
- Produces: `assertAllowed(policy, action): void`
- Produces: `getCapability(marketId, capability): CapabilityState`

- [ ] **Step 1: Write failing deny-by-default tests**

```ts
it('denies an undeclared right', () => {
  expect(authorize({ id: 'source-x', canDisplay: true }, 'index')).toEqual({
    allowed: false,
    reason: 'rights_not_granted:index',
  });
});

it('does not expose a market capability without a declaration', () => {
  expect(getCapability('ae-dubai', 'unit_transactions')).toEqual({ state: 'rights_blocked' });
});
```

- [ ] **Step 2: Run rights tests and verify failure**

Run: `pnpm vitest run packages/data-rights/test packages/market-core/test/capabilities.test.ts`

Expected: FAIL because the packages and functions are absent.

- [ ] **Step 3: Implement exhaustive rights mapping**

```ts
const fieldByAction: Record<RightsAction, keyof RightsPolicy> = {
  fetch: 'canFetch', store: 'canStore', cache: 'canCache', display: 'canDisplay',
  derive: 'canCreateDerived', commercial: 'canUseCommercially', index: 'canIndex',
};

export function authorize(policy: RightsPolicy, action: RightsAction): Authorization {
  return policy[fieldByAction[action]] === true
    ? { allowed: true }
    : { allowed: false, reason: `rights_not_granted:${action}` };
}

export function assertAllowed(policy: RightsPolicy, action: RightsAction): void {
  const result = authorize(policy, action);
  if (!result.allowed) throw new Error(result.reason);
}
```

- [ ] **Step 4: Run rights, capability, and domain tests**

Run: `pnpm vitest run packages/data-rights packages/market-core packages/domain`

Expected: PASS with undeclared rights denied.

- [ ] **Step 5: Commit the rights gate**

```bash
git add packages/data-rights packages/market-core
git commit -m "feat: enforce market data rights by default"
```

### Task 4: Implement immutable dataset publication and isolation

**Files:**
- Create: `apps/data-jobs/src/publication/types.ts`
- Create: `apps/data-jobs/src/publication/validate.ts`
- Create: `apps/data-jobs/src/publication/publish.ts`
- Create: `apps/data-jobs/src/publication/registry.ts`
- Create: `apps/data-jobs/test/publication.test.ts`
- Create: `packages/market-core/src/cache-key.ts`
- Create: `packages/market-core/test/cache-key.test.ts`
- Create: `packages/database/src/schema/market.ts`
- Create: `packages/database/src/schema/geo-area.ts`
- Create: `packages/database/src/schema/asset.ts`
- Create: `packages/database/src/schema/market-event.ts`
- Create: `packages/database/src/schema/publication.ts`
- Create: `packages/database/src/migrations/0001_global_market.sql`
- Create: `apps/data-jobs/src/storage/postgres-publication-store.ts`
- Create: `apps/data-jobs/src/storage/object-store.ts`
- Create: `packages/database/test/schema.test.ts`

**Interfaces:**
- Produces: `publishDataset(input): Promise<PublishedDataset>`
- Produces: `getPublishedDataset(marketId, datasetName): Promise<PublishedDataset | null>`
- Produces: `marketCacheKey({ marketId, datasetVersion, locale, policyVersion, resource }): string`
- Produces: market-scoped Drizzle tables and `PublicationStore`/`RawObjectStore` implementations

- [ ] **Step 1: Write failure-retention and isolation tests**

```ts
it('keeps the last valid version after a failed publication', async () => {
  await publishDataset(validSeoulV1);
  await expect(publishDataset(invalidSeoulV2)).rejects.toThrow('publication_validation_failed');
  expect((await getPublishedDataset('kr-seoul', 'rent-contracts'))?.version).toBe('v1');
});

it('includes market and policy in cache keys', () => {
  expect(marketCacheKey(keyInput)).toBe('kr-seoul:v1:en:kr-rent-v1:area:11590');
});
```

- [ ] **Step 2: Run publication tests and verify failure**

Run: `pnpm vitest run apps/data-jobs/test/publication.test.ts packages/market-core/test/cache-key.test.ts packages/database/test/schema.test.ts`

Expected: FAIL because publication, storage, schema, and cache functions are missing.

- [ ] **Step 3: Implement validate-then-publish semantics**

```ts
export async function publishDataset(input: CandidateDataset): Promise<PublishedDataset> {
  const checked = validateCandidate(input);
  await rawStore.putImmutable(checked.rawObject);
  const version = await normalizedStore.writeVersion(checked);
  await registry.compareAndSet(checked.marketId, checked.datasetName, version);
  return version;
}
```

The registry pointer changes only after raw and normalized writes complete. Database tables use composite market keys and reject records whose market differs from the publication envelope.

```sql
CREATE TABLE published_dataset (
  market_id text NOT NULL,
  dataset_name text NOT NULL,
  version text NOT NULL,
  published_at timestamptz NOT NULL,
  PRIMARY KEY (market_id, dataset_name, version)
);
```

- [ ] **Step 4: Run failure-injection tests**

Run: `pnpm vitest run apps/data-jobs/test/publication.test.ts packages/market-core/test/cache-key.test.ts packages/database/test/schema.test.ts --reporter=verbose`

Expected: PASS for validation failure, storage failure, market mismatch, and previous-version retention cases.

- [ ] **Step 5: Commit publication infrastructure**

```bash
git add apps/data-jobs/src/publication apps/data-jobs/src/storage apps/data-jobs/test/publication.test.ts packages/market-core/src/cache-key.ts packages/market-core/test/cache-key.test.ts packages/database
git commit -m "feat: publish isolated versioned market datasets"
```

### Task 5: Implement global route parsing and index-safe metadata

**Files:**
- Create: `packages/seo/src/route.ts`
- Create: `packages/seo/src/readiness.ts`
- Create: `packages/seo/src/metadata.ts`
- Create: `packages/seo/test/route.test.ts`
- Create: `packages/seo/test/readiness.test.ts`
- Create: `apps/web/app/[country]/[city]/page.tsx`
- Create: `apps/web/app/[locale]/[country]/[city]/page.tsx`
- Create: `apps/web/app/robots.ts`
- Create: `apps/web/app/sitemap.ts`

**Interfaces:**
- Produces: `parseMarketRoute(pathname): ParsedMarketRoute | null`
- Produces: `evaluateRouteReadiness(input): 'indexable' | 'noindex' | 'not_found'`
- Produces: `buildMarketMetadata(input): Metadata`

- [ ] **Step 1: Write locale and readiness tests**

```ts
it.each([
  ['/kr/seoul/', { locale: 'en', marketId: 'kr-seoul' }],
  ['/zh/sg/singapore/', { locale: 'zh', marketId: 'sg-singapore' }],
])('parses %s', (path, expected) => expect(parseMarketRoute(path)).toMatchObject(expected));

it('keeps a rights-blocked route out of the index', () => {
  expect(evaluateRouteReadiness({ dataState: 'rights_blocked', contentReady: true, canIndex: false })).toBe('noindex');
});
```

- [ ] **Step 2: Run SEO package tests and verify failure**

Run: `pnpm vitest run packages/seo/test`

Expected: FAIL because routing and readiness modules are missing.

- [ ] **Step 3: Implement a whitelist router and readiness gate**

```ts
const routeMarkets = {
  'kr/seoul': 'kr-seoul',
  'sg/singapore': 'sg-singapore',
  'ae/dubai': 'ae-dubai',
} as const;

export function evaluateRouteReadiness(input: RouteReadinessInput): RouteReadiness {
  if (!input.contentReady) return 'not_found';
  if (input.dataState === 'rights_blocked' || !input.canIndex) return 'noindex';
  return input.dataState === 'fresh' || input.dataState === 'stale' ? 'indexable' : 'noindex';
}
```

- [ ] **Step 4: Run SEO tests and production build**

Run: `pnpm vitest run packages/seo && pnpm --filter @dwellspan/web build`

Expected: PASS; only whitelisted markets and locales build, and blocked routes emit `noindex` or 404 according to readiness.

- [ ] **Step 5: Commit routing and metadata**

```bash
git add packages/seo apps/web/app
git commit -m "feat: add global market routes and index gates"
```

### Task 6: Add platform browser verification and release manifest

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/platform-shell.spec.ts`
- Create: `packages/observability/src/release-manifest.ts`
- Create: `packages/observability/test/release-manifest.test.ts`
- Create: `apps/web/app/api/status/route.ts`
- Create: `docs/operations/v2-platform-release-gate.md`

**Interfaces:**
- Produces: `buildReleaseManifest(input): ReleaseManifest`
- Produces: `GET /api/status` with commit, deployment, dataset, policy, and methodology versions

- [ ] **Step 1: Write failing status and route tests**

```ts
test('global shell exposes market navigation without indexing blocked detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Seoul/ })).toHaveAttribute('href', '/kr/seoul/');
  const response = await page.request.get('/api/status');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ markets: expect.any(Object), commit: expect.any(String) });
});
```

- [ ] **Step 2: Run E2E before status implementation**

Run: `pnpm e2e tests/e2e/platform-shell.spec.ts`

Expected: FAIL because `/api/status` and market navigation are incomplete.

- [ ] **Step 3: Implement release evidence**

```ts
export type ReleaseManifest = {
  commit: string;
  deploymentId: string;
  markets: Record<MarketId, { datasetVersion: string | null; dataState: DataState }>;
  policyVersions: string[];
  methodologyVersions: string[];
};
```

The status route returns public identifiers only and never exposes environment values or upstream credentials.

- [ ] **Step 4: Run the complete foundation gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e tests/e2e/platform-shell.spec.ts && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the release gate**

```bash
git add playwright.config.ts tests/e2e/platform-shell.spec.ts packages/observability apps/web/app/api/status docs/operations/v2-platform-release-gate.md
git commit -m "test: verify V2 platform foundation"
```
