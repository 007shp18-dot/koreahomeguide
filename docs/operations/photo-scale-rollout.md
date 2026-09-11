# Building photo rollout at inventory scale

The September 11 inventory contains 71,788 verified building records (57,915 Seoul,
13,873 Singapore). This is not a photo count. The previous Google discovery defaults
were five requests and an estimated USD 0.16 per day, with four scheduled runs per day.

## Automatic place association

The public photo reader now distinguishes manually reviewed images from provider
place associations. A pending Google place association is usable when the existing
photo-identity-v2 policy has confidence >= 0.95, name and country evidence, and
address, postal-code or <=250m location evidence. A provider photo source and place
ID are required. The canonical building must be verified. Rejected/broken records
remain excluded, and a manually approved image takes priority.

This does not mark a photograph visually reviewed. Pending rows and review events
are not rewritten. The public compatibility response carries publicationBasis:
provider-identity; its approvedAt compatibility field is the provider check time.
UI labels say Google Maps place photos. These can include interior or facility
images selected by the provider and are not advertised as inspected exteriors.

Place IDs are stored; photo URIs are obtained through the official SDK on display.
Google photos are not downloaded into our permanent image store. Attribution and
individual photo source links are retained. Street views remain click-only.
https://developers.google.com/maps/documentation/places/web-service/policies

## Capacity and costs

The Google schedule now runs every ten minutes with at most thirty candidates per
run: a theoretical ceiling of 4,320 searches per day before provider latency and
limits. Existing daily request and spend caps remain in force. Changing scheduling
alone does not increase the paid daily request allowance.

The authenticated photo-coverage endpoint includes rollout.current and inactive
proposals at 100, 1,000 and 4,000 requests/day. Estimates use the configured cost per
search (default USD 0.032), exclude retries and photo views, and do not promise that
every search yields a usable photograph. Budget increases are not activated.

The operations pipeline separates provider-ready associations from visual-review
and rights-blocked queues. NAVER discovery remains paused: 40,550 pending rows are
not 40,550 independently reusable, correctly matched building photos.

## Verification

Use the full-inventory public reader query, not pending-row counts, to measure
available associations. On the September 11 snapshot, this query selects 101 visual
reviews and six additional strong Google place associations. Five of the visual
associations were added in the accompanying source manifest. These small starting
counts must not be described as completion of the overall rollout.
