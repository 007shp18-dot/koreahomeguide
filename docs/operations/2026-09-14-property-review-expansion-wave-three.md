# Property reviews: 112 to 124

Adds three residential reviews per city, with natural Korean and English editorial paragraphs, evidence-linked detail points, and Korean/English/Chinese first-glance and household summaries. The existing source section remains at the bottom. All 112 previous reviews and editorials are semantically unchanged.

| City | Additions | Identity |
| --- | --- | --- |
| Seoul | DMC Park View Xi Complex 1; Raemian Mapo Wellstream; Gongdeok Xi | Exact published estate IDs; separate rental entities excluded |
| Singapore | Watertown; North Park Residences; Bedok Residences | Exact OCR project IDs from the installed explore index |
| Dubai | Marina Quays; 29 Boulevard; Al Thayyal | Named groups, without invented DLD project IDs; Marsa Dubai, Burj Khalifa and Al Thanyah Third area prices |
| Tokyo | City Tower Oimachi; Park Homes Toyosu The Residence; Harumi Towers Chrono Residence | Named buildings in Shinagawa, Koto and Chuo; anonymous price evidence retains area scope |

## Research boundaries

- DMC's 4,300-home whole-development total is not used as a Complex 1 metric. The wider development's school, park and heating context is explicitly scoped.
- Wellstream's conflicting road address and completion month are omitted. Only selected 84.98E plans have independent space; no rental permission or return is asserted.
- Gongdeok Xi is distinct from Gongdeok Park Xi. Its principal station is Aeogae, with Ahyeon a secondary option.
- Watertown uses architect RSP's 992-home count, not a conflicting portal count. North Park's historical expected occupation wording is not reused as a current schedule. Singapore schools are nearby options, without admission or one-kilometre certification.
- 29 Boulevard's contradictory floor totals are omitted. JINS nurseries are distinguished from primary schools and on-site facilities. Al Thayyal's listed studio-to-two-bedroom mix is a material family-space constraint.
- Chrono's 883 homes and 2013 completion exclude neighbouring Tiaro. Harumi Liner stops on the public road, not a private estate shuttle. Toyosu school-district evidence is dated April 2024 and requires entry-year confirmation.
- No invented visits, walk times, property sale prices, yields, guaranteed views or current facility availability. No new photography or social posts.

## Verification and release

The complete catalogue validates as 124 profiles and 1,443 linked points. The new batch has 99 points. Existing profile/editorial JSON values were compared with the base commit and preserved. Focused review, editorial, navigation, visual, household, save, price-scope and name-match tests cover the addition. Dubai price tests explicitly assert the three new area cohorts.

Validation branch `br-nameless-band-b3tuaulb` forks production `br-super-butterfly-b31hhh93` in Neon project `delicate-scene-40576440`. The publisher appended and verified exactly 12 selected profiles after a backup and rights checks. Production initially contains 112 published profiles; the ordered business-key/content-hash digest is `7b6758b5ac995eb1c09190735d8b3fde`.

Release sequence: CI and Vercel preview, browser review, merge at verified head, production READY, append the same 12 IDs with a new backup, verify 124 published profiles and the unchanged original-112 digest, then check live detail pages. Credentials and temporary backups are excluded from git.

Hosted preview checks confirmed Chrono's Korean overview and five priorities, and Al Thayyal's English copy, household switching and correctly labelled Al Thanyah Third price. They also exposed mismatched generated questions: bedroom limits were treated as amenity access, nurseries as address-based school allocation, and `outdoor` as an entrance because it contains `door`. Dedicated layout and early-years topics, word-bounded entrance matching, and clearer fee/amenity precedence correct those combinations. Regression checks assert the resulting questions against real catalogue entries. This final logic change is verified through CI and the production screen checks without another optional hosted preview build.
