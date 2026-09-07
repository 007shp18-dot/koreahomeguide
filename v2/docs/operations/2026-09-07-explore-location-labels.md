# Explore location labels — 2026-09-07

Scope: align Seoul map, list and selected-building names; allow foreign readers to use reviewed English neighborhood names; preserve source identities, geocoding and compact cards.

- Reported building names remain authoritative. Parenthesized parcel numbers remain clearly labelled lots, with neighborhood/district context. No invented building-name enrichment.
- One display helper now supplies the map marker, list, selection card and drawer title. Original Korean addresses remain available in title attributes and existing property details. Geocoder queries still use the original Korean address; no coordinate or identity changes.
- Added district-scoped display/search aliases for 22 source neighborhood names: 12 Gangnam, four Dobong and six existing Dongjak labels. Both server projection and client map/list filters use the same matching helper. Hyphenated, spaced and joined English spellings work. Korean/unknown names remain intact. This is deliberately not a claim of complete English-name coverage across Seoul.
- Existing list rows already preserve one-line names and prices. Selection drawer headings and location lines now follow that alignment and retain full text via title attributes.
- Singapore and Dubai exploration already derive map/list names from the same project/area objects; no speculative changes made to their identity pipelines.

Name references reviewed 2026-09-07:
- Gangnam's twelve neighborhood spellings: https://en.wikipedia.org/wiki/Gangnam_District#Divisions . Display spellings only; this list is not used as a complete legal-dong inventory or boundary source.
- Dobong district English neighborhood spellings: https://www.dobong.go.kr/subsite/eng/intro/intro3_3.asp . Root names used with exact source records; no administrative subdivisions are inferred or merged.
- Existing six Dongjak name pairs: apps/web/lib/seoul-explorer-data.ts. Reused labels only; legacy fixture coordinates, building names and evidence are not imported.

Verification includes installed-data Korean/English query identity/count parity and map/list totals across paginated results. Unknown district/name combinations keep their original labels. Publication details and CI results are recorded in the pull request.

Review caught an additional coupling: Google fallback lookup/trust matching previously consumed the display title. Added a separate optional sourceName on map points and retained the former Korean parcel/name identity in both lookup and trust matching. Regression tests compare English/Korean map point inputs and preserve fallback behavior for other callers.

Local verification: production build and lint passed; full unit run passed 2,446 tests with one test-fixture query parameter issue, corrected and retested. Final focused map/alias suites passed 39 tests, including the added source-identity regression.
