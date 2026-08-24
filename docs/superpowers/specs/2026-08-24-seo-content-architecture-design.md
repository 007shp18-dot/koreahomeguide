# KoreaHomeGuide SEO Content Architecture Design

## Goal
Turn the existing single-page KoreaHomeGuide into a small search-oriented site without replacing the current homepage or breaking the working rent, FX, Chinese, calculator, and contact features.

## Scope
Phase 1 adds:
- 2 English tool pages
- 2 Simplified Chinese tool pages
- 15 English rent-market pages (5 districts × 3 official housing types)
- 3 English guides
- 3 Simplified Chinese guides
- shared market-stats API and client rendering
- sitemap/internal-link/navigation updates

The homepage remains the main product landing page.

## URLs
### Tools
- /tools/seoul-rent-check/
- /tools/brokerage-fee-calculator/
- /zh/tools/seoul-rent-check/
- /zh/tools/brokerage-fee-calculator/

### Market pages
Districts:
- gangnam-gu (11680)
- mapo-gu (11440)
- yongsan-gu (11170)
- seongdong-gu (11200)
- yeongdeungpo-gu (11560)

Types:
- apartment
- officetel
- villa

Pattern:
- /rent/{district}/{type}/

Examples:
- /rent/gangnam-gu/officetel/
- /rent/mapo-gu/apartment/

### Guides
English:
- /guides/wolse-vs-jeonse/
- /guides/korea-rental-contract-checklist/
- /guides/seoul-brokerage-fees/

Chinese:
- /zh/guides/wolse-vs-jeonse/
- /zh/guides/korea-rental-contract-checklist/
- /zh/guides/seoul-brokerage-fees/

## SEO Principles
- No 100-page launch.
- Each market page has a unique title, description, district introduction, practical renter context, and links to Rent Check / Calculator.
- Data is official MOLIT transaction data; asking prices are never mixed with signed transaction prices.
- Every page has canonical metadata.
- Chinese equivalents use hreflang where an actual equivalent exists; English-only market pages do not invent thin Chinese duplicates.
- Sitewide internal links make tools, guides, and rent pages crawlable without relying only on the sitemap.

## Market Data
Create `/api/rent-market` that reuses the existing official-data core instead of duplicating external API logic.

Inputs:
- type: apartment | officetel | villa
- lawdCd: 5-digit district code
- months: integer, fixed to 6 by page UI

Output:
- district code
- property type
- months used
- total contracts
- monthly-rent contract count
- median deposit for monthly-rent contracts
- median monthly rent for monthly-rent contracts
- median jeonse deposit for zero-monthly-rent contracts when present
- size bands: <20㎡, 20–30㎡, 30–40㎡, 40–60㎡, 60㎡+
- quarter-over-quarter comparison when enough observations exist
- up to 10 recent representative signed contracts
- data-through month

Rules:
- Use completed months only.
- Monthly-rent medians exclude monthlyRent=0.
- Jeonse statistics are separated, never blended into monthly-rent medians.
- If data is sparse, show an explicit insufficient-data state rather than fabricated values.
- No appraisal language; all pages state that figures are market references based on reported transactions.

## Tool Pages
The tool pages reuse the existing production logic rather than creating new calculation algorithms.

### Rent Check
- Same district/property/deposit/rent/size inputs as homepage.
- Same `/api/rent-check` backend.
- Same currency selector and native USD/CNY input behavior.
- Supporting copy explains what “fair / above / below” means and the comparison limitations.

### Brokerage Calculator
- Same brokerage formulas and currency input behavior as homepage.
- Explains that legal brackets are calculated in KRW even when the visitor enters USD/CNY.
- Includes links to the Seoul brokerage fee guide and Rent Check.

## Guides
Each guide is a real article, not placeholder copy. The English version targets search intent; Chinese version is localized, not a literal machine translation.

1. Wolse vs Jeonse: payment structure, risk, who each suits, what foreigners should verify.
2. Rental contract checklist: registry, landlord, property address, deposit protection, fees, contract terms, move-in registration caveat.
3. Seoul brokerage fees: transaction-value formula, ceiling concept, officetel distinction, VAT/negotiation note, calculator CTA.

Legal/high-stakes language stays educational and points users to official/qualified help when needed.

## Navigation
Homepage keeps current primary navigation. Add discoverable footer sections:
- Tools
- Rent by district
- Guides
- Language
- Contact

Tool and guide pages use a compact header linking Home / Rent Check / Calculator / Guides and language equivalent where one exists.

## Styling
Reuse `styles.css` and existing visual system. Add focused classes for article pages, market summary cards, metric grids, and internal-link cards. Do not redesign the homepage.

## Testing
Add tests for:
- all planned URLs/files exist
- canonical/hreflang behavior
- sitemap contains every indexable Phase 1 URL
- market API median/statistics behavior and completed-month handling
- market pages carry unique district/type metadata and meaningful body copy
- tool pages load existing currency/rent-check/brokerage utilities
- English/Chinese tool and guide equivalents link correctly
- existing v7.3.1 regression suite remains green

## Non-goals
- No 25-district rollout yet.
- No user accounts or database.
- No listing marketplace.
- No Google Maps migration.
- No paid API or new FX provider.
- No duplicate Chinese market pages until English pages show search demand.
