# Explore data audit — 2026-09-07

Read-only audit of installed Explore snapshots and production Neon identity/location tables. Reproduce snapshot checks with `python3 v2/scripts/audit-explore-snapshots.py /tmp/explore-audit.json`. Detailed snapshot findings are in the adjacent JSON file.

| Scope | Coverage | Findings |
| --- | --- | --- |
| Seoul | 48,999 rental inventory identities; 22,720 sale identities; union 57,915 | 8,916 sale-only identities absent from rental inventory. No duplicate IDs within either source or shared-ID name/neighborhood/housing mismatches. |
| Seoul naming | Entire union | 8,542 lot-number names; 1,006 district/neighborhood/name groups share a name across IDs. These need identity review, not automatic merging. |
| Seoul published statistics | Installed sale/rent cohorts | No publication-threshold, finite/nonnegative value, or quartile-order failures. This does not recompute medians from all original contracts. |
| Singapore private projects | 3,862 projects; 133,942 transactions | No duplicate project IDs, orphan transactions, or count/median recomputation failures. 3,403 projects have consistent source coordinates; 459 lack them. 19 shared-coordinate groups require parcel-level interpretation. |
| Dubai | 46 areas; 53 housing segments | No duplicate area IDs, broken comparable references, or checked publication/quartile failures. Data is area-level, not individual buildings. 495 qualifying sales and 37 qualifying rental records are unmapped. |

## Production database checks

- Seoul: 48,999 unique building identities with addresses, zero coordinates. Sorted newline-joined external-ID MD5 `2324942f99aac8489d0da8040ad41957` matches the rental inventory. The 8,916 sale-only identities therefore need ingestion review.
- Singapore: 13,873 identities across the database's broader entity scope, 3,403 with coordinates. Do not compare the broader identity denominator directly with private projects alone.
- `public_entity_locations`: 3,403 unique verified Singapore locations; none outside the checked Singapore bounds. No Seoul rows.
- Identity verification status does not establish geocoding accuracy. Seoul addresses can contain only district, neighborhood and name without a lot or road number.
- Coordinate bounds and internal consistency do not prove real-world building placement.

## Selection repair

The selected Seoul map building did not provide `storedLocationKey`, so the existing location API lookup was inactive. Selection now supplies that key and district and requests the existing Vercel official-building-facts API when stored coordinates are missing. The existing server facts cache is reused. Only the selected building triggers address lookup/geocoding; unresolved buildings retain area context.

The production facts API initially returned `apartment_not_found` for `yongsan-gu-htazbv` (센트럴파크, 한강로3가). Local district prefixes are now normalized when matching K-apt names. Unique-match, district, exact K-apt/BJD keys, and neighborhood-address checks remain mandatory. A matching-name fixture passes; the production provider response must be rechecked after deployment.

Seoul building markers now omit prices. Price evidence remains in the results rail/detail, and the detail rail median uses one line to prevent the final digit wrapping. No third-party coordinates were guessed or bulk-persisted.

## Follow-up priority

1. Verify the Yongsan official-address response and selected-marker behavior after deployment.
2. Reconcile the 8,916 sale-only Seoul identities through the existing ingestion process.
3. Add verified Seoul building coordinates and resolve the 459 missing Singapore project locations using authorized sources; preserve explicit unresolved states.
4. Review duplicate-name groups and lot-only labels before adding display aliases. Keep original source identities.
5. Keep Dubai area precision explicit until building-level licensed data exists.

Snapshot periods: Seoul 2026-02 through 2026-08; Singapore 2021-08 through 2026-08; Dubai 2026-06-08 through 2026-09-05. The legacy 294-row Seoul building summary uses 2026-01 through 2026-07 and is not the current main evidence inventory.

Validation before publication: 69 targeted tests passed; production build and ESLint passed. Live browser/API verification is separate from those checks.
