# SignedPrice Integrated Refresh Design

## Authority and scope

This design combines the user's latest homepage, brand, chart, building Explorer, and site-wide color requests with `signedprice-build-order-v5_1.md`. The latest direct requests intentionally override two older constraints: the homepage must always show Seoul, Singapore, and Dubai tabs, and the locked cobalt/gray palette must be replaced with the supplied SignedPrice identity. All data, calculation, publication-minimum, rights, and claim-safety rules from v5 remain binding.

The delivery is split into independently verifiable releases, but work continues in one branch: brand foundation; homepage market tabs; Contract Check; district interpretation; building detail; coverage and renewal defaults; Korean routes; full release verification.

## Non-negotiable platform constraints

- Next.js 16.3.3, React 19.2.8, App Router, TypeScript 5.9.3, pnpm 11.19.0.
- No new dependencies. Charts use HTML and inline SVG only.
- Internal links end in `/` in source.
- No estimates, synthetic buildings, substituted parent averages, or invented rights states.
- Money remains integer KRW internally. Formatting happens at the display boundary.
- Values with fewer than five contracts remain unpublished.
- Every empty state has a title, reason, and next action.
- No model-accuracy claims or predictive copy.

## Brand and visual system

The supplied identity defines the official mark: an ink line from `M4 9` to `L28 23`, a paper separation line from `M4 23` to `L28 9`, and an orange line on the same second path. Line caps are square. The wordmark uses Archivo with `signed` at weight 900 and `price` at weight 500.

The site uses a warm-paper and deep-green system derived from the supplied Logo, Explore Map, and Detail View references. The brand orange remains `#e05024` inside the decorative mark. Interactive orange is darkened to an AA-safe burnt orange so normal text remains readable on every light surface.

| Token | Value | Use |
|---|---:|---|
| `--canvas` | `#f4f2ec` | page ground |
| `--surface` | `#eae5da` | secondary panels |
| `--surface-strong` | `#fffdf8` | raised evidence surfaces |
| `--ink` | `#15201f` | primary text and structural rules |
| `--petrol` | `#1c4048` | dark evidence panels |
| `--muted` | `#5f625b` | normal secondary text on light surfaces |
| `--divider` | `#98978d` | non-text separators |
| `--line` | `#dbd5c6` | row separators |
| `--brand-orange` | `#e05024` | logo mark only |
| `--accent` | `#b73512` | accessible links, controls, and selected states |
| `--accent-soft` | `#ffe0d4` | emphasis on dark surfaces |
| `--focus-ring` | `#b73512` | two-pixel focus ring |

Geometry stays square: two-pixel structural rules, one-pixel row rules, no shadow, zero radius. Dark panels use paper text; muted or accent text is not placed directly on ink or petrol.

## Homepage information architecture

The root page keeps one compact `h1`, then shows a permanent city tablist: Seoul, Singapore, Dubai. Seoul is selected initially. Each panel uses the same six product slots: Check, Explore, Rankings, News, Guide, Community.

- Seoul displays verified all/new/renewal/unknown counts and the completed period. Five live product links are active. Community is visible but storage remains honestly paused.
- Singapore is always visible. When the verified URA snapshot and display-rights gate pass, Explore becomes a link and its real transaction/project/period labels appear. Other unreleased slots stay marked Preparing.
- Dubai is always visible but has no public data or routes before written DLD/RERA rights clearance. Its panel explains the block and marks every slot Rights review.
- A disabled slot is never rendered as an anchor. No dead market route is introduced.

The official mark and wordmark replace text-only SignedPrice branding in shared and product-specific headers.

## Contract Check

The existing `@signedprice/market-core` curve engine and verified conversion repository remain the calculation source. `/kr/seoul/check/` becomes the canonical Check route; `/kr/` leads to it without a paused or obsolete calculator surface.

Both offers recalculate immediately. The result uses the lower deposit as the reference deposit, reads the annual rate at each contract's filed deposit, excludes deposit principal from monthly cost, holds the nearest anchor outside the observed range, and labels that held state. The page renders the conversion curve, offer markers at filed deposits, four auditable calculation rows, the result rail, and the eight-line evidence boundary. There is no submit button.

## District interpretation and charts

The existing collision-safe HTML-labelled box plot remains the single shared distribution component. It keeps Min/Max at the endpoints, assigns P25/Median/P75 to collision-safe lanes, and emphasizes only Median and the user's quote. Sample count and explanation stay outside the plot.

District models add a spread verdict from `(p75 - p25) / median`: narrow below `0.28`, moderate below `0.55`, otherwise wide. Three-month change always carries the prior and latest sample counts. Change is marked shaky when its absolute value is at least ten percent, either sample is below thirty, or sample size moves by at least twenty-five percent. Incomplete months are hatched, excluded from comparisons, and accompanied by Complete / Filing in progress legend items.

## Building Explorer and detail

The installed 294-building artifact, district-to-building rail, Naver building-marker layer, geocoding fallback, selected-building panel, and full-detail routes are reused. Selecting a district changes the map from district markers to its building set. Selecting a marker or rail item opens the same evidence panel; the panel links to the canonical detail URL.

Exact coordinates are never invented. Existing coordinates are used when present; otherwise Naver geocoding uses the Korean district, neighborhood, and building name. Failure leaves the rail usable and states why a marker is absent.

The building schema is extended to retain a nullable floor with an explicit missing reason. Recent records add Floor. Floor-adjustment coefficients are published only for same-building, same-area comparisons with at least six pairs; otherwise the coefficient is absent and the UI says Contract evidence insufficient. When only the fixed `45–55㎡` band exists, the page shows the required title/reason/next-action empty state instead of a one-row table. No building-facts API rows appear until official data is actually connected.

## Coverage, defaults, and update promise

Explore adds calculated coverage counts for districts, buildings, eligible contracts, and unpublished reasons. Source boundaries add a calculated next-update value only when a real monthly schedule is configured. New is the default contract cohort. All, New, and Renewal remain visible together in a comparison block on every cohort tab.

## Korean release

English URLs remain canonical for the current release. Korean content will use `/ko/kr/seoul/...` pages paired with reciprocal `hreflang` links because a language-specific URL is required for a real alternate. Korean formatting converts won to 억/만원 only in formatting helpers. Translation does not change data or calculation semantics.

## Verification and release

Every behavior is introduced through a failing test. Required gates are targeted Vitest, full Vitest, typecheck, lint, production build, client-boundary scans, desktop/mobile Playwright, color-literal scan, prohibited-copy scan, Preview browser review, and Production browser/runtime verification. Production is promoted only from the exact reviewed SHA.
