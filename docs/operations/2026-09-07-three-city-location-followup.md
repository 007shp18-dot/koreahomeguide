# Three-city location follow-up — 2026-09-07

## Seoul: 92 additional source-backed apartment matches

Extended the OA-15818 batch from 663 to **755** stored locations. Read-only reconciliation returned 755 buildings, 755 global entities and 755 verified public projections; 92 entities record `exact-name-district-neighborhood` as their match method. Four mutation batches returned 13, 9, 22 and 48 identical building/entity/projection counts.

The source and digest are unchanged from [the first seed](2026-09-07-seoul-official-coordinate-seed.md). The extension requires a unique normalized apartment name, identical district and legal neighborhood, verified identity, no conflicting existing road address or K-apt code, and wholly missing coordinate pairs. It never overwrites a verified location. Ambiguous source name identities are removed across the entire source before batching.

Review caught a district/address conflict for 해태보라매타워 (source district 동작구, road address 관악구). It was excluded before any writes. Both the normalizer and SQL now require the source road-address district to match source district metadata. The revised normalizer accepts 2,799 records, or 2,795 with `--named`: 56 inactive/non-Seoul addresses, 2 district/address conflicts, 29 missing coordinates and 4 ambiguous/incomplete name identities are excluded.

Reproduce with `python v2/scripts/prepare-seoul-official-coordinates.py source.csv normalized.json --named`, then review candidates before running `v2/apps/web/scripts/seed-seoul-named-coordinates.sql` with the normalized JSON as `$1`. Apply the existing rights policy first. Filter the complete deduplicated source against current inventory before batching. Keep the SQL's second district check even after upstream normalization.

**Remaining:** 57,160 of 57,915 registered Seoul buildings lack stored coordinates. This apartment source cannot fill the villa, officetel and detached inventory. Stored parcel points do not establish surveyed entrances.

## Singapore: preserve honest selection when project coordinates are missing

The current URA snapshot has 3,862 projects and 133,942 transactions. Coordinate audit found 3,403 projects with usable source points, 459 without X/Y, and no conflicting points beyond the existing 250 m threshold. Of the missing projects, 455 have a same-district reference anchor and four do not.

Selecting a project without a coordinate now highlights its approximate district group even when the general approximate-groups toggle is off. The preview states that the exact location is unavailable, and the map stays at district scale. It does not create an individual project marker or count the district group as a located project. Known points retain compact dots and only the selected project carries its name.

An additional official URA source was identified: [No of Dwelling Units](https://data.gov.sg/datasets/d_be71daeab5930f96b90ad2857454d876/view), with project names, postcodes and point geometry. Its download endpoint returned HTTP 403 / Cloudflare error 1010 in this environment. No data from that blocked download was imported. [OneMap Search](https://www.onemap.gov.sg/apidocs/search) requires an authorization token; none was available for this task. No new Singapore coordinates were claimed or written.

## Dubai: reduce duplicate lookups and reject misleading locations

Current published Dubai evidence consists of **46 area summaries**, not a building inventory. Shared Google geocoding now caches in-flight promises as well as resolved results within the map runtime. Rapid selection/filter changes reuse pending lookups. No-match/ambiguous/out-of-market results remain cached for that runtime; transient service errors are evicted so a later action can retry. Superseded requests cannot mount stale markers.

Partial matches and results consisting only of city/country/broad administrative types are rejected, preventing a Dubai city-center point from being shown as an individual area. Actual neighborhood results retain their provider viewport. This does not create building-level Dubai coverage. DLD/Dubai Pulse building source access remains required; no new building coordinates were imported and no paid plans were changed.

## Validation

Six Python normalization regressions and 20 Google/Singapore map tests and two source-coordinate tests passed. Tests cover shared pending requests, negative caching, transient retry, city/partial rejection, superseded selection, approximate district selection and wide district framing. Production build passed. Deployment is checked separately during delivery. The changes reduce repeated requests within one map runtime; no claim of measured billing or overall load-time reduction is made.
