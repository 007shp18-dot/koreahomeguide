# Dubai aggregate review — 2026-09-06

Real derived data, not synthetic fixtures. Included in public PR #167 at the
SignedPrice operator's explicit request, with a declared noncommercial purpose.
This declaration is not a claim of a DLD licence grant or verified currency units.

## Contents and scope

- `dubai-area-evidence.json.gz`: 46 canonical areas, 53 area/housing segments.
- `dubai-area-slugs.json`: stable initial canonical area addresses.
- `dubai-release-record.json`: owner declaration, source-review status, unit-review status.
- Source: Dubai Land Department exports supplied by the operator.
- Input counts: 151,921 sales records, 313,696 rental records, 262,428 land records.
- Common comparison window: 2026-06-08 through 2026-09-05 (90 days).
- Apartments and villas are separated; Ready and Off-Plan sales are separated.
- Minimum 30 observations per displayed distribution. Counts are registrations,
  not listings, unique homes, or a complete inventory of Dubai.
- Area-level median rent/price ratios are not matched-property or net yields.
  No Off-Plan rental yield is asserted.

These files contain area aggregates and source digests, not raw transaction,
rental, parcel, owner, or contact records. The one-row project export is unused.
The original 105 area labels are not a promise of 105 publishable pages:
canonical matching, housing filters, the common period, and sample thresholds
leave 46 eligible aggregate areas in this input batch.

## Release status

The snapshot is **draft / noindex** with pending source-rights and unit reviews.
`rights.can* = false` records permissions not verified by the source review;
it does not revoke or negate the operator's separate instruction to include this
review artifact. No commercial permission has been asserted.

This directory is deliberately absent from the installed snapshot registry and
is not served as a public asset. The existing four-area Explore fallback remains
unchanged. Merely merging the review files does not activate the 46-area view,
SEO pages, Check benchmarks, or a production deployment.

## Reproduction

Run `apps/web/scripts/build-dubai-area-evidence.mjs` with the supplied transaction,
rent and land CSVs, `--generated-at 2026-09-06T00:00:00.000Z`,
`--rights-record apps/web/data/review/dubai-release-record.json`,
`--slug-registry apps/web/data/review/dubai-area-slugs.json`, and
`--output apps/web/data/review/dubai-area-evidence.json.gz` from `v2/`.
The artifact binds the source digests, independent source periods, exclusions,
canonical identities, distributions and ratios in its `dataDigest`.

Before a later live release, record the applicable source permissions and unit
evidence; rebuild and install the release atomically with its metadata. If the
use changes to commercial, re-evaluate the commercial permission explicitly.
