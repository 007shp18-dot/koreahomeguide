# Property detail reviews — 13 September 2026

The release moves reviews into actual property details and expands the curated catalogue to 100 residential properties/project groups: Seoul, Singapore, Dubai and Tokyo, 25 each. Each review has 12 substantive bilingual points; asking listings, historical observations, advertised distances, planned services and unverified conditions keep their scope and date. No property inspection, watched video, measured neighbourhood footfall, guaranteed school allocation or fair-price appraisal is claimed.

## Product flow

- Explore exposes reviewed properties by name; Seoul/Singapore use their existing exact apartment/project details.
- Tokyo receives named-property details under `/jp/tokyo/explore/properties/[profileId]/`; anonymous MLIT area observations remain area context. Dubai uses `/ae/dubai/explore/projects/[profileId]/` and exact published DLD project selection where established.
- Full location/living analysis appears at `#property-review`. Existing verified photos and transaction charts remain. The separate `/living/` implementation is retired; legacy profile URLs redirect to the actual property.
- No competitor/source reference anchors appear in the review. Source IDs, URLs and checking dates remain in curated content and DB metadata; required photo credit/licence remains visible.
- The header Saved action opens the unified saved view. Review bookmarks count in city filters, support removal, and return to the same property. Up to 100 can be saved locally; no user activity or community comments were invented.
- English/Korean bodies are complete. Chinese controls retain the explicit English-body notice and remain noindex for these new named-property pages.

## Data and visuals

The catalogue contains 1,200 review points, 270 sourced scalar measures, two complete-calendar-year PLQ Mall series and 13 newly licensed exact-property photos. Existing Seoul/Singapore property media is reused in its existing placement/permissions. Missing photos stay missing. No nearby-building or synthetic replacement is introduced.

Charts keep incompatible units and measurement bases separate. Trizium area mix sums to 3,696 homes. PLQ Mall CY2022–CY2024 visits and tenant sales use separate scales and visible mall/year scope; partial 2025 periods are excluded. HARUMI FLAG minute measures are scheduled BRT departure intervals, not walking time.

Seoul maps to 29 unique apartment inventory entities because Mapo has four complexes and Oksu has two inventory groups. Singapore has 25 exact published hashes/routes. Dubai has 24 exact published project IDs; Skyflame remains an explicitly scoped group without invented Tower 1 mapping. Tokyo has no invented MLIT building identities or coordinates.

## Publication and verification

`apps/web/scripts/publish-property-reviews.mjs` validates the review schema, source references, visual references and location identity before writing. It verifies the dataset display/commercial rights, saves a local pre-publication backup and appends content-hashed source versions instead of overwriting history. Canonical JSON hashing makes repeated publication idempotent. Verification uses the latest version, runs the full public projection and compares the review, linked entities and visual metadata.

The API selects the latest source version before applying publication/entity filters, so removed mappings or withdrawn editions cannot resurrect older records. Property requests fetch their own review only. Saved names/links use the lightweight catalogue and remain available during a research-DB outage.

Independent review checked all 25 Singapore mappings, all 29 Seoul apartment entities, grouped identities, source references, saved-state capacity and graph units/bases. Targeted route, language, content, visual and Saved tests are included. The local production build was blocked by Google font retrieval in this environment; the deployment build is the production-build gate. Initial stale build directories were isolated, with original configuration restored. Deployment/DB verification outcomes are recorded in the release PR.

## Research handoffs


### Seoul

# Seoul review expansion — 2026-09-13

25 complete bilingual reviews: the existing three preserved, plus 22 additions. Each has 12 evidence-labelled points, four substantive sections and two or more comparisons. This is desk research, not property inspection, valuation, measured footfall or retail sales. No unsupported walking-time graphs or fabricated resident quotations were added.

## Internal provenance and decisions

- Source URLs are research provenance only; do not render competitor links in the user-facing review.
- Original three reviews remain unchanged. Their sidecar facts reuse existing source IDs. Mapo Raemian Prugio covers all four phases, 3,885 homes and 51 buildings; no phase-specific metric is represented as the entire group.
- K-apt numbers use the existing project artifact as of 2026-09-04. Nearby-school fields can be stale and never constitute final placement; exact legal school addresses were independently checked where available.
- Daechi Palace totals cover phases 1 and 2 combined. The developer and original independent layout analysis distinguish amenity/parking access; do not promise interchangeable access.
- Eunma implementation-plan approval was reported on 2026-07-02. The 2028 construction start remains an association target, with further procedures outstanding.
- Godeok Arteon primary-school context is Gohyeon, not automatically Goil. 2026 secondary allocation changes are explicit; school tenure or resident class is not used to judge children.
- Mapo Prestige school identity is Hanseo, independently cross-checked with Schoolinfo and a catchment listing. Broad Yeomni neighbourhood text is not a basis for assigning Yeomni Elementary.
- Tenz Hill 1 and Centras use Soongshin Elementary (숭신초), not similarly named Sungshin. Stale K-apt nearby-school lists were excluded from assignment claims.
- Centras apartment ID seongdong-gu-1cnlghk is used. Identically named officetel seongdong-gu-1fewkov is deliberately excluded.
- Heukseok Xi maps to the existing inventory name 흑석리버파크자이, ID dongjak-gu-15fmgge. The review does not treat them as two estates.
- Oksu Park Hills covers the two verified apartment inventory groups, 101–116 and 117–125. Gyeonghuigung Xi review covers Phase 3 only.
- Trizium has a verified non-overlapping area mix: 740 + 2,402 + 330 + 224 = 3,696 homes. The 84 m² group combines 84.83 / 84.95 / 84.97 m² types; values are counts, not scores or prices. These four metrics deliberately share one identical bilingual basis and sourceId for the real bar chart.
- Portal distances with unclear origin or route are described as unverified estimates and excluded from walk-time charts. No YouTube playback or transcript verification occurred; companion descriptions are labelled accordingly.
- Original blogs were read for specific route/layout observations; proprietary portal AI recommendations, rankings and unverifiable resident quotes were not adopted. Recent generic blog pages containing obvious errors were excluded.
- No new photo has verified commercial reuse permission. Developer photos are copyrighted and can include renderings; Zipcat photos carry CC BY-NC-ND; news images can prohibit database reuse. All photo fields are null. Keep the verified actual-property media already present in the detail UI; do not substitute skyline photos.
- Foreon school coverage includes historical plans. Final current school operation, exact catchments and assigned school journeys still need confirmation; no planned campus is represented as already open.

## Validation

The actual propertyReviewSchema parsed all 25 reviews. All 300 points, comparison entries, source references, 25 unique sidecars and apartment entity types passed. The original three reviews are byte-equivalent after JSON serialisation. Trizium’s 46 buildings and 3,696 total homes were additionally cross-checked directly on the public Seoul city estate page.



### Singapore

# Singapore expansion handoff — 2026-09-13

Status: final and stable. 25 complete reviews (original 3 preserved exactly + 22 additions). No remaining candidate queue. No repository or database writes performed.

## Deliverables

- `v2/apps/web/content/property-reviews/singapore.json` — full existing PropertyReview schema, 25 reviews.
- `v2/apps/web/content/property-reviews/locations.json` — 25 exact Explore identities/routes, 27 sourced numeric facts; all `photo` values are null.
- `/tmp/review-expansion-singapore-notes.md` — this handoff.

## Validation

- Imported the actual `propertyReviewSchema` with Node and validated 25/25.
- All 25 identities, segments, addresses and detail paths matched `data/singapore-explore-index.json`.
- Original 3 reviews equal the repository source, including original source provenance.
- 300 review points: each has 2 strengths, 2 tradeoffs, and 2 points in each of transport/schools/daily/costs.
- 50 bilingual comparisons, with all targets present in this 25-review set.
- All review and metric source IDs resolve; no duplicate review IDs; no Korean text in English fields.
- 119 source records / 106 unique URLs. Dates distinguish 2026-09-13 checking from historical publication/observation.

## Commercial observations and numeric graphics

PLQ Mall operator/SGX presentation, 5 November 2025, page 9, directly reports calendar-2024 visits **13.1 million** and tenant sales **S$278.9 million**. Both now appear in the PLQ sidecar. The scope is the mall; visits are not unique people, sales are not condominium-resident spending, city turnover, apartment returns, or current-2026 observations.
The same presentation also contains CY2022/CY2023/CY2024 visits 10.4/12.3/13.1 million and sales S$243.0/275.9/278.9 million, plus nine-month 2025 figures. These additional series are not in the sidecar and should not be graphed against a full calendar year without period labels.
Distances in sidecars retain their source method and period: portal proximity, advertising estimates, original-review historical walks, or explicitly a driving route. Never combine them into an unlabelled current walk-time score. Numeric unit areas and swimming-pool length are separate metric types, not station distances.

## Corrections retained in the content

- Stamford Primary merged into Farrer Park Primary in January 2023 (official MOE record). Old Bugis/CBD proximity claims were not reused as current admission evidence.
- Great World MRT opened in November 2022; the mall basement link opened in April 2025 per the current independent station guide. 2019–2022 walking estimates remain historical, with current entrances separated.
- Catholic High officially has primary/secondary sections for boys; this fact is not an apartment admission-distance certification.
- d’Leedon developer splits 1,703 condominium units from 12 semi-detached houses. Review scope is condominium apartments. The SignedPrice project transaction aggregate has no apartment-only reconciliation in this research; use an apartment filter for any finer comparable analysis.
- Corals architect confirms 366 homes; the original-review overview says 336. The architect’s inventory takes precedence, and the conflict is disclosed.
- Seaside portal inventory 843 was not independently reconciled to an approved home/shop schedule and is not used as a crowding graphic.
- Parc Esta July 2023 resident interview provides actual historical resident observations on road exposure, facilities and fees under S$200 for that resident’s compact three-bedroom. These are dated individual reports, not 2026 project-wide measurements.
- Rivergate S$300–430 two-bedroom monthly maintenance is an April 2019 report, not a current fee schedule.

## Limits and media

New reviews use source-backed project facts plus clearly classified editorial interpretation and explicit unresolved checks. They do not claim on-site visits, walked routes, noise measurements, official school eligibility, price fairness, or independently measured condo footfall.
New transaction points quote the existing SignedPrice Aug 2021–Aug 2026 publication with multi-year/mixed-unit scope; they are not current appraisals or resale-only trends.
No videos were represented as watched. No fabricated resident comments, community activity, measurements or financial returns were added.
Architect and original-review pages show genuine property imagery but do not grant a reusable licence. Their photographs were not downloaded or hotlinked. Reuse the actual existing project media under its existing permissions; `photo: null` deliberately avoids an unlicensed new-image claim.
External portals remain in internal provenance. Product UI can omit competitor links while retaining provenance in the content record.

## Review identities

| Project | Review ID | Segment | Numeric facts |
|---|---|---|---|
| Marina One Residences | sg-marina-one-residences | CCR | 1 |
| Park Place Residences at PLQ | sg-park-place-plq | RCR | 4 |
| Wallich Residence | sg-wallich-residence | CCR | 1 |
| The Sail @ Marina Bay | sg-the-sail-marina-bay | CCR | 1 |
| Duo Residences | sg-duo-residences | CCR | 1 |
| The Interlace | sg-the-interlace | RCR | 2 |
| Seaside Residences | sg-seaside-residences | OCR | 0 |
| Marina Bay Residences | sg-marina-bay-residences | CCR | 0 |
| Marina Bay Suites | sg-marina-bay-suites | CCR | 1 |
| Icon | sg-icon | CCR | 0 |
| One Shenton | sg-one-shenton | CCR | 0 |
| Altez | sg-altez | CCR | 0 |
| Skysuites at Anson | sg-skysuites-at-anson | CCR | 1 |
| Midtown Modern | sg-midtown-modern | CCR | 1 |
| Midtown Bay | sg-midtown-bay | CCR | 2 |
| South Beach Residences | sg-south-beach-residences | CCR | 0 |
| Concourse Skyline | sg-concourse-skyline | CCR | 1 |
| Martin Modern | sg-martin-modern | CCR | 2 |
| Rivergate | sg-rivergate | CCR | 0 |
| The Trillium | sg-the-trillium | CCR | 1 |
| D’Leedon | sg-d-leedon | CCR | 2 |
| Reflections at Keppel Bay | sg-reflections-at-keppel-bay | RCR | 0 |
| Corals at Keppel Bay | sg-corals-at-keppel-bay | RCR | 2 |
| Parc Esta | sg-parc-esta | RCR | 2 |
| JadeScape | sg-jadescape | RCR | 2 |


### Dubai

# Dubai property review expansion — 13 September 2026

Delivered 25 reviews: the original 3 plus 22 new reviews, with 300 bilingual evidence points. All reviews contain a verdict, summary, best/hold audience, 2 strengths, 2 trade-offs and 2 points for each of transport, schools, daily life and ownership costs. The 22 new reviews each add an internal comparison to another covered property.

Files:
- `v2/apps/web/content/property-reviews/dubai.json` — complete replacement Dubai review array.
- `v2/apps/web/content/property-reviews/locations.json` — routes, project identities, area addresses, 113 source-linked numeric facts; all photos null.
- `/tmp/build-dubai-expansion.py` — reproducible drafting/assembly helper, temporary only. It assumes the repository source still has the original 3 reviews; do not rerun after replacing repository content unless the baseline is restored.

## Identity and route mapping

Every requested detail route is `/ae/dubai/explore/projects/{reviewId}/`. DLD mappings are exact IDs from the existing published `data/dubai-project-evidence.json`, segmented by property type and transaction stage. Address strings give project and area context; they are not surveyed entrances or verified postal/plot numbers.

| Review ID | Name | Published DLD project ID | Area slug |
| --- | --- | --- | --- |
| ae-skyflame-1 | Binghatti Skyflame · project group | No verified tower mapping — group only | majan |
| ae-skyterraces | Binghatti Skyterraces | 4327-apartment-off-plan | al-hebiah-first |
| ae-valia | Valia | 4448-apartment-off-plan | al-khairan-first |
| ae-peninsula-three | Peninsula Three | 2372-apartment-ready | business-bay |
| ae-the-edge | The EDGE | 2611-apartment-off-plan | business-bay |
| ae-regalia | Regalia | 2270-apartment-off-plan | business-bay |
| ae-one-by-binghatti | One by Binghatti | 3107-apartment-off-plan | business-bay |
| ae-eltiera-views | Eltiera Views | 4116-apartment-off-plan | al-thanyah-fifth |
| ae-serenia-district-east | Serenia District East | 4281-apartment-off-plan | al-thanyah-fifth |
| ae-sobha-central | Sobha Central | 4328-apartment-off-plan | jabal-ali-first |
| ae-golf-fields | Golf Fields | 4415-apartment-off-plan | madinat-al-mataar |
| ae-terra-woods | Terra Woods | 4367-apartment-off-plan | madinat-al-mataar |
| ae-creek-bay | Creek Bay | 4198-apartment-off-plan | al-khairan-first |
| ae-creek-haven | Creek Haven | 4225-apartment-off-plan | al-khairan-first |
| ae-the-wilds-residences | The Wilds Residences | 4377-apartment-off-plan | wadi-al-safa-3 |
| ae-reportage-hills | Reportage Hills / R. Hills | 3465-villa-off-plan | al-hebiah-fifth |
| ae-taormina-village-1 | Taormina Village 1 | 3108-villa-off-plan | wadi-al-safa-3 |
| ae-hayat-1 | Hayat 1 | 4422-villa-off-plan | madinat-al-mataar |
| ae-boulevard-park-1 | Boulevard Park 1 | 4184-apartment-off-plan | jabal-ali-first |
| ae-reportage-village-1 | Reportage Village 1 | 2784-villa-off-plan | wadi-al-safa-7 |
| ae-raw-district-r | RAW District R | 4500-apartment-off-plan | jabal-ali-industrial-second |
| ae-binghatti-aquarise | Binghatti Aquarise | 3585-apartment-off-plan | business-bay |
| ae-rise-by-athlon-1 | Rise by Athlon 1 | 4044-apartment-off-plan | wadi-al-safa-5 |
| ae-passo | Passo | 3886-apartment-off-plan | palm-jumeirah |
| ae-azizi-venice-6 | Azizi Venice 6 | 3474-apartment-off-plan | madinat-al-mataar |

## Original content preservation

Original strengths/trade-offs/sections/comparisons were retained, except narrowly scoped identity wording: Skyflame summary now states project-group coverage without claiming a verified Tower 1 DLD link; Valia summary and one cost paragraph distinguish the published project 4448 mapping from an unverified unit contract. Internal `signedprice-dld` references were added to Skyterraces and Valia so numeric facts resolve correctly.

## Evidence and numerical limits

- 176 source entries across 103 unique URLs. Official developer/operator, transport, mall and school material is preferred. Property guides and dated construction reporting supply additional context, with disagreement and failed full-page access disclosed internally. Sources remain in research data; user-facing competitor-link removal belongs to root integration.
- DLD graphic period is 8 June–5 September 2026. Its 72 numeric observations are project/type/stage aggregates for 24 mapped reviews: count, median transaction price and median price per square metre. These are not matched-home valuations, yield estimates or causal appreciation evidence.
- Additional 41 numeric facts cover scoped published unit mixes, instalment plans, school tuition and selected project dimensions. Every metric has a valid review source ID, method/scope and check date. No invented proximity times, school ratings, footfall, retail sales, ROI, future uplift, community poll results or resident sentiment scores.
- School fees are 2026–27 references. Approved and discounted GEMS Founders fees are differentiated; general and legacy Hartland family tables are distinguished. Admission and future-year fees are unconfirmed. The Winchester School Jebel Ali is distinct from GEMS Winchester Dubai near IMG Worlds.
- Portal drive estimates are never relabelled as measured walks. Advertisement times with missing mode/entrance assumptions remain explicit verification gaps. No on-site route, lift wait, noise, shade or internal-area measurements were made.
- No resident interviews or on-site inspections took place. Off-plan reviews evaluate the documented plan and decisions it creates, not completed resident experience. No YouTube video was claimed as watched. The RAW Reddit item is a public question/concern reference, not a resident review or investment verdict.

## Important project-specific distinctions

- Skyflame stays a Majan project group. No exact tower DLD mapping, no transaction metrics for an invented tower.
- Skyterraces is 4327 / apartment / off-plan / Al Hebiah First, with marketed Motor City context. Valia is 4448 / apartment / off-plan / Al Khairan First.
- Peninsula Three is marked completed by Select Group; a property guide still labels it off-plan. Unit handover and amenity operation are still not assumed.
- The EDGE official FAQ uses a 40/60 structure (20% within 14 days, 20% within six months, 60% completion); resale after 40% paid is qualified by the actual contract. The earlier conflicting 30/70 landing claim was not used.
- Regalia’s displayed 31 March 2026 end date is not proof of completion. One by Binghatti’s official floor breakdown is used rather than a portal total with a different convention.
- Eltiera Views is not Eltiera Heights. Serenia District East is distinct from West and from Serenia Living on Palm; East piling/shoring appointment and West foundation progress are not exchanged.
- Sobha Central’s six towers have differing 2029/2030 target dates. This remains a group review; no unsupported exact tower identity was assigned.
- Emaar South Golf Fields and Terra Woods distinguish apartment transactions from mixed project townhouse supply. Terra Woods is not Terra Heights.
- Creek Bay, Creek Haven and Valia distinguish current waterfront destinations from the future Blue Line target of 9 September 2029. No guaranteed price uplift follows from this date.
- The Wilds Residences counts are its apartment phase, not Wilds villas. Rise 1 transaction project 4044 is not mapped speculatively to a named themed tower. The 8 themed buildings and wider Athlon parks/tracks are full-scheme plans, not Rise 1-only counts. LEED Platinum is planning/design certification, not measured operating-energy performance.
- Reportage Hills: 902-home official mix is 744 three-bed, 66 four-bed, 92 five-bed. Taormina: 838-home mix distinguishes townhouse/villa types and optional internal lifts. Reportage Village Dubai: 1,767 homes with 1,321 two-bed, 156 three-bed and 290 four-bed; separate from Abu Dhabi’s similarly named project.
- Hayat 1 is 4422, not a later numbered phase. Its launch deposit/payment structure and first-phase target are not assumed for every later contract. The district bus and existing hypermarket are not Hayat-gate facilities.
- Boulevard Park total 1,248 homes spans 2 plots/6 buildings, not Park 1 alone. Its advertised one minute to Energy station has no verified walking method.
- RAW District R is project 4500 in Jabal Ali Industrial Second, separate from RAW District II 4526. Public questions are not converted into resident evidence.
- Binghatti Aquarise has an artificial-beach concept in Business Bay; it is not sea access. Approximately 28 retail spaces are not an identified list of open tenants.
- Passo official launch confirms **West Crescent**. Wellness private garden/plunge-pool provision is collection-specific, not every apartment. The 625-residence header and penthouse/mansion collections were not added into an invented 636-home count. Palm trunk retail/nursery destinations are not Passo ground-floor or walking amenities.
- Azizi Venice 6 is project 3474. The 39% dated April/May 2026 announcement covers the first 14 buildings and does **not** establish Venice 6-specific progress. It is not placed in the numeric sidecar. Official full page access was limited; the dated specialist construction report was read, while an exact project guide was used only for search-index identity cross-check. Wider lagoon and Cultural District facilities are future plans.

## Photos and media

No exact-building image with verified reuse permission was found. Every `photo` is null. Do not render a generic tower image as one of these buildings, or a developer render as an actual site photo.

- Emaar’s asset usage policy requires its approval for asset use: https://www.emaar.com/en/emaar-asset-usage-policy
- Imtiaz and Reportage materials retain commercial-use/written-permission restrictions. Public availability of an off-plan rendering does not provide redistribution permission.
- BEYOND Passo’s page has image alt text mentioning another project (The Mural); this is an additional reason not to auto-import an unchecked hero image.
- Root may use a licensed contextual district image only with a clear district/context label, or approved exact project media with photographer/developer credit and correct photo/render status. This research package supplies neither false photos nor generated real-estate imagery.

## Remaining candidate queue

1. **Rome 3 / project 3459**: held out and replaced with Aquarise because Rome-series public phase naming and delivery specifications could not be confidently matched to this exact DLD phase. Needs an official exact-phase document before expansion.
2. Exact Skyflame tower-to-DLD mapping; unit-level addresses, entrance routes and approved service charges for all off-plan candidates.
3. Verified image reuse permissions or site photography for each exact building; resident evidence only after delivery and with building identity confirmed.
4. Actual local footfall, retail turnover and community surveys: unavailable in this package and should not be implied by amenity or mall counts.

## Verification performed

The actual repository `propertyReviewSchema` was imported with Node and all 25 records parsed successfully. A separate audit verified 25 unique review/sidecar IDs, 300 bilingual points, valid metric/source links, every detail route, all 24 exact DLD project/area mappings and all 72 DLD aggregate values against the existing published artifact. English spacing in the early batch was manually corrected and checked for joined-word/number patterns. No repository file or database was changed by this subagent.


### Tokyo

# Tokyo review expansion handoff — 2026-09-13

Stable import artifacts:

- `v2/apps/web/content/property-reviews/tokyo.json`: 25 complete bilingual named-property reviews, including the original 3 unchanged.
- `v2/apps/web/content/property-reviews/locations.json`: 25 matching sidecars, street/block addresses, ward codes, 69 numeric reference metrics and 13 licensed photographs.
- 300 review points: two strengths, two tradeoffs and two points in each of transport, schools, daily life and costs. There are 42 comparison entries and 139 source entries covering 110 distinct URLs.
- Actual `propertyReviewSchema.safeParse` validation passed for all 25, with source-ID and sidecar integrity checks. No repository or database writes were performed by this research agent.

## Integration requirements

All sidecars use `/jp/tokyo/explore/properties/{reviewId}/`. `entityIds` intentionally stays empty. Existing MLIT rows are anonymised area observations, so none establishes the identity, transaction price, turnover or capital performance of a named condominium. Nearby ward-level transaction context must remain explicitly nearby context.

The original ward mappings are Toyosu 13108, Meguro 13109 (Shinagawa, not Meguro Ward), and Shibuya 13113. Park City Toyosu's address explicitly refers to Tower A; other towers have their own numbers. Meguro uses the official 3-1 Kami-Osaki block address and explicitly distinguishes North/South. HARUMI FLAG is a multi-building estate in Harumi 5-chome, not a single invented street number or coordinate. No unsupported latitude/longitude has been added.

Metrics retain their unit, source ID, calculation/advertising basis and check date. They are reported figures, not field measurements. Compare only appropriate series with the same unit and basis. HARUMI FLAG's two minute metrics are **scheduled BRT departure spacing**, not station walking time or observed waiting. BAYZ's metre metrics are original-material reference distances; the station-minute series has a different basis. One metric alone should remain a reference fact rather than a made-up comparison chart. No arbitrary score, generated transaction, estimated revenue or footfall has been added.

## Photo handling

13 photographs include exact source-page URL, creator, licence and bilingual identification. These cover the original 3, Shirokane The Sky, The Tokyo Towers, Kachidoki The Tower, Park Tower Harumi, SKYZ, DEUX TOURS, Branz Tower Toyosu, Park Tower Kachidoki, HARUMI FLAG and Capital Mark Tower. Both `v2/apps/web/content/property-reviews/locations.json` and `v2/apps/web/content/property-reviews/locations.json` are already merged into the final sidecar.

Keep visible creator/licence attribution and preserve the linked licence conditions, including CC BY-SA obligations. Images are exterior documentation, not proof of a selected unit's view, condition or current availability. HARUMI FLAG is expressly an estate-area photograph. Capital Mark's image is dated 2012. Photographs are not newly shot 2026 inspection evidence. Direct image loading in the actual deployed page still needs browser verification; source-page identification/licence checks do not guarantee image-host delivery. 12 profiles deliberately have `photo: null`; they must not receive a nearby building's image or an unlabeled synthetic replacement.

## Preserved corrections and consequential findings

- Original Park City Toyosu: the 2025 visit is historical observation; it is not a 2026 confirmation of every facility, opening arrangement or mall connection.
- Original Park Court Shibuya: the fixed land lease ends 2093-09-30. The 141.05 m² example's ¥213,220 monthly amount includes ¥68,000 parking and ¥5,700 storage, whose optional status needs confirmation; core stated charges total ¥137,100. Jinnan School's August 2026 relocation is retained.
- Shirokane The Sky: residential three-minute station advertisement and Lincos's five-minute store access have distinct endpoints. Official surrounding material lists Shirokane-no-Oka Elementary at 780 m / ten minutes; this does not establish admission to similarly named Shirokane Elementary.
- Kachidoki The Tower: the full Kajima 2014 release verifies 53 floors and **1,420** homes. An older commentary count of 1,470 is not reused.
- Park Tower Harumi is Harumi 2-chome: Tsukishima No. 3 Elementary / Harumi Junior High, rather than the Harumi Nishi allocation for Harumi 3–5-chome.
- SKYZ uses `jp-skyz-tower-garden`, with the Z spelling. Conflicting completion conventions were avoided. SKYZ/BAYZ mutual facilities are documented, but current access charges/booking rules are not assumed.
- City Towers Toyosu The Twin's original approximately 10-metre school reference has an unclear boundary/entrance basis and is excluded from numeric diagrams. Old hospital/location entries are not used as current operational evidence.
- The Symbol's 65.16 m², northwest, 20th-floor September listing has ¥19,107 service + ¥30,190 reserves = ¥49,297. This is a unit-specific subtotal and an occupied asking listing, not a signed sale.
- DEUX TOURS: residential five-minute station claim and supermarket ten-minute claim are not averaged. Maruetsu's three customer spaces are not resident parking allocation. The 1,450-home figure is residential; SOHO totals are not mixed in.
- Brillia Mare and Ariake SkyTower are separate buildings. Bunkado is in **SkyTower**, not Mare. The August 2026 community/facility announcements are actual association posts, not invented resident reviews.
- Branz Tower Toyosu **5-1-13** is an explicit junior-school exception: Ariake Nishi, not Fukagawa No. 5. The June 11 listing is stale context, flagged accordingly; its captions and main text give inconsistent four/five-minute subway access, so that conflict is not hidden in a chart. Its ¥39,865 fee subtotal is unit-specific and requires refresh.
- Park Tower Kachidoki Mid and South are distinguished: Mid 45 floors / 1,121 homes at 4-6-2, South 58 floors / 1,665 homes at 4-6-1. One/two-minute walks use the official 80 m/min entrance-distance convention. Block 4-6 has Harumi Nishi school allocation. One vacant listing nevertheless gives delivery after mid-January 2027; vacancy is not immediate possession.
- HARUMI FLAG: SUN VILLAGE's 13–18-minute station range is not an estate-wide minimum. The new Tokyo Station BRT route starts **2026-09-16**, after the 2026-09-13 check, and remains planned in the review. Existing B33 timetable figures are specifically from the March 1 timetable and may change September 16.
- Minato's school-zone change covers all Shibaura 4-chome for new entrants from 2025; existing-pupil transition rules are kept distinct. A portal page headed Grove but describing Cape is explicitly excluded as a reliable unit-price comparison.
- Onarimon school material now points to the integrated Onarimon Gakuen framework; the old standalone-school page is not treated as the current institution without qualification.
- Current source examples marked leased, occupied, asking or with uncertain possession remain so. None becomes an achieved price or implied yield.

## Remaining research limits

No physical journey was timed; traffic signals, lifts, platform circulation, stroller accessibility and school gates remain inspection tasks. Current ward catchment pages still link some Koto allocation PDFs dated 2024-04-01; the source vintage is retained and individual admissions remain for the education board to confirm. Facility lists often reproduce original brochure material; they are not universal proof of current operating hours, free access or spare capacity. General school reputation is not scored.

Owner statements, association accounts, funding adequacy, arrears, future repair tenders and actual unit-level transaction comparisons remain incomplete. Where a dated listing supplies charges, its area, floor and occupancy context are retained and exclusions stated. Published community or reserve-investment announcements are evidence of that action, not resident satisfaction or financial security.

No YouTube video is claimed to have been watched. Public official/operator pages, original property commentary and relevant broker/listing material were used where accessible. There is no fabricated measured footfall or local business sales series.

## Final local checks

The complete web test suite passed: 2,691 tests passed, 85 skipped (382 passing test files, 9 skipped). TypeScript and whitespace checks passed. All 100 reviews contain 1,200 bilingual points, 533 source entries representing 401 distinct URLs, and 170 comparisons. Validation-branch publication verified all 100 records against the canonical review, entity mapping and visual metadata. Production outcomes follow in the release PR.
