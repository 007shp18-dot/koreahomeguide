# SignedPrice SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Multi-agent execution is intentionally excluded from this workstream.

**Goal:** Make every currently indexable SignedPrice route a terminal, self-canonical, correctly localized page with working language navigation, complete social metadata, and enforceable sitemap invariants.

**Architecture:** Keep the verified Seoul evidence repositories and C visual system unchanged. Correct the route registry before changing presentation, separate English and Korean root layouts through URL-neutral route groups so static rendering is preserved, then centralize language and social metadata in the existing metadata helper. Tests treat the public route registry as the source of truth and fail if a sitemap entry redirects, lacks a self-canonical, or exposes a non-reciprocal alternate.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5.9.3, pnpm 11.19.0, Vitest 4.1.11, Playwright 1.62.1

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-organic-growth-seo-design.md`

## Global Constraints

- Base implementation on `3f4abc0` or a descendant that includes PR #36.
- No new runtime dependencies.
- Preserve the C evidence-editorial visual system.
- Internal Korea money remains integer KRW; internal area remains square metres.
- Fewer than five eligible contracts remain unpublished.
- Building routes remain `noindex, follow`.
- Singapore stays `noindex, follow`; Dubai stays out of the sitemap.
- Do not expose credentials, upstream diagnostics, raw private data, or invented evidence.
- A sitemap URL must be a terminal 200 indexable page with a self-canonical URL.
- Hreflang is emitted only for live reciprocal equivalents.
- Keep all currently static/SSG public pages static/SSG after the language-layout change.
- Production promotion requires exact-SHA Preview and browser verification.

---

### Task 1: Make the route registry describe terminal canonical pages only

**Files:**
- Delete: `v2/apps/web/app/kr/[area]/page.tsx`
- Modify: `v2/apps/web/app/kr/check/[area]/page.tsx`
- Modify: `v2/apps/web/lib/seo/public-route-registry.server.ts`
- Modify: `v2/apps/web/test/public-route-registry.test.ts`
- Modify: `v2/apps/web/test/cohort-zero-seo.test.tsx`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/tests/e2e/trust.spec.ts`

**Interfaces:**
- Consumes: `buildMarketPageModel('kr', 'seoul')`, existing Rent Check canonical `/kr/seoul/tools/rent-check/`, and `signedPricePublicRouteRegistry` readiness predicates.
- Produces: a real `/kr/seoul/` market hub, one canonical single-offer Rent Check URL, and a registry that contains no known redirect destinations.

- [x] **Step 1: Add red registry and route-contract assertions**

Add assertions equivalent to:

```ts
expect(registry.listSitemapPaths(readyState)).toContain('/kr/seoul/');
expect(registry.listSitemapPaths(readyState)).not.toContain('/kr/check/seoul/');
expect(registry.listSitemapPaths(readyState)).not.toContain('/kr/seoul/check/');
```

In the browser contract, replace the old `/kr/check/seoul/` indexable entry with a redirect assertion to `/kr/seoul/tools/rent-check/`, and assert `/kr/seoul/` renders the market heading with canonical `/kr/seoul/`.

- [x] **Step 2: Run the focused tests and confirm the current redirect/sitemap conflict fails**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/public-route-registry.test.ts apps/web/test/cohort-zero-seo.test.tsx
```

Expected: failure because `/kr/seoul/` is shadowed by the redirect route and `/kr/check/seoul/` is still registered as indexable.

- [x] **Step 3: Remove the shadow route and canonicalize the legacy check URL**

Delete `app/kr/[area]/page.tsx` so the existing `app/[country]/[city]/page.tsx` owns `/kr/seoul/`.

Change the legacy check page to an unconditional permanent redirect:

```tsx
import { permanentRedirect } from 'next/navigation';

export default function LegacyKoreaCheckPage() {
  permanentRedirect('/kr/seoul/tools/rent-check/');
}
```

Remove `/kr/check/seoul/` from `signedPricePublicRouteRegistry`. Keep `/kr/seoul/check/` readiness-gated because it is the distinct two-offer comparison when its verified conversion artifact is ready; it must stay outside the sitemap while unavailable.

- [x] **Step 4: Run focused tests and the Production build**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/public-route-registry.test.ts apps/web/test/cohort-zero-seo.test.tsx
pnpm build
```

Expected: PASS; build route table contains one `/kr/seoul` SSG owner and `/kr/check/seoul` no longer appears as an indexable page.

- [x] **Step 5: Commit the route-truth slice**

```bash
git add v2/apps/web/app/kr v2/apps/web/lib/seo/public-route-registry.server.ts v2/apps/web/test v2/tests/e2e
git commit -m "fix(v2): make Seoul SEO routes terminal"
```

---

### Task 2: Render the supplied localized navigation and real language switches

**Files:**
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/lib/locale/ko.ts`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/site-footer.tsx`
- Modify: `v2/apps/web/test/component-localization.type-test.tsx`
- Modify: `v2/apps/web/test/korean-embedded-components.test.tsx`
- Modify: `v2/apps/web/test/home-layout.test.ts`
- Modify: `v2/apps/web/app/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/app/kr/seoul/rankings/page.tsx`

**Interfaces:**
- Consumes: `SiteHeaderModel.links`, existing English/Korean canonical pairs, and the C header CSS.
- Produces: `SiteHeaderModel.languageSwitch?: { label: string; href: string; hrefLang: 'en' | 'ko' }` and localized crawlable navigation.

- [x] **Step 1: Write red render tests for Korean labels and reciprocal links**

```tsx
const html = renderToStaticMarkup(<SiteHeader copy={KOREAN_SITE_HEADER} />);
expect(html).toContain('계약 비교');
expect(html).toContain('구별 탐색');
expect(html).toContain('href="/kr/seoul/"');
expect(html).toContain('hrefLang="en"');
expect(html).not.toContain('>Briefs<');
```

Add the reciprocal English assertion on paired pages:

```tsx
expect(html).toContain('href="/ko/kr/seoul/explore/"');
expect(html).toContain('hrefLang="ko"');
```

- [x] **Step 2: Run the localization tests and confirm `SiteHeader` ignores the supplied links**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/component-localization.type-test.tsx apps/web/test/korean-embedded-components.test.tsx apps/web/test/home-layout.test.ts
```

Expected: FAIL because `SiteHeader` iterates the global English `productNavigationLinks` and renders the language label as a non-interactive span.

- [x] **Step 3: Add the language-switch contract and an explicit supplied-navigation variant**

Extend the model:

```ts
export interface SiteHeaderModel {
  readonly brand: string;
  readonly homeLabel: string;
  readonly homeHref?: string;
  readonly navigationLabel: string;
  readonly links: readonly NavigationLinkModel[];
  readonly navigationVariant?: 'product' | 'supplied';
  readonly marketLabel?: string;
  readonly languageLabel?: string;
  readonly languageSwitch?: Readonly<{
    label: string;
    href: string;
    hrefLang: 'en' | 'ko';
  }>;
}
```

In `SiteHeader`, preserve the verified shared product navigation by default and render `copy.links` when `navigationVariant` is explicitly `supplied`. Determine current state from the supplied model, and render the optional switch as a normal Next.js link with `hrefLang`. Do not infer equivalence from the pathname.

Set Korean header links to the four live Korean routes and an English switch to `/kr/seoul/`. Set English market/Explore/Rankings headers to their verified Korean equivalents. Do not add hreflang or language switches to English News/Guide until Korean equivalents exist.

- [x] **Step 4: Run localization tests and inspect the rendered anchors**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/component-localization.type-test.tsx apps/web/test/korean-embedded-components.test.tsx apps/web/test/home-layout.test.ts
```

Expected: PASS with Korean labels on Korean pages and crawlable reciprocal language links only on valid pairs.

- [x] **Step 5: Commit localized navigation**

```bash
git add v2/apps/web/components v2/apps/web/lib v2/apps/web/app/kr v2/apps/web/test
git commit -m "feat(v2): connect English and Korean SEO navigation"
```

---

### Task 3: Give English and Korean pages correct root document languages without losing static rendering

**Files:**
- Delete: `v2/apps/web/app/layout.tsx`
- Create: `v2/apps/web/app/(en)/layout.tsx`
- Create: `v2/apps/web/app/(ko)/layout.tsx`
- Move: `v2/apps/web/app/page.tsx` to `v2/apps/web/app/(en)/page.tsx`
- Move: English page directories `[country]`, `compare`, `contact`, `kr`, `privacy`, `sg`, and `trust` under `v2/apps/web/app/(en)/`
- Move: `v2/apps/web/app/not-found.tsx` under `v2/apps/web/app/(en)/`
- Move: `v2/apps/web/app/ko` to `v2/apps/web/app/(ko)/ko`
- Move: the Rent Check CSS module beside its shared components so route grouping does not couple components to an app-tree path
- Keep: `api`, `ads.txt`, `robots.ts`, and `sitemap.ts` at `v2/apps/web/app/`
- Modify: imports in moved route files to use the existing `@/*` alias
- Modify: `v2/vitest.config.ts` so Vitest resolves the same `@/*` alias as Next.js and TypeScript
- Modify: `v2/apps/web/test/cohort-zero-seo.test.tsx`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/apps/web/test/next-config.test.ts`

**Interfaces:**
- Consumes: existing `@/*` path alias, `AdvertisingConsent`, `PublicSiteJsonLd`, global CSS, and all existing URL paths.
- Produces: static English HTML rooted at `<html lang="en">` and static Korean HTML rooted at `<html lang="ko">`, with unchanged public URLs.

- [x] **Step 1: Add red root-language tests**

Create direct layout render assertions:

```tsx
expect(renderToStaticMarkup(<EnglishRootLayout><main /></EnglishRootLayout>))
  .toMatch(/^<html lang="en">/);
expect(renderToStaticMarkup(<KoreanRootLayout><main /></KoreanRootLayout>))
  .toMatch(/^<html lang="ko">/);
```

Add browser assertions for `/ko/kr/seoul/`, `/ko/kr/seoul/explore/`, and `/ko/kr/seoul/rankings/`:

```ts
await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
```

- [x] **Step 2: Run the language tests and confirm the current English root fails Korean routes**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/cohort-zero-seo.test.tsx apps/web/test/next-config.test.ts
```

Expected: FAIL because there is only one root layout with `lang="en"`.

- [x] **Step 3: Create two URL-neutral root layouts**

Both layouts preserve the existing font preload, global CSS, structured data, and consent boundary. Only the root language differs:

```tsx
export default function KoreanRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <PublicSiteJsonLd />
        {advertising.status === 'ready' ? (
          <AdvertisingConsent publisherId={advertising.publisherId} />
        ) : null}
      </body>
    </html>
  );
}
```

Use route groups so `(en)` and `(ko)` do not alter URLs. Convert moved route imports to `@/components/...` and `@/lib/...` before running the build; do not add runtime pathname/header reads.

- [x] **Step 4: Verify route identity and static output**

Run:

```bash
cd v2
pnpm typecheck
pnpm build
```

Expected: all previous URLs remain present; previously static/SSG routes remain `○` or `●`, and Korean pages no longer inherit the English root.

- [x] **Step 5: Run the full unit suite**

Run:

```bash
cd v2
pnpm test
```

Expected: all tests pass.

- [x] **Step 6: Commit the language-root migration**

```bash
git add v2/apps/web/app v2/apps/web/test v2/tests/e2e
git commit -m "fix(v2): emit correct Korean document language"
```

---

### Task 4: Centralize Open Graph, Twitter, locale, and reciprocal alternate metadata

**Files:**
- Modify: `v2/apps/web/lib/public-metadata.ts`
- Create: `v2/apps/web/lib/social-image.tsx`
- Create: stable first-party image routes `v2/apps/web/app/og/en/route.ts` and `v2/apps/web/app/og/ko/route.ts`
- Modify: paired English and Korean route metadata calls
- Modify: `v2/apps/web/test/cohort-zero-seo.test.tsx`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`
- Modify: `v2/tests/e2e/trust.spec.ts`

**Interfaces:**
- Consumes: `SIGNEDPRICE_ORIGIN`, page title/description/path, and optional validated language alternates.
- Produces: `indexableMetadata({ path, title, description, locale, languageAlternates, imagePath? })` with absolute canonical/social URLs.

- [x] **Step 1: Add red metadata-contract tests**

```ts
const metadata = indexableMetadata({
  path: '/ko/kr/seoul/',
  title: '서울 주거 계약 근거 | signedprice',
  description: '...',
  locale: 'ko_KR',
  languageAlternates: { en: '/kr/seoul/', ko: '/ko/kr/seoul/' },
});
expect(metadata.openGraph).toMatchObject({
  type: 'website',
  locale: 'ko_KR',
  url: 'https://www.signedprice.com/ko/kr/seoul/',
});
expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
```

Assert every alternate pair is reciprocal in the route metadata matrix and that English-only News/Guide pages have no invented Korean alternate.

- [x] **Step 2: Run metadata tests and confirm Open Graph/Twitter fields are absent**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/cohort-zero-seo.test.tsx apps/web/test/public-route-contract.test.tsx
```

Expected: FAIL on missing social and locale metadata.

- [x] **Step 3: Extend the shared helper and add stable first-party images**

Add locale input (`en_US` or `ko_KR`), absolute `openGraph.url`, title, description, locale, site name, image dimensions `1200×630`, and a matching Twitter large-image card. Use stable `/og/en/` and `/og/ko/` `ImageResponse` routes with the existing paper/orange/ink palette; do not use remote images or unsupported market claims.

- [x] **Step 4: Apply metadata only to semantically equivalent pairs**

Use paired alternates for Seoul home, Explore, and Rankings. Keep conditional two-offer Check paired only when both routes render the same product; the single-offer English Rent Check remains English-only until its Korean route ships in Release 2.

- [x] **Step 5: Run focused tests and build**

Run:

```bash
cd v2
pnpm vitest run apps/web/test/cohort-zero-seo.test.tsx apps/web/test/public-route-contract.test.tsx
pnpm build
```

Expected: PASS and both OG images build without remote fetches.

- [x] **Step 6: Commit shared metadata**

```bash
git add v2/apps/web/lib/public-metadata.ts v2/apps/web/app v2/apps/web/test v2/tests/e2e
git commit -m "feat(v2): complete multilingual social metadata"
```

---

### Task 5: Enforce sitemap terminality and reciprocal language pairs in browser gates

**Files:**
- Modify: `v2/apps/web/test/public-route-registry.test.ts`
- Modify: `v2/apps/web/test/seo-platform-files.test.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/tests/e2e/trust.spec.ts`
- Create: `v2/tests/e2e/seo-foundation.spec.ts`
- Modify: `docs/handoffs/2026-09-01-signedprice-seo-growth-restart.md`

**Interfaces:**
- Consumes: `/sitemap.xml`, public route contract, rendered metadata, and browser response status.
- Produces: a release gate that rejects redirected sitemap URLs, non-self canonicals, wrong root languages, and one-way hreflang.

- [x] **Step 1: Add the end-to-end sitemap invariant**

For each sitemap URL, use the Playwright request client with redirects disabled:

```ts
const response = await request.get(url, { maxRedirects: 0 });
expect(response.status(), url).toBe(200);
const html = await response.text();
expect(html).toContain(`<link rel="canonical" href="${url}"`);
expect(html).toMatch(/<meta name="robots" content="index, follow"/);
```

For every rendered `hreflang="en"` or `hreflang="ko"`, request the counterpart and assert it links back to the source canonical.

- [x] **Step 2: Run the new browser gate against the local Production server**

Run:

```bash
cd v2
pnpm build
pnpm e2e --grep "SEO foundation"
```

Expected: PASS for all current sitemap entries, with Singapore and building detail absent from the indexable set.

- [ ] **Step 3: Run the complete verification matrix**

Run:

```bash
cd v2
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:rent-client-boundary
pnpm check:singapore-client-boundary
pnpm e2e
```

Expected: every command passes with zero credential-boundary findings.

- [x] **Step 4: Record exact counts and remaining Release 2/3 work**

Update the handoff with final test counts, build route counts, the exact commit SHA, and the explicit non-goals still pending: Korean content completion and Singapore aggregate indexation.

- [x] **Step 5: Commit the release gate**

```bash
git add v2/tests v2/apps/web/test docs/handoffs
git commit -m "test(v2): gate multilingual SEO foundation"
```

---

## Self-review

- Spec coverage: route truth, page language, localized navigation, reciprocal hreflang, canonical metadata, social images, sitemap terminality, and rights/indexation containment each map to a task.
- Deliberate exclusions: Korean content expansion and Singapore aggregate publishing are separate independently deployable releases.
- Placeholder scan: no implementation step relies on TBD values or invented evidence.
- Type consistency: `SiteHeaderModel.languageSwitch` and `indexableMetadata.locale` are defined before later tasks consume them.
- Release safety: no task opens Singapore, Dubai, or building indexation.
