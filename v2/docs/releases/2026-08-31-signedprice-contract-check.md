# SignedPrice Seoul Contract Check release evidence

Date: 2026-08-31

## Candidate scope

- Replaces `/kr/` with the approved two-offer contract decision workspace.
- Keeps the one-offer distribution check at `/kr/seoul/tools/rent-check` as a secondary tool.
- Reuses Seoul district Explorer, district detail and Rankings as evidence surfaces.
- Keeps Check and Explore as the only active primary destinations. News and Guide remain non-links.
- Keeps Singapore and Dubai out of the public market navigation.
- Does not modify KoreaHomeGuide routes or migration metadata.

## Evidence contract

- The portable engine compares two offers symmetrically against their lower deposit.
- The browser receives only verified curve projections: housing type, period, generated instant and anchors.
- Raw artifact provenance, digest, exclusions, rights lookup and environment-variable names remain server-only.
- Missing, stale, malformed, under-supported or rights-blocked evidence produces a claim-free unavailable page.
- Interpolation is labeled inside verified anchors. Values outside the observed range hold the nearest verified rate and are labeled.
- User-entered offer values stay in client state and are not submitted to a server or analytics endpoint.

## Local release gates

- Focused Contract Check state and SSR tests: 10 passed.
- Evidence navigation and Rankings focused tests: 45 passed.
- Full Vitest regression: 67 files, 820 tests passed.
- ESLint: passed.
- TypeScript across market-core, korea-rent and web: passed.
- Next.js 16.3.3 production build: passed; 40 routes generated.
- Rent Check / Contract Check client-boundary scan: passed.
- Static client scan found no conversion artifact environment name, test digest or MOLIT provider endpoint.
- Playwright Contract Check collection: 12 cases across 390, 720, 1366 and 1440 pixel widths.
- Local Playwright execution: blocked before test execution because the runtime has no Chromium binary. The exact assertions remain required on the Vercel Preview.

The deterministic local browser fixture uses period `2026-03/2026-08` and a non-production test digest. A Preview must not use this fixture and must fail closed unless a separately verified artifact is installed in server-side Vercel environment scope.

## Preview gates

- Candidate commit SHA: pending final candidate commit.
- GitHub pull request: pending.
- Vercel deployment ID and exact deployment SHA: pending.
- Verified artifact period and digest identity: pending; do not record the raw artifact or secret values here.
- Required visible checks: ready evidence, Offer A → Offer B → Result order, interpolation, held-range label, tie, ranking flip, 44px controls, keyboard order, no horizontal overflow, no console errors or 5xx responses, no canonical/hreflang, and no sitemap URL.

## Promotion hold

Do not merge or promote to Production until both conditions are met:

1. The official supplied logo archive is available and replaces the temporary text wordmark without redrawing or guessing the asset.
2. The user has reviewed and accepted the exact-SHA visible Preview.

PR #25 is preserved as historical Rankings work and is superseded only after this integrated candidate is accepted. KoreaHomeGuide remains unchanged until a separate cohort migration with complete redirect mappings is approved.
