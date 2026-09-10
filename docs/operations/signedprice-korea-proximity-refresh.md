# SignedPrice Korea Proximity Refresh

The monthly workflow builds a fixture-tested, server-only Korea proximity candidate. Configure these repository secrets with official endpoints whose terms permit the derived snapshot:

- `SEOUL_STATION_ENDPOINT`
- `KOREA_SCHOOL_ENDPOINT`
- `KOREA_BUILDING_COORDINATE_ENDPOINT`

Endpoint values can contain credentials and are never logged, committed, copied into the artifact, or exposed to browser code. Each successful changed run promotes only to the staging path `v2/artifacts/korea-proximity/signedprice-korea-proximity-v1.json.gz` in a pull request after strict parsing, identity, coverage, predecessor-count, provenance, and digest checks.

Configure these non-secret repository variables independently from the endpoints and public provenance descriptor:

- `SEOUL_STATION_SOURCE_IDENTITY`
- `KOREA_SCHOOL_SOURCE_IDENTITY`
- `KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY`

Every provider page must carry its matching identity in the top-level `source` field. A missing, changed, or cross-source identity fails the refresh. These values verify the input feed only and are not copied into artifact provenance.

Provider input is hard-bounded before artifact construction: decoded response bodies are at most 4 MiB, pages contain at most 5,000 records, text fields contain at most 256 characters, and aggregate station, school, and coordinate inputs contain at most 10,000, 20,000, and 60,000 records respectively. Source identities are at most 128 characters and endpoints at most 4,096 characters. The coordinate cap leaves explicit headroom above the current 48,999-record installed inventory while preventing provider-controlled unbounded allocation.

Before enabling collection, an approver must add the separately reviewed `v2/config/korea-proximity-public-sources.json` descriptor. It contains only the three public landing pages, public source versions, and as-of dates; it must never copy endpoint values or provider payload fields. The builder fails closed while this descriptor is absent or invalid.

The workflow does not activate `kr-proximity`, edit `installed-snapshots.json`, or install a snapshot. Review the staged candidate and separately complete the applicable release gate before any activation.
