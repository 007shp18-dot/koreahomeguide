# Global detail and copy audit — 2026-09-07

## Scope and reference

User requested a site-wide detail/copy review, preserving SignedPrice's white/navy/blue identity and avoiding uneven list rows, wrapped currency values, and wrapped action labels.

References: [PropertyGuru Singapore listings](https://www.propertyguru.com.sg/property-for-sale) (public page structure and desktop browser screenshot inspected); [Bayut Dubai listings](https://www.bayut.com/for-sale/property/dubai/) (public page structure inspected; browser CAPTCHA prevented visual inspection). Both distinguish price, name/address, property attributes, and reporting/listing date. Borrow the hierarchy, not advertisements, marketplace promises, or inventory data.

## Inspected surfaces and disposition

| Surface | Finding / action |
| --- | --- |
| Shared header/footer | Reviewed five-section navigation and market links; retained destinations and layout. Existing header contract tests pass. |
| Home / Passport | Existing three-city hierarchy and one-line candidate labels retained; no new functionality. |
| Seoul Explore / details | Retained verified-name/lot-address fallback and full original address. Shared detail heading gets normal tracking and readable line height. |
| Singapore Explore / details / Check | Project names still allowed two lines. Use one-line ellipsis, full title/address attributes, separate predictable price/count rows. Keep complete currency values together; contain exceptional overflow within the value. Pagination controls now 44px and 14px. |
| Dubai Explore / detail / Check | Area/hero/Check monetary values could break inside digits. Keep these together; retain wrapping for source descriptions. Shorten and stack Check actions so labels align. Clarify unavailable-state copy without asserting a fixed area count. |
| Tools | Increase 12px market/currency labels to 14px, keep short actions together, replace awkward English asking-price/rent descriptions. |
| News / article headings | Normal tracking and 1.2 line height on current newsroom headings; improve older news-route heading spacing too. |
| Guides / feature pages | Improve heading spacing and 12–13px explanatory text to 14px. Body paragraphs and full detail names may wrap naturally; do not truncate reading content. |

## Validation and limits

- Targeted route/header tests: 32 passed before release.
- Added Singapore browser assertions for full title availability, one-line project/price rendering, and page containment to the existing search journey.
- Build, lint, independent review, CI, and production status are recorded in the release PR.
- No replacement-character or obvious common English typo matched in the inspected component/copy scan. This is not a claim that every editorial article has been proofread.
- No changes to calculations, datasets, evidence thresholds, reported prices, publication dates, or naming provenance.
- No passing local browser preview is available for this Next.js monorepo in Sites. Do not describe source inspection or CI as a manual full-site visual sign-off.
- Inherited browser issues from #192: obsolete Singapore alias 404 expectations, two English home snapshots, and internal design-review content Markdown/snapshots. The raw Markdown problem is in the internal review renderer; canonical articles use EditorialMarkdown. They remain separate from this production detail patch and must not be blessed as new visual baselines.
