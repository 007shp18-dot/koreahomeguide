import { createHash } from 'node:crypto';

import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildKoreaProximityArtifact } from '@signedprice/korea-rent';

import {
  parseKoreaProximityArtifact,
  type KoreaProximityArtifactExpectation,
} from '../lib/public-market/korea-proximity-schema';
import { createKoreaProximityRepository, koreaProximityRepositoryFromEnvironment } from '../lib/public-market/korea-proximity-repository.server';
import {
  createObservedBuildingRepository,
  type ObservedBuildingRepository,
} from '../lib/public-market/observed-building-repository.server';
import { createInstalledSnapshotRepository } from '../lib/snapshots/installed-snapshot-repository.server';
import {
  createObservedBuildingInventoryFixture,
  OBSERVED_BUILDING_FIXTURE_PERIOD,
} from './observed-building-fixture';
import {
  E2E_KOREA_PROXIMITY_PAYLOAD,
  E2E_KOREA_PROXIMITY_REGISTRY,
} from '../../../tests/e2e/korea-proximity-fixture';

const expectation = {
  marketId: 'kr-seoul',
  period: '2026-08/2026-08',
  observedBuildingIds: Array.from({ length: 10 }, (_unused, index) => `building-${index}`),
} as const satisfies KoreaProximityArtifactExpectation;

function validArtifact(stationLatitude = 37.52) {
  return buildKoreaProximityArtifact({
    generatedAt: '2026-09-02T00:00:00.000Z',
    period: expectation.period,
    sources: {
      station: {
        landingPage: 'https://data.seoul.go.kr/stations',
        sourceVersion: '2026-08',
        asOf: '2026-08-31',
      },
      school: {
        landingPage: 'https://www.schoolinfo.go.kr/schools',
        sourceVersion: '2026-08',
        asOf: '2026-08-31',
      },
      coordinate: {
        landingPage: 'https://www.data.go.kr/buildings',
        sourceVersion: '2026-08',
        asOf: '2026-08-31',
      },
    },
    buildings: expectation.observedBuildingIds.map((buildingId, index) => ({
      buildingId,
      coordinate: index === 9 ? null : { latitude: 37.5 + index * 0.00001, longitude: 127 },
    })),
    stations: [
      { sourceId: 'station-z-name', name: 'Z역', line: '2호선', coordinate: { latitude: stationLatitude, longitude: 127 } },
      { sourceId: 'station-a-name', name: 'a역', line: '1호선', coordinate: { latitude: stationLatitude, longitude: 127 } },
    ],
    schools: [
      { sourceId: 'school-far', name: '먼학교', coordinate: { latitude: 37.53, longitude: 127 } },
    ],
  });

}

function installedObservedBuildingRepository() {
  return createObservedBuildingRepository({
    source: createObservedBuildingInventoryFixture(),
    expected: { marketId: 'kr-seoul', period: OBSERVED_BUILDING_FIXTURE_PERIOD },
  });
}

function observedBuildingRepositoryFor(
  buildingIds: readonly string[],
): ObservedBuildingRepository {
  return {
    listRecords: () => buildingIds.map((buildingId) => ({ buildingId })),
  } as never;
}

function validArtifactForInstalledInventory() {
  const observedBuildingRepository = installedObservedBuildingRepository();
  return buildKoreaProximityArtifact({
    generatedAt: '2026-09-02T00:00:00.000Z',
    period: OBSERVED_BUILDING_FIXTURE_PERIOD,
    sources: {
      station: { landingPage: 'https://data.seoul.go.kr/stations', sourceVersion: '2026-08', asOf: '2026-08-31' },
      school: { landingPage: 'https://www.schoolinfo.go.kr/schools', sourceVersion: '2026-08', asOf: '2026-08-31' },
      coordinate: { landingPage: 'https://www.data.go.kr/buildings', sourceVersion: '2026-08', asOf: '2026-08-31' },
    },
    buildings: observedBuildingRepository.listRecords().map((record, index) => ({
      buildingId: record.buildingId,
      coordinate: { latitude: 37.5 + index * 0.0001, longitude: 127 },
    })),
    stations: [{ sourceId: 'station', name: '역', line: '1호선', coordinate: { latitude: 37.5, longitude: 127 } }],
    schools: [{ sourceId: 'school', name: '학교', coordinate: { latitude: 37.5, longitude: 127 } }],
  });
}

describe('parseKoreaProximityArtifact', () => {
  test('uses the shared code-unit tie order instead of locale or case collation', () => {
    const artifact = parseKoreaProximityArtifact(validArtifact(37.5005), expectation);
    const first = artifact.records[0];
    if (first?.status !== 'ready') throw new Error('Expected a ready record');

    expect(first.stations.map(({ name }) => name)).toEqual(['Z역', 'a역']);
    expect(first.nearestStation).toEqual(first.stations[0]);
  });

  test('accepts an exact digested artifact and deeply freezes independent proximity records', () => {
    const artifact = parseKoreaProximityArtifact(validArtifact(), expectation);

    expect(artifact.records).toHaveLength(10);
    expect(artifact.records[0]).toEqual(expect.objectContaining({
      buildingId: 'building-0',
      status: 'ready',
      stations: [],
      schools: [],
      nearestStation: expect.objectContaining({ sourceId: 'station-z-name', bucketMeters: null }),
      nearestSchool: expect.objectContaining({ sourceId: 'school-far', bucketMeters: null }),
    }));
    expect(artifact.records[9]).toEqual({
      buildingId: 'building-9',
      status: 'pending_coordinate',
    });
    expect(artifact.stations).toEqual([
      { sourceId: 'station-a-name', name: 'a역', lines: ['1호선'] },
      { sourceId: 'station-z-name', name: 'Z역', lines: ['2호선'] },
    ]);
    expect(artifact.schools).toEqual([
      { sourceId: 'school-far', name: '먼학교' },
    ]);
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(artifact.records)).toBe(true);
    expect(Object.isFrozen(artifact.provenance.methodology)).toBe(true);
    expect(Object.isFrozen(artifact.provenance.methodology.bucketsMeters)).toBe(true);
  });

  test('rejects missing, replaced, or extra canonical observed-building expectations', () => {
    for (const observedBuildingIds of [
      expectation.observedBuildingIds.slice(0, -1),
      [...expectation.observedBuildingIds.slice(0, -1), 'replacement-building'].sort(),
      [...expectation.observedBuildingIds, 'extra-building'].sort(),
    ]) {
      expect(() => parseKoreaProximityArtifact(validArtifact(), {
        ...expectation,
        observedBuildingIds,
      })).toThrow('Invalid Korea proximity artifact');
    }
  });

  test.each([
    ['missing id', (artifact: Record<string, unknown>) => {
      (artifact.records as unknown[]).pop();
      Object.assign(artifact.counts as Record<string, unknown>, {
        observedBuildingCount: 9,
        coordinateReadyCount: 9,
        pendingCoordinateCount: 0,
      });
      Object.assign(artifact.coverage as Record<string, unknown>, { coordinateRatio: 1 });
    }],
    ['replaced id', (artifact: Record<string, unknown>) => {
      const records = artifact.records as Array<Record<string, unknown>>;
      records[9]!.buildingId = 'replacement-building';
    }],
    ['extra id', (artifact: Record<string, unknown>) => {
      const records = artifact.records as Array<Record<string, unknown>>;
      records.push({ ...structuredClone(records[0]!), buildingId: 'z-extra-building' });
      Object.assign(artifact.counts as Record<string, unknown>, {
        observedBuildingCount: 11,
        coordinateReadyCount: 10,
        pendingCoordinateCount: 1,
      });
      Object.assign(artifact.coverage as Record<string, unknown>, { coordinateRatio: 10 / 11 });
    }],
  ] as const)('rejects a recomputed artifact with a %s', (_label, mutate) => {
    const artifact = structuredClone(validArtifact()) as unknown as Record<string, unknown>;
    mutate(artifact);
    refreshDigest(artifact);

    expect(() => parseKoreaProximityArtifact(artifact, expectation)).toThrow(
      'Invalid Korea proximity artifact',
    );
  });

  test.each([
    ['catalog count mismatch', (artifact: Record<string, unknown>) => {
      (artifact.counts as Record<string, unknown>).stationCount = 3;
    }],
    ['unsorted station catalog', (artifact: Record<string, unknown>) => {
      (artifact.stations as unknown[]).reverse();
    }],
    ['record reference name mismatch', (artifact: Record<string, unknown>) => {
      const first = (artifact.records as Array<Record<string, unknown>>)[0]!;
      (first.nearestStation as Record<string, unknown>).name = '변조역';
    }],
    ['record reference line mismatch', (artifact: Record<string, unknown>) => {
      const first = (artifact.records as Array<Record<string, unknown>>)[0]!;
      (first.nearestStation as Record<string, unknown>).lines = ['변조선'];
    }],
    ['school reference name mismatch', (artifact: Record<string, unknown>) => {
      const first = (artifact.records as Array<Record<string, unknown>>)[0]!;
      (first.nearestSchool as Record<string, unknown>).name = '변조학교';
    }],
  ] as const)('rejects %s even after the artifact digest is recomputed', (_label, mutate) => {
    const artifact = structuredClone(validArtifact()) as unknown as Record<string, unknown>;
    mutate(artifact);
    refreshDigest(artifact);
    expect(() => parseKoreaProximityArtifact(artifact, expectation)).toThrow(
      'Invalid Korea proximity artifact',
    );
  });

  test.each([
    ['digest tamper', (artifact: Record<string, unknown>) => {
      const counts = artifact.counts as Record<string, unknown>;
      counts.schoolCount = 12;
    }],
    ['count mismatch with a recomputed digest', (artifact: Record<string, unknown>) => {
      const counts = artifact.counts as Record<string, unknown>;
      counts.pendingCoordinateCount = 0;
      refreshDigest(artifact);
    }],
    ['market identity mismatch', (artifact: Record<string, unknown>) => {
      (artifact.provenance as Record<string, unknown>).marketId = 'sg-singapore';
      refreshDigest(artifact);
    }],
    ['period identity mismatch', (artifact: Record<string, unknown>) => {
      (artifact.provenance as Record<string, unknown>).period = '2026-07/2026-08';
      refreshDigest(artifact);
    }],
    ['unknown raw provider field', (artifact: Record<string, unknown>) => {
      (artifact.provenance as Record<string, unknown>).rawPayload = 'secret';
      refreshDigest(artifact);
    }],
    ['lowered release threshold', (artifact: Record<string, unknown>) => {
      (artifact.coverage as Record<string, unknown>).minimumReleaseRatio = 0.75;
      refreshDigest(artifact);
    }],
  ] as const)('fails closed on %s', (_label, mutate) => {
    const artifact = structuredClone(validArtifact()) as unknown as Record<string, unknown>;
    mutate(artifact);
    expect(() => parseKoreaProximityArtifact(artifact, expectation)).toThrow(
      'Invalid Korea proximity artifact',
    );
  });
});

describe('createKoreaProximityRepository', () => {
  test('derives canonical IDs from the installed observed-building repository and fails closed without it', () => {
    const observedBuildingRepository = installedObservedBuildingRepository();
    const artifact = validArtifactForInstalledInventory();
    const expected = { marketId: 'kr-seoul', period: OBSERVED_BUILDING_FIXTURE_PERIOD } as const;

    expect(createKoreaProximityRepository({
      source: artifact,
      expected,
      observedBuildingRepository,
    }).state).toBe('ready');
    expect(createKoreaProximityRepository({
      source: artifact,
      expected,
      observedBuildingRepository: null,
    })).toEqual({ state: 'invalid' });
    expect(createKoreaProximityRepository({
      source: artifact,
      expected,
      observedBuildingRepository: {
        ...observedBuildingRepository,
        listRecords: () => { throw new Error('invalid installed inventory'); },
      },
    })).toEqual({ state: 'invalid' });
    expect(createKoreaProximityRepository({
      source: artifact,
      expected,
      observedBuildingRepository: {
        ...observedBuildingRepository,
        listRecords: () => [{ buildingId: 'replacement-building' }],
      } as never,
    })).toEqual({ state: 'invalid' });
  });

  test('reports missing, invalid, and ready states without publishing partial data', () => {
    const observedBuildingRepository = observedBuildingRepositoryFor(expectation.observedBuildingIds);
    const expected = { marketId: expectation.marketId, period: expectation.period } as const;
    expect(createKoreaProximityRepository({ source: undefined, expected, observedBuildingRepository }))
      .toEqual({ state: 'missing' });
    expect(createKoreaProximityRepository({ source: {}, expected, observedBuildingRepository }))
      .toEqual({ state: 'invalid' });

    const loaded = createKoreaProximityRepository({
      source: validArtifact(), expected, observedBuildingRepository,
    });
    expect(loaded.state).toBe('ready');
    if (loaded.state !== 'ready') throw new Error('Expected ready proximity repository');
    expect(loaded.repository.getByBuildingId('building-0')).toEqual(
      expect.objectContaining({ status: 'ready' }),
    );
    expect(loaded.repository.findByBuildingId('building-0')).toEqual(
      expect.objectContaining({ status: 'ready' }),
    );
    expect(loaded.repository.findByBuildingId('unknown-building')).toBeNull();
    expect(() => loaded.repository.getByBuildingId('unknown-building')).toThrow(
      'Verified Korea proximity evidence is unavailable',
    );
  });

  test('loads through the installed-snapshot identity contract when a real activation is supplied', () => {
    const artifact = validArtifact();
    const installed = createInstalledSnapshotRepository({
      registrySource: {
        registryVersion: 'signedprice-installed-snapshots-v1',
        snapshots: [{
          marketId: 'kr-seoul',
          dataset: 'kr-proximity',
          schemaVersion: 'signedprice-korea-proximity-v1',
          sourceVersion: 'official-seoul-proximity-2026-08',
          parserVersion: 'signedprice-korea-proximity-v1',
          rightsPolicyId: 'public-proximity-display-v1',
          period: expectation.period,
          generatedAt: '2026-09-02T00:00:00.000Z',
          objectUrl: 'installed://kr-proximity',
          sha256: createHash('sha256').update(canonicalJson(artifact)).digest('hex'),
          recordCount: 10,
        }],
      },
      resolveObject: () => artifact,
    }).get('kr-seoul', 'kr-proximity');

    expect(installed.metadata.period).toBe('2026-08/2026-08');
    expect(createKoreaProximityRepository({
      source: installed.payload,
      expected: {
        marketId: 'kr-seoul',
        period: installed.metadata.period,
      },
      observedBuildingRepository: observedBuildingRepositoryFor(expectation.observedBuildingIds),
    }).state).toBe('ready');
  });
});

describe('koreaProximityRepositoryFromEnvironment', () => {
  test('accepts the isolated Playwright ready fixture without a checked-in activation', () => {
    const loaded = koreaProximityRepositoryFromEnvironment({
      registrySource: JSON.parse(E2E_KOREA_PROXIMITY_REGISTRY),
      resolveObject: () => JSON.parse(E2E_KOREA_PROXIMITY_PAYLOAD),
      observedBuildingRepository: observedBuildingRepositoryFor(['synthetic-test-building']),
      useCheckedInSnapshot: false,
    });
    expect(loaded.state).toBe('ready');
  });

  test('distinguishes invalid registry, absent activation, and a configured unverifiable activation', () => {
    expect(koreaProximityRepositoryFromEnvironment({ registrySource: { invalid: true }, useCheckedInSnapshot: false })).toEqual({ state: 'invalid' });
    expect(koreaProximityRepositoryFromEnvironment({ registrySource: { snapshots: [{}] }, useCheckedInSnapshot: false })).toEqual({ state: 'invalid' });
    expect(koreaProximityRepositoryFromEnvironment({ registrySource: { registryVersion: 'signedprice-installed-snapshots-v1', snapshots: [] }, useCheckedInSnapshot: false })).toEqual({ state: 'missing' });
    expect(koreaProximityRepositoryFromEnvironment({ registrySource: { snapshots: [{ marketId: 'kr-seoul', dataset: 'kr-proximity' }] }, useCheckedInSnapshot: false })).toEqual({ state: 'invalid' });
  });
});

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function refreshDigest(artifact: Record<string, unknown>): void {
  const unsigned = { ...artifact };
  delete unsigned.sha256;
  artifact.sha256 = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');
}
