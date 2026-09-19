# SignedPrice Usability Refresh Implementation Plan

> For agentic workers: use executing-plans for parent integration and dispatching-parallel-agents for isolated data/editorial/explorer domains already assigned.

**Goal:** Implement the approved useful blue visual system, validate data freshness, publish a new evidence-backed analysis.
**Architecture:** Keep current Next routes and market-specific data adapters. New homepage composes existing search, source-bound charts, and server-loaded editorial records. Independent modules own explorer controls, content discovery and data operations.
**Tech Stack:** Next16.3.3, React19.2.8, CSS modules, Neon, Vitest, Vercel.
**Spec:** docs/superpowers/specs/2026-09-19-usability-refresh.md

## Global Constraints
Preserve source scope and currency, four-city order and three locales. >=44px touch,16px input. No fake metrics or generated property photos. No dependency additions for decorative animation. Existing authorization covers implementation and publication.

## Review Focus
1. Empty/unavailable datasets never become zero prices.
2. Translated articles keep canonical identity and deduplicate against English.
3. New home cards navigate rather than silently expand budgets.
4. Modal close restores keyboard focus and preserves the selected filters.
5. Collection success does not imply a newer publication.

### Task1 Home and common shell — parent
- Files: components/design-review/editorial-growth-home.tsx and .module.css, home-analysis.tsx, home/home-search.tsx, app/(en)/page.tsx and localized homes, globals.css, home tests.
- Consumes: listLatestInsightArticles(locale,4) → EditorialPortfolioRecord[] from editorial task. Pure PropertyHome accepts optional articles so it can render without DB in tests.
- [x] Add regression checks: each data-city-destination is a locale-correct link, homepage includes real search, injected newer article appears, old budget panel absent. Run focused vitest and observe fail.
- [x] Implement compact photograph/search + direct city gallery + latest articles + dated report graph + costs entry.
- [x] Update only superseded homepage test expectations; retain accessibility/source/locales gates. Run focused test files, lint/typecheck.

### Task2 Explore and detail — explore_detail domain
- Files: market-ui, public-market, singapore, dubai, japan components and their tests only.
- [x] Audit shared shell and overlays; fix keyboard/dialog issue with regression.
- [x] Align layout, selected controls, compact detail imagery, mobile panel.
- [x] Run tests covering filters/dialog/labels; send exact files/results.

### Task3 Editorial discovery and reading — editorial domain
- Files: lib/content; newsroom, insights/guide/article CSS and tests only.
- [x] Reproduce stale cached empty list and classification/translation gaps.
- [x] Keep request memoization, prevent persisted transient failures, expose listLatestInsightArticles; improve article hierarchy.
- [x] Run repository/publishability/grouping/reader tests.

### Task4 Data and publication — data/new_analysis domains + parent
- [x] Query current observations and refresh/publication runs read-only, trace stale public data paths, record facts.
- [x] Safe status distinction and tests; do not republish unvalidated overlapping source families.
- [x] Prepare one distinct reader-focused EN/KO article with original arithmetic/primary source evidence; review before insert.
- [x] Parent publishes through existing validated route or transactional additive DB writes, then confirms real URLs and latest discovery.

### Task5 Integration and release — parent
- [x] Review all diffs and independent review.
- [ ] Full unit/type/lint/build; browser actual routes and mobile if environment supports.
- [ ] Commit branch with [vercel-preview], create PR, inspect CI and hosted preview; correct actual failures together.
- [ ] Merge/deploy only when release evidence supports it. Record exact released commit and verified pages; explain any access blocker precisely.

## Execution record
Initial: main3b7ac50 isolated worktree. Prior PR369 fixes preserved elsewhere. Ruling: delegate independent scopes per dispatching-parallel-agents instruction; parent integrates without repeatedly asking user for approval. Ruling: reference libraries provide patterns; no package installation needed until behavior requires one.

Integration checkpoint: 3,602 unit tests passed; 87 skipped. Workspace typecheck passed after clearing stale copied incremental state. ESLint: zero errors, ten existing warnings. Reviewer found Singapore sort-chip removal clearing project scope; corrected and browser regression added, 28 related tests passed. GitHub transport preserves exact local tree 3985cadaef0586017e75cc6a10c1c62de9531d58 at remote commit 624524d353b9259e159e991c231d572fa9cc6c3b (PR370). EN/KO article live rendering verified after transactional publication 2026-09-19T10:31:04.071Z.

Hosted preview624524d: Vercel READY. Manually verified EN/KO homepage, search to Singapore Tampines results, pulse switch plus six-row source table, Treasure at Tampines detail with collapsed media, KO article sidebar and anchor navigation, and no horizontal overflow in article. Preview uses its existing snapshot/content environment; production DB articles were verified on their live URLs separately. GitHub verify passed all fifteen steps including build, memory and client-boundary checks. Mobile smoke found Seoul toolbar focus offset3px instead of common2px; code corrected. Desktop article TOC tests updated for permanent sidebar versus expandable small-screen contents. First broad browser gate: 822 passed,43 skipped,24 failed. Failures grouped into changed heading/TOC expectations, sources disclosure default-open regression, focus offset, and four archived-home image regressions. Reviewed actual CI screenshots: live article thumbnails had leaked into the historical review layout and covered its header. Freeze that review-only analysis fixture; retain all image baselines unchanged. Restore sources to native collapsed disclosure, retain visible source dates, and align only superseded text/typography assertions.
