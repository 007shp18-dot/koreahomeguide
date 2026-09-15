# Search discovery audit — 2026-09-15

## Evidence and decisions

The production root sitemap contained 48,581 unique URLs (32,711,239 bytes), not 48,581 distinct buildings. Of these, 47,649 were 15,883 Seoul buildings in English, Korean and Simplified Chinese; another 388 were English neighborhood directories. No duplicate `loc` values were found. Local installed snapshot counts reproduced production building coverage.

Comparison using the installed source release:

| Minimum transactions in one type | Buildings | Neighborhoods |
| --- | ---: | ---: |
| 3 | 15,883 | 388 |
| 5 | 8,471 | 379 |
| 10 | 4,381 | 347 |

Five is a product publication floor, not a Google ranking requirement. Search eligibility now also requires a published price comparison and at least five inspectable transaction rows in the same transaction type, plus a building name and neighborhood identity. The source repositories validate source provenance, period and typed transaction data before this policy runs. Counts alone without usable history, or history without a published comparison, are not sufficient. Default transaction selection prioritizes candidates meeting the same usefulness floor.

This excludes 7,412 thin building histories / 22,236 localized building URLs from sitemap discovery and sets their existing pages to `noindex, follow`. Building detail pages remain accessible. Nine neighborhoods with no remaining eligible buildings redirect to their own filtered explorer, instead of becoming dead links. No underlying transaction data is deleted.

## Discovery repairs

- Root `/sitemap.xml` retains core, market and editorial URLs, without the Seoul building inventory.
- `/seoul-sitemap.xml` links to 25 root-level `/seoul-{district}-sitemap.xml` files. Each carries that district's eligible buildings in all three languages and English neighborhood directories. Language alternates and actual source release dates are preserved. Root-level public XML URLs avoid restricting scope to an internal route directory.
- `/editorial-sitemap.xml` previously queried only database news, producing an empty file even though static guides and stories were public. It now includes the static editorial portfolio and published database news, deduplicated by canonical URL and filtered through existing content exclusions. Database news overrides matching static entries, consistent with the newsroom. The database list retains the existing 200-per-locale cap; revisit pagination if publication volume reaches that cap.
- `robots.txt` advertises all relevant sitemap entry points.
- Existing four home city cards link directly to each localized buying-budget guide. No homepage redesign or new factual claims.

Splitting files is operational hygiene, not a ranking boost. Sitemap removal alone does not deindex a URL: the page-level `noindex` must be crawled. No robots block prevents Google from reading that directive. The Search Console report delay is separate and not repaired by these changes.

## Validation and measurement

Regression tests cover empty-database editorial discovery, excluded translations, unique XML URLs, complete district partitioning, size limits, language alternates, invalid district requests, retained thin building pages, useful default transaction selection and retired neighborhood redirects. Installed snapshot expectations protect retained building coverage.

After deployment compare Search Console impressions/clicks for retained building URLs and the four budget guides against their own prior periods, separating locales and acquisition channels. Do not treat total indexed URL count or pageviews from operational checks as success. No increase in search traffic is promised by this change.
