# v11 Fair Rent Intelligence Design

## Goal

Extend the existing Seoul Rent Check with evidence-based price-distribution context without changing the existing `below / fair / above` verdict thresholds or pretending the result is an appraisal.

## Scope

The first v11 slice applies only to `/tools/seoul-rent-check/` and `/zh/tools/seoul-rent-check/`.

For a reliable comparable set, the API result adds:
- `p25ValueWon`: 25th percentile of the same value used for the verdict (monthly rent for wolse, deposit for jeonse).
- `medianValueWon`: existing median, unchanged.
- `p75ValueWon`: 75th percentile of the same comparable distribution.
- `percentileRank`: the asking quote's empirical percentile rank within the comparable values, rounded to a whole percent from 0 to 100.

The UI shows:
- a runtime-inserted "Typical range (P25–P75)" block inside the existing Rent Check result so no static page structure or SEO metadata changes are required;
- a concise percentile sentence such as "This quote is around the 78th percentile of comparable signed contracts.";
- the existing rating and confidence badges unchanged;
- the existing comparable contract evidence table unchanged.

## Statistical rules

Percentiles use deterministic linear interpolation on the sorted comparable values:
- position = `(n - 1) * p`;
- if the position is an integer, return that value;
- otherwise interpolate between the surrounding values.

Percentile rank uses the empirical share of comparable values less than or equal to the asking value:
- `count(value <= asking) / n * 100`;
- round to the nearest whole percent;
- clamp to 0–100.

The distribution always uses exactly the same comparable set selected by the existing tier logic. No separate sample, new provider, inferred adjustment, or building-quality model is introduced.

## Data sufficiency

If the existing Rent Check result is `insufficient`, all new fields are `null` and the UI hides the distribution block. The feature never displays a percentile/range when the existing methodology says the sample is insufficient.

## Compatibility

- Existing `below / fair / above` thresholds remain at ±10% from the median.
- Existing tier rules, minimum comparable counts, time windows, size/deposit tolerances, new-contract preference, API inputs, cache behavior, and MOLIT fetch logic remain unchanged.
- Currency conversion remains display-only; all calculations remain in KRW.
- EN and Simplified Chinese receive equivalent information and no new advertising/referral content.

## Files

Modify:
- `lib/rent-check-core.cjs` — percentile math and response fields.
- `tools/seoul-rent-check/app.js` — EN rendering.
- `rent-check-ui-utils.js` — EN percentile wording.
- `zh/tools/seoul-rent-check/app.js` — ZH rendering.
- `zh/rent-check-ui-utils.js` — ZH percentile wording.

Add:
- `tests/v11-fair-rent-intelligence.test.cjs` — core statistical and UI contract tests.

## Non-goals

- No Rent Safety Score.
- No registry, lien, landlord, guarantee-insurance, maintenance-fee, floor, furnishing, or renovation scoring.
- No Explorer-wide score badges in this slice.
- No change to SEO page market medians.
- No machine-learning or opaque recommendation score.
