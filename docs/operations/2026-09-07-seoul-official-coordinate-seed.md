# Seoul official coordinate connection — 2026-09-07

## Source and matching

Source: [Seoul Metropolitan Government, 서울시 공동주택 아파트 정보 (OA-15818)](https://data.seoul.go.kr/dataList/OA-15818/S/1/datasetView.do).
Metadata reports an update on 2026-09-07 and KOGL Type 1 (attribution, commercial use and modification permitted).
CSV SHA-256: `fe90c7008597a249895764df6f5ace4b0fa23334cdb51d29a2183f7e6413c3a1`.

The public CSV export returned 2,886 apartment records. Normalization accepted 2,801 with active status, Seoul road address, unique K-apt code and finite coordinates inside the Seoul envelope. X is longitude and Y is latitude. 56 lacked a Seoul-prefixed road address; 29 further records lacked coordinates. No external geocoding or paid lookup was used.

The seed joins these records to existing official `building_facts.kapt_code`, then requires an exact road-address match after removing whitespace and an existing verified global estate identity. Only wholly empty coordinate pairs are filled. Existing verified locations are preserved. This is a source-reported apartment/parcel point, not a surveyed entrance or an individual apartment unit.

## Executed result

- Buildings with stored coordinates: 0 → **663**, across all 25 Seoul districts.
- Global property entities with coordinates: **663**.
- Verified public location projections: **663**.
- Existing registered building identities: **57,915**; **57,252 still lack stored coordinates**.
- Re-running the first batch updated/published zero records, confirming idempotence.
- Every published coordinate retains provider, K-apt reference, verification time and rights policy; the entity additionally retains source digest and match method.

## Read-path correction

Explore used legacy IDs such as `yongsan-gu-htazbv`, while the public location table uses `kr-seoul:estate:yongsan-gu-htazbv`. The projection reader now canonicalizes legacy Seoul IDs for its batched database reads and returns results under the caller's original keys. Existing global Seoul/Singapore IDs retain their behavior. A regression fails without this mapping. Once present in the initial model, coordinates avoid the selected-building address/geocoding lookup path.

The map credits Seoul Open Data with a source link and KOGL attribution. No price markers or additional panels were added.

## Reproduce

1. Use the dataset's public CSV download. The page's `sheetView.do?infId=OA-15818&srvType=S` defines the export form. The current CSV export posts to `https://datafile.seoul.go.kr/bigfile/iot/sheet/csv/download.do` with `srvType=S`, `infId=OA-15818`, `serviceKind=0`, `pageNo=1`, `ssUserId=SAMPLE_VIEW`, empty `strWhere`, and `strOrderby=SN ASC`. This is the public download flow and requires no credential.
2. Run `python v2/scripts/prepare-seoul-official-coordinates.py source.csv normalized.json`.
3. Review the source digest, rejection counts and matching rows before writes. Apply `seed-seoul-coordinate-rights.sql`, then execute `seed-seoul-official-coordinates.sql` with the normalized JSON as `$1`, in batches of 200 records. Both SQL files are under `v2/apps/web/scripts/`.
4. Verify matching counts in buildings, entities and public projections. Keep ambiguous or unmatched records unresolved.

Validation: four Python normalization tests and 73 map/API/projection tests passed. The regression covers the actual legacy/global ID mismatch and preserves canonical-ID behavior. Production build/deployment and live marker counts are checked during delivery.

Remaining scope: extend official identity/address matches for the rest of the apartment inventory, then obtain source-backed building/parcel locations for villas, officetels and detached housing. This batch does not establish full Seoul coordinate accuracy or full coverage; do not use district centers to fill the remaining gaps.
