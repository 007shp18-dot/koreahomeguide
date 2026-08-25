KoreaHomeGuide v10.8.1 patch

Replace/add these repository files preserving paths:
- seo/dong-seo-v10-8.cjs (replace)
- tests/v10-8-1-dong-seo.test.cjs (add)

What changes:
- Completes Chinese localization for the new Market snapshot and Nearby neighborhoods modules.
- Adds Chinese labels for curated Dong names used by internal links.
- Localizes property-type wording in the Chinese market snapshot.
- Does NOT heuristically delete duplicate-looking MOLIT rows.
- Adds an explicit transparency note explaining that identical-looking rows may represent separate reported contracts.
- Adds Floor to recent-contract tables when floor data is available, making apparently identical contracts easier to distinguish.

Duplicate-audit conclusion:
- Current MOLIT rental response/docs do not provide a sufficiently stable transaction ID for safe heuristic deduplication.
- Therefore matching building/date/size/deposit/rent alone is NOT used as a deletion criterion.

Verification:
- node --test tests/v10-8-dong-seo.test.cjs tests/v10-8-1-dong-seo.test.cjs
- 8/8 tests passed
- node --check seo/dong-seo-v10-8.cjs
- syntax checks passed

Note:
ChatGPT's connected GitHub integration still returns HTTP 403 for write operations, so this patch could not be pushed automatically.
