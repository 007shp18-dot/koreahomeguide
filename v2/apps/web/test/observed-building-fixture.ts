import { createHash } from 'node:crypto';

export const OBSERVED_BUILDING_FIXTURE_PERIOD = '2026-01/2026-07';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

export function createObservedBuildingInventoryFixture(): Record<string, unknown> {
  const records = [{
    buildingId: 'gangnam-evidence-tower', districtSlug: 'gangnam-gu',
    neighborhoodId: 'yeoksam-dong', neighborhoodName: '역삼동',
    officialName: 'Evidence Tower', housingType: 'apartment', observationCount: 8,
    jeonseObservationCount: 6, monthlyObservationCount: 2,
    firstObservedMonth: '2026-01', lastObservedMonth: '2026-07',
    coordinate: { state: 'ready', latitude: 37.5001, longitude: 127.0352 },
  }, {
    buildingId: 'jongno-monthly-home', districtSlug: 'jongno-gu',
    neighborhoodId: 'sajik-dong', neighborhoodName: '사직동',
    officialName: 'Monthly Home', housingType: 'officetel', observationCount: 1,
    jeonseObservationCount: 0, monthlyObservationCount: 1,
    firstObservedMonth: '2026-06', lastObservedMonth: '2026-06',
    coordinate: { state: 'pending', reason: 'coordinate_not_resolved' },
  }, {
    buildingId: 'gangnam-large-detached', districtSlug: 'gangnam-gu',
    neighborhoodId: 'sinsa-dong', neighborhoodName: '신사동',
    officialName: 'Large Detached Home', housingType: 'detached', observationCount: 2,
    jeonseObservationCount: 2, monthlyObservationCount: 0,
    firstObservedMonth: '2026-04', lastObservedMonth: '2026-07',
    coordinate: { state: 'ready', latitude: 37.518, longitude: 127.022 },
  }];
  const unsigned = {
    artifactVersion: 'signedprice-observed-building-inventory-v1',
    generatedAt: '2026-09-01T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period: OBSERVED_BUILDING_FIXTURE_PERIOD, provider: 'MOLIT',
      dataset: 'reported rent contracts', endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true, displayRights: true,
      exclusions: ['Canceled records', 'Records without a stable building identity'],
    },
    stats: {
      sourceRecordCount: 12, observedRecordCount: 11, observedBuildingCount: 3,
      cancelledRecordCount: 1, missingIdentityRecordCount: 0,
      coordinateReadyCount: 2, coordinatePendingCount: 1,
    },
    records,
  };
  return {
    ...unsigned,
    sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  };
}
