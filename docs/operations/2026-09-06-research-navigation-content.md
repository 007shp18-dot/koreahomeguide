# Research navigation and content — 6 September 2026

Implements the approved global residential investment research direction. Work starts from main 8f60b55, preserving the database and building-photo improvements in #145–146.

## Findings

- `/news/` used EditorialGrowthPublicFrame's independent header while Markets, Prices and Guides used SiteHeader. Guide articles also highlighted News.
- The newsroom migration removed the live-feed entry point. The operating `/api/news/` returned 711 items on inspection: 293 Naver, 417 Google RSS and one SignedPrice brief. No credential change was required.
- Singapore Explore repeated the city above a long title, and local tabs appended Limited badges. Simplify the title to Explore and keep capability detail in the evidence views.
- English building facts mixed Korean error copy with English. Keep unavailable information explicit in the selected locale.

## Changes

One actual shared header, compact hub headings, restrained article/figure framing, external-headline preview and filter, 15-minute refresh with visible loading/failure states, seven expanded English guides and five expanded analyses/data stories. Three additional figures distinguish URA observations from worked cost examples. Negative changes now extend left of a shared zero baseline. Buying guides are prominent on home and market pages, and articles connect to relevant tools and further reading.

Existing release IDs and observation periods on the four original charts remain unchanged. Supplemental figures carry their own official-release or illustrative-calculation provenance. Updating prose does not refresh its underlying data period. No individual author or reviewer is asserted in public UI.

## Research and reference checks

- Savills World Cities residential research: https://www.savills.com/research_articles/255800/388185-0 — concise finding, market context and related research hierarchy.
- PropertyGuru directory: https://www.propertyguru.com.sg/condo-directory — building identity and comparable project details.
- URA Q2 2026: https://www.ura.gov.sg/news/media/pr26-57/ — non-landed CCR +1.8%, RCR −1.2%, OCR −0.1% q/q; separate price, rent and vacancy concepts.
- IRAS BSD, ABSD and FTA remission pages linked in the Singapore guide. S$2m worked example: BSD 69,600, standard foreign-individual ABSD 1,200,000; no remission assumed.
- Invest KOREA acquisition laws, Seoul land-permission registry, Seoul housing guide and Easy Law foreign-tenant guidance linked in relevant guides. Avoid universal eligibility or deadline claims.
- Rental worked example: 300m × 4% / 12 = 1m; 50m × 4% / 12 + 900k = 1,066,666.67; break-even 10.8m / 250m = 4.32%.

## Verification scope

Shared navigation and current tab, external-feed recovery/filtering, signed chart geometry, article source and date contracts, production build, browser desktop/mobile layout and existing critical journeys. Production API freshness must be verified independently of fixture-based browser tests.
