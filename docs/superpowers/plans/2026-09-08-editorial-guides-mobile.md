# Editorial and Guides cleanup

> **For agentic workers:** Execute inline; root owns all application edits. Research agents supply article drafts, photo assets and content audit only.

**Goal:** Separate practical reference from editorial analysis, remove repetitive guide navigation, and fix Korean mobile filtering while enriching city stories.

**Architecture:** Preserve existing Next routes, published records, interactive budget examples and data releases. Use a shared guide-directory component and explicit editorial-placement rules; consolidate one overlapping guide with a redirect and keep budget articles at existing URLs while placing them in Insights.

**Tech Stack:** Existing Next 16, React, CSS Modules, pnpm, Vitest and Playwright.

**Spec:** User feedback in this session: two distinct mobile filter rows, fuller natural bilingual city articles with relevant real photos, practical Guides vs editorial News & Insights, remove weak/duplicate content and repeated Read/Explore/Tools actions.

## Constraints

- Preserve blue/navy brand, URLs, calculations, SEO and existing data services.
- No new database, image subscription or request-time image sourcing.
- Preserve source/license attribution; no fictitious visits or sample disclaimers.
- No production release before preview checks.

## 1. Editorial placement and Guides

- [x] Add failing rendered-content tests: practical guides excluded from News; budget comparisons excluded from Guides; titles provide the sole article link.
- [x] Add `content/guide-directory.ts` to classify budget analysis and the merged district guide.
- [x] Add shared `components/guides/guide-directory.tsx` and scoped CSS; wire EN/KO guide index routes, retaining city query filters.
- [x] Consolidate district-comparison explanation into the retained transaction-reading guide and redirect old guide URL to its section.
- [x] Update article breadcrumbs/active navigation for budget analysis; retain interactive data and old URLs.
- [x] Run focused Vitest and typecheck.

## 2. Mobile News and article reading

- [x] Make category and city navigation separate grid rows on mobile, each independently scrollable without label wrapping.
- [x] Review supplied city drafts and integrate specific bilingual prose without inventing facts.
- [x] Add photo metadata and render contextual images within each story with small, licensed static assets and lazy loading.
- [x] Verify image existence/decoding, article links and chapter anchors.

## 3. Release

- [ ] Run lint, typecheck, relevant unit tests and build.
- [ ] Verify Korean mobile filter geometry, guide navigation, story photos and existing saved/calculation journeys in preview.
- [ ] Push isolated branch, inspect CI, merge and verify production deployment before reporting completion.


## Review notes

- Independent read-only review found no blocking placement, redirect, mobile filter or photo path defects; Tokyo reference now links directly to the official guidebook.
- Removed the retired guide from the lightweight language route registry as well as the published portfolio.
- Focused editorial suite: 59 tests passed. Full regression and preview remain the release gate.
