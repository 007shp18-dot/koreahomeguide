import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  KOREA_PROXIMITY_ARTIFACT_VERSION,
  buildKoreaProximityArtifact,
  canonicalKoreaProximityArtifactJson,
} from '@signedprice/korea-rent';
import { runKoreaProximityBuild } from '../scripts/build-korea-proximity.mts';
import { publishKoreaProximityBranch } from '../scripts/korea-proximity-workflow-helper.mjs';
import { scanKoreaProximityClientBoundary, scanKoreaProximitySourceBoundary } from '../scripts/scan-korea-proximity-client-boundary.mjs';

const run = promisify(execFile);

const now = () => new Date('2026-09-02T00:00:00.000Z');
const secret = 'https://official.example.test/feed?token=runner-secret';
const environment = Object.freeze({
  SEOUL_STATION_ENDPOINT: `${secret}&source=station`,
  KOREA_SCHOOL_ENDPOINT: `${secret}&source=school`,
  KOREA_BUILDING_COORDINATE_ENDPOINT: `${secret}&source=coordinate`,
  SEOUL_STATION_SOURCE_IDENTITY: 'seoul-station-master-v1',
  KOREA_SCHOOL_SOURCE_IDENTITY: 'korea-school-location-v1',
  KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY: 'korea-building-coordinate-v1',
});
const sourceIdentities = Object.freeze({
  station: environment.SEOUL_STATION_SOURCE_IDENTITY,
  school: environment.KOREA_SCHOOL_SOURCE_IDENTITY,
  coordinate: environment.KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY,
});
const descriptor = Object.freeze({
  descriptorVersion: 'signedprice-korea-proximity-sources-v1',
  station: { landingPage: 'https://public.example.test/stations', sourceVersion: 'official-2026-09', asOf: '2026-09-01' },
  school: { landingPage: 'https://public.example.test/schools', sourceVersion: 'official-2026-09', asOf: '2026-09-01' },
  coordinate: { landingPage: 'https://public.example.test/coordinates', sourceVersion: 'official-2026-09', asOf: '2026-09-01' },
});

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function inventory(count = 10): Record<string, unknown> {
  const records = Array.from({ length: count }, (_value, index) => ({
    buildingId: `building-${index}`,
    districtSlug: 'gangnam-gu',
    neighborhoodId: 'gangnam-gu-dong-one',
    neighborhoodName: '대치동',
    officialName: `관측 건물 ${index}`,
    housingType: 'apartment',
    observationCount: 1,
    jeonseObservationCount: 1,
    monthlyObservationCount: 0,
    firstObservedMonth: '2026-08',
    lastObservedMonth: '2026-08',
    coordinate: { state: 'pending', reason: 'coordinate_not_resolved' },
  }));
  const unsigned = {
    artifactVersion: 'signedprice-observed-building-inventory-v1',
    generatedAt: now().toISOString(),
    provenance: {
      marketId: 'kr-seoul', period: '2026-08/2026-08', provider: 'MOLIT',
      dataset: 'reported rent contracts', endpointVersion: 'v1', parserVersion: 'kr-molit-building-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1', sourceComplete: true, displayRights: true,
      exclusions: ['Canceled records', 'Records without a stable building identity'],
    },
    stats: {
      sourceRecordCount: count, observedRecordCount: count, observedBuildingCount: count,
      cancelledRecordCount: 0, missingIdentityRecordCount: 0, coordinateReadyCount: 0, coordinatePendingCount: count,
    },
    records,
  };
  return { ...unsigned, sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex') };
}

function source(kind: 'station' | 'school' | 'coordinate', page: number, totalPages: number, records: unknown[]) {
  return {
    source: sourceIdentities[kind],
    page: { number: page, totalPages }, records,
  };
}

function responses(overrides: Partial<Record<'station' | 'school' | 'coordinate', unknown>> = {}) {
  return new Map<string, unknown>([
    ['station:1', overrides.station ?? source('station', 1, 2, [{ stationId: 'station-a', name: 'A역', line: '1호선', latitude: 37.5, longitude: 127 }])],
    ['station:2', source('station', 2, 2, [{ stationId: 'station-b', name: 'B역', line: '2호선', latitude: 37.51, longitude: 127.01 }])],
    ['school:1', overrides.school ?? source('school', 1, 1, [{ schoolId: 'school-a', name: '가학교', latitude: 37.501, longitude: 127.001 }])],
    ['coordinate:1', overrides.coordinate ?? source('coordinate', 1, 1, Array.from({ length: 10 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5 + index / 100_000, longitude: 127 + index / 100_000 })))],
  ]);
}

function fixtureFetch(values = responses(), calls: string[] = []): typeof fetch {
  return (async (input: URL | RequestInfo) => {
    const url = new URL(String(input));
    calls.push(url.toString());
    const kind = url.searchParams.get('source');
    const page = url.searchParams.get('page') ?? '1';
    const body = values.get(`${kind}:${page}`);
    return new Response(body === undefined ? null : JSON.stringify(structuredClone(body)), {
      status: body === undefined ? 404 : 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}

async function paths() {
  const directory = await mkdtemp(join(tmpdir(), 'signedprice-korea-proximity-'));
  return { directory, outputPath: join(directory, 'candidate.json.gz'), stagingPath: join(directory, 'staging', 'signedprice-korea-proximity-v1.json.gz') };
}

describe('Korea proximity refresh runner', () => {
  it('requires all secret endpoint inputs before any transport', async () => {
    const destination = await paths();
    let called = false;
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), environment: {} , fetch: async () => { called = true; throw new Error('no'); } })).rejects.toThrow('Korea proximity endpoint configuration is incomplete');
    expect(called).toBe(false);
  });

  it('requires every independently configured source identity before any transport', async () => {
    const destination = await paths();
    let called = false;
    const endpointsOnly = {
      SEOUL_STATION_ENDPOINT: environment.SEOUL_STATION_ENDPOINT,
      KOREA_SCHOOL_ENDPOINT: environment.KOREA_SCHOOL_ENDPOINT,
      KOREA_BUILDING_COORDINATE_ENDPOINT: environment.KOREA_BUILDING_COORDINATE_ENDPOINT,
    };

    await expect(runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      sourceDescriptor: descriptor,
      environment: endpointsOnly,
      fetch: async () => {
        called = true;
        throw new Error('transport must not run');
      },
    })).rejects.toThrow('Korea proximity source identity configuration is incomplete');
    expect(called).toBe(false);
  });

  it('traverses deterministic source pages, joins exact official building identities, and promotes a verified gzip', async () => {
    const destination = await paths();
    const calls: string[] = [];
    const result = await runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(undefined, calls), now });
    expect(result).toMatchObject({ changed: true, artifactVersion: KOREA_PROXIMITY_ARTIFACT_VERSION, coordinateReadyCount: 10 });
    expect(calls).toHaveLength(4);
    expect(calls.every((call) => call.includes('token=runner-secret'))).toBe(true);
    const artifact = JSON.parse(gunzipSync(await readFile(destination.stagingPath)).toString('utf8'));
    expect(artifact.records.map((record: { buildingId: string }) => record.buildingId)).toEqual(Array.from({ length: 10 }, (_value, index) => `building-${index}`));
    expect(artifact.provenance).not.toContain('runner-secret');
    expect(JSON.stringify(artifact)).not.toContain(secret);
    for (const identity of Object.values(sourceIdentities)) {
      expect(JSON.stringify(artifact)).not.toContain(identity);
    }
  });

  it.each([
    ['wrong', 'wrong-station-source', false],
    ['null', null, false],
    ['inconsistent', 'wrong-station-source', true],
  ] as const)('rejects a %s provider source identity on every page', async (
    _label,
    sourceIdentity,
    secondPage,
  ) => {
    const destination = await paths();
    const values = responses();
    const key = secondPage ? 'station:2' : 'station:1';
    const page = structuredClone(values.get(key)) as Record<string, unknown>;
    page.source = sourceIdentity;
    values.set(key, page);

    await expect(runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      sourceDescriptor: descriptor,
      environment,
      fetch: fixtureFetch(values),
      now,
    })).rejects.toThrow('Korea proximity refresh failed');
  });

  it.each([
    ['schema-invalid page', source('station', 1, 2, [{ stationId: 'station-a', name: 'A역', line: '1호선', latitude: 'no', longitude: 127 }])],
    ['empty required station source', source('station', 1, 1, [])],
    ['unbounded page sequence', source('station', 2, 2, [{ stationId: 'station-a', name: 'A역', line: '1호선', latitude: 37.5, longitude: 127 }])],
  ])('fails closed on %s without exposing the secret', async (_name, station) => {
    const destination = await paths();
    const logs: string[] = [];
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(responses({ station })), now, log: (line) => logs.push(line) })).rejects.toThrow('Korea proximity refresh failed');
    expect(logs.join('\n')).not.toContain('runner-secret');
    await expect(stat(destination.stagingPath)).rejects.toThrow();
  });

  it('rejects a response body beyond four MiB before accepting its valid JSON', async () => {
    const destination = await paths();
    const values = responses();
    const oversizedBody = `${' '.repeat(4 * 1024 * 1024 + 1)}${JSON.stringify(values.get('station:1'))}`;
    const fallback = fixtureFetch(values);
    const boundedFetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.searchParams.get('source') === 'station' && url.searchParams.get('page') === '1') {
        return new Response(oversizedBody, {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return fallback(input, init);
    }) as typeof fetch;

    await expect(runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      sourceDescriptor: descriptor,
      environment,
      fetch: boundedFetch,
      now,
    })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('rejects more than 5,000 records on one provider page', async () => {
    const destination = await paths();
    const school = source('school', 1, 1, Array.from({ length: 5_001 }, (_value, index) => ({
      schoolId: `school-${index}`,
      name: `학교 ${index}`,
      latitude: 37.5,
      longitude: 127,
    })));

    await expect(runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      sourceDescriptor: descriptor,
      environment,
      fetch: fixtureFetch(responses({ school })),
      now,
    })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('rejects more than 10,000 station records across otherwise bounded pages', async () => {
    const destination = await paths();
    const values = responses();
    const stationRows = (start: number, count: number) => Array.from({ length: count }, (_value, offset) => ({
      stationId: `station-${start + offset}`,
      name: `역 ${start + offset}`,
      line: '테스트선',
      latitude: 37.5,
      longitude: 127,
    }));
    values.set('station:1', source('station', 1, 3, stationRows(0, 5_000)));
    values.set('station:2', source('station', 2, 3, stationRows(5_000, 5_000)));
    values.set('station:3', source('station', 3, 3, stationRows(10_000, 1)));

    await expect(runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      sourceDescriptor: descriptor,
      environment,
      fetch: fixtureFetch(values),
      now,
    })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('rejects provider text fields longer than 256 characters', async () => {
    const destination = await paths();
    const station = source('station', 1, 1, [{
      stationId: 'station-long-name',
      name: '역'.repeat(257),
      line: '1호선',
      latitude: 37.5,
      longitude: 127,
    }]);

    await expect(runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      sourceDescriptor: descriptor,
      environment,
      fetch: fixtureFetch(responses({ station })),
      now,
    })).rejects.toThrow('Korea proximity refresh failed');
  });

  it.each([
    ['zero coordinate coverage', source('coordinate', 1, 1, [])],
    ['below 90 percent coverage', source('coordinate', 1, 1, Array.from({ length: 8 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5, longitude: 127 })))],
    ['missing identity', source('coordinate', 1, 1, Array.from({ length: 9 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5, longitude: 127 })))],
    ['replacement identity', source('coordinate', 1, 1, Array.from({ length: 10 }, (_value, index) => ({ buildingId: index === 9 ? 'replacement-building' : `building-${index}`, latitude: 37.5, longitude: 127 })))],
    ['extra identity', source('coordinate', 1, 1, Array.from({ length: 11 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5, longitude: 127 })))],
    ['duplicate conflicting identity', source('coordinate', 1, 1, [...Array.from({ length: 9 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5, longitude: 127 })), { buildingId: 'building-0', latitude: 37.6, longitude: 127.1 }])],
  ])('rejects %s', async (_name, coordinate) => {
    const destination = await paths();
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(responses({ coordinate })), now })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('accepts exactly 90 percent coordinate coverage', async () => {
    const destination = await paths();
    const coordinate = source('coordinate', 1, 1, [
      ...Array.from({ length: 9 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5, longitude: 127 })),
      { buildingId: 'building-9', latitude: null, longitude: null },
    ]);
    const result = await runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(responses({ coordinate })), now });
    expect(result.coordinateReadyCount).toBe(9);
  });

  it('rejects a ten-percent predecessor shrink including coordinate-ready count', async () => {
    const destination = await paths();
    const previous = buildKoreaProximityArtifact({
      generatedAt: now().toISOString(), period: '2026-08/2026-08',
      sources: { station: { landingPage: 'https://public.example.test/station', sourceVersion: 'official-2026-08', asOf: '2026-08-01' }, school: { landingPage: 'https://public.example.test/school', sourceVersion: 'official-2026-08', asOf: '2026-08-01' }, coordinate: { landingPage: 'https://public.example.test/coordinate', sourceVersion: 'official-2026-08', asOf: '2026-08-01' } },
      buildings: Array.from({ length: 10 }, (_value, index) => ({ buildingId: `building-${index}`, coordinate: { latitude: 37.5, longitude: 127 } })),
      stations: [{ sourceId: 'station-a', name: 'A역', line: '1호선', coordinate: { latitude: 37.5, longitude: 127 } }],
      schools: [{ sourceId: 'school-a', name: '가학교', coordinate: { latitude: 37.5, longitude: 127 } }],
    });
    const coordinate = source('coordinate', 1, 1, [...Array.from({ length: 9 }, (_value, index) => ({ buildingId: `building-${index}`, latitude: 37.5, longitude: 127 })), { buildingId: 'building-9', latitude: null, longitude: null }]);
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), previousArtifact: previous, sourceDescriptor: descriptor, environment, fetch: fixtureFetch(responses({ coordinate })), now })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('does not rewrite unchanged validated content and produces deterministic gzip/digest output', async () => {
    const destination = await paths();
    const first = await runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(), now });
    const before = await readFile(destination.stagingPath);
    const independent = await paths();
    await runKoreaProximityBuild({ ...independent, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(), now });
    const second = await runKoreaProximityBuild({ ...destination, installedInventory: inventory(), previousArtifact: JSON.parse(gunzipSync(before).toString('utf8')), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(), now });
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(await readFile(destination.stagingPath)).toEqual(before);
    expect(await readFile(independent.stagingPath)).toEqual(before);
    expect(createHash('sha256').update(canonicalKoreaProximityArtifactJson(JSON.parse(gunzipSync(before).toString('utf8')))).digest('hex')).not.toBe('0'.repeat(64));
    expect((await readdir(destination.directory, { recursive: true })).every((entry) => !String(entry).includes('.tmp-'))).toBe(true);
  });

  it('uses a valid staging candidate only for semantic unchanged detection, even with an installed shrink predecessor', async () => {
    const destination = await paths();
    const first = await runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(), now });
    const stagedBytes = await readFile(destination.stagingPath);
    const staged = JSON.parse(gunzipSync(stagedBytes).toString('utf8'));
    const second = await runKoreaProximityBuild({
      ...destination,
      installedInventory: inventory(),
      previousArtifact: staged,
      sourceDescriptor: descriptor,
      environment,
      fetch: fixtureFetch(),
      now: () => new Date('2026-09-03T00:00:00.000Z'),
    });
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(await readFile(destination.stagingPath)).toEqual(stagedBytes);
  });

  it('fails closed when an existing staging candidate is malformed', async () => {
    const destination = await paths();
    await mkdir(join(destination.directory, 'staging'), { recursive: true });
    await writeFile(destination.stagingPath, 'not gzip', 'utf8');
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(), now })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('keeps the server-only builder and endpoint names out of client component imports', async () => {
    const source = await readFile(new URL('../scripts/build-korea-proximity.mts', import.meta.url), 'utf8');
    expect(source).toContain('SEOUL_STATION_ENDPOINT');
    expect(source).not.toContain("'use client'");
    expect(source).not.toMatch(/apps\/web\/components\/[\s\S]*build-korea-proximity/);
  });

  it('rejects proximity endpoint markers in browser assets while allowing an absent build', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'signedprice-korea-proximity-client-'));
    expect(await scanKoreaProximityClientBoundary(join(directory, 'missing'))).toEqual([]);
    const chunks = join(directory, '.next', 'static', 'chunks');
    await mkdir(chunks, { recursive: true });
    await writeFile(join(chunks, 'client.js'), 'const endpoint = "SEOUL_STATION_ENDPOINT";', 'utf8');
    expect(await scanKoreaProximityClientBoundary(join(directory, '.next'))).toEqual([
      { file: 'static/chunks/client.js', marker: 'station endpoint environment' },
    ]);
  });

  it('fails closed without a reviewable descriptor and never accepts provider provenance', async () => {
    const destination = await paths();
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), environment, fetch: fixtureFetch(), now })).rejects.toThrow('Korea proximity refresh failed');
    const poisoned = structuredClone(descriptor) as Record<string, unknown>;
    (poisoned.station as Record<string, unknown>).landingPage = environment.SEOUL_STATION_ENDPOINT;
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: poisoned, environment, fetch: fixtureFetch(), now })).rejects.toThrow('Korea proximity refresh failed');
    const versionPoison = structuredClone(descriptor) as Record<string, unknown>;
    (versionPoison.station as Record<string, unknown>).sourceVersion = 'runner-secret';
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: versionPoison, environment, fetch: fixtureFetch(), now })).rejects.toThrow('Korea proximity refresh failed');
    const pathPoison = structuredClone(descriptor) as Record<string, unknown>;
    (pathPoison.station as Record<string, unknown>).landingPage = 'https://public.example.test/credential-runner-secret';
    const pathEnvironment = { ...environment, SEOUL_STATION_ENDPOINT: 'https://provider.example.test/credential-runner-secret?source=station' };
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: pathPoison, environment: pathEnvironment, fetch: fixtureFetch(), now })).rejects.toThrow('Korea proximity refresh failed');
  });

  it.each([
    ['token path', 'https://provider.example.test/token/runner-secret?source=station', 'runner-secret'],
    ['api key path', 'https://provider.example.test/api/key/runner-secret?source=station', 'runner-secret'],
    ['decoded token path', 'https://provider.example.test/token/runner%76alue?source=station', 'runnervalue'],
    ['decoded api key path', 'https://provider.example.test/api/key/runner%76alue?source=station', 'runnervalue'],
  ])('rejects a decoded credential value adjacent to a %s marker', async (_name, stationEndpoint, sourceVersion) => {
    const destination = await paths();
    const poisoned = structuredClone(descriptor) as Record<string, unknown>;
    (poisoned.station as Record<string, unknown>).sourceVersion = sourceVersion;
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: poisoned, environment: { ...environment, SEOUL_STATION_ENDPOINT: stationEndpoint }, fetch: fixtureFetch(), now })).rejects.toThrow('Korea proximity refresh failed');
  });

  it('does not treat a generic api path component as a credential', async () => {
    const destination = await paths();
    const publicApiDescriptor = structuredClone(descriptor) as Record<string, unknown>;
    (publicApiDescriptor.station as Record<string, unknown>).sourceVersion = 'api';
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: publicApiDescriptor, environment: { ...environment, SEOUL_STATION_ENDPOINT: 'https://provider.example.test/api/status?source=station' }, fetch: fixtureFetch(), now })).resolves.toMatchObject({ changed: true });
  });

  it('does not retry non-transient 4xx responses', async () => {
    const destination = await paths();
    let calls = 0;
    const fetch = (async (input: URL | RequestInfo) => {
      if (new URL(String(input)).searchParams.get('source') === 'station') { calls += 1; return { ok: false, status: 401, json: async () => ({}) } as Response; }
      return fixtureFetch()(input);
    }) as typeof fetch;
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch, now })).rejects.toThrow('Korea proximity refresh failed');
    expect(calls).toBe(1);
  });

  it.each([
    ['HTTP 408', async () => ({ ok: false, status: 408, json: async () => ({}) } as Response)],
    ['HTTP 425', async () => ({ ok: false, status: 425, json: async () => ({}) } as Response)],
    ['HTTP 429', async () => ({ ok: false, status: 429, json: async () => ({}) } as Response)],
    ['HTTP 503', async () => ({ ok: false, status: 503, json: async () => ({}) } as Response)],
    ['transport failure', async () => { throw new TypeError('transport unavailable'); }],
  ])('retries transient %s only to the fixed bound', async (_name, stationFailure) => {
    const destination = await paths();
    let calls = 0;
    const fetch = (async (input: URL | RequestInfo) => {
      if (new URL(String(input)).searchParams.get('source') === 'station') { calls += 1; return stationFailure(); }
      return fixtureFetch()(input);
    }) as typeof fetch;
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch, now })).rejects.toThrow('Korea proximity refresh failed');
    expect(calls).toBe(3);
  });

  it('cleans a real temporary write after rename failure and preserves prior output', async () => {
    const destination = await paths();
    await runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: descriptor, environment, fetch: fixtureFetch(), now });
    const prior = await readFile(destination.stagingPath);
    let temporaryWritten = false;
    const changedDescriptor = structuredClone(descriptor) as Record<string, unknown>;
    (changedDescriptor.station as Record<string, unknown>).sourceVersion = 'official-2026-10';
    await expect(runKoreaProximityBuild({ ...destination, installedInventory: inventory(), sourceDescriptor: changedDescriptor, environment, fetch: fixtureFetch(), now, fileOps: { rename: async (from) => { temporaryWritten = (await stat(from)).isFile(); throw new Error('rename'); } } })).rejects.toThrow('Korea proximity refresh failed');
    expect(temporaryWritten).toBe(true);
    expect(await readFile(destination.stagingPath)).toEqual(prior);
    expect((await readdir(destination.directory, { recursive: true })).every((entry) => !String(entry).includes('.tmp-'))).toBe(true);
  });

  it('finds a client dependency graph importing the server builder', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'signedprice-korea-proximity-source-'));
    await mkdir(join(directory, 'components'), { recursive: true });
    await mkdir(join(directory, 'scripts'), { recursive: true });
    await writeFile(join(directory, 'components', 'client.tsx'), "'use client'; import '../scripts/build-korea-proximity.mts';", 'utf8');
    await writeFile(join(directory, 'scripts', 'build-korea-proximity.mts'), 'export {};', 'utf8');
    expect(await scanKoreaProximitySourceBoundary(directory)).toEqual([
      { file: 'components/client.tsx', marker: 'server builder import' },
    ]);
  });

  it('uses scheduled secret injection and least-privilege PR promotion without activation', async () => {
    const workflow = await readFile(new URL('../../.github/workflows/refresh-korea-proximity.yml', import.meta.url), 'utf8');
    expect(workflow).toMatch(/schedule:/);
    expect(workflow).toMatch(/cron: '0 7 1 \* \*'/);
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).toMatch(/SEOUL_STATION_ENDPOINT: \$\{\{ secrets\.SEOUL_STATION_ENDPOINT \}\}/);
    expect(workflow).toMatch(/KOREA_SCHOOL_ENDPOINT: \$\{\{ secrets\.KOREA_SCHOOL_ENDPOINT \}\}/);
    expect(workflow).toMatch(/KOREA_BUILDING_COORDINATE_ENDPOINT: \$\{\{ secrets\.KOREA_BUILDING_COORDINATE_ENDPOINT \}\}/);
    expect(workflow).toMatch(/SEOUL_STATION_SOURCE_IDENTITY: \$\{\{ vars\.SEOUL_STATION_SOURCE_IDENTITY \}\}/);
    expect(workflow).toMatch(/KOREA_SCHOOL_SOURCE_IDENTITY: \$\{\{ vars\.KOREA_SCHOOL_SOURCE_IDENTITY \}\}/);
    expect(workflow).toMatch(/KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY: \$\{\{ vars\.KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY \}\}/);
    expect(workflow).toMatch(/persist-credentials: false/);
    expect(workflow).toMatch(/timeout-minutes:/);
    expect(workflow).toMatch(/git status --porcelain/);
    expect(workflow).toMatch(/gh pr create/);
    expect(workflow).toMatch(/concurrency:/);
    expect(workflow).toMatch(/build:korea-proximity/);
    expect(workflow).not.toMatch(/installed-snapshots\.json|kr-proximity/);
  });

  it('documents only the required secret names and staged non-activation workflow', async () => {
    const document = await readFile(new URL('../../docs/operations/signedprice-korea-proximity-refresh.md', import.meta.url), 'utf8');
    for (const name of Object.keys(environment)) expect(document).toContain(name);
    expect(document).toContain('staging');
    expect(document).toContain('does not activate');
    expect(document).not.toContain('runner-secret');
  });

  it('runs the .mts builder with the local extension resolver instead of an unpinned downloader', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> };
    expect(packageJson.scripts['build:korea-proximity']).toContain('typescript-extension-loader.mjs');
    expect(packageJson.scripts['build:korea-proximity']).not.toContain('tsx');
  });

  it('loads only the exact installed registry as parsed JSON and leaves malicious lookalikes to Node', async () => {
    const loader = await import('../scripts/typescript-extension-loader.mjs');
    const registryUrl = new URL('../apps/web/data/installed-snapshots.json', import.meta.url).href;
    const registryText = await readFile(new URL(registryUrl), 'utf8');
    const nextLoad = vi.fn(async () => ({ format: 'json', source: 'untrusted()' }));
    const loaded = await loader.load(registryUrl, {}, nextLoad);
    expect(loaded).toMatchObject({ format: 'module', source: `export default ${JSON.stringify(JSON.parse(registryText))};`, shortCircuit: true });
    await expect(loader.load('file:///tmp/apps/web/data/installed-snapshots.json', {}, nextLoad)).resolves.toEqual({ format: 'json', source: 'untrusted()' });
    expect(nextLoad).toHaveBeenCalledTimes(1);
  });

  it('serializes JSON registry text as data and rejects malformed registry JSON', async () => {
    const loader = await import('../scripts/typescript-extension-loader.mjs');
    expect(loader.registryJsonModule('{"marker":"globalThis.pwned = true"}')).toBe('export default {"marker":"globalThis.pwned = true"};');
    expect(() => loader.registryJsonModule('{ malformed')).toThrow(SyntaxError);
  });

  it('publishes both an initial and an existing automation branch with a bot author and correct lease', async () => {
    const root = await mkdtemp(join(tmpdir(), 'signedprice-korea-proximity-git-'));
    const remote = join(root, 'remote.git');
    const first = join(root, 'first');
    const second = join(root, 'second');
    const branch = 'automation/korea-proximity-refresh';
    const artifact = 'v2/artifacts/korea-proximity/signedprice-korea-proximity-v1.json.gz';
    const git = async (cwd: string, ...args: string[]) => (await run('git', args, { cwd })).stdout.trim();
    await run('git', ['init', '--bare', remote]);
    await git(root, 'clone', remote, first);
    await writeFile(join(first, 'README.md'), 'seed', 'utf8');
    await git(first, 'config', 'user.name', 'seed');
    await git(first, 'config', 'user.email', 'seed@example.test');
    await git(first, 'add', '.');
    await git(first, 'commit', '-m', 'seed');
    await git(first, 'push', 'origin', 'HEAD:refs/heads/main');
    await mkdir(join(first, 'v2', 'artifacts', 'korea-proximity'), { recursive: true });
    await writeFile(join(first, artifact), 'first', 'utf8');
    const initial = await publishKoreaProximityBranch({ cwd: first, branch, artifactPath: artifact });
    expect(await git(remote, 'rev-parse', `refs/heads/${branch}`)).toBe(initial);
    expect(await git(remote, 'log', '-1', '--format=%an <%ae>', branch)).toBe('signedprice-refresh[bot] <signedprice-refresh[bot]@users.noreply.github.com>');
    await git(root, 'clone', remote, second);
    await mkdir(join(second, 'v2', 'artifacts', 'korea-proximity'), { recursive: true });
    await writeFile(join(second, artifact), 'second', 'utf8');
    const updated = await publishKoreaProximityBranch({ cwd: second, branch, artifactPath: artifact });
    expect(updated).not.toBe(initial);
    expect(await git(remote, 'rev-parse', `refs/heads/${branch}`)).toBe(updated);
    expect(await git(remote, 'show', `${branch}:${artifact}`)).toBe('second');
  });
});
