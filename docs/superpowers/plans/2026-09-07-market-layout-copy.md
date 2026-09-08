# Market layout and bilingual copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Seoul, Singapore and Dubai consistent visitor-facing overview, detail, Explore and Check presentation in English and Korean.

**Architecture:** Keep data repositories and route URLs unchanged. Share overview presentation across city adapters, simplify the existing detail shell and align the Seoul detail composition. Centralize short bilingual UI labels where existing localization helpers support them.

**Tech Stack:** Next.js 16.3.3 App Router, React, TypeScript, CSS Modules, pnpm, Vitest.

**Spec:** docs/superpowers/specs/2026-09-07-market-layout-korean-copy-design.md

## Global Constraints

- Preserve existing branding, colours, five top-level menus, URLs, data calculations and market-specific units and qualifications.
- English is the default experience; both English and Korean need natural, concise copy, not internal release-status terminology.
- Never present Dubai area statistics as individual property valuations. Keep HDB/private and Ready/Off-Plan separate.
- Missing data is unavailable, not zero. Retain periods, sources, sample counts and comparison limitations.
- Work in the existing clean feature checkout; do not create a worktree without consent. No deploy or remote write by implementers.
- Use apply_patch for edits. Read apps/web/AGENTS.md and relevant installed Next docs before code changes.

### Task 1: Shared visitor-facing overviews

**Files:** Create `v2/apps/web/components/market-ui/market-overview.tsx`, `market-overview.module.css` alongside it; modify `components/public-market/seoul-overview.tsx`, `components/korean-market-overview.tsx`, `components/singapore/singapore-entry.tsx`, `components/dubai/dubai-overview.tsx` under `v2/apps/web`; test `v2/apps/web/test/market-overview-layout.test.tsx` and existing affected route tests.

**Interfaces:** Export `MarketOverview` with this props contract (data stays in callers):

```tsx
type MarketOverviewProps = Readonly<{
  locale: 'en' | 'ko';
  city: string;
  description: string;
  media: React.ReactNode;
  facts: readonly Readonly<{ label: string; value: string; detail?: string }>[];
  available: boolean;
  period?: string;
  actions: readonly Readonly<{ label: string; href: string; description: string }>[];
  notes: React.ReactNode;
  children?: React.ReactNode;
}>;
```

- [ ] Add a real-component test that catches fabricated statistics when unavailable and a test preserving localized action destinations. Example fixture/assertions:

```tsx
const html = renderToStaticMarkup(<MarketOverview locale="ko" city="서울" description="서울 거래" media={null} available={false} facts={[{label:'매매',value:'123'}]} actions={[{label:'실거래가 탐색',href:'/ko/kr/seoul/explore/',description:'단지별 거래'}]} notes="국토교통부" />);
expect(html).not.toContain('123');
expect(html).toContain('role="status"');
expect(html).toContain('href="/ko/kr/seoul/explore/"');
expect(html).toContain('국토교통부');
```

- [ ] Run `pnpm --dir v2 exec vitest run apps/web/test/market-overview-layout.test.tsx` and record expected RED (component absent).
- [ ] Implement `MarketOverview` with `MarketHero layout: 'overview'`, a max-four fact `dl`, action cards and sources/coverage notes. Use `available ? facts.slice(0,4).map(...) : <p role="status">...</p>`; include individual fact details and do not add placeholder numbers. Keep short heading and descriptions, 3/4-column desktop to single-column mobile; use minmax(0,1fr), min-width:0, coherent 16/24/32px spacing, natural Korean word breaks. Retain current palette via existing tokens.
- [ ] Replace city-specific overview arrangements with that component in all four adapters. Seoul retains sale/rent counts and their individual periods; Singapore keeps actual counts/currency and evidence limitations; Dubai retains annual/quarterly charts below common overview as children. Preserve frame/header/footer and metadata. Korean next-action links stay Korean. Remove obsolete English-only notice and internal product-depth/status rows from public overviews. Add source links and preserve unavailable behavior.
- [ ] Run new and affected existing tests, typecheck and full suite once. Update stale layout/copy tests to verify the new behavior without dropping data or route assertions. Commit only task files, record exact RED/GREEN and concerns.

### Task 2: Consistent detail hierarchy and readable spacing

**Files:** Modify `v2/apps/web/components/market-ui/market-shell.tsx`, `market-shell.module.css`; inspect and update composition in `components/public-market/building-detail-page.tsx`, `observed-building-detail.tsx`, `building-detail-header.tsx`, `components/singapore/singapore-project-detail.tsx`, `hdb-block-detail.tsx`, `hdb-town-detail.tsx`, `singapore-segment-detail.tsx`, `components/dubai/dubai-area-detail.tsx` as needed; test `v2/apps/web/test/market-detail-layout.test.tsx` and existing detail routes.

**Interfaces:** Preserve `MarketDetailShell` existing locale/breadcrumb/identity/metric/evidence/rail/media props. If Seoul needs optional slots, add only optional backwards-compatible props. Reuse current data nodes, tables and charts.

- [ ] Write test catching duplicate metric and lost anchor targets:

```tsx
for (const media of [undefined, <img key="image" src="/example.jpg" alt="Building" />]) {
  const html = renderToStaticMarkup(<MarketDetailShell locale="en" breadcrumb="Area" identity={<h1>Building</h1>} metric={<strong>AED 123,456</strong>} evidence={<p>12 transactions</p>} rail={<p>Source · 2026-01</p>} media={media} />);
  expect(html.match(/AED 123,456/g)).toHaveLength(1);
  for (const id of ['detail-overview', 'detail-evidence', 'detail-source']) expect(html).toContain(`id="${id}"`);
}
```

- [ ] Run `pnpm --dir v2 exec vitest run apps/web/test/market-detail-layout.test.tsx`; see duplication RED with no media.
- [ ] Render identity and optional media in header, metric once in overview, evidence next, source last. Minimal header correction: `{media ? <div className={styles.heroMedia}>{t(media)}</div> : null}`. Remove redundant generic description next to price. Consolidate conflicting shell CSS rules rather than append another patch block; no-media header gets a single column. Keep tabs and all source targets accessible. Price numbers must remain readable, not body-sized or forcibly broken.
- [ ] Apply same hierarchy to Seoul's bespoke details, retaining all evidence, charts, image/map and actions. Audit SG private/HDB and Dubai area consumers for redundant paragraphs and identity/price/source order. Concise labels must not erase unit/period/area-only limitations. On mobile place supplementary information after transactions, with independently scrollable tables.
- [ ] Run focused detail tests, typecheck and full suite once; commit and record RED/GREEN evidence.

### Task 3: Explore/Check bilingual copy and typography

**Files:** `v2/apps/web/lib/locale/singapore-copy.ts`, `lib/locale/market-localization.ts`, `components/market-ui/market-shell.tsx`; city `singapore-check-workspace.tsx`, `singapore-explorer.tsx`, `dubai-check-workspace.tsx`, `dubai-explorer.tsx`, `public-market/area-explorer.tsx` and associated CSS; `app/korean-typography.css`; relevant site-copy and navigation labels only where they name these surfaces. Test existing localization/routes plus `test/market-copy-format.test.ts` if needed.

**Interfaces:** Keep marketText/marketHref/sgText behavior and routes. For numeric percentile suffixes add reusable formatting only if existing formatter is absent: `formatPricePercentile(value: number, locale: 'en'|'ko'): string` in `lib/locale/price-percentile.ts`.

- [ ] Inspect actual visible Explore/Check copy and use the approved spec's wording table. Avoid blind source replacement that changes locale dictionary keys without callers. Consolidate action naming to English ‘Compare an asking price’ / Korean ‘매물 가격 비교’; use rent-specific wording when appropriate. ‘Completed window’ becomes ‘Reporting period’ / ‘집계 기간’ while full-month exclusions remain visible. Change internal-release phrases to source or availability descriptions.
- [ ] Where percentile output currently always appends `th`, add real formatter tests before implementing. Literal cases: 1→1st, 2→2nd, 3→3rd, 11→11th, 12→12th, 13→13th, 21→21st; Korean 21→‘21백분위’. Noninteger values use ‘Percentile 21.5’ in English rather than inventing a fractional ordinal. Implement ordinal selection using `% 100` for 11–13 then `% 10` for 1/2/3; leave percentile calculation untouched.
- [ ] Run the test to see RED then integrate formatter into real result component and rerun GREEN. Check the source/period/sample labels remain with results.
- [ ] Shorten titles, labels and help text in both languages. Move nonessential extended explanation to existing disclosures. Align equivalent Explore/Check title/body/control styles and let layouts wrap at narrow widths without shrinking text. Preserve necessary market-specific inputs.
- [ ] Run affected localization, navigation and check tests, typecheck, lint and full suite. Commit only task files. Report any surfaces not covered rather than claiming sitewide completion.

### Task 4: Final verification and authorized release

**Files:** No new product surface. Correct only defects found within tasks 1–3; record test evidence in task report.

- [ ] Run `pnpm --dir v2/apps/web typecheck`, `pnpm --dir v2 lint`, `pnpm --dir v2 test`, and `git diff --check`.
- [ ] Review complete branch diff against spec, including locale URLs, periods/units, missing values and preserved city charts.
- [ ] Use approved browser skill to inspect rendered EN/KO overviews and representative city detail/Explore/Check routes. Attempt responsive verification at 360/390/768/1280 only if browser supports it; report limitations honestly. Do not bypass preview protection or claim automated viewport checks from CSS inspection.
- [ ] Fetch main and preserve concurrent changes before release. Use configured authorized repo/deployment connection; no credential harvesting or force pushes. Verify deployment READY and actual rendered representative routes after release. If authority/access blocks publishing, stop with exact blocker and leave tested local commits intact.
