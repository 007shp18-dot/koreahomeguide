# Property and area decision panels

Buyers need interpretation beside the selected price data. The previous disclosure required scrolling below that data and did not change its advice for different households.

## Behaviour

- Desktop property details open an independently scrolling right panel. Closing, expanding or changing perspective preserves the main data tree and query conditions. Smaller screens open a native full-screen dialog on demand.
- Three perspectives change the conclusion, summary, ordering, advantages, tradeoffs and contract questions. Reports select up to five evidenced priorities. No numerical lifestyle score or fair-value band is invented from qualitative commentary.
- Korean, English and Simplified Chinese reports cover 100 reviewed properties. Existing white/grey surfaces, typography, control dimensions and blue primary actions remain; decorative blue tab underlines are removed.
- Tokyo area selections and Dubai area details use area reports where named local examples have been reviewed. Each example retains its property name; an individual building's facilities are never attributed to the whole area. Tokyo's map stays available inside the data column while the report is open.
- Price context retains currency, transaction type, period, sample, geographic scope and any published interquartile range. The latter is a transaction distribution, not a valuation band. Suppressed property cohorts can use a separately labelled broader property or district/region cohort.
- Tokyo area medians come from the same pinned publication and complete filtered cohort as the transaction list, including search, size, housing type and superseded-release selection. Pagination does not change that median. Verified locality aliases handle spelling differences without matching a neighbourhood solely from its ward name.

## Verified price coverage

- Seoul reviewed catalogue: 24 property sale/jeonse cohorts and one published district comparison; all 25 monthly-rent cohorts publish a price. Installed period: February–August 2026.
- Singapore reviewed catalogue: 25 published project prices. Installed period: August 2021–August 2026. Insufficient project cohorts can use a published CCR/RCR/OCR reference.
- Dubai verified installed snapshot: 24 project prices and one area comparison. Period: 8 June–5 September 2026.
- Tokyo read-only production aggregate: 24 neighbourhood references and one Shibuya-ward reference, all activated 2026 Q1 publications. Anonymous transactions remain area prices.

## Public community research

The follow-up adds 86 localized viewing checks from 83 retained public discussion, user-review and resident-interview URLs. They are relevant to all 100 reviewed profiles: 25 each in Seoul, Singapore, Dubai and Tokyo. This is relevance coverage, not a claim of 100 verified resident testimonies. The 100 price references above are a separate coverage measure.

Each check retains its inspected source, date, limitations and mapping scope: 56 named-property discussions, 20 area-context checks and 10 comparable-setting checks. Named-property means the property is explicitly discussed; it does not verify the commenter's identity. Dubai evidence remains area/comparison context for the reviewed projects. The final research pass added La Classy and nine Tokyo properties after directly reading their public review paragraphs and discussion threads. The earlier gaps reflected incomplete investigation, not inaccessible sources. Older posts retain their dates and support current viewing questions rather than assertions about current conditions.

Community questions appear immediately after the five priorities, adapt to the selected perspective and retain the existing financial assessment. Current defects, prices, yields and consensus are never inferred from anecdotes. The city audit files under `docs/research/community-*-20260914.md` document direct evidence, regional applications, older sources and exclusions.

## Release verification

Model checks cover persona differences, evidence identities and qualifications, area versus property scope, unavailable prices, and actual Dubai catalogue coverage. Browser scenarios cover desktop layout, all three locales, report-only scrolling, close/expand/Escape focus handling, mobile modality and retry without losing data.

The local full unit run found one radius-rule failure; both offending radii were aligned with shared tokens and the relevant tests passed. The hosted verification job subsequently passed lint, TypeScript, the full unit suite, workbook QA, build and legacy gates. Hosted browser gates remain required because local downloads of the existing Google font assets and Playwright Chromium were unavailable in this environment.
