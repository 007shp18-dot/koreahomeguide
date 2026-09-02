import { describe, expect, test } from 'vitest';

import {
  KOREA_PROXIMITY_ARTIFACT_VERSION,
  KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE,
  assertKoreaProximityReleaseGate,
  buildKoreaProximityArtifact,
  buildKoreaProximityRecords,
  haversineDistanceMeters,
  koreaProximityBucketMeters,
  mergeKoreaStationSources,
} from '../src/proximity';

const source = {
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
} as const;

describe('Korea proximity geometry', () => {
  test('uses WGS84-coordinate Haversine distance and exact inclusive buckets', () => {
    expect(
      haversineDistanceMeters(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ),
    ).toBeCloseTo(111_195.08, 2);

    expect([
      koreaProximityBucketMeters(0),
      koreaProximityBucketMeters(250),
      koreaProximityBucketMeters(250.001),
      koreaProximityBucketMeters(500),
      koreaProximityBucketMeters(750),
      koreaProximityBucketMeters(1_000),
      koreaProximityBucketMeters(1_000.001),
    ]).toEqual([250, 250, 500, 500, 750, 1_000, null]);
  });

  test.each([
    [{ latitude: 90.001, longitude: 0 }],
    [{ latitude: 0, longitude: 180.001 }],
    [{ latitude: Number.NaN, longitude: 0 }],
  ])('rejects invalid coordinates without coercion', (coordinate) => {
    expect(() =>
      haversineDistanceMeters(coordinate, { latitude: 0, longitude: 0 }),
    ).toThrow('Invalid Korea proximity coordinate');
  });

  test('merges only coordinate-clustered same-name stations and retains distinct Shinchon stations', () => {
    const merged = mergeKoreaStationSources([
      {
        sourceId: 'subway-shinchon',
        name: '신촌역',
        line: '2호선',
        coordinate: { latitude: 37.55513, longitude: 126.93689 },
      },
      {
        sourceId: 'subway-shinchon-duplicate',
        name: ' 신촌역 ',
        line: '2호선',
        coordinate: { latitude: 37.55514, longitude: 126.9369 },
      },
      {
        sourceId: 'rail-shinchon',
        name: '신촌역',
        line: '경의중앙선',
        coordinate: { latitude: 37.55976, longitude: 126.94231 },
      },
      {
        sourceId: 'city-hall-1',
        name: '시청역',
        line: '1호선',
        coordinate: { latitude: 37.5657, longitude: 126.9771 },
      },
      {
        sourceId: 'city-hall-2',
        name: '시청역',
        line: '2호선',
        coordinate: { latitude: 37.56571, longitude: 126.97711 },
      },
    ]);

    expect(merged.filter((station) => station.name === '신촌역')).toHaveLength(2);
    expect(merged.find((station) => station.name === '시청역')).toMatchObject({
      lines: ['1호선', '2호선'],
    });
  });

  test('keeps every same-name station cluster within the 75 metre diameter', () => {
    const chain = [
      {
        sourceId: 'chain-west',
        name: '연쇄역',
        line: '1호선',
        coordinate: { latitude: 0, longitude: 0 },
      },
      {
        sourceId: 'chain-middle',
        name: '연쇄역',
        line: '2호선',
        coordinate: { latitude: 0, longitude: 0.0006 },
      },
      {
        sourceId: 'chain-east',
        name: '연쇄역',
        line: '3호선',
        coordinate: { latitude: 0, longitude: 0.0012 },
      },
    ] as const;

    const merged = mergeKoreaStationSources(chain);
    const reversed = mergeKoreaStationSources([...chain].reverse());

    expect(merged).toEqual(reversed);
    expect(merged).toHaveLength(2);
    expect(merged.map(({ sourceId }) => sourceId)).toEqual([
      'chain-middle+chain-west',
      'chain-east',
    ]);
    expect(merged.every((station) => station.lines.length <= 2)).toBe(true);
  });
});

describe('buildKoreaProximityRecords', () => {
  test('keeps station and school proximity independent and emits pending coordinate records', () => {
    const result = buildKoreaProximityRecords({
      buildings: [
        {
          buildingId: 'building-ready',
          coordinate: { latitude: 37.5665, longitude: 126.978 },
        },
        { buildingId: 'building-pending', coordinate: null },
      ],
      stations: [
        {
          sourceId: 'station-near',
          name: '시청역',
          line: '1호선',
          coordinate: { latitude: 37.5657, longitude: 126.9771 },
        },
      ],
      schools: [
        {
          sourceId: 'school-near',
          name: '덕수초등학교',
          coordinate: { latitude: 37.5669, longitude: 126.9751 },
        },
      ],
    });

    expect(result.records).toEqual([
      { buildingId: 'building-pending', status: 'pending_coordinate' },
      expect.objectContaining({
        buildingId: 'building-ready',
        status: 'ready',
        nearestStation: expect.objectContaining({ name: '시청역' }),
        nearestSchool: expect.objectContaining({ name: '덕수초등학교' }),
        stations: [expect.objectContaining({ name: '시청역', lines: ['1호선'] })],
        schools: [expect.objectContaining({ name: '덕수초등학교' })],
      }),
    ]);
  });

  test('returns exact global nearest POIs beyond 1,000m without adding them to nearby lists', () => {
    const result = buildKoreaProximityRecords({
      buildings: [
        { buildingId: 'origin', coordinate: { latitude: 37.5, longitude: 127 } },
      ],
      stations: [
        { sourceId: 'station-far', name: '먼역', line: '1호선', coordinate: { latitude: 37.52, longitude: 127 } },
      ],
      schools: [
        { sourceId: 'school-far', name: '먼학교', coordinate: { latitude: 37.53, longitude: 127 } },
      ],
    });

    expect(result.records[0]).toEqual(expect.objectContaining({
      status: 'ready',
      stations: [],
      schools: [],
      nearestStation: expect.objectContaining({ sourceId: 'station-far', bucketMeters: null }),
      nearestSchool: expect.objectContaining({ sourceId: 'school-far', bucketMeters: null }),
    }));
  });

  test('uses a bounded grid while preserving exact nearby results', () => {
    const result = buildKoreaProximityRecords({
      buildings: [
        { buildingId: 'seoul', coordinate: { latitude: 37.5665, longitude: 126.978 } },
        { buildingId: 'busan', coordinate: { latitude: 35.1796, longitude: 129.0756 } },
      ],
      stations: [
        { sourceId: 'seoul-near', name: '서울역', line: '1호선', coordinate: { latitude: 37.5659, longitude: 126.9782 } },
        { sourceId: 'seoul-far', name: '광화문역', line: '5호선', coordinate: { latitude: 37.576, longitude: 126.9768 } },
        { sourceId: 'busan-near', name: '부산역', line: '1호선', coordinate: { latitude: 35.1797, longitude: 129.0757 } },
        { sourceId: 'jeju', name: '제주역', line: '테스트선', coordinate: { latitude: 33.4996, longitude: 126.5312 } },
      ],
      schools: [],
    });

    const ready = result.records.filter((record) => record.status === 'ready');
    expect(ready.map((record) => record.stations.map((station) => station.sourceId))).toEqual([
      ['busan-near'],
      ['seoul-near'],
    ]);
    expect(ready.map((record) => record.nearestStation?.sourceId)).toEqual([
      'busan-near',
      'seoul-near',
    ]);
    expect(result.diagnostics.stationDistanceChecks).toBeLessThan(2 * 4);
    expect(result.diagnostics.stationNearestDistanceChecks).toBeLessThan(2 * 4);
  });
});

describe('Korea proximity publication contract', () => {
  test('fails closed on a ten-percent source shrink or insufficient coordinate coverage', () => {
    expect(() =>
      assertKoreaProximityReleaseGate({
        current: { observedBuildingCount: 100, coordinateReadyCount: 100, stationCount: 90, schoolCount: 100 },
        previous: { observedBuildingCount: 100, coordinateReadyCount: 100, stationCount: 100, schoolCount: 100 },
      }),
    ).toThrow('stationCount shrank by 10%');

    expect(() =>
      assertKoreaProximityReleaseGate({
        current: { observedBuildingCount: 100, coordinateReadyCount: 49, stationCount: 100, schoolCount: 100 },
      }),
    ).toThrow('coordinate coverage');

    expect(() =>
      assertKoreaProximityReleaseGate({
        current: { observedBuildingCount: 100, coordinateReadyCount: 90, stationCount: 91, schoolCount: 100 },
        previous: { observedBuildingCount: 100, coordinateReadyCount: 90, stationCount: 100, schoolCount: 100 },
      }),
    ).not.toThrow();

    expect(() =>
      assertKoreaProximityReleaseGate({
        current: { observedBuildingCount: 100, coordinateReadyCount: 100, stationCount: 0, schoolCount: 100 },
      }),
    ).toThrow('required stationCount is empty');

    const coordinateShrink = {
      current: {
        observedBuildingCount: 100,
        coordinateReadyCount: 90,
        stationCount: 100,
        schoolCount: 100,
      },
      previous: {
        observedBuildingCount: 100,
        coordinateReadyCount: 100,
        stationCount: 100,
        schoolCount: 100,
      },
    };
    expect(() => assertKoreaProximityReleaseGate(coordinateShrink))
      .toThrow('coordinateReadyCount shrank by 10%');

    const missingCoordinateCount = {
      current: { observedBuildingCount: 100, stationCount: 100, schoolCount: 100 },
    } as unknown as Parameters<typeof assertKoreaProximityReleaseGate>[0];
    expect(() => assertKoreaProximityReleaseGate(missingCoordinateCount))
      .toThrow('Invalid coordinateReadyCount');
  });

  test('builds a deterministic digested artifact with public provenance only', () => {
    const input = {
      generatedAt: '2026-09-02T00:00:00.000Z',
      period: '2026-08/2026-08',
      sources: source,
      buildings: Array.from({ length: 10 }, (_unused, index) => ({
        buildingId: `building-${index}`,
        coordinate: index === 9 ? null : { latitude: 37.5665 + index * 0.00001, longitude: 126.978 },
      })),
      stations: [
        { sourceId: 's2', name: '시청역', line: '2호선', coordinate: { latitude: 37.56571, longitude: 126.97711 } },
        { sourceId: 's1', name: '시청역', line: '1호선', coordinate: { latitude: 37.5657, longitude: 126.9771 } },
      ],
      schools: [
        { sourceId: 'school', name: '덕수초등학교', coordinate: { latitude: 37.5669, longitude: 126.9751 } },
      ],
    } as const;

    const artifact = buildKoreaProximityArtifact(input);
    const reversed = buildKoreaProximityArtifact({
      ...input,
      buildings: [...input.buildings].reverse(),
      stations: [...input.stations].reverse(),
    });

    expect(artifact).toEqual(reversed);
    expect(artifact.artifactVersion).toBe(KOREA_PROXIMITY_ARTIFACT_VERSION);
    expect(artifact.stations).toEqual([
      { sourceId: 's1+s2', name: '시청역', lines: ['1호선', '2호선'] },
    ]);
    expect(artifact.schools).toEqual([
      { sourceId: 'school', name: '덕수초등학교' },
    ]);
    expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(artifact)).not.toMatch(/api[-_]?key|credential|rawPayload/i);
  });

  test('uses the fixed production coverage floor and rejects extra source provenance', () => {
    expect(KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE).toBe(0.9);
    const buildings = Array.from({ length: 10 }, (_unused, index) => ({
      buildingId: `building-${index}`,
      coordinate: index < 8 ? { latitude: 37.5 + index * 0.0001, longitude: 127 } : null,
    }));
    const weakCoverageInput = {
      generatedAt: '2026-09-02T00:00:00.000Z',
      period: '2026-08/2026-08',
      sources: source,
      buildings,
      stations: [{ sourceId: 's', name: '역', line: '1호선', coordinate: { latitude: 37.5, longitude: 127 } }],
      schools: [{ sourceId: 'c', name: '학교', coordinate: { latitude: 37.5, longitude: 127 } }],
      minimumCoordinateCoverage: 0.1,
    };
    expect(() => buildKoreaProximityArtifact(weakCoverageInput))
      .toThrow('coordinate coverage');

    const sourceWithRawPayload = {
      ...source,
      station: { ...source.station, rawPayload: { rows: [] } },
    };
    expect(() => buildKoreaProximityArtifact({
      ...weakCoverageInput,
      buildings: buildings.map((building) => ({
        ...building,
        coordinate: building.coordinate ?? { latitude: 37.6, longitude: 127 },
      })),
      sources: sourceWithRawPayload,
    })).toThrow('Invalid Korea proximity public provenance');

    expect(() => buildKoreaProximityArtifact({
      ...weakCoverageInput,
      buildings: buildings.map((building) => ({
        ...building,
        coordinate: building.coordinate ?? { latitude: 37.6, longitude: 127 },
      })),
      sources: {
        ...source,
        station: { ...source.station, landingPage: 'https://data.seoul.go.kr/stations?apiKey=secret' },
      },
    })).toThrow('Invalid Korea proximity public provenance');
  });

  test('rejects a derived station catalog source-id collision', () => {
    const collision = {
      generatedAt: '2026-09-02T00:00:00.000Z',
      period: '2026-08/2026-08',
      sources: source,
      buildings: Array.from({ length: 10 }, (_unused, index) => ({
        buildingId: `building-${index}`,
        coordinate: { latitude: 37.5 + index * 0.00001, longitude: 127 },
      })),
      stations: [
        { sourceId: 'station-a', name: '같은역', line: '1호선', coordinate: { latitude: 37.5, longitude: 127 } },
        { sourceId: 'station-b', name: '같은역', line: '2호선', coordinate: { latitude: 37.5, longitude: 127 } },
        { sourceId: 'station-a+station-b', name: '다른역', line: '3호선', coordinate: { latitude: 37.6, longitude: 127 } },
      ],
      schools: [{ sourceId: 'school', name: '학교', coordinate: { latitude: 37.5, longitude: 127 } }],
    } as const;

    expect(() => buildKoreaProximityArtifact(collision))
      .toThrow('Duplicate Korea proximity merged station source id');
  });

  test('rejects non-canonical artifact identity and duplicate source ids', () => {
    const basis = {
      generatedAt: '2026-09-02T00:00:00.000Z',
      period: '2026-08/2026-08',
      sources: source,
      buildings: [{ buildingId: 'a', coordinate: { latitude: 37.5, longitude: 127 } }],
      stations: [{ sourceId: 's', name: '역', line: '1호선', coordinate: { latitude: 37.5, longitude: 127 } }],
      schools: [{ sourceId: 'c', name: '학교', coordinate: { latitude: 37.5, longitude: 127 } }],
    } as const;

    expect(() => buildKoreaProximityArtifact({ ...basis, generatedAt: '2026-09-02' }))
      .toThrow('Invalid Korea proximity generated instant');
    expect(() => buildKoreaProximityArtifact({ ...basis, period: '2026-09/2026-08' }))
      .toThrow('Invalid Korea proximity artifact period');
    expect(() => buildKoreaProximityArtifact({ ...basis, stations: [...basis.stations, basis.stations[0]] }))
      .toThrow('Duplicate Korea proximity station source id');
  });
});
