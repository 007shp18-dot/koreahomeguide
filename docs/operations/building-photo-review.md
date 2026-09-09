# Building photo review

The public photograph is an editorial decision about a canonical building or project. Search links and identity scores are private discovery evidence. A score does not constitute a visual review.

The September 2026 audit found 84 approved photos and 40,451 pending rows. Of the pending rows, 40,430 were NAVER results without independent license evidence; 34,480 did not match the building name in their title. There were 13,882 distinct URLs. NAVER discovery is paused and its scheduled crawl removed. Existing candidates remain available privately. Google and Commons can now search buildings with a pending candidate from another provider, under the existing request and cost limits.

## Queue

Use the existing `CONTENT_ADMIN_SECRET` bearer authorization with `/api/internal/building-photo-approval/`. Never place the secret in a URL, screenshot, checked-in file or browser storage.

GET accepts `source=wikimedia|google|naver-search|manual`, `market=seoul|singapore|dubai`, `status=pending|approved`, `limit=1..100`, and `afterId`. It returns oldest IDs first and a `nextCursor`. For the next page, use the same filters and `afterId=nextCursor`.

Each item supplies canonical identity/address/coordinates, asset or place ID, source and license links, candidate evidence, dimensions when available, and `assetUseCount`. Repeated assets across buildings need separate identity decisions.

## Decision

Inspect the real image, source page, author/license and location evidence. An exterior must clearly depict the intended building at the displayed size; neighboring buildings may be present. Do not require an isolated building composition. An estate or parent development photograph must be labeled `site-aerial` (the legacy field mapped to parent-project presentation). A playground, trail, unrelated building, interior, render or unfinished site cannot be labeled as the intended building's exterior. A valid facility/interior photograph needs its own accurate gallery role instead of being discarded solely for not being an exterior.

POST a single stored candidate decision:

```json
{
  "candidateId": "193",
  "checkedAt": "2026-09-09 12:00:00.123456+00",
  "decision": "approve",
  "subjectKind": "building-exterior",
  "visualReviewed": true,
  "note": "Describe the observed exterior and its identity, source and rights evidence."
}
```

Copy `candidateId` and `checkedAt` exactly from the queue; the timestamp includes PostgreSQL microseconds. Use `decision=reject` for a wrong subject/identity or `broken` for an unusable asset; those decisions need a note but no positive visual confirmation. Retraction of an approved item is supported through the same reviewed action. `status=approved` exposes existing approvals for audits.

The endpoint does not accept replacement URLs, building names, addresses or provider claims. Commons approval requires stored reusable license and source evidence. Google approval requires the stored exact place and provider-display source. NAVER discoveries cannot be promoted merely by changing the status to licensed. New sources and owned assets need a reviewed ingestion path with their rights evidence before this approval endpoint can support them.

`409` means missing rights evidence or a stale/competing decision; reload the candidate and inspect the current version. An existing public approval is not silently overwritten: retract it first, then approve the reviewed replacement. Every successful transition records a snapshot and note in `building_photo_review_events` in the same database statement.

## Publication and recovery

Public callers keep using their stable registry key. Private candidate IDs are unique by provider and canonical building. At most one row per publication key is approved. Photo lookup also checks the canonical building ID for Singapore, where project-name keys can collide.

Approved legacy rows are projected by the existing `/api/internal/public-entity-projection/` job. Readers reject retracted approvals immediately when fetched; existing page/CDN caches can persist until their normal revalidation. Seoul and Singapore detail pages use a 3,600-second revalidation interval. The publication job refreshes materialized media; a deployment refreshes page caches. A configured database failure produces city context or an unavailable state instead of reviving static revoked photos.

For the 9 September release, pause the existing Google and Commons writers, apply migrations 0018/0019 and the candidate-specific [review manifest](./photo-review-2026-09-09.json), and refresh the media projections before the production build. This keeps the first cached detail response consistent with the reviewed decisions. Resume Google and Commons after the new provider-aware writer is deployed; keep NAVER paused. Three Google rows need a follow-up inspection of their actual SignedPrice primary: a Google Maps listing hero does not establish which provider-selected image the site renders.

Do not resume the NAVER crawl until a source/rights enrichment path and an operating review cadence exist. Preserve provider-specific retries and spending caps. Track usable approved coverage, source failures, duplicate asset uses and reviewed/rejected throughput separately from raw candidate count.
