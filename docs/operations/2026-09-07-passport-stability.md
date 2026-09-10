# Passport stabilization — 7 September 2026

The next roadmap stage is reliability and data depth before more markets or account features. The intended product remains overseas property research, comparison, purchase support and eventually ownership/resale.

## This release

- Distinguish unavailable comparable data from available cohorts whose medians exceed the budget.
- Seoul sample count describes available apartment transactions actually used for the unit-price estimate, rather than every eligible record in the source artifact.
- Singapore sample count covers included published projects. Disclose that the area estimate uses a median of project unit-price medians, not a pooled transaction median.
- Dubai includes Ready apartment segments only; an area with only villas is not substituted. Disclose the median of area unit-price medians.
- Show the number of observations or aggregate medians used for the area estimate.
- Do not turn zero, negative or non-finite prices into apparent affordable candidates or infinite areas.
- Restore result state when the browser URL changes after an update.
- Copy the canonical result URL as promised by the button; show a useful failure message when clipboard access is denied.
- Use existing allowlisted completion/copy events without amounts, candidate names or result URLs.

These are indicative screening comparisons. Transaction medians, project medians and area medians are different aggregation levels. Purchase eligibility, taxes, live availability and transfer FX remain outside the first-pass calculation.

## Remaining data work

1. Coordinate Seoul 2020–2025 and latest transaction acquisition with the separate collection workstream. Do not declare historical coverage complete without checking actual files, months, districts and cancellation handling.
2. Measure Seoul/Singapore exact-coordinate coverage from the current source releases, then enrich missing locations only with verified building/project matches. Keep unresolved records visible in lists.
3. Validate Dubai Ready/Off-Plan apartment and rental cohorts by period, area and sample size before extending comparisons.
4. Examine actual user progress from Passport to Explore and calculations. Event instrumentation alone does not establish adoption or growth.

No new country, login system, inventory claim or transaction service is introduced in this release.
