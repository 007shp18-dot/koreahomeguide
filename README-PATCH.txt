KoreaHomeGuide v10.8.3 + v10.9 Phase 1

Replace/add these files preserving repository paths:

REPLACE
- seo/dong-seo-v10-8.cjs
- explore/explorer-utils.js

ADD
- tests/v10-8-3-structured-data.test.cjs
- tests/v10-9-explorer-ranking.test.cjs

v10.8.3 — Chinese structured-data finish
- Localizes Dong Dataset JSON-LD fields instead of leaving Korean/English-only values.
- Dataset name uses localized Dong label.
- spatialCoverage uses localized Dong + district + Seoul.
- temporalCoverage becomes a machine-readable six-month interval, e.g. 2026-02/2026-07.
- variableMeasured uses the localized property-type wording.
- MOLIT creator label is localized while retaining the English official ministry name.
- Existing canonical/hreflang/index logic is unchanged.

v10.9 Phase 1 — Budget-fit neighborhood ranking
- Existing budget filtering remains.
- When a rent/deposit budget is selected, eligible neighborhoods are ranked by the strongest amount of matching signed-contract evidence.
- Matching deposit-band contract count is the primary ranking signal.
- Existing provider order is preserved when no budget is selected.
- No new API provider, no new price model, no fabricated recommendation score.
- EN and ZH Explorer both benefit because they share /explore/explorer-utils.js.

Verification performed:
- RED tests failed before implementation as expected.
- GREEN + regression: 12/12 tests passed.
- node --check passed for both modified JS/CJS files.

GitHub connector note:
- ChatGPT GitHub integration still returns HTTP 403 for write operations.
- Upload these files manually to main, then Vercel should deploy automatically.
