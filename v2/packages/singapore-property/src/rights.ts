export type UraRightsDecision = 'allowed' | 'blocked' | 'requires_dataset_confirmation';
export type UraRightsOperation = 'ingest' | 'aggregate' | 'display' | 'commercial' | 'index';

export const SG_URA_PRIVATE_SALE_RIGHTS = Object.freeze({
  id: 'sg-ura-private-sale-v1',
  reviewedAt: '2026-09-02',
  operations: Object.freeze({
    ingest: 'allowed',
    aggregate: 'allowed',
    display: 'allowed',
    commercial: 'allowed',
    index: 'blocked',
  } as const satisfies Readonly<Record<UraRightsOperation, UraRightsDecision>>),
  sources: Object.freeze([
    Object.freeze({
      label: 'URA API terms of service',
      url: 'https://www.ura.gov.sg/eservices-info/maps/api-terms-of-service/',
      note: 'The 17 April 2026 terms permit commercial and non-commercial API use; dataset use follows the Singapore Open Data Licence.',
    }),
    Object.freeze({
      label: 'URA Data Service overview',
      url: 'https://www.developer.tech.gov.sg/products/categories/data-and-apis/ura-apis/overview',
      note: 'Official service overview and access boundary.',
    }),
    Object.freeze({
      label: 'Private residential transaction limitations',
      url: 'https://eservice.ura.gov.sg/property-market-information/pmiResidentialTransactionSearch',
      note: 'Official coverage and caveat reference for private residential transactions.',
    }),
  ]),
});
