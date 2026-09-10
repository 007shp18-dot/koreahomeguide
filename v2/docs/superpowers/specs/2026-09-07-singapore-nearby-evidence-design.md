# Singapore Nearby Evidence Design

## Goal

Publish useful nearby MRT/LRT and MOE school facts on SignedPrice Singapore project and HDB block pages, using reproducible official sources and the existing `nearby_places` database projection.

## Scope

- Changes stay under `v2/` and deploy only to the SignedPrice Vercel project.
- Private projects use their existing URA-derived coordinates.
- HDB blocks use the official HDB Existing Building polygons. Each inventory street is mapped once to an HDB street code using the code mnemonic and whole-street block-set similarity. Ambiguous mappings and street codes claimed by multiple inventory streets fail closed. A 4.5 km median town-centre bound provides a second location check; an unmatched block remains usable and simply has no nearby panel.
- The checked-in Singapore market snapshots remain the fallback for price and property evidence.
- Only the nearest rail station and nearest MOE school are stored for each coordinate-ready building. Distances are straight-line Haversine distances, rounded to whole metres; walking-time claims are omitted.

## Sources and provenance

- Rail exits: LTA MRT Station Exit GeoJSON, data.gov.sg dataset `d_b39d3a0871985372d7e1637193335da5`.
- Schools: MOE General information of schools, data.gov.sg dataset `d_688b934f82c1059ed0a6993d2a829089`.
- School coordinates: a 337-row MOE school snapshot geocoded with OneMap. The builder supports a fresh official MOE download plus rate-limited OneMap collection, while the checked source snapshot makes the release reproducible without live network access.
- HDB coordinates: HDB Existing Building GeoJSON, data.gov.sg dataset `d_16b157c52ed637edd6ba1232e026258d`.
- The generated gzip artifact records source URLs, collection time, counts, and a deterministic identity digest.

## Data flow

`build-singapore-nearby-places.mjs` uses verified source snapshots when present and otherwise downloads the official datasets, geocodes school addresses through a rate-limited resumable OneMap cache, validates identities, computes nearest places, and writes `data/singapore-nearby-places.json.gz`. A clean collection fails when neither the verified school-coordinate snapshot nor OneMap credentials are available. The release artifact contains 26,486 rows for 13,243 coordinate-ready buildings: 3,403 private projects and 9,840 HDB blocks. All 337 schools were located; 171 HDB identities remain unmatched. Its row digest is `17a2fe2779c8a5c43d89ca71e3be08b98f7c5afee3f63522069ae0b5c12025d9` and its source digest is `47f84ca5c630d9d091f090f9df7ccbe62b40491abc98f6805872bf6e00e13641`. The source digest includes the algorithm version and the complete private inventory with nullable coordinates so a changed or removed project forces stale-row pruning.

`singapore-nearby-place-source.mjs` validates and loads that artifact. `seed-singapore-nearby-places.mjs` loads bounded batches into an isolated generation staging table, verifies the staged identity count and digest, then publishes the complete generation and prunes the previous one in a single database transaction. A failed or interrupted staging run cannot expose mixed nearby facts. The seed verifies the published total and digest and becomes a no-op on a second run. The Vercel production prebuild runs this seed after schema migration; preview and local builds skip it.

The public projection reader resolves `nearby_places.building_key` through `property_entities.local_attributes.legacyBuildingKey`, so the existing Seoul projection and both Singapore entity kinds use one query. Singapore server pages request the projection by entity ID and pass proximity data to a shared presentational component.

## Failure behavior

The collection job retries transient responses and persists its OneMap cache after each bounded batch. Missing or ambiguous coordinates are counted and skipped. Runtime database failures do not break a detail page; the nearby section is omitted while the existing snapshot-backed content still renders.

## Verification

Tests cover dataset parsing, exact address selection, distance calculation, deterministic output, Singapore-only idempotent seeding, cross-market projection lookup, and server-rendered nearby facts. Production verification checks DB counts/digest, replays the seed, opens representative private/HDB pages, and confirms Seoul and Dubai remain available.
