# signedprice P2 Seoul Rankings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/kr/seoul/rankings/` with four deterministic, server-rendered district rankings derived only from the installed verified P2 area-summary artifact.

**Architecture:** A new server-only rankings model reads the existing area-summary repository once, derives and freezes all ranking rows, exclusion counts, labels, and signed-bar geometry, then passes a display-only union to a server React component. A static route owns metadata and site chrome; Explore and district detail add secondary links without altering the four primary workbook tabs.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript 5.9, CSS Modules, Vitest 4, Playwright 1.62, Vercel Git deployments.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-p2-rankings-design.md`

## Global Constraints

- Route: `/kr/seoul/rankings/`; the Explore primary tab remains current.
- Source: only `SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT` plus `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD`; no provider request, API key, cache key, fixture fallback, or new environment variable.
- Evidence: MOLIT reported zero-rent jeonse, 45–55㎡ filed area, configured completed period, publication minimum `n >= 5`.
- Metrics: `med` ascending; `chg3m` ascending and non-null only; `p75 - p25` descending; `n` descending.
- Ties: Seoul legal code ascending; displayed rank is ordinal row position.
- Precision: whole KRW, signed one-decimal percent with `0.0%` for zero, integer counts; sorting always uses raw values.
- Withheld districts never enter a ranking; null `chg3m` excludes only the change list.
- Failure: any artifact, provenance, period, reconciliation, order, or summary error returns the sanitized unavailable state with no numeric rows.
- SEO: `noindex, follow`, no canonical/hreflang, and no sitemap entry.
- Responsive/accessibility: 1440px, 720px, and 390px; no horizontal overflow; logical keyboard order; links at least 44px; values never rely on colour or JavaScript.
- KoreaHomeGuide content and URLs remain unchanged.

---

### Task 1: Pure Rankings Model

**Files:**
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Create: `v2/apps/web/lib/public-market/rankings-route-model.server.ts`
- Create: `v2/apps/web/test/public-area-rankings-model.test.ts`
- Modify: `v2/apps/web/test/public-area-fixture.ts`

**Interfaces:**
- Consumes: `createPublicAreaSummaryRepository({ source, expected })`, `SEOUL_RENT_CHECK_DISTRICTS`, `PublishedMarketSummary`, and the existing source-boundary builder.
- Produces: `buildPublicAreaRankingsModel(dependencies?: PublicAreaRouteDependencies): PublicAreaRankingsModel` and immutable row/list types consumed by Task 2.

- [ ] **Step 1: Extend the fixture without weakening existing defaults**

Add optional per-district overrides so tests can hand-derive every metric while existing callers retain current fixture values:

```ts
export type PublishedSummaryOverrides = Readonly<Partial<{
  n: number;
  min: number;
  p25: number;
  med: number;
  p75: number;
  max: number;
  chg3m: number | null;
}>>;

export type PublicAreaFixtureOptions = Readonly<{
  publishedMedians?: Readonly<Partial<Record<SeoulDistrictSlug, number>>>;
  withheldCounts?: Readonly<Partial<Record<SeoulDistrictSlug, number>>>;
  publishedOverrides?: Readonly<Partial<Record<SeoulDistrictSlug, PublishedSummaryOverrides>>>;
}>;
```

Merge each override into its published summary before returning the artifact; do not bypass schema validation.

- [ ] **Step 2: Write the failing model tests**

Cover exact order and values for all four lists, legal-code ties for each metric, IQR rather than full range, withheld omission, null-change-only omission, positive-only/negative-only/mixed/all-zero change geometry, empty lists, source immutability, recursive output freezing, invalid artifact, and period mismatch.

Representative assertions:

```ts
const model = buildPublicAreaRankingsModel({ source: artifact, period: PUBLIC_AREA_FIXTURE_PERIOD });
expect(model.status).toBe('ready');
if (model.status !== 'ready') throw new Error('Expected ready rankings');
expect(model.cheapest.map(({ slug }) => slug)).toEqual(['jongno-gu', 'jung-gu']);
expect(model.spread[0]).toMatchObject({ slug: 'jung-gu', metric: 80_000_000 });
expect(model.change[0].bar).toMatchObject({ direction: 'negative', startPct: 0, endPct: 50 });
expect(Object.isFrozen(model.change)).toBe(true);
expect(artifact).toEqual(before);
```

- [ ] **Step 3: Run the focused test and verify RED**

Run: `pnpm exec vitest run apps/web/test/public-area-rankings-model.test.ts`

Expected: FAIL because `buildPublicAreaRankingsModel` and ranking types do not exist.

- [ ] **Step 4: Define exact immutable types**

Add:

```ts
export type RankingKind = 'cheapest' | 'change' | 'spread' | 'sample';

export type SignedRankingBar = Readonly<{
  direction: 'negative' | 'zero' | 'positive';
  startPct: number;
  endPct: number;
  extentPct: number;
}>;

export type PublicDistrictRankingRow = Readonly<{
  kind: RankingKind;
  rank: number;
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  nameEn: string;
  nameKo: string;
  href: `/kr/seoul/${string}/`;
  metric: number;
  valueLabel: string;
  bar: SignedRankingBar | null;
}>;

export type PublicAreaRankingsModel =
  | Readonly<{
      status: 'ready';
      cheapest: readonly PublicDistrictRankingRow[];
      change: readonly PublicDistrictRankingRow[];
      spread: readonly PublicDistrictRankingRow[];
      sample: readonly PublicDistrictRankingRow[];
      withheldDistrictCount: number;
      changeExcludedDistrictCount: number;
      hasNegativeChange: boolean;
      changeAxisLabel: Readonly<{ minimum: string; maximum: string }>;
      source: PublicSourceBoundaryModel;
    }>
  | Readonly<{
      status: 'unavailable';
      message: 'Verified district summary unavailable';
      source: PublicSourceBoundaryModel;
    }>;
```

- [ ] **Step 5: Implement the minimal server model**

Export the existing source-boundary factory with an option that omits geometry for Rankings. In the new module, parse once, map identities by slug, allocate new arrays, sort with this comparator, attach ordinal ranks after sorting, and freeze every object/array:

```ts
function compare(primary: (summary: PublishedMarketSummary) => number, order: 1 | -1) {
  return (left: PublishedMarketSummary, right: PublishedMarketSummary) => {
    const delta = (primary(left) - primary(right)) * order;
    if (delta !== 0) return delta;
    return identityFor(left.area).lawdCd.localeCompare(identityFor(right.area).lawdCd);
  };
}
```

For change bars, normalize to `maxAbs`, use a fixed 50% centre, and return zero geometry when `maxAbs === 0`:

```ts
const extentPct = maxAbs === 0 ? 0 : Math.abs(metric) / maxAbs * 50;
const startPct = metric < 0 ? 50 - extentPct : 50;
const endPct = metric > 0 ? 50 + extentPct : 50;
```

Catch all repository/model errors and return only the unavailable union.

- [ ] **Step 6: Run focused model tests and verify GREEN**

Run: `pnpm exec vitest run apps/web/test/public-area-rankings-model.test.ts apps/web/test/public-area-route-model.test.ts apps/web/test/public-area-summary-repository.test.ts`

Expected: all tests PASS; no fixture or source mutation.

- [ ] **Step 7: Commit the model**

```bash
git add v2/apps/web/lib/public-market/area-route-types.ts v2/apps/web/lib/public-market/area-route-model.server.ts v2/apps/web/lib/public-market/rankings-route-model.server.ts v2/apps/web/test/public-area-fixture.ts v2/apps/web/test/public-area-rankings-model.test.ts
git commit -m "feat(v2): derive Seoul district rankings"
```

### Task 2: Server Page and Accessible Ranking Sections

**Files:**
- Create: `v2/apps/web/components/public-market/district-rankings.tsx`
- Create: `v2/apps/web/components/public-market/district-rankings.module.css`
- Create: `v2/apps/web/app/kr/seoul/rankings/page.tsx`
- Create: `v2/apps/web/test/public-area-rankings.test.tsx`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`

**Interfaces:**
- Consumes: `PublicAreaRankingsModel`, `buildPublicAreaRankingsModel()`.
- Produces: `DistrictRankings({ model })` and the concrete `/kr/seoul/rankings/` route.

- [ ] **Step 1: Write the failing server-render tests**

Render ready, empty, and unavailable literal models. Assert four semantic headings, every row/name/value/rank, exact metric definitions, exclusion copy derived from model counts, centre line and symmetric endpoint labels, fill/outline text, all district `href`s, Explore as current tab, no amount in empty/unavailable states, and metadata with no alternates:

```ts
expect(metadata.robots).toEqual({ index: false, follow: true });
expect(metadata).not.toHaveProperty('alternates');
expect(html).toContain('Median refundable jeonse deposit');
expect(html).toContain('Middle-half spread (P75 − P25)');
expect(html).toContain('data-change-centre="true"');
expect(html).toContain('href="/kr/seoul/jongno-gu/"');
```

- [ ] **Step 2: Run render tests and verify RED**

Run: `pnpm exec vitest run apps/web/test/public-area-rankings.test.tsx apps/web/test/public-route-contract.test.tsx`

Expected: FAIL because the component and route are absent.

- [ ] **Step 3: Implement the static route**

Create metadata with `robots: { index: false, follow: true }` and no `alternates`. Build the model once, render `SiteHeader`, `PublicSectionTabs current="explore"`, `DistrictRankings`, `SiteFooter`, and no client boundary.

- [ ] **Step 4: Implement semantic complete lists**

Use one reusable server helper for each list but supply explicit title/definition/eligibility copy. Render `<section>` + `<ol>`; each row includes visible ordinal rank, bilingual linked district name, and text metric. The change row additionally renders:

```tsx
<div className={styles.signedTrack} aria-hidden="true">
  <span className={styles.centre} data-change-centre="true" />
  <span
    className={row.bar.direction === 'positive' ? styles.positive : styles.negative}
    data-change-direction={row.bar.direction}
    style={{ left: `${row.bar.startPct}%`, width: `${row.bar.extentPct}%` }}
  />
</div>
```

Keep the signed text value outside the `aria-hidden` graphic. State `No eligible district fell` when `hasNegativeChange` is false without hiding the ordered list.

- [ ] **Step 5: Implement responsive and focus CSS**

Use a two-column grid above 720px and one natural-flow column at `max-width: 720px`. Use `min-width: 0`, wrapping grid rows, tabular numerals, `min-height: 44px` links, the existing cobalt `:focus-visible` ring, and a non-scrolling 0–100% signed axis. Negative bars are filled; positive bars are outlined; zero has `width: 0` with its numeric text still visible.

- [ ] **Step 6: Run render and route tests and verify GREEN**

Run: `pnpm exec vitest run apps/web/test/public-area-rankings.test.tsx apps/web/test/public-route-contract.test.tsx`

Expected: all tests PASS and metadata contains no canonical/hreflang.

- [ ] **Step 7: Commit the page**

```bash
git add v2/apps/web/components/public-market/district-rankings.tsx v2/apps/web/components/public-market/district-rankings.module.css v2/apps/web/app/kr/seoul/rankings/page.tsx v2/apps/web/test/public-area-rankings.test.tsx v2/apps/web/test/public-route-contract.test.tsx
git commit -m "feat(v2): render Seoul district rankings"
```

### Task 3: Explore and District Cross-Links

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail.module.css`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`

**Interfaces:**
- Consumes: the concrete `/kr/seoul/rankings/` route from Task 2.
- Produces: secondary `View district rankings` links without changing `PublicSectionTabs` destinations.

- [ ] **Step 1: Write failing navigation tests**

Assert that ready Explore and published/withheld/unavailable district pages expose a real `/kr/seoul/rankings/` link, future tabs remain disabled spans, and the four primary workbook tab states do not gain Rankings.

- [ ] **Step 2: Run navigation tests and verify RED**

Run: `pnpm exec vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-section-tabs.test.tsx`

Expected: FAIL only for the missing secondary links.

- [ ] **Step 3: Add minimal links**

Add a 44px `View district rankings` action below the Explore hero/workspace introduction and beside `Return to Explore` in district navigation. Keep `PublicSectionTabs` unchanged and use `Link`, not client navigation.

- [ ] **Step 4: Run navigation tests and verify GREEN**

Run: `pnpm exec vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-section-tabs.test.tsx`

Expected: all tests PASS.

- [ ] **Step 5: Commit navigation**

```bash
git add v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/components/public-market/area-explorer.module.css v2/apps/web/components/public-market/district-detail-page.tsx v2/apps/web/components/public-market/district-detail.module.css v2/apps/web/test/public-area-explorer.test.tsx v2/apps/web/test/public-district-detail.test.tsx
git commit -m "feat(v2): link district rankings from Explore"
```

### Task 4: Browser, Release, and Production Gates

**Files:**
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Create: `v2/tests/e2e/rankings.spec.ts`
- Modify: `v2/playwright.config.ts` only if the existing project match cannot run the new 390/720/1440 matrix without changing unrelated tests.
- Create: `v2/docs/releases/2026-08-31-signedprice-p2-rankings.md`

**Interfaces:**
- Consumes: fixture-backed `/kr/seoul/rankings/`, existing release target resolver, Vercel Git SHA metadata.
- Produces: exact responsive/accessibility/reconciliation evidence and a rollback record.

- [ ] **Step 1: Add failing browser contracts**

Add Rankings to the public route contract as `noindex`. In `rankings.spec.ts`, assert at 1440px, 720px, and 390px: four complete lists; row counts equal fixture eligibility; exact first/last values; no horizontal overflow; every district link has at least 44px height; sequential keyboard focus follows DOM order; change centre/endpoints/sign classes exist; no console, page, request, or hydration errors; sitemap contains no Rankings URL.

- [ ] **Step 2: Run the focused browser gate**

Run: `pnpm exec playwright test tests/e2e/rankings.spec.ts`

Expected locally: PASS when Chromium is installed. If the managed workspace lacks Chromium, preserve the build output and require the same exact-SHA test against Vercel Preview before merge; do not report local browser PASS.

- [ ] **Step 3: Run full verification**

Run in `v2/`:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Expected: 0 failed tests, 0 lint/type errors, successful Next production build, and no whitespace errors. Inspect built Rankings HTML for one `noindex, follow`, zero canonical/hreflang, and complete server-rendered rows; inspect built sitemap for zero Rankings `<loc>`.

- [ ] **Step 4: Write the release record from observed evidence**

Record exact test counts, build route output, local browser limitation or PASS, artifact period, published/withheld/change-excluded counts, first/last row per metric, preview deployment ID/URL/SHA, CI run, Production deployment ID/SHA, live 200/metadata/DOM checks, runtime errors, and rollback commit. Do not include the artifact JSON, source URLs, secrets, cookies, or share tokens.

- [ ] **Step 5: Commit release evidence**

```bash
git add v2/tests/e2e/public-route-contract.ts v2/tests/e2e/rankings.spec.ts v2/playwright.config.ts v2/docs/releases/2026-08-31-signedprice-p2-rankings.md
git commit -m "test(v2): verify Seoul district rankings release"
```

- [ ] **Step 6: Preview, PR, CI, and Production**

Create the remote branch from current `main`, apply only Rankings commits, open a PR, and verify the Preview deployment SHA equals the PR head. Reconcile Preview rows against the installed area-summary artifact, resolve all Critical/Important findings, require CI success, merge with the expected head SHA, then verify the new Production deployment SHA before checking `www.signedprice.com`.

- [ ] **Step 7: Post-deploy verification**

Verify `/kr/seoul/rankings/` returns 200 with complete values; `/kr/`, `/kr/check/seoul/`, `/kr/seoul/`, Explore, and Rankings remain `noindex, follow` with no canonical/hreflang; sitemap excludes all contained Korea routes; Explore/detail cross-links resolve; KoreaHomeGuide home and Rent Check retain their existing canonical/hreflang; Vercel runtime errors and observed 5xx are zero. Roll back the code deployment if any numeric reconciliation, indexing, or 5xx gate fails.

