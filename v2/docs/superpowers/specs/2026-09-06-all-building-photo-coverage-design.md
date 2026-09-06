# SignedPrice all-building photo coverage design

Date: 2026-09-06

## Problem

SignedPrice has 62,872 seeded property entities in Neon: 48,999 Seoul entities, 3,862 Singapore private residential entities, and 10,011 Singapore HDB entities. Only 34 building photo approvals currently exist. The existing hourly enrichment route checks small batches against Wikimedia Commons and Google Places, but Google Places is returning HTTP 403, Wikimedia title matching creates false positives for generic names, one registry key represents only one provider record, and Seoul entities do not yet have the coordinates required for reliable identity matching or panorama fallback.

Search engines visibly contain many relevant photographs, but a search result is not itself a durable redistribution license. The system must acquire broad coverage without scraping result pages, copying provider-controlled images into SignedPrice storage, attaching a nearby building's image, or presenting a streetscape as an exact property photograph.

## Scope

All source, migration, test, operations, and documentation changes stay under `v2/`. The work covers Seoul and Singapore. Dubai data and routes remain unchanged.

The existing compressed JSON sources remain available as the read fallback throughout rollout. Existing approved photos retain their registry keys, attribution, and display behavior.

## Success definition

The backfill attempts every one of the 62,872 seeded entities and records a durable coverage state for each one. Every property page resolves to the best truthful visual available in this order:

1. an approved exact-property licensed or owned photograph;
2. an approved Google Places provider gallery for an exact matched place;
3. an approved parent-project photograph for a block or child entity;
4. a live NAVER Panorama for Seoul or Google Street View for Singapore, labelled as street view;
5. the existing neutral unavailable state when no provider has imagery.

Exact-photo coverage and visual coverage are reported separately. The system never claims 100% exact-photo coverage when a provider has no exact place or photograph. A completed backfill means every entity reached a checked state with a next retry policy, not that the application invented or mislabelled a photograph.

The target is at least one exact or provider photograph per building when an official provider returns one, with up to five current Google Places images in the gallery. Street view fills visual gaps without being classified as a building photograph.

## Source strategy

### Google Places

Google Places is the primary scalable photograph source for Seoul and Singapore. SignedPrice stores the stable place ID, match evidence, approval state, and review timestamps. It does not store Google photo names or image bytes. At render time, the browser or a short-lived server response obtains the current photo resources, author attribution, and Google Maps source link through the official API.

The production Google Cloud project must have billing and Places API (New) enabled. The existing key restrictions must allow the production server request and the approved browser origins. A provider health check records the response class without logging the key or full provider payload.

Google candidates may be approved automatically only when all available identity evidence agrees:

- the normalized provider name matches the canonical name or a stored alias;
- country and market match;
- postal code, district, or locality agrees with the seeded address;
- when both sides have coordinates, the place is within 250 metres of the entity coordinate;
- at least one photo exists;
- no conflicting phase, block, or tower identifier is present.

Candidates with incomplete or conflicting evidence remain private for review. Automatic approval writes `approved_by = 'provider-identity-policy-v1'` and records the match evidence and policy version.

### NAVER Image Search

NAVER Image Search is enabled as a Seoul candidate-discovery tool through the official Search API. The existing NAVER Search application credentials are reused when their Search permission covers the image endpoint; otherwise dedicated `NAVER_SEARCH_CLIENT_ID` and `NAVER_SEARCH_CLIENT_SECRET` values are configured in Vercel.

The API response is not treated as a photo license. Raw result pages, thumbnails, and response payloads are not persisted as public media. An authenticated review endpoint performs a live query for a selected building and returns temporary candidates with their source document links. A reviewer can promote a result only after the source is confirmed to provide a commercial reuse license or the rights holder supplies permission. The approved record is then stored as `licensed-url` or `owned-object` with the source page, attribution, rights status, and visual-review timestamp.

The backfill records that a NAVER query was attempted, the result count, and the next retry time, without retaining provider-controlled thumbnails. Calls are capped below NAVER's documented 25,000-request daily limit.

### Wikimedia Commons

Wikimedia Commons remains the first source for reusable image bytes. Candidate selection adds market, district, address, country, and category evidence. A title substring alone is insufficient. The selector rejects generic-name collisions, construction images when a completed exterior exists, interiors, logos, maps, and unrelated nearby subjects. Licensed candidates remain review-required unless an existing approval policy explicitly covers the exact file and property identity.

### Street-view fallbacks

NAVER Panorama is the preferred Seoul fallback and Google Street View is the preferred Singapore fallback. Both render through their official browser SDKs using verified coordinates. Provider logos and attribution remain visible. Panorama IDs may be stored where provider policy permits; image bytes are never copied into SignedPrice storage. The UI labels these views as street view and does not include them in the exact-photo count.

## Identity and coordinates

Photo matching depends on a verified identity layer. Before photograph discovery, the backfill normalizes names and aliases, geocodes legal or road addresses, and stores coordinate provider, precision, checked time, and evidence hash.

Seoul geocoding uses NAVER Maps Geocoding when server credentials are configured. Singapore uses the existing seeded coordinates where present and a configured official or Google geocoder for remaining project and block addresses. A geocode is accepted only when its returned country, postal code, district or town, and normalized address agree with the entity. Ambiguous results remain unverified and cannot trigger automatic photo approval.

Parent relationships allow an HDB block or tower to use a verified project photograph while clearly labelling it as a parent-project image. A project image is never presented as the exact block when the relationship is unknown.

## Data model

A new migration extends the enrichment model without changing the seeded entity IDs or digests.

`building_enrichment_attempts.pipeline` gains `photo-naver-search`, `photo-naver-panorama`, `photo-google-street-view`, and `photo-coverage` values. Attempts record provider status, reason code, retry time, and a non-secret evidence summary.

`building_photos` gains fields for match policy version, numeric match confidence, match evidence JSON, provider source URI, and provider checked time. Google records continue to use `provider_place_id` with no stored asset URL. Licensed and owned records continue to require an HTTPS asset URL, attribution, source page, and rights status.

A `building_photo_coverage` table stores one row per property entity with:

- exact-photo, provider-photo, parent-photo, street-view, or unavailable state;
- selected building photo or parent entity reference;
- provider and checked time;
- next retry time and terminal reason;
- attempt counters and policy version.

The table has a unique entity ID and is updated idempotently. A coverage summary view reports totals by market, housing sector, state, provider, and review status. Existing `public_entity_media` receives only approved photo records; street-view availability stays in the location/coverage projection.

## Backfill runner

The committed backfill runner is resumable and safe to invoke repeatedly. It selects unchecked or retry-due entities in stable ID order, claims a bounded batch, and writes an attempt after every provider call. Concurrent workers cannot claim the same entity.

Provider adapters run independently with configurable concurrency, daily request caps, and maximum spend guards. Defaults favor correctness over speed:

- Google Places: five concurrent searches with a configurable daily cap;
- NAVER Image Search: five concurrent searches and at most 24,000 calls per Korean calendar day;
- Wikimedia Commons: five concurrent requests with descriptive user agent and backoff;
- geocoding: provider-specific quota and exponential backoff.

The existing Vercel cron handles ongoing incremental enrichment. A separately authenticated operations endpoint starts bounded backfill slices and returns counts, cursor, cost estimate, and retry state. The initial bulk run is driven in repeated slices so Vercel's function duration is never used as an unbounded background process.

Rate limits, 429 responses, and temporary 5xx failures create retryable attempts with exponential backoff and jitter. Authentication or billing failures pause that provider globally and surface one actionable health status instead of writing 62,872 identical error rows. Exact no-match results retry monthly; approved provider matches revalidate yearly; broken images retry daily.

## Review and quality

The existing photo approval route is reused and extended for multi-candidate review. The reviewer sees the canonical building name, full address, map location, provider name and address, distance, source page, attribution, dimensions, and candidate image together.

Quality ranking favors:

1. exact exterior subject;
2. large landscape image;
3. clear daylight or blue-hour exposure;
4. unobstructed facade or complete project view;
5. current image over construction or demolition imagery.

The system rejects interiors, floor plans, advertisements, logos, unrelated skyline images, watermarks that obscure the subject, and images below one megapixel when dimensions are available. An approved building can expose one primary image and up to four additional provider images. Changing the primary image preserves approval history.

## UI behavior

Property detail pages render the gallery without exposing API keys. Every image displays the provider or photographer attribution and a source link required by that provider. Google author attribution is associated with the relevant image. Street view has a visible `Street view` or `거리뷰` label. Parent-project media states that it is not the exact block.

The page remains usable when a provider is slow or unavailable. Provider galleries time out into the next approved media tier, then the street-view or neutral fallback. Failed provider calls never replace an already approved photo.

An internal coverage page displays overall and per-market progress, provider health, daily usage, estimated spend, approval queue size, false-positive rate, and missing-coordinate count.

## Security, rights, and cost controls

All provider secrets remain Vercel sensitive environment variables and server-only code. Logs include provider, status class, route, and reason code but never credentials, signed image URLs, or full API responses. Browser keys are restricted to SignedPrice origins and the minimum APIs required; server keys are separately restricted by API and supported network controls.

Google images remain provider-display-only. NAVER search results are discovery evidence until a reusable license is proven. Wikimedia and owned assets preserve license and attribution metadata. Takedown or broken-photo actions immediately remove the public projection while retaining an audit record.

Bulk execution requires explicit daily request and spend caps. A dry run reports eligible counts and estimated upper-bound provider calls before paid requests start. The user has approved paid Google Maps usage, but the implementation still enforces a finite configured cap so a retry loop cannot create uncontrolled charges.

## Rollout

1. Add migrations, provider health checks, matching policies, and coverage reporting on the Neon test branch.
2. Add failing tests for generic-name collisions, exact Google identity, ambiguous addresses, provider outages, attribution, multi-photo galleries, and resumable job claims; implement each behavior through TDD.
3. Verify NAVER Image Search and Google Places against a small sample of Seoul and Singapore entities without publishing candidates.
4. Run a 100-entity test-branch backfill, manually inspect matches, and measure precision. Automatic approval remains disabled until the sample has no known false positives.
5. Run the same slice twice and confirm idempotent counts and stable approvals.
6. Apply migrations to Neon main, deploy the code with provider access enabled, and publish a small production canary.
7. Expand daily caps in stages while monitoring precision, provider errors, and cost. Existing approved photos always win during rollout.
8. Continue until every seeded entity has a current coverage row, then leave the incremental cron active for new and retry-due entities.

## Verification and acceptance criteria

- Seeded Seoul and Singapore entity counts and both existing ID digests remain unchanged.
- Dubai row counts, photos, and routes remain unchanged.
- Every seeded entity receives exactly one coverage row after the full backfill.
- Re-running any batch does not duplicate photo, coverage, or attempt records.
- Google photo bytes and expiring photo names are absent from persistent storage.
- NAVER raw image-search responses and thumbnails are absent from persistent storage.
- Every public exact photo has verified identity, source, attribution, rights state, approval actor, and visual-review timestamp.
- Google provider images show the required author attribution and source access.
- Street-view and parent-project media are visibly labelled and excluded from exact-photo metrics.
- Authentication, quota, and billing failures pause only the affected provider and preserve prior approvals.
- Lint, typecheck, full unit tests, production build, and browser checks pass.
- Browser verification covers representative Seoul, Singapore private, Singapore HDB, no-photo fallback, provider outage, and unchanged Dubai routes.
