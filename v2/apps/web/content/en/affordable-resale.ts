import type { EditorialPortfolioRecord } from '../portfolio-types';

export const AFFORDABLE_RESALE_STORIES: readonly EditorialPortfolioRecord[] = [
  {
    "id": "en:seoul-84sqm-under-one-billion-2026",
    "slug": "seoul-84sqm-under-one-billion-2026",
    "locale": "en",
    "marketId": "kr-seoul",
    "type": "data-story",
    "title": "Seoul 84 sqm homes below KRW 1 billion: where deals happened",
    "deck": "Twenty examples from a 292-group screen of H1 2026 reported sales, with a check on what happened in July and August.",
    "readerQuestion": "Seoul 84 sqm homes below KRW 1 billion: where deals happened",
    "bodyMarkdown": "## Seoul still had 84 sqm sales below KRW 1 billion\n\nThe useful question is where that price appeared repeatedly. A single low transaction can be an exception. In the first half of 2026, 292 apartment identifiers across 16 Seoul districts passed our screen: at least five eligible sales, a median no higher than KRW 1 billion, and at least three sales at or below that threshold.\n\nThose groups contain 2,964 eligible transactions, including transactions above the threshold. The count refers to source apartment identifiers; some physical estates can have more than one identifier. It is not a count of homes available to buy today.\n\n## Twenty places where the numbers are easy to see\n\nThe table selects 20 examples across a range of districts, building ages and prices. It is not a ranking of Seoul's cheapest estates. Names remain in Korean so readers can match the reported apartment precisely. KRW 1 billion is 10억원; 691.5 million is 6.915억원.\n\n| District · neighbourhood | Apartment | Built | H1 median (KRW million) | At or below KRW 1bn / all sales |\n|---|---|---|---:|---:|\n| 구로구 항동 | 항동제일풍경채포레스트 | 2020 | 691.5 | 14 / 14 |\n| 관악구 신림동 | 관악산휴먼시아2단지 | 2008 | 710.0 | 37 / 37 |\n| 강북구 미아동 | 에스케이북한산시티 | 2004 | 735.0 | 77 / 77 |\n| 노원구 월계동 | 녹천역두산위브아파트 | 2017 | 740.0 | 7 / 7 |\n| 중랑구 신내동 | 신내우디안1단지 | 2014 | 772.5 | 22 / 22 |\n| 구로구 온수동 | 온수힐스테이트 | 2010 | 790.0 | 15 / 15 |\n| 구로구 항동 | 항동중흥에스클래스베르데카운티 | 2019 | 840.0 | 15 / 15 |\n| 서대문구 홍제동 | 문화촌현대 | 2002 | 850.0 | 17 / 17 |\n| 노원구 하계동 | 학여울청구 | 1999 | 880.0 | 20 / 20 |\n| 중랑구 면목동 | 용마산모아엘가파크포레 | 2023 | 885.0 | 5 / 5 |\n| 영등포구 대림동 | 신대림자이1단지 | 2007 | 890.0 | 5 / 5 |\n| 은평구 응암동 | 백련산힐스테이트1차 | 2011 | 890.0 | 17 / 17 |\n| 노원구 공릉동 | 노원프레미어스엠코 | 2016 | 897.5 | 8 / 8 |\n| 강북구 미아동 | 두산위브트레지움 | 2011 | 900.0 | 34 / 35 |\n| 은평구 응암동 | e편한세상백련산 | 2022 | 925.0 | 11 / 11 |\n| 금천구 시흥동 | 남서울힐스테이트 | 2014 | 940.0 | 30 / 30 |\n| 강서구 화곡동 | 우장산에스케이뷰 | 2006 | 951.0 | 11 / 12 |\n| 강북구 미아동 | 꿈의숲롯데캐슬 | 2017 | 997.5 | 6 / 10 |\n| 강북구 미아동 | 삼성래미안트리베라2단지 | 2010 | 1,000.0 | 10 / 19 |\n| 동대문구 답십리동 | 래미안엘파인아파트 | 2011 | 1,000.0 | 10 / 16 |\n\nThe lower prices were not confined to old buildings. Hangdong Jeil Punggyeongchae Forest (항동제일풍경채포레스트), with a reported construction year of 2020, had 14 qualifying sales, all below the threshold, and a median of KRW 691.5 million. That is evidence about this estate and window, rather than a reason to assume an equally new home elsewhere will cost the same.\n\n## A KRW 1 billion median does not put every sale under the line\n\nSamsung Raemian Treevera 2 (삼성래미안트리베라2단지) illustrates the difference: its H1 median was exactly KRW 1 billion, but only 10 of 19 eligible sales were at or below that amount. Raemian Elfine (래미안엘파인아파트) also had a KRW 1 billion median, with 10 of 16 sales at or below it.\n\nThe count beside the price matters. A median describes the middle of observed sales; it is neither a seller's offer nor a valuation of any particular unit.\n\n## Some of these prices had already moved by July and August\n\nApplying the same size, floor and transaction filters to July–August produces a useful warning against reading the table as today's shopping list.\n\n| Apartment | H1 median (KRW million) | Jul–Aug median (KRW million) | Jul–Aug sales |\n|---|---:|---:|---:|\n| 에스케이북한산시티 | 735.0 | 846.5 | 12 |\n| 두산위브트레지움 | 900.0 | 1,027.0 | 5 |\n| 꿈의숲롯데캐슬 | 997.5 | 1,046.0 | 3 |\n| 삼성래미안트리베라2단지 | 1,000.0 | 1,140.0 | 2 |\n| 래미안엘파인아파트 | 1,000.0 | 1,080.0 | 3 |\n\nThese are small, different samples of sold units. They show later reported prices, not a matched-home appreciation rate. Recent reporting can also be incomplete. An estate with no qualifying later sale has no later observation in this screen, rather than an unchanged price.\n\n## How we counted\n\nWe used MOLIT apartment sale detail records collected on 7 September 2026. The main window is contract dates from 1 January to 30 June 2026. Exclusive-use area must be at least 84 sqm and below 85 sqm; floors must be third floor or higher. We include brokered transactions and exclude records marked cancelled in the snapshot. Grouping uses the source apartment identifier, combining the included area types within it. The median averages the two middle prices for an even number of sales.\n\nThe screen does not match orientation, renovation, exact floor, internal layout or other unit characteristics. It also does not establish that the buyer can borrow enough or obtain any required permission. Contract prices exclude acquisition taxes and transaction costs. Later cancellations and corrections can change the results.\n\n## Sources and the Singapore companion\n\nSource: Ministry of Land, Infrastructure and Transport, [Apartment sale transaction detail API](https://www.data.go.kr/data/15126468/openapi.do), collected 7 September 2026. Calculations and selection are by SignedPrice, with automated source and arithmetic checks. The source catalogue states no restriction on the permitted scope of use; this publication is not endorsed by MOLIT.\n\nThe [Singapore companion](/news/singapore-condos-under-1-5-million-2026/) asks where 80–100 sqm condo resales appeared at or below S$1.5 million. Singapore strata area and Korean exclusive-use area are different measures. The two screens use local currency thresholds and are not a cross-country affordability ranking.\n",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice Data Desk",
    "reviewedAt": "2026-09-07T00:00:00.000Z",
    "reviewedBy": "SignedPrice automated source and calculation checks",
    "publishedAt": "2026-09-07T00:00:00.000Z",
    "updatedAt": "2026-09-07T00:00:00.000Z",
    "relatedHref": "/news/singapore-condos-under-1-5-million-2026/",
    "sources": [
      {
        "id": "molit-sale-detail",
        "kind": "primary",
        "publisher": "Ministry of Land, Infrastructure and Transport",
        "title": "Apartment sale transaction detail API",
        "href": "https://www.data.go.kr/data/15126468/openapi.do",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      }
    ],
    "evidenceReleaseIds": [
      "molit-seoul-sales-2026-09-07"
    ],
    "revisionNote": "First publication: dated transaction screen, sample counts, subsequent observations and reuse attribution checked.",
    "canonicalHref": "/news/seoul-84sqm-under-one-billion-2026/",
    "translationGroupId": null,
    "infographic": {
      "id": "affordable-seoul-84sqm-under-one-billion-2026",
      "template": "district-comparison",
      "locale": "en",
      "title": "Selected project medians, January–June 2026",
      "accessibleSummary": "Twenty examples from a 292-group screen of H1 2026 reported sales, with a check on what happened in July and August.",
      "evidenceReleaseIds": [
        "molit-seoul-sales-2026-09-07"
      ],
      "unit": "KRW million",
      "period": {
        "start": "2026-01-01",
        "end": "2026-06-30"
      },
      "series": [
        {
          "id": "median",
          "label": "H1 median",
          "values": [
            {
              "label": "항동제일풍경채포레스트",
              "value": 691.5,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "관악산휴먼시아2단지",
              "value": 710.0,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "에스케이북한산시티",
              "value": 735.0,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "녹천역두산위브아파트",
              "value": 740.0,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "신내우디안1단지",
              "value": 772.5,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            }
          ]
        }
      ],
      "sourceLabel": "Ministry of Land, Infrastructure and Transport reported transactions; SignedPrice calculation",
      "sampleLabel": "Selected examples meeting the article screen; at least five eligible sales per group",
      "relatedHref": "/news/seoul-84sqm-under-one-billion-2026/",
      "conversionProvenance": null
    }
  },
  {
    "id": "en:singapore-condos-under-1-5-million-2026",
    "slug": "singapore-condos-under-1-5-million-2026",
    "locale": "en",
    "marketId": "sg-singapore",
    "type": "data-story",
    "title": "Singapore condos below S$1.5 million: 18 projects with resale evidence",
    "deck": "An 80–100 sqm screen finds 18 projects in H1 2026. At Melville Park, all ten qualifying resales were below S$1 million.",
    "readerQuestion": "Singapore condos below S$1.5 million: 18 projects with resale evidence",
    "bodyMarkdown": "## A private condo below S$1 million? Ten sales in one project\n\nMelville Park recorded ten qualifying 80–100 sqm condo resales in the first half of 2026. Every one was below S$1 million: prices ranged from S$888,000 to S$981,000, with a median of S$922,500. The actual sold areas were 87–93 sqm.\n\nThat is a concrete answer to a price question, with a material detail attached: the source describes a 99-year lease commencing in 1992. An older leasehold condo is a different housing proposition from a new launch or a freehold project. The observed gap is not evidence of a mispricing.\n\n## Eighteen projects passed the S$1.5 million screen\n\nWe looked for at least five qualifying H1 2026 resales per project, a median at or below S$1.5 million, and at least three transactions at or below that threshold. Eighteen projects passed, containing 138 qualifying resales; 135 of those transactions were at or below S$1.5 million.\n\nThese are private condominium resales only. HDB flats, executive condominiums, records classified as apartments, landed homes, new sales and subsales are outside this screen. The table is ordered by median contract price, not by investment merit.\n\n| Condominium | Postal district | Sold area (sqm) | H1 median (S$) | At or below S$1.5m / all sales | Tenure in source |\n|---|---:|---:|---:|---:|---|\n| Melville Park | 18 | 87–93 | 922,500 | 10 / 10 | 99 years from 1992 |\n| The Miltonia Residences | 27 | 80–93 | 1,060,688 | 7 / 7 | 99 years from 2010 |\n| Regent Heights | 23 | 95–95 | 1,062,500 | 10 / 10 | 99 years from 1995 |\n| Eastpoint Green | 18 | 89–90 | 1,160,000 | 5 / 5 | 99 years from 1996 |\n| Parc Vista | 22 | 97–100 | 1,165,000 | 7 / 7 | 99 years from 1995 |\n| Carissa Park Condominium | 17 | 86–88 | 1,180,000 | 5 / 5 | Freehold |\n| The Greenwich | 28 | 82–100 | 1,190,000 | 5 / 5 | 99 years from 2009 |\n| Aquarius By The Park | 16 | 83–83 | 1,195,000 | 6 / 6 | 99 years from 1996 |\n| Bayshore Park | 16 | 87–87 | 1,214,444 | 6 / 6 | 99 years from 1982 |\n| Symphony Suites | 27 | 83–95 | 1,235,000 | 12 / 12 | 99 years from 2014 |\n| The Warren | 23 | 97–99 | 1,239,444 | 6 / 6 | 99 years from 2001 |\n| Castle Green | 26 | 88–88 | 1,280,000 | 6 / 6 | 99 years from 1993 |\n| The Bayshore | 16 | 86–94 | 1,293,000 | 13 / 13 | 99 years from 1993 |\n| Riversails | 19 | 82–99 | 1,370,944 | 6 / 8 | 99 years from 2011 |\n| Dover Parkview | 05 | 87–90 | 1,375,000 | 14 / 14 | 99 years from 1993 |\n| Hedges Park Condominium | 17 | 90–100 | 1,375,000 | 6 / 6 | 99 years from 2010 |\n| Double Bay Residences | 18 | 87–93 | 1,450,000 | 7 / 7 | 99 years from 2008 |\n| Flo Residence | 19 | 86–94 | 1,472,000 | 4 / 5 | 99 years from 2011 |\n\nCarissa Park is the one project in this table described as freehold. Its five qualifying resales had a median of S$1.18 million. This does not isolate the value of freehold tenure: location, project age, unit characteristics and other differences remain mixed into the comparison.\n\n## The price line is not a promise about the next sale\n\nRiversails had an H1 median of S$1,370,944, but two of its eight qualifying resales exceeded S$1.5 million. Flo Residence also included one sale above the threshold. A project passing a median-based screen does not mean every qualifying home sold below the budget.\n\nThe July–August records add another check. Melville Park had five qualifying resales with a median of S$925,000. Riversails had two with a median of S$1,520,000, already above the headline threshold. These later samples are small and contain different homes; they are not a quality-adjusted price index or an assurance of current availability.\n\n## What the budget leaves out\n\nThe table contains contract prices, excluding stamp duties, financing and other buying costs. Buyer circumstances can materially change the total: consult the [IRAS Additional Buyer's Stamp Duty guidance](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29) for the applicable treatment. We have not calculated an individual's all-in budget or purchase eligibility.\n\nThe 80–100 sqm band also contains different unit sizes and layouts. It does not establish a bedroom count. Floor ranges and other unit attributes differ, and this screen does not adjust prices for them. Reported tenure commencement is not a legal verification of a particular title or its remaining lease.\n\n## How we counted and where the data came from\n\nWe recalculated from the installed URA-derived private sale snapshot generated on 2 September 2026, using contract months January–June 2026. We retained single-unit resale records classified as condominium, with strata area from 80 through 100 sqm inclusive, and grouped by project identifier. Prices are in Singapore dollars. For an even number of sales the median averages the two middle prices. July–August checks use the same filters with the later contract months.\n\nThis is a fixed snapshot of reported transactions. It is not a live listing feed, and subsequent corrections or late records can change the sample. Calculations and commentary are by SignedPrice, with automated source and arithmetic checks.\n\nContains information from the Urban Redevelopment Authority, accessed in the 2 September 2026 snapshot, made available under the [Singapore Open Data Licence](https://data.gov.sg/open-data-licence). See [URA property data](https://www.ura.gov.sg/property-data/) and [URA API terms](https://www.ura.gov.sg/eservices-info/maps/api-terms-of-service/). URA has not endorsed this analysis.\n\nThe [Seoul companion](/news/seoul-84sqm-under-one-billion-2026/) looks at reported 84 sqm apartment sales around a KRW 1 billion threshold. Korean exclusive-use area and Singapore strata area are not interchangeable. These are separate local price screens, with no currency conversion or claim that one market is more affordable.\n",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice Data Desk",
    "reviewedAt": "2026-09-07T00:00:00.000Z",
    "reviewedBy": "SignedPrice automated source and calculation checks",
    "publishedAt": "2026-09-07T00:00:00.000Z",
    "updatedAt": "2026-09-07T00:00:00.000Z",
    "relatedHref": "/news/seoul-84sqm-under-one-billion-2026/",
    "sources": [
      {
        "id": "ura-property-data",
        "kind": "primary",
        "publisher": "Urban Redevelopment Authority",
        "title": "Private residential property data",
        "href": "https://www.ura.gov.sg/property-data/",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "sg-open-data-licence",
        "kind": "primary",
        "publisher": "Government of Singapore",
        "title": "Singapore Open Data Licence",
        "href": "https://data.gov.sg/open-data-licence",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "ura-api-terms",
        "kind": "primary",
        "publisher": "Urban Redevelopment Authority",
        "title": "API terms of service",
        "href": "https://www.ura.gov.sg/eservices-info/maps/api-terms-of-service/",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "iras-absd",
        "kind": "primary",
        "publisher": "Inland Revenue Authority of Singapore",
        "title": "Additional Buyer's Stamp Duty",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      }
    ],
    "evidenceReleaseIds": [
      "installed-sg-private-sale-2026-09-02"
    ],
    "revisionNote": "First publication: dated transaction screen, sample counts, subsequent observations and reuse attribution checked.",
    "canonicalHref": "/news/singapore-condos-under-1-5-million-2026/",
    "translationGroupId": null,
    "infographic": {
      "id": "affordable-singapore-condos-under-1-5-million-2026",
      "template": "district-comparison",
      "locale": "en",
      "title": "Selected project medians, January–June 2026",
      "accessibleSummary": "An 80–100 sqm screen finds 18 projects in H1 2026. At Melville Park, all ten qualifying resales were below S$1 million.",
      "evidenceReleaseIds": [
        "installed-sg-private-sale-2026-09-02"
      ],
      "unit": "SGD",
      "period": {
        "start": "2026-01-01",
        "end": "2026-06-30"
      },
      "series": [
        {
          "id": "median",
          "label": "H1 median",
          "values": [
            {
              "label": "Melville Park",
              "value": 922500.0,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "The Miltonia Residences",
              "value": 1060688,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "Regent Heights",
              "value": 1062500.0,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "Eastpoint Green",
              "value": 1160000,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "Parc Vista",
              "value": 1165000,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            }
          ]
        }
      ],
      "sourceLabel": "Urban Redevelopment Authority reported transactions; SignedPrice calculation",
      "sampleLabel": "Selected examples meeting the article screen; at least five eligible sales per group",
      "relatedHref": "/news/singapore-condos-under-1-5-million-2026/",
      "conversionProvenance": null
    }
  }
];
