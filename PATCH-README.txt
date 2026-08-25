KoreaHomeGuide lead form visual fix
2026-08-25

Upload these files to the SAME paths in the repository root.

Changes:
- Fix email input/button layout in lead capture.
- Keep Help form hidden until email save succeeds.
- Style Help button consistently.
- Keep mobile layout stacked and readable.
- Replace personal Gmail footer links with hello@koreahomeguide.com on EN/ZH homepage and standalone Rent Check pages.

Production files:
- cold-start.css
- index.html
- zh/index.html
- tools/seoul-rent-check/index.html
- zh/tools/seoul-rent-check/index.html

Regression test:
- tests/cold-start-lead-layout.test.cjs
