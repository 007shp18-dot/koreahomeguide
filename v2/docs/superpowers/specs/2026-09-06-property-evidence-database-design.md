# SignedPrice property evidence database design

Date: 2026-09-06

## Goal

Move the verified transaction evidence that is actually present in the checked-in Seoul and Singapore artifacts into Neon, preserve the artifact readers as the public fallback, and expand the verified identity data used by photo matching. All changes and operational artifacts stay under `v2/`; Dubai remains untouched.

## Source boundary

The installed snapshot registry counts do not all describe row-level transaction payloads. The source shapes are:

- Singapore private sales: 133,942 row-level transactions for 3,862 projects.
- Seoul rent: 177,641 published recent transaction rows attached to 48,999 building summaries; the artifact reports 340,704 source records but does not contain every source row.
- Seoul sale: 62,678 published recent sale rows attached to 22,720 building summaries; the artifact reports 76,570 source records but does not contain every source row.
- Singapore HDB: 10,011 block summaries derived from 462,792 source rows. Each block contains rental and resale sample counts and medians, while the source transaction rows are absent.

The database must never manufacture missing source rows or property identities. It stores all 374,261 transaction records present in the artifacts as source records. Of those, 361,760 have a verified target in the immutable 62,872-property inventory and become observations. The remaining 12,501 Seoul sale rows belong to 8,916 sale-only building IDs outside that inventory; they retain their content hash and raw source fields without an invented entity link. HDB block medians and sample counts use metric observations. Dataset and release metadata retain the full upstream record counts and installed snapshot SHA-256 digests.

## Evidence storage

Existing `rights_policies`, `datasets`, `source_records`, `observations`, `evidence_releases`, `metric_definitions`, and `metric_observations` tables remain the canonical schema. An additive migration adds only the indexes and constraints needed for deterministic replay.

Every source row receives a stable business key derived from its dataset identity and artifact position, plus a canonical content hash. An observation refers to the existing property entity ID and its source record. Replaying the same artifact must not change row counts or content digests. A changed future source row creates a new immutable source record rather than overwriting prior evidence.

The public site continues to read its verified compressed artifacts for aggregate distributions. The new database seed is an independently queryable evidence mirror and verification source. Public read cutover is deferred until a database projection can reproduce every currently published aggregate; the existing artifact fallback remains enabled throughout this work.

## Location and building facts

Singapore private-sale records include official URA SVY21 project coordinates. A coordinate is accepted when the project records agree within 250 metres and the converted WGS84 point falls within Singapore bounds. The 3,403 unambiguous projects populate both legacy and global entity coordinates plus `public_entity_locations`; the 459 projects without coordinates remain unverified.

The 795 approved K-apt profiles remain in `building_facts`. Their named schools and subway stations are additionally normalized into `nearby_places` with stable provider IDs, source attribution, and available walk-time bands. No distance or coordinate is invented when the official payload omits it.

## Photo throughput

Existing approved photos keep priority. NAVER and Wikimedia backfills use bounded concurrency, durable retry state, provider health pauses, and limits that fit the Vercel function duration. NAVER candidates remain live review leads and are never persisted as public image URLs. Wikimedia candidates continue to require identity and rights review. Google remains capped at five paid searches and USD 0.16 per day, approximately USD 5 per 30 days.

The production schedule increases free-source throughput only after the same bounded batch passes twice on the Neon test branch. Coverage reporting separates approved exact/provider photos from checked-unavailable and incomplete entities.

## Acceptance

- Property IDs and the expected legacy/entity digests remain unchanged.
- The evidence seed reports exactly 374,261 source records, 361,760 linked observations, 12,501 unlinked Seoul sale source records, and 40,044 HDB metric rows.
- Replaying the evidence and location seeds changes no counts or deterministic digests.
- Singapore private coordinates publish for 3,403 unambiguous projects; the 459 projects without source coordinates remain unset.
- K-apt schools and subway stations persist with no invented distances.
- Google cost caps remain unchanged; NAVER and Wikimedia batches are bounded and retry-safe.
- Existing compressed artifacts remain installed and readable.
- Dubai table counts, data digests, routes, and media remain unchanged.
- Lint, typecheck, tests, build, and representative production browser checks pass.
