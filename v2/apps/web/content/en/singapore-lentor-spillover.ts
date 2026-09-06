import type { EditorialPortfolioRecord } from '../portfolio-types';

export const SINGAPORE_LENTOR_SPILLOVER: EditorialPortfolioRecord = Object.freeze<EditorialPortfolioRecord>({
  "id": "en:singapore-lentor-launch-resale-divergence",
  "slug": "singapore-lentor-launch-resale-divergence",
  "locale": "en",
  "marketId": "sg-singapore",
  "type": "market-brief",
  "title": "One Lentor launch, two neighbours: resale medians rose 6.4% and 15.9%",
  "deck": "A reproducible historical sample compares Seasons Park and Castle Green with a wider resale ring. Both rose, but only one exceeded the ring's 7.8% reference.",
  "readerQuestion": "Did nearby resale condos outperform after Lentor Modern launched?",
  "bodyMarkdown": "## One launch, two different resale outcomes\n\nDid Lentor Modern's arrival lift nearby existing condominiums? In a defined sample of 80–120 sqm resales, two nearby projects both recorded higher median prices per square foot after its September 2022 launch. The changes were markedly different: 6.4% at Seasons Park and 15.9% at Castle Green.\n\nThat contrast is more useful than a general claim that a new launch benefits its neighbours. Both projects shared the same local launch event, but they did not deliver the same descriptive price movement. Even the smaller increase needs to be compared with what happened outside the immediate vicinity.\n\nThe launch month is corroborated by EdgeProp's October 2023 report, hosted by GuocoLand. The same report describes a 605-home integrated development and the wider Lentor transformation. It supplies historical context; our resale calculations come from SignedPrice's existing URA-derived transaction snapshot, not the developer's marketing material.\n\n## Hold the observation windows and housing category fixed\n\nThe before window is September 2021 through August 2022. The after window is October 2022 through September 2023. September 2022 is excluded so the launch month does not mix pre- and post-launch contracts. These are launch-event windows, not completion or move-in windows.\n\nWe keep single-unit resales of apartments and condominiums, 80–120 sqm, with 99-year leasehold tenure and valid project coordinates. New sales and subsales are excluded. Each project needs at least five observations in each window. This reduces some category differences but does not match individual units or equalize remaining lease, age, floor, condition and location.\n\nWithin approximately one kilometre of Lentor Modern's project coordinate, two projects meet those rules:\n\n- Seasons Park: 13 before-window sales and 17 after-window sales; median SGD psf increased from 996 to 1,060, or 6.4%.\n- Castle Green: 27 before-window sales and 14 after-window sales; median SGD psf increased from 998 to 1,157, or 15.9%.\n\nDistances use straight-line source project coordinates, approximately 528 metres and 651 metres respectively. They are not walking distances or gate-to-gate measurements. Projects without usable coordinates are excluded, so this is not an inventory of every neighbouring property.\n\n## Add the surrounding market before calling it a launch premium\n\nUsing the same tenure, size, transaction-type and minimum-sample filters, the two-to-four-kilometre comparison ring contains 15 eligible projects. Together they contribute 194 before-window sales and 156 after-window sales. The median of their individual project percentage changes is 7.8%.\n\nThe two near projects contribute 40 and 31 sales respectively. Their equal-project median change is 11.2%; with only two projects, this is the midpoint of the two project changes. It is not the growth of a pooled transaction median.\n\nAgainst the comparison ring's 7.8% reference, Seasons Park's 6.4% increase falls below it, while Castle Green's 15.9% exceeds it. Pooling the two neighbours into a single positive headline would hide that difference.\n\nThe near-minus-ring difference is roughly 3.3 percentage points. It is not an estimated causal launch premium. The ring is a descriptive comparison, not a validated control group: it can share Lentor-related influences and differs in property characteristics.\n\n## Why the closer project is not automatically the stronger beneficiary\n\nSeasons Park is closer in the source-coordinate measure, yet its observed median increase was smaller. In this sample, ranking the two properties by distance would not rank their subsequent median-price changes correctly.\n\nThat does not establish why Castle Green performed differently. The units that sold changed between windows, and the sample is small. We have not tested parallel pre-launch trends, estimated confidence intervals or controlled for unit-level characteristics. We therefore cannot infer that Castle Green's facilities, access or buyer profile caused the difference.\n\nA buyer should distinguish three questions: did prices rise, did they outperform a reasonable comparison, and did the launch cause that outperformance? Our data answer the first descriptively, provide limited context for the second, and do not settle the third.\n\n## A price gap is not a promised resale destination\n\nAn expensive launch can make older housing look inexpensive without making the products equivalent. It can also attract attention to an entire area while different existing projects respond differently. Lentor's other developments, financing conditions and wider market changes are potential competing explanations.\n\nThe investment hypothesis worth investigating is selective repricing, not an automatic uplift for every nearby condo. In this historical sample, one neighbour exceeded the wider reference and the other did not. Neither result is a forward forecast or a recommendation to buy one project over another.\n\nFor a buyer evaluating the next launch, evidence of repeated, comparable resale improvement matters more than multiplying a new-launch price by an assumed discount. Distance and the launch headline identify places to investigate; they do not determine a target resale price.\n\n## Reproducibility and limits\n\nCalculations use the 2 September 2026 SignedPrice private-sale snapshot, containing 133,942 records in total. Only the explicitly filtered observations above enter this study. The snapshot digest is e2bc92b0e75ffb7eaf17544e883a96e2986995f7db208f14b711cab8714a1e3c. This is a historical reanalysis of that snapshot, not a live URA retrieval or a claim about today's prices.\n\nThe repository script v2/scripts/analyze-lentor-launch.mjs reproduces the project medians, counts and comparison-ring summary and stops if the snapshot digest changes. It uses the supplied psf values and unrounded calculations, with published percentages rounded to one decimal. Five observations is an inclusion rule, not evidence of statistical reliability. Cancellation or source revisions after the snapshot date are not incorporated.",
  "status": "published",
  "evidenceState": "partial",
  "authorName": "SignedPrice Data Desk",
  "reviewedAt": "2026-09-06T05:55:00.000Z",
  "reviewedBy": "SignedPrice AI-assisted source and calculation check",
  "publishedAt": "2026-09-06T05:55:00.000Z",
  "updatedAt": "2026-09-06T05:55:00.000Z",
  "relatedHref": "/news/korea-foreon-neighbour-price-gap/",
  "sources": [
    {
      "id": "ura-private-sales",
      "kind": "primary",
      "publisher": "Urban Redevelopment Authority",
      "title": "Private residential transaction data: source context",
      "href": "https://www.ura.gov.sg/Corporate/Property/Property-Data",
      "checkedAt": "2026-09-06",
      "publishedAt": null
    },
    {
      "id": "lentor-launch-context",
      "kind": "secondary",
      "publisher": "EdgeProp, hosted by GuocoLand",
      "title": "Lentor Modern: Setting the tone for the Lentor Hills estate, October 2023",
      "href": "https://www.guocoland.com.sg/Documents/News/2023/TheEdge_Lentor_Modern_Setting_the_tone_for_the_Lentor_Hills_Estate.pdf",
      "checkedAt": "2026-09-06",
      "publishedAt": null
    }
  ],
  "evidenceReleaseIds": [
    "singapore-private-sale-e2bc92b0e75f",
    "lentor-descriptive-launch-study-2026-09-06"
  ],
  "revisionNote": "First publication. Descriptive evidence boundaries disclosed; no causal or live-price claim.",
  "canonicalHref": "/news/singapore-lentor-launch-resale-divergence/",
  "translationGroupId": null,
  "infographic": null
});
