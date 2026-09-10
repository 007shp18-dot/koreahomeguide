# SignedPrice Phase 1 Public Editorial Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the approved Phase 0 typography, navigation, Homepage, and Content language into public SignedPrice routes without replacing the working Check and Explore data tools with review-only mock interactions.

**Architecture:** Extract a public editorial shell from the approved review shell while keeping the noindex laboratory unchanged. Public Homepage and Insights consume canonical SignedPrice models and indexable metadata; existing Check and Explore retain their production route models and interactions, with their visual systems aligned in later rollout plans. English remains the indexed default, and Simplified Chinese receives dedicated `/zh-cn/kr/seoul/` routes rather than query-string locale pages.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, CSS Modules, Vitest, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-04-signedprice-editorial-growth-ui-design.md`

## Global Constraints

- Preserve canonical evidence builders; do not calculate market figures inside presentation components.
- Never display unavailable evidence as zero.
- Public pages must not link to `/design-review/` or show the review toolbar label.
- Keep the approved type scale: 56/36/24/20/18/16/14/12px desktop and 40/30/22/20/17/16/14/12px mobile.
- Keep English negative tracking no tighter than `-0.025em`; Simplified Chinese display and heading tracking must be zero.
- Advertising remains absent from Check and Explore and may appear only inside editorial reading flow.
- All public controls are at least 44px high and pages must have no horizontal overflow at 390, 1024, and 1440px.
- Keep the Phase 0 review route noindex and absent from public navigation and sitemap.

---

### Task 1: Create the public editorial route and navigation contract

**Files:**
- Create: `v2/apps/web/lib/editorial-growth/public-editorial-routes.ts`
- Create: `v2/apps/web/test/public-editorial-routes.test.ts`

**Interfaces:**
- Produces: `PUBLIC_EDITORIAL_SURFACES`, `publicEditorialHref(surface, locale)`, and `publicEditorialLanguageHref(surface, locale)`.
- Consumes: `ReviewLocale` and `ReviewSurface` from the approved Phase 0 presentation model.

- [ ] **Step 1: Write the failing route test**

```ts
expect(publicEditorialHref('home', 'en')).toBe('/');
expect(publicEditorialHref('content', 'en')).toBe('/insights/');
expect(publicEditorialHref('check', 'zh-CN')).toBe('/zh-cn/kr/seoul/check/');
expect(publicEditorialHref('explore', 'zh-CN')).toBe('/zh-cn/kr/seoul/explore/');
expect(JSON.stringify(PUBLIC_EDITORIAL_SURFACES)).not.toContain('/design-review/');
```

- [ ] **Step 2: Run `pnpm exec vitest run apps/web/test/public-editorial-routes.test.ts` and verify RED**

Expected: import failure because the route contract does not exist.

- [ ] **Step 3: Implement an exhaustive frozen route table**

```ts
export const PUBLIC_EDITORIAL_SURFACES = Object.freeze({
  en: Object.freeze({ home: '/', content: '/insights/', check: '/kr/seoul/check/', explore: '/kr/seoul/explore/' }),
  'zh-CN': Object.freeze({
    home: '/zh-cn/kr/seoul/',
    content: '/zh-cn/kr/seoul/insights/',
    check: '/zh-cn/kr/seoul/check/',
    explore: '/zh-cn/kr/seoul/explore/',
  }),
});
```

- [ ] **Step 4: Re-run the focused test and commit**

```bash
git add v2/apps/web/lib/editorial-growth/public-editorial-routes.ts v2/apps/web/test/public-editorial-routes.test.ts
git commit -m "feat: define public editorial routes"
```

### Task 2: Extract a production editorial shell without weakening the review lab

**Files:**
- Create: `v2/apps/web/components/editorial-growth/editorial-growth-public-shell.tsx`
- Create: `v2/apps/web/components/editorial-growth/editorial-growth-public-shell.module.css`
- Modify: `v2/apps/web/components/design-review/editorial-growth-home.tsx`
- Modify: `v2/apps/web/components/design-review/editorial-growth-content.tsx`
- Create: `v2/apps/web/test/editorial-growth-public-shell.test.tsx`

**Interfaces:**
- Produces: `EditorialGrowthPublicShell({ surface: 'home' | 'content', model })`.
- Consumes: `publicEditorialHref()` from Task 1 and the canonical `EditorialGrowthReviewModel` presentation DTO.

- [ ] **Step 1: Write a failing static-render test**

```tsx
const markup = renderToStaticMarkup(<EditorialGrowthPublicShell surface="home" model={MODEL} />);
expect(markup).toContain('aria-label="Primary navigation"');
expect(markup).toContain('aria-label="Language navigation"');
expect(markup).not.toContain('Design review');
expect(markup).not.toContain('/design-review/');
expect(markup).toContain('href="/kr/seoul/check/"');
```

- [ ] **Step 2: Run the test and verify RED**

- [ ] **Step 3: Add optional `hrefs` to approved Home and Content components**

```ts
type EditorialSurfaceHrefs = Readonly<{ home: string; content: string; check: string; explore: string }>;
```

Default the existing review components to their current review URLs so Phase 0 tests remain unchanged. The public shell passes only the route table from Task 1.

- [ ] **Step 4: Implement a 64px public header**

Header order is wordmark → Home / Journal / Check / Explore → EN / 中文. Do not add market flags, numbered nav cards, CTA duplication, gradients, badges, or the Phase 0 review label. Use the approved `1200px` frame and `40px` desktop / `16px` mobile gutters.

- [ ] **Step 5: Run both public and review shell suites and commit**

```bash
pnpm exec vitest run apps/web/test/editorial-growth-public-shell.test.tsx apps/web/test/editorial-growth-review-routes.test.tsx
git add v2/apps/web/components/editorial-growth v2/apps/web/components/design-review/editorial-growth-home.tsx v2/apps/web/components/design-review/editorial-growth-content.tsx v2/apps/web/test/editorial-growth-public-shell.test.tsx
git commit -m "feat: add public editorial shell"
```

### Task 3: Promote the approved Homepage to `/`

**Files:**
- Modify: `v2/apps/web/app/(en)/page.tsx`
- Modify: `v2/apps/web/test/home-layout.test.ts`
- Create: `v2/apps/web/test/editorial-growth-public-home.test.tsx`

**Interfaces:**
- Consumes: `buildEditorialGrowthReviewModel({ locale: 'en', state: 'ready', ad: 'empty' })` and `EditorialGrowthPublicShell`.
- Produces: indexable `/` with canonical SignedPrice evidence, guides, and Insights entry.

- [ ] **Step 1: Write a failing public-page composition test**

```ts
expect(source).toContain("buildEditorialGrowthReviewModel({ locale: 'en', state: 'ready', ad: 'empty' })");
expect(source).toContain('EditorialGrowthPublicShell');
expect(source).not.toContain('HomeMarketBrowser');
expect(source).not.toContain('HomeEditorialSections');
```

- [ ] **Step 2: Verify RED, then replace only the page composition**

Keep `homepageCopy.metadata`. The public page should build one canonical model and render the public shell with `surface="home"`. Do not delete the old market-browser components; other tests or routes may still own them.

- [ ] **Step 3: Verify metadata, hero hierarchy, public links, and no review strings**

```bash
pnpm exec vitest run apps/web/test/home-layout.test.ts apps/web/test/editorial-growth-public-home.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add 'v2/apps/web/app/(en)/page.tsx' v2/apps/web/test/home-layout.test.ts v2/apps/web/test/editorial-growth-public-home.test.tsx
git commit -m "feat: publish editorial homepage"
```

### Task 4: Align `/insights/` and article reading pages with the approved Content system

**Files:**
- Modify: `v2/apps/web/components/insights/insights-index.tsx`
- Modify: `v2/apps/web/components/insights/insights-article.tsx`
- Modify: `v2/apps/web/components/insights/insights.module.css`
- Modify: `v2/apps/web/app/(en)/insights/page.tsx`
- Modify: `v2/apps/web/app/(en)/insights/[slug]/page.tsx`
- Modify: `v2/apps/web/test/insights-public-routes.test.tsx`

**Interfaces:**
- Preserves: `listPublishedContentArticles()`, `getPublishedContentArticle()`, Article JSON-LD, market filters, and canonical metadata.
- Produces: public Journal index and 720px article reading column using the approved type rhythm.

- [ ] **Step 1: Add failing tests for the public shell and ad boundary**

```ts
expect(markup).toContain('data-public-editorial-shell="content"');
expect(markup).toContain('data-article-reading-width="720"');
expect(markup).not.toContain('/design-review/');
expect(markup.indexOf('data-ad-slot="article-1"')).toBeGreaterThan(markup.indexOf('data-article-paragraph="1"'));
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Recompose the index and article with existing canonical article objects**

Use semantic rules and whitespace instead of card grids. Keep the market filter query contract. The article ad slot defaults to `empty`, has zero height when empty, and remains outside evidence/source notes.

- [ ] **Step 4: Apply the approved CSS variables and 720px measure**

Use `font-size: 18px; line-height: 1.72` on desktop and `17px / 1.72` on mobile. Do not add new arbitrary font sizes, gradients, backdrop filters, or radii other than `8px`.

- [ ] **Step 5: Run route, metadata, and markdown tests and commit**

```bash
pnpm exec vitest run apps/web/test/insights-public-routes.test.tsx apps/web/test/editorial-content.test.ts apps/web/test/editorial-content-store.test.ts
git add v2/apps/web/components/insights 'v2/apps/web/app/(en)/insights' v2/apps/web/test/insights-public-routes.test.tsx
git commit -m "feat: publish editorial journal design"
```

### Task 5: Publish the Simplified Chinese entry and Journal routes

**Files:**
- Create: `v2/apps/web/app/(en)/zh-cn/kr/seoul/page.tsx`
- Create: `v2/apps/web/app/(en)/zh-cn/kr/seoul/insights/page.tsx`
- Create: `v2/apps/web/app/(en)/zh-cn/kr/seoul/check/page.tsx`
- Create: `v2/apps/web/app/(en)/zh-cn/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/app/sitemap.ts`
- Create: `v2/apps/web/test/chinese-public-editorial-routes.test.tsx`

**Interfaces:**
- Consumes: the Chinese presentation model and public shell from Tasks 1–2.
- Produces: four public `zh-CN` entry routes with canonical and `hreflang` metadata.

- [ ] **Step 1: Write failing route and metadata tests**

```ts
expect(home.metadata.alternates?.languages).toMatchObject({ en: '/', 'zh-Hans': '/zh-cn/kr/seoul/' });
expect(renderedHome).toContain('lang="zh-CN"');
expect(renderedHome).toContain('在韩国租房前，先看真实成交依据。');
expect(renderedHome).not.toContain('/design-review/');
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement Home and Journal from canonical Chinese presentation copy**

Check and Explore routes initially redirect to their English production tools with a visible language-boundary explanation only if the production route models cannot yet provide Chinese interaction labels. Do not publish a non-functional form or map.

- [ ] **Step 4: Add only indexable Chinese routes to sitemap and commit**

```bash
pnpm exec vitest run apps/web/test/chinese-public-editorial-routes.test.tsx apps/web/test/sitemap.test.ts
git add 'v2/apps/web/app/(en)/zh-cn' v2/apps/web/app/sitemap.ts v2/apps/web/test/chinese-public-editorial-routes.test.tsx
git commit -m "feat: publish Chinese editorial entry"
```

### Task 6: Complete the release gate and deploy

**Files:**
- Create: `docs/reviews/2026-09-04-phase-1-public-editorial-qa.md`
- Modify only for observed failures: files from Tasks 1–5.

**Interfaces:**
- Consumes: indexable public routes and retained noindex review routes.
- Produces: verified Production deployment.

- [ ] **Step 1: Run all tests, typecheck, lint, and Production build**

```bash
pnpm exec vitest run
pnpm --filter @signedprice/web typecheck
pnpm --filter @signedprice/web lint
pnpm --filter @signedprice/web build
```

Expected: all tests and build pass; lint has zero errors. Existing unrelated warnings must be recorded verbatim.

- [ ] **Step 2: Verify 1440/1024/390 public routes in Playwright**

Check `/`, `/insights/`, one article, `/zh-cn/kr/seoul/`, and `/zh-cn/kr/seoul/insights/` for overflow, 44px targets, computed tracking, article measure, public links, metadata, runtime console errors, and screenshots.

- [ ] **Step 3: Record evidence and commit**

```bash
git add docs/reviews/2026-09-04-phase-1-public-editorial-qa.md
git commit -m "docs: verify public editorial rollout"
```

- [ ] **Step 4: Merge latest `main` without force, deploy Preview, inspect actual render, then fast-forward `main`**

Reject deployment if Preview exposes review labels, design-review URLs, horizontal overflow, unavailable-as-zero evidence, or English body copy inside Chinese editorial sections.
