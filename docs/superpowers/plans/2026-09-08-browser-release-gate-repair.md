# Browser Release Gate Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore SignedPrice's four-viewport browser release gate without undoing the approved bilingual market UX, then ship the already-open release.

**Architecture:** Keep product behavior as the authority and realign stale Playwright contracts around semantic, visible user actions. Put responsive-header access in one E2E helper, repair actual locale metadata in the shared metadata builder, and accept only visually inspected snapshot changes.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Vitest, Playwright, pnpm, GitHub Actions, Vercel

**Spec:** `docs/superpowers/specs/2026-09-08-browser-release-gate-repair.md`

## Global Constraints

- All four release projects must pass: `desktop-chromium`, `mobile-chromium`, `tablet-chromium`, and `wide-chromium`.
- Preserve market data, calculations, route destinations, indexing decisions, and publication thresholds.
- Assert stable user-visible behavior, URLs, semantic regions, and data values; do not replace precise checks with generic visibility.
- Wait for streamed replacements or select visible instances when Next.js temporarily keeps a hidden fallback.
- Write a failing direct metadata test before any production metadata change.
- Visually inspect every replaced snapshot before accepting it.

---

### Task 1: Align decision-flow tests with the approved UI

**Files:**
- Modify: `v2/tests/e2e/contract-check.spec.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`
- Modify: `v2/tests/e2e/passport.spec.ts`
- Modify: `v2/tests/e2e/singapore.spec.ts`
- Modify: `v2/tests/e2e/stable-home-tools.spec.ts`
- Modify: `v2/tests/e2e/trust.spec.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`

**Interfaces:**
- Consumes: current visible labels and route behavior from the approved market-layout branch.
- Produces: browser assertions for the current asking-price, overview, detail, Passport, and Singapore flows; Task 2 may further change only navigation access in shared specs.

- [ ] **Step 1: Preserve the observed RED evidence**

Run the focused candidate tests before editing and record the expected failures for the old strings and selectors:

```bash
cd v2
pnpm exec playwright test tests/e2e/contract-check.spec.ts tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts tests/e2e/passport.spec.ts tests/e2e/singapore.spec.ts tests/e2e/stable-home-tools.spec.ts tests/e2e/trust.spec.ts tests/e2e/visible-foundation.spec.ts --project=desktop-chromium --project=wide-chromium
```

Expected RED includes old `Check one asking price.`, `Sale price as filed`, `Evidence ready`, `Check this contract`, one-link-per-card, and `Seoul Market Overview` assumptions.

- [ ] **Step 2: Replace stale copy checks with exact approved behavior**

Use these exact current contracts while retaining route, evidence-period, percentile, overflow, and return-link assertions:

```text
Seoul Check h1: Compare an asking price
Seoul fieldset: Property details
Seoul result labels: Asking sale price / Asking deposit / Asking monthly rent
Building CTA: Compare an asking price
Passport Korean submit: 다시 비교하기
Singapore evidence state: Data available
Singapore sale input: Asking price (SGD)
Singapore single submit: Compare an asking price
Singapore overview action: Explore reported prices
Unified overview h1 values: Seoul / Singapore / Dubai
```

Change the Explore-to-Detail journey locator to the exact building CTA. Change home-card assertions to verify both the explore and check route for each city through `data-primary-action="explore"` and the accessible asking-price link. Remove `Community signal` assertions only from the building-detail surface where the approved layout now intentionally contains the verified news module alone.

- [ ] **Step 3: Make streamed Check assertions test rendered behavior**

Keep raw-response checks for status, the blank A/B shell, source disclosure, and secret absence. For single-result pages, navigate with `page.goto`, wait for the streamed hand-off, select `[data-single-result]:visible`, and assert the exact fixture period and absence of the unavailable message. For the unsupported-entity case, assert the visible `[data-primary-check="single-quote"]` and the empty `Search a building · optional` textbox.

```ts
await page.waitForLoadState('networkidle');
await expect(page.locator('[data-single-result]').filter({ visible: true }))
  .toContainText('7 completed months · 2026-02–2026-08');
```

- [ ] **Step 4: Run the focused suites to GREEN**

```bash
cd v2
pnpm exec playwright test tests/e2e/contract-check.spec.ts tests/e2e/area-explore.spec.ts tests/e2e/korea-detail.spec.ts tests/e2e/passport.spec.ts tests/e2e/singapore.spec.ts tests/e2e/stable-home-tools.spec.ts tests/e2e/trust.spec.ts tests/e2e/visible-foundation.spec.ts --project=desktop-chromium --project=mobile-chromium --project=tablet-chromium --project=wide-chromium
```

Expected: all selected tests supported by each project pass; project-level skips remain the configured ones.

- [ ] **Step 5: Commit**

```bash
git add v2/tests/e2e/contract-check.spec.ts v2/tests/e2e/area-explore.spec.ts v2/tests/e2e/korea-detail.spec.ts v2/tests/e2e/passport.spec.ts v2/tests/e2e/singapore.spec.ts v2/tests/e2e/stable-home-tools.spec.ts v2/tests/e2e/trust.spec.ts v2/tests/e2e/visible-foundation.spec.ts v2/tests/e2e/public-route-contract.ts
git commit -m "test: align market browser journeys"
```

### Task 2: Exercise the real responsive header

**Files:**
- Create: `v2/tests/e2e/site-header-helpers.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/contract-check.spec.ts`
- Modify: `v2/tests/e2e/newsroom.spec.ts`
- Modify: `v2/tests/e2e/rankings.spec.ts`
- Modify: `v2/tests/e2e/shared-navigation-dubai.spec.ts`
- Modify: `v2/tests/e2e/singapore.spec.ts`
- Modify: `v2/tests/e2e/stable-home-tools.spec.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`

**Interfaces:**
- Consumes: the header breakpoint contract in `apps/web/app/globals.css` and the `Primary navigation` / `Site menu` semantics in `apps/web/components/site-header.tsx`.
- Produces: `visibleProductNavigation(page)`, `visibleMarketNavigation(page)`, and `visibleLanguageNavigation(page)` helpers returning the navigation users can actually operate at the current viewport.

- [ ] **Step 1: Reproduce the mobile navigation RED**

```bash
cd v2
pnpm exec playwright test tests/e2e/visible-foundation.spec.ts tests/e2e/newsroom.spec.ts tests/e2e/rankings.spec.ts --project=mobile-chromium --project=tablet-chromium
```

Expected RED: role queries wait for the hidden desktop `Primary navigation`, while the visible disclosure menu contains `Site menu`, `Choose a city`, market pages, and language navigation.

- [ ] **Step 2: Add a visible-header helper**

Implement helpers that first look for a visible `.site-header__mobile-menu`; when present, click its `summary` if it is closed and return the matching navigation inside the panel. Otherwise return the visible desktop navigation. Use exact English labels `Site menu`, `Choose a city`, and `${market} pages`, and locate language navigation by the visible `nav.site-header__languages`.

```ts
export async function visibleProductNavigation(page: Page): Promise<Locator> {
  const mobile = page.locator('.site-header__mobile-menu').filter({ visible: true });
  if (await mobile.count()) {
    if (!(await mobile.getAttribute('open'))) await mobile.locator('summary').click();
    return mobile.getByRole('navigation', { name: 'Site menu', exact: true });
  }
  return page.getByRole('navigation', { name: 'Primary navigation', exact: true });
}
```

The market and language helpers must follow the same visible-instance rule and must not use viewport numbers as a proxy for visibility.

- [ ] **Step 3: Route affected tests through the helper**

Replace direct user interaction with hidden `Primary navigation` nodes in all listed specs. On mobile, assert the five visible product links, three visible city links, visible language links, and the applicable market-page links inside the opened menu. On desktop, preserve the current five-link order and href checks. Keep touch-target, non-overlap, navigation, and overflow assertions intact.

- [ ] **Step 4: Run responsive suites to GREEN**

```bash
cd v2
pnpm exec playwright test tests/e2e/area-explore.spec.ts tests/e2e/contract-check.spec.ts tests/e2e/newsroom.spec.ts tests/e2e/rankings.spec.ts tests/e2e/shared-navigation-dubai.spec.ts tests/e2e/singapore.spec.ts tests/e2e/stable-home-tools.spec.ts tests/e2e/visible-foundation.spec.ts --project=desktop-chromium --project=mobile-chromium --project=tablet-chromium --project=wide-chromium
```

Expected: all selected tests supported by each project pass.

- [ ] **Step 5: Commit**

```bash
git add v2/tests/e2e/site-header-helpers.ts v2/tests/e2e/area-explore.spec.ts v2/tests/e2e/contract-check.spec.ts v2/tests/e2e/newsroom.spec.ts v2/tests/e2e/rankings.spec.ts v2/tests/e2e/shared-navigation-dubai.spec.ts v2/tests/e2e/singapore.spec.ts v2/tests/e2e/stable-home-tools.spec.ts v2/tests/e2e/visible-foundation.spec.ts
git commit -m "test: follow responsive site navigation"
```

### Task 3: Repair reciprocal locale metadata and its browser contract

**Files:**
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`
- Modify: `v2/apps/web/lib/public-metadata.ts`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/app/(ko)/ko/page.tsx`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/tests/e2e/seo-foundation.spec.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`

**Interfaces:**
- Consumes: `indexableMetadata`, `languageDestinations`, and independently reviewed EN/KO/zh-Hans route pairs.
- Produces: locale-correct OG images and reciprocal language alternates that the sitemap-wide browser contract validates.

- [ ] **Step 1: Add metadata tests and verify RED**

Add direct tests proving a Korean `indexableMetadata` call without `imagePath` emits `/og/ko/`, and that all three home locales advertise `en`, `ko`, `zh-Hans`, and `x-default` destinations.

```ts
const korean = indexableMetadata({
  path: '/ko/example/',
  title: '한국어 예시',
  description: '한국어 메타데이터 예시입니다.',
  locale: 'ko_KR',
});
expect(korean.openGraph).toMatchObject({ images: ['https://www.signedprice.com/og/ko/'] });
expect(korean.twitter).toMatchObject({ images: ['https://www.signedprice.com/og/ko/'] });
expect(homepageCopy.metadata.alternates?.languages).toMatchObject({
  en: 'https://www.signedprice.com/',
  ko: 'https://www.signedprice.com/ko/',
  'zh-Hans': 'https://www.signedprice.com/zh-cn/kr/seoul/',
  'x-default': 'https://www.signedprice.com/',
});
```

Run:

```bash
cd v2
pnpm --filter @signedprice/web test -- public-route-contract.test.tsx
```

Expected: both new assertions fail for the current missing defaults.

- [ ] **Step 2: Implement the minimal metadata correction**

In `indexableMetadata`, derive the default image from `locale` only when `imagePath` is omitted: Korean uses `/og/ko/`; English and Chinese continue to use `/og/en/`. Add `ko: '/ko/'` to English home alternates and add `'zh-Hans': '/zh-cn/kr/seoul/'` to Korean home alternates. Do not change canonical or robots behavior.

- [ ] **Step 3: Update the explicit E2E route inventory**

Set the unified overview headings to `Seoul`, `Singapore`, and `Dubai`; set the Seoul article heading to `Seoul rental deposits by district: what a median price hides`; and explicitly mark bilingual Singapore, Dubai, and released Seoul district Explore routes with `alternates: true`. Expand the three reviewed editorial tuples to include their exact Korean route, so the expected set is four tags including `x-default`.

```ts
['/news/policy/singapore-absd-policy-status/', '/ko/news/singapore-absd-policy-status/', '/zh-cn/news/policy/sg-absd-policy-zh/']
['/news/seoul-district-price-distribution/', '/ko/news/seoul-district-price-distribution/', '/zh-cn/news/seoul-district-price-distribution-zh/']
['/guides/rent-an-apartment-in-korea/', '/ko/guides/rent-an-apartment-in-korea/', '/zh-cn/guides/rent-in-korea-zh/']
```

Keep expected values independent of the production route mapper.

- [ ] **Step 4: Run metadata and SEO suites to GREEN**

```bash
cd v2
pnpm --filter @signedprice/web test -- public-route-contract.test.tsx
pnpm exec playwright test tests/e2e/seo-foundation.spec.ts tests/e2e/visible-foundation.spec.ts --project=desktop-chromium --project=mobile-chromium
```

Expected: direct metadata tests and sitemap-wide canonical, robots, OG, Twitter, and reciprocal-alternate checks all pass.

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/test/public-route-contract.test.tsx v2/apps/web/lib/public-metadata.ts v2/apps/web/lib/site-copy.ts 'v2/apps/web/app/(ko)/ko/page.tsx' v2/tests/e2e/public-route-contract.ts v2/tests/e2e/seo-foundation.spec.ts v2/tests/e2e/visible-foundation.spec.ts
git commit -m "fix: make locale metadata reciprocal"
```

### Task 4: Inspect and update intended visual baselines

**Files:**
- Modify: `v2/tests/e2e/editorial-growth-review.spec.ts-snapshots/home-en-mobile-chromium-mobile-chromium-linux.png`
- Modify: `v2/tests/e2e/editorial-growth-review.spec.ts-snapshots/home-en-wide-chromium-wide-chromium-linux.png`
- Modify: `v2/tests/e2e/editorial-growth-review.spec.ts-snapshots/home-zh-CN-mobile-chromium-mobile-chromium-linux.png`
- Modify: `v2/tests/e2e/editorial-growth-review.spec.ts-snapshots/home-zh-CN-wide-chromium-wide-chromium-linux.png`

**Interfaces:**
- Consumes: the existing editorial-growth reference route and approved home composition.
- Produces: reviewed Linux Chromium snapshot baselines for mobile and wide viewports.

- [ ] **Step 1: Reproduce only the four visual failures**

```bash
cd v2
pnpm exec playwright test tests/e2e/editorial-growth-review.spec.ts --grep '^home (en|zh-CN) is contained and visually stable$' --project=mobile-chromium --project=wide-chromium
```

Expected RED: four screenshot comparisons fail while overflow and 44px target assertions pass.

- [ ] **Step 2: Generate candidate baselines**

```bash
cd v2
pnpm exec playwright test tests/e2e/editorial-growth-review.spec.ts --grep '^home (en|zh-CN) is contained and visually stable$' --project=mobile-chromium --project=wide-chromium --update-snapshots
```

- [ ] **Step 3: Visually inspect all four images**

Open each updated PNG at original resolution. Confirm there is no horizontal clipping, accidental overlap, missing copy, broken image region, or collapsed 44px action. Reject and diagnose any visual defect before continuing.

- [ ] **Step 4: Re-run the complete visual suite**

```bash
cd v2
pnpm exec playwright test tests/e2e/editorial-growth-review.spec.ts --project=mobile-chromium --project=wide-chromium
```

Expected: all editorial-growth visual and layout tests pass.

- [ ] **Step 5: Commit**

```bash
git add v2/tests/e2e/editorial-growth-review.spec.ts-snapshots
git commit -m "test: refresh reviewed home snapshots"
```

### Task 5: Prove and publish the complete release

**Files:**
- Verify only: all files changed by Tasks 1–4 and the pending market-layout branch.
- External update: GitHub PR `#239` branch `codex/market-layout-bilingual-release-20260908`.

**Interfaces:**
- Consumes: reviewed commits from Tasks 1–4 and the original market-layout release.
- Produces: one locally and remotely verified Git tree deployed to production.

- [ ] **Step 1: Run non-browser verification**

```bash
pnpm --dir v2 test
pnpm --dir v2 typecheck
pnpm --dir v2 lint
pnpm --dir v2 --filter @signedprice/web build
```

Expected: tests, typecheck, and build pass; lint exits zero with no new warnings in changed files.

- [ ] **Step 2: Run the exact four-project release gate**

```bash
pnpm --dir v2 e2e --project=desktop-chromium --project=mobile-chromium --project=tablet-chromium --project=wide-chromium
```

Expected: zero failures. Configured fixture-only or project exclusions may remain skipped.

- [ ] **Step 3: Update the PR branch with the verified tree**

Create a GitHub commit whose parent is the current PR head, whose tree exactly matches the locally verified Git tree, and update `codex/market-layout-bilingual-release-20260908` without force. Confirm the remote tree SHA equals the local tree SHA.

- [ ] **Step 4: Verify remote gates and preview**

Wait for GitHub verify, browser, and Vercel checks. Require all checks green, then manually verify the preview home, one overview, one detail page, and one asking-price submission without horizontal overflow.

- [ ] **Step 5: Merge and verify production**

Fetch `main`; if its base changed, integrate it and repeat Steps 1–4. Otherwise merge PR `#239` with the verified head SHA, wait for the production Vercel deployment to become ready, and verify the same representative live routes and submission.
