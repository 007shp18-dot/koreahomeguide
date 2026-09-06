# Research redesign: resumed state

## Verified existing release

The pasted conversation ended before deployment, but GitHub PR #147 is merged. Its final record reports 2,068 unit tests and 411 browser checks passing, with 21 conditional skips. Navigation unification, external headlines, seven English guides, five analyses and three additional figures shipped in 918ce2a. These are previous-run results, not tests rerun in this resumption.

Vercel currently serves production commit 09937c875279393279dfcfcb2595dc802971975e, deployment dpl_C42X37VAbZm4YCUbqVnnw59nN7H3, READY, at www.signedprice.com. This includes #149's browser-key isolation and #148's photo-coverage work. Live News HTML has the shared navigation and External headlines section. A fresh /api/news/ request returned HTTP 200 and 714 items; the newest item was published at 2026-09-06T01:25:00Z. Feed counts are observations, not fixed product constants.

## This change

Markets still explained service coverage without a practical market-entry comparison. Add three editorial rows pairing Seoul and Singapore: buying eligibility, acquisition cash requirements, and comparable transactions. Each leads to an existing expanded guide or Explore. Use the shared type/spacing tokens, neutral rules, a three-column desktop layout, two-column tablet layout and stacked mobile layout. Align the Markets metadata with this content.

Official source pages opened on 6 September 2026:

- https://www.investkorea.org/ik-en/cntnts/i-417/web.do
- https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer's-stamp-duty-(absd)

No new rates, yields, eligibility guarantees or datasets are introduced. The acquisition-cost chart link refers to the previously published illustrative S$2m example in the Singapore guide. Scope is SignedPrice v2 only. KoreaHomeGuide and Dubai data are unchanged.

## Fresh validation

- Nine existing tests passed across research-navigation, guide-routes and global-roadmap-routes.
- Web TypeScript check and ESLint on the two changed TSX files passed.
- Production build passed, generating 890 static pages.
- Initial local build failed because an external dependency-directory symlink was outside Turbopack's root. Copying the existing installed dependencies into the isolated checkout resolved this without changing the lockfile or build configuration.
- New Markets viewport review and preview CI remain pending at commit time.

## Remaining verified defect

Fresh production browser inspection reproduced Google Maps InvalidKeyMapError. CCR selection reveals CCR evidence and projects, and the page has no horizontal overflow at the inspected desktop width. This does not establish that the interactive map works. #148's configuration claim does not supersede the reproduced error. A valid browser Maps credential and subsequent production verification are still needed; never substitute the server photo credential.

Broader redesign completion must be assessed against the approved 2026-09-05 global-investment visual-system design. This small Markets addition is not a claim that every phase has completed.
