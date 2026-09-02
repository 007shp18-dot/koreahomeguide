# SignedPrice Completion Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Korea and Singapore Explore, Check, building Detail, map and street-view, evidence, News, Community, SEO, and Production release flows using only verified provider data.

**Architecture:** Execute twelve independently reviewable releases. Provider packages own acquisition, rights, parsing, identity, and artifact contracts; the web app resolves installed snapshots into provider-neutral route models and renders market-native UI. Browser components receive only public coordinates and browser SDK keys.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, pnpm 11.19.0, Vitest 4.1.11, Playwright 1.62.1, Vercel, NAVER Maps JavaScript API v3, Google Maps JavaScript API, URA Data Service, data.gov.sg, MOLIT public APIs.

**Spec:** `docs/superpowers/specs/2026-09-02-signedprice-completion-program-design.md`

## Global Constraints

- Preserve KoreaHomeGuide Production and its canonical routes throughout the release.
- Do not print or bundle credential values, provider tokens, or raw source payloads.
- Do not publish invented or fallback prices, coordinates, facts, images, activity counts, or rights.
- Keep URA private, HDB, Korea sale, Korea jeonse, and Korea monthly evidence separate.
- Require `n >= 5` for each exact published distribution.
- Use test-first changes and a reviewable commit per task.
- Run exact-SHA Preview and live Production verification before marking a release complete.

---

### Task 1: Reconcile and close the Korea evidence release

**Files:**
- Verify: `v2/apps/web/data/installed-snapshots.json`
- Verify: `v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts`
- Verify: `v2/apps/web/app/api/internal/korea-rent-snapshot/route.ts`
- Verify: `v2/apps/web/app/api/internal/korea-sale-snapshot/route.ts`
- Test: `v2/apps/web/test/installed-snapshot-repository.test.ts`
- Test: `v2/apps/web/test/migration-manifest-registry.test.ts`

**Interfaces:**
- Consumes: `InstalledSnapshotRegistry` and the four installed Korea gzip artifacts.
- Produces: a clean remote-main-based branch whose Check and Explore trace the verified rent, sale, building, and conversion artifacts.

- [ ] Fetch remote refs and record local branch, remote main, PR merge SHAs, and Vercel Production SHA without mutating credentials.
- [ ] Rebase or merge only the known SignedPrice commits into an isolated worktree; preserve unrelated user changes.
- [ ] Add a failing registry test if any artifact metadata, digest, period, or count differs from the installed payload.
- [ ] Run `pnpm vitest run apps/web/test/installed-snapshot-repository.test.ts apps/web/test/migration-manifest-registry.test.ts` from `v2/` and confirm the failure describes the mismatch.
- [ ] Correct only the registry, trace, or resolver boundary responsible for the failure.
- [ ] Re-run the focused tests, then `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- [ ] Confirm the Production build traces all four gzip artifacts and no temporary collection GET route, 300-second export setting, or diagnostic stack logger remains.
- [ ] Commit with `fix: close korea evidence activation release`.

### Task 2: Audit the supplied Detail V2 mockups

**Files:**
- Read: `/workspace/scratch/430c70d6529f/upload/01-Korea-Home-Guide-UI-Mockups.zip`
- Create: `docs/reviews/2026-09-02-detail-v2-mockup-audit.md`
- Reference: `docs/superpowers/specs/2026-09-01-signedprice-unified-building-decision-detail-design.md`

**Interfaces:**
- Consumes: the two standalone Detail HTML references, build guide, design-system CSS, and approved data contracts.
- Produces: a field-by-field `apply`, `apply after data`, or `reject` matrix used by Tasks 5 and 6.

- [ ] Extract the archive into a temporary directory outside the repository and enumerate every file.
- [ ] Read the prompt, README, build guide, both HTML references, and design-system stylesheet.
- [ ] List each visible fact, price, chart, image, interaction, route, and responsive assumption.
- [ ] Map each item to an existing verified field, a planned official source, or an unsupported claim.
- [ ] Record desktop, 720px, and 390px overflow and reading-order risks.
- [ ] Write the audit with no mock value promoted to a product requirement.
- [ ] Commit with `docs: audit detail v2 mockups`.

### Task 3: Add provider-native building panorama components

**Files:**
- Create: `v2/apps/web/components/maps/building-street-view.tsx`
- Create: `v2/apps/web/components/maps/naver-building-panorama.tsx`
- Create: `v2/apps/web/components/maps/google-building-street-view.tsx`
- Modify: `v2/apps/web/components/maps/naver-district-map.tsx`
- Modify: `v2/apps/web/components/maps/google-place-map.tsx`
- Modify: `v2/apps/web/components/public-market/building-visual.tsx`
- Test: `v2/apps/web/test/building-street-view.test.tsx`
- Test: `v2/apps/web/test/naver-district-map.test.tsx`
- Test: `v2/apps/web/test/google-place-map.test.tsx`

**Interfaces:**
- Consumes: verified `{ latitude, longitude }`, `market: 'kr' | 'sg'`, and the market browser SDK key.
- Produces: `BuildingStreetView({ market, coordinate, label, browserKey })` with `loading`, `ready`, `map_fallback`, and `unavailable` states.

- [ ] Write tests proving Korea loads `panorama,geocoder`, Singapore initializes `StreetViewService`, and no visual request occurs before a property is selected.
- [ ] Run the three focused test files and confirm the new imports or states fail.
- [ ] Implement the provider-neutral discriminated state and lazy selected-property boundary.
- [ ] Implement NAVER `Panorama` without downloading or caching provider imagery.
- [ ] Implement Google `StreetViewService` and `StreetViewPanorama` without using the separately billed Static Street View endpoint.
- [ ] Add visible `Nearby street view` attribution and a same-provider live-map fallback.
- [ ] Prove SDK failure leaves identity, evidence, and Detail actions mounted.
- [ ] Run focused tests, typecheck, lint, and Production build.
- [ ] Commit with `feat: add provider native building street views`.

### Task 4: Ship Korea Explore V2 over full installed evidence

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/lib/public-market/area-explorer-state.ts`
- Modify: `v2/apps/web/lib/public-market/korea-explorer-evidence.server.ts`
- Modify: `v2/apps/web/app/(en)/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/app/(ko)/ko/kr/seoul/explore/page.tsx`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/apps/web/test/public-area-explorer-state.test.ts`
- Test: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**
- Consumes: observed-building, rent-evidence, and sale-evidence repositories.
- Produces: URL-stable `transaction`, `property`, `area`, `contract`, `district`, `building`, and `sort` state shared by map, list, table, and Detail links.

- [ ] Write failing tests for all 25 districts, all supported area bands, `jeonse|monthly|sale`, thin cohorts retaining identity, and removal of the 294/45–55 product limit.
- [ ] Run focused tests and confirm they fail on the current composition or state contract.
- [ ] Implement the shared validated query state and provider-neutral evidence rail model.
- [ ] Implement synchronized Split, List, Table, and Map views with deterministic incremental loading.
- [ ] Preserve map centre, zoom, selection, filters, and `Search this area` across navigation.
- [ ] Implement mobile full-width map and accessible bottom sheet with 44px targets and no 320px overflow.
- [ ] Run focused tests, complete Vitest, typecheck, lint, build, and the Explore Playwright spec.
- [ ] Commit with `feat: ship korea explore v2`.

### Task 5: Replace the primary Korea Check

**Files:**
- Modify: `v2/packages/market-core/src/contract-check.ts`
- Modify: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Modify: `v2/apps/web/lib/contract-check/route-model.server.ts`
- Modify: `v2/apps/web/app/(en)/kr/seoul/check/page.tsx`
- Modify: `v2/apps/web/app/(ko)/ko/kr/seoul/check/page.tsx`
- Create: `v2/apps/web/components/contract-check/single-quote-check.tsx`
- Test: `v2/apps/web/test/contract-check-route-model.test.ts`
- Test: `v2/apps/web/test/contract-check-workspace.test.tsx`
- Test: `v2/tests/e2e/contract-check.spec.ts`

**Interfaces:**
- Consumes: transaction-specific installed evidence and the installed monthly conversion curve.
- Produces: `SingleQuoteCheckInput` and `SingleQuoteCheckResult` with `below|typical|above`, distribution, difference, sample, period, filters, and comparable rows.

- [ ] Write failing tests for sale price, jeonse deposit, monthly deposit-plus-rent, missing inputs, exact sample gating, and same-building→neighborhood→district fallback disclosure.
- [ ] Run the focused Check tests and confirm failures.
- [ ] Implement transaction-specific inputs without coercing missing values to zero.
- [ ] Reuse KoreaHomeGuide decision semantics while consuming SignedPrice installed repositories.
- [ ] Keep filed monthly deposit and rent visible and apply only the verified conversion artifact to the normalized comparison.
- [ ] Move the existing A/B comparison to a secondary `Compare two offers` entry.
- [ ] Verify keyboard, stale request, abort, cache, rate-limit, and strict response-envelope behavior.
- [ ] Run focused tests, complete Vitest, typecheck, lint, build, and Check Playwright.
- [ ] Commit with `feat: make single quote check primary`.

### Task 6: Install official Korea building facts and complete Detail V2

**Files:**
- Create: `v2/packages/korea-building/package.json`
- Create: `v2/packages/korea-building/src/identity.ts`
- Create: `v2/packages/korea-building/src/building-register.ts`
- Create: `v2/packages/korea-building/src/apartment-register.ts`
- Create: `v2/packages/korea-building/src/artifact.ts`
- Create: `v2/apps/web/lib/public-market/building-facts-repository.server.ts`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-header.tsx`
- Test: `v2/packages/korea-building/test/identity.test.ts`
- Test: `v2/packages/korea-building/test/artifact.test.ts`
- Test: `v2/apps/web/test/public-building-detail.test.tsx`

**Interfaces:**
- Consumes: observed building identity, DATA_GO_KR service credential, 공동주택 기본정보, and 건축물대장 records.
- Produces: an installed official-facts snapshot keyed by stable building ID with per-field provenance and absence reasons.

- [ ] Write identity tests for legal-dong code, lot numbers, road address, PNU/building-management ID, conflicts, and forbidden name-only matches.
- [ ] Run the focused tests and confirm the new package is absent.
- [ ] Implement source-specific parsers and strict response completeness checks.
- [ ] Implement deterministic identity joins and per-field provenance.
- [ ] Build, validate, digest, and register the official-facts artifact without logging the credential or raw rows.
- [ ] Apply the Task 2 mockup audit to identity, official facts, decision tabs, evidence, and NAVER Panorama hero.
- [ ] Verify missing facts remain absent and do not block transaction evidence.
- [ ] Run package, Detail, full, type, lint, build, and responsive browser tests.
- [ ] Commit with `feat: add official korea building detail facts`.

### Task 7: Normalize and activate URA private evidence

**Files:**
- Modify: `v2/packages/singapore-property/src/credential.ts`
- Modify: `v2/packages/singapore-property/src/rights.ts`
- Modify: `v2/packages/singapore-property/src/ura-client.ts`
- Modify: `v2/packages/singapore-property/src/artifact.ts`
- Modify: `v2/scripts/build-singapore-snapshot.mts`
- Modify: `v2/apps/web/lib/singapore/snapshot-repository.server.ts`
- Test: `v2/packages/singapore-property/test/credential.test.ts`
- Test: `v2/packages/singapore-property/test/rights.test.ts`
- Test: `v2/packages/singapore-property/test/artifact.test.ts`
- Test: `v2/tests/singapore-snapshot-runner.test.ts`

**Interfaces:**
- Consumes: one canonical server-only URA access-key resolver and current URA API terms.
- Produces: verified versioned URA private sale and rent snapshots with stable project identity, area, tenure, price/PSF, period, rights, and digest.

- [ ] Write failing tests proving both legacy and new configured names resolve internally without entering browser code, and conflicting values fail closed.
- [ ] Write rights tests for allowed API use plus individual-dataset conditions and attribution.
- [ ] Implement one credential resolver and remove divergent collection behavior.
- [ ] Extend the URA adapter and artifact contracts to private sale and rent while retaining raw-field boundaries server-side.
- [ ] Run the schema canary, build the snapshot, recompute canonical SHA-256, and install only an exact match.
- [ ] Run Singapore package tests, client-boundary scan, full tests, typecheck, lint, and build.
- [ ] Commit with `feat: activate verified ura private evidence`.

### Task 8: Add HDB resale, rent, and property evidence

**Files:**
- Create: `v2/packages/singapore-property/src/hdb-client.ts`
- Create: `v2/packages/singapore-property/src/hdb-identity.ts`
- Create: `v2/packages/singapore-property/src/hdb-transaction.ts`
- Create: `v2/packages/singapore-property/src/hdb-property.ts`
- Extend: `v2/packages/singapore-property/src/artifact.ts`
- Test: `v2/packages/singapore-property/test/hdb-client.test.ts`
- Test: `v2/packages/singapore-property/test/hdb-identity.test.ts`
- Test: `v2/packages/singapore-property/test/hdb-artifact.test.ts`

**Interfaces:**
- Consumes: data.gov.sg datasets `d_8b84c4ee58e3cfc0ece0d773c8ca6abc`, `d_c9f57187485a850908655db0e8cfe651`, and `d_17f5382f26140b1fdae0ba2ef6239d2f`.
- Produces: separate HDB resale, owner-declared rental, and block-property artifacts keyed by normalized town+block+street.

- [ ] Write paged-response, schema, completeness, and empty-page tests from redacted official wire shapes.
- [ ] Write identity tests covering block suffixes, street normalization, town, and conflicting property rows.
- [ ] Implement the data.gov.sg client with bounded retries, deadlines, stable paging, and no browser access.
- [ ] Implement HDB resale and rental parsers with their different field sets and source caveats.
- [ ] Implement block-property joins and per-field provenance.
- [ ] Build, digest, validate, and register the three HDB artifacts independently.
- [ ] Run Singapore package, client-boundary, full, type, lint, and build checks.
- [ ] Commit with `feat: add hdb market evidence`.

### Task 9: Ship Singapore Explore, Check, Detail, and Street View

**Files:**
- Modify: `v2/apps/web/components/singapore/singapore-explorer.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-project-detail.tsx`
- Create: `v2/apps/web/components/singapore/singapore-check.tsx`
- Modify: `v2/apps/web/lib/singapore/route-model.server.ts`
- Modify: `v2/apps/web/app/(en)/sg/singapore/explore/page.tsx`
- Create: `v2/apps/web/app/(en)/sg/singapore/check/page.tsx`
- Test: `v2/apps/web/test/singapore-route-model.test.ts`
- Test: `v2/apps/web/test/singapore-routes.test.tsx`
- Test: `v2/tests/e2e/singapore.spec.ts`

**Interfaces:**
- Consumes: installed URA and HDB repositories plus Google Maps browser key.
- Produces: `All homes|Private|HDB` and `Sale|Rent` Explore state, market-native single-quote Check, property Detail, Google geocoding, map, and Street View.

- [ ] Write failing route-model tests proving private and HDB statistics never merge and `All homes` contains only availability/count comparisons.
- [ ] Write failing Check tests for URA sale/rent and HDB sale/rent native comparable rules.
- [ ] Implement synchronized Google map, rail, filters, selected property, and URL state.
- [ ] Implement project/block Detail with Google Street View and live-map fallback.
- [ ] Implement Singapore Check without importing Korean conversion policy.
- [ ] Enable the market switch only when live installed URA/HDB readiness passes.
- [ ] Run focused, full, type, lint, build, boundary, 390/720/1440, and Singapore Playwright checks.
- [ ] Commit with `feat: ship singapore private and hdb experience`.

### Task 10: Connect NAVER News and external community mentions

**Files:**
- Create: `v2/apps/web/lib/naver-search/client.server.ts`
- Create: `v2/apps/web/lib/naver-search/schema.ts`
- Modify: `v2/apps/web/lib/news/news-repository.server.ts`
- Modify: `v2/apps/web/components/news/news-index-page.tsx`
- Modify: `v2/apps/web/components/community/community-signal.tsx`
- Test: `v2/apps/web/test/naver-search.test.ts`
- Test: `v2/apps/web/test/news-repository.test.ts`
- Test: `v2/apps/web/test/community-signal.test.tsx`

**Interfaces:**
- Consumes: server-only NAVER Search credentials and market/building query descriptors.
- Produces: de-duplicated, attributed, short-cache News, Blog, and Cafe link cards separate from approved briefs and first-party community submissions.

- [ ] Write failing tests for credential absence, provider error, HTML title normalization, canonical-link de-duplication, date ordering, and no raw credential exposure.
- [ ] Implement the server-only NAVER Search client and strict response schema.
- [ ] Merge external link cards at the presentation boundary without storing or rewriting article content.
- [ ] Label News, Blog, Cafe, approved brief, and first-party response origins distinctly.
- [ ] Keep Community visible in truthful closed/collecting/read-only states when durable storage is unavailable.
- [ ] Run focused tests, full tests, typecheck, lint, build, and browser checks.
- [ ] Commit with `feat: connect naver news and community mentions`.

### Task 11: Release evidence-backed SEO and content

**Files:**
- Modify: `v2/apps/web/lib/seo/public-route-registry.server.ts`
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: market and property `page.tsx` metadata exports
- Create: evidence-led briefs under `v2/apps/web/content/news/`
- Test: `v2/apps/web/test/public-route-registry.test.ts`
- Test: `v2/apps/web/test/news-routes.test.tsx`

**Interfaces:**
- Consumes: route readiness, installed period, stable identity, and server-rendered evidence summaries.
- Produces: canonical, hreflang, breadcrumbs, structured data, sitemap entries, and source-linked editorial pages for ready routes only.

- [ ] Write failing tests proving unavailable, unstable, or evidence-empty property routes remain excluded.
- [ ] Add ready Korea district/building/transaction and Singapore area/project/HDB routes without mode-query duplicates.
- [ ] Add verified metadata and structured data that omit unavailable facts and scenario outputs.
- [ ] Create market briefs only from installed evidence with period, method, and source links.
- [ ] Run SEO route tests, sitemap inspection, full tests, type, lint, build, and a crawler smoke.
- [ ] Commit with `feat: publish evidence backed market routes`.

### Task 12: Review, Preview, Production, and post-release verification

**Files:**
- Verify: all changed files since the Task 1 baseline
- Update: release notes under `v2/docs/releases/`

**Interfaces:**
- Consumes: commits from Tasks 1–11.
- Produces: reviewed exact-SHA Preview, Production deployment, live verification report, and closed temporary boundaries.

- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` from `v2/` in a clean worktree.
- [ ] Run rent and Singapore client-boundary scans against the Production build.
- [ ] Request code review for correctness, secrets, rights, data joins, thin cohorts, accessibility, and performance; resolve every Critical and Important finding.
- [ ] Create an exact-SHA SignedPrice Preview and confirm no KoreaHomeGuide deployment was created.
- [ ] Verify Korea and Singapore journeys at 390, 720, and 1440 pixels with no horizontal overflow or unexpected console/5xx errors.
- [ ] Verify API keys are effective without reading or printing their values.
- [ ] Promote the reviewed SHA to Production.
- [ ] Re-run live Explore→Detail→Check→evidence→map→street-view, News, Community, canonical, hreflang, sitemap, and structured-data checks.
- [ ] Remove any temporary collection endpoint, extended duration, debug log, or fixture gate and rebuild if one remains.
- [ ] Commit release notes with `docs: record signedprice korea singapore release`.
