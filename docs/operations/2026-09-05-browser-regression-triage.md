# Browser regression triage — 2026-09-05

Baseline: [run 33928954548](https://github.com/007shp18-dot/koreahomeguide/actions/runs/33928954548), application commit `6543996a826b4c7aaaf01b762064240065debc2a`. The 419-case run reports 285 passed, 113 failed, 21 skipped. Counts below include repeated viewports; they are not unique product defects.

## Full failure inventory by suite

| Suite | Failed cases | Evidence and next action |
| --- | ---: | --- |
| area-explore | 20 | Legacy district SVG, map legend, expandable directory and view navigation locators are missing. The Detail/Check journey cannot find the detail link inside the selected row. Trace the approved current UI before replacing assertions; preserve cohort, withholding and state-restoration coverage. |
| korea-detail | 12 | Desktop rail is 300px versus the old 280px assertion; a generic `details` locator now matches three disclosures; district entry link expectations also fail. Reconcile layout with the approved design and scope evidence assertions to the evidence section. |
| korea-guide | 4 | The legacy guide navigation is absent after the guide migration. Verify the redirect and replacement guide's sources and working actions. |
| rankings | 12 | Old heading, 24 versus 25 rows, missing legacy median-tab links, and old global navigation. Reconcile each cohort and unavailable-row semantics; do not merely accept the received count. |
| rent-check | 1 | Test expects 52px controls; the approved September 4 plan specifies 48px. Update the exact size assertion while keeping all alignment assertions. |
| singapore | 8 | Four evidence journeys fail at a 32px link; four shared-shell tests reference an obsolete navigation attribute. Repair target size; inspect shell dimensions and current navigation separately. |
| visible-foundation | 36 | Old home/rankings headings, eight editorial routes with now-valid EN/zh-Hans alternates (16 failures across two viewports), market-navigation expectations and 12 unsupported-route HTTP-status mismatches. Update exact reviewed language destinations; investigate route capability semantics before changing 404 expectations. |
| editorial-growth-review | 20 | Four home cases stop on undersized policy links; 12 other cases have no baseline image; two Chinese tracking checks see CSS `normal` rather than `0px`; two toolbar focus checks cannot resolve the old accessible name. Inspect actual rendered behavior and baseline images. |
| **Total** | **113** | The remaining causes are not automatically classified as harmless test drift. |

## First repair batch

- `singapore.module.css`: `.segmentRow a` now has a 44px minimum height. The existing browser test measured 32px on all four viewports; the neighboring unavailable-evidence link already used 44px.
- `editorial-growth-review.module.css`: policy links in `.changeList` now share the existing 44px inline-flex action rule. They previously had no target-size rule, unlike the neighboring contextual actions. Home review failures measured approximately 24.8px in English and 27.2px in Chinese.
- `rent-check.spec.ts`: align the test with the explicitly approved 48px input/button size. Preserve row alignment and all mobile target checks.
- `public-route-contract.ts` and `visible-foundation.spec.ts`: enumerate exact reviewed English/Chinese counterparts and require `en`, `zh-Hans` and `x-default` to point to those destinations. Existing Korean market-route checks remain. This fixes a test that incorrectly required no language alternates on reviewed bilingual content; it does not loosen canonical or noindex checks.

No screenshot baseline was approved, test skipped, error threshold increased, or unsupported route reclassified in this batch. A passing targeted unit suite is not a browser pass. Keep the production release NO-GO until the new CI result and live database gates are resolved.

## Verification

- Targeted existing portfolio/typography tests: 2 files, 17 tests pass.
- Workspace typecheck and lint pass.
- Production build passes (890 static pages); no database URL was configured, so migration was skipped.
- Browser verification must be read from the next CI run for this repair commit; no claim that all 113 failures are fixed.

## Next repair order

1. Check the new CI result for actual 44px targets and exact bilingual metadata. Later assertions may expose further issues once these earlier failures are removed.
2. Resolve Explore → Detail → Check → restored Explore against the approved current controls.
3. Reconcile rankings cohorts, guide redirects and unsupported-market route behavior.
4. Inspect the missing visual baselines and keyboard/Chinese rendering; retain their gates until complete.
5. Run the full matrix and scoped Preview database migration/projection/fallback checks before merging.
