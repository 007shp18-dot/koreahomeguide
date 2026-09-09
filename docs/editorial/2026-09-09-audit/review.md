# Independent editorial release review

Reviewed frozen base `15df007b915947e1409fd68cacb4ac4110ed81c9` through `bc0def1` on 9 September 2026. Read-only review of release content, integration, evidence memos and audit documentation; no GitHub posts or code changes.

| Scope | Spec verdict | Quality verdict |
| --- | --- | --- |
| Dubai rental-yield EN/KO | APPROVED | APPROVED |
| Tokyo old-condo-costs and which-home EN/KO | APPROVED | APPROVED, one optional wording nit below |
| Whole branch | APPROVED | APPROVED, minor copy nits only |

No material correctness, source-support, route or translation defect found. The approved first-batch scope is delivered; the audit explicitly separates its remaining backlog from completed rewrites. Approval does not certify untouched backlog facts or replace the root agent's final automated release gates.

## Verification

- Independently recalculated Dubai operating income (AED45,958.333), price and acquisition-cash yields, every 3×3 matrix cell, both amortized loan payments, annual cash deficits and contractual break-even rents. All published rounding is correct. The 0.56 percentage-point charge difference correctly uses unrounded yields.
- Independently recomputed Tokyo totals, JPY59.34m and JPY60.62m. JPY10,000 for 60 months adds JPY600,000, leaving JPY680,000 of the original modeled gap. The text explicitly excludes residual value, opportunity cost, borrowing and exit costs and does not call gross cash investment return.
- CBRE's original linked PDF, printed page 6, supports apartment rent declines of 6.5% quarterly and 2.4% annually. The landing page establishes 28 July 2026 publication. The PDF's stale title metadata is correctly rejected in favor of its internal Q2 2026 labeling. [CBRE report](https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q2-2026)
- DLD's release confirms 118,385 new contracts, 135,607 renewals and publication on 19 April 2026; the article does not invent a residential denominator or renewal probability. DLD's completed-sale service confirms 2% per party; its charge form excludes arrears and its FAQ includes insurance/reserves. [DLD release](https://dubailand.gov.ae/en/news-media/dubai-s-rental-market-charts-stable-trajectory-reflecting-integrated-regulatory-environment-and-sustained-public-confidence/), [sale service](https://dubailand.gov.ae/en/eservices/property-sale-registration/), [charge form](https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index), [FAQ](https://dubailand.gov.ae/en/frequently-asked-questions/)
- MLIT original survey PDF pages 8 and 14 supports 36.6%/39.9%/23.5%, n=1,402, and both reserve-contribution definitions. The article preserves the national and relevant-response scope. Original repair-plan forms and Tokyo buyer checklist support cash timing, funding, adopted versus proposed commitments and document fields. The JHF PDF was retrieved; its detailed seismic-date interpretation remains supported by the memo's recorded visual verification because extraction is poor and this review's screenshot responses did not expose renderable images. The article itself makes only the appropriately qualified general underwriting-document claim. [MLIT survey](https://www.mlit.go.jp/jutakukentiku/house/content/001752287.pdf), [planning forms](https://www.mlit.go.jp/jutakukentiku/house/content/001747006.pdf), [Tokyo checklist](https://www.mansion-tokyo.metro.tokyo.lg.jp/pdf/16baibai-guidebook/16baibai-guidebook10.pdf)
- Primary Korean guidance confirms next-day opposability and the additional fixed-date priority requirement. Government24 confirms the registered-foreigner 15-day address deadline, and HF confirms loan-linked eligibility plus the separate Toss deadline. The translations retain the limitations and do not promise guarantee acceptance. [Priority guidance](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=3&cnpClsNo=1&csmSeq=629), [address procedure](https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12700000026), [HF product](https://www.hf.go.kr/ko/sub02/sub02_05_01.do)
- IRAS supports the individual ABSD matrix, effective date, higher-value tax base, property-interest count and FTA distinctions. S$44,600 BSD and all three combined-duty totals reconcile; the example's BSD bands do not imply that the 4% band is the maximum for more expensive homes. EN/KO/Chinese treatment is equivalent. [ABSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer's-stamp-duty-(absd)), [BSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer's-stamp-duty-(bsd)), [FTA](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-(ftas))
- Loaded resolved runtime portfolio: exactly 80 records and all 80 canonical URLs match the pre-edit audit inventory. All six replaced policies retain 4 September publication, with new 9 September update timestamps and equivalent translation groups. No research expansion overwrites these new policy bodies.
- Mechanically compared journey JSON to base: all 30 city/article identities preserved. All 42 non-Tokyo paragraph changes are exact final-link removals whose same URL remains attached to that same section; no unique source removed.
- Mechanically compared hubs: all 24 stage IDs and all 47 existing action hrefs unchanged. The body now serves as concise navigation. Seoul dataset/body remains unchanged while headline/deck expose the inclusive size band and group threshold.

## Optional copy nits, not release blockers

1. P3 — `v2/apps/web/content/city-journey-articles.json:4157`: “Does ten-year cash?” is an awkward ellipsis. Prefer “Does it still cost less over ten years?” The deck already supplies the qualified answer; this is readability only.
2. P3 — `v2/apps/web/content/city-stories.ts:39,118`: new Korean summary paragraphs repeat the inherited typo “왕십니”. Use “왕십리” (Wangsimni). This does not change the routes or substantive comparison. The untouched deck and section title also contain it and could be corrected in the same copy pass.

## Scoped copy-fix confirmation

Reviewed `copy-fix.diff` only: exactly one Tokyo English title replacement and four 왕십니→왕십리 replacements across the two identified content files. Both P3 findings are **ADDRESSED**. No data, route, identifier or calculation change appears in this patch. Prior APPROVED verdicts stand; no additional research or full review was performed. Root reports the 13 targeted city-story/journey tests passed.

## Scoped CI compatibility review

Reviewed `ci-compat.diff` only (two test files): **APPROVED**. The mortgage test retains its independent 300-month balance amortization, checks operating income and break-even cash reconciliation, and now locates the financing section and each rate's sentence before asserting its corresponding payment and annual cash result. This preserves the financial assertions while adapting to the new prose format. The primary-source host allowlist remains an exact hostname set; only the four verified new hosts are added. The date allowlist remains explicit with only 2026-09-09 added. No production code changes, new research or full review. Focused test execution remains the root/author's release gate.

## Scoped source-date UI and policy-route integration review

Reviewed the current uncommitted diff and its actual Newsroom, journey, policy, Insights and buying-guide consumers: **APPROVED — no material defects found in the requested scope**.

- Separate source-check labels/dates are removed from the specified headers, source lists and policy trackers. Original source hrefs and internal provenance remain intact. Genuine article publication/update dates, statistical periods and policy announcement/effective/expiry rendering are preserved.
- Exactly the two named English policy explainers select `NewsroomArticle` and their portfolio title/deck metadata, making the complete Markdown bodies and tables reachable on their existing canonical policy routes. All four other policy routes retain `PolicyRecordArticle`; its lifecycle, affected-group, timeline and before/after consumers remain intact. Structured data still receives the actual portfolio article.
- Removing journey JSON-LD `datePublished`/`dateModified` is semantically correct: `JourneyArticle` defines `checkedAt` but no publication/update fields. This avoids asserting invented publication history while retaining canonical URL, headline, author, publisher and citations.
- The two-column source grid matches both remaining list children; the existing small-screen one-column rule remains. The E2E source selector correctly addresses the labelled section rather than a heading descendant.
- The source-date assertion now validates strict ISO day syntax, valid parsing and exact UTC calendar round-trip; invalid normalized dates are rejected. The exact host gate and independently amortized mortgage/rate/payment/cash assertions remain intact.
- Existing unit expectations cover both integrated explainer routes, metadata and original links; lifecycle/date expectations are updated without removing genuine date checks. Root/implementer reports 39 focused tests, typecheck and scoped lint passed; this review did not repeat those gates or source research.

Scope clarification received from root: removal concerns separate “출처 확인일” / source-check UI labels, not a site-wide article-history redesign. Existing generic index-card dates derived from journey/provenance fields remain unchanged and are not newly relabelled by this diff; their broader date-model cleanup is outside this narrow approval. This verdict does not claim every source-check mention in editorial prose or every generic index date was removed.
