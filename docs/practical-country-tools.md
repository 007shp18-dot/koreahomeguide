# Country cards → useful guide tools

## What this change adds

The existing Korea, Japan, Singapore and Dubai articles get a usable tool immediately below the article header, in English and Korean. No new routes, dependencies, accounts or data collection are required. Existing sources remain in the same article. Inputs and checklist state last only for the current page visit.

| Card | Existing English destination | Reader action |
| --- | --- | --- |
| Korea rent code | `/guides/rent-an-apartment-in-korea/#practical-tool` | Calculate monthly spending separately from deposit cash; copy Korean questions for an agent. |
| Japan renovated apartment | `/news/city-stories/tokyo/which-home/#practical-tool` | Check repair plan, reserve accounts and meeting minutes; copy the document request. |
| Singapore lower PSF | `/news/city-stories/singapore/which-home/#practical-tool` | Enter prices and comparable areas for two homes; compare PSF and the total-price difference. |
| Dubai headline yield | `/news/dubai-rental-yield-after-costs/#practical-tool` | Change operating and acquisition assumptions; see income divided by price and by price plus acquisition costs. |

## Measurement

The existing editorial analytics listener accepts `article_tool_use` on calculate/copy buttons and checklist controls. This measures an interaction attempt, not a verified calculation, successful clipboard write, completed checklist or a unique user. Do not report it as a lead or conversion. Only existing allowlisted article metadata is forwarded; amounts, document contents and checkbox state are not.

For future approved links use `utm_source=threads` or `instagram`, `utm_medium=organic_social`, `utm_campaign=practical_guides`, and a topic-specific `utm_content`, before the `#practical-tool` fragment. Example:

`https://www.signedprice.com/news/city-stories/singapore/which-home/?utm_source=threads&utm_medium=organic_social&utm_campaign=practical_guides&utm_content=sg_lower_psf#practical-tool`

These are link templates for after deployment. No existing social post or profile link is changed by this pull request.

## Four-week operating experiment

1. Week 1: establish actual post/link/guide engagement baselines; verify the deployed tools and analytics configuration before interpreting missing data as zero.
2. Week 2: prepare two useful posts on different days, with platform-specific captions. Get the owner's approval before publishing. This cadence is an editorial experiment, not an account-safety guarantee.
3. Week 3: turn real reader questions into one follow-up and improve one related English search guide. Search-volume claims require separate validation.
4. Week 4: compare qualified site visits, tool interaction attempts and actual enquiries by topic; repeat useful topics, revise weak handoffs. Small samples are exploratory.

Threads was recently suspended and restored. Do not automatically resume parked Metricool drafts, burst-publish country posts, or enable promotional auto-comments. Social publication remains subject to the user's per-post direction. This change does not create schedules, reminders or background monitoring.

## Calculation boundaries

- Korea: full KRW inputs; deposit is separate. Utilities initially zero as a labelled placeholder. Moving, brokerage and deposit financing are excluded.
- Singapore: hypothetical SGD prices and square-foot areas. Compare the same area definition. Duties, fees, financing, tenure and condition are not reduced to a PSF recommendation.
- Dubai: management is a percentage of rent collected after vacancy. Acquisition costs are added to the denominator once. Financing, tax, sale costs and appreciation are excluded. Negative operating income remains visible. Fractional vacant months are allowed from 0 to 12.
- Japan: checking documents is not a building-condition assessment. Approved decisions must be distinguished from proposals.

## Validation

Focused tests cover the published numerical examples, alternate inputs, full-year vacancy, invalid/unknown inputs, both-language server rendering and analytics payload filtering. TypeScript checks cover integration with both existing article components. Browser interaction and visual QA are not included in this change's local verification.
