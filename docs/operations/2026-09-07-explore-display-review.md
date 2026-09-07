# Explore display and identity review — 2026-09-07

## Findings and shipped scope

Singapore project mode explicitly disabled clustering. Every unselected project also received a full name label, obscuring both the map and selected building. Google POI popups added unrelated content. Enable clustering at all project levels, render unselected properties as dots, keep one selected name, retain group counts, and disable native clickable POIs. Missing SDK zoom now uses overview clustering rather than an assumed close zoom. These changes reuse existing client clustering and do not add per-pan database queries.

Seoul projection hydration incorrectly classified inventory `legal_address` values as verified map addresses merely because the building identity was verified. Seed addresses can be district/neighborhood/name strings, not verified postal addresses. Hydration now uses nonblank official `road_address` values. Unknown addresses continue through the existing selected-building official lookup and strict geocoding match. An area reference must never be represented as an exact building coordinate.

Completed the interrupted insert-only Seoul sale identity backfill after the user's Neon upgrade: remaining 5,116 buildings, property entities and identifiers were inserted through the existing idempotent script. Database verification: 57,915 Seoul building identities, 727 nonblank road addresses, zero persisted coordinate pairs at verification time. This completes inventory identity coverage, **not** exact map coverage. Browser geocoding and public projections are separate from this stored-coordinate count.

## Reference review and product rules

- [Zillow search guide](https://www.zillow.com/learn/zillow-advanced-search/) describes filtered colored map dots, with property information on selection. Apply that hierarchy: filter, locate, select, inspect details.
- [PropertyGuru Singapore](https://www.propertyguru.com.sg/property-for-sale) presents property listing cards; [its official app listing](https://apps.apple.com/au/app/propertyguru-singapore/id482524585) describes interactive map and nearby amenities. Keep building identity/location distinct from the transaction evidence card.
- [Bayut Map View](https://www.bayut.com/agentportal/bayut/) describes location context relative to transport, schools and work. Its live listing page was blocked by a security check; no claim of interactive competitor verification is made.
- [Zigbang real-estate services](https://company.zigbang.com/what-we-do/real-estate-service) emphasizes apartment and unit information. Korean administrative-area names alone cannot stand in for exact building locations.
- [Google marker clustering](https://developers.google.com/maps/documentation/javascript/marker-clustering) recommends grouping nearby markers for readability. Existing clustering is sufficient for this fix; no library migration is needed.

These are SignedPrice implementation rules inferred from the references, not claims that every competitor uses identical logic:

1. Overview: area/count groups. Close zoom: property dots. Selection: one name and one consistent details card.
2. Price belongs in the list/detail card; no price marker is needed. Transaction type, sample and evidence date remain explicit.
3. List and map use the same filters; cluster count, located-property count and area-only count have different meanings.
4. Official building name first; verified address as fallback. English transliteration is display-only and must not replace the original lookup identity.
5. Never invent coordinates from a neighborhood center. Unresolved buildings need explicit location status, while their transaction evidence remains accessible.
6. Reuse verified coordinates and cached facts. Do not geocode the entire dataset on each visit or query the database on every map movement.

## Validation and remaining work

76 relevant automated tests passed across Google map rendering, dense 1,106-project membership/label regression, Seoul map, address hydration, building-location API and Singapore coverage. Regression tests failed before the corresponding fixes. Build and deployment verification are recorded in the delivery update.

Next priority is a source-backed coordinate coverage pipeline: match stable building IDs to official address/parcel records, record provenance and match precision, persist only verified locations, and verify district-level counts. Representative successful markers do not establish full Seoul coverage. Measure request frequency, payload size, cache hit rate and p50/p95 latency before promising cost or loading improvements. No additional Neon/Vercel plan change was made by this review.
