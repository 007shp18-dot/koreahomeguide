# Search discovery recovery

## Observed evidence

The supplied Search Console exclusion export reports 1,720 noindex URLs as of
2026-09-04, but contains only 1,000 example URLs. Those examples are not 1,000
unique pages: filter parameters repeat canonical building paths. The supplied
performance webarchive contains ten page rows, zero clicks and 35 summed page
impressions; its date range and positions are absent. This does not establish
why the separately reported weekly total is 22 impressions.

Before this change, 487 of the 1,000 example URLs were already eligible under
current source data. Live spot checks confirmed index/follow for some examples.
A noindex report therefore includes historical state as well as current blocks.
Do not describe all 1,720 URLs as currently blocked or extrapolate the missing
720 examples.

HTTP signedprice.com redirects to HTTPS, then to www.signedprice.com. The public
metadata helper consistently uses the HTTPS www origin. No host redirect change
is needed. The Search Console migration banner alone does not prove a migration
fault.

## Changes

- Separate search eligibility from the five-contract price-statistics gate.
  An identified building with a nonempty neighborhood and at least three recent
  transaction rows in one transaction type can be indexed. Existing published
  statistical cohorts remain eligible. Three is an editorial site threshold,
  not a Google requirement. Identity-only and one/two-row pages remain excluded.
- Choose a populated sale/jeonse/monthly group for the canonical server-rendered
  page when no statistical group is published. Keep small-sample medians hidden.
- Apply the same eligibility to metadata, sitemap and neighborhood directories.
  On the installed snapshot the eligible building count changes from 8,471 to
  15,883, with both English and Korean URLs; neighborhoods change from 379 to 388.
  This is eligibility, not Google indexing or ranking.
- In the supplied 1,000 examples, 125 additional URL rows become eligible
  (487 to 612); 379 Seoul rows remain below this policy, and nine other route
  examples are outside the Seoul building policy.
- Add direct Korean building links to neighborhood directories, clarify English
  building titles and the Korean Seoul Explore title, and describe Dubai Explore
  using its actual price/rent/yield comparison capabilities.
- Publish the omitted 2,412 eligible Singapore project URLs in a dedicated
  `/sg/singapore/sitemap.xml`, advertised alongside the main sitemap in robots.
  Previously the main sitemap listed only the Explore and three region routes.
- Add a user-visible expandable Singapore project directory with server-rendered
  region and published-project links, independent of client-side pagination.

## Acceptance and follow-up

Regression coverage checks that a real three-row building is indexable, has a
self canonical, appears in the directory/sitemap policy, server-renders its
history, and still has no published median. One/two-row and missing-name cases
remain excluded. Singapore SSR coverage checks a project beyond page one.

After deployment inspect the live noindex-to-index example, its Korean alternate,
its neighborhood links, Singapore directory, robots and sitemap. Search Console
must recrawl before its exclusions reflect the change. Monitor actual indexed
canonical pages, impressions and non-brand landing pages; do not claim that
removing noindex guarantees indexing or increased impressions.

## Additional historical export

The user identified a second webarchive as Koreahomeguide-era performance. It
contains twenty complete query rows with zero clicks and one/two impressions
each (23 summed query impressions), plus one truncated query. Queries include
Seoul rent in Chinese, jeonse meaning, and individual Korean buildings. The
date range and landing pages are missing. This is insufficient to establish
a migration-caused traffic collapse or a previous period of successful growth.
The retained guides should remain reachable; do not infer a redirect fault
from the report name or Search Console's site-move banner alone.

Live follow-up found the two corresponding legacy English rental guides still
returning 200 with old-domain self canonicals, although their SignedPrice
equivalents now return 200 with index/follow and self canonicals. The migration
manifest now moves those two guides with exact 301 redirects and removes them
from the old sitemap. Retained unmatched content is unchanged. This establishes
an incomplete content migration, not the numerical cause of the 22 impressions.
