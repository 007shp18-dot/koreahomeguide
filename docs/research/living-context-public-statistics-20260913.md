# Living-context public statistics — 2026-09-13

The companion JSON records 13 source summaries and 17 typed reference observations for 8 of the 12 existing profiles. These are area, station or mall observations. No property-entrance footfall or on-site retail-sales measurement is claimed. Existing source records are preserved as revisions; latest published records are selected by the existing loader.

## Scope

- Seoul: named reference commercial areas Gubanpo station (3110908), Seoul Forest station (3120050), Ahyeon station exit 4 (3110584). These are not measured property buffers, an exhaustive catchment or nearest-area assertions. 2025 Q4 published-industry estimated sales and original population counts are linked by identical area code and period.
- Tokyo: JR East FY2024 boardings for Meguro and Shibuya; Tokyo Metro FY2025 entries/exits for Toyosu. Different operators and boarding-only versus entry/exit definitions must not be combined or ranked as equivalent footfall.
- Singapore: PLQ Mall CY2024 and January–September 2025 visitation and tenant sales from Lendlease REIT's 2025-11-05 acquisition presentation, page 9. The mall is part of the Park Place integrated development. Full-year and nine-month periods are not directly comparable.
- Dubai: Dubai Festival City Mall CY2025 visits and Ramadan/Eid 2026 year-on-year changes from the operator's 2026-03-27 press release distributed by Zawya/TradingView. Separate mall in the wider Creek area, not Valia's development, buffer or future demand. Operator claims are not independently audited here; the event period is not annual growth.

Marina One, Wallich Residence, Skyflame and Skyterraces have no verified numerical linkage in this pass. LTA station data requires API access, which is not available in this session. Cityland Mall's pre-opening expectation of 12 million visits is excluded from actuals. Portfolio-wide retail sales are not substituted for individual malls.

## Seoul extraction and checks

Sales: official `OA-15572` 2025 ZIP, public download form `infId=OA-15572`, `seq=51`, `infSeq=3`. Decode the CSV as CP949. Filter `기준_년분기_코드=20254` and each `상권_코드`. Sum `당월_매출_금액` once per distinct service-industry code. Each selected total reconciles exactly to the sum of weekday and weekend amounts. Missing industries are not zero and these totals do not represent all business turnover. Ahyeon exit 4 is dominated by clinics/pharmaceutical sales; it is not evidence of general shopping demand.

Sales archive SHA-256: `c907f3d386d62b89f45781e6e6172328ee91b1b8dd2c621e4171e437bee1c6b2`.

Population: `OA-15568` official public sheet JSON download with `filterCol=STDR_YYQU_CD`, `txtFilter=20254`. Returned 1,648 rows. Select matching `trdar_cd`; retain `tot_flpop_co` without dividing by days, hours or treating it as unique visitors. The precise temporal/de-duplication definition was not established in this pass. The UI explicitly identifies the original field and period rather than labeling it daily footfall. Minor demographic subtotal rounding differences are not rewritten.

Population JSON SHA-256: `4a3aa0df8fdb3197e96631af37fb5bfe2fafc6732d7c278c7336a57fb8520b9d`.

Source URLs, periods, units and scope are stored with each addition. Seoul source attribution follows the stated KOGL Type 1 terms. Other sources are represented by short original factual summaries and links, not reproduced documents or images.

## Validation and release

All 12 revised profiles passed the existing public projection schema. Validation DB confirmed 12 profiles, 8 with numerical references and 17 reference observations. Type checking passed. The UI note was updated in all three locales so it distinguishes published surrounding statistics from uncollected property measurements.

At the last release check, the existing production `/ko/living/` route returned 404. The earlier main merge had not produced a Vercel production deployment. Database publication does not establish live UI availability; a deployment and browser check are still required.
