# SignedPrice New/Renewal Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish independently validated All, New, and Renewal Seoul district evidence without relabeling combined or under-threshold data.

**Architecture:** Extend the existing MOLIT public-summary job to compute three record-filtered groups plus unknown counts, serialize an exact-key v2 area artifact, and normalize v1/v2 through the server repository. Route models expose group-specific presentation models; a small client selector changes only already-validated values and preserves `?contract=` URL state.

**Tech Stack:** TypeScript 5.9, Vitest 4, Next.js 16 App Router, React 19, CSS Modules, existing `@signedprice/korea-rent` and `@signedprice/market-core` packages.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-contract-split-news-community-design.md`

## Global Constraints

- `all` contains eligible new, renewal, and unknown records; `new` and `renewal` contain only their exact source types.
- `all.n === new.n + renewal.n + unknownCount` for the city and every district.
- Each group independently applies the existing publication minimum of 5.
- Under-threshold groups expose counts but no money.
- A v1 snapshot renders combined `All` and an explicit unavailable split state; it is never labeled new-only.
- Explore defaults to `All`; invalid query values normalize to `all`.
- Contract Check's existing prefer-new-with-fallback policy does not change.
- All public objects remain immutable and source/provider details remain server-only.

---

### Task 1: Record-Filtered Public Summary Finalization

**Files:**
- Modify: `v2/packages/korea-rent/src/public-summary.ts`
- Modify: `v2/packages/korea-rent/src/public-summary-job.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Test: `v2/packages/korea-rent/test/public-summary.test.ts`
- Test: `v2/packages/korea-rent/test/public-summary-job.test.ts`

**Interfaces:**
- Consumes: validated `KoreaRentRecord[]`, canonical seven completed months, existing MOLIT rights lookup.
- Produces: `KoreaPublicContractGroup`, group-aware `buildKoreaPublicMarketSummary`, and `KoreaPublicAreaSummaryFinalization` with `groups` and `unknownContractCounts`.

- [ ] **Step 1: Write failing group-isolation tests**

Add records whose deposits make the combined, new, and renewal medians visibly different. Assert the unknown record contributes only to `all` and the unknown count.

```ts
expect(buildSummary('all').n).toBe(15);
expect(buildSummary('new').n).toBe(6);
expect(buildSummary('renewal').n).toBe(5);
expect(buildSummary('new').med).not.toBe(buildSummary('renewal').med);
```

In the job test, assert exact reconciliation for the city and one district:

```ts
const finalized = await finalizeKoreaPublicAreaSummaryJob(input, dependencies);
expect(finalized.groups.all.citySummary.n).toBe(
  finalized.groups.new.citySummary.n +
  finalized.groups.renewal.citySummary.n +
  finalized.unknownContractCounts.city,
);
expect(finalized.unknownContractCounts.districts).toHaveLength(25);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
cd v2
pnpm exec vitest run packages/korea-rent/test/public-summary.test.ts packages/korea-rent/test/public-summary-job.test.ts
```

Expected: FAIL because group input and grouped finalization do not exist.

- [ ] **Step 3: Add the explicit group contract**

```ts
export type KoreaPublicContractGroup = 'all' | 'new' | 'renewal';

export type KoreaPublicSummaryInput = Readonly<{
  area: string;
  parent: string;
  band: string;
  period: string;
  completedMonths: readonly string[];
  sourceComplete: boolean;
  source: KoreaPublicSummarySource;
  rightsLookup: MolitRightsLookup;
  records: readonly KoreaRentRecord[];
  contractGroup: KoreaPublicContractGroup;
}>;
```

Filter after the existing cancelled/status, area, and jeonse eligibility checks:

```ts
function belongsToGroup(record: KoreaRentRecord, group: KoreaPublicContractGroup): boolean {
  return group === 'all' || record.contractType === group;
}
```

Pass the filtered group into both the five-number summary and `change3m`; never reuse the combined change for a split.

- [ ] **Step 4: Build group and unknown finalization values**

```ts
export type KoreaPublicAreaSummaryGroup = Readonly<{
  citySummary: PublicMarketSummary;
  districtSummaries: readonly PublicMarketSummary[];
}>;

export type KoreaPublicAreaSummaryFinalization = Readonly<{
  groups: Readonly<Record<KoreaPublicContractGroup, KoreaPublicAreaSummaryGroup>>;
  unknownContractCounts: Readonly<{ city: number; districts: readonly number[] }>;
  period: string;
  generatedAt: string;
  completedCoordinates: 700;
  eligibleRecords: number;
}>;
```

Unknown counts use the same `isEligible` filter as group summaries and canonical district order. Freeze the groups, arrays, and count object.

- [ ] **Step 5: Run focused tests, typecheck the package, and commit**

```bash
cd v2
pnpm exec vitest run packages/korea-rent/test/public-summary.test.ts packages/korea-rent/test/public-summary-job.test.ts
pnpm --filter @signedprice/korea-rent typecheck
git add packages/korea-rent/src/public-summary.ts packages/korea-rent/src/public-summary-job.ts packages/korea-rent/src/index.ts packages/korea-rent/test/public-summary.test.ts packages/korea-rent/test/public-summary-job.test.ts
git commit -m "feat(v2): compute new and renewal public summaries"
```

Expected: focused tests and typecheck PASS.

### Task 2: Exact-Key Public Area Artifact v2

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-summary-schema.ts`
- Modify: `v2/apps/web/lib/public-market/area-artifact-builder.server.ts`
- Modify: `v2/apps/web/test/public-area-fixture.ts`
- Test: `v2/apps/web/test/public-area-summary-schema.test.ts`
- Test: `v2/apps/web/test/public-area-artifact-builder.test.ts`

**Interfaces:**
- Consumes: Task 1 `KoreaPublicAreaSummaryFinalization`.
- Produces: `PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION = 'signedprice-public-area-summary-v2'`, strict v2 parser, and a test-only v1 fixture constructor for migration coverage.

- [ ] **Step 1: Write failing v2 exactness and reconciliation tests**

Assert exact root keys and reject group omissions, extra keys, wrong canonical order, split count mutation, unknown count mutation, and an independently under-threshold renewal group with money keys.

```ts
expect(Object.keys(parsed.groups)).toEqual(['all', 'new', 'renewal']);
expect(parsed.groups.new.districtSummaries).toHaveLength(25);

artifact.unknownContractCounts.city += 1;
expect(() => parsePublicAreaSummaryArtifact(artifact, expected)).toThrow(
  'Invalid public area summary artifact.',
);
```

- [ ] **Step 2: Run schema and builder tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-area-summary-schema.test.ts apps/web/test/public-area-artifact-builder.test.ts
```

Expected: FAIL because v2 groups do not exist.

- [ ] **Step 3: Implement strict v2 parsing**

Use these exact root keys:

```ts
const V2_ROOT_KEYS = [
  'artifactVersion',
  'generatedAt',
  'provenance',
  'groups',
  'unknownContractCounts',
] as const;
```

Parse each group with the existing `parseSummary` and identity validation. Add a single reconciliation loop for city index `-1` and district indices `0..24`. Do not coerce strings to numbers or ignore unknown keys.

- [ ] **Step 4: Build canonical v2 JSON and v1 test fixture**

`freezeArtifact` serializes Task 1 groups in insertion order `all`, `new`, `renewal`; freezes every summary and array; validates before `encodeArtifact`. Update `createPublicAreaFixture()` to return v2 by default and add:

```ts
export function createPublicAreaV1Fixture(): PublicAreaV1FixtureArtifact;
```

The v1 helper preserves the exact current Production shape for migration tests only.

- [ ] **Step 5: Run focused tests, diff check, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-area-summary-schema.test.ts apps/web/test/public-area-artifact-builder.test.ts
git diff --check
git add apps/web/lib/public-market/area-summary-schema.ts apps/web/lib/public-market/area-artifact-builder.server.ts apps/web/test/public-area-fixture.ts apps/web/test/public-area-summary-schema.test.ts apps/web/test/public-area-artifact-builder.test.ts
git commit -m "feat(v2): validate public area summary v2"
```

Expected: focused tests PASS and serialized output contains no service key, raw XML, source record ID, or cache key.

### Task 3: V1/V2 Repository Normalization

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-summary-schema.ts`
- Modify: `v2/apps/web/lib/public-market/area-summary-repository.server.ts`
- Test: `v2/apps/web/test/public-area-summary-repository.test.ts`

**Interfaces:**
- Consumes: strict v1 or v2 parsed artifact.
- Produces: `PublicContractGroup`, `ContractSplitAvailability`, and group-aware repository methods with a normalized server-only view.

- [ ] **Step 1: Write failing compatibility tests**

```ts
expect(v2.getContractSplitAvailability()).toEqual({
  status: 'ready',
  unknownCityCount: 4,
});
expect(v2.getDistrictSummary('gangnam-gu', 'new').area).toBe('gangnam-gu');
expect(v1.getContractSplitAvailability()).toEqual({ status: 'snapshot_v1' });
expect(v1.getDistrictSummary('gangnam-gu', 'all').published).toBe(true);
expect(() => v1.getDistrictSummary('gangnam-gu', 'new')).toThrow(
  'Verified public area summary is unavailable.',
);
```

- [ ] **Step 2: Run the repository test and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-area-summary-repository.test.ts
```

- [ ] **Step 3: Add normalized methods**

```ts
export type PublicContractGroup = 'all' | 'new' | 'renewal';

export type PublicAreaSummaryRepository = Readonly<{
  getArtifactVersion(): 'v1' | 'v2';
  getContractSplitAvailability():
    | Readonly<{ status: 'ready'; unknownCityCount: number }>
    | Readonly<{ status: 'snapshot_v1' }>;
  getCitySummary(group?: PublicContractGroup): PublicMarketSummary;
  listDistrictSummaries(group?: PublicContractGroup): readonly PublicMarketSummary[];
  getDistrictSummary(slug: SeoulDistrictSlug, group?: PublicContractGroup): PublicMarketSummary;
  getDistrictUnknownContractCount(slug: SeoulDistrictSlug): number | null;
  getEvidenceDescriptor(): EvidenceDescriptor;
}>;
```

Default omitted groups to `all` for existing callers. V1 rejects explicit non-all access and returns `null` unknown counts. Build frozen arrays/maps once per group; methods do not reparse source.

- [ ] **Step 4: Run repository plus existing route/rankings tests**

```bash
cd v2
pnpm exec vitest run apps/web/test/public-area-summary-repository.test.ts apps/web/test/public-area-rankings.test.ts apps/web/test/public-area-explore.test.tsx apps/web/test/public-district-detail.test.tsx
```

Expected: PASS with existing callers still receiving combined `all`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/public-market/area-summary-schema.ts apps/web/lib/public-market/area-summary-repository.server.ts apps/web/test/public-area-summary-repository.test.ts
git commit -m "feat(v2): normalize public contract split snapshots"
```

### Task 4: Group-Aware Route Models and Selector

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/district-evidence-summary.tsx`
- Modify: `v2/apps/web/components/public-market/district-evidence-summary.module.css`
- Create: `v2/apps/web/components/public-market/contract-group-selector.tsx`
- Create: `v2/apps/web/components/public-market/contract-group-selector.module.css`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/app/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/app/kr/seoul/explore/[district]/page.tsx`
- Test: `v2/apps/web/test/district-evidence-summary.test.tsx`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/apps/web/test/public-district-detail.test.tsx`
- Test: `v2/apps/web/test/public-area-explorer-state.test.ts`

**Interfaces:**
- Consumes: Task 3 repository.
- Produces: immutable `ContractGroupEvidenceModel`, `normalizePublicContractGroup`, and a selector that updates validated URL state without fetching raw data.

- [ ] **Step 1: Write failing presentation and URL tests**

Assert all three labels render; published New and withheld Renewal show different samples; withheld contains no formatted money; v1 renders `New/renewal split not available in this snapshot`; unknown count disclosure is visible; invalid query normalizes to All.

```tsx
expect(html).toContain('data-contract-group="all"');
expect(html).toContain('data-contract-group="new"');
expect(html).toContain('data-contract-group="renewal"');
expect(html).toContain('Contract type unknown · 2');
expect(withheldRenewalHtml).not.toMatch(/₩|KRW/);
expect(normalizePublicContractGroup('private')).toBe('all');
```

- [ ] **Step 2: Run focused UI/model tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/district-evidence-summary.test.tsx apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-area-explorer-state.test.ts
```

- [ ] **Step 3: Expose all validated groups in one route model**

```ts
export type ContractGroupEvidenceModel = Readonly<{
  selected: PublicContractGroup;
  splitStatus: 'ready' | 'snapshot_v1';
  unknownContractCount: number | null;
  groups: Readonly<Record<PublicContractGroup, PublicDistrictEvidenceSummaryModel>>;
}>;

export function normalizePublicContractGroup(value: unknown): PublicContractGroup {
  return value === 'new' || value === 'renewal' ? value : 'all';
}
```

All models are built on the server from Task 3 summaries. No client component imports the repository or artifact environment variables.

- [ ] **Step 4: Implement the selector and selected evidence view**

The selector receives all three browser-safe group models. Use buttons with `aria-pressed`, at least 44px height, and a visible focus ring. `router.replace` preserves the current pathname and sets/removes only `contract`; `all` uses the clean URL. A v1 snapshot keeps New/Renewal visible but disabled with an adjacent explanation.

The Explore district selection and contract-group selection are independent reducer actions. The selected district panel uses `DistrictEvidenceSummary`; the complete table and map choropleth remain based on `all` to avoid silently changing all 25 districts from one local selector.

- [ ] **Step 5: Run focused tests, lint, typecheck, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/district-evidence-summary.test.tsx apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-area-explorer-state.test.ts
pnpm lint
pnpm typecheck
git add apps/web/lib/public-market/area-route-types.ts apps/web/lib/public-market/area-route-model.server.ts apps/web/components/public-market/district-evidence-summary.tsx apps/web/components/public-market/district-evidence-summary.module.css apps/web/components/public-market/contract-group-selector.tsx apps/web/components/public-market/contract-group-selector.module.css apps/web/components/public-market/area-explorer.tsx apps/web/lib/public-market/area-explorer-state.ts apps/web/app/kr/seoul/explore/page.tsx apps/web/app/kr/seoul/explore/[district]/page.tsx apps/web/test/district-evidence-summary.test.tsx apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-area-explorer-state.test.ts
git commit -m "feat(v2): expose new and renewal district evidence"
```

### Task 5: Artifact Migration and Release Gate

**Files:**
- Modify: `v2/tests/e2e/public-area-summary-fixture.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: Tasks 1–4 and one freshly generated v2 artifact.
- Produces: exact-SHA Preview evidence, v1 rollback proof, and a separately approved Production artifact switch.

- [ ] **Step 1: Add browser tests for v2 and v1 states**

At 390, 720, and 1440px assert All/New/Renewal, URL persistence, published/withheld transitions, unknown count, no overflow, keyboard focus, and zero client requests to MOLIT. Add one v1 test that sees the split limitation and combined values.

- [ ] **Step 2: Run the complete local gate**

```bash
cd v2
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm check:rent-client-boundary
pnpm exec playwright test tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts
git diff --check
```

Expected: all commands PASS; if local Chromium is unavailable, record that exact blocker and do not claim the Playwright gate passed.

- [ ] **Step 3: Generate and validate the live v2 artifact**

Run the existing completed-period public-summary job, serialize with the Task 2 builder, and validate locally. Record period, generated time, SHA-256, all/new/renewal/unknown city counts, all 25 district reconciliation results, and withheld split counts. Do not print the MOLIT credential or raw records.

- [ ] **Step 4: Verify exact-SHA Preview**

Install the v2 artifact in Preview scope, redeploy the exact candidate SHA, and verify real All/New/Renewal values, SEO containment, client secret scan, console/5xx, runtime errors, and unchanged KoreaHomeGuide routes. Keep Production on v1 until this passes.

- [ ] **Step 5: Promote with rollback and commit the release record**

After explicit Production promotion authorization, retain the previous v1 value for rollback, install v2, verify live counts and route metadata, and update the release gate with exact deployment and artifact identifiers.

```bash
git add tests/e2e/public-area-summary-fixture.ts tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts docs/operations/signedprice-public-p1-release-gate.md
git commit -m "test(v2): gate new and renewal evidence release"
```
