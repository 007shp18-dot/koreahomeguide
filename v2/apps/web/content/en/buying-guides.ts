import type { EditorialPortfolioRecord } from '../portfolio-types';
export const BUYING_GUIDES: readonly EditorialPortfolioRecord[] = [
  {
    "id": "seoul-apartment-buying-budget-guide",
    "slug": "seoul-apartment-buying-budget-guide",
    "locale": "en",
    "marketId": "kr-seoul",
    "type": "guide",
    "title": "Buying a Seoul apartment: KRW 600m, 1bn and 1.5bn budgets",
    "deck": "What did KRW 600m, 1bn or 1.5bn buy in the May–July 2026 records? Compare apartment sizes, open the underlying sales and check a quote against Seoul transaction evidence.",
    "bodyMarkdown": "## 01 · Budget and transaction examples\n\nCompare three price ceilings using repeated historical transactions. Select a budget in the visual guide; each shows three projects with dates, area ranges and the underlying records. The ceiling is the property price, not total cash or a lending limit.\n\n## 02 · Costs beyond the price\n\nThe visual cost breakdown calculates selected taxes and fees at the price ceiling under explicit assumptions. It is a subtotal, not a complete acquisition-cost estimate. Financing is not assumed.\n\n## 03 · Before committing\n\nForeign buyers should check permission before committing. MOLIT announced a one-year extension of the existing foreign-buyer land transaction permission zones in August 2026. Confirm the exact address, permission requirement, occupancy conditions and funding documents with the district office; these examples do not certify that you can buy a particular property.\n\n## 04 · Property checklist\n\n- Check title, seller identity, liens and restrictions.\n- Compare recent sales in the same complex, size and floor range.\n- Confirm tenant deposits, vacant possession and the handover date.\n- Resolve permission, financing and settlement conditions before signing.\n\n## Source and selection\n\nMOLIT supplied extract: 366,779 rows, retrieved September 7, 2026. May–July uncancelled brokered apartment sales only; direct trades excluded. Area means exclusive-use area. Public-field matches can represent different sales, so supplied records are retained. Groups use complex ID and a 20 m² area band. Examples use the 80–100% range of the selected price ceiling. A group needs at least three records in that range and at least half of its period records in the range. Area bands include the lower bound and exclude the upper bound. Sort by qualifying record count descending, then source project name and area band; show three distinct project names. This is an evidence-based screen, not an investment ranking or a complete list of affordable properties. Floor, condition and reasons for unusually low prices are not verified. Records may change through late reporting and cancellations; extraction completeness is not independently certified. Prices are historical, not current listings. Currency, area definitions and periods differ across cities.",
    "status": "published",
    "evidenceState": "partial",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-07T10:18:02.848431Z",
    "reviewedBy": "SignedPrice data validation",
    "publishedAt": "2026-09-07T10:18:02.848431Z",
    "updatedAt": "2026-09-07T10:18:02.848431Z",
    "relatedHref": "/kr/seoul/explore/",
    "sources": [
      {
        "id": "seoul-apartment-buying-budget-guide-source-0",
        "kind": "primary",
        "publisher": "MOLIT",
        "title": "Foreign-buyer permission-zone extension",
        "href": "https://www.molit.go.kr/USR/NEWS/m_72/dtl.jsp?id=95092323&lcmspage=1",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "seoul-apartment-buying-budget-guide-source-1",
        "kind": "primary",
        "publisher": "Easy Law",
        "title": "Housing acquisition tax",
        "href": "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=4&cciNo=3&cnpClsNo=2&csmSeq=649",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "seoul-apartment-buying-budget-guide-source-2",
        "kind": "primary",
        "publisher": "MOLIT",
        "title": "Reported apartment sale records",
        "href": "https://rt.molit.go.kr/",
        "checkedAt": "2026-09-07"
      }
    ],
    "readerQuestion": "Which historical Seoul apartment examples fit my purchase-price budget, and what costs and eligibility checks come next?",
    "evidenceReleaseIds": [
      "seoul-buying-budget-extract-2026-09-07"
    ],
    "revisionNote": "Published reviewed budget screen with explicit selection, partial-cost assumptions and current official source links.",
    "canonicalHref": "/guides/seoul-apartment-buying-budget-guide/",
    "translationGroupId": null,
    "infographic": null
  },
  {
    "id": "singapore-condo-buying-budget-guide",
    "slug": "singapore-condo-buying-budget-guide",
    "locale": "en",
    "marketId": "sg-singapore",
    "type": "guide",
    "title": "Buying a Singapore condo: S$1m, S$1.5m and S$2m budgets",
    "deck": "What did S$1m, S$1.5m or S$2m buy in May–July 2026 condominium resales? Compare project examples and see how selected stamp duties change with the buyer profile.",
    "bodyMarkdown": "## 01 · Budget and transaction examples\n\nCompare three price ceilings using repeated historical transactions. Select a budget in the visual guide; each shows three projects with dates, area ranges and the underlying records. The ceiling is the property price, not total cash or a lending limit.\n\n## 02 · Costs beyond the price\n\nThe visual cost breakdown calculates selected taxes and fees at the price ceiling under explicit assumptions. It is a subtotal, not a complete acquisition-cost estimate. Financing is not assumed.\n\n## 03 · Before committing\n\nSLA lists ordinary condominium units among properties that foreign persons may buy without approval under the Residential Property Act. This guide excludes HDB, executive condominiums and landed homes. Ownership eligibility and stamp-duty treatment are separate checks.\n\n## 04 · Property checklist\n\n- Check tenure and the remaining lease.\n- Compare the same project, size and floor range.\n- Review maintenance costs, leases and possession conditions.\n- Confirm buyer-profile duties and financing before exercising an option.\n\n## Source and selection\n\nURA-based normalized snapshot generated September 2, 2026: 133,942 rows. May–July condominium resales, one unit, strata area and positive price/area. Separately classified apartments, ECs, HDB, new sales and sub-sales are excluded. Groups use project ID, tenure and a 20 m² area band. Strata area is not equivalent to Seoul exclusive-use area. Examples use the 80–100% range of the selected price ceiling. A group needs at least three records in that range and at least half of its period records in the range. Area bands include the lower bound and exclude the upper bound. Sort by qualifying record count descending, then source project name and area band; show three distinct project names. This is an evidence-based screen, not an investment ranking or a complete list of affordable properties. Floor, condition and reasons for unusually low prices are not verified. Records may change through late reporting and cancellations; extraction completeness is not independently certified. Prices are historical, not current listings. Currency, area definitions and periods differ across cities.",
    "status": "published",
    "evidenceState": "partial",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-07T10:18:02.848431Z",
    "reviewedBy": "SignedPrice data validation",
    "publishedAt": "2026-09-07T10:18:02.848431Z",
    "updatedAt": "2026-09-07T10:18:02.848431Z",
    "relatedHref": "/sg/singapore/explore/",
    "sources": [
      {
        "id": "singapore-condo-buying-budget-guide-source-0",
        "kind": "primary",
        "publisher": "SLA",
        "title": "Foreign ownership of property",
        "href": "https://www.sla.gov.sg/regulatory/foreign-ownership-of-property/",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "singapore-condo-buying-budget-guide-source-1",
        "kind": "primary",
        "publisher": "IRAS",
        "title": "Buyer’s Stamp Duty",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "singapore-condo-buying-budget-guide-source-2",
        "kind": "primary",
        "publisher": "IRAS",
        "title": "Additional Buyer’s Stamp Duty",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "singapore-condo-buying-budget-guide-source-3",
        "kind": "primary",
        "publisher": "IRAS",
        "title": "FTA remission",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "singapore-condo-buying-budget-guide-source-4",
        "kind": "primary",
        "publisher": "URA",
        "title": "Property data",
        "href": "https://www.ura.gov.sg/Corporate/Property/Property-Data",
        "checkedAt": "2026-09-07"
      }
    ],
    "readerQuestion": "Which historical Singapore apartment examples fit my purchase-price budget, and what costs and eligibility checks come next?",
    "evidenceReleaseIds": [
      "singapore-buying-budget-extract-2026-09-07"
    ],
    "revisionNote": "Published reviewed budget screen with explicit selection, partial-cost assumptions and current official source links.",
    "canonicalHref": "/guides/singapore-condo-buying-budget-guide/",
    "translationGroupId": null,
    "infographic": null
  },
  {
    "id": "dubai-ready-apartment-buying-budget-guide",
    "slug": "dubai-ready-apartment-buying-budget-guide",
    "locale": "en",
    "marketId": "ae-dubai",
    "type": "guide",
    "title": "Buying a Dubai Ready apartment: AED 750k, 1m and 1.5m budgets",
    "deck": "What did AED 750k, 1m or 1.5m buy in June–August 2026 Ready apartment records? Compare project examples, review the buyer registration share and check a quote against transaction evidence.",
    "bodyMarkdown": "## 01 · Budget and transaction examples\n\nCompare three price ceilings using repeated historical transactions. Select a budget in the visual guide; each shows three projects with dates, area ranges and the underlying records. The ceiling is the property price, not total cash or a lending limit.\n\n## 02 · Costs beyond the price\n\nThe visual cost breakdown calculates selected taxes and fees at the price ceiling under explicit assumptions. It is a subtotal, not a complete acquisition-cost estimate. Financing is not assumed.\n\n## 03 · Before committing\n\nForeign freehold ownership is permitted in designated areas. Examples below carry Free Hold and Ready labels in the source. Confirm the title deed, ownership eligibility and completion status for the actual unit with DLD. Off-plan transactions are excluded.\n\n## 04 · Property checklist\n\n- Verify the DLD title deed, seller and Ready status.\n- Compare the same project, bedrooms and reported area.\n- Review service charges, arrears, tenancy and handover.\n- Agree in writing who pays each registration and transaction fee.\n\n## Source and selection\n\nDLD supplied extract: 151,921 rows. June–August residential Unit/Flat, ordinary Sale, Ready, Free Hold, named project and positive value/area. Groups use area label, project name, bedroom count and a 20 m² area band. Area means ACTUAL_AREA. Counts are property-level entries, not unique legal contracts. Missing project names are excluded; a project name is not a verified building identifier. Examples use the 80–100% range of the selected price ceiling. A group needs at least three records in that range and at least half of its period records in the range. Area bands include the lower bound and exclude the upper bound. Sort by qualifying record count descending, then source project name and area band; show three distinct project names. This is an evidence-based screen, not an investment ranking or a complete list of affordable properties. Floor, condition and reasons for unusually low prices are not verified. Records may change through late reporting and cancellations; extraction completeness is not independently certified. Prices are historical, not current listings. Currency, area definitions and periods differ across cities.",
    "status": "published",
    "evidenceState": "partial",
    "authorName": "SignedPrice",
    "reviewedAt": "2026-09-07T10:18:02.848431Z",
    "reviewedBy": "SignedPrice data validation",
    "publishedAt": "2026-09-07T10:18:02.848431Z",
    "updatedAt": "2026-09-07T10:18:02.848431Z",
    "relatedHref": "/ae/dubai/explore/",
    "sources": [
      {
        "id": "dubai-ready-apartment-buying-budget-guide-source-0",
        "kind": "primary",
        "publisher": "UAE Government",
        "title": "Expatriates buying property",
        "href": "https://u.ae/en/information-and-services/moving-to-the-uae/expatriates-buying-a-property-in-the-uae",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "dubai-ready-apartment-buying-budget-guide-source-1",
        "kind": "primary",
        "publisher": "DLD",
        "title": "Property sale registration fees",
        "href": "https://dubailand.gov.ae/en/eservices/property-sale-registration/",
        "checkedAt": "2026-09-07"
      },
      {
        "id": "dubai-ready-apartment-buying-budget-guide-source-2",
        "kind": "primary",
        "publisher": "DLD",
        "title": "Open data",
        "href": "https://dubailand.gov.ae/en/open-data/",
        "checkedAt": "2026-09-07"
      }
    ],
    "readerQuestion": "Which historical Dubai apartment examples fit my purchase-price budget, and what costs and eligibility checks come next?",
    "evidenceReleaseIds": [
      "dubai-buying-budget-extract-2026-09-07"
    ],
    "revisionNote": "Published reviewed budget screen with explicit selection, partial-cost assumptions and current official source links.",
    "canonicalHref": "/guides/dubai-ready-apartment-buying-budget-guide/",
    "translationGroupId": null,
    "infographic": null
  }
];
