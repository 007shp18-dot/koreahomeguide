# Four-city Buying Journey Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent task work and reviews; root implements the homepage while the editorial task runs in separate files.

**Goal:** Make four cities equally discoverable and turn a purchase-price budget into understandable, evidenced next steps.
**Architecture:** Existing Next.js routes remain. A server-only summary model feeds a client city/budget chooser; existing guides hold the full evidence. Editorial/navigation/support changes are independent.
**Tech Stack:** Next.js 16.3.3, React 19.2.8, CSS Modules, Vitest, Playwright; no new UI dependency.
**Spec:** docs/superpowers/specs/2026-09-15-four-city-buying-journey-design.md

## Global Constraints
- City order Seoul, Singapore, Dubai, Tokyo. Initial city unselected.
- Localize new visible controls in en, ko, zh-CN; retain locale routes and actual source precision.
- Existing blue semantic tokens; 48px controls and at least 44px touch targets. SEED interaction guidance.
- Reuse existing published guide data. No new financial assumptions, live-listing claims, operator credentials or unsupported service promises.
- Preserve SEO indexing/sitemaps, existing URLs, consent and provider client boundaries.

### Task 1: Four-city homepage and evidence handoff
**Files:** create lib/home/buying-journey-model.server.ts, lib/home/buying-journey.ts, components/home/buying-journey.tsx and CSS module; update components/design-review/editorial-growth-home.tsx, guide budget initialization as needed, and relevant tests. Paths relative to v2/apps/web.
**Interfaces:** server creates locale-specific serializable city models from BUYING_GUIDE_DATA/KOREAN_BUYING_GUIDE_DATA and existing Tokyo guide checkpoints; client owns only selected city and band. Reuse BUDGET_GUIDE_SERIES slugs/periods and published locale routes.
- [x] Test that supported caps/currencies, observed values and counts agree with reviewed sources; Tokyo anonymous records stay separately scoped.
- [x] Implement four equal city controls, reset budgets across cities, show dated evidence summaries and existing costs/price-research destinations.
- [x] Implement validated budget handoff for interactive guides; preserve default and reject unknown/nonfinite budgets.
- [x] Keep photo licenses and source disclosures, useful non-JS links and localized copy.
- [ ] Verify selection state, desktop/mobile overflow and meaningful destination navigation.

### Task 2: Editorial, navigation and support alignment
**Files:** components/newsroom/insights-index.tsx and its CSS; components/site-header.tsx, site-mobile-menu.tsx if required; existing trust/contact components/routes; relevant tests. Do not edit homepage or guide components, shared global stylesheet or content datasets.
**Interfaces:** existing InsightsIndex inputs/URLs retained; default All becomes buying-led without losing neighbourhood filter; primary links remain a shared desktop/mobile source.
- [x] Default Insights shows buying/investment material plus budget collection; neighbourhood stories remain reachable under their named filter. Preserve explicit filters and language fallback labels.
- [x] Primary navigation order Explore, Buying guides, Insights; Community moves to More, footer stays accessible. Keep city/language/query behavior and current-page state.
- [x] Improve existing trust/contact copy and links to show available research help, what a user should include and what support does/does not deliver. No invented identity or brokerage readiness; retain existing privacy/correction channels.
- [ ] Run relevant unit tests and inspect resulting desktop/mobile controls; update assertions only for intentional product changes.

### Task 3: Review, verification and release
- [x] Review all diffs for spec compliance, locale links, source scope and UI consistency.
- [ ] Run lint, typecheck, focused tests and CI-required checks. Resolve material failures.
- [ ] Browser-check all four city selections, budget handoff, keyboard operation and narrow layouts in EN/KO/ZH.
- [ ] Commit code and roadmap; create PR, observe CI, merge when required gates pass, verify Vercel production and live changed routes.

## Decisions and progress
- Ruling: Work on clean feature branch feat/four-city-buying-journey based on origin/main (33bbfea); preserve installed dependencies and avoid duplicating a large checkout.
- Ruling: Existing design approval plus request to implement satisfies design gate; no repeat approval pause.
- Ruling: SEED is a reference for semantics and controls, not a request to replace the production component stack.
- Ruling: Use the existing recorded examples; no speculative yield or finance calculation is introduced.

- Review: Independent source/spec review passed for both tasks after preserving fractional AED prices, two-decimal areas and Chinese non-name property descriptions.
- Validation: Local Chromium installation is unavailable; browser behavior and visual screenshots must pass hosted CI before merge.
