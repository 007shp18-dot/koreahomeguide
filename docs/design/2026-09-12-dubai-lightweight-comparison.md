# Dubai lightweight comparison

Approved scope: add the previously mocked candidate comparison to Dubai Explore. Preserve the homepage and all other markets.

- Compare two or three published areas using the already delivered Explore aggregate model. No API, database query, polling, provider fetch, or new dependency.
- Keep comparison scope independent of Explore filters. Adding/opening/saving candidates does not change the map points or remount the map.
- Load the dialog JavaScript on first open. A native modal dialog supplies focus containment and Escape support; restore focus on close. The table scrolls within the modal on small screens.
- Show the same housing type, sale stage, and current published period for every candidate. Missing evidence stays missing. Off-plan comparisons omit rent. Explain that area aggregates have different home sizes and transaction mixes.
- Save at most ten presets in localStorage. Store only area slugs, housing, stage and period; never a price snapshot. Deduplicate equivalent selections and replace the oldest entry at the cap. Reads/writes are bounded and storage failures are explicit.
- Share a bounded URL fragment on the existing localized Explore route. Fragment contents are not sent to the server. Reopening uses current public data and discloses a changed period.
- EN, KO, zh-CN copy. No accounts, notifications, scraping, heavy images, background requests, or homepage edits.

Verification: pure-model tests cover malformed input, bounds, deduplication, scope and missing data. Browser tests cover select/open/save/reopen/share restoration, candidate cap, changed period, off-plan omissions, mobile containment, and absence of new API/document/Google Maps requests during comparison actions. Production build, typecheck, lint and existing Dubai tests are required before release.
