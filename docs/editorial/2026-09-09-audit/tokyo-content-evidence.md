# Tokyo content evidence and rewrite brief

Checked 2026-09-09. Read-only editorial review; no repository or database changes. Files inspected: `v2/apps/web/content/city-journey-articles.json`, Tokyo section in `content/city-stories.ts`, associated source references. Primary PDFs opened and read, with current JHF PDF rendered to resolve broken text extraction. No interviews or property visits claimed.

## Editorial finding

The Tokyo `which-home` guide and `old-condo-costs` column already have a sound premise and real MLIT references. The national-survey caveat and illustrative 10-year calculation are more careful than generic property marketing. The main weakness is that repeated instructions to “request, check, compare” leave the reader without the exact line to inspect or a decision threshold. The city story repeats those instructions again. A document-reading guide and an analytical cost column should do different jobs.

### Keep / cut / replace

| Existing location | Finding | Concrete change |
|---|---|---|
| `which-home/two-purchases` | Strong distinction between renovated interior and common building, but too much introductory explanation | Keep two sentences. State the central test immediately: can the agreed repair funding cover the coming work without an unbudgeted payment from this buyer? |
| `which-home/scope` | “Full renovation” is correctly questioned; no documentary examples | Replace with works schedule → replaced item/date → excluded pipes/common systems → warranty beneficiary and expiry. Make this a compact checklist. |
| `which-home/plan` + `monthly` + `decision` | Same warning about low monthly charges appears three times | Merge into one worked reading of plan, accounts and approved payment schedule. End with one unresolved-items list rather than another general warning. |
| `which-home/fit` | Pets, bicycles, structural condition and finance are bundled | Keep use restrictions in a short separate row; give seismic evidence its own document row. |
| `old-condo-costs/question` | Reddit reference delays the actual claim | Open with the price gap versus ownership cash requirement. Move Reddit to a small “question raised by readers” source note, not the argument’s main authority. |
| `old-condo-costs/comparison` + `result` | Useful quantitative core | Keep existing explicitly fictional A/B scenario and table. Introduce the result before listing assumptions; place the full assumptions next to the table. |
| `old-condo-costs/evidence` | Accurate national figures, but no local transaction-fee context | Keep one national risk figure; add verified REINS Tokyo fee evidence only after retrieving its primary table. Do not fill this gap with a search snippet. |
| `city-stories.ts` Tokyo `which-home` | Three paragraphs restate the guide | Reduce to a short bridge and two distinct links: “read the documents” and “compare ten-year cash needs”. |

## Verified source ledger

### 1. National MLIT survey: baseline, not a Tokyo bill

[MLIT FY2023 survey results](https://www.mlit.go.jp/jutakukentiku/house/content/001752287.pdf), PDF pages 8 and 14 (printed 7 and 13). The official [statistics index](https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk5_000058.html) dates publication to 2024-06-21. Fieldwork was late October 2023–late January 2024 according to the [survey design page](https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk3_000143.html).

- Reserve balance versus planned balance: **36.6% short**, **39.9% not short**, **23.5% unknown**, chart n=1,402. Denominator concerns associations with a long-term plan and accumulation, not all Tokyo buildings. Unknown is not zero shortfall.
- Mean monthly reserve contribution **JPY13,054 per dwelling**, or **JPY13,378 including allocations from parking and other usage revenue**; chart n=1,522.
- These are national survey responses, not a 2026 Tokyo fee estimate or a measured probability that an individual building needs a special assessment. Keep the two contribution definitions separate.

### 2. MLIT repair-reserve guidance: useful comparison, no automatic verdict

[June 2024 reserve guidance](https://www.mlit.go.jp/jutakukentiku/house/content/001747009.pdf), PDF pages 8, 15–16, 23.

For buildings below 20 storeys and below 5,000 sqm total building floor area, the long-horizon contribution benchmark is **JPY335 per private-unit sqm/month**, central two-thirds of cases **JPY235–430**. Mechanical parking is excluded. This comes from **366 collected long-term plans**, not an observed Tokyo monthly-bill survey. A hypothetical 60 sqm unit gives JPY20,100/month at the mean; that multiplication is an illustration, not a recommended quote.

The phased-funding guidance uses initial ≥0.6× and final ≤1.1× the uniform reference. It expressly does **not** cap later necessary increases following revised costs. Even uniform contributions can increase. Do not headline “repair charges can rise only 1.8×.”

### 3. MLIT long-term plan: exact fields available

[June 2024 standard forms and comments](https://www.mlit.go.jp/jutakukentiku/house/content/001747006.pdf), printed pages 91–100 (PDF 102–111).

The checklist identifies Form 3-1 for horizon (30+ years and two major repairs), Form 3-2 for work items/cycles, Forms 4-1/4-2 for funding and cash-flow graph, and Form 5 for contribution calculation. Annual carried-forward balances matter alongside the eventual total. The guidance recommends review around every five years and recognizes inflation, cost and condition changes. Financing, special contributions and parking transfers must be represented consistently. Treat these as planning guidance; do not present the 30-year horizon as a universal mortgage eligibility rule.

### 4. JHF: distinguish underwriting evidence from a safety guarantee

[FLAT35 used-home technical guide, April 2026](https://www.flat35.com/files/topics/6172_ext_99_0.pdf), PDF page 8 / printed page 6, visually verified from downloaded official PDF. [Current technical-standard page](https://www.flat35.com/business/standard/used/index.html).

The condominium table lists three alternative seismic routes: confirmation certificate issued from **1981-06-01**, registered new-construction date from **1983-04-01**, or compliance with JHF seismic evaluation criteria. The listed evidence includes confirmation records/municipal ledger certificates, building registration and design documents. Its plan-duration criterion is **20 years**, distinct from the MLIT planning benchmark above. These are FLAT35 property criteria, not approval for every borrower, nor a statement that age alone proves a building safe.

### 5. Tokyo buyer checklist: practical fields

[Tokyo existing-condominium buyer guide landing page](https://www.mansion-tokyo.metro.tokyo.lg.jp/kanri/03ansin-guidebook/) and [official key-points PDF](https://www.mansion-tokyo.metro.tokyo.lg.jp/pdf/16baibai-guidebook/16baibai-guidebook10.pdf), PDF pages 7–11. It separates title/environment, private-unit defects/equipment, and management checks. It specifically records monthly management/reserve fees and arrears; defects should include repair date and current status. Windows, entrance doors and balconies may be common property, requiring management confirmation about responsibility. Use this as a document-reading aid. The PDF’s older procedural/legal deadlines should not be republished as current without separate verification. The separate Tokyo management guide is explicitly dated March 2020, despite the live site’s 2026 footer.

## Suggested guide table (editorial synthesis)

Decision column below is SignedPrice’s recommended buying workflow, not quoted law. Obtain records via the seller/agent/management, subject to their provision process; do not promise unrestricted buyer access.

| Document to request | Specific field | Decision the reader can make |
|---|---|---|
| Long-term repair plan / 長期修繕計画 | Revision date, Form 3-2 next major work and excluded items; Forms 4-1/4-2 yearly ending cash | If a deficit year appears, ask which funding source closes it and whether that source is agreed. Do not equate a positive year-30 total with adequate year-5 cash. |
| Current accounts / reserve account | Opening balance, annual receipts, actual spending, closing balance and outstanding borrowing | Reconcile actual balance with the same date in the plan before treating planned funding as available cash. |
| Approved budget and meeting resolutions | Contribution amount, effective month, special assessment amount/due date, proposal versus adopted decision | Put adopted payments in the base case; keep an unresolved proposal as a separate scenario. |
| Unit management statement / seller checklist | This unit’s monthly fees and arrears, other recurring charges | Obtain a written settlement breakdown; do not silently add an average charge or assume arrears disappear. |
| Renovation scope, completion records, warranties | Exact items and dates; common versus private responsibility | Identify what the sale premium buys and which remaining work needs a quote or consent. |
| Confirmation/inspection records, seismic assessment and retrofit records | Issuing date, covered building/block, assessor, findings, completed versus proposed work | Ask a qualified inspector/lender to assess the actual evidence. Interior renovation is not seismic documentation. |
| Management rules / 管理規約・使用細則 | Rental/use limits, renovation consent, pets, exclusive-use areas | Remove a candidate if the intended use is prohibited or cannot be confirmed. |

## Recommended revised article argument

Guide title: **도쿄 리모델링 아파트, 계약 전에 읽어야 할 건물 서류**.
Central question: “이 집의 새 실내를 산 뒤, 공동 건물에 추가로 얼마를 언제 내야 하나?”
Lead: “리모델링 내역서는 내 집 안에서 무엇이 바뀌었는지 보여준다. 장기수선계획과 결산은 집 밖에서 앞으로 무엇을 함께 부담할지 보여준다. 두 서류의 답이 맞아야 매매가격을 비교할 수 있다.”
Then the document table, one simple hypothetical timing example, and an evidence-complete / cost-needs-clarification / intended-use-conflict decision end. Avoid another generic concluding checklist.

Column title: **500만 엔 싼 도쿄 아파트, 10년 지출도 그만큼 적을까?**
Keep the existing fictional A/B example: JPY45m versus50m prices, cumulative cash JPY59.34m versus60.62m, gap JPY1.28m. The original JPY5m price advantage is reduced by JPY3.72m in the stated scenario. A hypothetical JPY10,000 monthly increase for the final five years adds JPY600,000, reducing the gap to JPY680,000. Label all inputs fictional and preserve the existing excluded items: borrowing, FX, opportunity cost, exit cost and residual property value. This is cumulative cash required, not an investment-return calculation or a forecast that the more expensive apartment wins.

The national shortfall figure explains why funding deserves scrutiny; it does not validate the assumed cost amounts. Put this distinction adjacent to the calculation rather than repeating disclaimers throughout.

## REINS local-data lead and access limit

Official REINS index/search results confirm a **2025年度** management/reserve report released **2026-05-28**. The exact primary PDF linked by two secondary articles is:
https://www.reins.or.jp/pdf/trend/rt/rt_202605.pdf

Web fetch and direct standard HTTP fetch returned internal error / HTTP502. I did not read its tables, denominator or methodology and therefore do not recommend publishing its figures from secondary snippets. Secondary pages quote JPY13,895 management + JPY13,910 reserve metropolitan-wide and Tokyo JPY14,878 + JPY13,788, but also contain category/year inconsistencies. These are retrieval targets only, not verified article-ready values. Before use verify FY versus calendar year, Tokyo prefecture versus23 wards, completed-sale extraction, missing-field selection and the stated January2025 methodology change. Do not compare the 2023 national survey mean directly with this sale-sample mean as a time series.

Bounded research complete. Useful next step is editing the two existing Tokyo articles with the verified document mechanics above; local fee statistics can be inserted after primary retrieval succeeds.
