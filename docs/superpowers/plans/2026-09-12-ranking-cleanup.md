# Unified ranking layout

User direction: use the existing Seoul/Singapore ranking format for Tokyo and remove stacked controls and explanations from the global ranking tab.

References reviewed: https://companiesmarketcap.com/ (table-first ranking hierarchy) and https://www.redfin.com/news/data-center/housing-market/ (separate detailed data methodology).

Implementation: shared GET form fields for city, ranking and order; the existing table/CSS for every transaction list; compact page header; brief period/coverage line; expandable methodology and extra comparison links. Keep necessary rental cohort filters in the same form. Keep the verified Tokyo snapshot and promotional image unchanged.

Verification: 50 Tokyo table rows, full JPY amounts, shared selectors, no inferred building identity, cross-market form navigation, mobile containment, source-details disclosure, existing contract/rental tests, design rules, TypeScript, lint, required CI and production navigation.
