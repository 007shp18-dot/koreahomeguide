import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

const station = {
  sourceId: 'e2e-station', name: 'E2E Station', lines: ['1호선'], distanceMeters: 250, bucketMeters: 250,
};
const school = {
  sourceId: 'e2e-school', name: 'E2E School', distanceMeters: 500, bucketMeters: 500,
};
const unsignedArtifact = {
  artifactVersion: 'signedprice-korea-proximity-v1',
  generatedAt: '2026-08-31T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul', period: '2026-01/2026-07',
    stationSource: { landingPage: 'https://data.seoul.go.kr/stations', sourceVersion: 'e2e-v1', asOf: '2026-08-31' },
    schoolSource: { landingPage: 'https://www.schoolinfo.go.kr/schools', sourceVersion: 'e2e-v1', asOf: '2026-08-31' },
    coordinateSource: { landingPage: 'https://www.data.go.kr/buildings', sourceVersion: 'e2e-v1', asOf: '2026-08-31' },
    methodology: { distance: 'WGS84 Haversine straight-line metres', nearbyLimitMeters: 1000, bucketsMeters: [250, 500, 750, 1000], stationMergeRadiusMeters: 75 },
  },
  counts: { observedBuildingCount: 1, coordinateReadyCount: 1, pendingCoordinateCount: 0, stationCount: 1, schoolCount: 1, stationMatchedBuildingCount: 1, schoolMatchedBuildingCount: 1 },
  coverage: { coordinateRatio: 1, minimumReleaseRatio: 0.9 },
  stations: [{ sourceId: station.sourceId, name: station.name, lines: station.lines }],
  schools: [{ sourceId: school.sourceId, name: school.name }],
  records: [{ buildingId: 'synthetic-test-building', status: 'ready', nearestStation: station, nearestSchool: school, stations: [station], schools: [school] }],
};

const artifact = {
  ...unsignedArtifact,
  sha256: createHash('sha256').update(canonicalJson(unsignedArtifact)).digest('hex'),
};
const serializedArtifact = canonicalJson(artifact);

const registry = {
  registryVersion: 'signedprice-installed-snapshots-v1',
  snapshots: [{
    marketId: 'kr-seoul', dataset: 'kr-proximity', schemaVersion: 'signedprice-korea-proximity-v1',
    sourceVersion: 'e2e-v1', parserVersion: 'signedprice-korea-proximity-v1', rightsPolicyId: 'public-proximity-display-v1',
    period: '2026-01/2026-07', generatedAt: '2026-08-31T00:00:00.000Z', objectUrl: 'installed://kr-proximity',
    sha256: createHash('sha256').update(serializedArtifact).digest('hex'), recordCount: 1,
  }],
};

export const E2E_KOREA_PROXIMITY_REGISTRY = JSON.stringify(registry);
export const E2E_KOREA_PROXIMITY_PAYLOAD = serializedArtifact;
export const E2E_KOREA_PROXIMITY_GZIP_BASE64 = gzipSync(E2E_KOREA_PROXIMITY_PAYLOAD).toString('base64');
