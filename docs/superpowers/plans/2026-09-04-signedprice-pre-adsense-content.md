# SignedPrice Pre-AdSense Original Content Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reach a credible, source-dated portfolio of 34 English originals and 12 Simplified Chinese originals, each connected to a relevant SignedPrice product, without enabling advertising yet.

**Architecture:** Keep English database-authored reports compatible, add source metadata to the editorial contract, store reviewed static portfolios in locale-specific modules, and render independent Chinese index/detail routes. Static articles resolve before the optional content database so database latency cannot block their pages.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, CSS Modules, Vitest, schema.org Article metadata.

---

### Task 1: Define and test the portfolio contract

- [x] Add `v2/apps/web/test/pre-adsense-content-portfolio.test.tsx`.
- [x] Require 30–40 English originals including the existing 14 guides and exactly 12 Chinese articles.
- [x] Require unique slugs, at least four substantive sections, official HTTPS sources, source check dates, and market-specific next actions.
- [x] Require Chinese canonical detail routes, locale metadata, reciprocal related-English links, and sitemap entries.
- [x] Run the focused test and confirm RED.

### Task 2: Add dated official-source metadata

- [x] Extend `v2/apps/web/lib/insights/editorial-content.ts` with the `EditorialSource` contract.
- [x] Add `v2/apps/web/lib/insights/official-property-sources.ts` for current Korean government, Seoul, HUG, KOTRA, URA, and data.gov.sg sources.
- [x] Render sources and checked dates in `InsightsArticle` without turning legal guidance into personalized advice.
- [x] Resolve known static articles before the optional database lookup.

### Task 3: Publish the English portfolio

- [x] Add 17 original English Korea reports in `v2/apps/web/lib/insights/english-korea-articles.ts`.
- [x] Cover rental workflow, deposit protection, registry/building records, foreign-buyer process, and real-transaction evidence interpretation.
- [x] Keep examples bounded, avoid unsupported tax rates or legal conclusions, and connect every report to Seoul Check, Explore, and guides.
- [x] Merge the new reports into `STARTER_EDITORIAL_ARTICLES` and verify 34 total English originals with the 14 guides.

### Task 4: Publish the Simplified Chinese pilot

- [x] Add 12 independently written articles to `v2/apps/web/lib/insights/chinese-korea-articles.ts`.
- [x] Include Korean original terms for jeonse, wolse, registry, fixed date, and reporting concepts.
- [x] Build a real Chinese index component and `/zh-cn/kr/seoul/insights/[slug]/` detail route.
- [x] Add localized source labels, market actions, canonical metadata, and Article JSON-LD.

### Task 5: Connect discovery and SEO

- [x] Add all static English and Chinese detail URLs to `v2/apps/web/app/sitemap.ts`.
- [x] Add reciprocal language alternates only for declared article pairs.
- [x] Keep the empty advertising boundary at zero height and do not load ad scripts.
- [x] Verify index pages expose every article through crawlable links.

### Task 6: Validate and publish

- [x] Run focused portfolio and route tests.
- [x] Run all tests, typecheck, lint, and production build.
- [ ] Review key English and Chinese routes at desktop/mobile widths when a browser is available.
- [ ] Deploy the validated pre-AdSense source to Production.
- [ ] Verify live canonicals, source sections, product handoffs, sitemap coverage, and runtime errors.
