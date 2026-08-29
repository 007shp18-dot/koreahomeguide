# DwellSpan V2 Korea Full Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Seoul as the first full V2 market with official transactions, stable Explorer selection, building details, Rent Check, bilingual content, and verified legacy parity.

**Architecture:** A Korea market adapter converts official source records into the shared event model and publishes versioned Seoul datasets. UI features consume typed query services rather than legacy APIs; Korea-specific calculations live in a versioned policy package.

**Tech Stack:** TypeScript, Next.js App Router, React, Zod, PostgreSQL/PostGIS, Vitest, Playwright, map-provider adapter

**Spec:** `docs/superpowers/specs/2026-08-29-dwellspan-v2-global-rebuild-design.md`

## Global Constraints

- Complete the Phase 0 and platform-foundation plans first.
- Use official reported contract data based on contract date and latest completed period.
- Preserve corrections and cancellations and display the required limitations.
- Use `monthly rent + deposit × 5% ÷ 12` with a versioned 5% Korea policy.
- Map movement cannot silently change district, neighborhood, or building selection.
- New viewport discovery requires an explicit `Search this area` action.
- English and Chinese are release-blocking; Korean is not generated without approved content.
- Do not invent management fees, brokerage fees, deposit-return risk, appraisal, or legal conclusions.

---

### Task 1: Build the Korea official-data adapter

**Files:**
- Create: `markets/korea/src/source/molit-types.ts`
- Create: `markets/korea/src/source/molit-client.ts`
- Create: `markets/korea/src/source/normalize-contract.ts`
- Create: `markets/korea/src/source/record-status.ts`
- Create: `markets/korea/test/fixtures/molit-officetel.json`
- Create: `markets/korea/test/normalize-contract.test.ts`
- Create: `apps/data-jobs/src/jobs/publish-korea-contracts.ts`

**Interfaces:**
- Produces: `fetchMolitContracts(query, transport): Promise<MolitContract[]>`
- Produces: `normalizeMolitContract(record, context): MarketEvent`
- Produces: `publishKoreaContracts(period): Promise<PublishedDataset>`

- [ ] **Step 1: Write failing normalization tests**

```ts
it('normalizes a reported officetel rent contract with provenance', () => {
  const event = normalizeMolitContract(fixture, { retrievedAt: '2026-08-29T00:00:00Z', sourcePeriod: '2026-07' });
  expect(event).toMatchObject({
    marketId: 'kr-seoul', eventType: 'rent_contract', source: 'molit',
    money: { currency: 'KRW' }, methodologyVersion: 'kr-contract-v1',
  });
  expect(event.sourceRecordId).not.toBe('');
});

it('retains cancellation state instead of dropping the record', () => {
  expect(normalizeMolitContract(cancelledFixture, context).recordStatus).toBe('cancelled');
});
```

- [ ] **Step 2: Run and verify missing-adapter failure**

Run: `pnpm vitest run markets/korea/test/normalize-contract.test.ts`

Expected: FAIL because `normalizeMolitContract` is absent.

- [ ] **Step 3: Implement strict source normalization**

```ts
return MarketEventSchema.parse({
  marketId: 'kr-seoul',
  eventType: sourceToEventType(record),
  period: toContractDate(record),
  money: toKrwTerms(record),
  area: toTransactionArea(record),
  source: 'molit',
  sourceRecordId: stableMolitRecordId(record),
  recordStatus: toRecordStatus(record),
  retrievedAt: context.retrievedAt,
  methodologyVersion: 'kr-contract-v1',
  rightsPolicyId: 'molit-public-data-v1',
  limitations: KOREA_CONTRACT_LIMITATIONS,
});
```

- [ ] **Step 4: Run adapter and publication tests**

Run: `pnpm vitest run markets/korea apps/data-jobs/test/publication.test.ts`

Expected: PASS with no live source call; fixtures cover rent, sale, correction, cancellation, malformed money, and malformed area.

- [ ] **Step 5: Commit the Korea adapter**

```bash
git add markets/korea apps/data-jobs/src/jobs/publish-korea-contracts.ts
git commit -m "feat: normalize official Korea contracts"
```

### Task 2: Implement the versioned Korea housing-cost policy

**Files:**
- Create: `packages/calculations/src/korea-rent-policy.ts`
- Create: `packages/calculations/src/price-per-area.ts`
- Create: `packages/calculations/src/types.ts`
- Create: `packages/calculations/src/index.ts`
- Create: `packages/calculations/test/korea-rent-policy.test.ts`
- Copy fixture input from: legacy `artifacts/v2-migration/korea-calculation-fixtures.json`
- Create: `packages/calculations/test/fixtures/korea-legacy.json`

**Interfaces:**
- Produces: `calculateKoreaMonthlyCost(input): DerivedMoney`
- Produces: `calculatePricePerSquareMetre(cost, area): DerivedUnitPrice`
- Policy ID: `kr-rent-opportunity-cost-v1`

- [ ] **Step 1: Write legacy-fixture and rounding tests**

```ts
it.each(legacyFixtures)('matches legacy fixture %#', (fixture) => {
  const result = calculateKoreaMonthlyCost(fixture);
  expect(result.amount).toBe(fixture.adjustedMonthlyKrw);
  expect(result.policyId).toBe('kr-rent-opportunity-cost-v1');
  expect(result.assumptions.annualDepositRate).toBe(0.05);
});
```

- [ ] **Step 2: Run and verify missing-policy failure**

Run: `pnpm vitest run packages/calculations/test/korea-rent-policy.test.ts`

Expected: FAIL because the calculation package is missing.

- [ ] **Step 3: Implement one shared calculation path**

```ts
const annualDepositRate = 0.05;
const amount = Math.round(input.monthlyRentKrw + (input.depositKrw * annualDepositRate) / 12);
return {
  amount, currency: 'KRW', billingPeriod: 'month',
  policyId: 'kr-rent-opportunity-cost-v1',
  policyVersion: 1,
  assumptions: { annualDepositRate },
};
```

Map labels, building comparisons, neighborhood summaries, and Rent Check must import this function rather than duplicate the formula.

- [ ] **Step 4: Run calculation and domain tests**

Run: `pnpm vitest run packages/calculations packages/domain`

Expected: PASS for zero deposit, large deposit, decimal area, and invalid non-positive area.

- [ ] **Step 5: Commit the policy**

```bash
git add packages/calculations
git commit -m "feat: add Korea deposit-adjusted rent policy"
```

### Task 3: Build Seoul geography and query services

**Files:**
- Create: `markets/korea/src/geo/seoul-areas.ts`
- Create: `markets/korea/src/queries/list-neighborhoods.ts`
- Create: `markets/korea/src/queries/types.ts`
- Create: `markets/korea/src/queries/list-buildings.ts`
- Create: `markets/korea/src/queries/get-building.ts`
- Create: `markets/korea/src/queries/search-viewport.ts`
- Create: `markets/korea/test/seoul-queries.test.ts`
- Create: `apps/web/app/api/markets/kr-seoul/explore/route.ts`
- Create: `apps/web/test/api-korea-explore.test.ts`

**Interfaces:**
- Produces: `listNeighborhoods(districtId, dataset): NeighborhoodSummary[]`
- Produces: `listBuildings(neighborhoodId, filters, dataset): BuildingSummary[]`
- Produces: `getBuilding(buildingId, dataset): BuildingDetail | null`
- Produces: `searchViewport(bounds, filters, dataset): MapPoint[]`

- [ ] **Step 1: Write Dongjak and Noryangjin fixture tests**

```ts
it('returns the six data-bearing Dongjak neighborhoods in stable order', () => {
  expect(listNeighborhoods('11590', fixtureDataset)).toHaveLength(6);
});

it('returns seven verified Noryangjin buildings without viewport coupling', () => {
  expect(listBuildings('noryangjin-dong', {}, fixtureDataset)).toHaveLength(7);
});
```

- [ ] **Step 2: Run and verify missing-query failure**

Run: `pnpm vitest run markets/korea/test/seoul-queries.test.ts`

Expected: FAIL because query functions do not exist.

- [ ] **Step 3: Implement dataset-version-bound queries**

```ts
export function listBuildings(neighborhoodId: string, filters: ExploreFilters, dataset: KoreaDataset) {
  return dataset.buildings
    .filter((item) => item.neighborhoodId === neighborhoodId)
    .filter(buildingMatches(filters))
    .map(toBuildingSummary)
    .sort(compareBuildingSummary);
}
```

The API requires an explicit market and published dataset version and returns that version in its response envelope.

- [ ] **Step 4: Run query, API, and market-isolation tests**

Run: `pnpm vitest run markets/korea/test/seoul-queries.test.ts packages/market-core/test apps/web/test/api-korea-explore.test.ts`

Expected: PASS; raw code `11590` is not used as a user-facing label.

- [ ] **Step 5: Commit Seoul queries**

```bash
git add markets/korea/src/geo markets/korea/src/queries markets/korea/test/seoul-queries.test.ts apps/web/app/api/markets/kr-seoul/explore apps/web/test/api-korea-explore.test.ts
git commit -m "feat: add Seoul market query services"
```

### Task 4: Implement Explorer as an explicit state machine

**Files:**
- Create: `apps/web/features/explorer/explorer-state.ts`
- Create: `apps/web/features/explorer/explorer-reducer.ts`
- Create: `apps/web/features/explorer/ExplorerWorkspace.tsx`
- Create: `apps/web/features/explorer/DiscoveryRail.tsx`
- Create: `apps/web/features/explorer/ExplorerMap.tsx`
- Create: `apps/web/features/explorer/SearchAreaButton.tsx`
- Create: `apps/web/features/explorer/explorer-reducer.test.ts`
- Create: `apps/web/app/kr/seoul/explore/[[...segments]]/page.tsx`

**Interfaces:**
- Produces: `ExplorerState = { districtId, neighborhoodId, buildingId, committedBounds, pendingBounds, filters }`
- Produces: `explorerReducer(state, event): ExplorerState`
- Events: `SELECT_DISTRICT`, `SELECT_NEIGHBORHOOD`, `SELECT_BUILDING`, `MAP_MOVED`, `SEARCH_AREA`, `SET_FILTERS`

- [ ] **Step 1: Write selection-stability reducer tests**

```ts
it('does not clear discovery selection when the map moves', () => {
  const moved = explorerReducer(selectedNoryangjin, { type: 'MAP_MOVED', bounds: otherBounds });
  expect(moved.neighborhoodId).toBe('noryangjin-dong');
  expect(moved.buildingId).toBe(selectedNoryangjin.buildingId);
  expect(moved.committedBounds).toEqual(selectedNoryangjin.committedBounds);
  expect(moved.pendingBounds).toEqual(otherBounds);
});
```

- [ ] **Step 2: Run and verify reducer failure**

Run: `pnpm vitest run apps/web/features/explorer/explorer-reducer.test.ts`

Expected: FAIL because the reducer does not exist.

- [ ] **Step 3: Implement explicit viewport commit**

```ts
case 'MAP_MOVED':
  return { ...state, pendingBounds: event.bounds };
case 'SEARCH_AREA':
  return { ...state, committedBounds: state.pendingBounds ?? state.committedBounds };
```

District, neighborhood, and building state changes only through their explicit selection events. URL serialization follows the same reducer state.

- [ ] **Step 4: Run reducer and component interaction tests**

Run: `pnpm vitest run apps/web/features/explorer && pnpm --filter @dwellspan/web typecheck`

Expected: PASS, including ten-second fake-timer stability and explicit Search Area commit.

- [ ] **Step 5: Commit Explorer state and shell**

```bash
git add apps/web/features/explorer apps/web/app/kr/seoul/explore
git commit -m "feat: rebuild Seoul Explorer state flow"
```

### Task 5: Add building modal and Street View adapter

**Files:**
- Create: `apps/web/features/building/BuildingModal.tsx`
- Create: `apps/web/features/building/BuildingDetail.tsx`
- Create: `apps/web/features/building/StreetViewFrame.tsx`
- Create: `apps/web/features/building/street-view-provider.ts`
- Create: `apps/web/features/building/building-modal.test.tsx`
- Create: `tests/e2e/korea-building-modal.spec.ts`

**Interfaces:**
- Produces: `StreetViewProvider.getPanorama(location): Promise<PanoramaResult>`
- Produces: `BuildingModal({ buildingId, open, onClose, returnFocusRef })`

- [ ] **Step 1: Write accessibility and geometry tests**

```ts
test('modal closes with Escape and restores focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: /building/i }).first();
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

- [ ] **Step 2: Run and verify missing-modal failure**

Run: `pnpm e2e tests/e2e/korea-building-modal.spec.ts`

Expected: FAIL because the building dialog is absent.

- [ ] **Step 3: Implement stable media and dialog behaviour**

```tsx
<div className="aspect-[760/428] w-full overflow-hidden bg-neutral-100">
  <StreetViewFrame location={building.location} aria-label={copy.nearbyStreetView} />
</div>
```

Use a focus-trapped dialog on desktop and the same accessible dialog semantics in a bottom-positioned mobile sheet. Only the modal body scrolls.

- [ ] **Step 4: Run component and browser checks**

Run: `pnpm vitest run apps/web/features/building && pnpm e2e tests/e2e/korea-building-modal.spec.ts`

Expected: PASS; desktop frame and dialog boxes are unchanged between two-second and eight-second measurements.

- [ ] **Step 5: Commit building details**

```bash
git add apps/web/features/building tests/e2e/korea-building-modal.spec.ts
git commit -m "feat: add accessible Seoul building details"
```

### Task 6: Rebuild Rent Check on shared market calculations

**Files:**
- Create: `apps/web/features/rent-check/rent-check-schema.ts`
- Create: `apps/web/features/rent-check/check-rent.ts`
- Create: `apps/web/features/rent-check/RentCheckForm.tsx`
- Create: `apps/web/features/rent-check/RentCheckResult.tsx`
- Create: `apps/web/features/rent-check/rent-check.test.tsx`
- Create: `apps/web/app/kr/seoul/tools/rent-check/page.tsx`
- Create: `tests/e2e/korea-rent-check.spec.ts`

**Interfaces:**
- Produces: `checkSeoulRent(input, dataset): RentCheckResult`
- Consumes: `calculateKoreaMonthlyCost` and `calculatePricePerSquareMetre`

- [ ] **Step 1: Write calculation-reuse and layout tests**

```ts
it('uses the shared Korea policy in the result', () => {
  const result = checkSeoulRent(validInput, fixtureDataset);
  expect(result.adjustedMonthly.policyId).toBe('kr-rent-opportunity-cost-v1');
});

test('the three primary controls share a baseline', async ({ page }) => {
  await page.goto('/kr/seoul/tools/rent-check/');
  const boxes = await Promise.all(['area', 'housing-type', 'size'].map((id) => page.getByTestId(id).boundingBox()));
  expect(new Set(boxes.map((box) => `${box?.y}:${box?.height}`)).size).toBe(1);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm vitest run apps/web/features/rent-check && pnpm e2e tests/e2e/korea-rent-check.spec.ts`

Expected: FAIL because the feature is missing.

- [ ] **Step 3: Implement validated form and state regions**

```tsx
{status.kind === 'idle' ? null : (
  <section aria-live="polite" data-state={status.kind}>
    {status.kind === 'success' ? <RentCheckResult result={status.result} /> : status.message}
  </section>
)}
```

All select controls use one 52px control token. Housing explanation and size presets live in the assist row. Long English and Chinese labels wrap or truncate within the field without page overflow.

- [ ] **Step 4: Run unit, layout, mobile, and parity fixtures**

Run: `pnpm vitest run apps/web/features/rent-check packages/calculations && pnpm e2e tests/e2e/korea-rent-check.spec.ts --project=chromium`

Expected: PASS for idle, loading, error, success, presets, pyeong conversion, keyboard use, and mobile overflow.

- [ ] **Step 5: Commit Rent Check**

```bash
git add apps/web/features/rent-check apps/web/app/kr/seoul/tools/rent-check tests/e2e/korea-rent-check.spec.ts
git commit -m "feat: rebuild Seoul Rent Check"
```

### Task 7: Add bilingual disclosure, SEO, and Korea parity gate

**Files:**
- Create: `apps/web/content/en/kr-seoul.ts`
- Create: `apps/web/content/zh/kr-seoul.ts`
- Create: `apps/web/app/[locale]/kr/seoul/explore/[[...segments]]/page.tsx`
- Create: `apps/web/app/[locale]/kr/seoul/tools/rent-check/page.tsx`
- Create: `apps/web/features/disclosure/DataDisclosure.tsx`
- Create: `packages/seo/src/korea-metadata.ts`
- Create: `tests/e2e/korea-parity.spec.ts`
- Create: `scripts/verification/verify-korea-parity.ts`
- Create: `docs/operations/v2-korea-parity-gate.md`

**Interfaces:**
- Produces: `getKoreaCopy(locale): KoreaCopy`
- Produces: `verifyKoreaParity(legacyArtifacts, v2Evidence): ParityReport`

- [ ] **Step 1: Write disclosure and parity tests**

```ts
it.each(['en', 'zh'] as const)('has complete %s disclosure copy', (locale) => {
  const copy = getKoreaCopy(locale).dataDisclosure;
  expect(copy).toMatchObject({ officialReportedContracts: expect.any(String), mayBeCorrectedOrCancelled: expect.any(String) });
});

test('Explorer selection and Rent Check pass legacy fixtures', async ({ page }) => {
  await verifyExplorerContract(page);
  await verifyRentCheckContract(page);
});
```

- [ ] **Step 2: Run and verify missing-copy failure**

Run: `pnpm vitest run apps/web/content packages/seo && pnpm e2e tests/e2e/korea-parity.spec.ts`

Expected: FAIL because bilingual copy and parity helpers are absent.

- [ ] **Step 3: Implement typed bilingual copy and comparison report**

```ts
export type KoreaDisclosureCopy = {
  officialReportedContracts: string;
  contractDateBasis: string;
  latestCompletedPeriod: string;
  mayBeCorrectedOrCancelled: string;
  notAskingPrice: string;
  notAppraisalOrLegalAdvice: string;
};
```

The locale wrappers accept `zh`, use the same feature components and query services as English, and reject unapproved locale values. The verifier compares Phase 0 fixtures, route responses, calculations, stable Explorer state, modal geometry, Rent Check controls, disclosures, and horizontal overflow.

- [ ] **Step 4: Run the Korea release gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e tests/e2e/korea-*.spec.ts && pnpm tsx scripts/verification/verify-korea-parity.ts && git diff --check`

Expected: all V2 checks PASS, parity report has no Critical or Important gap, and all relevant legacy fixtures match.

- [ ] **Step 5: Commit the Korea parity gate**

```bash
git add apps/web/content apps/web/features/disclosure packages/seo/src/korea-metadata.ts tests/e2e/korea-parity.spec.ts scripts/verification/verify-korea-parity.ts docs/operations/v2-korea-parity-gate.md
git commit -m "test: enforce Seoul V2 parity gate"
```
