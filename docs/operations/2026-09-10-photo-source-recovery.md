# Existing candidate source recovery

## Corrected finding

The 73,461 figure is the canonical entity inventory, not photographs. The initial photo table had 40,888 rows and 14,108 distinct non-null asset URLs. All 40,680 NAVER candidates lacked titles and stored the image URL itself in source_page_url. Those were not recovered publishing-page links.

The NAVER subset contains 13,909 distinct URLs. img.peterpanz.com alone accounts for 25,916 candidate rows and 4,079 URLs. URL deduplication is not perceptual image deduplication and does not establish building identity.

## Batch implementation

- Stop storing an image URL as the NAVER publishing-page URL. Missing origin remains null; title and dimensions returned by the API remain retained.
- Index all existing pending NAVER assets once by exact URL, recording host, candidate count and distinct building count. Preserve the original candidate records and original discovery provenance.
- Resolve known Commons originals/thumbnails to their exact file metadata using the official Commons API, in batches of at most 20 unique URLs.
- Require the returned original file identity to match the candidate filename. Store publishing page, description, author, dimensions and licence separately from identity.
- Promote rights metadata only when author and an allowed Creative Commons licence URL are present. This does not approve the photograph. Existing approved/rejected decisions are not changed.
- Record strict normalized building-name support separately; name absence remains unresolved, not proof of a wrong image.
- Run the resumable recovery job hourly at minute 31 under the existing CRON bearer. Failed API batches retry after one day. No search API is resumed and no spending cap is raised.
- Show source-host groups, recovered/unresolved states and multi-building URL counts in the authenticated collection dashboard and photo coverage API.

## Initial complete inventory pass

All 13,909 NAVER URLs were grouped. Of 96 Commons URLs, 90 returned matching file metadata, enriching 148 linked candidate records. 75 unique images supplied allowed reusable-licence evidence, corresponding to 130 candidate records. The remaining 18 enriched records retain unverified rights.

The 148 records remain review_required. Their strict name-in-title/description check is unresolved. Neither licence recovery nor an image filename constitutes a visual identity approval.

13,819 unique URLs / 40,532 candidate links still require publishing-page recovery or an independently licensed supply path. 3,858 total URL groups are attached to multiple buildings (19 recovered, 3,839 unresolved). These groups are explicitly exposed; they must not inherit one identity decision across all linked buildings.

## Limits

This is a full inventory pass and a reusable metadata recovery worker, not a claim to have visually reviewed 40,000 photographs. Most original publishing pages cannot be recovered from the saved CDN URLs alone. Host-specific origin discovery needs verified provider mechanisms; guessed URLs and CDN ownership do not establish permission. No automatic visual approval, new coordinates or fabricated source page is introduced.
