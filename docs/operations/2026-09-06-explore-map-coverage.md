# Explore: complete-result map accounting

## Scope and root causes

The operator's “775 buildings but only 1 or 3 on the map” was an example of a site-wide Explore consistency problem, not a requested fixed inventory count.

- Seoul discarded unlocated buildings before passing results to NAVER. The server also paginated detailed buildings to 50; the first fix needed a second correction to account for other pages.
- Seoul neighborhood geocoding could fail without leaving any map representation of those neighborhoods. Initial map rendering also waited for the optional geocoder, even when source/reference coordinates were usable.
- Singapore sent only the 24 visible list rows to Google Maps despite having the full filtered project inventory.

## Implemented boundary

- Seoul retains the bounded detail page and sends compact, counted neighborhood/housing groups for matches outside that page. Missing page coordinates and off-page matches are merged into explicitly approximate area groups. No synthetic individual building coordinate is created or persisted.
- Missing neighborhood references remain at the existing district reference. Clicking that fallback opens the building layer; users can continue through the existing neighborhood selector/list.
- Singapore maps all filtered projects, with zoom-dependent clusters for source coordinates. Missing coordinates are represented at the mean of known projects in the same postal district, distinctly labeled “Area only”. If that district has no reference, a counted district action stays below the map.
- Seoul query editing is labeled as a loaded-results preview until submission; stale whole-search groups are withheld while the query differs from the server query.
- Exact-coordinate points, approximate groups, and unplaced counts are separate concepts. Area references must not flow into proximity calculations or building valuations.
- A map-provider authentication failure is still a real error. This patch improves fallback/counting and removes an unjustified NAVER-verification accusation; it does not claim to have changed provider credentials or domain authorization.

## Data observation

Read-only audit of the installed Singapore private-sale artifact found 3,862 projects: 3,403 with usable URA project coordinates, 455 representable at a same-district reference, and 4 in District 24 without a map reference. These are snapshot observations, not permanent totals or claims about the entire Singapore market.

## Related content corrections

- Fix decimal SGD parsing that could turn SGD 980,000.50 into S$98M instead of S$980K.
- Update Singapore's shell to acknowledge private-home and HDB evidence and its actual coverage boundaries.
- Remove stale publication-gate/internal “claim-free”/“parity buildings” copy from selected entry/explorer surfaces.
- Seoul Explore/Rankings/shared footer now describe sale, jeonse and monthly evidence rather than jeonse alone.
- Reaffirm the product roadmap's overseas-investment → purchase/sale → ownership/management direction, with real partner/operating readiness alongside product development.

This is a targeted source-and-data audit, not certification of every guide, tax statement, translation, page or partner claim across the site.

## Verification and release

Targeted red/green regressions cover counted 775-result fixtures, the actual Seoul projection-to-map path on pages 1 and 2, unavailable neighborhood geocoding, Singapore pagination, map clustering and decimal price formatting. The first review found server-pagination and fallback-click defects; both were corrected before handoff.

Final full-suite, typecheck, lint and build results are recorded in PR #167. No browser interaction QA or production deployment is claimed for this patch.

The Dubai actual aggregate remains in the existing authorized public review scope: 46 canonical areas / 53 segments, draft/noindex, outside the installed runtime. This map patch does not silently activate Dubai benchmarks or change the source/unit review record.
