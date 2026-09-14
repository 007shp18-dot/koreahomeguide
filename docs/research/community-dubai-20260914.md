# Dubai community research — inspected 14 September 2026

## What was inspected and what this supports

The retained dataset contains **21 viewing checks, 21 unique opened public discussion URLs, and mappings to all 25 reviewed Dubai profiles**. Posts and replies were inspected, rather than treating search snippets or brokerage summaries as resident evidence. These are a mixture of self-described resident experiences, prospective buyers’ questions and public replies. Commenter identity and reported conditions have not been independently established. Nothing was posted, and no authentication barrier was bypassed.

Coverage means a relevant question is available for a profile. It does **not** mean 25 buildings have resident reviews. There are **zero verified firsthand resident accounts for the exact reviewed off-plan tower/registered phase** in this research. The content is designed to guide a visit or request for documents; it does not establish a current defect, travel time, utility tariff, return, completed facility or transport opening.

Each retained record contains Korean, English and Simplified Chinese titles, interpretation and a concrete viewing question. Forum names, quotes and citation markers are kept out of the product copy. URLs, inspection dates, source context and uncertainty remain in the internal dataset and this audit. A user-facing question should not be presented as a measured fact or consensus.

## Mapping strength and direct-project gaps

`mappingScope` is intentionally conservative and applies to the entire record:

- **`named-property`: 0 records.** No record claims verified direct evidence for every registered profile it maps to.
- **`area-context`: 13 records.** Discussion concerns the shared neighbourhood or master community, and yields an area-specific check. This still does not establish conditions in a new tower.
- **`comparable-setting`: 8 records.** A neighbouring property, another building type, a workplace route or an unverified project phase supplies a comparison question. Its reported conditions must not transfer to the candidate.

The Reportage record links three discussions that actually name Taormina, Reportage Hill/R. Hills and the Dubai Reportage Village. The Taormina and Village comments do not establish the exact registered “1” phases; the combined record therefore remains `comparable-setting`. The R. Hills discussion is a buyer’s price/payment question, not a verified resident account. Athlon is explicitly discussed as an apartment purchase, but the post does not establish Rise 1 project 4044; that record is `area-context` for the master community. The Wilds is named in the Majan discussion as a nearby project; nobody’s Majan experience is relabelled as a Wilds resident review.

Two headings that could otherwise be mistaken for directly observed candidate-building conditions name the comparison explicitly: Jumeirah Heights cooling and Kempinski/Palm Crescent visitor parking. The Business Bay garage record concerns an office commute, not a claim about any mapped residential garage.

## Date handling and freshness

All retained pages were inspected on **2026-09-14**. The Nook discussion has an absolute indexed publication date of **2026-02-13**, retained as `publishedOn`. The other 20 pages exposed relative dates or inconsistent cached dates, so `publishedOn` is `null`; no calendar day was invented from “months ago.” The displayed relative age is retained in each source’s context when available.

The search concentrated on recent discussions, including 2025/2026-labelled or relatively recent Majan, Creek Harbour, Wasl Gate, Dubai South, cooling and off-plan purchase threads. Older Business Bay canal, Jumeirah Heights cooling and Palm Crescent threads are used only to motivate a check. Their former construction, traffic, bills or access arrangements are not described as current. The Palm visitor-parking source had a search/render age discrepancy (roughly two months versus three days); this is unresolved and its billing allegation is not accepted as a fact about Passo or as a current area-wide rule.

## Signal inventory

Source references below point to the inspected URL inventory. Every mapping is explicit; broad DLD area tags are used only for Business Bay. Other records retain `areaKeys: []` because a district-wide match would widen their evidence beyond the justified location or workflow.

| Signal ID | Scope | Check | Mapped profiles | Sources |
|---|---|---|---|---|
| `ae-community-majan-exit` | `area-context` | Start the Majan commute at the actual exit | Binghatti Skyflame · project group | DB01 |
| `ae-community-majan-current-transit` | `comparable-setting` | Plan the first day before the future metro | Binghatti Skyflame · project group; The Wilds Residences | DB01 |
| `ae-community-motor-event-noise` | `area-context` | Visit when the Autodrome is active | Binghatti Skyterraces | DB02 |
| `ae-community-creek-night-light` | `area-context` | A view includes the lighting after dark | Valia; Creek Bay; Creek Haven | DB03 |
| `ae-community-creek-return-route` | `area-context` | Test the drive home as well as the promenade | Valia; Creek Bay; Creek Haven | DB04 |
| `ae-community-creek-summer-errands` | `area-context` | Walk the Creek Harbour grocery route in hotter hours | Valia; Creek Bay; Creek Haven | DB03 |
| `ae-community-business-bay-metro` | `area-context` | Trace the route beyond the canal | Peninsula Three; The EDGE; Regalia; One by Binghatti; Binghatti Aquarise | DB05 |
| `ae-community-business-bay-garage` | `comparable-setting` | Include building access in the Business Bay commute | Peninsula Three; The EDGE; Regalia; One by Binghatti; Binghatti Aquarise | DB06 |
| `ae-community-business-bay-cooling` | `area-context` | Compare rent with its cooling terms | Peninsula Three; The EDGE; Regalia; One by Binghatti; Binghatti Aquarise | DB07 |
| `ae-community-islands-access` | `comparable-setting` | Clarify resident access around Jumeirah Islands | Eltiera Views; Serenia District East | DB08 |
| `ae-community-islands-cooling` | `comparable-setting` | Separate new-tower cooling terms from Jumeirah Heights | Eltiera Views; Serenia District East | DB09 |
| `ae-community-wasl-comparable-space` | `area-context` | Match usable space before comparing with Nook | Boulevard Park 1 | DB10 |
| `ae-community-jebel-workplace-gate` | `comparable-setting` | Match the actual Jebel Ali workplace entrance | Sobha Central; Boulevard Park 1; RAW District R | DB11 |
| `ae-community-industrial-daily-route` | `area-context` | Trace after-work errands in Jebel Ali Industrial Area 2 | RAW District R | DB12 |
| `ae-community-south-specific-location` | `area-context` | Choose the location within Dubai South | Golf Fields; Terra Woods; Hayat 1; Azizi Venice 6 | DB13 |
| `ae-community-south-delivery-address` | `comparable-setting` | Check your address separately from The Pulse delivery area | Golf Fields; Terra Woods; Hayat 1; Azizi Venice 6 | DB14, DB13 |
| `ae-community-south-demand-horizon` | `area-context` | Separate Dubai South airport expectations from rental timing | Golf Fields; Terra Woods; Hayat 1; Azizi Venice 6 | DB15 |
| `ae-community-palm-crescent-exit` | `area-context` | Balance Palm Crescent beach use with trips off the island | Passo | DB16 |
| `ae-community-palm-guest-parking` | `comparable-setting` | Check Palm Crescent visitor parking building by building | Passo | DB17 |
| `ae-community-reportage-cash-conditions` | `comparable-setting` | A cash discount changes the comparison | Taormina Village 1; Reportage Hills / R. Hills; Reportage Village 1 | DB18, DB19, DB20 |
| `ae-community-athlon-rent-overlap` | `area-context` | Price the rent while waiting for Athlon | Rise by Athlon 1 | DB21 |

## Geographic coverage and boundaries

| Discussed location / setting | Reviewed candidates receiving checks | Why the mapping is limited |
|---|---|---|
| Majan and nearby The Wilds | Skyflame 1; The Wilds Residences | Majan exit route applies to Skyflame. The Wilds receives only a future-versus-day-one transport check, not a Majan traffic claim. |
| Motor City / Autodrome | Skyterraces | Older homes’ event-noise experiences motivate an event-time/orientation visit. No noise level or event schedule is asserted for Skyterraces. |
| Dubai Creek Harbour | Valia; Creek Bay; Creek Haven | Lighting, hotter-hour grocery walks and access-route checks are regional. Exact facade lighting and garage arrangements require the chosen tower. |
| Business Bay | Peninsula Three; The EDGE; Regalia; One by Binghatti; Aquarise | Canal-to-station route, office/home access and cooling-contract boundaries. Historical building and road conditions are not current tower findings. |
| Jumeirah Islands / neighbouring Heights | Eltiera Views; Serenia District East | Public restaurant access and older Heights cooling are comparisons. No new-tower access right or tariff is inferred. |
| Wasl Gate / The Nook | Boulevard Park 1 | Existing Nook interiors are a local comparator; upcoming supply is not an automatic price forecast. |
| Jebel Ali employment / Industrial Area 2 | Sobha Central; Boulevard Park 1; RAW R | Exact workplace entrance and final transfer matter. Industrial errands check is limited to RAW’s verified industrial setting. |
| Dubai South: Emaar South, Expo and Pulse references | Golf Fields; Terra Woods; Hayat 1; Azizi Venice 6 | These are different sublocations. Delivery and commute claims from one estate are not extended to the others. |
| Palm Crescent | Passo | Extra island journeys are a route check. Kempinski visitor-parking reports only prompt a written Passo-specific rule check. |
| Taormina, Reportage Hill, Dubai Reportage Village | Taormina Village 1; R. Hills; Reportage Village 1 | Actual named-project purchase discussions, but phase identity and current advertised terms are not verified. No delivery/quality allegation or legal conclusion is adopted. |
| Athlon apartments | Rise by Athlon 1 | Master-community buyer question about rent while waiting. No exact Rise 1 contract/handover mapping is established. |

## Inspected source inventory

All URLs below were opened and their post/reply content inspected. Titles identify the discussion; the context records what was usable and what was deliberately not carried into product copy. All are anecdotal or public discussion, not primary measurements.

### DB01 — Thoughts on Majan area (Dubailand) for end-use and investment? Also seeing the premium project The Wilds by Aldar — will this add value?

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1om971u/thoughts_on_majan_area_dubailand_for_enduse_and/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened post and replies. Displayed 10mo/9mo ago; absolute date unavailable. Prospective apartment buyer names Majan and nearby The Wilds. Replies disagree over exits and metro; one self-described resident is also an agent. Use as route-verification questions only; no appreciation, vacancy or metro claim adopted.

Used by: `ae-community-majan-exit`, `ae-community-majan-current-transit`.

### DB02 — Motor City living - Seeking feedback

[Opened discussion](https://www.reddit.com/r/dubai/comments/1ckqdqd/motor_city_living_seeking_feedback/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened post and replies, displayed 2y ago. Prospective resident heard little during several visits; self-described eight-year family resident and others distinguish event timing, orientation and insulation. Existing Motor City experience, not delivered Skyterraces evidence. No decibels or claimed universal disturbance adopted.

Used by: `ae-community-motor-event-noise`.

### DB03 — Best/worst of Dubai Creek Harbour

[Opened discussion](https://www.reddit.com/r/dubai/comments/1thd0m1/bestworst_of_dubai_creek_harbour/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened resident replies, displayed 3mo ago. One describes decorative facade light reaching a terrace; another likes nearby grocery walks but distinguishes summer conditions. Buildings unnamed; mapped only as Creek Harbour viewing questions, never as defects at Valia, Creek Bay or Creek Haven.

Used by: `ae-community-creek-night-light`, `ae-community-creek-summer-errands`.

### DB04 — Thoughts on Dubai Creek Harbour

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1of543t/thoughts_on_dubai_creek_harbour/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened comments, displayed 1y ago. A respondent describes increased weekday access traffic and OP recalls a recent visit. Investment predictions, rents, prices and new-build quality claims excluded. Older area observation supports a present-day route trial only.

Used by: `ae-community-creek-return-route`.

### DB05 — Business Bay Living

[Opened discussion](https://www.reddit.com/r/dubai/comments/riojmn/business_bay_living/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened resident discussion, displayed 5y ago. Resident separates canal walking, main-road corridors and actual metro reach. Construction and transport conditions are historical and not assigned as current facts to any reviewed tower.

Used by: `ae-community-business-bay-metro`.

### DB06 — What is up with Business Bay

[Opened discussion](https://www.reddit.com/r/dubai/comments/15ma4qa/what_is_up_with_business_bay/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened OP and replies, displayed 3y ago. Office worker separates time inside an unnamed parking building from the later drive; commenters discuss lifts and signals. Not a residential tower measurement. Numerical waits excluded; route decomposition only.

Used by: `ae-community-business-bay-garage`.

### DB07 — Coste del chiller en estudios en Business Bay?

[Opened discussion](https://www.reddit.com/r/dubai/comments/1sm1fal/coste_del_chiller_en_estudios_en_business_bay/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened studio renter budget question and replies, displayed 4mo ago. Cooling is excluded from proposed rent and a reply says provider matters. Numerical bill estimates discarded. Does not establish the cooling provider, tariff or bill at any reviewed project.

Used by: `ae-community-business-bay-cooling`.

### DB08 — Entering Jumeirah Islands & other gated communities

[Opened discussion](https://www.reddit.com/r/dubai/comments/1ca6jya/entering_jumeirah_islands_other_gated_communities/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened full question and contrasting replies, displayed 2y ago. Discussion distinguishes public restaurants/clubhouse visits from residential access; OP later reports restaurants described a different gate setup. Current rules unresolved. Used only to request actual access rights for new Islands towers; no gated-status assertion or access-bypass advice.

Used by: `ae-community-islands-access`.

### DB09 — Jumeirah Heights apartments in Jumeirah Islands

[Opened discussion](https://www.reddit.com/r/dubai/comments/11vg0xy/jumeirah_heights_apartments_in_jumeirah_islands/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened post and replies, displayed 3y ago. A commenter advises checking external cooling versus electricity billing. Historical Jumeirah Heights experience is not evidence of Eltiera Views or Serenia East quality; only the contract/bill question is transferred within the surrounding comparison area.

Used by: `ae-community-islands-cooling`.

### DB10 — The Nook (Jebel Ali Village / Wasl Gate)

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1r3n9eu/the_nook_jebel_ali_village_wasl_gate/) · Published: 2026-02-13 · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Search result exposed 13 February 2026; opened post and replies displayed 7mo ago. Discussion contrasts smaller existing Nook homes with new surrounding supply. Not a verified supply count, rent forecast or Boulevard Park valuation; a prompt to match size and completion timing.

Used by: `ae-community-wasl-comparable-space`.

### DB11 — Moving to Dubai – rental suggestions near Jebel Ali

[Opened discussion](https://www.reddit.com/r/dubai/comments/1qtrzyb/moving_to_dubai_rental_suggestions_near_jebel_ali/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened job-relocation discussion, displayed 6mo ago. OP and respondents disagree about metro access to an unspecified Jebel Ali FZE office. No route claim adopted; motivates matching the actual workplace entrance and final transfer, not the district label.

Used by: `ae-community-jebel-workplace-gate`.

### DB12 — Why so less properties in Jebel Ali Industrial Area 2?

[Opened discussion](https://www.reddit.com/r/dubai/comments/1olnfm4/why_so_less_properties_in_jebel_ali_industrial/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened OP and replies, displayed 10mo ago. Self-described owner values nearby employment while others question living among industrial uses. Counts, yields, broad tenant preferences and abandonment claims excluded. RAW District R shares verified Industrial Second context, but no RAW resident account was found.

Used by: `ae-community-industrial-daily-route`.

### DB13 — Life in Dubai South

[Opened discussion](https://www.reddit.com/r/dubai/comments/1qa4eki/life_in_dubai_south/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened post and contrasting replies, displayed 7mo ago with some 2mo replies. Contributors distinguish Emaar South and Pulse; self-described residents disagree about isolation, deliveries and amenities. No journey times or retail coverage carried over to new projects.

Used by: `ae-community-south-specific-location`, `ae-community-south-delivery-address`.

### DB14 — What’s it like living in The Pulse Dubai south 2025

[Opened discussion](https://www.reddit.com/r/dubai/comments/1mcl31e/whats_it_like_living_in_the_pulse_dubai_south_2025/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened post and replies, displayed 1y and 9mo ago. One commenter reports limited app delivery; other inspected South thread reports adequate service. Pulse conditions do not establish coverage at Venice 6, Hayat, Golf Fields or Terra Woods. Conflicting odour claims excluded entirely.

Used by: `ae-community-south-delivery-address`.

### DB15 — Is Buying an apartment in Dubai South a Good Idea?

[Opened discussion](https://www.reddit.com/r/dubai/comments/1dde8dd/is_buying_an_apartment_in_dubai_south_a_good_idea/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened OP and replies, displayed 2y ago. Prospective short-hold buyer asks whether new supply may outpace airport-related demand. Adopted the timing question only, excluding appreciation promises, airport dates, flight-path claims and sales solicitations.

Used by: `ae-community-south-demand-horizon`.

### DB16 — Anybody who lived on Palm Jumeirah - can you share your experience?

[Opened discussion](https://www.reddit.com/r/dubai/comments/p4rv53/anybody_who_lived_on_palm_jumeirah_can_you_share/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened Crescent-specific buyer question and replies, displayed 5y ago. Discusses the extra island leg against beach use; not a current congestion measure or Passo resident account. Claimed times, safety and sinking discussion excluded.

Used by: `ae-community-palm-crescent-exit`.

### DB17 — People who live on Palm Crescent or visited it since February - Check your Salik spending

[Opened discussion](https://www.reddit.com/r/dubai/comments/1uek86x/people_who_live_on_palm_crescent_or_visited_it/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `individual-experience`.

Opened public post. Search index says published/crawled two months ago while rendered text says 3d ago; exact date intentionally null. OP describes charges during repeated Kempinski visits. Billing allegations are unverified and not attributed to Passo; retained only a written guest-parking and billing-boundary question.

Used by: `ae-community-palm-guest-parking`.

### DB18 — Is Reportage worth investing in?

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1mw3gvn/is_reportage_worth_investing_in/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened Taormina Village-specific question, displayed 1y ago. OP identifies as an agent asking about full-cash discounts and total-area pricing. No transaction, delivery failure or quality allegation verified; used only for matching price and cash-payment conditions. Village 1 registration is not established by the post.

Used by: `ae-community-reportage-cash-conditions`.

### DB19 — Opinion needed 3 bed villa in reportage hill

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1mc5t0c/opinion_needed_3_bed_villa_in_reportage_hill/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened named Reportage Hill buyer discussion and replies, displayed 1y with 8mo reply. Cash pricing is compared with differently specified neighbouring projects. Legal/escrow, tenure, quality and expected resale claims conflict or lack verification, so all are excluded; current written payment conditions are the only derived check.

Used by: `ae-community-reportage-cash-conditions`.

### DB20 — Reportage developers

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1htjo69/reportage_developers/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened thread explicitly discussing Dubailand Reportage Village, displayed 2y ago. OP acknowledges apparent low instalment pricing may be a full-cash plan after a reply challenges comparability. No rate, metro claim, delivery status or specific registered phase is adopted.

Used by: `ae-community-reportage-cash-conditions`.

### DB21 — Athlon

[Opened discussion](https://www.reddit.com/r/dubairealestate/comments/1t8w8i4/athlon/) · Published: not established; null in dataset · Inspected: 2026-09-14 · Source scope: `public-discussion`.

Opened family end-user question and replies, displayed 4mo ago. OP compares a ready home against Athlon apartment instalments plus continued rent. Apartment/master-community relevance is explicit, but exact Rise 1 phase and quoted handover are not verified. Other-city anecdotes, supply claims and price forecasts excluded.

Used by: `ae-community-athlon-rent-overlap`.

## Rejected material and unresolved gaps

- An apparently generic guide in [Living on the Palm Jumeirah](https://www.reddit.com/r/dubai/comments/1g44xpv/living_on_the_palm_jumeirah/) was not retained as firsthand resident evidence. The thread itself includes objections to its generated-sounding copy.
- [Altiera Heights launch discussion](https://www.reddit.com/r/dubairealestate/comments/1ky7bc9/altiera_heights_ellingtons_latest_jumeirah_island/) and [Ellington’s new project in Jumeirah Heights](https://www.reddit.com/r/dubairealestate/comments/1ku7zsk/ellingtons_new_project_in_jumeirah_heights_is_the/) concern Heights, not the reviewed Eltiera Views. They do not establish Views’ identity or resident conditions and were excluded from the signal dataset.
- [Dubailand Residence Complex traffic](https://www.reddit.com/r/dubai/comments/sk5quy/dubailand_residence_complex_traffic/) was not generalized to Wadi Al Safa 3, 5 and 7. “Dubailand” alone is not a sufficiently precise match.
- A [Wasl Gate water-logging question](https://www.reddit.com/r/dubai/comments/1ftqde8/is_there_water_logging_near_wasl_gate_near_jabel/) was not converted into a current flood assertion.
- Dubai South delivery accounts conflict across addresses and time. The dataset therefore asks the user to query the actual address. Conflicting odour claims were omitted entirely.
- Reportage threads contain conflicting statements about escrow, tenure, workmanship, promised discounts and completion. Those are not verified legal, financial or building findings and were excluded. The retained question compares written payment schedules for the same home.
- Airport expansion, future metro access, new supply and developer handover expectations were not accepted as guaranteed dates, demand or investment outcomes. No anonymous forecast is used to calculate yield, vacancy, fair value or a buy/wait recommendation.
- Sales listings, brokerage SEO guides, calls for direct messages and unexplained agent claims do not count as resident validation. Where a retained commenter also disclosed being an agent, that limitation is recorded.

The 21-URL total counts retained, actually inspected source URLs once each. Additional rejected or exploratory pages are not added to that coverage figure. The exact registered off-plan profiles still need their own current contract documents, physical access checks and, after occupancy, building-specific resident evidence. This file supplies useful local questions while keeping that gap explicit.

## Validation

Checked that all 21 IDs are unique; all 25 Dubai profile IDs exist in `dubai.json`; every title/body/viewing question has nonempty Korean, English and Simplified Chinese text; every source has its inspection date and allowed evidence scope; and every record has an allowed `mappingScope`. The dataset contains 13 `area-context`, 8 `comparable-setting` and 0 `named-property` records. Only the five Business Bay profiles receive the exact `business-bay` area key; other mappings remain profile-specific.
