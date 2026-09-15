# Singapore, Tokyo and Dubai search discovery audit — 2026-09-15

This completes the city scope omitted from the earlier Seoul audit. A sitemap
submission is not a guarantee of crawling, indexing or traffic. Search Console's
reported Singapore error text was not supplied, so its exact cause is unconfirmed.
The public file returned HTTP 200 and parsed as XML; that alone did not establish
successful Search Console processing.

## Findings and changes

| Market | Existing inventory and evidence | Decision |
| --- | --- | --- |
| Singapore private | Installed release has 2,412 published projects; publication already requires 5 sales, price/PSF distributions. | Retain useful projects; additionally require at least 5 inspectable records in both sitemap selection and all three locale metadata functions. |
| Singapore HDB | 28 towns, 9,485 previously eligible blocks. A block could qualify with one median and no building facts. | Town comparisons retained. Detail index eligibility requires resale and rental samples of at least 5 with published medians, residential property facts, completion year and dwelling count. 8,523 blocks qualify, 962 leave the sitemap and receive noindex/follow in all three locales. Pages and data remain accessible. |
| Tokyo | 31 named reviews in EN/KO, minimum 2 cited sources and at least one alternative comparison per review. Anonymous MLIT transactions are explicitly not assigned to named buildings. | Retain 62 review URLs; untranslated Chinese review routes remain noindex. Add missing reciprocal sitemap language links to reviews and city/explorer landing pages. |
| Dubai | 31 named reviews in EN/KO, minimum 4 cited sources and at least one comparison each. 46 area pages per locale backed by a separate published DLD release with minimum 30. | Retain substantive reviews and area comparisons, preserve ready/off-plan distinction and unverified project mapping limitations. Add reciprocal EN/KO sitemap links to reviews. |

The minimum counts are product publication/quality choices, not Google rules.
Requiring both HDB price summaries is justified by this particular detail template,
which promises resale and rental prices; a single summary stays available in the
town explorer. Private projects expose detailed sales and price/area comparison,
so they do not need rental coverage to answer their page's stated question.

## Sitemap routing

- New `/singapore-sitemap.xml` indexes 32 shards: 3 private segments, 28 HDB towns,
  and the price-check landing pages.
- Public shards are at site root (`/singapore-private-ccr-sitemap.xml`,
  `/singapore-hdb-ang-mo-kio-sitemap.xml`, etc.), allowing all locale paths.
- Existing `/sg/singapore/sitemap.xml` permanently redirects to the new index.
  Existing submissions need not be deleted. `robots.txt` advertises the new index.
- The root `/sitemap.xml`, editorial sitemap and Seoul index remain in place.
  Tokyo/Dubai are covered by the root sitemap; separate files are unnecessary.
- Installed-release Singapore result: 32,892 URLs versus 35,778 under the prior
  policy. The live pre-change file had 35,787 URLs, reflecting a newer private
  release. Live counts can differ; the same rules apply to verified production data.

## Verification scope

Regression tests cover excluded aggregate-only private projects, HDB selection,
locale metadata consistency, complete nonduplicated shard coverage, root XML
routes, the legacy redirect, Tokyo entry alternates, and all 62 Tokyo/Dubai named
reviews. Full unit tests, lint, type checking and a production build are release
gates. Post-deploy HTTP checks must confirm redirects, XML shards and retained /
excluded page metadata. No Google indexing or traffic improvement is claimed.
