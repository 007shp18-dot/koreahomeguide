KoreaHomeGuide v10.8.2 Rent Check clipping fix

Replace these two repository files, preserving paths:
- tools/seoul-rent-check/index.html
- zh/tools/seoul-rent-check/index.html

What changes:
- Desktop Rent Check form becomes a two-row layout inside the v10.7 product/context-rail layout.
- Row 1: Area / Property type / Size
- Row 2: Deposit / Monthly rent / Check button
- Numeric inputs get min-width:0 + shrink-safe flex sizing so USD/CNY/KRW values do not clip.
- Mobile <=760px keeps the existing single-column layout.
- No data, calculation, routing, canonical, hreflang, or API changes.
