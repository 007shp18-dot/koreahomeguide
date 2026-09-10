KoreaHomeGuide v11 — Fair Rent Intelligence

REPLACE
- lib/rent-check-core.cjs
- rent-check-ui-utils.js
- zh/rent-check-ui-utils.js
- tools/seoul-rent-check/app.js
- zh/tools/seoul-rent-check/app.js

ADD
- tests/v11-fair-rent-intelligence.test.cjs
- tests/v11-fair-rent-regression.test.cjs
- docs/superpowers/specs/2026-08-25-fair-rent-intelligence-design.md
- docs/superpowers/plans/2026-08-25-fair-rent-intelligence.md

What changes
- Reliable Rent Check results now return P25, median, P75 and the asking quote's empirical percentile rank.
- P25/P75 use deterministic linear interpolation on the exact same comparable set already used for the verdict.
- Percentile rank is the share of comparable values <= the asking quote, rounded to 0–100.
- Monthly-rent comparisons use monthly-rent values; jeonse comparisons use deposit values.
- EN/ZH Rent Check dynamically inserts a Fair Rent Intelligence panel with the typical P25–P75 range and percentile sentence.
- Insufficient results hide the intelligence panel and expose null distribution fields.

Unchanged
- Existing comparable tiers and sample minimums.
- Existing +/-10% below/fair/above thresholds.
- Existing MOLIT provider/API fetch logic and API inputs.
- Currency calculations remain KRW internally.
- No Safety Score, affiliate/referral, or advertising logic.

Verification performed in isolated workspace
- TDD RED confirmed before implementation.
- v11 + regression tests: 13/13 passed.
- node --check passed for all five modified JS/CJS files.
- Source checks confirmed TIERS and +/-10% verdict thresholds unchanged.
