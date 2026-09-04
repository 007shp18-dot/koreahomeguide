# SignedPrice Sitewide Release Gate — 2026-09-04

## Verdict

**Code candidate: ready. Production rollout: conditional GO.**

### Pre-upload revalidation

The original implementation was rechecked before remote publication. Three new regression cases exposed incorrect infographic periods and upper-middle values used as medians for even-sized cohorts. These defects have been corrected in both languages:

- Seoul district and renewal charts now identify the public building summary (`public-kr-building-summary-2026-09-01`), covering January–July 2026, rather than the newer February–August raw rent release.
- Recalculation from the 294-record public building artifact gives Gangnam 5.375, Yongsan 5.475, Gangdong 4.8, Mapo 4.5 and Nowon 2.6 (KRW 100m). District sample sizes are 22, 5, 10, 17 and 41 respectively. Even-sized medians use both middle observations.
- Singapore charts retain the source period August 2021–August 2026. The median of 614 published CCR project medians is SGD 2,167 psf, not 2,168. RCR and OCR remain 1,716 and 1,462. The source snapshot digest is `e2bc92b0e75ffb7eaf17544e883a96e2986995f7db208f14b711cab8714a1e3c`.
- The illustrative rental-cost chart labels its inputs as illustrative instead of implying that the displayed example amounts are observed transactions.
- Fresh verification: 218 test files / 2,027 tests pass; the 12-test portfolio suite passes again after strict-index typing cleanup; typecheck, lint and the 890-page production build pass.

These checks validate committed source artifacts, not live database rows. The browser matrix, live Neon projection population/index checks, and fallback drill below remain release gates. The previous production deployment has database configuration but logged a Neon read timeout; the absence of `DATABASE_URL` described below applies only to this local workspace. No production success or database population is inferred from a successful schema migration or local fallback build.

### Remote preview and request-deadline repair

- Review PR: https://github.com/007shp18-dot/koreahomeguide/pull/135 (draft; do not merge until gates pass).
- Initial preview commit: `a0a5d7e34cdebd03eabdc6286a877c391810d2d9`; exact tree match with local chart-correction commit `e3358a243bc5ec3a9f3a81b7d1ddf4aba3714f0b`.
- Initial SignedPrice preview deployment `dpl_9av19NsCVm1r48pna1Q1ArmFhjsd` completed successfully. Its build explicitly reported missing `DATABASE_URL` and skipped migration. This preview cannot validate live Neon migrations or populated projections.
- Direct cloud-browser access reached the Vercel sign-in page, so no deployed visual pass is claimed. GitHub CI's initial verification job passed; the browser job was still running when checked.
- A separate reproducible defect was found in `postgres.server.ts`: an `AbortSignal.timeout(8_000)` was allocated once when the cached client was created, so later requests reused an expired signal. Public clients also reused one 750 ms signal across requests. Both factories now allocate a deadline when Neon assembles each HTTP request. Tagged queries, parameterized queries, and transactions retain their existing deadlines.
- Two regression cases exercise the real Neon client with only HTTP replaced and reproduce failure after an earlier signal expires. Both fail before the fix and pass after it. Fresh verification after the repair: 219 files / 2,029 tests, typecheck, lint and the 890-page build pass. This proves the client defect is repaired, not that all causes of production Neon timeouts are resolved.

The sitewide maintenance, decision-journey renewal, Newsroom, Policy Tracker, infographic system, 29-item reviewed portfolio, SEO, migration, performance, and privacy-safe analytics work is complete at implementation commit `a1010d74e3ec103d26938527dfd2b1150ff21ce8`.

Production rollout remains gated on two environment checks that this workspace cannot satisfy:

1. run the documented 1440 px, 1024 px, and 390 px browser matrix with a Chromium binary;
2. run the content projection migration and fallback drill against the deployment's configured Neon `DATABASE_URL`.

Do not enable AdSense or treat this record as production approval until both checks pass.

## Release identity

| Field | Value |
| --- | --- |
| Branch | `codex/editorial-growth-phase1` |
| Verified implementation commit | `a1010d74e3ec103d26938527dfd2b1150ff21ce8` |
| Task 11 rollback commit | `361caea08a3f49aaa0fb39e4058db20146326a68` |
| Whole-program pre-implementation checkpoint | `48e88dbb623f958628a4604f398c3b797d4201fc` |
| Verification date | 2026-09-04 UTC / 2026-09-05 KST |
| Environment | Linux 6.18.35 x86_64; Node 24.19.0; pnpm 11.19.0; Next.js 16.3.3 |
| Detailed plan | `docs/superpowers/plans/2026-09-04-signedprice-sitewide-coherence-newsroom-growth.md` |

The implementation lineage is:

| Commit | Release unit |
| --- | --- |
| `8ae66e1` | compatible public evidence projections |
| `aa331d5` | verified Seoul locations and media |
| `1b6d896` | indexed Singapore evidence routes |
| `d356487` | unified navigation, typography, and readability |
| `703b367` | Market → Explore → Detail → Check decision journey |
| `d77d749` | private news discovery versus reviewed publication |
| `6ad038b` | Policy Newsroom and lifecycle tracker |
| `5e6a4b3` | evidence-linked infographic templates |
| `361caea` | reviewed 29-item English/Chinese portfolio |
| `a1010d7` | SEO, migration, analytics, accessibility, and release gates |

## Automated verification

| Command | Result |
| --- | --- |
| `cd v2 && pnpm test` | PASS — 218 files, 2,024 tests |
| `cd v2 && pnpm typecheck` | PASS — all four workspace projects |
| `cd v2 && pnpm lint` | PASS — 0 errors, 0 warnings |
| `cd v2 && pnpm build` | PASS — production build, 890 static pages generated |
| `cd v2 && pnpm check:rent-client-boundary` | PASS |
| `cd v2 && pnpm check:singapore-client-boundary` | PASS |
| `cd v2 && pnpm check:korea-proximity-client-boundary` | PASS |
| `node apps/web/scripts/audit-editorial-portfolio.mjs` | PASS — 29 reviewed records; EN 21, zh-CN 8; 46 legacy routes classified |
| `npm run seo:validate-migration` | PASS — 67 rendered migrations |
| `node --test tests/signedprice-migration.test.cjs` | PASS — 7 tests |
| `pnpm vitest run apps/web/test/public-evidence-repository.test.ts apps/web/test/installed-snapshot-repository.test.ts apps/web/test/singapore-snapshot-repository.test.ts` | PASS — 28 fallback/repository tests |
| `pnpm playwright test tests/e2e/seo-foundation.spec.ts --project=desktop-chromium --workers=1` | PASS — 2 request-only sitemap and reciprocal-hreflang tests |
| `pnpm playwright test` | BLOCKED before browser launch — Chromium headless-shell executable is not installed in this environment |

The failed full Playwright launch did not reveal an application failure: it stopped while resolving `/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`. Synthetic Playwright proximity fixtures and trace output were moved out of the worktree and were not committed.

## Production-like HTTP timing

Protocol: committed production build served by `next start` on localhost, one process, readiness checked through `robots.txt`, then each route requested twice. These numbers verify application response behavior only; they are not CDN, mobile-network, or Core Web Vitals measurements.

| Route | First response | Warm response | Status |
| --- | ---: | ---: | ---: |
| `/sg/singapore/explore/` | 14.807 ms | 2.870 ms | 200 |
| `/news/` | 74.016 ms | 11.432 ms | 200 |
| `/guides/rent-an-apartment-in-korea/` | 5.374 ms | 1.833 ms | 200 |
| `/news/policy/korea-rental-deposit-protection-status/` | 4.351 ms | 2.133 ms | 200 |
| `/zh-cn/news/` | 3.769 ms | 1.594 ms | 200 |

## Browser route matrix

The routes below are covered by route/unit contracts and the production build, but viewport-level visual sign-off is pending because the browser executable is unavailable.

| Surface | Routes to inspect at 1440 / 1024 / 390 px | Required observations |
| --- | --- | --- |
| Global | `/`, `/markets/`, `/prices/` | header consistency, three-market framing, minimum 12 px text and 44 px controls |
| Seoul | `/kr/seoul/`, `/kr/seoul/explore/`, `/kr/seoul/explore/dobong-gu/dobong-gu-jljtx9/`, `/kr/seoul/check/` | map/list/detail selection, state restoration, verified media fallback, loading/empty/error states |
| Singapore | `/sg/`, `/sg/singapore/explore/`, `/sg/singapore/explore/ccr/marina-one-residences/`, `/sg/singapore/check/` | segment/project evidence, instant loading state, distribution/source visibility |
| English editorial | `/news/`, one Policy Update, one Data Story, one Guide | hierarchy, infographic table, source and review visibility, related Explore/Check action |
| Chinese editorial | `/zh-cn/news/`, `/zh-cn/news/seoul-district-price-distribution-zh/`, `/zh-cn/guides/rent-in-korea-zh/` | independent metadata, readable wrapping, source and related-action visibility |

For every route, record clipping, layout shift, interaction delay, keyboard focus, source visibility, and stale/empty/error handling. Any material failure returns the release to NO-GO.

## Database and fallback gate

`DATABASE_URL` is not configured in this workspace. The build therefore correctly reported `persistent-content migration skipped`; no claim is made that the live Neon migration ran here.

The checked-in fallback path did pass its repository tests. Installed snapshots cover:

| Market / dataset | Evidence period | Generated | Records |
| --- | --- | --- | ---: |
| Seoul building registry | 2026-02 through 2026-08 | 2026-09-02 | 48,999 |
| Seoul rent | 2026-02 through 2026-08 | 2026-09-02 | 49,129 |
| Seoul sale | 2026-02 through 2026-08 | 2026-09-02 | 22,850 |
| Seoul conversion pairs | 2026-02 through 2026-08 | 2026-09-02 | 1,031,799 |
| Singapore private sale | 2021-08 through 2026-08 | 2026-09-02 | 133,942 |
| Singapore HDB | 2017-01 through 2026-09 | 2026-09-02 | 462,792 |

The public Seoul building summary has period `2026-01/2026-07`, generated `2026-09-01T01:15:56.720Z`, SHA-256 `634f0cc1c07fb82fb78580277d428cde988d20b57a6730e68d7eb2fae6b85574`.

Before production rollout, run `pnpm db:migrate` with the deployment connection, confirm the public projection row counts and indexes, deliberately make the DB unavailable, and verify that the last valid public snapshot remains visible. If a DB failure removes previously valid public evidence, stop the release.

## Editorial, SEO, and analytics gates

- Portfolio: exactly 29 reviewed public records — 21 English and 8 Simplified Chinese; Policy 8, Market Brief 5, Data Story 6, Guide 10.
- Review boundary: portfolio records and policy sources were last reviewed/checked on 2026-09-04.
- Infographics: six Data Stories have evidence-release IDs, units, periods, sample labels, source labels, and accessible tables.
- SEO: each public record has its own canonical; hreflang is reciprocal only for independently reviewed translation groups; Article JSON-LD uses the visible publication/update/reviewer/source data; legacy Insights and local Guide routes are excluded from the sitemap.
- News safety: external discovery remains internal and cannot generate a public canonical. Automatic article publication remains disabled.
- Analytics: only `article_complete`, `article_to_explore`, `article_to_check`, `policy_source_open`, and `infographic_data_open` are emitted. The payload allowlist is content ID, content type, locale, market, and destination family; addresses, prices, contract amounts, searches, and identities are discarded.

## Known limitations and release stops

- Chromium viewport inspection is pending. This is a deployment blocker, not a passed check.
- Live Neon migration, index inspection, timeout recovery, and fallback drill are pending. This is a deployment blocker.
- Local timings do not replace Vercel preview Web Vitals and mobile-network checks.
- AdSense is not enabled or approved by this gate. Consent behavior, preview Core Web Vitals, and policy review must pass first.
- Dubai data and brokerage flows remain intentionally outside this release.
- A source/date discrepancy, infographic/evidence mismatch, loss of last valid evidence during DB failure, or material mobile clipping changes the verdict to NO-GO.

## Rollback

For a Task 11-only rollback, return to `361caea08a3f49aaa0fb39e4058db20146326a68`. For a complete sitewide-program rollback, use `48e88dbb623f958628a4604f398c3b797d4201fc` as the checkpoint. Preserve database migrations and published evidence until their compatibility and recovery impact have been reviewed; do not erase them as part of a code rollback.
