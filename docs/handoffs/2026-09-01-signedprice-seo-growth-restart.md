# SignedPrice SEO Growth Restart Handoff

## Restart baseline

- Repository: `007shp18-dot/koreahomeguide`
- Current base: `3f4abc0` (`Ship SignedPrice C evidence-editorial UI (#36)`)
- Working branch: `codex/signedprice-seo-growth-v2`
- Baseline verification: 124 Vitest files, 1,272 tests passed; Next.js Production build passed with 439 generated pages.
- PR #35 is merged, but it is not the latest baseline. PR #36 is the current source of truth.
- The earlier conversation referenced commits `70127e7` and `569e89f` on `codex/signedprice-seo-growth`. Those objects and that branch are not present in the remote repository, and the named design file is not present in the connected file archive. This restart therefore reconstructs the approved scope against current `main` instead of pretending those commits can be resumed.

## Product decisions that remain authoritative

1. SignedPrice is a global property-decision platform, with Seoul as the first complete evidence market.
2. Seoul must serve both Korean and English search intent.
3. Search growth comes from technical SEO, verified data pages, and useful editorial content together.
4. Search pages must expose real source, period, sample, calculation, and publication-boundary evidence. Thin mass-generated pages are not allowed.
5. Building pages remain `noindex, follow` until they have enough unique, verified evidence to justify indexing.
6. Singapore is included in the growth program, but its first indexable pages use rights-cleared aggregate public data. Project, address, and individual-transaction pages stay `noindex` until dataset-specific display and indexing rights are confirmed.
7. Singapore credentials remain server-only. Dubai remains blocked from indexing and evidence claims.
8. KoreaHomeGuide migration redirects are cohort-gated. A source route moves only after destination parity, metadata, analytics, and release checks pass.

## Current Production truth

The current site already has more SEO surface than the old conversation summary stated:

- 25 Seoul district routes and 55 district/property-type routes are in the sitemap.
- English Explore, Rankings, News, Guide, and Rent Check are indexable.
- Korean Seoul home, Explore, and Rankings are indexable.
- Singapore routes exist but correctly remain `noindex, follow` while the evidence/rights gate is closed.
- `robots.txt`, `sitemap.xml`, `ads.txt`, canonical metadata, Breadcrumb JSON-LD, Privacy, and Contact exist.

## Confirmed technical defects on Production

1. `/kr/seoul/` is included in the sitemap but returns a 307 redirect to `/kr/seoul/explore/`.
2. Korean home declares its English alternate as `/kr/seoul/`, so the alternate currently redirects instead of serving a reciprocal canonical page.
3. `/kr/check/seoul/` is a second indexable Seoul check/evidence URL while `/kr/seoul/tools/rent-check/` is the working canonical Rent Check.
4. `/kr/seoul/check/` and `/ko/kr/seoul/check/` can redirect to the English Rent Check when the conversion artifact is unavailable.
5. Korean pages render under `<html lang="en">`; only an inner wrapper declares `lang="ko"`.
6. `SiteHeader` ignores the localized links supplied by `KOREAN_SITE_HEADER`, so Korean pages visibly render English product navigation.
7. The header displays `Seoul · EN` as a non-interactive label; there is no usable language switch.
8. Only the Korean home, Explore, Rankings, and conditional two-offer Check exist. Korean News, Guide, district, property-type, and single-offer Rent Check are not complete.
9. Shared indexable metadata does not yet provide a complete Open Graph/Twitter image contract.
10. Sitemap membership is readiness-aware, but it does not yet assert that every included URL is a terminal 200 canonical rather than a redirect.

## Release split

### Release 1 — SEO foundation

- remove redirects and duplicate intent URLs from the indexable route registry;
- restore `/kr/seoul/` as a real English market hub;
- make localized navigation and a real language switch work;
- make Korean document-language signaling correct without sacrificing static rendering;
- add complete canonical, reciprocal hreflang, Open Graph, and sitemap invariants;
- retain all evidence, rights, privacy, and migration gates.

### Release 2 — Seoul search growth

- finish Korean Rent Check, News, Guide, district, and eligible property-type pages;
- target Korean and English query clusters around Seoul rent, jeonse/wolse comparison, contract checks, districts, and housing types;
- add data-backed FAQs, Dataset/Article schema, and contextual internal links;
- index only routes with unique evidence and a passing publication floor.

### Release 3 — Singapore aggregate search growth

- ingest rights-cleared aggregate price-index and market-segment data;
- publish the Singapore hub, CCR/RCR/OCR comparison, sale-type comparison, price-index page, and guide only after rights/readiness checks pass;
- display source, access date, licence, period, and aggregation method;
- keep projects, addresses, raw transactions, and browser credentials outside the indexable release.

## Immediate work

Execute `docs/superpowers/plans/2026-09-01-signedprice-seo-foundation.md` on the working branch. Do not start Seoul content expansion or Singapore indexation in the same PR.

## Release 1 implementation status

The SEO foundation is implemented locally on `codex/signedprice-seo-growth-v2` in these reviewable slices:

- `47d6ccc` — make Seoul SEO routes terminal;
- `83007a9` — connect English and Korean SEO navigation;
- `0ec5e49` — emit the correct Korean root document language;
- `66b6d5b` — complete multilingual Open Graph and Twitter metadata;
- `21a57da` — gate sitemap terminality and reciprocal hreflang.

The branch now makes `/kr/seoul/` a terminal self-canonical page, permanently redirects `/kr/check/seoul/` to the working Rent Check, emits Korean navigation and crawlable language switches, serves Korean routes under `<html lang="ko">`, and provides stable `/og/en/` and `/og/ko/` PNG cards. Singapore and building detail indexation remain closed.

## Fresh verification evidence

- `pnpm lint`: passed.
- `pnpm typecheck`: passed across all four workspace projects.
- `pnpm test`: 124 files and 1,271 tests passed.
- `pnpm build`: passed with 441 generated routes/pages, including the two stable social-image endpoints.
- Rent Check client-boundary scan: passed.
- Singapore client-boundary scan: passed.
- Targeted Production-server SEO E2E: route terminality, root document languages, social head/image responses, every sitemap URL, and reciprocal hreflang all passed.
- Full 323-test Playwright visual suite: not completed in this workspace because the required Chromium executable is absent. `playwright install chromium` was attempted, but the external Playwright CDN returned 502 and then timed out. This is an environment dependency, not a suppressed test result; CI or a workspace with the pinned Chromium build must run the full visual suite before promotion.

## Next authorized scope

Release 2 remains Korean content completion: single-offer Rent Check, News, Guide, district, and eligible property-type pages with unique verified evidence. Release 3 remains rights-cleared Singapore aggregate indexation. Neither scope is included in the Release 1 branch.
