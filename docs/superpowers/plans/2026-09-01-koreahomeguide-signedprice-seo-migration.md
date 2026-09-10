# KoreaHomeGuide → SignedPrice SEO Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Publish evidence-backed SignedPrice SEO destinations, move only exact matching KoreaHomeGuide English URLs with single-hop HTTP 301 redirects, and ship PR #32 through Preview and Production without disrupting KoreaHomeGuide Chinese search traffic.

**Architecture:** A server-only SignedPrice SEO registry is the single source of truth for indexable destinations, sitemap membership, and crawlable navigation. A root-level KoreaHomeGuide migration manifest references that registry's approved destination paths and generates both Vercel redirect rules and sitemap exclusions. District/property-type pages are published only for combinations supported by validated building artifacts; unmatched English routes and every Chinese route remain live.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Vitest 4, Playwright 1.62, pnpm 11, Vercel project configuration, GitHub Pull Requests.

**Spec:** `docs/superpowers/specs/2026-09-01-koreahomeguide-signedprice-seo-migration-design.md`

## Global Constraints

- Preserve the existing fail-closed evidence, rights, sample-minimum, and money-safety behavior.
- Keep `/zh/` routes live, self-canonical, crawlable, and present in KoreaHomeGuide sitemaps.
- Do not redirect `/compare/`, `/buy-or-rent/`, `/value-check/`, `/net-proceeds/`, Cohorts 3–5, or any unmatched guide.
- Use exact absolute `https://www.signedprice.com/...` targets and HTTP `301`, supported by Vercel's `statusCode` redirect configuration.
- Add destination pages to SignedPrice before enabling matching KoreaHomeGuide redirects.
- Run focused tests red → green before each implementation change, then run the complete release gate before merge.
- Commit after each green task so registry, destinations, and redirect activation remain independently reversible.

## Task 1: Add the Typed SignedPrice SEO Registry

**Files:**

- Create: `v2/apps/web/lib/seo/public-route-registry.server.ts`
- Create: `v2/apps/web/test/public-route-registry.test.ts`
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`

- [ ] Write a failing registry test covering unique canonical paths, supported locale/page-kind values, readiness, sitemap eligibility, exact legacy source path, and rejection of duplicate source or target identities.
- [ ] Run `pnpm -C v2 exec vitest run apps/web/test/public-route-registry.test.ts` and confirm the missing registry failure.
- [ ] Implement immutable registry types and constructors for Cohort 0 plus currently approved Cohort 1 target candidates. Evidence-dependent entries must accept a readiness predicate rather than defaulting to indexable.
- [ ] Refactor `app/sitemap.ts` to consume registry output for fixed routes while retaining News, Guide, operator, district, and evidence reconciliation.
- [ ] Update sitemap expectations without changing the currently published URL set.
- [ ] Run `pnpm -C v2 exec vitest run apps/web/test/public-route-registry.test.ts apps/web/test/public-route-contract.test.tsx`.
- [ ] Commit with `git commit -m "feat(seo): add SignedPrice public route registry"`.

## Task 2: Complete Cohort 0 Metadata, Structured Data, and Crawl Paths

**Files:**

- Modify: `v2/apps/web/lib/public-metadata.ts`
- Modify: `v2/apps/web/app/layout.tsx`
- Modify: `v2/apps/web/app/page.tsx`
- Modify: `v2/apps/web/app/[country]/[city]/page.tsx`
- Modify: `v2/apps/web/app/kr/seoul/check/page.tsx`
- Modify: `v2/apps/web/app/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/app/kr/seoul/rankings/page.tsx`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/site-footer.tsx`
- Create: `v2/apps/web/test/cohort-zero-seo.test.tsx`

- [ ] Write failing SSR tests asserting unique titles/descriptions, self-canonical `www` URLs, reciprocal English/Korean hreflang only where both pages exist, valid WebSite/Organization/Breadcrumb JSON-LD, and crawlable links from home to every public hub within two clicks.
- [ ] Run `pnpm -C v2 exec vitest run apps/web/test/cohort-zero-seo.test.tsx` and confirm the metadata/navigation failures.
- [ ] Extend the metadata helper with typed alternates and JSON-LD serialization that escapes `<` and never accepts untrusted HTML.
- [ ] Add route-specific metadata and structured data without changing calculation or evidence models.
- [ ] Add concise, crawlable header/footer hub links using normal anchors; do not expose rights-blocked Singapore or Dubai routes.
- [ ] Run the focused test plus `public-route-contract.test.tsx`, `home-page.test.tsx`, and Korean route tests.
- [ ] Commit with `git commit -m "feat(seo): complete SignedPrice cohort zero metadata"`.

## Task 3: Build the Evidence-Gated Property-Type Model

**Files:**

- Create: `v2/apps/web/lib/public-market/property-type-route-model.server.ts`
- Create: `v2/apps/web/lib/public-market/property-type-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/building-summary-repository.server.ts`
- Create: `v2/apps/web/test/property-type-route-model.test.ts`
- Modify: `v2/apps/web/test/public-building-fixture.ts`

- [ ] Write failing tests for `apartment`, `officetel`, and public slug `villa` mapping to stored `villa_multifamily`, with invalid types rejected.
- [ ] Test the publication gate: a district/type combination publishes only when at least one retained building has a published overall distribution and the aggregate contains at least the artifact publication minimum of underlying recent contracts.
- [ ] Test honest aggregation: count only retained contracts, compute min/quartiles/median/max from contract values, disclose retained-building coverage, preserve the artifact period/source, and never copy a generic district median into a type page.
- [ ] Test withheld/invalid artifact behavior returns `null` and removes the route from the publishable parameter list.
- [ ] Implement immutable route models and repository filtering; retain integer won values and existing percentile convention.
- [ ] Run `pnpm -C v2 exec vitest run apps/web/test/property-type-route-model.test.ts apps/web/test/public-building-route-model.test.ts`.
- [ ] Commit with `git commit -m "feat(seo): model evidence-backed property type routes"`.

## Task 4: Publish SignedPrice District/Property-Type Destinations

**Files:**

- Modify: `v2/apps/web/app/kr/seoul/explore/[district]/[buildingId]/page.tsx`
- Create: `v2/apps/web/components/public-market/property-type-detail-page.tsx`
- Create: `v2/apps/web/components/public-market/property-type-detail-page.module.css`
- Modify: `v2/apps/web/app/kr/seoul/explore/[district]/page.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/apps/web/lib/seo/public-route-registry.server.ts`
- Create: `v2/apps/web/test/property-type-routes.test.tsx`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`

- [ ] Write failing route tests for static params, invalid combinations returning 404, unique title/description, self-canonical, Dataset/Breadcrumb structured data, visible source/period/sample disclosure, and distinct type-specific numbers.
- [ ] Write failing sitemap/internal-link tests proving only publishable district/type combinations appear and every published target is linked from its district page.
- [ ] Implement the SSR component and dispatch the existing third-segment route to a property-type model when the segment is `apartment`, `officetel`, or `villa`; otherwise preserve the existing building-detail behavior. Next.js cannot host sibling `[buildingId]` and `[propertyType]` folders at the same path depth.
- [ ] Register only evidence-ready combinations and extend the sitemap from the same route-param source.
- [ ] Run focused model, route, sitemap, and accessibility tests.
- [ ] Commit with `git commit -m "feat(seo): publish Seoul property type pages"`.

## Task 5: Add the KoreaHomeGuide Migration Manifest and Validator

**Files:**

- Create: `data/seo/signedprice-migration-manifest.json`
- Create: `scripts/seo/build-signedprice-migration.cjs`
- Create: `scripts/seo/validate-signedprice-migration.cjs`
- Create: `tests/signedprice-migration.test.cjs`
- Modify: `package.json`

- [ ] Write failing tests for schema version, exact source paths, absolute `www` targets, locale agreement, unique sources, target existence in the registry export, cohort activation, `301`, no Chinese entries, and explicit exclusion of unmatched tools.
- [ ] Add deterministic manifest generation for approved Cohort 1 entries and evidence-ready Cohort 2 district/type entries. Keep `/guides/` disabled until guide-discovery parity is proven by the focused test.
- [ ] Add `seo:build-migration` and `seo:validate-migration` scripts. The validator must fail on redirect chains, a target that is also a source, generic-home targets, or paths still present in KoreaHomeGuide static sitemaps.
- [ ] Run `npm run seo:build-migration`, `npm run seo:validate-migration`, and the focused Node test.
- [ ] Commit with `git commit -m "feat(seo): add deterministic migration manifest"`.

## Task 6: Activate Exact 301 Redirects and Remove Redirected Sources from Sitemaps

**Files:**

- Modify: `vercel.json`
- Modify: `sitemap-static.xml`
- Modify: `sitemap.xml`
- Modify: `api/sitemap-market.js`
- Create: `scripts/seo/render-signedprice-migration.cjs`
- Modify: `tests/signedprice-migration.test.cjs`

- [ ] Extend the failing test to assert each active manifest entry renders exactly one Vercel redirect with `statusCode: 301` before rewrites and is absent from every static/dynamic sitemap output.
- [ ] Generate exact Cohort 1 rules for `/explore/` and `/tools/seoul-rent-check/` once their destination parity tests pass.
- [ ] Generate exact Cohort 2 rules only for source district/type pairs whose SignedPrice targets are published. Preserve supported intent query parameters and allow destination canonicals to drop tracking parameters.
- [ ] Keep `/guides/`, unmatched tools, all Chinese routes, Cohorts 3–5, and unknown paths unchanged.
- [ ] Validate `vercel.json` as JSON and run the migration validator twice to prove deterministic output.
- [ ] Commit with `git commit -m "feat(seo): activate verified SignedPrice redirects"`.

## Task 7: Add Preview HTTP and Browser Release Gates

**Files:**

- Create: `v2/e2e/seo-migration.spec.ts`
- Create: `scripts/seo/probe-seo-migration.mjs`
- Modify: `v2/playwright.config.ts`
- Modify: `package.json`

- [ ] Write Playwright tests for desktop and mobile SignedPrice home → Explorer → district → property type → Check navigation, metadata, JSON-LD, horizontal overflow, and visible evidence/source boundaries.
- [ ] Write HTTP probes that assert target `200`, self-canonical, sitemap membership, source single-hop `301`, target final `200`, Chinese representative `200`, and no source remaining in the KoreaHomeGuide sitemap.
- [ ] Add explicit environment inputs for Preview SignedPrice and Preview KoreaHomeGuide origins; refuse to probe Production unless `SEO_PROBE_ALLOW_PRODUCTION=1` is set.
- [ ] Run the browser suite locally against the production build when Chromium is available; otherwise install the project Playwright Chromium dependency and rerun.
- [ ] Commit with `git commit -m "test(seo): add migration release gates"`.

## Task 8: Full Verification, PR #32, Preview, Merge, and Production

**Files:**

- Modify: `docs/handoffs/2026-09-01-signedprice-claude-handoff.md`
- Modify: `docs/superpowers/specs/2026-09-01-koreahomeguide-signedprice-seo-migration-design.md`

- [ ] Update the handoff with actual published property-type counts, active redirect counts, deliberately retained KoreaHomeGuide routes, environment variables, rollback commit, and Search Console follow-up.
- [ ] Run `pnpm -C v2 test`, `pnpm -C v2 typecheck`, `pnpm -C v2 lint`, and `pnpm -C v2 build`.
- [ ] Run `pnpm -C v2 check:rent-client-boundary`, `pnpm -C v2 check:singapore-client-boundary`, `node scripts/v2-migration/verify-phase-0.cjs`, and `npm run seo:validate-migration`.
- [ ] Confirm the worktree is clean except deliberate generated artifacts, review `git diff --check`, and inspect the final commit range.
- [ ] Fast-forward the remote feature branch, wait for GitHub checks, make PR #32 ready for review, and deploy its Preview.
- [ ] Run the Preview browser/HTTP gates against both projects; fix failures before merge.
- [ ] Merge PR #32 to `main`, confirm both Vercel Production deployments are Ready, then run the Production probes with the explicit Production flag.
- [ ] Verify representative SignedPrice target pages, KoreaHomeGuide 301 sources, KoreaHomeGuide Chinese pages, both robots files, both sitemaps, runtime errors, and 5xx counts.
- [ ] If a post-deploy target or redirect gate fails, revert only the failing redirect cohort and redeploy while leaving valid SignedPrice pages live.

## Search Console and AdSense Follow-Through

- Keep SignedPrice and KoreaHomeGuide as separate Search Console properties during the partial migration.
- Submit the new SignedPrice sitemap and resubmit the updated KoreaHomeGuide sitemap after Production is verified.
- Inspect representative source/target pairs by cohort; do not use Change of Address.
- AdSense remains a separate SignedPrice site review. Do not enable the script until the real publisher ID, verified operator/privacy data, consent flag, and `/ads.txt` `200` response are present.
