# Buyers and neighbourhood stories implementation plan

Goal: publish two Insights, two budget analyses and two travel stories in English and Korean, and deepen the four canonical budget guides plus existing short Insights.

Architecture: authored records use the existing portfolio manifest and markdown renderer. Preserve existing canonical URLs, evidence snapshots and property briefs. New budget stories join the budget filter; travel stories join neighbourhood discovery.

Constraints: English Insights and budget articles at least 800 substantive words; Korean equivalent explanations. Travel Korean approximately 2,000 characters or more. No fabricated visits, transactions or claims of current availability. Sources checked independently; scenarios labelled. No changes to individual property brief length or database writes.

- [x] Verify source material and capture reproducible budget evidence.
- [x] Write six distinct bilingual stories and deepen existing budget/Insight prose.
- [x] Register discovery, locale links and appropriate photo credits.
- [x] Verify article rendering, evidence calculations, content length, typecheck and existing content tests.
- [ ] Commit, publish through GitHub and verify production pages.

Execution: inline, using the user's existing authorization to commit and publish. No further design approval required.

Additional user direction: expose inspected community accounts in Seoul, Singapore, Dubai and Tokyo, distinguish named-property evidence from neighbourhood context, exclude comparable-property anecdotes, retain source dates and separate those observations from document checks. Reuse the 14 September research records; do not fabricate reviewer counts or claim every property has community coverage.

Verification: 37 related test files exercised (248 passed before retirement-link fixes; the 27 affected checks then passed), focused edition/community checks 34 passed, TypeScript passed, changed-code lint passed. Broad local test run interrupted; CI remains the full-suite release gate. Source inventory: 86 researched records, 76 eligible for direct/area display across 91 mapped properties; 10 comparable-setting records intentionally excluded. Dubai display is area context, not unverified new-build resident testimony.
