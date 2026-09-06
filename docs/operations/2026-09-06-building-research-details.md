# Seoul and Singapore building research

Scope approved after the Explore rollout: improve attached building data and useful detail evidence while preserving shared visual rules. Saved comparisons, Dubai, Japan and brokerage remain later stages.

- Seoul retrieves verified stored addresses/coordinates for up to 50 visible unresolved map identities per request. A selected identity takes priority. Failed reads leave the current map/list usable.
- Singapore uses released URA project X/Y coordinates, converted from SVY21 using SLA projection parameters. Missing or conflicting project coordinates retain the existing address lookup. These are project positions, not unit entrances. The current released snapshot supplies consistent coordinates for 3,403 of 3,862 projects.
- Seoul plots retained individual transactions, with an explicit incomplete-history label. It does not derive a monthly volume series from the capped 20-sale list. Size comparisons use full published cohort aggregates and preserve transaction/contract selection.
- Singapore monthly counts use the complete released project record set. Price points need five records per month. Size medians separate property type, sale type, area basis and tenure; periods remain the released period.
- Both markets share an editable purchase/rental scenario. Only a published sale median is prefilled. Costs, rent and vacancy require user input, including an explicit zero. Formula excludes financing and personal income tax; it does not supply tax advice or guessed rental evidence.
- Existing approved exact-property photos remain connected. This change does not claim full photo coverage or add unreviewed imagery. Singapore profile now exposes source tenure/property types and a return link to the selected project on Explore.

Sources: [SLA SVY21 definition](https://app.sla.gov.sg/sirent/About/PlaneCoordinateSystem), [OneMap coordinate conventions](https://www.onemap.gov.sg/apidocs/coordinate), existing released MOLIT/URA snapshots and publication rules.

Validation: coordinate reference checks; missing/conflicting coordinate rejection; financial formula and invalid-input tests; monthly minimum sample/gap tests; group separation; API batch limits; existing map and route tests. Browser gate covers the editable scenario and shared responsive layout alongside existing navigation flows.
