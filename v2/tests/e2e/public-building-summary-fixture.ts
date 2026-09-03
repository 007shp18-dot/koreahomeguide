import { createHash } from 'node:crypto';

import { PUBLIC_AREA_SUMMARY_TEST_PERIOD } from './public-area-summary-fixture';

export const PUBLIC_BUILDING_TEST_ID = 'synthetic-test-building';
export const PUBLIC_BUILDING_TEST_NAME = 'Synthetic Test Building';
export const PUBLIC_BUILDING_TEST_SELECTION_HREF =
  '/kr/seoul/explore/jongno-gu/synthetic-test-building/?district=jongno-gu&neighborhood=sajik-dong&buildingId=synthetic-test-building';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

const unsigned = {
  artifactVersion: 'signedprice-public-building-summary-v2',
  generatedAt: '2026-08-31T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul', period: PUBLIC_AREA_SUMMARY_TEST_PERIOD,
    provider: 'MOLIT', dataset: 'reported rent contracts', endpointVersion: 'v1',
    parserVersion: 'kr-molit-building-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
    sourceComplete: true, displayRights: true,
    exclusions: ['Canceled records', 'Private fields'],
  },
  totalRecordCount: 1,
  records: [{
    buildingId: PUBLIC_BUILDING_TEST_ID, districtSlug: 'jongno-gu',
    neighborhoodId: 'sajik-dong', neighborhoodName: '사직동',
    name: PUBLIC_BUILDING_TEST_NAME, housingType: 'apartment',
    latitude: 37.575, longitude: 126.97,
    period: PUBLIC_AREA_SUMMARY_TEST_PERIOD, generatedAt: '2026-08-31T00:00:00.000Z',
    publicationMinimum: 5,
    groups: {
      all: { n: 6, published: true, min: 480_000_000, p25: 490_000_000, med: 500_000_000, p75: 510_000_000, max: 520_000_000, chg3m: null },
      new: { n: 3, published: false }, renewal: { n: 2, published: false },
    },
    unknownContractCount: 1,
    areaBands: [{ band: '45-55sqm', summary: { n: 6, published: true, min: 480_000_000, p25: 490_000_000, med: 500_000_000, p75: 510_000_000, max: 520_000_000, chg3m: null } }],
    recentContracts: [{ filedMonth: '2026-07', areaSqm: 50, contractType: 'new', depositWon: 500_000_000 }],
  }],
};

export const PUBLIC_BUILDING_SUMMARY_TEST_ARTIFACT = JSON.stringify({
  ...unsigned,
  sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
});
