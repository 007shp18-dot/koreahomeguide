# Manually checked building information

Use `<review-id>.json`, import it in `index.ts`, and validate with `manualBuildingSchema`.
Commute and school entries require a source URL and an actual lookup date. No portal crawling.
Resident summaries must be written from records a person actually read. Keep the count and reading month; publish only statements recurring in at least two reviews. Numeric claims need separate verified official evidence. Do not imply the operator visited a home or read a review that was not checked.

Missing files produce no commute, school or resident section. K-apt building records elsewhere on the page remain separately attributed; nearby schools do not establish admission. Never derive walking minutes from an unverified distance.
