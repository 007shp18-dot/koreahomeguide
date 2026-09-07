# Explore identity lookup and additive backfill

The production building-facts API took 8.87 seconds on the measured stored Yongsan Central Park request. Its route eagerly loaded and validated the full sale/rent evidence repositories before looking up one identity.

Prebuild now generates a compact identity index from the union of the installed rental inventory and sale identities. The API reads that index, preserving district, original name, housing type and neighborhood matching. The original price evidence and official facts cache are unchanged. The union contains 57,915 buildings, including 8,916 sale-only identities. The index is regenerated at each build and traced into the facts function.

The property seed source now includes this union. The separate `backfill-seoul-sale-identities.mjs` runner defaults to dry run and accepts `--apply` with DATABASE_URL. It inserts missing buildings, geographies, property entities and external identifiers without updating existing rows or fabricating coordinates.

Production additive backfill completed six atomic batches of 200: **1,200 buildings, 1,200 property entities and 1,200 external identifiers**. The next statement failed with the Neon 512 MB project storage limit. The database reports 50,199 Seoul buildings and 503 MB total database size; project accounting can differ from this database-only size. **7,716 candidate buildings remain.** No existing rows were deleted to make room. Rerunning the insert-only runner after capacity is available skips completed rows safely.

The 459 Singapore projects without source coordinates remain unresolved; no coordinates were inferred. Capacity must be addressed before further persistent enrichment.

Validation: targeted seed, route-handler and configuration checks pass; the production build includes the generated index. Deployment response timing is verified separately after publication.

The concurrent Singapore nearby-place production deployment failed at prebuild with the same Neon size limit. Optional nearby-place seeding is now an explicit existing `db:seed:singapore-nearby` operation, separate from app build. Schema migrations remain mandatory. This preserves the nearby-place implementation and seed runner while allowing app fixes to deploy without retrying a full data write into a full database. Singapore nearby-place publication is not claimed complete.

Post-deployment checks returned valid official facts for Yongsan Central Park, Dobong Daewon Green and Dongjak Boramae Parkville, but end-to-end requests still took 7.65–10.48 seconds. Do not claim a measured latency improvement from identity indexing alone. A follow-up removes a redundant facts request when the location API already returns a verified road address. The shared NAVER resolver now compares road building numbers with roadAddress, and parcel numbers with jibunAddress; the previous parcel-only comparison could reject valid road addresses across Seoul. Regression checks cover accepted road numbers and rejected wrong road/parcel numbers.
