# Photo latency and verified coordinate follow-up

## Runtime reads

Approved-photo lookups now share concurrent reads for the same normalized key set.
No successful result is retained after the request finishes: a withdrawn photograph
must never be restored from an old cache. A failed read pauses additional lookups
for 15 seconds in that server instance, then admits one recovery probe. At most
32 distinct reads may be pending. During a pause or saturation the existing
location fallback is used, and the result remains explicitly unavailable.

The existing three-second request deadline is unchanged. This limits repeated
waiting during a database outage; it does not repair the underlying network or
claim that timeouts can never happen. Static seeds remain prohibited when a live
database is configured and its read fails.

## Seoul official coordinate reconciliation

Downloaded the official OA-15818 CSV through its existing public export flow.
SHA256: `61389d8999fbf148de3563ba229877b713902462872447f63256e380e2e9b29d`.
The existing named-coordinate normalizer accepted 2,797 of 2,888 records.
It excluded 56 inactive/non-Seoul rows, two district/address conflicts,
29 missing coordinate rows and four ambiguous/incomplete identities.

The unchanged strict SQL found one new exact name/district/neighborhood match:
디마크당산, 서울특별시 영등포구 양평로 48, official reference A10019936.
It filled the missing building/entity coordinate pairs and added one verified
parcel projection. Existing verified points were not overwritten. The write
returned matched/buildings/entities/published counts of 1/1/1/1.

Source: https://data.seoul.go.kr/dataList/OA-15818/S/1/datasetView.do
Reproduce with `prepare-seoul-official-coordinates.py --named` and
`seed-seoul-named-coordinates.sql`; retain the full deduplicated source when
checking uniqueness.

## Visual photo review

Used the existing version-matched photo transition and audit event workflow.
Read exact timestamp text so microseconds were preserved in the version guard.

- 42300 approved: Mapo Trapalace exterior with readable TRAPALACE signage.
  Historical photograph by junilly, CC BY 3.0; attribution and source retained.
  https://commons.wikimedia.org/wiki/File:마포트라팰리스_-_panoramio.jpg
- 42302 rejected: a museum display of the historical Yongbieocheonga book,
  unrelated to the similarly named building.
- 193 rejected: historical unfinished construction, unsuitable as the building
  detail hero.
- 42297 remains pending: the broad neighborhood view does not establish a
  sufficiently clear subject for an exact-building hero.

No unchecked search-result image was automatically published. Singapore's
existing heuristic HDB geometry matching was not promoted to verified building
coordinates. Additional source-backed identity evidence is still required.
