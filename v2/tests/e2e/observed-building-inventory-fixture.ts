import { createHash } from 'node:crypto';

import { PUBLIC_AREA_SUMMARY_TEST_PERIOD } from './public-area-summary-fixture';
import {
  PUBLIC_BUILDING_TEST_ID,
  PUBLIC_BUILDING_TEST_NAME,
} from './public-building-summary-fixture';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

const unsigned = {
  artifactVersion: 'signedprice-observed-building-inventory-v1',
  generatedAt: '2026-08-31T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul',
    period: PUBLIC_AREA_SUMMARY_TEST_PERIOD,
    provider: 'MOLIT',
    dataset: 'reported rent contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-building-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    sourceComplete: true,
    displayRights: true,
    exclusions: ['Canceled records', 'Private fields'],
  },
  stats: {
    sourceRecordCount: 6,
    observedRecordCount: 6,
    observedBuildingCount: 1,
    cancelledRecordCount: 0,
    missingIdentityRecordCount: 0,
    coordinateReadyCount: 1,
    coordinatePendingCount: 0,
  },
  records: [{
    buildingId: PUBLIC_BUILDING_TEST_ID,
    districtSlug: 'jongno-gu',
    neighborhoodId: 'sajik-dong',
    neighborhoodName: '사직동',
    officialName: PUBLIC_BUILDING_TEST_NAME,
    housingType: 'apartment',
    observationCount: 6,
    jeonseObservationCount: 6,
    monthlyObservationCount: 0,
    firstObservedMonth: '2026-01',
    lastObservedMonth: '2026-07',
    coordinate: { state: 'ready', latitude: 37.575, longitude: 126.97 },
  }],
};

export const OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT = JSON.stringify({
  ...unsigned,
  sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
});
