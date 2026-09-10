# Site content and layout polish

Scope: improve existing public pages for the overseas-property research journey;
preserve the brand, data, calculation rules, source dates and indexing policy.
The operator explicitly requested natural prose rather than internal or translated
process language, and authorized PR, merge and deployment. Leave the legacy domain
unchanged.

## Changes

- Home and Passport: concrete descriptions of budgets, recorded prices and area;
  simplified English, Korean and Chinese copy without changing calculations.
- Markets and shared metadata: include Dubai alongside Seoul and Singapore.
- Prices: explain comparable property types, medians/sample periods and gross
  versus ownership costs. Link existing Passport and calculator routes.
- Tools: add the existing Dubai Check to all three directories, track only coarse
  navigation dimensions, show investment tools first, and correct currency/language
  labels.
- Dubai: replace release-process wording with plain area-price and comparison
  language; retain the middle-50-percent definition, dates and source references.
- Layout: flexible equal-height price/guide cards, bottom-aligned actions,
  readable text, keyboard focus and mobile tool actions.
- News: omit the empty More news section when only one article matches.
- Seoul Explore: natural building-search labels without changing map behavior.

## Verification

Initial full unit run: 2,399 passed, seven failed on intentionally changed copy or
normalized link assertions. Updated those expectations and reran all seven
relevant suites: 68 passed, including the failed cases. Typecheck and lint passed.
Production build passed before the last copy edits; final build and CI are checked
before merge. No claim of higher search traffic or completed manual visual QA.
