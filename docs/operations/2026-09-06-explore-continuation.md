# Prices and Explore continuation

Scope: Seoul/Singapore first. Dubai/Japan follow only after current navigation, data and content work is verified and released. The approved design document now records overseas investment and brokerage as the eventual business goal, with research buildings separate from actionable listings.

## Changes
- Prices selects Seoul or Singapore and submits q to that market.
- Seoul places district selection beside text search; primary results include unlocated and unpublished-price buildings, initially 24 with continuation. Map eligibility depends on valid coordinates, not price publication.
- Singapore exposes the complete repository project list, filters project/street/district, sorts and pages 24 results. The all-regions view has results immediately. Selection drives project map points.
- Google authentication failure retains list access. Missing credentials no longer place address-only projects at invented center coordinates. Superseded asynchronous geocoding cannot install stale markers; ambiguous or invalid geocodes do not become pins.
- Existing shared palette and typography remain; filters use 48px controls, project actions at least 44px, readable 14px titles, neutral separators and mobile wrapping.

## Benchmarks consulted during prior investigation
- https://support.redfin.com/hc/en-us/articles/360001432632-Searching-for-Homes
- https://www.propertyguru.com.sg/property-for-sale
Adopt location-first controls, map/list selection and explicit result counts, without copying brand assets or listing claims.

## Validation and remaining gates
Production build passed (890 generated pages). Full unit run found three stale display assertions among 2,100 tests; corrected suites subsequently passed 60 tests. Google map suite including stale-request cancellation passed 8 tests. Type/lint rechecked on final source.

No claim of completed browser or production verification. Google Maps InvalidKeyMapError was reproduced in the prior production inspection and requires a valid browser credential. Coordinate coverage still depends on verified public projections; additional buildings in the list do not imply all have map positions. Search/detail return state and browser responsive checks remain release gates. Keep this change in PR until those gates are completed.

## District distribution follow-up

Production read-only DB inspection found 48,999 Seoul building identities and no stored building coordinates; public_entity_locations is empty. Verified legal addresses are now loaded in one bounded query for the current Explore page and passed to NAVER geocoding. Parcel-address matches must agree on the parcel number; unknown positions are never plotted at district centers. Nearby verified coordinates cluster at district zoom and separate at building zoom.

Neighborhood counts aggregate the whole matching district inventory before pagination and link to server-side neighborhood search. They describe evidence buildings, not live property listings. The map remains explicitly scoped to the current page; full-city coordinate ingestion is still outstanding. Existing navy/white typography and controls are retained. Dubai/Japan stay deferred until Seoul/Singapore flows are working.

Regression checks cover full-inventory neighborhood totals, missing/invalid coordinate exclusion, clustering/zoom, exact-parcel geocodes, and address hydration with an empty projection store. Reviewed 12 design-review screenshot updates reflect the corrected contract period/home sample, not a new theme.
