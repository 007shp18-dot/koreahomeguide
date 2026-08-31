# SignedPrice Korea Detail and Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Seoul Explore into URL-first district and evidence-gated building journeys, preserve the completed Rankings work, and activate an honest methodology Guide without publishing fake news, community, or building figures.

**Architecture:** The verified 26-summary Korea artifact remains the district authority. Explore links move to nested canonical URLs while the existing district URLs remain compatibility renders until a later migration decision. A separate strict building artifact controls static building routes; no fixture or district average can satisfy it. Guide content is versioned structured copy about SignedPrice methods and evidence boundaries, not unverified legal advice.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, Vitest 4, Playwright 1.62, existing `@signedprice/korea-rent` and public-area repositories.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-global-trust-detail-singapore-design.md`

## Global Constraints

- Contract Check remains the primary Korea decision surface; Explore, Detail, Rankings, and Guide explain its evidence.
- Existing Rankings derivation and `/kr/seoul/rankings/` stay intact; this plan changes only links and release coverage around it.
- District money comes only from `SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT` and its exact period.
- The legacy `seoul-explorer-data.ts`, `ExplorerWorkspace`, and `BuildingDialog` remain parity fixtures and never become public evidence.
- Combined new-and-renewal evidence is labelled `all`; no split control appears until split-specific artifact values exist.
- A building route is generated only from a validated building artifact with a rights-permitted ready record.
- No News, community, saved-property, supply, floor, orientation, physical-fact, or weekly-brief UI appears without its independent source or storage contract.
- District and building routes are reload-safe, shareable, keyboard accessible, and free of horizontal overflow at 390px, 720px, 1366px, and 1440px.
- Every new route remains `noindex, follow`, without canonical, hreflang, or sitemap entries.
- KoreaHomeGuide remains unchanged.

---

## File Responsibility Map

- `v2/apps/web/lib/public-market/area-route-types.ts`: nested canonical district hrefs and display-only building summaries.
- `v2/apps/web/lib/public-market/area-route-model.server.ts`: district URL models from the existing area repository.
- `v2/apps/web/app/kr/seoul/explore/[district]/page.tsx`: canonical nested district route.
- `v2/apps/web/app/[country]/[city]/[intent]/page.tsx`: compatibility district render at the old URL.
- `v2/apps/web/lib/public-market/building-summary-schema.ts`: strict building artifact refusal boundary.
- `v2/apps/web/lib/public-market/building-summary-repository.server.ts`: server-only building artifact access.
- `v2/apps/web/app/kr/seoul/explore/[district]/[buildingId]/page.tsx`: evidence-gated static building detail.
- `v2/apps/web/lib/guide/guide-content.ts`: immutable methodology guides and glossary.
- `v2/apps/web/app/kr/seoul/guide/page.tsx`: Guide index.
- `v2/apps/web/app/kr/seoul/guide/[slug]/page.tsx`: verified methodology guide documents.

---

### Task 1: Canonical District Navigation

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Create: `v2/apps/web/app/kr/seoul/explore/[district]/page.tsx`
- Modify: `v2/apps/web/test/public-area-route-model.test.ts`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`
- Create: `v2/apps/web/test/public-nested-district-route.test.tsx`

**Interfaces:**
- Consumes: `buildPublicDistrictModel(slug)` and `SEOUL_RENT_CHECK_DISTRICTS`.
- Produces: `ExploreDistrictModel.href: /kr/seoul/explore/${slug}/`, nested static params, and canonical in-product navigation.

- [ ] **Step 1: Write failing URL and interaction tests**

```ts
expect(model.districts[0]?.href).toBe('/kr/seoul/explore/jongno-gu/');
expect(generateStaticParams()).toEqual(
  SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({ district: slug })),
);
expect(rendered).toContain('href="/kr/seoul/explore/jongno-gu/"');
expect(rendered).toContain('href="/kr/seoul/explore/?district=jongno-gu"');
```

Browser assertions must prove map click and table-row primary action reach the same URL, reload preserves the district, copied URLs render the same heading, and back returns to Explore.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-route-model.test.ts apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-nested-district-route.test.tsx`

Expected: FAIL because hrefs still target `/kr/seoul/[slug]/` and the nested route is absent.

- [ ] **Step 3: Implement the nested route**

Export `dynamicParams = false`, return the exact 25 static params, call `buildPublicDistrictModel`, use the same sanitized `districtMetadata` logic as the compatibility route, and render `DistrictDetailPage`. Extract metadata into `lib/public-market/district-metadata.ts` so both routes use one implementation.

- [ ] **Step 4: Make Explore primary actions navigate**

Replace table selection buttons with full-height `Link` destinations. Keep hover/focus preview in local state, but make pointer activation on an SVG district call `router.push(district.href)` and keyboard users use the adjacent complete table. Set each SVG path's `<title>` to include `Open {district}` and keep exact values available in the table.

- [ ] **Step 5: Preserve compatibility URLs without redirecting**

Keep `/kr/seoul/[district]/` rendering the same model and metadata. Change all new in-product nearby, ranking, and Explore links to nested URLs. Do not add redirects, canonicals, or sitemap entries in this task.

- [ ] **Step 6: Run focused tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-route-model.test.ts apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-nested-district-route.test.tsx apps/web/test/public-area-rankings.test.tsx && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/lib/public-market v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/district-detail-page.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/app/kr/seoul/explore/[district] v2/apps/web/test
git commit -m "feat(v2): add canonical Seoul district detail routes"
```

---

### Task 2: District Detail Hierarchy and Building Availability

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail.module.css`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`

**Interfaces:**
- Consumes: existing area summary and Global Trust `EvidenceDescriptor`/empty-state components.
- Produces: a district detail document with breadcrumb, finding, distribution, quote, nearby districts, source boundary, and an explicit building-evidence availability block.

- [ ] **Step 1: Write failing detail hierarchy tests**

Assert a published district renders breadcrumb `Explore / District`, median, middle half, range, change, sample, local quote, source, period, correction link, nearby links, and a building block whose unavailable state has all three required elements. Assert withheld and unavailable districts contain no hidden amount, JSON-LD amount, or city substitution.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-district-detail.test.tsx`

Expected: FAIL because the breadcrumb, correction link, and complete building availability state are absent.

- [ ] **Step 3: Extend the district model without inventing buildings**

Add:

```ts
type DistrictBuildingAvailability =
  | Readonly<{ status: 'ready'; buildings: readonly DistrictBuildingLink[] }>
  | Readonly<{ status: 'not_loaded'; empty: EvidenceEmptyState }>;

type DistrictBuildingLink = Readonly<{
  id: string; name: string; housingType: string; sampleLabel: string;
  href: `/kr/seoul/explore/${string}/${string}/`;
}>;
```

For this task the default is `not_loaded` with title `Building evidence is not loaded`, reason `The verified district artifact does not contain building records`, and next action `Use district evidence or return after a verified building snapshot is installed`.

- [ ] **Step 4: Render the responsive document hierarchy**

Use the existing Modernist layout with one natural mobile flow and a bounded wide contextual rail only when real content exists. Do not render News/community placeholders. Add `aria-label="Breadcrumb"`, visible source/corrections links, and keep every action at least 44px.

- [ ] **Step 5: Run tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-district-detail.test.tsx apps/web/test/public-source-boundary.test.tsx apps/web/test/trust-components.test.tsx && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/lib/public-market/area-route-types.ts v2/apps/web/lib/public-market/area-route-model.server.ts v2/apps/web/components/public-market/district-detail-page.tsx v2/apps/web/components/public-market/district-detail.module.css v2/apps/web/test/public-district-detail.test.tsx
git commit -m "feat(v2): complete district evidence hierarchy"
```

---

### Task 3: Strict Building Artifact and Evidence-Gated Routes

**Files:**
- Create: `v2/apps/web/lib/public-market/building-summary-schema.ts`
- Create: `v2/apps/web/lib/public-market/building-summary-repository.server.ts`
- Create: `v2/apps/web/lib/public-market/building-route-model.server.ts`
- Create: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Create: `v2/apps/web/components/public-market/building-detail.module.css`
- Create: `v2/apps/web/app/kr/seoul/explore/[district]/[buildingId]/page.tsx`
- Create: `v2/apps/web/test/public-building-artifact.test.ts`
- Create: `v2/apps/web/test/public-building-route-model.test.ts`
- Create: `v2/apps/web/test/public-building-detail.test.tsx`

**Interfaces:**
- Consumes: `SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT`, `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD`, and district identities.
- Produces: strict `signedprice-public-building-summary-v1` parsing, `createPublicBuildingRepository`, `buildPublicBuildingModel`, and static building detail routes only for ready records.

- [ ] **Step 1: Write failing exact-schema tests**

Define the artifact contract:

```ts
type PublicBuildingDistribution =
  | Readonly<{ n: number; published: false }>
  | Readonly<{
      n: number; published: true; min: number; p25: number;
      med: number; p75: number; max: number; chg3m: number | null;
    }>;

type PublicBuildingRecord = Readonly<{
  buildingId: string; districtSlug: SeoulDistrictSlug; name: string;
  housingType: 'apartment' | 'officetel' | 'villa_multifamily';
  supportedDeals: readonly ('jeonse' | 'monthly_rent' | 'sale')[];
  period: string; generatedAt: string; publicationMinimum: number;
  overall: PublicBuildingDistribution;
  areaBands: readonly Readonly<{ band: string; summary: PublicBuildingDistribution }>[];
  recentContracts: readonly Readonly<{
    filedMonth: string; areaSqm: number;
    deal: 'jeonse' | 'monthly_rent' | 'sale';
    depositWon: number; monthlyRentWon: number;
  }>[];
}>;
```

The artifact also contains versions, provider, rights policy, exclusions, total record count, and SHA-256 digest. Test extra keys, duplicate IDs, district mismatch, invalid money, unsafe integers, reversed periods, unsorted contracts, count reconciliation, digest mismatch, and a fixture-shaped record from `seoul-explorer-data.ts`; all must reject with `Invalid public building artifact.`

- [ ] **Step 2: Run parser tests and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-building-artifact.test.ts`

Expected: FAIL because the schema does not exist.

- [ ] **Step 3: Implement parser and server repository**

Use exact-key guards at artifact, provenance, record, summary, area-band, and recent-contract levels. Recompute the digest from canonical JSON excluding the digest field. Repository methods are `listByDistrict(slug)`, `getById(districtSlug, buildingId)`, and `listRouteParams()`. Parse the environment once and throw only `PublicBuildingSummaryUnavailableError` at the repository boundary.

- [ ] **Step 4: Write route-model and render tests**

Assert ready records render only artifact fields, all numbers derive from integer source values, source/period/rights are visible, and absent optional blocks are omitted. Assert missing artifact, unknown building, withheld overall summary, or rights-blocked provenance yields no generated route and no money.

- [ ] **Step 5: Implement static params and building page**

`generateStaticParams()` returns only repository `listRouteParams()` and returns an empty frozen array if the artifact is absent. Set `dynamicParams = false`. The page checks district/building identity again before rendering. It shows breadcrumb, evidence distribution, area bands, privacy-safe recent contracts, Trust disclosure, and corrections link; it does not show floor, orientation, register facts, news, community, saved state, or supply.

- [ ] **Step 6: Connect ready building lists to district detail**

Inject the building repository into `buildPublicDistrictModel`. `not_loaded` remains the fail-closed default; only validated records from the same district and period create links.

- [ ] **Step 7: Run focused tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-building-artifact.test.ts apps/web/test/public-building-route-model.test.ts apps/web/test/public-building-detail.test.tsx apps/web/test/public-district-detail.test.tsx && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/lib/public-market/building-* v2/apps/web/components/public-market/building-* v2/apps/web/app/kr/seoul/explore/[district]/[buildingId] v2/apps/web/test/public-building-* v2/apps/web/lib/public-market/area-route-model.server.ts v2/apps/web/test/public-district-detail.test.tsx
git commit -m "feat(v2): gate Seoul building detail by verified artifacts"
```

---

### Task 4: Activate the Korea Methodology Guide

**Files:**
- Create: `v2/apps/web/lib/guide/guide-content.ts`
- Create: `v2/apps/web/components/guide/guide-index.tsx`
- Create: `v2/apps/web/components/guide/guide-document.tsx`
- Create: `v2/apps/web/components/guide/guide.module.css`
- Create: `v2/apps/web/app/kr/seoul/guide/page.tsx`
- Create: `v2/apps/web/app/kr/seoul/guide/[slug]/page.tsx`
- Modify: `v2/apps/web/components/public-market/public-section-tabs.tsx`
- Modify: `v2/apps/web/test/public-section-tabs.test.tsx`
- Create: `v2/apps/web/test/guide-routes.test.tsx`

**Interfaces:**
- Consumes: current verified product methodology; no statute, rate, deadline, or legal recommendation.
- Produces: three immutable guides and one glossary index under `/kr/seoul/guide/`.

- [ ] **Step 1: Write failing content and route tests**

The exact initial guides are:

```ts
const guides = [
  { slug: 'compare-two-contracts', stage: 'Before signing', readMinutes: 4 },
  { slug: 'read-district-evidence', stage: 'Market research', readMinutes: 3 },
  { slug: 'understand-publication-limits', stage: 'Evidence check', readMinutes: 3 },
] as const;
```

Assert every guide has `lastVerified`, source links to current SignedPrice methodology/Trust routes, no hardcoded market statistic, no legal deadline, no unsupported accuracy number, and no KoreaHomeGuide content copy. Assert Guide is now a real link while News is not rendered as an inactive tab.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/guide-routes.test.tsx apps/web/test/public-section-tabs.test.tsx`

Expected: FAIL because Guide routes do not exist and the tab is disabled.

- [ ] **Step 3: Implement immutable guide content**

Each guide contains a title, summary, reading time, last-verified ISO date, ordered steps, evidence boundary, and links to Check, Explore, Rankings, Trust, and Corrections as relevant. The glossary defines `reported contract`, `median`, `middle half`, `publication minimum`, `withheld`, `conversion curve`, `completed period`, and `correction`, including a `Why it matters` sentence for each.

- [ ] **Step 4: Implement index, document routes, and tab navigation**

Use `dynamicParams = false` with the exact three slugs. Metadata remains noindex. `PublicSectionTabs` becomes `current: 'check' | 'explore' | 'guide'`, renders Check/Explore/Guide real links, and omits News entirely until a data/editorial pipeline exists.

- [ ] **Step 5: Preserve Rankings and connect evidence journeys**

Add Guide links to Contract Check evidence navigation, Explore, district detail, and Rankings source notes. Add Rankings links to Trust and Corrections. Do not change ranking calculations, list ordering, or axes.

- [ ] **Step 6: Run tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/guide-routes.test.tsx apps/web/test/public-section-tabs.test.tsx apps/web/test/public-area-rankings.test.tsx apps/web/test/contract-check-evidence-navigation.test.tsx && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/lib/guide v2/apps/web/components/guide v2/apps/web/app/kr/seoul/guide v2/apps/web/components/public-market/public-section-tabs.tsx v2/apps/web/test/guide-routes.test.tsx v2/apps/web/test/public-section-tabs.test.tsx v2/apps/web/test/public-area-rankings.test.tsx v2/apps/web/test/contract-check-evidence-navigation.test.tsx
git commit -m "feat(v2): publish Korea evidence guides"
```

---

### Task 5: Korea Detail Browser and Release Gate

**Files:**
- Create: `v2/tests/e2e/korea-detail.spec.ts`
- Create: `v2/tests/e2e/korea-guide.spec.ts`
- Create: `v2/tests/e2e/public-building-summary-fixture.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/playwright.config.ts`
- Modify: `v2/tests/browser-ci-contract.test.ts`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: Tasks 1–4 and the completed Rankings release.
- Produces: exact-SHA browser evidence for district navigation, building readiness, Guide, Rankings preservation, and SEO containment.

- [ ] **Step 1: Add browser tests**

At all four viewports assert map/table destination equality, browser back/forward/refresh, district breadcrumb, published/withheld/unavailable states, building ready and absent-artifact states, Guide documents, 44px actions, focus order, zero overflow, no console error, no 5xx, and no request to provider endpoints. Assert the four ranking lists and Contract Check verdict still render unchanged.

- [ ] **Step 2: Add only synthetic building data to Playwright**

Set `SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT` only in `playwright.config.ts` using an exact synthetic fixture. Label every fixture name `Synthetic Test Building`; prohibit the literal from application source and Production environment documentation.

- [ ] **Step 3: Update route and CI contracts**

Add the 25 nested district paths, three Guide documents, Trust links, and one synthetic building route to the browser route list. Keep compatibility district routes and an empty sitemap. Register `korea-detail` and `korea-guide` at tablet/wide viewports.

- [ ] **Step 4: Run the full local release candidate gate**

Run: `cd v2 && pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary && pnpm exec playwright test tests/e2e/area-explore.spec.ts tests/e2e/rankings.spec.ts tests/e2e/contract-check.spec.ts tests/e2e/korea-detail.spec.ts tests/e2e/korea-guide.spec.ts`

Expected: every command PASS.

- [ ] **Step 5: Commit release evidence**

```bash
git add v2/tests/e2e/korea-detail.spec.ts v2/tests/e2e/korea-guide.spec.ts v2/tests/e2e/public-building-summary-fixture.ts v2/tests/e2e/public-route-contract.ts v2/playwright.config.ts v2/tests/browser-ci-contract.test.ts docs/operations/signedprice-public-p1-release-gate.md
git commit -m "test(v2): gate Korea detail and guide journeys"
```

The News/data-brief route remains intentionally absent in this release. Its accepted product contract requires two comparable completed-period artifacts and an automated editorial/correction pipeline; rendering a hand-written brief would violate the approved no-fabrication rule.
