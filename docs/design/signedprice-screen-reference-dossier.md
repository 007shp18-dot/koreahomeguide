# SignedPrice screen-reference dossier

Date: 2026-09-04

This is a decision log for the approved SignedPrice renewal. It records reusable interaction principles, not visual assets or components to copy. Observations were made against the current public pages at desktop width and their responsive/mobile presentation where available. Third-party screenshots are deliberately excluded.

## Cross-screen rules

- Keep one quiet global header: `Markets / Prices / News / Guides`.
- Put market-specific tasks in a separate local navigation layer.
- Lead with the user's decision, then reveal evidence, provenance, and limits in that order.
- Preserve filters and entity selection in the URL so list, map, detail, and Check form one journey.
- Use original SignedPrice layouts, typography, copy, and data visualizations. References below establish behavior only.

## Decisions by surface

| Surface | Current references | Observed desktop and mobile behavior | Adopt | Reject |
| --- | --- | --- | --- | --- |
| Home | [Zillow](https://www.zillow.com/) · [Rightmove](https://www.rightmove.co.uk/) · [PropertyGuru Singapore](https://www.propertyguru.com.sg/) | Desktop gives one dominant search/decision task and a restrained first viewport. Responsive layouts keep the task primary and simplify navigation before content. | One proposition, three market entries, and a short route into prices, current change, and guidance. | Portal-style walls of promotional cards or unsupported market numbers. |
| Market overview | [Realtor.com local market](https://www.realtor.com/local/market/) · [Zoopla house prices](https://www.zoopla.co.uk/house-prices/) · [Rightmove sold prices](https://www.rightmove.co.uk/house-prices.html) | Desktop combines a place identity with a small evidence summary and a next action. Mobile stacks context, evidence, then action without changing the hierarchy. | A 6:6 overview with a fixed 16:9 market image, one evidence band, and explicit coverage limits. | Uneven image crops, mixed card widths, or metrics without period/source context. |
| Explore | [Rightmove map search](https://www.rightmove.co.uk/property-for-sale/map.html) · [Zillow homes](https://www.zillow.com/homes/) · [StreetEasy](https://streeteasy.com/) | Desktop keeps map, filters, result list, and selection mutually legible. Mobile changes mode instead of shrinking every pane into one screen. | URL-backed district/building selection with synchronized row, pin, and detail panel. | Browser-time geocoding/photo discovery or map and list selections that can diverge. |
| Detail and Check | [Zillow Zestimate](https://www.zillow.com/z/zestimate/) · [Redfin Estimate](https://www.redfin.com/redfin-estimate) · [StreetEasy buyer guides](https://streeteasy.com/blog/buying/) | Desktop starts from property identity and decision evidence, with deeper history and methodology below. Mobile keeps a clear primary action and linear reading order. | Media → identity → current evidence → history → range → facts → proximity → sources → Check. | A single opaque estimate, prefilled asking value, or a dead-end detail page. |
| News | [Redfin News](https://www.redfin.com/news/) · [Zoopla research](https://www.zoopla.co.uk/research/) · [PropertyGuru property insights](https://www.propertyguru.com.sg/property-guides/property-insights-singapore) | Desktop separates lead coverage from a scannable feed and topic filters. Mobile preserves recency, topic, and market cues in each story row. | `Latest / Policy / Market / Data Stories`, with editorial summaries and first-party routes. | Republishing external articles, feed-shaped pages with no market/action context, or automatic publication. |
| Policy | [GOV.UK residential SDLT rates](https://www.gov.uk/stamp-duty-land-tax/residential-property-rates) · [MAS cooling measures](https://www.mas.gov.sg/news/media-releases/2021/measures-to-cool-the-property-market) · [URA media releases](https://www.ura.gov.sg/news/media/) | Primary sources foreground effective date, scope, and current status; mobile is document-linear rather than dashboard-dense. | Track announced, effective, changed, and ended dates; show who/what is affected and link the primary source. | Treating a press report as the legal source or hiding superseded policy state. |
| Data Story | [Redfin Data Center](https://www.redfin.com/news/data-center/) · [StreetEasy Data Dashboard](https://streeteasy.com/blog/data-dashboard/) · [Domain House Price Report](https://www.domain.com.au/research/house-price-report/) | Desktop pairs an explanatory headline with a focused chart and downloadable/method context. Mobile favors one chart or table at a time with a concise takeaway. | DB-derived chart templates with period, sample, source, methodology, and related Explore/Check links. | Decorative infographics, unlabelled axes, or a chart that cannot explain missing/sparse evidence. |

## SignedPrice responsive interpretation

| Breakpoint intent | Required behavior |
| --- | --- |
| Wide workspace | Global header, 48px market navigation, and multi-pane evidence workspace can coexist. |
| Standard content | Preserve one primary task and collapse secondary evidence into ordered sections. |
| Mobile | Keep controls at least 44px, switch Explore between map/list/detail modes, and retain the active market/task in view. |

## Originality and governance boundary

No competitor screenshot, illustration, copy block, component code, or proprietary data is part of the product. Any future reference addition must record the source URL, observation date, principle adopted, and pattern rejected. A reference may influence an interaction rule; SignedPrice must still implement its own composition and evidence language.
