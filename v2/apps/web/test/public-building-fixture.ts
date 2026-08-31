import { createHash } from 'node:crypto';

import { PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION } from '../lib/public-market/building-summary-schema';

export const PUBLIC_BUILDING_FIXTURE_PERIOD = '2026-01/2026-07';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

export function createPublicBuildingRecord(
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    buildingId: 'gangnam-evidence-tower',
    districtSlug: 'gangnam-gu',
    name: 'Evidence Tower',
    housingType: 'apartment',
    supportedDeals: ['jeonse'],
    period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    generatedAt: '2026-08-31T01:13:24.787Z',
    publicationMinimum: 5,
    overall: {
      n: 6, published: true, min: 300_000_000, p25: 310_000_000,
      med: 320_000_000, p75: 330_000_000, max: 340_000_000, chg3m: 1.2,
    },
    areaBands: [{
      band: '45-55sqm',
      summary: {
        n: 6, published: true, min: 300_000_000, p25: 310_000_000,
        med: 320_000_000, p75: 330_000_000, max: 340_000_000, chg3m: 1.2,
      },
    }],
    recentContracts: [
      { filedMonth: '2026-07', areaSqm: 50, deal: 'jeonse', depositWon: 320_000_000, monthlyRentWon: 0 },
      { filedMonth: '2026-06', areaSqm: 49.5, deal: 'jeonse', depositWon: 315_000_000, monthlyRentWon: 0 },
    ],
    ...overrides,
  };
}

export function createPublicBuildingFixture(
  records: readonly Record<string, unknown>[] = [createPublicBuildingRecord()],
): Record<string, unknown> {
  const unsigned = {
    artifactVersion: PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-31T01:13:24.787Z',
    provenance: {
      marketId: 'kr-seoul',
      period: PUBLIC_BUILDING_FIXTURE_PERIOD,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v1',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      displayRights: true,
      exclusions: ['Canceled records', 'Private fields'],
    },
    totalRecordCount: records.length,
    records,
  };
  return {
    ...unsigned,
    sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  };
}
