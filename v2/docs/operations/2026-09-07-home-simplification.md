# Homepage simplification — 2026-09-07

Approved scope: shorten the homepage to Passport budget entry, three city exploration cards, and three analysis cards with compact resource links. Retain the white/navy/blue identity and existing routes.

- Removed the competing rotating hero, repeated city tool actions, policy-update block, duplicated lead Data Story, and long guide cards from the home composition.
- Retained currency conversion and budget submission. Shortened the comparison button across entry locales.
- Each city has one Explore action. Desktop cards share action baselines; mobile cards use a small image beside the text.
- Latest available analysis per city is selected from published records, with unique local-language fallbacks up to three. Dates and canonical article attribution remain visible. Article rows share grid tracks without truncating titles or numbers.
- Chinese View all now respects the analysis query; the unfiltered news page still includes policy updates.
- Updated semantic and browser contracts to the approved three-region composition. Corrected the pre-existing Singapore alias browser expectation to its already-shipped permanent redirect.

Validation before publishing: full unit suite initially 2,439 passed with four outdated-contract/style failures; all four corrected, affected six suites/56 tests passed. Production build and lint passed before the final Chinese query change; GitHub CI validates the final committed tree. Independent read-only code review requested and its Chinese route mismatch fixed.

Screenshot baselines for the previous homepage intentionally change. Existing internal content screenshots were already stale; do not treat those baselines as proof of a public article defect. No local Sites preview available for this Next monorepo; use CI browser verification and inspect the published homepage directly.
