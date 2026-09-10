# Explore selection and Dubai project review

## Checked-in data audit

- Seoul: 57,915 combined inventory identities; no duplicate inventory/sale IDs, sale/rent identity mismatches, or published numeric cohort errors. These are source inventory records, not a count of verified physical buildings. 8,542 numeric parcel names and 1,006 same-neighborhood name collisions require identity-aware location matching.
- Singapore: 3,862 projects / 133,942 sales. Source rows reproduce project counts and median prices. 3,403 projects have consistent source coordinates; 459 lack coordinates. This consistency audit does not establish real-world address accuracy.
- Dubai: original uploaded transactions, rents and lands reproduce all 46 published areas and totals exactly, including source digests after BOM decoding. Originals were recovered in the earlier scratch upload directory; do not ask for these files again merely because the current upload directory lacks them.

## Dubai project publication

Inputs: `03-transactions-2026-09-06-2-.csv`, `02-lands-2026-09-06.csv`. Existing area evidence also uses `01-rents-2026-09-06.csv`; `02-rents-2026-09-06.csv` is an identical duplicate and must not be appended. The uploaded projects export contains only one row and is not a complete project register.

The initial exact-name/area/land-number audit found 65 project/housing candidates with at least 30 sales in one stage. The release adds stricter published-area linkage and transaction-identity checks, leaving 56 cohorts in 16 areas: 1 Ready and 55 Off-Plan. This is partial coverage, not the full Dubai project inventory.

- Normalize case, Unicode, whitespace and punctuation only; no fuzzy project matching.
- Require one project number for the exact source area/name and one area/name for that number.
- Require a currently published official area name. Unreviewed aliases are not joined.
- Separate apartment/villa and Ready/Off-Plan; require 30 qualifying sales per cohort during 2026-06-08–2026-09-05.
- Collapse identical duplicate transaction rows. Exclude transaction numbers with differing rows: the export has no unit identity to safely allocate multi-property registrations.
- Compute the median sale price and median of each sale's AED/m². Publish no project rent ratio inferred from area rent.
- Uploaded files contain no project coordinates. A selected project retains an explicitly labelled area marker.
- Verify source hashes against the released area snapshot when building. Serve projects only when the active repository has the matching digest, period and published state. Existing repository rights checks remain authoritative.
- The browser receives about 12 KB of precomputed project aggregates; project clicks add no database or external API requests. Raw source rows are not checked in.

## Interaction changes

Singapore and Dubai now resolve the list page from the selected identity, including deep links and map selections. Clearing selection restores ordinary pagination. Singapore skips constructing map layers that are not currently shown. Dubai project selection is preserved in the URL with its parent area and changes the price card without asserting a precise building marker.

## Verification

Eight focused suites / 51 tests passed, including source-to-map pagination, Singapore coverage, project identity exclusions, publication minimums, snapshot digest gating and a rendered project deep link. Type checking passed. Browser QA could not run: supervised preview could not resolve the monorepo Next executable, and browser tab discovery timed out. Do not describe visual/mobile verification as completed for this release.

The build also exposed whole-project file tracing from the Seoul building identity lookup. Replaced the dynamic filename loop with two statically scoped file paths; the existing index lookup test passed.
