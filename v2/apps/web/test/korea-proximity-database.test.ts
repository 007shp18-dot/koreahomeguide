import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createKoreaProximityDatabasePublisher,
  proximityDatabaseRows,
} from '../lib/public-market/korea-proximity-database.server';
import type { VerifiedKoreaProximityArtifact } from '../lib/public-market/korea-proximity-schema';

const artifact = {
  sha256: 'a'.repeat(64),
  provenance: {
    stationSource: { landingPage: 'https://data.seoul.go.kr/stations' },
    schoolSource: { landingPage: 'https://www.schoolinfo.go.kr/schools' },
  },
  records: [
    {
      buildingId: 'gangnam-building', status: 'ready',
      nearestStation: { sourceId: 'STN-1', name: '강남역', lines: ['2호선', '신분당선'], distanceMeters: 1_220, bucketMeters: null },
      nearestSchool: { sourceId: 'SCH-1', name: '강남초', distanceMeters: 430, bucketMeters: 500 },
      stations: [],
      schools: [{ sourceId: 'SCH-1', name: '강남초', distanceMeters: 430, bucketMeters: 500 }],
    },
    { buildingId: 'pending-building', status: 'pending_coordinate' },
  ],
} as unknown as VerifiedKoreaProximityArtifact;

describe('Korea proximity database projection', () => {
  it('stores the nearest station beyond one kilometre and de-duplicates nearby matches', () => {
    expect(proximityDatabaseRows(artifact)).toEqual([
      {
        buildingKey: 'seoul:gangnam-building', kind: 'school', providerId: 'SCH-1',
        name: '강남초', distanceMeters: 430, lines: [], isNearest: true,
        source: 'https://www.schoolinfo.go.kr/schools', evidenceSha256: 'a'.repeat(64),
      },
      {
        buildingKey: 'seoul:gangnam-building', kind: 'station', providerId: 'STN-1',
        name: '강남역', distanceMeters: 1220, lines: ['2호선', '신분당선'], isNearest: true,
        source: 'https://data.seoul.go.kr/stations', evidenceSha256: 'a'.repeat(64),
      },
    ]);
  });

  it('publishes validated rows in bounded chunks and records the ingestion result', async () => {
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const publisher = createKoreaProximityDatabasePublisher({
      async query(statement, parameters = []) {
        calls.push({ statement, parameters });
        if (statement.includes('proximity-db:start')) return [{ id: '17' }];
        if (statement.includes('proximity-db:chunk')) {
          return [{ stored_count: String(JSON.parse(String(parameters[1])).length) }];
        }
        return [];
      },
    }, 1);

    await expect(publisher.publish(artifact)).resolves.toEqual({
      state: 'ready', buildings: 2, storedPlaces: 2, evidenceSha256: 'a'.repeat(64),
    });
    expect(calls.filter(({ statement }) => statement.includes('proximity-db:chunk'))).toHaveLength(2);
    expect(calls.at(-1)?.statement).toContain('proximity-db:finish');
  });
});
