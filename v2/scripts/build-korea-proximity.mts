import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';

import {
  buildKoreaProximityArtifact,
  canonicalKoreaProximityArtifactJson,
  compareKoreaProximityText,
  type KoreaProximityCoordinate,
  type KoreaProximitySchoolSource,
  type KoreaProximitySourceProvenance,
  type KoreaProximityStationSource,
} from '@signedprice/korea-rent';
import {
  parseKoreaProximityArtifact,
  type VerifiedKoreaProximityArtifact,
} from '../apps/web/lib/public-market/korea-proximity-schema.ts';
import {
  parseObservedBuildingArtifact,
  type VerifiedObservedBuildingArtifact,
} from '../apps/web/lib/public-market/observed-building-schema.ts';
import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
} from '../apps/web/lib/snapshots/installed-snapshot-repository.server.ts';

const DEFAULT_MAX_PAGES = 256;
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 15_000;
const BUILD_TIMEOUT_MS = 90_000;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const MAX_RECORDS_PER_PAGE = 5_000;
const MAX_TEXT_FIELD_LENGTH = 256;
const MAX_SOURCE_IDENTITY_LENGTH = 128;
const MAX_ENDPOINT_LENGTH = 4_096;
const MAX_SOURCE_RECORDS = Object.freeze({
  station: 10_000,
  school: 20_000,
  coordinate: 60_000,
} as const);

type SourceKind = 'station' | 'school' | 'coordinate';

type RefreshEndpointEnvironment = Readonly<{
  SEOUL_STATION_ENDPOINT?: string;
  KOREA_SCHOOL_ENDPOINT?: string;
  KOREA_BUILDING_COORDINATE_ENDPOINT?: string;
  SEOUL_STATION_SOURCE_IDENTITY?: string;
  KOREA_SCHOOL_SOURCE_IDENTITY?: string;
  KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY?: string;
}>;

type ConfiguredInputSource = Readonly<{
  endpoint: string;
  sourceIdentity: string;
}>;

type StationWireRecord = Readonly<{
  stationId: string;
  name: string;
  line: string;
  latitude: number;
  longitude: number;
}>;

type SchoolWireRecord = Readonly<{
  schoolId: string;
  name: string;
  latitude: number;
  longitude: number;
}>;

type CoordinateWireRecord = Readonly<{
  buildingId: string;
  coordinate: KoreaProximityCoordinate | null;
}>;

type PageEnvelope<T> = Readonly<{
  page: Readonly<{ number: number; totalPages: number }>;
  records: readonly T[];
}>;

export type KoreaProximityBuildResult = Readonly<{
  changed: boolean;
  artifactVersion: 'signedprice-korea-proximity-v1';
  digest: string;
  coordinateReadyCount: number;
  observedBuildingCount: number;
  stationCount: number;
  schoolCount: number;
}>;

export type KoreaProximityBuildOptions = Readonly<{
  outputPath?: string;
  stagingPath?: string;
  installedInventory?: unknown;
  installedInventoryPath?: string;
  sourceDescriptor?: unknown;
  sourceDescriptorPath?: string;
  previousArtifact?: unknown;
  previousArtifactPath?: string;
  environment?: RefreshEndpointEnvironment;
  fetch?: typeof fetch;
  now?: () => Date;
  log?: (line: string) => void;
  maxPages?: number;
  fileOps?: Readonly<{ writeFile?: typeof writeFile; rename?: typeof rename }>;
}>;

function refreshFailure(): Error {
  return new Error('Korea proximity refresh failed.');
}

class NonRetryableFetchError extends Error {}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function text(value: unknown, maximumLength = MAX_TEXT_FIELD_LENGTH): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maximumLength
    && value === value.trim();
}

function coordinate(value: unknown): value is KoreaProximityCoordinate {
  return isObject(value) && exactKeys(value, ['latitude', 'longitude']) &&
    typeof value.latitude === 'number' && Number.isFinite(value.latitude) && value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === 'number' && Number.isFinite(value.longitude) && value.longitude >= -180 && value.longitude <= 180;
}

function publicProvenance(value: unknown): value is KoreaProximitySourceProvenance {
  if (!isObject(value) || !exactKeys(value, ['landingPage', 'sourceVersion', 'asOf']) ||
    !text(value.landingPage, 2_048) || !text(value.sourceVersion) || !text(value.asOf, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(value.asOf)) return false;
  try {
    const url = new URL(value.landingPage);
    const date = new Date(`${value.asOf}T00:00:00.000Z`);
    return url.protocol === 'https:' && url.username === '' && url.password === '' && url.search === '' && url.hash === '' &&
      Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.asOf;
  } catch {
    return false;
  }
}

function pageEnvelope(
  value: unknown,
  pageNumber: number,
  kind: SourceKind,
  expectedSourceIdentity: string,
): PageEnvelope<unknown> {
  if (!isObject(value) || !exactKeys(value, ['source', 'page', 'records']) || !isObject(value.page)) throw refreshFailure();
  const page = value.page;
  if (!exactKeys(page, ['number', 'totalPages']) || typeof page.number !== 'number' || typeof page.totalPages !== 'number' ||
    !Number.isSafeInteger(page.number) || !Number.isSafeInteger(page.totalPages) ||
    page.number !== pageNumber || page.totalPages < pageNumber || page.totalPages > DEFAULT_MAX_PAGES ||
    value.source !== expectedSourceIdentity || !Array.isArray(value.records) ||
    value.records.length > MAX_RECORDS_PER_PAGE) throw refreshFailure();
  const verifiedPage = page as Readonly<{ number: number; totalPages: number }>;
  const records = value.records.map((record) => parseRecord(record, kind));
  return { page: { number: verifiedPage.number, totalPages: verifiedPage.totalPages }, records };
}

function parseRecord(value: unknown, kind: SourceKind): StationWireRecord | SchoolWireRecord | CoordinateWireRecord {
  if (!isObject(value)) throw refreshFailure();
  const idKey = kind === 'station' ? 'stationId' : kind === 'school' ? 'schoolId' : 'buildingId';
  const keys = kind === 'station'
    ? ['stationId', 'name', 'line', 'latitude', 'longitude']
    : kind === 'school'
      ? ['schoolId', 'name', 'latitude', 'longitude']
      : ['buildingId', 'latitude', 'longitude'];
  const coordinateValue = value.latitude === null && value.longitude === null
    ? null
    : coordinate({ latitude: value.latitude, longitude: value.longitude })
      ? { latitude: value.latitude as number, longitude: value.longitude as number }
      : undefined;
  if (!exactKeys(value, keys) || !text(value[idKey]) ||
    (kind !== 'coordinate' && !text(value.name)) || (kind === 'station' && !text(value.line)) ||
    coordinateValue === undefined || (kind !== 'coordinate' && coordinateValue === null)) throw refreshFailure();
  if (kind === 'station') return { stationId: value.stationId as string, name: value.name as string, line: value.line as string, latitude: value.latitude as number, longitude: value.longitude as number };
  if (kind === 'school') return { schoolId: value.schoolId as string, name: value.name as string, latitude: value.latitude as number, longitude: value.longitude as number };
  return { buildingId: value.buildingId as string, coordinate: coordinateValue };
}

function configuredInputSources(
  environment: RefreshEndpointEnvironment,
): Readonly<Record<SourceKind, ConfiguredInputSource>> {
  const station = environment.SEOUL_STATION_ENDPOINT?.trim();
  const school = environment.KOREA_SCHOOL_ENDPOINT?.trim();
  const coordinate = environment.KOREA_BUILDING_COORDINATE_ENDPOINT?.trim();
  if (
    !station || !school || !coordinate
    || station.length > MAX_ENDPOINT_LENGTH
    || school.length > MAX_ENDPOINT_LENGTH
    || coordinate.length > MAX_ENDPOINT_LENGTH
  ) throw new Error('Korea proximity endpoint configuration is incomplete.');
  try {
    for (const endpoint of [station, school, coordinate]) {
      const url = new URL(endpoint);
      if (url.protocol !== 'https:') throw new Error('invalid');
    }
  } catch {
    throw new Error('Korea proximity endpoint configuration is incomplete.');
  }
  const stationIdentity = environment.SEOUL_STATION_SOURCE_IDENTITY;
  const schoolIdentity = environment.KOREA_SCHOOL_SOURCE_IDENTITY;
  const coordinateIdentity = environment.KOREA_BUILDING_COORDINATE_SOURCE_IDENTITY;
  if (
    !text(stationIdentity, MAX_SOURCE_IDENTITY_LENGTH)
    || !text(schoolIdentity, MAX_SOURCE_IDENTITY_LENGTH)
    || !text(coordinateIdentity, MAX_SOURCE_IDENTITY_LENGTH)
  ) throw new Error('Korea proximity source identity configuration is incomplete.');
  return Object.freeze({
    station: Object.freeze({ endpoint: station, sourceIdentity: stationIdentity }),
    school: Object.freeze({ endpoint: school, sourceIdentity: schoolIdentity }),
    coordinate: Object.freeze({ endpoint: coordinate, sourceIdentity: coordinateIdentity }),
  });
}

async function boundedResponseJson(response: Response): Promise<unknown> {
  const advertisedLength = response.headers.get('content-length');
  if (advertisedLength !== null && (
    !/^(?:0|[1-9]\d*)$/.test(advertisedLength)
    || Number(advertisedLength) > MAX_RESPONSE_BYTES
  )) throw new NonRetryableFetchError();
  if (response.body === null) throw new Error('empty response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      byteLength += next.value.byteLength;
      if (byteLength > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new NonRetryableFetchError();
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
}

async function fetchJson(fetcher: typeof fetch, endpoint: string, page: number, signal: AbortSignal): Promise<unknown> {
  const url = new URL(endpoint);
  url.searchParams.set('page', String(page));
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt += 1) {
    try {
      if (signal.aborted) throw new NonRetryableFetchError();
      const response = await fetcher(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]) });
      if (!response.ok && ![408, 425, 429].includes(response.status) && response.status < 500) throw new NonRetryableFetchError();
      if (!response.ok) throw new Error('transient');
      return await boundedResponseJson(response);
    } catch (error) {
      if (error instanceof NonRetryableFetchError) throw refreshFailure();
      if (attempt === FETCH_ATTEMPTS - 1) throw refreshFailure();
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 25 * (attempt + 1)));
    }
  }
  throw refreshFailure();
}

const CREDENTIAL_MARKER = /^(?:token|key|api[-_]?key|apikey|credential|secret|password|access[-_]?token|auth(?:orization)?|client[-_]?secret)$/i;
const CREDENTIAL_PATH_MATERIAL = /^(?:token|key|api[-_]?key|apikey|credential|secret|password|access[-_]?token|auth(?:orization)?|client[-_]?secret)[-_].+$/i;

function decodeUrlComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function endpointSensitiveValues(endpoint: string): readonly string[] {
  const parsed = new URL(endpoint);
  const path = parsed.pathname.split('/').filter(Boolean).map(decodeUrlComponent);
  const values = new Set<string>([endpoint, decodeUrlComponent(endpoint), decodeUrlComponent(parsed.username), decodeUrlComponent(parsed.password)]);
  for (const [key, value] of parsed.searchParams) {
    if (CREDENTIAL_MARKER.test(decodeUrlComponent(key))) values.add(decodeUrlComponent(value));
  }
  for (const [index, component] of path.entries()) {
    if (CREDENTIAL_MARKER.test(component) && path[index + 1] !== undefined) values.add(path[index + 1]);
    if (CREDENTIAL_PATH_MATERIAL.test(component)) values.add(component);
  }
  return [...values].filter(Boolean);
}

async function collect<T>(input: Readonly<{
  kind: SourceKind;
  endpoint: string;
  sourceIdentity: string;
  fetch: typeof fetch;
  maxPages: number;
  signal: AbortSignal;
}>): Promise<readonly T[]> {
  const all: T[] = [];
  const ids = new Set<string>();
  let totalPages: number | undefined;
  for (let page = 1; totalPages === undefined || page <= totalPages; page += 1) {
    if (page > input.maxPages) throw refreshFailure();
    if (input.signal.aborted) throw refreshFailure();
    const parsed = pageEnvelope(
      await fetchJson(input.fetch, input.endpoint, page, input.signal),
      page,
      input.kind,
      input.sourceIdentity,
    );
    if (totalPages === undefined) totalPages = parsed.page.totalPages;
    if (totalPages !== parsed.page.totalPages) throw refreshFailure();
    if (all.length > MAX_SOURCE_RECORDS[input.kind] - parsed.records.length) {
      throw refreshFailure();
    }
    for (const record of parsed.records as T[]) {
      const id = input.kind === 'station'
        ? (record as StationWireRecord).stationId
        : input.kind === 'school'
          ? (record as SchoolWireRecord).schoolId
          : (record as CoordinateWireRecord).buildingId;
      if (ids.has(id)) throw refreshFailure();
      ids.add(id);
      all.push(record);
    }
  }
  if (totalPages === undefined) throw refreshFailure();
  return Object.freeze(all);
}

function parseDescriptor(value: unknown, endpointValues: readonly string[]): Readonly<Record<SourceKind, KoreaProximitySourceProvenance>> {
  if (!isObject(value) || !exactKeys(value, ['descriptorVersion', 'station', 'school', 'coordinate']) || value.descriptorVersion !== 'signedprice-korea-proximity-sources-v1' ||
    !publicProvenance(value.station) || !publicProvenance(value.school) || !publicProvenance(value.coordinate)) throw refreshFailure();
  const sources = { station: value.station, school: value.school, coordinate: value.coordinate } as Record<SourceKind, KoreaProximitySourceProvenance>;
  for (const source of Object.values(sources)) {
    const serialized = JSON.stringify(source);
    for (const endpoint of endpointValues) {
      const sensitive = endpointSensitiveValues(endpoint);
      if (sensitive.some((entry) => serialized.includes(entry))) throw refreshFailure();
    }
  }
  return Object.freeze(sources);
}

function hasInstalledProximityActivation(registry: unknown): boolean {
  return isObject(registry) && Array.isArray(registry.snapshots) && registry.snapshots.some((entry) =>
    isObject(entry) && entry.marketId === 'kr-seoul' && entry.dataset === 'kr-proximity');
}

function periodFromInventory(value: unknown): string {
  if (!isObject(value) || !isObject(value.provenance) || typeof value.provenance.period !== 'string') throw refreshFailure();
  return value.provenance.period;
}

function parseInstalledInventory(value: unknown): VerifiedObservedBuildingArtifact {
  const period = periodFromInventory(value);
  try {
    return parseObservedBuildingArtifact(value, { marketId: 'kr-seoul', period });
  } catch {
    throw refreshFailure();
  }
}

function parsePreviousArtifact(value: unknown): VerifiedKoreaProximityArtifact {
  if (!isObject(value) || !isObject(value.provenance) || typeof value.provenance.period !== 'string' || !Array.isArray(value.records)) throw refreshFailure();
  const ids = value.records.map((record) => isObject(record) ? record.buildingId : undefined);
  if (!ids.every((id): id is string => typeof id === 'string')) throw refreshFailure();
  try {
    return parseKoreaProximityArtifact(value, {
      marketId: 'kr-seoul', period: value.provenance.period, observedBuildingIds: [...ids].sort(compareKoreaProximityText),
    });
  } catch {
    throw refreshFailure();
  }
}

function unchanged(current: VerifiedKoreaProximityArtifact, previous: VerifiedKoreaProximityArtifact): boolean {
  const normalize = (artifact: VerifiedKoreaProximityArtifact) => {
    const { generatedAt: _generatedAt, sha256: _sha256, ...content } = artifact;
    return canonicalKoreaProximityArtifactJson(content);
  };
  return normalize(current) === normalize(previous);
}

async function optionalJson(path: string): Promise<unknown | undefined> {
  try {
    return JSON.parse(gunzipSync(await readFile(path)).toString('utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined;
    throw refreshFailure();
  }
}

async function promoteAtomically(path: string, content: Buffer, fileOps: KoreaProximityBuildOptions['fileOps']): Promise<void> {
  const resolved = resolve(path);
  await mkdir(dirname(resolved), { recursive: true });
  const temporary = `${resolved}.tmp-${process.pid}-${Date.now()}`;
  try {
    await (fileOps?.writeFile ?? writeFile)(temporary, content, { flag: 'wx' });
    await (fileOps?.rename ?? rename)(temporary, resolved);
  } catch {
    await unlink(temporary).catch(() => undefined);
    throw refreshFailure();
  }
}

function defaults(options: KoreaProximityBuildOptions): Readonly<{
  stagingPath: string;
  installedInventoryPath: string;
  sourceDescriptorPath: string;
}> {
  const cwd = process.cwd();
  return {
    stagingPath: resolve(options.stagingPath ?? options.outputPath ?? join(cwd, 'artifacts/korea-proximity/signedprice-korea-proximity-v1.json.gz')),
    installedInventoryPath: resolve(options.installedInventoryPath ?? join(cwd, 'apps/web/data/observed-building-inventory.json.gz')),
    sourceDescriptorPath: resolve(options.sourceDescriptorPath ?? join(cwd, 'config/korea-proximity-public-sources.json')),
  };
}

export async function runKoreaProximityBuild(options: KoreaProximityBuildOptions = {}): Promise<KoreaProximityBuildResult> {
  const resolved = defaults(options);
  const environment = options.environment ?? process.env;
  const configuredSources = configuredInputSources(environment);
  const fetcher = options.fetch ?? fetch;
  const inventorySource = options.installedInventory ?? (() => {
    const registrySource = resolveInstalledSnapshotRegistry();
    return createInstalledSnapshotRepository({ registrySource, resolveObject: resolveInstalledSnapshotObject }).get('kr-seoul', 'kr-building-registry').payload;
  })();
  if (inventorySource === undefined) throw refreshFailure();
  const inventory = parseInstalledInventory(inventorySource);
  const descriptorSource = options.sourceDescriptor ?? await readFile(resolved.sourceDescriptorPath, 'utf8').then(JSON.parse).catch(() => undefined);
  const sources = parseDescriptor(
    descriptorSource,
    Object.values(configuredSources).map(({ endpoint }) => endpoint),
  );
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  if (!Number.isSafeInteger(maxPages) || maxPages <= 0 || maxPages > DEFAULT_MAX_PAGES) throw refreshFailure();

  const controller = new AbortController();
  const collection = Promise.all([
    collect<StationWireRecord>({ kind: 'station', ...configuredSources.station, fetch: fetcher, maxPages, signal: controller.signal }),
    collect<SchoolWireRecord>({ kind: 'school', ...configuredSources.school, fetch: fetcher, maxPages, signal: controller.signal }),
    collect<CoordinateWireRecord>({ kind: 'coordinate', ...configuredSources.coordinate, fetch: fetcher, maxPages, signal: controller.signal }),
  ]);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stationRows: readonly StationWireRecord[];
  let schoolRows: readonly SchoolWireRecord[];
  let coordinateRows: readonly CoordinateWireRecord[];
  try {
    [stationRows, schoolRows, coordinateRows] = await Promise.race([
      collection,
      new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => reject(refreshFailure()), BUILD_TIMEOUT_MS); }),
    ]);
  } catch {
    controller.abort();
    throw refreshFailure();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
  const coordinatesByBuildingId = new Map<string, KoreaProximityCoordinate | null>();
  for (const row of coordinateRows) coordinatesByBuildingId.set(row.buildingId, row.coordinate);
  const observedBuildingIds = inventory.records.map((record) => record.buildingId).sort(compareKoreaProximityText);
  if (coordinatesByBuildingId.size !== observedBuildingIds.length || observedBuildingIds.some((id) => !coordinatesByBuildingId.has(id))) throw refreshFailure();

  const previousSource = options.previousArtifact ?? (() => {
    try {
      const registry = resolveInstalledSnapshotRegistry();
      if (!hasInstalledProximityActivation(registry)) return undefined;
      return createInstalledSnapshotRepository({ registrySource: registry, resolveObject: resolveInstalledSnapshotObject }).get('kr-seoul', 'kr-proximity').payload;
    } catch { throw refreshFailure(); }
  })();
  const previous = previousSource === undefined ? undefined : parsePreviousArtifact(previousSource);
  const stagedSource = await optionalJson(resolved.stagingPath);
  const staged = stagedSource === undefined ? undefined : parsePreviousArtifact(stagedSource);
  try {
    const artifact = buildKoreaProximityArtifact({
      generatedAt: (options.now ?? (() => new Date()))().toISOString(),
      period: inventory.period,
      sources: { station: sources.station, school: sources.school, coordinate: sources.coordinate },
      buildings: observedBuildingIds.map((buildingId) => ({ buildingId, coordinate: coordinatesByBuildingId.get(buildingId) ?? null })),
      stations: stationRows.map((row): KoreaProximityStationSource => ({ sourceId: row.stationId, name: row.name, line: row.line, coordinate: { latitude: row.latitude, longitude: row.longitude } })),
      schools: schoolRows.map((row): KoreaProximitySchoolSource => ({ sourceId: row.schoolId, name: row.name, coordinate: { latitude: row.latitude, longitude: row.longitude } })),
      previousCounts: previous === undefined ? undefined : {
        observedBuildingCount: previous.counts.observedBuildingCount,
        coordinateReadyCount: previous.counts.coordinateReadyCount,
        stationCount: previous.counts.stationCount,
        schoolCount: previous.counts.schoolCount,
      },
    });
    const verified = parseKoreaProximityArtifact(artifact, { marketId: 'kr-seoul', period: inventory.period, observedBuildingIds });
    const { sha256: _sha256, ...unsigned } = verified;
    const expectedDigest = createHash('sha256').update(canonicalKoreaProximityArtifactJson(unsigned)).digest('hex');
    if (expectedDigest !== verified.sha256) throw refreshFailure();
    if (staged !== undefined && unchanged(verified, staged)) {
      return Object.freeze({ changed: false, artifactVersion: verified.artifactVersion, digest: verified.sha256, coordinateReadyCount: verified.counts.coordinateReadyCount, observedBuildingCount: verified.counts.observedBuildingCount, stationCount: verified.counts.stationCount, schoolCount: verified.counts.schoolCount });
    }
    await promoteAtomically(resolved.stagingPath, gzipSync(canonicalKoreaProximityArtifactJson(verified), { level: 9 }), options.fileOps);
    (options.log ?? console.log)(`${verified.artifactVersion} | ${verified.counts.observedBuildingCount} buildings | ${verified.counts.coordinateReadyCount} coordinates | ${verified.counts.stationCount} stations | ${verified.counts.schoolCount} schools | ${verified.sha256}`);
    return Object.freeze({ changed: true, artifactVersion: verified.artifactVersion, digest: verified.sha256, coordinateReadyCount: verified.counts.coordinateReadyCount, observedBuildingCount: verified.counts.observedBuildingCount, stationCount: verified.counts.stationCount, schoolCount: verified.counts.schoolCount });
  } catch {
    throw refreshFailure();
  }
}

async function main(): Promise<void> {
  try {
    const result = await runKoreaProximityBuild();
    if (!result.changed) process.stdout.write('Korea proximity refresh unchanged.\n');
  } catch {
    process.stderr.write('Korea proximity refresh failed.\n');
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) await main();
