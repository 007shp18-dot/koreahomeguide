# Shared navigation, sitewide research benchmark and Dubai

Date: 2026-09-06. User approved implementation and release; Japan follows this stage. This record distinguishes code from production verification.

## Changes

- Common Markets / Prices / News / Guides order, fixed EN / KO / 中文 slots, actual article translation mapping and query-preserving Seoul language routes. Untranslated pages show unavailable slots.
- One three-column footer; removed duplicate Singapore Explore and stale local menus. Common short Explore heading with city/period separate, consistent workspace width.
- Prices routes Singapore searches correctly, removes the fixed Seoul jeonse sample, and labels Dubai as area research. Old Seoul News index redirects to current market-filtered News.
- Dubai government aggregate releases (annual 2024/2025 separate from Q1 2026), four selected-area guides with country-scoped Google geocoding, purchase research, AED user-assumption calculator and external news filter. This is not property-level transaction search or active inventory.
- Stored news returns before remote collection; background refresh retains 15-minute cache policy. Initial collection seeds Dubai when absent. Successful in-bounds Google geocodes are reused within the page and the selected address is resolved first.
- Preserved concurrent PR164 Singapore approved-photo improvements and all exact-property imagery.

## Sitewide reference review

Inspected https://www.dubairealestatedata.com/projects, /market, /areas, /compare and /methodology. Relevant patterns: short title; metric/source/period together; aligned search/filter/results; quiet rows; exact chart values and sample sizes; comparable definitions. Applied to shared index headings, flatter Markets/Prices/Guides cards, three-city research questions, Guide city filters, home source links, and real 1Y/3Y/All chart controls ending at the data release. No reference prose, prices or project inventory imported. Source licences must be established independently before future dataset ingestion.

## Official Dubai sources

- 2024 AED761B: https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024 (26 January 2025).
- 2025 AED917B: https://dmo.dof.gov.ae/en/news-and-publications/latest-press-releases/dubai-s-real-estate-market-records-new-historic-milestone-with-transactions-exceeding-aed917-billion-usd-2497-bn-in-2025/ (12 January 2026).
- Q1 2026 AED252B, 60,303 transactions, +31% value YoY: https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026/ (9 April 2026).
- DLD Project Status, Service Charge Index, All Services, Dubai REST and open data; Visit Dubai neighbourhood pages for Downtown, Business Bay, Dubai Marina and Palm Jumeirah. Exact links in lib/dubai/research.ts.

## Database

Migration 0010 extends external_news_items market taxonomy to ae-dubai, retaining all existing allowed values. Validated first on isolated branch br-jolly-butterfly-b32er0yr (codex-dubai-news-20260906), with 911 records retained. Applied transactionally to production br-super-butterfly-b31hhh93 and recorded in signedprice_schema_migrations; post-check retained 911 items and all valid market values. No buildings or transaction records were changed. Production inventory before release: Seoul 48,999 buildings; Singapore 13,873; no Dubai buildings. The inspection branch remains available for review.

## Validation

- Local final full unit suite: 252 files, 2,178 tests passed.
- TypeScript passed; production build passed.
- Lint: zero errors; two pre-existing unused-argument warnings in naver-district-map.test.tsx.
- Added market navigation/language/dubai/geocoder/news latency tests; browser checks cover common navigation, Singapore Prices entry, Dubai selection/cost/news and monthly period controls.
- Browser CI, reviewed visual baselines and production verification: pending at initial commit. Record their actual results after release.

## Remaining scope

Property-level Dubai transactions require a verified source adapter, actual records, entity/coordinate mapping and comparable cohorts. Japanese expansion is later. Never represent selected-area counts as available listings or the annual all-class transaction value as a residential price index.
