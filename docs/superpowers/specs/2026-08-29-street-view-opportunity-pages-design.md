# Street View Stability and Opportunity Pages Design

## Purpose

Fix the remaining Explorer Street View instability, then add evidence-led Seoul rental discovery pages that accept the two constraints foreign renters commonly know before they know a legal-dong name: monthly budget and available deposit.

## Scope

### Included

- Stable, large 16:9 Street View in the building drawer for English and Simplified Chinese Explorer.
- Initial camera heading from the NAVER panorama capture point toward the selected building.
- Panorama resize synchronization after reveal and when the media frame changes size.
- A non-clipping building sort control in the narrow Explorer rail.
- Dynamic English and Simplified Chinese opportunity pages for approved monthly-budget and deposit slugs.
- Server-rendered neighborhood rankings from three completed months of reported MOLIT rental contracts.
- Canonical, hreflang, Dataset JSON-LD, evidence thresholds, `noindex` fallback, sitemap discovery, and Explorer/Rent Check handoffs.
- No new Vercel function file; existing `seo-dong-page` and `sitemap-market` handlers are extended.

### Excluded

- Station or landmark pages, commute-time claims, listings, asking-price scraping, reminders, email storage, and referral commerce.
- Claims that a matching reported contract is currently available.
- Aggregating all property types into a single deposit page in this release. The first deposit pages are explicitly labelled as officetel evidence even though the concise search URL omits the type.

## Street View behavior

- The loading skeleton, ready canvas, empty message, and error message reserve the same 16:9 media frame.
- Legacy 120/126/170/190 px height rules must not determine the final drawer media size.
- On a successful `pano_status`, read `panorama.getLocation().coord`, calculate the initial bearing from the capture point to the selected building, normalize it to NAVER's -180 to 180 range, and call `setPov` with `tilt:0` and `fov:90`.
- Synchronize the SDK viewport with the visible media frame through `setSize` after success and on frame resize. Ignore stale callbacks after another building is selected or the drawer is closed.
- If either coordinate is invalid, retain a neutral north-facing fallback without throwing.

## Opportunity-page model

### Routes

- Budget: `/seoul/:type/under-:won-won/` and `/zh/seoul/:type/under-:won-won/`.
- Deposit: `/seoul/deposit/:amount/` and `/zh/seoul/deposit/:amount/`; this release uses officetel evidence and says so in title, heading, methodology, and result labels.

### Approved slugs

- Budget: `under-700000-won`, `under-1000000-won`, `under-1500000-won`.
- Deposit: `5-million-won`, `10-million-won`, `20-million-won`, `30-million-won`, `50-million-won`.
- Unsupported or malformed slugs return 404 rather than generating arbitrary crawlable pages.

### Evidence and ranking

- Consume the existing three-month Seoul-wide dong aggregates and their deposit bands.
- Budget pages select only deposit bands whose median monthly rent is at or below the ceiling.
- Deposit pages select only the band containing the target deposit; band boundaries remain half-open, consistent with the existing rent-market engine.
- A neighborhood result requires at least three matching contracts in the selected band.
- Rank matching neighborhoods by median monthly rent ascending, then matching-contract count descending, then stable district/dong labels.
- An opportunity page is indexable only with at least three qualifying neighborhoods and at least fifteen matching contracts in total.
- Sparse pages remain useful when requested but carry `noindex,follow` and are excluded from the opportunity sitemap.

## Content and handoff

- First viewport states the constraint, property type, evidence window, and number of qualifying neighborhoods.
- Each neighborhood card shows district/dong, contextual median monthly rent, contextual median deposit, matching-contract count, and a direct Explorer link.
- Copy consistently describes reported signed contracts, not availability or listings.
- A method block explains the time window, median-band rule, evidence threshold, source, and data-through month.
- Calls to action lead to Explorer and Rent Check with the relevant type and constraint prefilled where supported.

## Accessibility and responsive behavior

- Sort label and select form a full-width stacked control inside the building rail and never truncate the selected option.
- Opportunity cards use semantic ordered lists and links with visible focus states.
- Tables are avoided for the primary mobile ranking; cards collapse to one column under 720 px.
- English and Chinese expose equivalent information and KRW remains primary.

## Acceptance criteria

- Street View has identical loading and ready geometry at desktop and mobile breakpoints.
- Cardinal and diagonal bearings are correct and normalized for NAVER Panorama.
- Successful panorama callbacks set both the measured SDK size and building-facing POV.
- Explorer building sort has zero horizontal overflow at a 320 px rail width.
- The example URLs `/seoul/officetel/under-700000-won/` and `/seoul/deposit/10-million-won/` return localized, server-rendered pages when evidence is sufficient.
- Unsupported opportunity slugs return 404.
- Sparse opportunity pages are `noindex,follow` and absent from their dynamic sitemap.
- Existing function count remains at or below eleven.
- All existing tests, new focused tests, syntax checks, and production build/deployment verification pass before completion is claimed.
