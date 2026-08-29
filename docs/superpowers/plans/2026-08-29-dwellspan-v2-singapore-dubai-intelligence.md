# DwellSpan V2 Singapore and Dubai Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rights-safe Singapore and Dubai market intelligence plus comparable cross-city metrics without pretending unsupported data or services exist.

**Architecture:** Each market owns its source adapters, classifications, rent policy, disclosures, and capabilities. Public pages are generated from versioned datasets only when both data sufficiency and commercial rights permit the requested surface.

**Tech Stack:** TypeScript, Next.js App Router, Zod, shared domain and rights packages, PostgreSQL/PostGIS, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-08-29-dwellspan-v2-global-rebuild-design.md`

## Global Constraints

- Complete the platform-foundation plan first; cross-city UI begins after the Korea calculation package exists.
- Singapore HDB and private residential statistics remain separate sectors.
- Singapore monthly rent does not use Korea's deposit opportunity-cost formula.
- Dubai annual rent is divided by twelve once; cheque count stays separate.
- Dubai owner service charges are not included in tenant rent.
- URA private details and Dubai commercial data stay blocked until exact written rights are recorded.
- Asking, contract, valuation, index, and developer-sale events are never relabelled as each other.
- Missing cost is unknown, not zero.

---

### Task 1: Define Singapore and Dubai policies and capabilities

**Files:**
- Create: `markets/singapore/src/policy.ts`
- Create: `markets/singapore/src/capabilities.ts`
- Create: `markets/singapore/data-sources/registry.json`
- Create: `markets/singapore/data-sources/rights/sg-open-data-hdb-v1.md`
- Create: `markets/singapore/test/policy.test.ts`
- Create: `markets/dubai/src/policy.ts`
- Create: `markets/dubai/src/capabilities.ts`
- Create: `markets/dubai/data-sources/registry.json`
- Create: `markets/dubai/data-sources/rights/ae-dubai-blocked-v1.md`
- Create: `markets/dubai/test/policy.test.ts`
- Modify: `packages/market-core/src/capabilities.ts`

**Interfaces:**
- Produces: `calculateSingaporeMonthlyRent(input): DerivedMoney`
- Produces: `calculateDubaiMonthlyRent(input): DerivedMoney`
- Produces: `SINGAPORE_CAPABILITIES` and `DUBAI_CAPABILITIES`

- [ ] **Step 1: Write market-policy failures first**

```ts
it('keeps Singapore security deposit separate', () => {
  expect(calculateSingaporeMonthlyRent({ monthlyRentSgd: 4200, securityDepositSgd: 8400 })).toMatchObject({
    amount: 4200, currency: 'SGD', initialCash: { amount: 8400, currency: 'SGD' },
  });
});

it('converts Dubai annual rent to monthly exactly once', () => {
  expect(calculateDubaiMonthlyRent({ annualRentAed: 120000, chequeCount: 4 }).amount).toBe(10000);
});
```

- [ ] **Step 2: Run and verify missing-policy failure**

Run: `pnpm vitest run markets/singapore/test/policy.test.ts markets/dubai/test/policy.test.ts`

Expected: FAIL because market policies are absent.

- [ ] **Step 3: Implement versioned policy results**

```ts
return {
  amount: input.annualRentAed / 12,
  currency: 'AED',
  billingPeriod: 'month',
  paymentTerms: { chequeCount: input.chequeCount },
  policyId: 'ae-rent-monthly-display-v1',
  excludedCosts: ['owner_service_charge'],
};
```

Private Singapore detail and Dubai detail capabilities initialize as `rights_blocked`. HDB public capabilities initialize according to the recorded source policy. Each registry entry names the policy ID, evidence document, review date, allowed actions, retention, TTL, and attribution; tests fail when the evidence file is missing.

- [ ] **Step 4: Run policy and capability tests**

Run: `pnpm vitest run markets/singapore markets/dubai packages/market-core packages/data-rights`

Expected: PASS, including annual double-conversion rejection and undeclared-right denial.

- [ ] **Step 5: Commit market policies**

```bash
git add markets/singapore markets/dubai packages/market-core/src/capabilities.ts
git commit -m "feat: add Singapore and Dubai market policies"
```

### Task 2: Build the Singapore HDB public-data adapter

**Files:**
- Create: `markets/singapore/src/source/hdb-client.ts`
- Create: `markets/singapore/src/source/hdb-rent.ts`
- Create: `markets/singapore/src/source/hdb-resale.ts`
- Create: `markets/singapore/test/fixtures/hdb-rent.json`
- Create: `markets/singapore/test/fixtures/hdb-resale.json`
- Create: `markets/singapore/test/hdb-adapter.test.ts`
- Create: `apps/data-jobs/src/jobs/publish-singapore-hdb.ts`

**Interfaces:**
- Produces: `normalizeHdbRent(record, context): MarketEvent`
- Produces: `normalizeHdbResale(record, context): MarketEvent`
- Produces: `publishSingaporeHdb(period): Promise<PublishedDataset[]>`

- [ ] **Step 1: Write sector and source-precision tests**

```ts
it('marks HDB rent as public-sector rent contract data', () => {
  expect(normalizeHdbRent(rentFixture, context)).toMatchObject({
    marketId: 'sg-singapore', housingSector: 'hdb', eventType: 'rent_contract',
    money: { currency: 'SGD' }, methodologyVersion: 'sg-hdb-rent-v1',
  });
});

it('does not invent rental floor area when the source omits it', () => {
  expect(normalizeHdbRent(rentWithoutArea, context).area).toBeUndefined();
});
```

- [ ] **Step 2: Run and verify adapter failure**

Run: `pnpm vitest run markets/singapore/test/hdb-adapter.test.ts`

Expected: FAIL because the HDB normalizers are missing.

- [ ] **Step 3: Implement source-specific mappings**

```ts
return MarketEventSchema.parse({
  marketId: 'sg-singapore', housingSector: 'hdb', eventType: 'rent_contract',
  period: toSourceMonth(record), money: { amount: toNumber(record.rent), currency: 'SGD' },
  source: 'data.gov.sg-hdb', sourceRecordId: stableHdbId(record), recordStatus: 'reported',
  retrievedAt: context.retrievedAt, methodologyVersion: 'sg-hdb-rent-v1',
  rightsPolicyId: 'sg-open-data-hdb-v1', limitations: HDB_RENT_LIMITATIONS,
});
```

- [ ] **Step 4: Run adapter and publication tests**

Run: `pnpm vitest run markets/singapore/test/hdb-adapter.test.ts apps/data-jobs/test/publication.test.ts`

Expected: PASS for rent, resale, month precision, absent area, invalid amount, and dataset pagination fixtures.

- [ ] **Step 5: Commit the HDB adapter**

```bash
git add markets/singapore/src/source markets/singapore/test apps/data-jobs/src/jobs/publish-singapore-hdb.ts
git commit -m "feat: publish Singapore HDB intelligence"
```

### Task 3: Build Singapore area and market pages

**Files:**
- Create: `markets/singapore/src/queries/hdb-market-summary.ts`
- Create: `markets/singapore/src/queries/hdb-area-summary.ts`
- Create: `markets/singapore/test/hdb-queries.test.ts`
- Create: `apps/web/app/sg/singapore/page.tsx`
- Create: `apps/web/app/sg/singapore/areas/[slug]/page.tsx`
- Create: `apps/web/app/sg/singapore/market/page.tsx`
- Create: `apps/web/app/sg/singapore/rules/page.tsx`
- Create: `apps/web/app/[locale]/sg/singapore/[[...segments]]/page.tsx`
- Create: `apps/web/content/en/sg-singapore.ts`
- Create: `apps/web/content/zh/sg-singapore.ts`
- Create: `tests/e2e/singapore-market.spec.ts`

**Interfaces:**
- Produces: `getHdbMarketSummary(dataset): HdbMarketSummary`
- Produces: `getHdbAreaSummary(areaId, dataset): HdbAreaSummary | null`

- [ ] **Step 1: Write no-sector-mixing and missing-field tests**

```ts
it('summarizes HDB without private residential events', () => {
  const result = getHdbMarketSummary(mixedFixture);
  expect(result.sector).toBe('hdb');
  expect(result.sourceEventIds).not.toContain('private-1');
});

test('does not render price per sqm when rental area is absent', async ({ page }) => {
  await page.goto('/sg/singapore/areas/ang-mo-kio/');
  await expect(page.getByText(/rent per square metre/i)).toHaveCount(0);
});
```

- [ ] **Step 2: Run and verify page/query failure**

Run: `pnpm vitest run markets/singapore/test/hdb-queries.test.ts && pnpm e2e tests/e2e/singapore-market.spec.ts`

Expected: FAIL because query services and pages are missing.

- [ ] **Step 3: Implement HDB-labelled summaries and bilingual methodology**

```ts
const events = dataset.events.filter((event) => event.housingSector === 'hdb');
return {
  sector: 'hdb', period: dataset.sourcePeriod,
  medianMonthlyRent: median(events.filter(isRent).map(monthlyAmount)),
  medianResalePrice: median(events.filter(isSale).map(nativeAmount)),
  sourceEventIds: events.map((event) => event.id),
};
```

All pages identify HDB scope, source period, missing fields, and foreign-ownership rule source dates. The locale wrapper accepts `zh` and delegates to the same typed page models. Private-market sections render only an explanatory unavailable state while rights remain blocked.

- [ ] **Step 4: Run Singapore quality and browser tests**

Run: `pnpm vitest run markets/singapore apps/web/content && pnpm e2e tests/e2e/singapore-market.spec.ts && pnpm --filter @dwellspan/web build`

Expected: PASS; public routes include only rights-cleared HDB statistics and typed bilingual copy.

- [ ] **Step 5: Commit Singapore pages**

```bash
git add markets/singapore/src/queries markets/singapore/test/hdb-queries.test.ts apps/web/app/sg apps/web/content/en/sg-singapore.ts apps/web/content/zh/sg-singapore.ts tests/e2e/singapore-market.spec.ts
git commit -m "feat: add Singapore HDB market intelligence"
```

### Task 4: Implement the Dubai licensed-provider boundary

**Files:**
- Create: `markets/dubai/src/source/provider.ts`
- Create: `markets/dubai/src/source/normalize-transaction.ts`
- Create: `markets/dubai/src/source/normalize-rent.ts`
- Create: `markets/dubai/src/source/normalize-service-charge.ts`
- Create: `markets/dubai/test/fixtures/licensed-provider.json`
- Create: `markets/dubai/test/provider-boundary.test.ts`
- Create: `apps/data-jobs/src/jobs/publish-dubai.ts`

**Interfaces:**
- Produces: `DubaiLicensedProvider` interface
- Produces: `normalizeDubaiTransaction(record, context): MarketEvent`
- Produces: `publishDubai(period, provider, rightsPolicy): Promise<PublishedDataset>`

- [ ] **Step 1: Write rights-block and event-separation tests**

```ts
it('refuses publication without commercial display and index rights', async () => {
  await expect(publishDubai('2026-07', fixtureProvider, personalUsePolicy)).rejects.toThrow('rights_not_granted:commercial');
});

it('keeps service charge separate from rent', () => {
  expect(normalizeDubaiServiceCharge(serviceFixture, context).eventType).toBe('service_charge');
  expect(normalizeDubaiRent(rentFixture, context).eventType).toBe('rent_contract');
});
```

- [ ] **Step 2: Run and verify provider-boundary failure**

Run: `pnpm vitest run markets/dubai/test/provider-boundary.test.ts`

Expected: FAIL because the provider interface and publication gate are missing.

- [ ] **Step 3: Implement an injected provider with pre-fetch authorization**

```ts
export async function publishDubai(period: string, provider: DubaiLicensedProvider, policy: RightsPolicy) {
  assertAllowed(policy, 'fetch');
  assertAllowed(policy, 'store');
  assertAllowed(policy, 'commercial');
  const records = await provider.fetchPeriod(period);
  return publishDataset(normalizeDubaiRecords(records, policy));
}
```

No scraper, DLD website parser, or hard-coded credential is included. The fixture provider proves the interface without claiming source rights.

- [ ] **Step 4: Run rights and provider failure injection**

Run: `pnpm vitest run markets/dubai packages/data-rights apps/data-jobs/test/publication.test.ts`

Expected: PASS for blocked rights, licensed fixture, invalid annual rent, event separation, provider outage, and last-valid-dataset retention.

- [ ] **Step 5: Commit the Dubai boundary**

```bash
git add markets/dubai/src/source markets/dubai/test apps/data-jobs/src/jobs/publish-dubai.ts
git commit -m "feat: define rights-gated Dubai data provider"
```

### Task 5: Build capability-aware Dubai pages

**Files:**
- Create: `markets/dubai/src/queries/market-summary.ts`
- Create: `markets/dubai/src/queries/area-summary.ts`
- Create: `markets/dubai/test/queries.test.ts`
- Create: `apps/web/app/ae/dubai/page.tsx`
- Create: `apps/web/app/ae/dubai/areas/[slug]/page.tsx`
- Create: `apps/web/app/ae/dubai/projects/[slug]/page.tsx`
- Create: `apps/web/app/ae/dubai/ownership-cost/page.tsx`
- Create: `apps/web/app/[locale]/ae/dubai/[[...segments]]/page.tsx`
- Create: `apps/web/content/en/ae-dubai.ts`
- Create: `apps/web/content/zh/ae-dubai.ts`
- Create: `tests/e2e/dubai-rights.spec.ts`

**Interfaces:**
- Produces: `getDubaiMarketPage(capabilities, dataset): MarketPageModel`
- Produces: `getDubaiDetailPage(capabilities, dataset, slug): DetailPageModel | null`

- [ ] **Step 1: Write blocked and licensed route tests**

```ts
test('blocked Dubai detail is not indexable', async ({ page }) => {
  await page.goto('/ae/dubai/projects/example-project/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByText(/data rights/i)).toBeVisible();
});

it('omits unverified ownership costs instead of setting zero', () => {
  expect(getDubaiMarketPage(licensedCapabilities, dataset).ownershipCosts.serviceCharge).toEqual({ state: 'unknown' });
});
```

- [ ] **Step 2: Run and verify missing-page failure**

Run: `pnpm vitest run markets/dubai/test/queries.test.ts && pnpm e2e tests/e2e/dubai-rights.spec.ts`

Expected: FAIL because page models and routes are missing.

- [ ] **Step 3: Implement capability-driven route output**

```ts
if (capabilities.projectDetails.state !== 'available') {
  return { kind: 'blocked', dataState: 'rights_blocked', robots: 'noindex,nofollow' };
}
return { kind: 'detail', dataState: dataset.dataState, robots: capabilities.canIndex ? 'index,follow' : 'noindex,nofollow' };
```

The locale wrapper accepts `zh` and delegates to the same capability-aware page models. City overview content may be indexable only if its own sources and copy pass readiness; it cannot inherit permission from an unrelated detailed source.

- [ ] **Step 4: Run Dubai rights, SEO, and browser tests**

Run: `pnpm vitest run markets/dubai packages/seo packages/data-rights && pnpm e2e tests/e2e/dubai-rights.spec.ts`

Expected: PASS for blocked, unavailable, insufficient, stale, and licensed fixture states.

- [ ] **Step 5: Commit Dubai pages**

```bash
git add markets/dubai/src/queries markets/dubai/test/queries.test.ts apps/web/app/ae apps/web/content/en/ae-dubai.ts apps/web/content/zh/ae-dubai.ts tests/e2e/dubai-rights.spec.ts
git commit -m "feat: add rights-aware Dubai intelligence"
```

### Task 6: Add compatible cross-city comparison

**Files:**
- Create: `packages/calculations/src/fx-display.ts`
- Create: `packages/calculations/src/compare-markets.ts`
- Create: `packages/calculations/src/yield.ts`
- Create: `packages/calculations/test/compare-markets.test.ts`
- Create: `apps/web/features/compare/CityComparison.tsx`
- Create: `apps/web/app/compare/[pair]/page.tsx`
- Create: `apps/web/app/[locale]/compare/[pair]/page.tsx`
- Create: `tests/e2e/city-comparison.spec.ts`

**Interfaces:**
- Produces: `compareRecurringCost(inputs, displayCurrency, rate): ComparableCost[]`
- Produces: `calculateGrossYield(input): YieldResult`
- Produces: `calculateNetOperatingYield(input): YieldResult | PartialNetEstimate`

- [ ] **Step 1: Write compatibility and missing-cost tests**

```ts
it('refuses incompatible area bases', () => {
  expect(() => comparePricePerArea(netAreaCost, grossAreaCost)).toThrow('incompatible_area_basis');
});

it('labels incomplete net yield', () => {
  expect(calculateNetOperatingYield({ annualRent: 48000, purchasePrice: 900000, costs: {} })).toMatchObject({
    kind: 'partial_net_estimate', excludedCosts: expect.arrayContaining(['service_charge']),
  });
});
```

- [ ] **Step 2: Run and verify comparison failure**

Run: `pnpm vitest run packages/calculations/test/compare-markets.test.ts`

Expected: FAIL because comparison functions are absent.

- [ ] **Step 3: Implement native-first display conversion**

```ts
return inputs.map((input) => ({
  marketId: input.marketId,
  native: input.monthlyCost,
  display: convertAtDatedRate(input.monthlyCost, displayCurrency, rate),
  policyId: input.policyId,
  exclusions: input.exclusions,
}));
```

Comparison accepts only compatible event types, sectors, periods, and area bases. FX never overwrites native values.

- [ ] **Step 4: Run the multi-market release gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e tests/e2e/singapore-market.spec.ts tests/e2e/dubai-rights.spec.ts tests/e2e/city-comparison.spec.ts && git diff --check`

Expected: all commands exit 0; rights-blocked routes do not appear in the sitemap.

- [ ] **Step 5: Commit cross-city comparison**

```bash
git add packages/calculations apps/web/features/compare apps/web/app/compare tests/e2e/city-comparison.spec.ts
git commit -m "feat: compare compatible global market costs"
```
