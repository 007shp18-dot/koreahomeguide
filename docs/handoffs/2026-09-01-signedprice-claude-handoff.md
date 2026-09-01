# SignedPrice implementation handoff — 2026-09-01

## 1. Executive status

SignedPrice is a standalone product and domain. It is not a KoreaHomeGuide sub-site and must have its own deployment, Search Console property, sitemap lifecycle, AdSense site approval, analytics, and operating policies.

The integrated redesign and product work is implemented on a feature branch but is **not pushed, merged, or deployed**. Production therefore still shows the previous site.

- Repository: `koreahomeguide`
- Worktree: `.worktrees/signedprice-entry-building-explorer`
- Branch: `codex/signedprice-home-market-tabs`
- Base: `origin/main` at `a93738c25e236fcaee2587d4708e967ff59f3e40`
- Latest fully verified implementation SHA before this handoff update: `97fd308f3cba68c83b93f8450b634786ead01f45`
- Commits ahead of base after this handoff commit: 18
- Diff from base before this handoff update: 118 files, 7,947 insertions, 1,057 deletions

## 2. Product direction that is now binding

1. SignedPrice is a global property decision product, not a Seoul-only calculator.
2. The first page has permanent `Seoul / Singapore / Dubai` tabs.
3. Every city tab uses the same six product slots:
   - Check
   - Explore
   - Rankings
   - News
   - Guide
   - Community
4. Seoul exposes verified live evidence and functions.
5. Singapore stays behind its readiness/data-rights gate until the verified artifact is ready.
6. Dubai stays blocked until transaction display rights are established.
7. Missing data must never be replaced with invented buildings, coordinates, counts, medians, floors, update dates, or availability claims.
8. New, Renewal, News, and Community are product concepts that remain visible; incomplete infrastructure gets an explicit unavailable state instead of disappearing.
9. Community starts as structured verification, not a free-form board:
   - actual price higher / similar / lower
   - reason selection
   - district/building questions
   - privacy publication threshold of five
   - official evidence remains visually and semantically separate
10. KoreaHomeGuide remains an independent product and domain. Do not redirect or absorb it without a separate migration plan.

## 3. Design system implemented

The supplied standalone logo and UI references were translated into a shared design system.

- Brand mark: exact crossed-line geometry, line widths `5.5 / 10 / 5.5`
- Wordmark: Archivo weights matched to the supplied reference
- Palette: warm paper, deep green, muted evidence surfaces, accessible focus accent
- Site-wide semantic tokens replace scattered page-specific cobalt styling
- Large headings were reduced and given more usable line-height/measure
- Tables, charts, source panels, News, Guide, Community, Singapore, and building pages consume the shared palette
- Literal color scan for TSX is clean

Key files:

- `v2/apps/web/components/brand-mark.tsx`
- `v2/apps/web/app/globals.css`
- `v2/apps/web/test/brand-mark.test.tsx`
- `v2/apps/web/test/design-tokens.test.ts`

## 4. Homepage and market entry

Implemented:

- permanent three-city tab switcher
- keyboard-accessible tab interaction
- identical six-slot product grid per city
- Seoul live counts and period come from repositories
- Singapore and Dubai retain explicit readiness/rights gates
- no dead anchors for unavailable functions
- global homepage is now the visible product entry rather than a generic introduction page

Primary files:

- `v2/apps/web/components/home-market-browser.tsx`
- `v2/apps/web/lib/site-copy.ts`
- `v2/apps/web/app/page.tsx`

## 5. Contract Check

Canonical route: `/kr/seoul/check/`

Implemented:

- two-offer deposit/monthly-rent comparison
- recalculates immediately; no submit button
- verified conversion curve only
- measured-range held states; no extrapolation
- strict but user-friendly won parsing (`₩`, `원`, `won` decorations supported only in valid positions)
- apartment/officetel selection
- four-row calculation trace
- explicit refundable-principal boundary
- `/kr/` routes to the actual market entry rather than a paused legacy calculator

Important files:

- `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- `v2/apps/web/components/contract-check/conversion-curve.tsx`
- `v2/apps/web/lib/contract-check/client-state.ts`
- `v2/apps/web/lib/contract-check/route-model.server.ts`

## 6. District graphs and interpretation

Implemented:

- shared box-plot component on district, building, and spread-ranking views
- min/max moved to axis ends
- P25/median/P75 separated to reduce label collisions
- median visually prioritized
- evidence sample/definitions moved outside the plot
- spread verdicts derived from literal thresholds
- three-month change fails closed when prior/latest sample counts were not retained
- incomplete periods display hatching/period limitation rather than a completed-window claim
- raw building change output was removed where evidence cannot support it

Key files:

- `v2/apps/web/components/public-market/box-plot.tsx`
- `v2/apps/web/lib/public-market/evidence-interpretation.ts`
- `v2/apps/web/components/public-market/evidence-period-strip.tsx`

## 7. Building Explorer and detail evidence

Implemented:

- installed verified building artifact remains 294 real records
- district selection filters the real building rail
- Naver building markers and rail selection share the same selected-building reducer
- marker selection and rail selection open the same evidence panel and canonical building detail link
- map lifecycle is stable across district/prop updates
- stale geocoder callbacks are ignored
- marker/listener cleanup is explicit
- nullable coordinates are geocoded using Korean district/neighborhood/building text; geocode failure leaves the rail working and reports the absent marker
- floor is explicit nullable evidence with `not retained` reason
- floor coefficient requires six valid same-building/same-area pairs
- current artifact publishes no coefficient because it contains no official floor-pair evidence
- the single `45–55㎡` band renders the required title/reason/next-action empty state rather than a fake one-row table

Primary files:

- `v2/apps/web/components/maps/naver-district-map.tsx`
- `v2/apps/web/components/public-market/area-explorer.tsx`
- `v2/apps/web/lib/public-market/area-explorer-state.ts`
- `v2/apps/web/lib/public-market/building-route-model.server.ts`
- `v2/apps/web/lib/public-market/building-summary-schema.ts`

## 8. New / Renewal / All and coverage

Implemented:

- default cohort is New
- the selector always keeps New, Renewal, and All visible
- invariant three-row comparison shows all three rows on every selected cohort
- each row shows its own retained sample and median or an explicit unpublished/snapshot-unavailable state
- v1 split absence never substitutes All values into New or Renewal
- “Combined All is lower than New” appears only when actual published medians prove it
- Coverage panel is repository-derived:
  - published districts / 25 retained districts
  - published buildings / retained verified building records
  - eligible city contracts
  - retained below-publication reasons
- missing building artifact is `unavailable`, never `0 / 0`
- monthly Next Update is calculated only from a configured UTC schedule and must be strictly after the reference instant
- absent/invalid schedule produces no promise

Schedule environment format:

```json
{"cadence":"monthly","dayOfMonth":1,"hourUtc":8,"minuteUtc":30}
```

Environment key: `SIGNEDPRICE_PUBLIC_UPDATE_SCHEDULE`

## 9. Korean routes and international SEO

Completed route shells:

- `/ko/kr/seoul/`
- `/ko/kr/seoul/check/`
- `/ko/kr/seoul/explore/`
- `/ko/kr/seoul/rankings/`

Implemented:

- Korean-first route headings, descriptions, navigation, and overview values
- self-canonical Korean URLs
- reciprocal English/Korean `hreflang`
- English `x-default`
- Korean sitemap entries only for completed route modules; evidence-dependent Explore/Rankings entries appear only when area evidence is ready
- shared Contract Check, Explore, district summary, Rankings, period strip, box plot, map status, source boundary, evidence disclosure, and section tabs now receive Korean locale copy without forking calculations or data models
- Korean month, sample, source, cohort, empty-state, graph, and map labels are covered by dedicated component tests
- won remains an integer internally and is formatted only at presentation time:
  - `300,000,000` → `3.0억`
  - `325,000,000` → `3억 2,500만원`
- prohibited predictive/appraisal Korean copy scan has only the two intentional negative legal-boundary uses of `감정평가`

Known localization boundary:

- Korean dynamic district/building detail routes do not yet exist. Korean Explore therefore keeps verified English detail destinations instead of emitting unimplemented `/ko/...` URLs. Add reciprocal routes before advertising Korean detail hreflang.

## 10. Search Console and AdSense

SignedPrice needs its own setup because it is a separate domain/product.

### Code prepared

- `/robots.txt` allows crawling and declares the standalone sitemap and host
- `/sitemap.xml` contains approved SignedPrice URLs only
- English/Korean reciprocal metadata is present on paired routes
- `/ads.txt` publishes the registered SignedPrice publisher record
- `/privacy/` and `/contact/` publish a real operator/contact only when both verified environment values are present; otherwise both are honest `noindex` states and stay out of the sitemap
- every shared footer exposes Privacy and Contact routes
- the AdSense client is disabled unless the explicit enable flag and verified operator profile are both present
- even when enabled, the advertising script URL is withheld until an affirmative browser consent choice; rejection keeps property evidence available and the choice remains reopenable
- no KoreaHomeGuide canonical or AdSense identity is reused

### Required before AdSense review

Set these Production environment variables with the user's real SignedPrice values:

```text
SIGNEDPRICE_OPERATOR_NAME=<verified legal/operator name>
SIGNEDPRICE_PRIVACY_CONTACT=<verified privacy email>
```

Keep `SIGNEDPRICE_ADSENSE_ENABLED` absent or `false` through site review and consent-platform review. Set it to `true` only when advertising is authorized to load. The built-in choice UI is a technical pre-load boundary; it must not be described as a Google-certified CMP without separate verification.

The public publisher identifier is fixed in code so a stale deployment variable cannot replace it. `/ads.txt` returns:

```text
google.com, pub-8103101324753433, DIRECT, f08c47fec0942fa0
```

Do not request AdSense review until that exact record is live and crawlable.

### External setup order

1. Deploy the exact reviewed SignedPrice SHA.
2. Confirm `https://www.signedprice.com/robots.txt` is 200.
3. Confirm `https://www.signedprice.com/sitemap.xml` is 200 and contains only canonical SignedPrice URLs.
4. Add a Search Console **Domain property** for `signedprice.com` and verify it through DNS.
5. Submit `https://www.signedprice.com/sitemap.xml`.
6. Inspect/request indexing for `/`, `/kr/seoul/`, `/kr/seoul/tools/rent-check/`, `/kr/seoul/explore/`, one district page, and `/ko/kr/seoul/`.
7. Validate canonical and reciprocal hreflang in rendered HTML.
8. Add `signedprice.com` as a **new site** in the existing AdSense account.
9. Confirm `/ads.txt` is 200 with the exact registered record before requesting review.
10. Add the AdSense verification/meta or Auto Ads code supplied for this exact account if Google requests that verification method.
11. Set the verified operator/privacy variables, confirm `/privacy/` and `/contact/` are indexable, and complete any required certified CMP configuration before monetization.
12. Set `SIGNEDPRICE_ADSENSE_ENABLED=true` only after the preceding approval and consent steps are complete.

Official references:

- Search Console properties: <https://support.google.com/webmasters/answer/34592?hl=en>
- Sitemap submission: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- AdSense new-site review: <https://support.google.com/adsense/answer/12169212?hl=en>
- Ads.txt: <https://support.google.com/adsense/answer/12171612?hl=en-GB>

## 11. Runtime environment inventory

Relevant application variables currently referenced:

- `DATA_GO_KR_SERVICE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `NAVER_MAP_CLIENT_ID`
- `SIGNEDPRICE_ADSENSE_ENABLED` — explicit advertising-script activation gate; defaults disabled
- `SIGNEDPRICE_OPERATOR_NAME` — verified operator identity for Privacy/Contact
- `SIGNEDPRICE_PRIVACY_CONTACT` — verified privacy email for Privacy/Contact
- `SIGNEDPRICE_COMMUNITY_IDENTITY_SECRET`
- `SIGNEDPRICE_COMMUNITY_NETWORK_SECRET`
- `SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT`
- `SIGNEDPRICE_CONVERSION_CURVE_PERIOD`
- `SIGNEDPRICE_CONVERSION_CURVE_SHA256`
- `SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT`
- `SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT`
- `SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT`
- `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD`
- `SIGNEDPRICE_PUBLIC_UPDATE_SCHEDULE`
- `SIGNEDPRICE_SINGAPORE_SNAPSHOT_ARTIFACT`
- `SIGNEDPRICE_SINGAPORE_SNAPSHOT_PERIOD`
- `SIGNEDPRICE_SINGAPORE_SNAPSHOT_SHA256`

Never log or paste secret values into issues, PR bodies, or handoff chat.

## 12. Verification evidence

Latest verified tree before this handoff document:

- Vitest: 113 files, 1,204 tests passed
- TypeScript: all four workspace packages passed
- ESLint: passed with zero errors
- Next production build: passed; 89 pages generated
- `git diff --check`: clean
- Rent Check client-boundary scan: passed
- Singapore client-boundary scan: passed
- Korean prohibited-copy scan: only two intentional negative `감정평가` disclaimers; no predictive, appraisal-value, superiority, or accuracy claim
- TSX literal-color scan: zero hits

Browser limitation:

- `next dev` is blocked in this runtime by `uv_interface_addresses`.
- `next start -H 127.0.0.1 -p 3100` starts successfully.
- The bundled `agent-browser` CLI is absent.
- The cloud browser cannot reach container localhost (`ERR_BLOCKED_BY_CLIENT`).
- Local Playwright Chromium remains absent.
- Therefore desktop/mobile browser screenshots and interactive Preview verification remain pending. Do not claim browser QA is complete.

## 13. Release sequence for the next agent

1. Re-read:
   - `docs/superpowers/specs/2026-09-01-signedprice-integrated-refresh-design.md`
   - `docs/superpowers/plans/2026-09-01-signedprice-integrated-refresh.md`
   - this handoff
2. Verify the worktree is clean and HEAD is the expected SHA.
3. Run from `v2/`:

```bash
pnpm vitest run
pnpm typecheck
pnpm lint
pnpm build
```

4. In a browser-equipped environment, verify at desktop and mobile widths:
   - global homepage and all three city tabs
   - all six product slots
   - Contract Check live input and four-row trace
   - Explore district switch
   - building marker/rail parity and canonical detail CTA
   - box-plot collision behavior
   - coverage and New/Renewal/All comparison
   - unavailable building/source states
   - all four Korean routes and reciprocal hreflang
   - `/privacy/`, `/contact/`, consent rejection/acceptance/reopen behavior
   - `/robots.txt`, `/sitemap.xml`, and configured `/ads.txt`
5. Fix only evidenced failures and rerun the full gate.
6. Ask the user before the external integration step if no explicit approval is active.
7. Push `codex/signedprice-home-market-tabs`, open a PR against `main`, verify Preview, merge, and verify Production from the exact reviewed SHA.
8. Complete Search Console and AdSense steps only after Production is verified and the user provides/authorizes the real account identifiers.

## 14. Roadmap after this release

### P0 — release this branch

- browser QA
- Preview QA
- merge/deploy
- verify homepage visibility so the user no longer lands on the old generic site
- Search Console domain property and sitemap
- install verified operator/privacy values and confirm conditional indexing
- AdSense publisher ID, ads.txt 200, certified-CMP determination/configuration, consent QA, new-site review

### P1 — Korean detail routes, Community persistence, and content

- add Korean district/building detail routes before extending detail hreflang
- connect Community DB, storage, abuse controls, reporting, and moderation workflow
- preserve the five-submission privacy threshold and separation from official evidence
- expand News and weekly data briefs with strict source/data validation

### P2 — Singapore readiness

- validate the supplied URA/API rights and permitted display fields
- produce a signed Singapore artifact
- open Check/Explore/Rankings only after readiness gates pass
- keep unavailable slots visible before then

### P3 — Dubai and global total-solution expansion

- establish official transaction rights and source classification
- add verified artifacts and local comparison logic
- expand from rent evidence toward buy, ownership cost, and investment inputs without mixing incompatible source classes
- retain one global city-tab/product-slot information architecture

## 15. Non-negotiable guardrails

- no fake buildings, coordinates, counts, floors, medians, schedules, or availability
- no appraisal, valuation, prediction, guaranteed accuracy, or legal-safety claims
- no monetary output under the fixed publication minimum
- no building coefficient below six valid pairs
- no reconstructed prior/latest change claim without retained counts
- no Singapore/Dubai public release before rights/readiness gates
- no KoreaHomeGuide redirect/migration as part of this SignedPrice branch
- no AdSense review with placeholder publisher ID or unavailable ads.txt
- no Production claim until the exact deployed SHA and live routes are verified
