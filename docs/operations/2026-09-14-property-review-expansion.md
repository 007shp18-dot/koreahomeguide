# Property review expansion — 14 September 2026

Adds 12 named residential reviews (three per market), taking the catalogue from 100 to 112. Each has Korean/English editorial copy, evidence-linked transport/school/daily/cost points, and Korean/English/Chinese overviews and persona summaries. Sources use the existing bottom-of-page treatment. No new photographs are claimed or generated.

| Market | Added reviews | Identity scope |
| --- | --- | --- |
| Seoul | Mokdong New Town Complex 7; Raemian Oksu Riverzen; Seoul Forest Riverview Xi | Exact observed building IDs; separate rental-estate IDs excluded |
| Singapore | The Poiz Residences; Park Colonial; Treasure at Tampines | Exact published project IDs in the explore index |
| Dubai | Park Ridge; Creek Horizon; Creekside 18 | Named project groups; no invented DLD project match |
| Tokyo | Park Tower Shinonome; Branz Tower Shibaura; Proud Tower Shinonome Canal Court | Named properties and correct wards; anonymous sales remain ward evidence |

## Evidence decisions

- Source URLs, check dates and limits are stored with each review. No numerical sale prices, rental yields or school admission guarantees were added.
- Oksu Riverzen uses K-apt A13375907 (Maebong-gil 15, 1,511 homes), distinct from the separate rental estate and 1,821-home wider development. Seoul Forest Riverview Xi's 1,034-home metric explicitly includes rental homes, while its transaction link excludes the separate rental entity.
- Mokdong 7's September 2026 environmental-assessment consultation is a draft process, not a confirmed relocation date or owner contribution. Conflicting parking counts were omitted.
- Branz Tower Shibaura uses the school's current Shibahama catchment page, not older portal references to Shibaura Primary. Koto's Shinonome catchment source is dated April 2024 and explicitly requires entry-year confirmation.
- Singapore primary-school distance priority is not an admission guarantee. Stamford American's Woodleigh and early-years campuses are distinguished. Conflicting completion dates for Poiz and Park Colonial were omitted.
- Dubai future rail and developer renderings are not treated as current station access or guaranteed apartment views. Park Ridge maps to Hadaeq Sheikh Mohammed bin Rashid; the two Creek estates map to Al Khairan First. Area prices retain area scope.
- No current facility availability, school vacancies, per-unit cooling bills or on-site visits are asserted.

## Publication and verification

`publish-property-reviews.mjs` validates the whole catalogue and supports `--only=` for explicit, distinct known IDs. Publishing this release appends only its 12 profiles, preserves previous records, requires a backup and checks the stored publication projection. The publisher, read query and saved-ID list now have a bounded capacity of 500.

Validation branch: `br-silent-queen-b3trned8`, forked from production `br-super-butterfly-b31hhh93` in project `delicate-scene-40576440`.

Local checks: 112 schemas / 1,344 evidence-linked points; selected batch 12 / 144 points; focused review/navigation/visual/persona/save tests and living-context tests passed (28 tests); TypeScript passed. The validation branch accepted and verified exactly three profiles in each market. Production publication and deployment are completed separately after review checks.
