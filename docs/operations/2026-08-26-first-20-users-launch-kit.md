# First 20 Users Launch Kit

## Objective

Validate the current product before adding another feature.

- 20 qualified foreign-renter visits
- 10 completed Rent Check results
- At least 2 optional follow-up actions: saved result or help request
- One week maximum for the first measurement window

A qualified visit is a person currently comparing, preparing for, or reviewing a Seoul rental quote. Owner and developer test traffic does not count.

## Placement 1: renter community

Use only in a community or thread that permits relevant resource links. Answer the renter's question first; do not mass-post the same message.

**Post title**

How I check whether a Seoul rent quote is high or fair

**Post copy**

If you receive a Seoul rental quote, compare the deposit, monthly rent, floor area and registered housing type together. A lower monthly rent can simply reflect a much larger deposit, so comparing rent alone is misleading.

I built a free Rent Check that compares a quote with recent officially reported signed transactions. It is not a listing site, appraisal or legal advice, and it shows the result without requiring an email. Coverage is still limited, so feedback about missing areas or unclear results is useful.

https://koreahomeguide.com/tools/seoul-rent-check/?utm_source=reddit&utm_medium=community&utm_campaign=first_20_rent_checks

If the destination is not Reddit, replace only `utm_source=reddit` with a short lowercase channel name before posting.

## Placement 2: university or foreign-resident support organization

Send this to one real international-office, housing-support, relocation, or foreign-resident-support contact. Do not imply an existing partnership.

**Subject**

Free Seoul rent-check resource for international residents

**Email copy**

Hello,

I run KoreaHomeGuide, a free English- and Chinese-language resource that helps foreign renters compare a Seoul rental quote with recent officially reported signed transactions.

The result is shown immediately without requiring an email. The service is not a listings platform, broker, appraisal, or substitute for legal advice; its purpose is to help renters ask better questions before signing. We also provide a practical before-you-sign guide covering identity, registry, payment-account, contract and deposit-protection checks.

If this is relevant to the people you support, would you be willing to review the resource and share it when appropriate? Feedback about missing areas or confusing wording would also be valuable.

Resource:
https://koreahomeguide.com/guides/before-you-sign/?utm_source=university_outreach&utm_medium=referral&utm_campaign=first_20_rent_checks

Thank you,
KoreaHomeGuide
hello@koreahomeguide.com

## Measurement

Use one separate test device to confirm the automatic GA4 pageview and funnel events. Do not count that device as a qualified visitor.

Check GA4 Realtime and then the standard Events report for:

1. `rent_check_tool_view`
2. `rent_check_start`
3. `rent_check_result`
4. `lead_form_view`
5. `lead_submit`
6. `help_request`

Record the earliest stage where real users drop out. Do not use pageviews alone as the success signal.

## Day 7 decision

| Observed result | Next action |
| --- | --- |
| Fewer than 20 qualified visits | Improve distribution; do not redesign the product |
| Visits but few tool views | Rewrite the placement and entry-page CTA |
| Tool views but few starts | Clarify the input example and supported coverage |
| Starts but few results | Diagnose API/data availability before more promotion |
| Results but no follow-up | Test the post-result follow-up value proposition |
| 10+ results and 2+ follow-ups | Begin one controlled partner-pilot interview cycle |

Do not activate AdSense, a brokerage referral offer, or a paid partner placement during this first measurement window.
