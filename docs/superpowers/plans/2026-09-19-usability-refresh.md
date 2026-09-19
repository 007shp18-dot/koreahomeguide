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
- [ ] Add regression checks: each data-city-destination is a locale-correct link, homepage includes real search, injected newer article appears, old budget panel absent. Run focused vitest and observe fail.
- [ ] Implement compact photograph/search + direct city gallery + latest articles + dated report graph + costs entry.
- [ ] Update only superseded homepage test expectations; retain accessibility/source/locales gates. Run focused test files, lint/typecheck.

### Task2 Explore and detail — explore_detail domain
- Files: market-ui, public-market, singapore, dubai, japan components and their tests only.
- [ ] Audit shared shell and overlays; fix keyboard/dialog issue with regression.
- [ ] Align layout, selected controls, compact detail imagery, mobile panel.
- [ ] Run tests covering filters/dialog/labels; send exact files/results.

### Task3 Editorial discovery and reading — editorial domain
- Files: lib/content; newsroom, insights/guide/article CSS and tests only.
- [ ] Reproduce stale cached empty list and classification/translation gaps.
- [ ] Keep request memoization, prevent persisted transient failures, expose listLatestInsightArticles; improve article hierarchy.
- [ ] Run repository/publishability/grouping/reader tests.

### Task4 Data and publication — data/new_analysis domains + parent
- [ ] Query current observations and refresh/publication runs read-only, trace stale public data paths, record facts.
- [ ] Safe status distinction and tests; do not republish unvalidated overlapping source families.
- [ ] Prepare one distinct reader-focused EN/KO article with original arithmetic/primary source evidence; review before insert.
- [ ] Parent publishes through existing validated route or transactional additive DB writes, then confirms real URLs and latest discovery.

### Task5 Integration and release — parent
- [ ] Review all diffs and independent review.
- [ ] Full unit/type/lint/build; browser actual routes and mobile if environment supports.
- [ ] Commit branch with [vercel-preview], create PR, inspect CI and hosted preview; correct actual failures together.
- [ ] Merge/deploy only when release evidence supports it. Record exact released commit and verified pages; explain any access blocker precisely.

## Execution record
Initial: main3b7ac50 isolated worktree. Prior PR369 fixes preserved elsewhere. Ruling: delegate independent scopes per dispatching-parallel-agents instruction; parent integrates without repeatedly asking user for approval. Ruling: reference libraries provide patterns; no package installation needed until behavior requires one.
