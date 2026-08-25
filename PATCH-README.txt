KoreaHomeGuide v12 — Seoul Move Commerce Foundation
Base production/main commit: 8db4ece333338dfcf243f6d3161732158da9a930
Date: 2026-08-25

GOAL
- Keep Rent Check / official rent data as the trust and acquisition core.
- Expand the homepage into Check -> Prepare -> Move -> Settle.
- Measure anonymous interest in future move services before signing partners.
- Keep EN / Simplified Chinese parity and global-ready city/language data attributes.

PRODUCTION FILES
- index.html
- zh/index.html
- move-commerce.css (new, isolated v12 styles)
- move-commerce.js (new, isolated GA4/interaction layer)

TEST FILES
- tests/v12-move-commerce-home.test.cjs
- tests/v12-move-commerce-js.test.cjs

IMPORTANT IMPLEMENTATION NOTE
The approved design originally preferred adding rules to styles.css. This patch instead adds
move-commerce.css and links it after styles.css on both homepages. This deliberately avoids
changing the large shared stylesheet used by Rent Check, Explorer, market and SEO pages while
keeping one shared EN/ZH visual layer.

NO CHANGES TO
- app.js / zh/app.js
- Rent Check scoring or Fair Rent Intelligence
- MOLIT/API/provider code
- Building SEO quarantine
- Dong SEO/indexability
- sitemap behavior
- payments, brokerage, listings, CRM, accounts or lead PII

ANALYTICS
GA4 event: move_service_interest
- city: seoul
- service: internet | sim_esim | moving | cleaning | insurance | relocation
- language: en | zh
- source: homepage_services

GA4 event: move_journey_click
- city: seoul
- stage: check | prepare | move | settle
- language: en | zh

Analytics errors are swallowed so they cannot block navigation or interactions.
No fetch/XHR/backend call exists in move-commerce.js.

TRUST / LEGAL GUARDRAILS
- Service cards explicitly say Coming soon / 即将推出.
- No booking, guaranteed availability, price, rating or partner claim.
- No name/email/phone collection.
- Rent Check remains market-reference information based on official signed transactions.

TDD / VERIFICATION COMPLETED IN ISOLATED SNAPSHOT
1) v12 homepage test was RED before markup existed.
2) v12 JS test was RED before move-commerce.js existed.
3) v12 CSS contract was RED before move-commerce.css existed.
4) GREEN focused/regression command:
   node --test tests/v11-2-building-seo-quarantine.test.cjs tests/v12-move-commerce-home.test.cjs tests/v12-move-commerce-js.test.cjs
   Result: 20 tests passed, 0 failed.
5) node --check move-commerce.js -> exit 0.
6) Static scan of move-commerce.js for fetch/XMLHttpRequest,/api/,MOLIT,DATA_GO -> no matches.
7) Static scan for unverified partner/brokerage claims -> no matches.
8) EN/ZH HTML parsed with no duplicate IDs.

BASELINE PROVENANCE
Before edits, reconstructed current main homepage blobs matched GitHub exactly:
- index.html: ce4841f4c61a6a7d332e7d8cb8daa8c676b7250c
- zh/index.html: e5e60cc7827551f1adbd72d3f6793e7546062fda

UPLOAD
Upload the ZIP contents to the repository root, preserving folders.
Do not delete existing files not present in this ZIP.
