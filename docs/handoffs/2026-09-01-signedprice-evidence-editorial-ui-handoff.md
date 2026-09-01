# SignedPrice Evidence Editorial UI handoff — 2026-09-01

## Release status

- Direction: **C — Evidence Editorial**
- Branch: `codex/signedprice-building-detail-preview`
- Verified implementation SHA: `4895509b139ae0793a979658cc1a22679b494989`
- Base: `origin/main` at `4f7c2ef3678c61b6f259f5c95eeed37f53f08ae5`
- Scope from base: 19 commits; 80 files changed; 4,944 insertions; 1,001 deletions
- Deployment policy: Preview only. Production has not been promoted or modified.

## Product and design result

The public product now follows one evidence-led editorial system across the homepage and detail routes:

- warm paper, deep green, restrained orange and square two-pixel structure;
- no rounded cards or decorative drop shadows;
- compact global header with Check, Explore, Briefs and Guide;
- result-first Check flows and map-first Explore;
- focused Rankings views instead of simultaneous dense metrics;
- building identity, decision and evidence in that order;
- Market Briefs presented as an approval-led editorial ledger;
- real source, period, sample and publication limits retained at decision points;
- no invented Singapore or Dubai evidence and no substitute prices.

## Route matrix

| Surface | Route | Delivered state |
|---|---|---|
| Global entry | `/` | Seoul, Singapore and Dubai market tabs; Rent, Buy and Invest intent choices; real Explore search |
| Contract comparison | `/kr/seoul/check/` | Inputs → verdict → evidence |
| District/building search | `/kr/seoul/explore/` | Map-first workspace, server-owned `q` search state, district and building evidence |
| Rankings | `/kr/seoul/rankings/` | Median, change, spread and sample as focused accessible views |
| District detail | `/kr/seoul/explore/[district]/` | Summary → distribution → cohorts → buildings → source |
| Building detail | `/kr/seoul/explore/[district]/[buildingId]/` | Identity → decision → evidence; licensed photo or evidence-safe fallback |
| Same Cash | `/kr/seoul/same-cash/` | Result-first comparison with calculation after verdict |
| Rent Check | `/kr/seoul/tools/rent-check/` | Result-first market reference with legal boundary |
| Market Briefs | `/kr/seoul/news/` and detail | Lead record plus editorial ledger; human approval required before publication |
| Guide | `/kr/seoul/guide/` and detail | Decision-stage index and focused reading pages |
| Singapore | `/sg/`, `/sg/singapore/explore/` and detail | Same shell, only verified URA evidence exposed |
| Trust/legal | `/trust/`, `/privacy/`, `/contact/` | Compact evidence/operator introductions and honest readiness gates |

## Verification evidence

Fresh checks run from `v2` after the final implementation changes:

- `pnpm test` — 124 files, **1,270 tests passed**
- `pnpm typecheck` — all four workspace projects passed
- `pnpm lint` — passed
- `pnpm build` — passed; 439 static pages generated and all dynamic routes compiled
- `pnpm check:rent-client-boundary` — passed against the fresh build
- `pnpm check:singapore-client-boundary` — passed against the fresh build
- geometry scan — only `none` or structural `inset` shadows remain; a test now enforces this rule
- Preview-equivalent Playwright fixture build — passed after moving Explore query ownership to the server route

The 305 Playwright browser cases could not start in this runner because Chromium was absent. An attempted Playwright-managed Chromium install was blocked by repeated CDN timeouts/502 responses. This is an execution-environment limitation, not a passing E2E claim. Browser validation must be completed against the Vercel Preview.

## Important boundaries

- Production remains untouched until separate explicit approval.
- Buy and Invest remain visible product intents but must not show invented prices, forecasts or returns.
- Singapore exposes only rights-cleared, verified snapshot evidence.
- Dubai remains a visible market boundary, not a fabricated product surface.
- Building photos are rendered only when licensed media exists; otherwise the editorial evidence fallback is intentional.
- Market Brief publication remains approval-gated. The intended operating target is three English briefs per market per day for Korea, Singapore and Dubai, but no brief should be generated or published as fact without valid source intake and human approval.

## Preview release procedure

1. Push this branch to its matching remote branch without force.
2. Wait for the Vercel Preview deployment to reach Ready.
3. Verify desktop and mobile for `/`, Check, Explore, Rankings, one district, one building, Market Briefs, one brief, Guide, one guide and Singapore Explore.
4. Confirm one H1, no horizontal overflow, no runtime overlay, and retained source/rights boundaries on every evidence route.
5. Do not promote or alias to Production without a separate explicit approval.
