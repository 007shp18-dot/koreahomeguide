import type { EditorialPortfolioRecord } from '../portfolio-types';

export type DailyCityEdition = EditorialPortfolioRecord & Readonly<{ city: 'seoul' | 'singapore' | 'dubai' | 'tokyo'; editionDate: string; editionKind: 'evergreen' | 'news' }>;

export const DAILY_CITY_EDITIONS: readonly DailyCityEdition[] = [
  {
    "id": "en:seoul-city-check-2026-09-10",
    "slug": "seoul-city-check-2026-09-10",
    "locale": "en",
    "marketId": "kr-seoul",
    "type": "market-brief",
    "title": "Same Seoul. Are you comparing the same kind of home?",
    "deck": "A neighbourhood name is a starting point. Match housing type before interpreting a price difference.",
    "bodyMarkdown": "## Start with the home, not the headline\nTwo homes in the same district can still belong to different comparison groups. Korea's official transaction portal separates apartments, multi-family housing, detached houses and officetels. Use that distinction before drawing conclusions from a neighbourhood-wide price.\n\n## Build a useful shortlist\nOur suggested viewing checklist is to hold the housing type, approximate floor area and comparison period steady. Then look at the exact address and the building. Note differences in floor, condition and the street outside: matching a district name does not make two homes interchangeable.\n\n- Record the housing category and area shown in the source.\n- Keep asking prices separate from reported contract prices.\n- Inspect the route you would actually use to get home.\n\n## Put the comparison to work\nOpen [Seoul Explore](/kr/seoul/explore/) and investigate a district and its buildings. Treat sparse observations as a reason to look further, not proof of a bargain.\n\n## About this edition\nThis is an evergreen comparison checklist, published September 10, 2026. It reports no new price movement. Source: MOLIT's transaction portal; checked September 10, 2026.",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-10T00:45:00.000Z",
    "reviewedBy": "SignedPrice source review",
    "publishedAt": "2026-09-10T00:45:00.000Z",
    "updatedAt": "2026-09-10T00:45:00.000Z",
    "relatedHref": "/kr/seoul/explore/",
    "sources": [
      {
        "id": "seoul-official-guide-20260910",
        "kind": "primary",
        "publisher": "Korea Ministry of Land, Infrastructure and Transport",
        "title": "Real Estate Transaction Disclosure System",
        "href": "https://rt.molit.go.kr/",
        "checkedAt": "2026-09-10T00:45:00.000Z"
      }
    ],
    "readerQuestion": "Same Seoul. Are you comparing the same kind of home?",
    "evidenceReleaseIds": [
      "seoul-official-guide-review-2026-09-10"
    ],
    "revisionNote": "First daily edition. Evergreen explainer; source reviewed on September 10, 2026. No new transaction statistics claimed.",
    "canonicalHref": "/news/seoul-city-check-2026-09-10/",
    "translationGroupId": null,
    "infographic": null,
    "city": "seoul",
    "editionKind": "evergreen",
    "editionDate": "2026-09-10"
  },
  {
    "id": "en:singapore-city-check-2026-09-10",
    "slug": "singapore-city-check-2026-09-10",
    "locale": "en",
    "marketId": "sg-singapore",
    "type": "market-brief",
    "title": "Love the condo? Check the whole commute.",
    "deck": "Plan the journey from your front door to your destination, including the parts outside the train.",
    "bodyMarkdown": "## The station is one part of the journey\nSingapore's Land Transport Authority provides an MRT/LRT map for checking the rail network. Use the official map as a starting point, then examine the walk between the property and the station. A nearby station name alone does not describe a door-to-door trip.\n\n## Try your everyday route\nOur suggested viewing exercise is to choose your real destination and travel time. Check the station entrance, any transfers and the final walk. Visit the route if possible and note crossings, shelter and access from the building. Do not turn a straight-line map distance into a claimed walking time.\n\n- Write down the route you would use on a normal working day.\n- Compare more than one possible property entrance.\n- Check official transport information again before deciding.\n\n## Connect the route to a home\nUse [Singapore Explore](/sg/singapore/explore/) to shortlist projects, then check transport separately using [LTA's MRT/LRT map](https://www.lta.gov.sg/content/ltagov/en/map/train.html).\n\n## About this edition\nPublished September 10, 2026 as an evergreen housing-search checklist. No new line opening, journey-time estimate or price premium is claimed. Official map checked September 10, 2026.",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-10T00:45:00.000Z",
    "reviewedBy": "SignedPrice source review",
    "publishedAt": "2026-09-10T00:45:00.000Z",
    "updatedAt": "2026-09-10T00:45:00.000Z",
    "relatedHref": "/sg/singapore/explore/",
    "sources": [
      {
        "id": "singapore-official-guide-20260910",
        "kind": "primary",
        "publisher": "Singapore Land Transport Authority",
        "title": "MRT/LRT map",
        "href": "https://www.lta.gov.sg/content/ltagov/en/map/train.html",
        "checkedAt": "2026-09-10T00:45:00.000Z"
      }
    ],
    "readerQuestion": "Love the condo? Check the whole commute.",
    "evidenceReleaseIds": [
      "singapore-official-guide-review-2026-09-10"
    ],
    "revisionNote": "First daily edition. Evergreen explainer; source reviewed on September 10, 2026. No new transaction statistics claimed.",
    "canonicalHref": "/news/singapore-city-check-2026-09-10/",
    "translationGroupId": null,
    "infographic": null,
    "city": "singapore",
    "editionKind": "evergreen",
    "editionDate": "2026-09-10"
  },
  {
    "id": "en:dubai-city-check-2026-09-10",
    "slug": "dubai-city-check-2026-09-10",
    "locale": "en",
    "marketId": "ae-dubai",
    "type": "market-brief",
    "title": "Buying in Dubai? Check the service charge behind the price.",
    "deck": "Ask for the property-specific charge and its budget year before building an ownership budget.",
    "bodyMarkdown": "## Start with the exact project\nDubai Land Department's Service Charge Index provides a search by project, usage and year. These fields matter: a generic neighbourhood estimate is not a substitute for the applicable property's charge.\n\n## Ask for a documented figure\nOur suggested next step is to obtain the relevant charge information and confirm the project, usage, budget period and billing basis with the seller or manager. The official page notes that service charges do not include arrears, so ask separately whether outstanding amounts exist.\n\n- Match the project and year before using a quoted charge.\n- Confirm the unit and area basis before estimating an annual amount.\n- Keep service charges separate from financing and other ownership costs.\n\n## Build a complete budget\nUse the [official Service Charge Index](https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index/) for the lookup and explore [SignedPrice's Dubai market](/ae/dubai/). A charge lookup alone does not establish a property's total return.\n\n## About this edition\nPublished September 10, 2026 as an evergreen cost checklist. No property-specific charge, fee rate or investment return is asserted. Official service page checked September 10, 2026.",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-10T00:45:00.000Z",
    "reviewedBy": "SignedPrice source review",
    "publishedAt": "2026-09-10T00:45:00.000Z",
    "updatedAt": "2026-09-10T00:45:00.000Z",
    "relatedHref": "/ae/dubai/",
    "sources": [
      {
        "id": "dubai-official-guide-20260910",
        "kind": "primary",
        "publisher": "Dubai Land Department",
        "title": "Service Charge Index",
        "href": "https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index/",
        "checkedAt": "2026-09-10T00:45:00.000Z"
      }
    ],
    "readerQuestion": "Buying in Dubai? Check the service charge behind the price.",
    "evidenceReleaseIds": [
      "dubai-official-guide-review-2026-09-10"
    ],
    "revisionNote": "First daily edition. Evergreen explainer; source reviewed on September 10, 2026. No new transaction statistics claimed.",
    "canonicalHref": "/news/dubai-city-check-2026-09-10/",
    "translationGroupId": null,
    "infographic": null,
    "city": "dubai",
    "editionKind": "evergreen",
    "editionDate": "2026-09-10"
  },
  {
    "id": "en:tokyo-city-check-2026-09-10",
    "slug": "tokyo-city-check-2026-09-10",
    "locale": "en",
    "marketId": null,
    "type": "market-brief",
    "title": "Renting in Tokyo? The rent is only part of the budget.",
    "deck": "Ask for separate itemised totals for the money due before moving in and the money due each month.",
    "bodyMarkdown": "## Before you move in\nJapan's Ministry of Land, Infrastructure, Transport and Tourism housing guide identifies deposits, key money and fees as items to consider at the start of a rental. Ask which apply to your particular contract and request an itemised total. Do not assume every listing has the same charges.\n\n## Every month\nThe guide also identifies common-service and management charges alongside rent. Confirm which recurring charges apply, their amounts and payment timing.\n\n- Ask what is due upfront and when it must be paid.\n- Ask what is due every month in addition to advertised rent.\n- Keep the agent's itemised quote with the proposed contract.\n\n## A question to take to your viewing\nOur suggested question is: What is due upfront, and what is due each month? Compare the answers across properties before deciding whether a listing fits your budget.\n\nContinue with [Tokyo's area guide](/jp/tokyo/) to explore where you may want to live.\n\n## About this edition\nPublished September 10, 2026. This is an evergreen explainer using MLIT's July 2021 housing guide, not a new policy announcement. The guide applies to Japan generally, including Tokyo. Charges vary by contract; no typical price or universal fee is asserted. Source checked September 10, 2026.",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-10T00:45:00.000Z",
    "reviewedBy": "SignedPrice source review",
    "publishedAt": "2026-09-10T00:45:00.000Z",
    "updatedAt": "2026-09-10T00:45:00.000Z",
    "relatedHref": "/jp/tokyo/",
    "sources": [
      {
        "id": "tokyo-official-guide-20260910",
        "kind": "primary",
        "publisher": "Japan Ministry of Land, Infrastructure, Transport and Tourism",
        "title": "Guide to Looking for a Home, July 2021 edition",
        "href": "https://www.mlit.go.jp/common/001334734.pdf",
        "checkedAt": "2026-09-10T00:45:00.000Z"
      }
    ],
    "readerQuestion": "Renting in Tokyo? The rent is only part of the budget.",
    "evidenceReleaseIds": [
      "tokyo-official-guide-review-2026-09-10"
    ],
    "revisionNote": "First daily edition. Evergreen explainer; source reviewed on September 10, 2026. No new transaction statistics claimed.",
    "canonicalHref": "/news/tokyo-city-check-2026-09-10/",
    "translationGroupId": null,
    "infographic": null,
    "city": "tokyo",
    "editionKind": "evergreen",
    "editionDate": "2026-09-10"
  }
];

export function latestCityEditions(): readonly DailyCityEdition[] {
  const cities = ['seoul', 'singapore', 'dubai', 'tokyo'] as const;
  return cities.flatMap(city => {
    const latest = DAILY_CITY_EDITIONS.filter(item => item.city === city).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    return latest ? [latest] : [];
  });
}
