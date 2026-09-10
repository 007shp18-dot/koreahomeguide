# SignedPrice Phase 0 Reference UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a noindex design-review environment that proves SignedPrice’s editorial proptech direction across Homepage, Content, Check, and Seoul Explore at 1440px, 1024px, and 390px before any production page is restyled.

**Architecture:** Phase 0 is isolated from public product routes. A server-only adapter reads the same SignedPrice article, Seoul, Check, and Explore models used by production, then passes small presentation DTOs into review-only components with a scoped CSS system. Playwright produces deterministic EN and Simplified Chinese screenshots, and implementation stops at a user visual-approval gate; approved tokens and compositions are promoted in a separate Phase 1 plan.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5.9.3, pnpm 11.19.0, Vitest 4.1.11, Playwright 1.62.1, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-09-04-signedprice-editorial-growth-ui-design.md`

## Global Constraints

- Do not change `/`, `/insights/`, `/kr/seoul/check/`, `/kr/seoul/explore/`, shared `SiteHeader`, or shared `app/globals.css` in Phase 0.
- Keep the review surface under `/design-review/editorial-growth/<surface>/` with `robots: { index: false, follow: false }`, no canonical, and no sitemap entry.
- Render current SignedPrice content and evidence through existing route models; do not invent prices, sample counts, dates, coordinates, images, or market claims. Independently authored nonfactual EN/zh-CN design copy is allowed only when visibly labelled as a review sample.
- Simulated empty/error states may contain labels and explanations but no fabricated numeric evidence.
- Support `locale=en` and `locale=zh-CN`; CJK styles use zero default tracking and at least `1.65` body line-height.
- Use only the typography, spacing, width, colour, radius, and elevation values defined in the approved spec.
- Text below 12px and interactive labels below 14px fail the phase.
- Do not use gradients, glass effects, decorative blur, flag emoji, three-equal-card default sections, non-interactive pills, or nested card stacks.
- Advertisements appear only in Content review surfaces, are labelled `Advertisement`, and reserve their dimensions before loading.
- All interactive targets are at least 44×44 CSS px with visible keyboard focus.
- Every task follows test-first development and ends in a focused commit.
- Run commands from `v2/` unless a step explicitly names the repository root.
- Before code changes, read `v2/apps/web/AGENTS.md` and the relevant Next.js 16 guide under `v2/apps/web/node_modules/next/dist/docs/`.

## Scope Boundary

This plan implements only the design-review laboratory and its acceptance evidence. It does not simplify the production navigation, install advertising, add Chinese public routes, rewrite production screens, or change business logic. Those are separate plans after the user approves the Phase 0 screenshots.

## File Responsibility Map

| File | Responsibility |
| --- | --- |
| `docs/reviews/2026-09-04-phase-0-reference-dossier.md` | Records the source URL, observed pattern, SignedPrice adaptation, and rejection for every benchmark. |
| `v2/apps/web/lib/design-review/editorial-growth-review-model.ts` | Owns review surface/locale/state parsing and public presentation DTOs. |
| `v2/apps/web/lib/design-review/editorial-growth-review-model.server.ts` | Adapts current SignedPrice production models into the review DTO without duplicating business calculations. |
| `v2/apps/web/components/design-review/editorial-growth-review-shell.tsx` | Provides review-only surface, locale, and state navigation. |
| `v2/apps/web/components/design-review/editorial-growth-home.tsx` | Renders Homepage composition only. |
| `v2/apps/web/components/design-review/editorial-growth-content.tsx` | Renders Content hub and article composition, including ad states. |
| `v2/apps/web/components/design-review/editorial-growth-check.tsx` | Renders Check input/result composition from canonical Check data. |
| `v2/apps/web/components/design-review/editorial-growth-explore.tsx` | Renders Seoul Explore rail/map composition from canonical Explore data. |
| `v2/apps/web/components/design-review/editorial-growth-review.module.css` | Contains all scoped Phase 0 visual tokens and responsive layouts. |
| `v2/apps/web/app/(en)/design-review/editorial-growth/[surface]/page.tsx` | Resolves URL state, returns noindex metadata, loads canonical data, and selects one review surface. |
| `v2/apps/web/test/editorial-growth-review-model.test.ts` | Tests surface/locale/state parsing and canonical-data fallbacks. |
| `v2/apps/web/test/editorial-growth-review-routes.test.tsx` | Tests noindex metadata and semantic structure for all four surfaces. |
| `v2/apps/web/test/editorial-growth-review-typography.test.ts` | Rejects arbitrary typography, spacing, radius, gradient, and blur declarations. |
| `v2/tests/e2e/editorial-growth-review.spec.ts` | Tests responsive containment, focus, rendered states, computed typography, and golden screenshots. |
| `v2/playwright.config.ts` | Adds the 1024px review viewport and routes the review spec through 390/1024/1440 projects. |
| `docs/reviews/2026-09-04-phase-0-visual-qa.md` | Records screenshot-by-screenshot findings and the final approval status. |

---

### Task 1: Create the benchmark reference dossier

**Files:**
- Create: `docs/reviews/2026-09-04-phase-0-reference-dossier.md`
- Reference: `docs/superpowers/specs/2026-09-04-signedprice-editorial-growth-ui-design.md`

**Interfaces:**
- Consumes: the 14 official benchmark URLs in design-spec section 4.3.
- Produces: one row per benchmark with `role`, `observed pattern`, `adapt`, `reject`, `target surface`, and `checked date`.

- [ ] **Step 1: Create the dossier skeleton with exact categories**

```markdown
# SignedPrice Phase 0 Reference Dossier

**Checked:** 2026-09-04

## Evaluation axes

1. Five-second task clarity
2. Typography and reading measure
3. Search and filter hierarchy
4. Map/list selection continuity
5. Evidence provenance and update labels
6. Editorial-to-tool transition
7. Mobile recomposition
8. Patterns SignedPrice must reject

| Reference | Role | Observed pattern | Adapt | Reject | SignedPrice surface | Checked |
| --- | --- | --- | --- | --- | --- | --- |
```

- [ ] **Step 2: Inspect and record all 14 references**

Use the exact list from spec section 4.3: Rightmove, Zillow, Redfin, Realtor.com Research, Domain Research, PropertyGuru Singapore, 99.co Singapore, The Modern House, Compass, JLL Insights, Savills Research, Knight Frank Research, Sotheby’s International Realty, and idealista. Capture 1440px and 390px reference screenshots in a temporary directory for analysis; do not commit third-party screenshots.

For each row, write one concrete pattern to adapt and one concrete pattern to reject. The `Adapt` cell must name an observable layout or interaction, not an adjective such as “premium” or “clean.”

If a site blocks the review browser, record `Visual capture unavailable on 2026-09-04` in that row, use only the successfully retrieved official page structure, and do not guess its typography or bypass the block.

- [ ] **Step 3: Add the fixed surface synthesis table**

```markdown
| SignedPrice surface | Primary references | Transfer rule |
| --- | --- | --- |
| Homepage | Rightmove + The Modern House + Redfin | One search/check decision, editorial rhythm, then evidence status |
| Content | The Modern House + JLL + Savills | Readable story lead, named desk, period/source beside claims |
| Check | Rightmove + Redfin | Short entry sequence, result before supporting detail |
| Seoul Explore | Zillow + Rightmove | 420px rail, persistent map, four default filters maximum |
| Singapore future | PropertyGuru + 99.co | Native HDB/private terminology inside the same SignedPrice grid |
```

- [ ] **Step 4: Verify the dossier has no missing benchmark**

Run from the repository root:

```bash
for name in Rightmove Zillow Redfin Realtor Domain PropertyGuru 99.co "The Modern House" Compass JLL Savills "Knight Frank" Sotheby idealista; do
  rg -q "$name" docs/reviews/2026-09-04-phase-0-reference-dossier.md || exit 1
done
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add docs/reviews/2026-09-04-phase-0-reference-dossier.md
git commit -m "docs: add phase zero property UI references"
```

### Task 2: Define review URL state and presentation contracts

**Files:**
- Create: `v2/apps/web/lib/design-review/editorial-growth-review-model.ts`
- Test: `v2/apps/web/test/editorial-growth-review-model.test.ts`

**Interfaces:**
- Produces: `ReviewSurface`, `ReviewLocale`, `ReviewState`, `ReviewQuery`, `resolveReviewQuery()`, and the complete review presentation DTO set.
- Consumers: Tasks 3–8.

- [ ] **Step 1: Write the failing parsing tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  REVIEW_SURFACES,
  resolveReviewQuery,
} from '../lib/design-review/editorial-growth-review-model';

describe('editorial growth review URL contract', () => {
  it('publishes exactly four design-review surfaces', () => {
    expect(REVIEW_SURFACES).toEqual(['home', 'content', 'check', 'explore']);
  });

  it('accepts English, Simplified Chinese, and the three evidence states', () => {
    expect(resolveReviewQuery({ locale: 'zh-CN', state: 'insufficient', ad: 'loaded' }))
      .toEqual({ locale: 'zh-CN', state: 'insufficient', ad: 'loaded' });
  });

  it('fails safely to English ready content with an empty ad slot', () => {
    expect(resolveReviewQuery({ locale: ['zh-CN'], state: 'unknown', ad: 'unknown' }))
      .toEqual({ locale: 'en', state: 'ready', ad: 'empty' });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-model.test.ts
```

Expected: FAIL because `editorial-growth-review-model` does not exist.

- [ ] **Step 3: Implement the closed unions and parser**

```ts
export const REVIEW_SURFACES = ['home', 'content', 'check', 'explore'] as const;
export type ReviewSurface = (typeof REVIEW_SURFACES)[number];
export type ReviewLocale = 'en' | 'zh-CN';
export type ReviewState = 'ready' | 'insufficient' | 'error';
export type ReviewAdState = 'loaded' | 'empty';

export type ReviewQuery = Readonly<{
  locale: ReviewLocale;
  state: ReviewState;
  ad: ReviewAdState;
}>;

function scalar(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function resolveReviewQuery(
  input: Readonly<Record<string, string | readonly string[] | undefined>>,
): ReviewQuery {
  const locale = scalar(input.locale);
  const state = scalar(input.state);
  const ad = scalar(input.ad);
  return Object.freeze({
    locale: locale === 'zh-CN' ? 'zh-CN' : 'en',
    state: state === 'insufficient' || state === 'error' ? state : 'ready',
    ad: ad === 'loaded' ? 'loaded' : 'empty',
  });
}
```

Define these DTOs in the same file so review components do not import server repositories:

```ts
export type ReviewMetric = Readonly<{ label: string; value: string; context: string }>;
export type ReviewArticle = Readonly<{
  title: string;
  summary: string;
  market: string;
  published: string;
  updated: string;
  readMinutes: number;
  sections: readonly Readonly<{ heading: string; body: string }>[];
}>;
export type ReviewGuideSummary = Readonly<{
  title: string;
  summary: string;
  stage: string;
  updated: string;
  href: string;
}>;
export type ReviewCheck = Readonly<{
  state: ReviewState;
  verdict: string;
  scope: string;
  metrics: readonly ReviewMetric[];
  disclosure: string;
}>;
export type ReviewExploreRow = Readonly<{
  id: string;
  name: string;
  district: string;
  primaryValue: string;
  sample: string;
  period: string;
  selected: boolean;
}>;
export type ReviewMapDistrict = Readonly<{
  id: string;
  name: string;
  path: string;
  selected: boolean;
  evidenceState: 'published' | 'withheld';
}>;
export type EditorialGrowthReviewModel = Readonly<{
  locale: ReviewLocale;
  state: ReviewState;
  ad: ReviewAdState;
  seoulStatus: string;
  headlineMetric: ReviewMetric | null;
  article: ReviewArticle;
  articles: readonly ReviewArticle[];
  guides: readonly ReviewGuideSummary[];
  check: ReviewCheck;
  exploreRows: readonly ReviewExploreRow[];
  exploreDistricts: readonly ReviewMapDistrict[];
}>;
```

- [ ] **Step 4: Run the focused test and typecheck**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-model.test.ts
pnpm --filter @signedprice/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/design-review/editorial-growth-review-model.ts apps/web/test/editorial-growth-review-model.test.ts
git commit -m "test: define editorial growth review contracts"
```

### Task 3: Adapt canonical SignedPrice data into the review model

**Files:**
- Create: `v2/apps/web/lib/design-review/editorial-growth-review-model.server.ts`
- Modify: `v2/apps/web/test/editorial-growth-review-model.test.ts`

**Interfaces:**
- Consumes: `listPublishedContentArticles()`, `buildSeoulLiveModel()`, `buildSingleQuoteCheckRouteModel()`, and `buildPublicAreaExploreModel()`.
- Produces: `buildEditorialGrowthReviewModel(query): Promise<EditorialGrowthReviewModel>`.

- [ ] **Step 1: Add failing canonical-data tests**

Add a dependency-injected test so production values are adapted rather than copied:

```ts
import { GUIDES } from '../lib/guide/guide-content';
import { STARTER_EDITORIAL_ARTICLES } from '../lib/insights/editorial-content';
import {
  buildEditorialGrowthReviewModel,
  type EditorialGrowthReviewDependencies,
} from '../lib/design-review/editorial-growth-review-model.server';

it('adapts canonical article and evidence values without inventing numbers', async () => {
  const model = await buildEditorialGrowthReviewModel(
    { locale: 'en', state: 'ready', ad: 'empty' },
    {
      articles: async () => [STARTER_EDITORIAL_ARTICLES[0]!],
      guides: () => [GUIDES[0]!],
      seoul: () => ({
        status: 'ready', period: '2026-08', totalCount: 120,
        newCount: 80, renewalCount: 40, unknownCount: 0, links: [],
      }),
      check: () => ({ state: 'ready', verdict: 'Typical range', scope: 'Gangnam-gu', metrics: [], disclosure: 'Five compatible contracts.' }),
      explore: () => ({
        rows: [{ id: 'verified-1', name: 'Verified building', district: 'Gangnam-gu', primaryValue: '₩1,000,000,000', sample: '8 contracts', period: '2026-08', selected: true }],
        districts: [{ id: 'gangnam-gu', name: 'Gangnam-gu', path: 'M0 0L10 0L10 10Z', selected: true, evidenceState: 'published' }],
      }),
    },
  );

  expect(model.article.title).toBe(STARTER_EDITORIAL_ARTICLES[0]!.title);
  expect(model.headlineMetric).toEqual({ label: 'Reported contracts', value: '120', context: '2026-08' });
  expect(JSON.stringify(model)).not.toMatch(/undefined|null contracts|NaN/);
});

it('uses words, not fabricated zeroes, for unavailable evidence', async () => {
  const unavailableDependencies: EditorialGrowthReviewDependencies = {
    articles: async () => [STARTER_EDITORIAL_ARTICLES[0]!],
    guides: () => [GUIDES[0]!],
    seoul: () => ({
      status: 'unavailable',
      message: 'Official Seoul evidence is temporarily unavailable.',
      links: [],
    }),
    check: () => ({
      state: 'error', verdict: 'Unavailable', scope: 'Seoul', metrics: [],
      disclosure: 'Official evidence is temporarily unavailable.',
    }),
    explore: () => ({ rows: [], districts: [] }),
  };
  const model = await buildEditorialGrowthReviewModel(
    { locale: 'en', state: 'error', ad: 'empty' },
    unavailableDependencies,
  );
  expect(model.headlineMetric).toBeNull();
  expect(JSON.stringify(model)).not.toMatch(/₩0|0 contracts/);
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-model.test.ts
```

Expected: FAIL because the server adapter does not exist.

- [ ] **Step 3: Implement dependency boundaries**

Use this public shape; default dependencies call the existing production builders and formatting happens only after their validation succeeds:

```ts
import 'server-only';
import type { SingleQuoteCheckResult } from '@signedprice/market-core';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '../contract-check/evidence-repositories.server';
import { contractCheckCurvesFromEnvironment } from '../contract-check/route-model.server';
import { listPublishedContentArticles } from '../insights/content-article-store.server';
import {
  editorialMarketLabel,
  type EditorialArticle,
} from '../insights/editorial-content';
import { buildPublicAreaExploreModel } from '../public-market/area-route-model.server';
import { buildSeoulLiveModel } from '../public-market/seoul-live-model.server';
import { buildSingleQuoteCheckRouteModel } from '../single-quote-check/route-model.server';
import { GUIDES, type GuideDocument } from '../guide/guide-content';
import type {
  EditorialGrowthReviewModel,
  ReviewArticle,
  ReviewCheck,
  ReviewExploreRow,
  ReviewGuideSummary,
  ReviewLocale,
  ReviewMapDistrict,
  ReviewQuery,
  ReviewState,
} from './editorial-growth-review-model';

export type EditorialGrowthReviewDependencies = Readonly<{
  articles: typeof listPublishedContentArticles;
  guides: () => readonly GuideDocument[];
  seoul: typeof buildSeoulLiveModel;
  check: (locale: ReviewLocale) => EditorialGrowthReviewModel['check'];
  explore: (locale: ReviewLocale) => Readonly<{
    rows: EditorialGrowthReviewModel['exploreRows'];
    districts: EditorialGrowthReviewModel['exploreDistricts'];
  }>;
}>;

const DEFAULT_DEPENDENCIES: EditorialGrowthReviewDependencies = Object.freeze({
  articles: listPublishedContentArticles,
  guides: () => GUIDES,
  seoul: buildSeoulLiveModel,
  check: buildReviewCheckFromCanonicalRoute,
  explore: buildReviewExploreFromCanonicalRoute,
});

export async function buildEditorialGrowthReviewModel(
  query: ReviewQuery,
  dependencies: EditorialGrowthReviewDependencies = DEFAULT_DEPENDENCIES,
): Promise<EditorialGrowthReviewModel> {
  const publishedArticles = await dependencies.articles();
  if (publishedArticles.length === 0) throw new TypeError('A published review article is required.');
  const articles = query.locale === 'zh-CN'
    ? Object.freeze([ZH_REVIEW_ARTICLE])
    : Object.freeze(publishedArticles.map((article) => articleToReviewArticle(article, query.locale)));
  const article = articles[0]!;
  const seoul = dependencies.seoul();
  const copy = query.locale === 'zh-CN'
    ? { updated: '更新于', reportedContracts: '已申报成交' }
    : { updated: 'Updated', reportedContracts: 'Reported contracts' };
  const explore = query.state === 'ready'
    ? dependencies.explore(query.locale)
    : { rows: [], districts: [] };
  return Object.freeze({
    locale: query.locale,
    state: query.state,
    ad: query.ad,
    seoulStatus: seoul.status === 'ready'
      ? `${copy.updated} ${seoul.period}`
      : query.locale === 'zh-CN' ? '官方首尔成交依据暂时不可用。' : seoul.message,
    headlineMetric: seoul.status === 'ready'
      ? {
          label: copy.reportedContracts,
          value: new Intl.NumberFormat(query.locale === 'zh-CN' ? 'zh-CN' : 'en').format(seoul.totalCount),
          context: seoul.period,
        }
      : null,
    article,
    articles,
    guides: Object.freeze(dependencies.guides().slice(0, 5).map(guideToReviewSummary)),
    check: query.state === 'ready' ? dependencies.check(query.locale) : nonNumericCheckState(query.state, query.locale),
    exploreRows: explore.rows,
    exploreDistricts: explore.districts,
  });
}
```

Define the six named helpers in the same file. Their signatures are fixed:

```ts
function articleToReviewArticle(article: EditorialArticle, locale: ReviewLocale): ReviewArticle;
function nonNumericCheckState(state: Exclude<ReviewState, 'ready'>, locale: ReviewLocale): ReviewCheck;
function readyCheckToReviewCheck(
  result: Extract<SingleQuoteCheckResult, { status: 'ready' }>,
  locale: ReviewLocale,
): ReviewCheck;
function buildReviewCheckFromCanonicalRoute(locale: ReviewLocale): ReviewCheck;
function buildReviewExploreFromCanonicalRoute(locale: ReviewLocale): Readonly<{
  rows: readonly ReviewExploreRow[];
  districts: readonly ReviewMapDistrict[];
}>;
function guideToReviewSummary(guide: GuideDocument): ReviewGuideSummary;
```

`articleToReviewArticle()` splits the existing English `bodyMarkdown` only on `## ` headings; it does not rewrite the article or translate factual claims. The `zh-CN` review path uses the independently authored `ZH_REVIEW_ARTICLE` below.

```ts
function articleToReviewArticle(
  article: EditorialArticle,
  locale: ReviewLocale,
): ReviewArticle {
  const date = new Intl.DateTimeFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });
  const sections = article.bodyMarkdown
    .split(/^## /mu)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const [heading, ...paragraphs] = section.split(/\n\n+/u);
      if (heading === undefined || paragraphs.length === 0) {
        throw new TypeError(`Editorial section is incomplete: ${article.slug}`);
      }
      return Object.freeze({ heading, body: paragraphs.join('\n\n') });
    });
  return Object.freeze({
    title: article.title,
    summary: article.summary,
    market: editorialMarketLabel(article.marketKey),
    published: date.format(new Date(article.publishedAt)),
    updated: date.format(new Date(article.updatedAt)),
    readMinutes: article.readMinutes,
    sections: Object.freeze(sections),
  });
}

function guideToReviewSummary(guide: GuideDocument): ReviewGuideSummary {
  return Object.freeze({
    title: guide.title,
    summary: guide.summary,
    stage: guide.stage,
    updated: guide.lastVerified,
    href: `/kr/seoul/guide/${guide.slug}/`,
  });
}
```

Add one visibly labelled, non-public Chinese design sample for typography review. It makes no numeric, legal, tax, price, or investment claim:

```ts
const ZH_REVIEW_ARTICLE: ReviewArticle = Object.freeze({
  title: '在韩国租房前，先看真实成交依据',
  summary: '把房源报价放回同一地区、同类住宅和相近面积的成交记录中理解。',
  market: '韩国 · 首尔',
  published: '设计样稿',
  updated: '2026-09-04',
  readMinutes: 5,
  sections: Object.freeze([
    { heading: '先确认比较范围', body: '比较价格之前，先确认交易类型、住宅类型、面积范围和资料期间。' },
    { heading: '再查看成交分布', body: '单一中位数不能说明某一套住宅的全部条件，样本数量和价格区间必须一起阅读。' },
    { heading: '最后检查具体住宅', body: '楼层、朝向、房屋状态和合同条件仍需要单独核实。' },
  ]),
});
```

`nonNumericCheckState()` returns exactly one of these state payloads:

```ts
const NON_NUMERIC_CHECK_STATES = Object.freeze({
  en: {
    insufficient: 'Not enough compatible reported contracts for a distribution.',
    error: 'Official evidence is temporarily unavailable.',
  },
  'zh-CN': {
    insufficient: '可比的已申报成交记录不足，暂不显示价格分布。',
    error: '官方成交依据暂时不可用。',
  },
});

function nonNumericCheckState(
  state: Exclude<ReviewState, 'ready'>,
  locale: ReviewLocale,
): ReviewCheck {
  const disclosure = NON_NUMERIC_CHECK_STATES[locale][state];
  return Object.freeze({
    state,
    verdict: locale === 'zh-CN'
      ? state === 'insufficient' ? '依据不足' : '暂不可用'
      : state === 'insufficient' ? 'Insufficient evidence' : 'Unavailable',
    scope: locale === 'zh-CN' ? '首尔' : 'Seoul',
    metrics: Object.freeze([]),
    disclosure,
  });
}
```

`buildReviewCheckFromCanonicalRoute()` calls `contractCheckEvidenceRepositoriesFromEnvironment()`. It iterates repository buildings containing actual reported sales, passes each record’s own district, housing type, area, building ID, and reported price into `buildSingleQuoteCheckRouteModel()` with `check=1`, and returns the first canonical `ready` result. If no reported sale exists it returns the nonnumeric error state; if sales exist but no comparison reaches the publication floor it returns the nonnumeric insufficient state. It must never hard-code a KRW amount or calculate a median itself.

```ts
function buildReviewCheckFromCanonicalRoute(locale: ReviewLocale): ReviewCheck {
const repositories = contractCheckEvidenceRepositoriesFromEnvironment();
const observations = repositories.sale?.listBuildingRecords()
  .flatMap((building) => building.recentSales.map((sale) => ({ building, sale }))) ?? [];
for (const observed of observations) {
  const canonical = buildSingleQuoteCheckRouteModel(repositories, {
    check: '1', transaction: 'sale', district: observed.building.districtSlug,
    housing: observed.building.housingType, area: String(observed.sale.areaSqm),
    building: observed.building.buildingId, price: String(observed.sale.priceWon),
  }, contractCheckCurvesFromEnvironment());
  if (canonical.result?.status === 'ready') return readyCheckToReviewCheck(canonical.result, locale);
}
return observations.length === 0
  ? nonNumericCheckState('error', locale)
  : nonNumericCheckState('insufficient', locale);
}
```

`readyCheckToReviewCheck()` only formats `result.verdict`, `result.filters.scope`, `result.distribution`, `result.sample`, `result.evidenceWindow`, and `result.fallbackDisclosure` with locale-specific labels; it performs no new comparison.

```ts
function readyCheckToReviewCheck(
  result: Extract<SingleQuoteCheckResult, { status: 'ready' }>,
  locale: ReviewLocale,
): ReviewCheck {
  const won = new Intl.NumberFormat('ko-KR', {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
  });
  const copy = locale === 'zh-CN'
    ? {
        verdict: { below: '低于同类成交', typical: '处于常见区间', above: '高于同类成交' },
        scope: { building: '同一建筑', neighborhood: '同一社区', district: '同一区' },
        median: '中位数', middle: '中间 50%', difference: '差额', contracts: '笔成交',
      }
    : {
        verdict: { below: 'Below comparable evidence', typical: 'Within the typical range', above: 'Above comparable evidence' },
        scope: { building: 'Same building', neighborhood: 'Same neighbourhood', district: 'Same district' },
        median: 'Median', middle: 'Middle 50%', difference: 'Difference', contracts: 'contracts',
      };
  const signedDifference = `${result.difference.won >= 0 ? '+' : '−'}${won.format(Math.abs(result.difference.won))}`;
  const evidenceWindow = `${result.evidenceWindow.startMonth}–${result.evidenceWindow.endMonth}`;
  return Object.freeze({
    state: 'ready',
    verdict: copy.verdict[result.verdict],
    scope: copy.scope[result.filters.scope],
    metrics: Object.freeze([
      { label: copy.median, value: won.format(result.distribution.medianWon), context: result.period },
      {
        label: copy.middle,
        value: `${won.format(result.distribution.p25Won)}–${won.format(result.distribution.p75Won)}`,
        context: `${result.sample.count} ${copy.contracts}`,
      },
      { label: copy.difference, value: signedDifference, context: `${result.difference.pct}%` },
    ]),
    disclosure: [result.fallbackDisclosure, evidenceWindow].filter(Boolean).join(' · '),
  });
}
```

`buildReviewExploreFromCanonicalRoute()` calls `buildPublicAreaExploreModel(undefined)`, reads `buildingAvailability.buildings` or `fallbackBuildings`, takes at most six rows, and maps the already formatted `medianLabel`, source period fields, and canonical `observationCount` used only for a localized sample label. A null `medianLabel` becomes `Evidence withheld`, not zero. The first returned row is selected. It also maps all existing district `id/name/path/state` fields into `ReviewMapDistrict`; the review map therefore uses the same first-party Seoul geometry as production and needs no external SDK or invented coordinate. Do not read JSON files directly and do not reproduce any price calculation.

```ts
function buildReviewExploreFromCanonicalRoute(locale: ReviewLocale): Readonly<{
  rows: readonly ReviewExploreRow[];
  districts: readonly ReviewMapDistrict[];
}> {
  const canonical = buildPublicAreaExploreModel(undefined);
  if (canonical.status !== 'ready') {
    return Object.freeze({ rows: Object.freeze([]), districts: Object.freeze([]) });
  }
  const buildings = canonical.buildingAvailability.status === 'ready'
    ? canonical.buildingAvailability.buildings
    : canonical.buildingAvailability.fallbackBuildings;
  const districtNames = new Map(canonical.districts.map((district) => [
    district.slug,
    locale === 'zh-CN' ? district.nameKo : district.nameEn,
  ]));
  return Object.freeze({
    rows: Object.freeze(buildings.slice(0, 6).map((building, index) => Object.freeze({
      id: building.id,
      name: building.name,
      district: districtNames.get(building.districtSlug) ?? building.districtSlug,
      primaryValue: building.medianLabel
        ?? (locale === 'zh-CN' ? '依据未公开' : 'Evidence withheld'),
      sample: locale === 'zh-CN'
        ? `${building.observationCount} 笔成交`
        : building.sampleLabel,
      period: `${building.firstObservedMonth}–${building.lastObservedMonth}`,
      selected: index === 0,
    }))),
    districts: Object.freeze(canonical.districts.map((district) => Object.freeze({
      id: district.slug,
      name: locale === 'zh-CN' ? district.nameKo : district.nameEn,
      path: district.path,
      selected: district.slug === canonical.selectedSlug,
      evidenceState: district.state,
    }))),
  });
}
```

- [ ] **Step 4: Verify model tests and server/client boundary**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-model.test.ts apps/web/test/server-client-boundary.test.ts
pnpm --filter @signedprice/web typecheck
```

Expected: PASS and no server-only import reaches a client component.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/design-review/editorial-growth-review-model.server.ts apps/web/test/editorial-growth-review-model.test.ts
git commit -m "feat: adapt canonical data for UI review"
```

### Task 4: Create the noindex review route and shell

**Files:**
- Create: `v2/apps/web/app/(en)/design-review/editorial-growth/[surface]/page.tsx`
- Create: `v2/apps/web/components/design-review/editorial-growth-review-shell.tsx`
- Create: `v2/apps/web/components/design-review/editorial-growth-review.module.css`
- Create: `v2/apps/web/test/editorial-growth-review-routes.test.tsx`

**Interfaces:**
- Consumes: `REVIEW_SURFACES`, `resolveReviewQuery()`, and `buildEditorialGrowthReviewModel()`.
- Produces: four review URLs with semantic navigation and no public indexing metadata.

- [ ] **Step 1: Write failing route and metadata tests**

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('editorial growth design-review route', () => {
  it('is noindex with no canonical or language alternates', async () => {
    const route = await import('../app/(en)/design-review/editorial-growth/[surface]/page');
    expect(route.metadata).toEqual({
      title: 'SignedPrice editorial growth design review',
      robots: { index: false, follow: false },
    });
  });

  it.each(['home', 'content', 'check', 'explore'])('renders the %s review surface', async (surface) => {
    const route = await import('../app/(en)/design-review/editorial-growth/[surface]/page');
    const page = await route.default({
      params: Promise.resolve({ surface }),
      searchParams: Promise.resolve({ locale: 'en', state: 'ready', ad: 'empty' }),
    });
    const markup = renderToStaticMarkup(page);
    expect(markup).toContain(`data-review-surface="${surface}"`);
    expect(markup).toContain('aria-label="Design review surfaces"');
  });
});
```

Before the tests, define a stable component fixture and render helper in the same test file:

```tsx
const REVIEW_MODEL: EditorialGrowthReviewModel = Object.freeze({
  locale: 'en', state: 'ready', ad: 'empty', seoulStatus: 'Updated 2026-08',
  headlineMetric: { label: 'Reported contracts', value: '120', context: '2026-08' },
  article: {
    title: 'A median is a boundary, not a home valuation',
    summary: 'A district median is useful context, but it cannot price one home.',
    market: 'Global', published: 'Sep 4, 2026', updated: 'Sep 4, 2026', readMinutes: 5,
    sections: [{ heading: 'Start with the cohort', body: 'A median describes a defined group.' }],
  },
  articles: [],
  guides: [{
    title: 'Read district evidence', summary: 'Understand the comparison boundary.',
    stage: 'Market research', updated: '2026-09-04', href: '/kr/seoul/guide/read-district-evidence/',
  }],
  check: {
    state: 'ready', verdict: 'Typical range', scope: 'Gangnam-gu',
    metrics: [{ label: 'Median', value: '₩1,000,000,000', context: '2026-08' }],
    disclosure: 'Five compatible reported contracts.',
  },
  exploreRows: [{
    id: 'verified-1', name: 'Verified building', district: 'Gangnam-gu',
    primaryValue: '₩1,000,000,000', sample: '8 contracts', period: '2026-08', selected: true,
  }],
  exploreDistricts: [{
    id: 'gangnam-gu', name: 'Gangnam-gu', path: 'M0 0L10 0L10 10Z',
    selected: true, evidenceState: 'published',
  }],
});

async function renderReview(
  surface: ReviewSurface,
  overrides: Partial<Pick<EditorialGrowthReviewModel, 'locale' | 'state' | 'ad'>> = {},
) {
  const state = overrides.state ?? REVIEW_MODEL.state;
  const nonReadyCheck: ReviewCheck = {
    state,
    verdict: state === 'insufficient' ? 'Insufficient evidence' : 'Unavailable',
    scope: 'Seoul',
    metrics: [],
    disclosure: state === 'insufficient'
      ? 'Not enough compatible reported contracts for a distribution.'
      : 'Official evidence is temporarily unavailable.',
  };
  return renderToStaticMarkup(
    <EditorialGrowthReviewShell surface={surface} model={{
      ...REVIEW_MODEL,
      ...overrides,
      state,
      check: state === 'ready' ? REVIEW_MODEL.check : nonReadyCheck,
      exploreRows: state === 'ready' ? REVIEW_MODEL.exploreRows : [],
      exploreDistricts: state === 'ready' ? REVIEW_MODEL.exploreDistricts : [],
    }} />,
  );
}
```

These numbers exist only in the unit-test fixture and never enter the review route or production bundle.

- [ ] **Step 2: Run the route test and verify RED**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-routes.test.tsx
```

Expected: FAIL because the route and shell are absent.

- [ ] **Step 3: Implement metadata, static params, and strict surface validation**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialGrowthReviewShell } from '@/components/design-review/editorial-growth-review-shell';
import {
  REVIEW_SURFACES,
  resolveReviewQuery,
  type ReviewSurface,
} from '@/lib/design-review/editorial-growth-review-model';
import { buildEditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model.server';

export const metadata: Metadata = {
  title: 'SignedPrice editorial growth design review',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return REVIEW_SURFACES.map((surface) => ({ surface }));
}

export default async function EditorialGrowthReviewPage({ params, searchParams }: Readonly<{
  params: Promise<{ surface: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { surface } = await params;
  if (!REVIEW_SURFACES.includes(surface as ReviewSurface)) notFound();
  const query = resolveReviewQuery(await searchParams);
  const model = await buildEditorialGrowthReviewModel(query);
  return <EditorialGrowthReviewShell surface={surface as ReviewSurface} model={model} />;
}
```

- [ ] **Step 4: Implement the shell navigation without the production header**

The shell contains one compact review toolbar: SignedPrice wordmark, four surface links, EN/中文 links that retain `state` and `ad`, and a visible `Design review · not a public page` label. It must not import `SiteHeader` because the current seven-item production navigation is one of the layouts being replaced.

```tsx
<div className={styles.reviewRoot} data-review-locale={model.locale} data-review-surface={surface}>
  <header className={styles.reviewToolbar}>
    <Link href="/design-review/editorial-growth/home/">signedprice</Link>
    <nav aria-label="Design review surfaces">{/* four surface links */}</nav>
    <nav aria-label="Design review languages">{/* EN and 中文 */}</nav>
    <span>Design review · not a public page</span>
  </header>
  {renderReviewSurface(surface, model)}
</div>
```

Define the selector as an exhaustive switch so an added surface cannot silently render blank:

```tsx
function renderReviewSurface(surface: ReviewSurface, model: EditorialGrowthReviewModel) {
  switch (surface) {
    case 'home': return <EditorialGrowthHome model={model} />;
    case 'content': return <EditorialGrowthContent model={model} />;
    case 'check': return <EditorialGrowthCheck model={model} />;
    case 'explore': return <EditorialGrowthExplore model={model} />;
    default: {
      const unreachable: never = surface;
      return unreachable;
    }
  }
}
```

- [ ] **Step 5: Prove the route is absent from sitemap and public navigation**

Extend the route test:

```ts
const sitemapSource = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
const siteCopySource = readFileSync(new URL('../lib/site-copy.ts', import.meta.url), 'utf8');
expect(sitemapSource).not.toContain('/design-review/');
expect(siteCopySource).not.toContain('/design-review/');
```

- [ ] **Step 6: Run focused tests and commit**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-routes.test.tsx
pnpm --filter @signedprice/web typecheck
git add apps/web/app/'(en)'/design-review/editorial-growth/'[surface]'/page.tsx apps/web/components/design-review/editorial-growth-review-shell.tsx apps/web/components/design-review/editorial-growth-review.module.css apps/web/test/editorial-growth-review-routes.test.tsx
git commit -m "feat: add noindex editorial UI review shell"
```

### Task 5: Lock the scoped typography and layout system

**Files:**
- Modify: `v2/apps/web/components/design-review/editorial-growth-review.module.css`
- Create: `v2/apps/web/test/editorial-growth-review-typography.test.ts`

**Interfaces:**
- Produces: scoped `--review-*` tokens and responsive classes used by all four review surfaces.
- Does not modify: `app/globals.css`.

- [ ] **Step 1: Write the failing token-contract test**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('../components/design-review/editorial-growth-review.module.css', import.meta.url),
  'utf8',
);

describe('editorial growth typography contract', () => {
  it('declares the approved type and frame tokens', () => {
    for (const declaration of [
      '--review-display: 56px', '--review-h2: 36px', '--review-h3: 24px',
      '--review-lead: 20px', '--review-article: 18px', '--review-ui: 16px',
      '--review-control: 14px', '--review-meta: 12px',
      '--review-content-frame: 1200px', '--review-reading-frame: 720px',
      '--review-explore-rail: 420px',
    ]) expect(css).toContain(declaration);
  });

  it('rejects AI-template decoration and unreadable text', () => {
    const authoredFontSizes = [...css.matchAll(/(?:^|[;{])\s*font-size:\s*([^;}]*)/gm)]
      .map((match) => match[1]!.trim());
    expect(new Set(authoredFontSizes)).toEqual(new Set([
      'var(--review-display)', 'var(--review-h2)', 'var(--review-h3)',
      'var(--review-lead)', 'var(--review-article)', 'var(--review-ui)',
      'var(--review-control)', 'var(--review-meta)',
    ]));
    expect(css).not.toMatch(/linear-gradient|radial-gradient|backdrop-filter/);
    expect(css).not.toMatch(/letter-spacing:\s*-(?:0\.0[3-9]|0\.[1-9])em/);
    expect(css).not.toMatch(/border-radius:\s*(?:[1-7]|9|1[013-9]|[2-9][0-9]+)px/);
  });

  it('uses zero default tracking and generous body leading for Chinese', () => {
    expect(css).toMatch(/\[data-review-locale='zh-CN'\][^{]*\{[^}]*letter-spacing:\s*0/);
    expect(css).toMatch(/\[data-review-locale='zh-CN'\][\s\S]*?line-height:\s*1\.(?:6[5-9]|[7-9][0-9])/);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-typography.test.ts
```

Expected: FAIL on missing tokens.

- [ ] **Step 3: Add the exact scoped tokens**

```css
.reviewRoot {
  --review-display: 56px;
  --review-h2: 36px;
  --review-h3: 24px;
  --review-lead: 20px;
  --review-article: 18px;
  --review-ui: 16px;
  --review-control: 14px;
  --review-meta: 12px;
  --review-display-leading: 1.06;
  --review-heading-leading: 1.15;
  --review-body-leading: 1.55;
  --review-article-leading: 1.72;
  --review-display-tracking: -0.025em;
  --review-heading-tracking: -0.015em;
  --review-content-frame: 1200px;
  --review-reading-frame: 720px;
  --review-workspace-frame: 1440px;
  --review-explore-rail: 420px;
  --review-gutter: 40px;
  --review-space-1: 4px;
  --review-space-2: 8px;
  --review-space-3: 12px;
  --review-space-4: 16px;
  --review-space-5: 24px;
  --review-space-6: 32px;
  --review-space-7: 48px;
  --review-space-8: 64px;
  --review-space-9: 96px;
  --review-ink: #111827;
  --review-muted: #526071;
  --review-line: #dbe1e8;
  --review-canvas: #f7f8fa;
  --review-paper: #ffffff;
  --review-accent: #1d4ed8;
  min-height: 100dvh;
  color: var(--review-ink);
  background: var(--review-canvas);
  font-size: var(--review-ui);
  letter-spacing: 0;
  line-height: var(--review-body-leading);
}

.reviewRoot[data-review-locale='zh-CN'] {
  letter-spacing: 0;
  line-height: 1.7;
}
```

At `max-width: 1100px`, use 24px gutters and a 360px Explore rail. At `max-width: 680px`, use 16px gutters, 40px display type, 30px H2, 22px H3, 17px article body, and a single-column `List / Map` Explore composition.

- [ ] **Step 4: Add shared focus, measure, section, and ad-slot classes**

```css
.reviewRoot a:focus-visible,
.reviewRoot button:focus-visible,
.reviewRoot input:focus-visible,
.reviewRoot select:focus-visible {
  outline: 2px solid var(--review-accent);
  outline-offset: 3px;
}

.readingColumn { width: min(100%, var(--review-reading-frame)); }
.articleBody { font-size: var(--review-article); line-height: var(--review-article-leading); }
.articleBody p { max-width: 68ch; }
.adSlot { min-height: 250px; display: grid; place-items: center; border-block: 1px solid var(--review-line); }
```

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-typography.test.ts
pnpm --filter @signedprice/web typecheck
git add apps/web/components/design-review/editorial-growth-review.module.css apps/web/test/editorial-growth-review-typography.test.ts
git commit -m "style: lock phase zero editorial UI tokens"
```

### Task 6: Build Homepage and Content review surfaces

**Files:**
- Create: `v2/apps/web/components/design-review/editorial-growth-home.tsx`
- Create: `v2/apps/web/components/design-review/editorial-growth-content.tsx`
- Modify: `v2/apps/web/components/design-review/editorial-growth-review-shell.tsx`
- Modify: `v2/apps/web/components/design-review/editorial-growth-review.module.css`
- Modify: `v2/apps/web/test/editorial-growth-review-routes.test.tsx`

**Interfaces:**
- Consumes: `EditorialGrowthReviewModel`.
- Produces: semantic `data-review-surface="home"` and `data-review-surface="content"` trees with one primary action each.

- [ ] **Step 1: Add failing semantic-order tests**

```tsx
it('gives Homepage one promise and one primary action before evidence', async () => {
  const markup = await renderReview('home', { locale: 'en' });
  expect(markup.match(/<h1/g)).toHaveLength(1);
  expect(markup).toContain('Understand the real cost of renting in Korea.');
  expect(markup).toContain('data-primary-action="check"');
  expect(markup.indexOf('data-primary-action="check"'))
    .toBeLessThan(markup.indexOf('data-home-section="insight"'));
  expect(markup).not.toMatch(/Properties|Invest|Community|🇰🇷|🇸🇬|🇦🇪/);
});

it('keeps Content readable and advertising outside evidence', async () => {
  const markup = await renderReview('content', { locale: 'en', ad: 'loaded' });
  expect(markup).toContain('data-content-region="article"');
  expect(markup).toContain('Advertisement');
  expect(markup.indexOf('data-ad-slot="article-1"'))
    .toBeGreaterThan(markup.indexOf('data-article-paragraph="1"'));
  expect(markup).toContain('SignedPrice Data Desk');
  expect(markup).toMatch(/Updated/);
});

it('renders independent Simplified Chinese copy', async () => {
  const markup = await renderReview('content', { locale: 'zh-CN' });
  expect(markup).toContain('在韩国租房前，先看真实成交依据');
  expect(markup).not.toContain('Property evidence, explained.');
});
```

- [ ] **Step 2: Run the route test and verify RED**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-routes.test.tsx
```

Expected: FAIL because Homepage and Content components are absent.

- [ ] **Step 3: Implement Homepage in five sections maximum**

Render in this exact order:

1. Promise and `Check a price` primary action; `Explore Seoul` is a text secondary action.
2. One current Seoul evidence metric or an honest unavailable sentence.
3. One lead Insight with title, summary, market, and updated date.
4. Three to five actual `model.guides` links displayed as a ruled list, not equal cards.
5. Method/source note.

Use `model.headlineMetric === null` to render `Official Seoul evidence is temporarily unavailable.` Never substitute zero.

- [ ] **Step 4: Implement Content hub and article in one review page**

The upper half shows `model.article` as the lead report plus the remaining actual `model.articles` as a compact ruled list. Group/filter labels are exactly `Renting`, `Buying`, `Neighborhoods`, and `Market data`; do not show an empty category or assign an article to a category without an explicit mapping recorded in the reference dossier. Each row prioritizes audience/task, updated date, and connected tool before reading time. The lower half shows the selected article with:

- title, lead, desk/byline, published and updated dates;
- a 680–720px reading column;
- first substantive paragraph before the first ad slot;
- source/method callout adjacent to the claim it qualifies;
- one contextual `Check this market` action after the conclusion.

For `ad=empty`, keep `data-ad-slot` in the DOM but remove the 250px reservation with `data-ad-state="empty"`; for `ad=loaded`, render the reserved slot and `Advertisement` label.

- [ ] **Step 5: Apply only approved layout primitives**

Use asymmetric editorial columns, rules, and whitespace. Do not use a gradient hero, image collage, numbered card index, three-column equal grid, or capsule metadata.

- [ ] **Step 6: Run focused tests and commit**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-routes.test.tsx apps/web/test/editorial-growth-review-typography.test.ts
pnpm --filter @signedprice/web typecheck
git add apps/web/components/design-review/editorial-growth-home.tsx apps/web/components/design-review/editorial-growth-content.tsx apps/web/components/design-review/editorial-growth-review-shell.tsx apps/web/components/design-review/editorial-growth-review.module.css apps/web/test/editorial-growth-review-routes.test.tsx
git commit -m "feat: compose homepage and content UI reviews"
```

### Task 7: Build Check and Seoul Explore review surfaces

**Files:**
- Create: `v2/apps/web/components/design-review/editorial-growth-check.tsx`
- Create: `v2/apps/web/components/design-review/editorial-growth-explore.tsx`
- Modify: `v2/apps/web/components/design-review/editorial-growth-review-shell.tsx`
- Modify: `v2/apps/web/components/design-review/editorial-growth-review.module.css`
- Modify: `v2/apps/web/test/editorial-growth-review-routes.test.tsx`

**Interfaces:**
- Consumes: `model.check`, `model.exploreRows`, `model.exploreDistricts`, `model.state`, and `model.locale`.
- Produces: visual decision-tool and split-map compositions without changing production calculations or selection state.

- [ ] **Step 1: Add failing Check/Explore structure tests**

```tsx
it('orders Check as input, verdict, figures, evidence, disclosure', async () => {
  const markup = await renderReview('check', { locale: 'en', state: 'ready' });
  const order = ['input', 'verdict', 'figures', 'evidence', 'disclosure']
    .map((name) => markup.indexOf(`data-check-region="${name}"`));
  expect(order.every((position) => position >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  expect(markup).not.toContain('Advertisement');
});

it('renders insufficient Check without invented figures', async () => {
  const markup = await renderReview('check', { state: 'insufficient' });
  expect(markup).toContain('data-result-state="insufficient"');
  expect(markup).not.toMatch(/₩0|0 contracts|data-check-region="figures"/);
});

it('keeps Explore filter count and selected evidence bounded', async () => {
  const markup = await renderReview('explore', { state: 'ready' });
  expect(markup.match(/data-default-filter=/g)).toHaveLength(4);
  expect(markup).toContain('data-explore-layout="rail-map"');
  expect(markup).toContain('data-explore-rail="420"');
  expect(markup).toContain('data-selected-building="true"');
  expect(markup).not.toContain('Advertisement');
});
```

- [ ] **Step 2: Run the route test and verify RED**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-routes.test.tsx
```

Expected: FAIL on missing Check and Explore structures.

- [ ] **Step 3: Implement Check composition**

Use one vertical input flow with four condition fields and transaction-specific money fields. Render exactly one primary submit button. Present the result in this order: verdict, comparison scope, up to three key figures, sample/period, comparable rows, disclosure. `insufficient` and `error` states replace all numeric result regions with one plain-language state block and a single next action.

Do not use numbered section boxes, uppercase legends, nested panels, or an ad slot.

- [ ] **Step 4: Implement Seoul Explore composition**

Desktop uses a 420px left rail and persistent right map. Render the map as an accessible SVG from `model.exploreDistricts`; each district path has an accessible name, and the selected path uses both a visual stroke and `aria-current` context. The rail order is:

1. compact title and current evidence period;
2. search;
3. four default filters: transaction, housing type, price/deposit, district;
4. `More filters` text button;
5. result count and sort;
6. at most six evidence rows, one selected;
7. selected-building summary and Check action.

At 1024px the rail becomes 360px. At 390px the page exposes `List` and `Map` as 44px segmented buttons and renders one mode at a time. An unavailable map explains the reason without covering the evidence list.

- [ ] **Step 5: Add honest simulated states**

For `state=insufficient`, show the selected identity and the sentence `Not enough compatible reported contracts for a distribution.` For `state=error`, show `Official evidence is temporarily unavailable.` Neither state renders a currency value, count, chart, or invented map point.

- [ ] **Step 6: Run focused tests and commit**

```bash
pnpm vitest run apps/web/test/editorial-growth-review-routes.test.tsx apps/web/test/editorial-growth-review-typography.test.ts
pnpm --filter @signedprice/web typecheck
git add apps/web/components/design-review/editorial-growth-check.tsx apps/web/components/design-review/editorial-growth-explore.tsx apps/web/components/design-review/editorial-growth-review-shell.tsx apps/web/components/design-review/editorial-growth-review.module.css apps/web/test/editorial-growth-review-routes.test.tsx
git commit -m "feat: compose check and explore UI reviews"
```

### Task 8: Add 390/1024/1440 browser and screenshot gates

**Files:**
- Create: `v2/tests/e2e/editorial-growth-review.spec.ts`
- Modify: `v2/playwright.config.ts`
- Generate: `v2/tests/e2e/editorial-growth-review.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: all four noindex review routes.
- Produces: 24 EN/zh-CN golden screenshots plus responsive, focus, metadata, and computed-style assertions.

- [ ] **Step 1: Add the 1024px review-only project**

Append this project without changing existing 720px release coverage:

```ts
{
  name: 'review-tablet-chromium',
  testMatch: /editorial-growth-review\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1024, height: 900 },
  },
},
```

Exclude the review spec from the existing 1366px project and add it to the existing 1440px regex exactly as follows; the existing mobile project already runs every spec:

```ts
{
  name: 'desktop-chromium',
  testIgnore: /editorial-growth-review\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1366, height: 768 },
  },
},
{
  name: 'wide-chromium',
  testMatch: /(?:area-explore|contract-check|trust|korea-detail|korea-guide|singapore|editorial-growth-review)\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  },
},
```

- [ ] **Step 2: Write the E2E contract before generating screenshots**

```ts
import { expect, test } from '@playwright/test';

const surfaces = ['home', 'content', 'check', 'explore'] as const;
const locales = ['en', 'zh-CN'] as const;

for (const surface of surfaces) {
  for (const locale of locales) {
    test(`${surface} ${locale} is contained and visually stable`, async ({ page }, testInfo) => {
      await page.goto(`/design-review/editorial-growth/${surface}/?locale=${locale}&state=ready&ad=loaded`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex,\s*nofollow$/);
      await expect(page.locator(`[data-review-surface="${surface}"]`)).toBeVisible();
      const overflow = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
      await expect(page).toHaveScreenshot(`${surface}-${locale}-${testInfo.project.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
```

- [ ] **Step 3: Add exact computed-style checks**

```ts
test('article measure and typography match the approved contract', async ({ page }) => {
  await page.goto('/design-review/editorial-growth/content/?locale=en&state=ready&ad=empty');
  const body = page.locator('[data-article-body]');
  await expect(body).toHaveCSS('font-size', '18px');
  await expect(body).toHaveCSS('line-height', '30.96px');
  expect((await body.boundingBox())!.width).toBeLessThanOrEqual(720);
});

test('Chinese does not inherit Latin negative tracking', async ({ page }) => {
  await page.goto('/design-review/editorial-growth/content/?locale=zh-CN&state=ready&ad=empty');
  await expect(page.locator('[data-review-locale="zh-CN"]')).toHaveCSS('letter-spacing', '0px');
});
```

Add checks that every visible toolbar link, segmented control, button, input, and select is at least 44px high and that focus is visible after keyboard Tab.

- [ ] **Step 4: Verify empty, insufficient, and error states without new screenshots**

For Content, assert `ad=empty` leaves no 250px gap. For Check and Explore, assert `state=insufficient` and `state=error` contain the approved sentence and no `₩0`, `0 contracts`, chart, or fabricated map marker.

- [ ] **Step 5: Run RED before snapshot generation**

```bash
pnpm e2e --project=mobile-chromium --project=review-tablet-chromium --project=wide-chromium tests/e2e/editorial-growth-review.spec.ts
```

Expected: FAIL because golden screenshots do not exist or because a responsive contract is not yet satisfied.

- [ ] **Step 6: Correct only observable contract failures, then generate baselines**

```bash
pnpm e2e --update-snapshots --project=mobile-chromium --project=review-tablet-chromium --project=wide-chromium tests/e2e/editorial-growth-review.spec.ts
pnpm e2e --project=mobile-chromium --project=review-tablet-chromium --project=wide-chromium tests/e2e/editorial-growth-review.spec.ts
```

Expected: 24 screenshot cases PASS plus state and computed-style cases PASS.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/editorial-growth-review.spec.ts tests/e2e/editorial-growth-review.spec.ts-snapshots
git commit -m "test: add phase zero visual acceptance matrix"
```

### Task 9: Complete visual QA and stop at the user approval gate

**Files:**
- Create: `docs/reviews/2026-09-04-phase-0-visual-qa.md`
- Modify only if a recorded failure exists: review files created in Tasks 2–8.

**Interfaces:**
- Consumes: the 24 golden screenshots and browser-rendered review routes.
- Produces: a complete pass/fail matrix and an explicit `User approval: pending` gate.

- [ ] **Step 1: Create the QA matrix**

```markdown
# SignedPrice Phase 0 Visual QA

**User approval:** pending

| Surface | Locale | 1440 | 1024 | 390 | First action | Type rhythm | Overflow | State clarity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage | EN | pending | pending | pending | pending | pending | pending | pending |
| Homepage | zh-CN | pending | pending | pending | pending | pending | pending | pending |
| Content | EN | pending | pending | pending | pending | pending | pending | pending |
| Content | zh-CN | pending | pending | pending | pending | pending | pending | pending |
| Check | EN | pending | pending | pending | pending | pending | pending | pending |
| Check | zh-CN | pending | pending | pending | pending | pending | pending | pending |
| Explore | EN | pending | pending | pending | pending | pending | pending | pending |
| Explore | zh-CN | pending | pending | pending | pending | pending | pending | pending |
```

Do not prefill `pass`; set each cell only after viewing the corresponding screenshot. Record every failure under `## Findings` with the screenshot name, violated spec rule, owning component, and corrected commit SHA.

- [ ] **Step 2: Inspect all screenshots in this order**

For each surface, compare 1440 → 1024 → 390 in EN, then repeat in zh-CN. Check first-screen hierarchy, paragraph measure, line breaks, metadata weight, control alignment, data legibility, ad separation, and empty/error dominance. A passing automated snapshot does not waive visual review.

- [ ] **Step 3: Re-run complete Phase 0 verification**

```bash
pnpm vitest run \
  apps/web/test/editorial-growth-review-model.test.ts \
  apps/web/test/editorial-growth-review-routes.test.tsx \
  apps/web/test/editorial-growth-review-typography.test.ts
pnpm --filter @signedprice/web typecheck
pnpm --filter @signedprice/web lint
pnpm --filter @signedprice/web build
pnpm e2e --project=mobile-chromium --project=review-tablet-chromium --project=wide-chromium tests/e2e/editorial-growth-review.spec.ts
```

Expected: all commands PASS.

- [ ] **Step 4: Confirm production isolation**

```bash
git diff $(git merge-base HEAD origin/main)..HEAD -- \
  'v2/apps/web/app/(en)/page.tsx' \
  'v2/apps/web/app/(en)/insights' \
  'v2/apps/web/app/(en)/kr/seoul/check' \
  'v2/apps/web/app/(en)/kr/seoul/explore' \
  'v2/apps/web/app/globals.css' \
  'v2/apps/web/components/site-header.tsx'
```

Expected: no Phase 0 production-page or global-style diff.

- [ ] **Step 5: Commit the QA record**

```bash
git add docs/reviews/2026-09-04-phase-0-visual-qa.md
git commit -m "docs: record phase zero visual QA"
```

- [ ] **Step 6: Present the four surface families to the user and stop**

Provide the 1440px, 1024px, and 390px review images grouped by surface and a Preview URL for each review route. Ask for approval of typography, density, composition, and reference balance. Do not create a production rollout plan and do not modify production UI until the user explicitly approves these rendered screens.

## Spec Coverage and Explicit Deferrals

| Approved design-spec concern | Covered by | Phase 0 result |
| --- | --- | --- |
| 14 global property references and surface-specific transfer rules | Task 1 | Evidence dossier with at least three references per surface |
| Typography, spacing, frames, CJK rhythm, and anti-template rules | Tasks 5 and 8 | Scoped tokens plus authored-CSS and computed-style gates |
| Homepage, Content, Check, and Explore compositions | Tasks 4, 6, and 7 | Four isolated review surface families |
| Current evidence and no fabricated market values | Tasks 2 and 3 | Canonical server adapters and nonnumeric fallbacks |
| EN and independent zh-CN content treatment | Tasks 3, 6, and 8 | English canonical content plus labelled Chinese review copy |
| Advertising only in editorial content | Tasks 6 and 8 | Loaded/empty reserved-slot behavior; no tool ads |
| 1440px, 1024px, 390px, keyboard focus, and overflow | Task 8 | Automated browser and screenshot matrix |
| Human visual judgment before rollout | Task 9 | Explicit approval stop gate |
| Public navigation, live ad network, consent, analytics, and production routes | Scope boundary | Deliberately deferred to Phase 1 after visual approval |
| Brokerage, listings, partner acquisition, overseas investment, and mainland China market data | Approved roadmap only | No implementation in Phase 0; retained as later business phases |

## Completion Definition

Phase 0 is complete only when:

- all 14 reference rows have specific adapt/reject notes;
- all four review surface families render canonical SignedPrice content/evidence or honest nonnumeric states;
- EN and zh-CN pass 1440px, 1024px, and 390px screenshot review;
- arbitrary typography and AI-template decoration tests pass;
- the review route is noindex and absent from sitemap/navigation;
- production pages and global styles remain unchanged;
- focused Vitest, typecheck, lint, build, and review Playwright suites pass;
- the user approves the rendered review screens.

Only then may a separate Phase 1 plan promote the approved navigation, tokens, Homepage, and Content system into public routes.
