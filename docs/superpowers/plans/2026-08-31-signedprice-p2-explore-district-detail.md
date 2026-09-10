# signedprice P2 Explore and District Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a protected, server-first Seoul Explore map and 25 district detail pages from one verified 26-summary MOLIT artifact without changing Production or exposing unsupported figures.

**Architecture:** Extend the proven P1 700-coordinate source job with a second finalizer that derives the Seoul total and each district from the same cached source months. Validate one immutable area artifact at a server-only repository boundary, project checked-in GeoJSON into deterministic SVG paths, and feed pure Explore/detail route models to SSR React components with client-side selection and quote enhancement only. A temporary Preview-only generator installs the branch-scoped artifact and is removed before the final candidate.

**Tech Stack:** TypeScript 5.9, Next.js 16.3 App Router, React 19.2, Vitest 4.1, Playwright 1.62, pnpm 11, SVG/GeoJSON, Vercel Runtime Cache, protected Vercel Preview deployments.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-p2-explore-district-detail-design.md`

## Global Constraints

- Public values mean refundable jeonse deposits from MOLIT reported contracts, never monthly rent, listing price, appraisal, or an agent estimate.
- Every summary uses `marketId: "kr-seoul"`, `deal: "jeonse"`, `band: "45-55sqm"`, and the exact seven-completed-month `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD`.
- Eligible records have `recordStatus !== "cancelled"`, `depositWon > 0`, `monthlyRentWon === 0`, and `45 <= areaSqm <= 55`.
- A district with `n < 5` carries no `min`, `p25`, `med`, `p75`, `max`, or `chg3m` key in the artifact, route model, HTML, React payload, metadata, or JSON-LD.
- The artifact version is exactly `signedprice-public-area-summary-v1`; it contains one Seoul summary followed by exactly 25 district summaries in legal-code order.
- `DATA_GO_KR_SERVICE_KEY`, provider endpoint URLs, raw XML, source records, cache values, building labels, and provider error bodies never enter artifacts, logs, responses, or client bundles.
- `data/seoul-districts.geojson` is the geometry authority; `SEOUL_RENT_CHECK_DISTRICTS` is the public identity and order authority.
- `/kr/seoul/explore/` and `/kr/seoul/{district-slug}/` remain `noindex, follow`, emit no canonical or hreflang, and remain absent from `sitemap.xml`.
- Static segments `explore`, `tools`, `rent`, `buy`, and `invest` retain precedence over district slugs; unknown slugs return the custom 404.
- Explore selection and quote positioning perform zero network requests and store no cookie.
- At 390px, all controls are at least 44px, focus is a 2px cobalt ring with 2px offset, the legend remains visible, natural document scrolling works, and horizontal overflow is zero.
- News and Guide appear only as labelled non-interactive future states. Neighbourhoods and buildings are not published by this slice.
- The temporary generator exists only on the protected branch Preview and is deleted before the final release candidate.
- Never edit, stage, copy, or publish `upload/`.
- No Production deployment, promotion, merge-to-main, domain, DNS, redirect, sitemap, canonical, hreflang, indexing, Firewall, or Production environment change is authorized.

---

## File Responsibility Map

- `v2/packages/korea-rent/src/districts.ts`: canonical 25-district identity, legal-code order, route slugs, and public names.
- `v2/packages/korea-rent/src/public-summary-job.ts`: existing 700-coordinate collection plus city-and-district finalization from verified source-month cache entries.
- `v2/apps/web/lib/public-market/seoul-district-geometry.server.ts`: exact GeoJSON validation, fixed SVG projection, and versioned adjacency.
- `v2/apps/web/lib/public-market/area-summary-schema.ts`: exact v1 area artifact parser and semantic/arithmetic refusal boundary.
- `v2/apps/web/lib/public-market/area-artifact-builder.server.ts`: canonical area artifact assembly and SHA-256 digest.
- `v2/apps/web/lib/public-market/area-summary-repository.server.ts`: server-only environment artifact repository.
- `v2/apps/web/lib/public-market/area-route-types.ts`: serializable client-safe Explore/detail view-model types with no artifact or environment imports.
- `v2/apps/web/lib/public-market/area-route-model.server.ts`: pure Explore/detail models, rank buckets, copy, FAQ, JSON-LD, and unavailable states.
- `v2/apps/web/components/public-market/area-explorer.tsx`: SSR-first synchronized map/table selection enhancement.
- `v2/apps/web/components/public-market/district-detail-page.tsx`: published/withheld district evidence and local quote experience.
- `v2/apps/web/components/public-market/public-section-tabs.tsx`: Check/Explore links plus non-interactive News/Guide future states.
- `v2/apps/web/components/public-market/public-source-boundary.tsx`: period, source, rights, sample, and limitation disclosure shared by Explore/detail.
- `v2/apps/web/app/kr/seoul/explore/page.tsx`: server route for the Explore surface and explicit artifact-unavailable state.
- `v2/apps/web/app/[country]/[city]/[intent]/page.tsx`: one third-segment resolver for existing intents and the 25 district pages.
- `v2/tests/e2e/public-area-summary-fixture.ts`: complete synthetic 26-summary browser fixture that is never used as operational data.
- `v2/tests/e2e/area-explore.spec.ts`: desktop, wide, and mobile behavior/accessibility release gate.
- `artifacts/public-p2/preview-area-summary-job.json`: sanitized, non-served exact-SHA generation and deployment evidence.

---

### Task 1: Canonicalize District Identity, Geometry, and Adjacency

**Files:**
- Modify: `v2/packages/korea-rent/src/districts.ts`
- Modify: `v2/packages/korea-rent/src/browser.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Create: `v2/packages/korea-rent/test/districts.test.ts`
- Create: `v2/apps/web/lib/public-market/seoul-district-geometry.server.ts`
- Create: `v2/apps/web/test/seoul-district-geometry.test.ts`

**Interfaces:**
- Consumes: `data/seoul-districts.geojson` with 25 Polygon features and exact properties `districtCode`, `slug`, `nameEn`, `nameKo`, and `source`.
- Produces:

```ts
export type SeoulRentCheckDistrict = Readonly<{
  lawdCd: string;
  slug: string;
  nameEn: string;
  nameKo: string;
}>;

export type SeoulDistrictGeometry = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  path: string;
}>;

export const SEOUL_DISTRICT_ADJACENCY_VERSION = 'seoul-district-adjacency-v1' as const;
export function listSeoulDistrictGeometry(): readonly SeoulDistrictGeometry[];
export function listAdjacentDistrictSlugs(slug: SeoulDistrictSlug): readonly SeoulDistrictSlug[];
```

- [ ] **Step 1: Write the failing catalog test**

```ts
expect(SEOUL_RENT_CHECK_DISTRICTS).toHaveLength(25);
expect(SEOUL_RENT_CHECK_DISTRICTS[0]).toEqual({
  lawdCd: '11110', slug: 'jongno-gu', nameEn: 'Jongno-gu', nameKo: '종로구',
});
expect(SEOUL_RENT_CHECK_DISTRICTS.at(-1)).toEqual({
  lawdCd: '11740', slug: 'gangdong-gu', nameEn: 'Gangdong-gu', nameKo: '강동구',
});
expect(new Set(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug)).size).toBe(25);
```

Name the break: a missing, duplicated, renamed, or reordered public district identity must fail before it can alter routes or attach evidence to the wrong geography.

- [ ] **Step 2: Write the failing geometry contract test**

Import the production geometry module and assert the root source is `KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0), simplified for web display`, every feature source is `KOSTAT 2013 simplified boundary`, 25 paths appear in catalog order, identity equals the catalog, path commands are finite/non-empty, and bounds stay within the fixed `720 × 560` viewBox. Assert a deliberately changed GeoJSON name or missing feature throws only `Invalid Seoul district geometry.`.

```ts
expect(listSeoulDistrictGeometry().map(({ lawdCd, slug }) => ({ lawdCd, slug })))
  .toEqual(SEOUL_RENT_CHECK_DISTRICTS.map(({ lawdCd, slug }) => ({ lawdCd, slug })));
expect(listSeoulDistrictGeometry().every(({ path }) => /^M[\d. -]+L.+Z$/.test(path))).toBe(true);
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/districts.test.ts apps/web/test/seoul-district-geometry.test.ts`

Expected: FAIL because route slugs and the server geometry module do not exist.

- [ ] **Step 4: Add route slugs to the catalog**

Add the GeoJSON slugs to the existing legal-code-ordered array and export `SeoulDistrictSlug`. Do not create a second district identity list.

```ts
export type SeoulDistrictSlug = SeoulRentCheckDistrict['slug'];

export function getSeoulDistrictBySlug(slug: string): SeoulRentCheckDistrict | null {
  return SEOUL_RENT_CHECK_DISTRICTS.find((district) => district.slug === slug) ?? null;
}
```

- [ ] **Step 5: Implement fixed projection and exact geometry validation**

Import `../../../../../data/seoul-districts.geojson`, reject any non-Polygon or identity/order mismatch, and project every coordinate with these constants:

```ts
const VIEWBOX = { width: 720, height: 560, padding: 18 } as const;
const x = VIEWBOX.padding + ((longitude - minLongitude) / (maxLongitude - minLongitude))
  * (VIEWBOX.width - VIEWBOX.padding * 2);
const y = VIEWBOX.height - VIEWBOX.padding
  - ((latitude - minLatitude) / (maxLatitude - minLatitude))
  * (VIEWBOX.height - VIEWBOX.padding * 2);
```

Round projected coordinates to two decimals and freeze the resulting legal-code-ordered path list.

- [ ] **Step 6: Check in and verify the versioned adjacency table**

Use this exact symmetric table, derived from at least two shared boundary vertices in the checked-in GeoJSON:

```ts
const ADJACENCY = {
  'jongno-gu': ['jung-gu','dongdaemun-gu','seongbuk-gu','eunpyeong-gu','seodaemun-gu'],
  'jung-gu': ['jongno-gu','yongsan-gu','seongdong-gu','seodaemun-gu','mapo-gu'],
  'yongsan-gu': ['jung-gu','seongdong-gu','mapo-gu','yeongdeungpo-gu','dongjak-gu','seocho-gu'],
  'seongdong-gu': ['jung-gu','yongsan-gu','gwangjin-gu','dongdaemun-gu','gangnam-gu'],
  'gwangjin-gu': ['seongdong-gu','dongdaemun-gu','jungnang-gu','gangnam-gu','songpa-gu','gangdong-gu'],
  'dongdaemun-gu': ['jongno-gu','seongdong-gu','gwangjin-gu','jungnang-gu','seongbuk-gu'],
  'jungnang-gu': ['gwangjin-gu','dongdaemun-gu','seongbuk-gu','nowon-gu'],
  'seongbuk-gu': ['jongno-gu','dongdaemun-gu','jungnang-gu','gangbuk-gu','nowon-gu'],
  'gangbuk-gu': ['seongbuk-gu','dobong-gu'],
  'dobong-gu': ['gangbuk-gu','nowon-gu'],
  'nowon-gu': ['jungnang-gu','seongbuk-gu','dobong-gu'],
  'eunpyeong-gu': ['jongno-gu','seodaemun-gu','mapo-gu'],
  'seodaemun-gu': ['jongno-gu','jung-gu','eunpyeong-gu','mapo-gu'],
  'mapo-gu': ['jung-gu','yongsan-gu','eunpyeong-gu','seodaemun-gu','gangseo-gu','yeongdeungpo-gu'],
  'yangcheon-gu': ['gangseo-gu','guro-gu','yeongdeungpo-gu'],
  'gangseo-gu': ['mapo-gu','yangcheon-gu','yeongdeungpo-gu'],
  'guro-gu': ['yangcheon-gu','geumcheon-gu','yeongdeungpo-gu','gwanak-gu'],
  'geumcheon-gu': ['guro-gu','gwanak-gu'],
  'yeongdeungpo-gu': ['yongsan-gu','mapo-gu','yangcheon-gu','gangseo-gu','guro-gu','dongjak-gu'],
  'dongjak-gu': ['yongsan-gu','yeongdeungpo-gu','gwanak-gu','seocho-gu'],
  'gwanak-gu': ['guro-gu','geumcheon-gu','dongjak-gu','seocho-gu'],
  'seocho-gu': ['yongsan-gu','dongjak-gu','gwanak-gu','gangnam-gu'],
  'gangnam-gu': ['seongdong-gu','gwangjin-gu','seocho-gu','songpa-gu'],
  'songpa-gu': ['gwangjin-gu','gangnam-gu','gangdong-gu'],
  'gangdong-gu': ['gwangjin-gu','songpa-gu'],
} as const satisfies Record<SeoulDistrictSlug, readonly SeoulDistrictSlug[]>;
```

The geometry test independently recomputes shared-vertex adjacency and checks table symmetry, catalog membership, and exact equality.

- [ ] **Step 7: Run focused tests and typechecks**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/districts.test.ts apps/web/test/seoul-district-geometry.test.ts && pnpm --filter @signedprice/korea-rent typecheck && pnpm --filter @signedprice/web typecheck`

Expected: PASS.

- [ ] **Step 8: Commit Task 1**

```bash
git add v2/packages/korea-rent/src/districts.ts v2/packages/korea-rent/src/browser.ts v2/packages/korea-rent/src/index.ts v2/packages/korea-rent/test/districts.test.ts v2/apps/web/lib/public-market/seoul-district-geometry.server.ts v2/apps/web/test/seoul-district-geometry.test.ts
git commit -m "feat(v2): canonicalize Seoul public districts"
```

---

### Task 2: Derive City and 25 District Summaries from the Proven Source Cache

**Files:**
- Modify: `v2/packages/korea-rent/src/public-summary-job.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Modify: `v2/packages/korea-rent/test/public-summary-job.test.ts`

**Interfaces:**
- Consumes: the existing 700-coordinate plan/store and `buildKoreaPublicMarketSummary()`.
- Produces:

```ts
export type KoreaPublicAreaSummaryFinalization = Readonly<{
  citySummary: PublicMarketSummary;
  districtSummaries: readonly PublicMarketSummary[];
  period: string;
  generatedAt: string;
  completedCoordinates: 700;
  eligibleRecords: number;
}>;

export function finalizeKoreaPublicAreaSummaryJob(
  input: Readonly<{ referenceInstant: string }>,
  dependencies: Omit<KoreaPublicSummaryJobDependencies, 'serviceKey' | 'fetch'>,
): Promise<KoreaPublicAreaSummaryFinalization>;
```

- [ ] **Step 1: Add a failing 26-summary finalization test**

Seed all 700 source-month coordinates. Put five eligible records under `11110`, four under `11140`, and none elsewhere. Assert exact order and identity:

```ts
expect(result.districtSummaries).toHaveLength(25);
expect(result.districtSummaries[0]).toMatchObject({
  area: 'jongno-gu', parent: 'seoul', n: 5, published: true,
});
expect(result.districtSummaries[1]).toEqual({
  marketId: 'kr-seoul', area: 'jung-gu', parent: 'seoul', deal: 'jeonse',
  band: '45-55sqm', period: '2026-01/2026-07', n: 4, published: false,
});
expect(result.citySummary.n).toBe(
  result.districtSummaries.reduce((sum, summary) => sum + summary.n, 0),
);
```

Name the break: mixing source records across legal codes or deriving district values with a copied formula must fail.

- [ ] **Step 2: Add failing district change-window and completeness tests**

Give one district five eligible records in each three-month window and expect its exact one-decimal `chg3m`. Give another four in the preceding window and five in the latest window and expect `chg3m: null`. Remove one cached coordinate and expect the same sanitized completeness refusal as P1.

- [ ] **Step 3: Run the focused test and confirm RED**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-summary-job.test.ts`

Expected: FAIL because `finalizeKoreaPublicAreaSummaryJob` does not exist.

- [ ] **Step 4: Read each verified month once and retain its legal-code bucket**

Use one `Map<SeoulLawdCd, KoreaRentRecord[]>`, pre-seeded in catalog order. During the existing plan loop, append the month records to both the city list and only `recordsByDistrict.get(coordinate.lawdCd)`.

```ts
const recordsByDistrict = new Map(
  SEOUL_RENT_CHECK_DISTRICTS.map(({ lawdCd }) => [lawdCd, [] as KoreaRentRecord[]]),
);
```

- [ ] **Step 5: Call the existing summary builder 26 times**

Build the city with `{area:'seoul', parent:'kr'}` and each district with its catalog `{area:slug, parent:'seoul'}`. Pass identical `period`, `completedMonths`, provenance, `sourceComplete: true`, and rights lookup. Freeze both the district array and finalization.

- [ ] **Step 6: Run package regression and typecheck**

Run: `cd v2 && pnpm exec vitest run packages/korea-rent/test/public-summary-job.test.ts packages/korea-rent/test/public-summary.test.ts packages/korea-rent/test/source-month-store.test.ts && pnpm --filter @signedprice/korea-rent typecheck`

Expected: PASS, including existing P1 finalization behavior.

- [ ] **Step 7: Commit Task 2**

```bash
git add v2/packages/korea-rent/src/public-summary-job.ts v2/packages/korea-rent/src/index.ts v2/packages/korea-rent/test/public-summary-job.test.ts
git commit -m "feat(v2): derive Seoul district public summaries"
```

---

### Task 3: Build and Strictly Parse the v1 Area Artifact

**Files:**
- Create: `v2/apps/web/lib/public-market/artifact-encoding.server.ts`
- Create: `v2/apps/web/lib/public-market/area-summary-schema.ts`
- Create: `v2/apps/web/lib/public-market/area-artifact-builder.server.ts`
- Modify: `v2/apps/web/lib/public-market/artifact-builder.server.ts`
- Create: `v2/apps/web/test/public-area-summary-schema.test.ts`
- Create: `v2/apps/web/test/public-area-artifact-builder.test.ts`
- Modify: `v2/apps/web/test/public-summary-artifact-builder.test.ts`

**Interfaces:**
- Consumes: `KoreaPublicAreaSummaryFinalization`, public provenance constants, and the canonical district catalog.
- Produces:

```ts
export const PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION =
  'signedprice-public-area-summary-v1' as const;

export type VerifiedPublicAreaSummaryArtifact = Readonly<{
  artifactVersion: typeof PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  citySummary: PublicMarketSummary;
  districtSummaries: readonly PublicMarketSummary[];
}>;

export function parsePublicAreaSummaryArtifact(
  value: unknown,
  expected: Readonly<{ marketId: 'kr-seoul'; period: string }>,
): VerifiedPublicAreaSummaryArtifact;

export function buildPublicAreaSummaryArtifact(
  finalization: KoreaPublicAreaSummaryFinalization,
): Promise<Readonly<{ artifact: unknown; serialized: string; sha256: string }>>;
```

- [ ] **Step 1: Write the failing exact-shape parser tests**

Use a literal root with only `artifactVersion`, `generatedAt`, `provenance`, `citySummary`, and `districtSummaries`. Assert acceptance of one valid 26-summary artifact and rejection of each independent mutation: extra root key, malformed provenance, non-canonical instant, wrong period, missing district, duplicate slug, order drift, wrong parent/deal/band, city-count mismatch, and a published tuple where `p25 > med`.

```ts
expect(parsed.districtSummaries.map(({ area }) => area))
  .toEqual(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug));
expect(parsed.citySummary.n)
  .toBe(parsed.districtSummaries.reduce((sum, summary) => sum + summary.n, 0));
```

- [ ] **Step 2: Add failing suppression and change-value tests**

Assert a withheld row containing even one money key is rejected. Reject non-finite change, `chg3m <= -100`, and change values with more than one decimal place. Accept `chg3m: null` and finite one-decimal values greater than `-100`.

- [ ] **Step 3: Add the failing canonical builder test**

Pass a deep literal finalization. Expect exact root/provenance keys, deep-frozen output, successful production-parser validation, deterministic serialization, and a lowercase 64-character SHA-256 digest. Assert serialized output does not match:

```ts
/serviceKey|apis\.data\.go\.kr|sourceRecordId|cache key|evidenceRef|building|raw xml/i
```

- [ ] **Step 4: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-summary-schema.test.ts apps/web/test/public-area-artifact-builder.test.ts apps/web/test/public-summary-artifact-builder.test.ts`

Expected: FAIL because the area artifact modules do not exist.

- [ ] **Step 5: Extract shared canonical encoding without changing P1 bytes**

Move the existing recursively sorted JSON encoder and Web Crypto digest into:

```ts
export async function encodeArtifact(value: unknown): Promise<Readonly<{
  serialized: string;
  sha256: string;
}>>;
```

Keep the P1 builder test's exact artifact and digest behavior green.

- [ ] **Step 6: Implement the fail-closed parser**

Start `area-summary-schema.ts` with `import 'server-only'`. Use exact-key guards. Parse every summary through `createPublicMarketSummary()`, then enforce fixed identity, catalog order, parent, period, suppression, one-decimal change, unique identity, and city-count sum. Convert every parser failure to `TypeError('Invalid public area summary artifact.')`.

- [ ] **Step 7: Implement and self-validate the builder**

Assemble provenance with only `marketId`, `period`, `provider`, `endpointVersion`, `parserVersion`, `rightsPolicyId`, and `sourceComplete`. Validate the in-memory object with the production parser before encoding and hashing it.

- [ ] **Step 8: Run focused regression and web typecheck**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-summary-schema.test.ts apps/web/test/public-area-artifact-builder.test.ts apps/web/test/public-summary-artifact-builder.test.ts apps/web/test/public-summary-repository.test.ts && pnpm --filter @signedprice/web typecheck`

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add v2/apps/web/lib/public-market/artifact-encoding.server.ts v2/apps/web/lib/public-market/area-summary-schema.ts v2/apps/web/lib/public-market/area-artifact-builder.server.ts v2/apps/web/lib/public-market/artifact-builder.server.ts v2/apps/web/test/public-area-summary-schema.test.ts v2/apps/web/test/public-area-artifact-builder.test.ts v2/apps/web/test/public-summary-artifact-builder.test.ts
git commit -m "feat(v2): validate Seoul public area artifacts"
```

---

### Task 4: Add the Server Repository and Pure Explore/Detail Models

**Files:**
- Create: `v2/apps/web/lib/public-market/area-summary-repository.server.ts`
- Create: `v2/apps/web/lib/public-market/area-route-types.ts`
- Create: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Create: `v2/apps/web/test/public-area-summary-repository.test.ts`
- Create: `v2/apps/web/test/public-area-route-model.test.ts`
- Create: `v2/apps/web/test/public-area-fixture.ts`

**Interfaces:**
- Consumes: the verified area parser, geometry, adjacency, `PublicMarketConfig`, and public summary union.
- Produces:

```ts
export type PublicAreaSummaryRepository = Readonly<{
  getCitySummary(): PublicMarketSummary;
  listDistrictSummaries(): readonly PublicMarketSummary[];
  getDistrictSummary(slug: SeoulDistrictSlug): PublicMarketSummary;
}>;

export function createPublicAreaSummaryRepository(input: Readonly<{
  source: unknown;
  expected: Readonly<{ marketId: 'kr-seoul'; period: string }>;
}>): PublicAreaSummaryRepository;

export class PublicAreaSummaryUnavailableError extends Error {
  readonly code: 'public_area_summary_unavailable';
}

export type ExploreDistrictModel = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/${string}/`;
  path: string;
  summary: PublicMarketSummary;
  state: 'published' | 'withheld';
  bucket: 0 | 1 | 2 | 3 | 4 | null;
}>;

export type PublicAreaLegendBucket = Readonly<{
  bucket: 0 | 1 | 2 | 3 | 4;
  count: number;
  minimumMedian: number;
  maximumMedian: number;
  label: string;
}>;

export type PublicAreaSourceBoundaryModel = Readonly<{
  provider: 'MOLIT';
  period: string;
  attribution: readonly ['Ministry of Land, Infrastructure and Transport (MOLIT)'];
  bandLabel: '45–55㎡';
  publicationMinimum: 5;
  geometryAttribution: 'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)';
}>;

export type PublicAreaExploreModel =
  | Readonly<{
      status: 'ready';
      selectedSlug: SeoulDistrictSlug;
      citySummary: PublicMarketSummary;
      districts: readonly ExploreDistrictModel[];
      legend: readonly PublicAreaLegendBucket[];
      source: PublicAreaSourceBoundaryModel;
    }>
  | Readonly<{
      status: 'unavailable';
      selectedSlug: null;
      districts: readonly [];
      source: PublicAreaSourceBoundaryModel;
      message: 'Verified district summary unavailable';
    }>;

export type PublicDistrictFaq = Readonly<{
  question: string;
  answer: string;
}>;

export type PublicDistrictModel =
  | Readonly<{
      status: 'published' | 'withheld';
      identity: SeoulRentCheckDistrict;
      summary: PublicMarketSummary;
      nearby: readonly SeoulRentCheckDistrict[];
      faq: readonly PublicDistrictFaq[];
      datasetJsonLd: Readonly<Record<string, unknown>>;
      faqJsonLd: Readonly<Record<string, unknown>>;
      source: PublicAreaSourceBoundaryModel;
    }>
  | Readonly<{
      status: 'unavailable';
      identity: SeoulRentCheckDistrict;
      nearby: readonly SeoulRentCheckDistrict[];
      source: PublicAreaSourceBoundaryModel;
      message: 'Verified district summary unavailable';
    }>;

export function buildPublicAreaExploreModel(
  selectedSlug: string | undefined,
  dependencies?: Readonly<{ source: unknown; period: string }>,
): PublicAreaExploreModel;

export function buildPublicDistrictModel(
  slug: string,
  dependencies?: Readonly<{ source: unknown; period: string }>,
): PublicDistrictModel | null;
```

- [ ] **Step 1: Write repository RED tests**

Assert exact city retrieval, immutable 25-item district order, exact slug lookup, and one sanitized error for missing source, invalid JSON, wrong period, rights/provenance mutation, or unknown summary.

```ts
expect(() => createPublicAreaSummaryRepository({ source: {}, expected }).getCitySummary())
  .toThrow(PublicAreaSummaryUnavailableError);
```

- [ ] **Step 2: Write deterministic bucket RED tests**

Use seven published medians with legal-code ties and two withheld rows. Sort only published rows by `[med, lawdCd]`; assign each sorted rank with:

```ts
Math.min(4, Math.floor(rank * 5 / publishedCount)) as 0 | 1 | 2 | 3 | 4
```

Assert withheld rows have `bucket: null`, every non-empty legend bucket prints its actual minimum and maximum median, and input catalog/table order remains legal-code order.

- [ ] **Step 3: Write Explore/detail model RED tests**

Assert valid selected query, invalid query fallback to `jongno-gu`, exact district hrefs, source/period copy, computed pluralized sample copy, symmetric nearby links, and no copied numeric prose. For a withheld district, serialize the complete model and assert the suppressed fixture's money sentinels do not occur. For invalid artifact input, expect `status: 'unavailable'` with no `districts` money array.

- [ ] **Step 4: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-summary-repository.test.ts apps/web/test/public-area-route-model.test.ts`

Expected: FAIL because the repository and models do not exist.

- [ ] **Step 5: Implement the server-only repository**

Read only `SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT` and `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD` in the default dependency factory. Parse once per repository construction, freeze returned arrays, and translate every parsing/lookup failure to `PublicAreaSummaryUnavailableError` without echoing the offending value.

- [ ] **Step 6: Implement one model source for map, table, detail, FAQ, and JSON-LD**

Build display strings through `Intl.NumberFormat('ko-KR', {style:'currency', currency:'KRW', maximumFractionDigits:0})`. Derive the heading, sample text, range, change, legend, FAQ, nearby links, Dataset object, and FAQPage object from the same summary instance. The FAQ list covers the district median/sample, how a typed quote is described relative to the median, what the middle half means, why `n < 5` is refused, and the source period/limitations. JSON-LD for withheld rows includes count, period, source, and refusal only—no monetary keys or money-bearing description.

- [ ] **Step 7: Run focused tests and typecheck**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-summary-repository.test.ts apps/web/test/public-area-route-model.test.ts && pnpm --filter @signedprice/web typecheck`

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add v2/apps/web/lib/public-market/area-summary-repository.server.ts v2/apps/web/lib/public-market/area-route-types.ts v2/apps/web/lib/public-market/area-route-model.server.ts v2/apps/web/test/public-area-summary-repository.test.ts v2/apps/web/test/public-area-route-model.test.ts v2/apps/web/test/public-area-fixture.ts
git commit -m "feat(v2): model Seoul district public evidence"
```

---

### Task 5: Generate and Install the Branch-Scoped P2 Artifact

**Files:**
- Create temporarily: `v2/apps/web/lib/public-market/public-area-summary-job-cache.server.ts`
- Create temporarily: `v2/apps/web/lib/public-market/area-job-handler.server.ts`
- Create temporarily: `v2/apps/web/app/api/internal/public-area-summary-job/route.ts`
- Create temporarily: `v2/apps/web/test/public-area-summary-job-cache.test.ts`
- Create temporarily: `v2/apps/web/test/public-area-summary-job-handler.test.ts`
- Create: `artifacts/public-p2/preview-area-summary-job.json`

**Interfaces:**
- Consumes: `runKoreaPublicSummaryBatch()`, `finalizeKoreaPublicAreaSummaryJob()`, `buildPublicAreaSummaryArtifact()`, the existing isolated source job cache namespace, and the already configured Preview `DATA_GO_KR_SERVICE_KEY`.
- Produces only these POST actions and sanitized responses:

```ts
type AreaJobRequest =
  | Readonly<{ action: 'batch'; referenceInstant: string; cursor: number }>
  | Readonly<{ action: 'finalize'; referenceInstant: string }>;

type AreaFinalizeResponse = Readonly<{
  status: 'complete';
  period: string;
  generatedAt: string;
  completedCoordinates: 700;
  cityN: number;
  districtCount: 25;
  districtNSum: number;
  artifact: string;
  sha256: string;
}>;
```

- [ ] **Step 1: Write cache isolation and handler RED tests**

Assert the adapter uses namespace `signedprice:kr-public-summary-job:v1` and tag `kr-public-summary-job:v1`, never the Rent Check namespace/tag. Assert non-Preview, missing-key, wrong method, wrong content type, malformed body, unknown keys, cursor bounds, provider failure, and rights block all return exact categorical envelopes with `cache-control: no-store` and no source/key text.

- [ ] **Step 2: Add the finalize RED test**

Inject literal finalization and builder functions. Assert the response count equality, canonical artifact string, digest, and absence of source URL, cache value, record ID, and service key.

- [ ] **Step 3: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-summary-job-cache.test.ts apps/web/test/public-area-summary-job-handler.test.ts`

Expected: FAIL because the temporary runner does not exist.

- [ ] **Step 4: Implement the bounded Preview-only runner**

Set `dynamic = 'force-dynamic'` and `maxDuration = 60`. Export POST only; map GET/HEAD/OPTIONS/PUT/PATCH/DELETE to 405. Guard `VERCEL_ENV === 'preview'` and a non-empty server-only key before invoking package code. Never return provider diagnostics beyond the approved categorical code.

- [ ] **Step 5: Run runner regression, build, and boundary scan**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-summary-job-cache.test.ts apps/web/test/public-area-summary-job-handler.test.ts packages/korea-rent/test/public-summary-job.test.ts && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary`

Expected: PASS; the service key and provider endpoint are absent from client assets.

- [ ] **Step 6: Commit and deploy the temporary runner to the existing P2 Preview branch**

```bash
git add v2/apps/web/lib/public-market/public-area-summary-job-cache.server.ts v2/apps/web/lib/public-market/area-job-handler.server.ts v2/apps/web/app/api/internal/public-area-summary-job/route.ts v2/apps/web/test/public-area-summary-job-cache.test.ts v2/apps/web/test/public-area-summary-job-handler.test.ts
git commit -m "feat(v2): add protected area summary preview runner"
```

Push only to `codex/signedprice-seoul-rent-check-v2`. Confirm the deployment metadata has this exact commit SHA, `target: null`, the exact branch ref, Vercel Authentication, and `READY` state.

- [ ] **Step 7: Resume only missing coordinates and finalize**

Use reference instant `2026-08-31T00:00:00.000Z`. POST `{action:'batch', referenceInstant, cursor}` until `nextCursor === 700`; cached coordinates must create zero provider calls. Then POST `{action:'finalize', referenceInstant}` and verify:

```ts
response.completedCoordinates === 700
response.districtCount === 25
response.cityN === response.districtNSum
/^[0-9a-f]{64}$/.test(response.sha256)
```

- [ ] **Step 8: Independently validate and install the artifact**

Parse the returned string with `parsePublicAreaSummaryArtifact()` against the configured period, recompute canonical SHA-256, scan sensitive markers, and compare the city summary byte-for-byte with the installed P1 city artifact for the same period. Add `SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT` only to Preview and only to branch `codex/signedprice-seoul-rent-check-v2`; do not alter `SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT`, period, service key, or Production.

- [ ] **Step 9: Record sanitized evidence and commit**

Write only `commit`, `deploymentId`, `branch`, `target`, `period`, `generatedAt`, `completedCoordinates`, `cityN`, `districtCount`, `districtNSum`, `artifactVersion`, and `sha256` to `artifacts/public-p2/preview-area-summary-job.json`. Do not store the artifact body or a protected share token.

```bash
git add artifacts/public-p2/preview-area-summary-job.json
git commit -m "docs(v2): record P2 area summary evidence"
```

---

### Task 6: Replace the Fixture Explorer with the SSR Area Explorer

**Files:**
- Create: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Create: `v2/apps/web/components/public-market/area-explorer.tsx`
- Create: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/app/kr/seoul/explore/page.tsx`
- Create: `v2/apps/web/test/public-area-explorer-state.test.ts`
- Create: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/explorer-ui-contract.test.ts`

**Interfaces:**
- Consumes: `PublicAreaExploreModel` with 25 safe district models and an optional validated query selection.
- Produces a no-fetch client enhancement:

```ts
export type AreaExplorerState = Readonly<{
  selectedSlug: SeoulDistrictSlug;
  districtSlugs: readonly SeoulDistrictSlug[];
}>;
export type AreaExplorerAction = Readonly<{
  type: 'select';
  slug: string;
}>;
export function areaExplorerReducer(
  state: AreaExplorerState,
  action: AreaExplorerAction,
): AreaExplorerState;
```

- [ ] **Step 1: Write the selection-state RED test**

Assert a valid map or row selection produces the same state, repeat selection preserves object identity, and a slug outside `state.districtSlugs` cannot enter state.

- [ ] **Step 2: Write the complete initial-HTML RED test**

Render the real component with a complete literal area fixture. Assert 25 English and Korean names, 25 counts, period, MOLIT, rights attribution, all published medians, explicit `Not published` text, five bucket classes, hatching, a visible legend, and 25 detail hrefs. Serialize the markup and assert withheld money sentinels are absent.

- [ ] **Step 3: Write unavailable/no-JavaScript RED tests**

Render the page model with invalid artifact dependencies. Expect `Verified district summary unavailable`, a hairline unavailable frame, source/period boundary, no district money, no misleading P1 fallback, and a link back to the Seoul evidence page. Confirm the server table exists inside initial markup without waiting for an effect.

- [ ] **Step 4: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-explorer-state.test.ts apps/web/test/public-area-explorer.test.tsx`

Expected: FAIL because the area explorer does not exist and the old fixture Explorer still renders neighbourhood/building discovery.

- [ ] **Step 5: Implement synchronized SVG and table controls**

Render one `svg` with viewBox `0 0 720 560`, one path per district, `<title>` text naming district/state/value/sample, five cobalt CSS classes, a hatch pattern for withheld rows, and a 3px selected outline. Paths may update selection by pointer; table-row buttons are the keyboard-equivalent controls. The selected explanation uses `aria-live="polite"` and the explicit word `Selected`.

- [ ] **Step 6: Implement server-first page wiring**

Read `searchParams` as a Promise, accept only a single `district` string in the catalog, call `buildPublicAreaExploreModel()`, and render the unavailable union explicitly. Export static metadata:

```ts
export const metadata: Metadata = {
  title: 'Seoul district jeonse evidence | signedprice',
  description: 'Compare verified 45–55㎡ refundable jeonse deposits across Seoul districts.',
  robots: { index: false, follow: true },
};
```

Do not export canonical, hreflang, or sitemap data.

- [ ] **Step 7: Implement responsive Modernist layout**

Use a square-corner, 2px ink-frame grid with map plus `380px` rail on desktop. At `max-width: 720px`, use one column, map then an 88px-minimum legend then the 25-row table in natural flow. Disable direct SVG pointer interaction at that breakpoint so the 44px table rows are the mobile selection controls; row selection still updates the map. Give every button/link `min-height: 44px`; use `outline: 2px solid #1d4ed8; outline-offset: 2px`; prevent map/table overflow with `min-width: 0` and `max-width: 100%`.

- [ ] **Step 8: Retire the old route contract without deleting reusable Rent Check context code**

Update `explorer-ui-contract.test.ts` so `/kr/seoul/explore/` no longer promises neighbourhood/building fixture UI. Keep `seoul-explorer-data.ts` only where the separate Rent Check context tests still import it; do not expose its fixture labels from the new route.

- [ ] **Step 9: Run focused tests, lint, typecheck, and build**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-area-explorer-state.test.ts apps/web/test/public-area-explorer.test.tsx apps/web/test/explorer-ui-contract.test.ts && pnpm lint && pnpm typecheck && pnpm build`

Expected: PASS; build output lists `/kr/seoul/explore` as an SSR route and no old fixture evidence appears in its HTML test.

- [ ] **Step 10: Commit Task 6**

```bash
git add v2/apps/web/lib/public-market/area-explorer-state.ts v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/app/kr/seoul/explore/page.tsx v2/apps/web/test/public-area-explorer-state.test.ts v2/apps/web/test/public-area-explorer.test.tsx v2/apps/web/test/explorer-ui-contract.test.ts
git commit -m "feat(v2): render verified Seoul district explorer"
```

---

### Task 7: Generate 25 District Detail Pages Through the Existing Third Segment

**Files:**
- Create: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Create: `v2/apps/web/components/public-market/district-detail.module.css`
- Create: `v2/apps/web/components/public-market/sample-chip.tsx`
- Modify: `v2/apps/web/components/public-market/quote-input.tsx`
- Modify: `v2/apps/web/app/[country]/[city]/[intent]/page.tsx`
- Create: `v2/apps/web/lib/public-market/public-third-segment.server.ts`
- Create: `v2/apps/web/test/public-district-detail.test.tsx`
- Create: `v2/apps/web/test/public-third-segment-route.test.tsx`
- Modify: `v2/apps/web/test/public-quote-input.test.tsx`

**Interfaces:**
- Consumes: `buildIntentPageModel()`, `publicIntentRouteParams`, `buildPublicDistrictModel()`, and the canonical 25 district slugs.
- Produces one discriminated resolver:

```ts
type PublicThirdSegmentModel =
  | Readonly<{ kind: 'intent'; model: IntentPageModel }>
  | Readonly<{ kind: 'district'; model: PublicDistrictModel }>;

export function resolvePublicThirdSegment(
  country: string,
  city: string,
  segment: string,
): PublicThirdSegmentModel | null;
```

- [ ] **Step 1: Write the route-collision RED tests**

Assert `rent`, `buy`, and `invest` still resolve as intents; each of the 25 canonical slugs resolves as a district only for `kr/seoul`; `explore` and `tools` are not claimed; and `unknown-gu` returns null. Assert static params equal existing intent params plus exactly 25 district params with no duplicate serialized path.

- [ ] **Step 2: Write published detail RED tests**

Render Gangnam from a literal published summary. Assert H1 includes the finding and sample, the real BoxPlot/QuoteInput/SampleChip markup, five-number values, period/source/rights/limitations, computed FAQ, Dataset and FAQPage scripts, nearby links, and `/kr/seoul/explore/?district=gangnam-gu` return link.

- [ ] **Step 3: Write withheld and unavailable RED tests**

Render a four-sample district. Expect count, hatch, `Not published`, nearby/Explore actions, and no BoxPlot numeric labels, quote marker, median, range, money-bearing FAQ answer, or money-bearing JSON-LD. Render unavailable and assert no district money and no P1-city fallback.

- [ ] **Step 4: Write local quote RED tests**

Extend `QuoteInput` with `areaLabel` and `showMedianFaq`. Assert the select names the district, a changed quote produces an above/equal/below median answer without the words `fair`, `unfair`, `good`, or `bad`, and the component contains no `fetch`, form action, or request side effect.

- [ ] **Step 5: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-third-segment-route.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-quote-input.test.tsx`

Expected: FAIL because district routing/detail rendering and quote FAQ props do not exist.

- [ ] **Step 6: Add district params without creating a conflicting App Router folder**

Keep the existing directory `app/[country]/[city]/[intent]/`. In `public-third-segment.server.ts`, add 25 `{country:'kr', city:'seoul', intent:slug}` params to the existing intent params, resolve the segment before rendering, and branch to `DistrictDetailPage` or the existing intent components. This avoids the invalid sibling pair `[intent]` and `[district]` and keeps the general `route-model.ts` free of server-only artifact imports. Both `generateMetadata()` and the page use the same resolver.

- [ ] **Step 7: Render safe structured data from the route model**

Serialize model-owned Dataset and FAQPage objects with `<` replaced by `\\u003c` before assigning to `dangerouslySetInnerHTML`. Do not calculate a number or write a second summary inside the component. Withheld structured data contains sample count and refusal only.

- [ ] **Step 8: Extend QuoteInput without changing P1 behavior**

Default `areaLabel` to `config.marketLabel` and `showMedianFaq` to false. When enabled, derive the visible answer from the existing `buildPublicQuoteViewModel()` position/summary and place it in the existing polite live region. Keep all computation local and reuse the fixed Korea axis.

- [ ] **Step 9: Run focused tests, all route tests, and build**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-third-segment-route.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-quote-input.test.tsx apps/web/test/route-model.test.ts apps/web/test/public-route-contract.test.tsx && pnpm typecheck && pnpm build`

Expected: PASS; build output includes all 25 district params, existing intent pages, and custom 404 behavior for unknown slugs.

- [ ] **Step 10: Commit Task 7**

```bash
git add v2/apps/web/components/public-market/district-detail-page.tsx v2/apps/web/components/public-market/district-detail.module.css v2/apps/web/components/public-market/sample-chip.tsx v2/apps/web/components/public-market/quote-input.tsx v2/apps/web/app/[country]/[city]/[intent]/page.tsx v2/apps/web/lib/public-market/public-third-segment.server.ts v2/apps/web/test/public-district-detail.test.tsx v2/apps/web/test/public-third-segment-route.test.tsx v2/apps/web/test/public-quote-input.test.tsx
git commit -m "feat(v2): add Seoul district evidence pages"
```

---

### Task 8: Add the Public Tabs and Complete Source Boundary

**Files:**
- Create: `v2/apps/web/components/public-market/public-section-tabs.tsx`
- Create: `v2/apps/web/components/public-market/public-source-boundary.tsx`
- Modify: `v2/apps/web/components/public-market/public-market-page.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/public-market.module.css`
- Modify: `v2/apps/web/lib/public-market/route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Create: `v2/apps/web/test/public-section-tabs.test.tsx`
- Create: `v2/apps/web/test/public-source-boundary.test.tsx`
- Modify: `v2/apps/web/test/public-korea-routes.test.tsx`

**Interfaces:**
- Consumes: current public section (`check` or `explore`), period, sample counts, and the active rights policy attribution.
- Produces:

```ts
export function PublicSectionTabs({ current }: Readonly<{
  current: 'check' | 'explore';
}>): React.ReactNode;

export function PublicSourceBoundary({ model }: Readonly<{
  model: Readonly<{
    period: string;
    provider: 'MOLIT';
    attribution: readonly string[];
    band: '45–55㎡';
    includesNewAndRenewal: true;
    includesUnknownContractType: true;
    includesUnknownRecordStatus: true;
  }>;
}>): React.ReactNode;
```

- [ ] **Step 1: Write tabs RED tests**

Assert Check links to `/kr/check/seoul/`, Explore links to `/kr/seoul/explore/`, the current item has `aria-current="page"`, and News/Guide are non-anchor labelled future states. Assert no tab links to a 404 and all interactive tabs are at least 44px by CSS contract.

- [ ] **Step 2: Write disclosure RED tests**

Assert visible text names MOLIT, exact period, 45–55㎡ filed area, refundable zero-rent jeonse, canceled-record exclusion, new/renewal mixing, unknown contract type/status inclusion, rights attribution, KOSTAT/southkorea/seoul-maps/Apache-2.0 geometry attribution, no-listing/no-appraisal/no-legal-advice boundary, and `n < 5` refusal. Assert no email input or subscription copy.

- [ ] **Step 3: Run focused tests and confirm RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-section-tabs.test.tsx apps/web/test/public-source-boundary.test.tsx apps/web/test/public-korea-routes.test.tsx`

Expected: FAIL because the shared tabs/disclosure do not exist.

- [ ] **Step 4: Implement and place the shared components**

Place tabs immediately after the public header on Check, Korea home/evidence, Explore, and district detail pages. Use `current='check'` for existing P1 surfaces and `current='explore'` for Explore/detail. Place the complete source boundary before page navigation/footer on every P2 page and update the P1 disclosure copy only where the same verified meaning applies.

- [ ] **Step 5: Derive period and attribution instead of hard-coding numeric prose**

Build the disclosure model in route models from `summary.period` and the fixed reviewed rights attribution. Keep the explanatory policy sentences static, but keep every period/count/value in the model.

- [ ] **Step 6: Run focused tests and P1 regression**

Run: `cd v2 && pnpm exec vitest run apps/web/test/public-section-tabs.test.tsx apps/web/test/public-source-boundary.test.tsx apps/web/test/public-korea-routes.test.tsx apps/web/test/public-market-components.test.tsx apps/web/test/public-route-contract.test.tsx && pnpm lint && pnpm typecheck`

Expected: PASS with P1 output semantics unchanged.

- [ ] **Step 7: Commit Task 8**

```bash
git add v2/apps/web/components/public-market/public-section-tabs.tsx v2/apps/web/components/public-market/public-source-boundary.tsx v2/apps/web/components/public-market/public-market-page.tsx v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/district-detail-page.tsx v2/apps/web/components/public-market/public-market.module.css v2/apps/web/lib/public-market/route-model.server.ts v2/apps/web/lib/public-market/area-route-model.server.ts v2/apps/web/test/public-section-tabs.test.tsx v2/apps/web/test/public-source-boundary.test.tsx v2/apps/web/test/public-korea-routes.test.tsx
git commit -m "feat(v2): add public evidence navigation and boundary"
```

---

### Task 9: Close Browser, Privacy, Runner-Removal, and Preview Release Gates

**Files:**
- Create: `v2/tests/e2e/public-area-summary-fixture.ts`
- Create: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`
- Modify: `v2/playwright.config.ts`
- Modify: `.github/workflows/signedprice-v2-ci.yml`
- Modify: `v2/scripts/scan-rent-check-client-boundary.mjs`
- Create: `v2/tests/public-area-runner-absence.test.ts`
- Delete: `v2/apps/web/lib/public-market/public-area-summary-job-cache.server.ts`
- Delete: `v2/apps/web/lib/public-market/area-job-handler.server.ts`
- Delete: `v2/apps/web/app/api/internal/public-area-summary-job/route.ts`
- Delete: `v2/apps/web/test/public-area-summary-job-cache.test.ts`
- Delete: `v2/apps/web/test/public-area-summary-job-handler.test.ts`
- Modify: `artifacts/public-p2/preview-area-summary-job.json`

**Interfaces:**
- Consumes: a complete synthetic 26-summary artifact supplied only to Playwright's local web server and the real branch-scoped artifact on protected Preview.
- Produces CI projects `wide-chromium` (`1440×900`, area tests only), `desktop-chromium` (`1366×768`), and `mobile-chromium` (`390×844`).

- [ ] **Step 1: Write browser RED tests against real SSR behavior**

Test initial HTML and hydrated behavior for all of these outcomes:

```ts
await expect(page.getByRole('row', { name: /Jongno-gu 종로구/ })).toBeVisible();
await expect(page.getByRole('link', { name: /Open Jongno-gu evidence/ }))
  .toHaveAttribute('href', '/kr/seoul/jongno-gu/');
await page.getByRole('button', { name: /Select Gangnam-gu/ }).click();
await expect(page.getByText(/Selected · Gangnam-gu/)).toBeVisible();
```

Also assert 25 reachable districts, map/row selection agreement, actual legend endpoints, hatch and refusal, detail return-selection query, published and withheld detail branches, quote updates with zero observed requests, no console error, no 5xx, no horizontal overflow, visible focus, and 44px controls.

- [ ] **Step 2: Add metadata/route/privacy RED tests**

Add Explore plus all 25 detail paths to the noindex route contract. Assert zero canonical/hreflang, zero sitemap entries, unknown district 404, and sale/wolse/unbuilt states expose no area artifact money under another metric. Extend the boundary scan to reject these strings in client JavaScript:

```txt
SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT
signedprice-public-area-summary-v1
apis.data.go.kr
sourceRecordId
public-area-summary-job
```

The artifact version may appear in server output but never a client asset.

- [ ] **Step 3: Write the runner-absence RED test before deletion**

Assert no source file, App Router route, build manifest entry, or method handler contains `public-area-summary-job`, and no `api/internal` route for it remains. Run once and confirm it fails while the temporary runner exists.

- [ ] **Step 4: Run browser/static RED gates**

Run: `cd v2 && pnpm exec vitest run tests/public-area-runner-absence.test.ts apps/web/test/public-area-route-model.test.ts && pnpm exec playwright test tests/e2e/area-explore.spec.ts --project=desktop-chromium --project=mobile-chromium --project=wide-chromium`

Expected: runner absence FAIL before deletion; browser failures identify unimplemented viewport/interaction assertions rather than fixture/schema errors.

- [ ] **Step 5: Add the complete synthetic browser fixture and projects**

The fixture contains all 26 exact identities, at least one withheld row, tied medians, all five buckets, and sentinel values unrelated to the operational artifact. Add it to `webServer.env` as `SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT`. Configure `wide-chromium` with `testMatch: /area-explore\.spec\.ts/` so existing suites do not triple-run. Update CI to pass all three explicit projects.

- [ ] **Step 6: Remove the temporary generator and make the absence test GREEN**

Delete only the five temporary files listed above. Keep package finalization, strict parser, builder, sanitized evidence, and branch-scoped artifact. Build and inspect `.next/server/app-paths-manifest.json` to confirm no runner route.

- [ ] **Step 7: Run the full local release gate**

Run each command independently and require exit 0:

```bash
cd v2 && pnpm test
cd v2 && pnpm lint
cd v2 && pnpm typecheck
cd v2 && pnpm exec vitest run tests/public-p1-workbook-qa.test.ts
cd v2 && pnpm build
cd v2 && pnpm check:rent-client-boundary
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

Expected baseline: all V2 tests pass; Phase 0 remains exactly `898 total / 875 pass / 23 locked fail` unless an independently committed baseline update on `main` changes those literal counts before execution.

- [ ] **Step 8: Commit the final candidate**

```bash
git add .github/workflows/signedprice-v2-ci.yml v2/playwright.config.ts v2/tests/e2e/public-area-summary-fixture.ts v2/tests/e2e/area-explore.spec.ts v2/tests/e2e/public-route-contract.ts v2/tests/e2e/visible-foundation.spec.ts v2/scripts/scan-rent-check-client-boundary.mjs v2/tests/public-area-runner-absence.test.ts artifacts/public-p2/preview-area-summary-job.json
git add -u v2/apps/web/lib/public-market v2/apps/web/app/api/internal v2/apps/web/test
git commit -m "test(v2): gate Seoul district public release"
```

- [ ] **Step 9: Deploy and verify the exact final SHA on protected Preview**

Confirm `READY`, `target: null`, exact branch/SHA, Vercel Authentication, and unchanged Production deployment. At 1440×900, 1366×768, and 390×844, execute the full browser story against the exact deployment, including one published district and any real withheld district if present. Verify `/api/status` returns that SHA, `environment: "preview"`, `indexing: "blocked"`, and `cache-control: no-store`.

- [ ] **Step 10: Verify the real artifact and served pages together**

Record and compare the branch artifact SHA-256, period, generated instant, city count, 25-district count, district-count sum, source/rights constants, and every served district count/median. Confirm withheld rows reveal no money in HTML or React payload. Confirm the final build has no generator marker and client assets have no artifact, service key, endpoint, raw record, or server module text.

- [ ] **Step 11: Obtain read-only final review and close P2 Explore**

Request a configured PR/Vercel read-only review of artifact arithmetic, route precedence, withholding privacy, noindex/sitemap posture, accessibility, and responsive geometry. Resolve every Critical or Important finding test-first, rerun Steps 7–10, and record zero remaining Critical/Important findings in the sanitized evidence file. Do not merge or promote the PR.

---

## Plan Self-Review Checklist

- [x] Every included spec requirement maps to Tasks 1–9; News/Guide content, neighbourhood/building publication, P3 sheet behavior, indexing, and Production remain explicitly excluded.
- [x] Parser, repository, route-model, map/table, detail, quote, metadata, client-boundary, runner-removal, and browser contracts each have an observed RED before implementation.
- [x] `SeoulDistrictSlug`, `KoreaPublicAreaSummaryFinalization`, `VerifiedPublicAreaSummaryArtifact`, repository methods, route-model builders, and third-segment resolver names are identical across producing and consuming tasks.
- [x] The plan contains no generated operational number, copied P1 city value, mock district publication claim, or secret-bearing command.
- [x] The final candidate contains the immutable artifact consumer and evidence but no temporary generator route or handler.
