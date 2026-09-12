# SignedPrice rankings — checked 11 September 2026 (UTC)

Eight 1080×1350 cards: highest and lowest sale contracts and district rental medians for Seoul and Singapore. Website sales show 50 contracts; rentals show every qualifying district. Cards show up to 10 rows. Equal amounts share competition ranks.

## Sales

Seoul apartments and Singapore private condominiums only. Rank individual total transaction amounts, not building averages or price per square metre. Latest completed source month: August 2026 for both. Exclude generic/unnamed/numeric-only sale names, non-apartment Korean housing, and Singapore multi-unit sales. Preserve legitimate unfamiliar property names and Korean source names. KRW units are unchanged; SGD minor amounts are divided by 100. Late filings and corrections can change coverage.

## District rentals

Seoul default: 40 < exclusive area ≤ 60 m², deposit ₩100 million inclusive to ₩300 million exclusive. Singapore default: exactly 2 bedrooms and original URA area bands 60–70, 70–80, 80–90 m². Compare median monthly rents only among these matched cohorts. Each district needs at least 10 contracts. Display sample size and Seoul median deposit separately. Median rent and deposit do not describe a single lease. These are reported contracts, not available offers; eligibility and tenancy terms vary.

Latest source month is selected before cohort filtering. Sparse cohorts never fall back to an older month. Both default cohorts contain 22 qualifying districts. Seoul: August 2026; Singapore: July 2026. Singapore rentals are non-landed projects matched to condominium-classified sale evidence; unmatched projects are excluded. This is limited coverage, not all non-landed rentals.

The Singapore August rental release is scheduled for 15 September 2026: https://www.ura.gov.sg/property-data/data-release-calendar/ (checked 11 September).

Sources: MOLIT https://rt.molit.go.kr/ and URA https://www.ura.gov.sg/. Active/corrected observations, latest source business-key version, eligible display/derived/commercial/index rights. No database mutations.

## Reproduce

`2026-09-11-sales.json` contains the reviewed high/low sales snapshot. `2026-09-11-regional-rents.json` contains the default district cohorts. Queries live under `v2/apps/web/lib/rankings/`. Live pages query the database with a 15-minute cache and explicit unavailable state. They never substitute editorial snapshots for live data.

Run `node artifacts/rankings/render-final.cjs /absolute/output/path`. Graphics are deterministic data-rendered SVG/PNG. Compact K/M/B currency amounts (up to three decimal places) appear in every row; ranking calculations retain the original exact amounts, with TOP 1/2/3 ribbon badges. The user's apt_sum reference informed table hierarchy and period placement, without copying its brand or asking prices. Structural web reference: https://www.edgeprop.sg/property-news/whats-moving-market-singapores-biggest-property-deals-and-hottest-searches-sept-4 .

Cards are prepared for user review. No SNS posting or scheduling. Deploy and verify the live ranking destinations before posting the cards.
