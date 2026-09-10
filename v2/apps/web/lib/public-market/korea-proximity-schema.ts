import 'server-only';

import { createHash } from 'node:crypto';

import {
  KOREA_PROXIMITY_ARTIFACT_VERSION,
  KOREA_PROXIMITY_BUCKETS_METERS,
  KOREA_PROXIMITY_LIMIT_METERS,
  KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE,
  KOREA_STATION_MERGE_RADIUS_METERS,
  canonicalKoreaProximityArtifactJson,
  compareKoreaProximityMatches,
  compareKoreaProximityText,
  koreaProximityBucketMeters,
  type KoreaProximityArtifact,
  type KoreaProximityNearestSchool,
  type KoreaProximityNearestStation,
  type KoreaProximityRecord,
  type KoreaProximitySchoolCatalogRecord,
  type KoreaProximitySchoolMatch,
  type KoreaProximitySourceProvenance,
  type KoreaProximityStationCatalogRecord,
  type KoreaProximityStationMatch,
} from '@signedprice/korea-rent';

export type KoreaProximityArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
  observedBuildingIds: readonly string[];
}>;

export type VerifiedKoreaProximityArtifact = KoreaProximityArtifact;

const ROOT_KEYS = ['artifactVersion', 'generatedAt', 'provenance', 'counts', 'coverage', 'stations', 'schools', 'records', 'sha256'];
const PROVENANCE_KEYS = ['marketId', 'period', 'stationSource', 'schoolSource', 'coordinateSource', 'methodology'];
const SOURCE_KEYS = ['landingPage', 'sourceVersion', 'asOf'];
const METHODOLOGY_KEYS = ['distance', 'nearbyLimitMeters', 'bucketsMeters', 'stationMergeRadiusMeters'];
const COUNT_KEYS = ['observedBuildingCount', 'coordinateReadyCount', 'pendingCoordinateCount', 'stationCount', 'schoolCount', 'stationMatchedBuildingCount', 'schoolMatchedBuildingCount'];
const COVERAGE_KEYS = ['coordinateRatio', 'minimumReleaseRatio'];
const READY_KEYS = ['buildingId', 'status', 'nearestStation', 'nearestSchool', 'stations', 'schools'];
const PENDING_KEYS = ['buildingId', 'status'];
const STATION_KEYS = ['sourceId', 'name', 'lines', 'distanceMeters', 'bucketMeters'];
const SCHOOL_KEYS = ['sourceId', 'name', 'distanceMeters', 'bucketMeters'];
const STATION_CATALOG_KEYS = ['sourceId', 'name', 'lines'];
const SCHOOL_CATALOG_KEYS = ['sourceId', 'name'];

function invalidArtifact(): never {
  throw new TypeError('Invalid Korea proximity artifact.');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function isMonth(value: string): boolean {
  const match = /^\d{4}-(\d{2})$/.exec(value);
  return match !== null && Number(match[1]) >= 1 && Number(match[1]) <= 12;
}

function isPeriod(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2})\/(\d{4}-\d{2})$/.exec(value);
  return match !== null && isMonth(match[1]!) && isMonth(match[2]!) && match[1]! <= match[2]!;
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseSource(value: unknown): KoreaProximitySourceProvenance {
  if (!isObject(value) || !hasExactKeys(value, SOURCE_KEYS)) invalidArtifact();
  if (!isText(value.landingPage) || !isText(value.sourceVersion) || !isDate(value.asOf)) invalidArtifact();
  let url: URL;
  try {
    url = new URL(value.landingPage);
  } catch {
    invalidArtifact();
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    invalidArtifact();
  }
  return {
    landingPage: value.landingPage,
    sourceVersion: value.sourceVersion,
    asOf: value.asOf,
  };
}

function parseMatch(value: unknown, kind: 'station', nearby: true): KoreaProximityStationMatch;
function parseMatch(value: unknown, kind: 'station', nearby: false): KoreaProximityNearestStation;
function parseMatch(value: unknown, kind: 'school', nearby: true): KoreaProximitySchoolMatch;
function parseMatch(value: unknown, kind: 'school', nearby: false): KoreaProximityNearestSchool;
function parseMatch(
  value: unknown,
  kind: 'station' | 'school',
  nearby: boolean,
): KoreaProximityNearestStation | KoreaProximityNearestSchool {
  const keys = kind === 'station' ? STATION_KEYS : SCHOOL_KEYS;
  if (!isObject(value) || !hasExactKeys(value, keys)) invalidArtifact();
  if (
    !isText(value.sourceId) || !isText(value.name) ||
    typeof value.distanceMeters !== 'number' || !Number.isFinite(value.distanceMeters) ||
    value.distanceMeters < 0 ||
    koreaProximityBucketMeters(value.distanceMeters) !== value.bucketMeters ||
    (nearby && value.distanceMeters > KOREA_PROXIMITY_LIMIT_METERS)
  ) invalidArtifact();
  if (kind === 'station') {
    if (
      !Array.isArray(value.lines) || value.lines.length === 0 || !value.lines.every(isText) ||
      new Set(value.lines).size !== value.lines.length
    ) invalidArtifact();
    const lines = value.lines as string[];
    if ([...lines].sort().some((line, index) => line !== lines[index])) invalidArtifact();
    return {
      sourceId: value.sourceId,
      name: value.name,
      lines: Object.freeze([...lines]),
      distanceMeters: value.distanceMeters,
      bucketMeters: value.bucketMeters as KoreaProximityNearestStation['bucketMeters'],
    };
  }
  return {
    sourceId: value.sourceId,
    name: value.name,
    distanceMeters: value.distanceMeters,
    bucketMeters: value.bucketMeters as KoreaProximityNearestSchool['bucketMeters'],
  };
}

function sortedMatches<T extends { distanceMeters: number; name: string; sourceId: string }>(values: readonly T[]): boolean {
  return values.every((value, index) => {
    if (index === 0) return true;
    return compareKoreaProximityMatches(values[index - 1]!, value) < 0;
  });
}

function parseRecord(value: unknown): KoreaProximityRecord {
  if (!isObject(value) || !isText(value.buildingId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.buildingId)) {
    invalidArtifact();
  }
  if (value.status === 'pending_coordinate') {
    if (!hasExactKeys(value, PENDING_KEYS)) invalidArtifact();
    return Object.freeze({ buildingId: value.buildingId, status: 'pending_coordinate' });
  }
  if (value.status !== 'ready' || !hasExactKeys(value, READY_KEYS) || !Array.isArray(value.stations) || !Array.isArray(value.schools)) {
    invalidArtifact();
  }
  const stations = value.stations.map((match) => parseMatch(match, 'station', true));
  const schools = value.schools.map((match) => parseMatch(match, 'school', true));
  if (
    !sortedMatches(stations) || !sortedMatches(schools) ||
    new Set(stations.map((match) => match.sourceId)).size !== stations.length ||
    new Set(schools.map((match) => match.sourceId)).size !== schools.length
  ) invalidArtifact();
  const nearestStation = value.nearestStation === null ? null : parseMatch(value.nearestStation, 'station', false);
  const nearestSchool = value.nearestSchool === null ? null : parseMatch(value.nearestSchool, 'school', false);
  if (
    (stations.length > 0 && JSON.stringify(nearestStation) !== JSON.stringify(stations[0])) ||
    (schools.length > 0 && JSON.stringify(nearestSchool) !== JSON.stringify(schools[0])) ||
    (stations.length === 0 && nearestStation !== null && nearestStation.bucketMeters !== null) ||
    (schools.length === 0 && nearestSchool !== null && nearestSchool.bucketMeters !== null)
  ) invalidArtifact();
  return Object.freeze({
    buildingId: value.buildingId,
    status: 'ready',
    nearestStation: nearestStation === null ? null : Object.freeze(nearestStation),
    nearestSchool: nearestSchool === null ? null : Object.freeze(nearestSchool),
    stations: Object.freeze(stations.map((station) => Object.freeze(station))),
    schools: Object.freeze(schools.map((school) => Object.freeze(school))),
  });
}

function parseStationCatalog(value: unknown): KoreaProximityStationCatalogRecord {
  if (!isObject(value) || !hasExactKeys(value, STATION_CATALOG_KEYS) ||
    !isText(value.sourceId) || !isText(value.name) || !Array.isArray(value.lines) ||
    value.lines.length === 0 || !value.lines.every(isText)) invalidArtifact();
  const lines = value.lines as string[];
  if (new Set(lines).size !== lines.length || [...lines].sort().some((line, index) => line !== lines[index])) {
    invalidArtifact();
  }
  return Object.freeze({ sourceId: value.sourceId, name: value.name, lines: Object.freeze([...lines]) });
}

function parseSchoolCatalog(value: unknown): KoreaProximitySchoolCatalogRecord {
  if (!isObject(value) || !hasExactKeys(value, SCHOOL_CATALOG_KEYS) ||
    !isText(value.sourceId) || !isText(value.name)) invalidArtifact();
  return Object.freeze({ sourceId: value.sourceId, name: value.name });
}

function isCatalogSorted<T extends { sourceId: string }>(records: readonly T[]): boolean {
  return records.every((record, index) => index === 0 ||
    compareKoreaProximityText(records[index - 1]!.sourceId, record.sourceId) < 0);
}

function stationReferenceMatches(
  match: KoreaProximityNearestStation,
  catalog: KoreaProximityStationCatalogRecord,
): boolean {
  return match.name === catalog.name && JSON.stringify(match.lines) === JSON.stringify(catalog.lines);
}

function schoolReferenceMatches(
  match: KoreaProximityNearestSchool,
  catalog: KoreaProximitySchoolCatalogRecord,
): boolean {
  return match.name === catalog.name;
}

export function parseKoreaProximityArtifact(
  value: unknown,
  expected: KoreaProximityArtifactExpectation,
): VerifiedKoreaProximityArtifact {
  try {
    if (!isObject(value) || !hasExactKeys(value, ROOT_KEYS) || !isPeriod(expected.period) ||
      !Array.isArray(expected.observedBuildingIds)) invalidArtifact();
    const observedBuildingIds = [...expected.observedBuildingIds];
    if (observedBuildingIds.some((buildingId) => !isText(buildingId) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(buildingId)) ||
      observedBuildingIds.some((buildingId, index) => index > 0 &&
        compareKoreaProximityText(observedBuildingIds[index - 1]!, buildingId) >= 0)) invalidArtifact();
    if (
      value.artifactVersion !== KOREA_PROXIMITY_ARTIFACT_VERSION || !isInstant(value.generatedAt) ||
      typeof value.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.sha256) || !Array.isArray(value.records) ||
      !isObject(value.provenance) || !hasExactKeys(value.provenance, PROVENANCE_KEYS) ||
      value.provenance.marketId !== expected.marketId || value.provenance.period !== expected.period
    ) invalidArtifact();
    const unsigned = { ...value };
    delete unsigned.sha256;
    const digest = createHash('sha256').update(canonicalKoreaProximityArtifactJson(unsigned)).digest('hex');
    if (digest !== value.sha256) invalidArtifact();

    const provenance = value.provenance;
    if (!isObject(provenance.methodology) || !hasExactKeys(provenance.methodology, METHODOLOGY_KEYS)) invalidArtifact();
    if (
      provenance.methodology.distance !== 'WGS84 Haversine straight-line metres' ||
      provenance.methodology.nearbyLimitMeters !== KOREA_PROXIMITY_LIMIT_METERS ||
      provenance.methodology.stationMergeRadiusMeters !== KOREA_STATION_MERGE_RADIUS_METERS ||
      !Array.isArray(provenance.methodology.bucketsMeters) ||
      JSON.stringify(provenance.methodology.bucketsMeters) !== JSON.stringify(KOREA_PROXIMITY_BUCKETS_METERS)
    ) invalidArtifact();
    const stationSource = parseSource(provenance.stationSource);
    const schoolSource = parseSource(provenance.schoolSource);
    const coordinateSource = parseSource(provenance.coordinateSource);

    if (!Array.isArray(value.stations) || !Array.isArray(value.schools)) invalidArtifact();
    const stationsCatalog = value.stations.map(parseStationCatalog);
    const schoolsCatalog = value.schools.map(parseSchoolCatalog);
    if (!isCatalogSorted(stationsCatalog) || !isCatalogSorted(schoolsCatalog)) invalidArtifact();
    const stationsById = new Map(stationsCatalog.map((station) => [station.sourceId, station]));
    const schoolsById = new Map(schoolsCatalog.map((school) => [school.sourceId, school]));

    if (!isObject(value.counts) || !hasExactKeys(value.counts, COUNT_KEYS) || !COUNT_KEYS.every((key) => isCount((value.counts as Record<string, unknown>)[key]))) invalidArtifact();
    if (
      !isObject(value.coverage) || !hasExactKeys(value.coverage, COVERAGE_KEYS) ||
      typeof value.coverage.coordinateRatio !== 'number' || !Number.isFinite(value.coverage.coordinateRatio) ||
      typeof value.coverage.minimumReleaseRatio !== 'number' || !Number.isFinite(value.coverage.minimumReleaseRatio) ||
      value.coverage.minimumReleaseRatio <= 0 || value.coverage.minimumReleaseRatio > 1
    ) invalidArtifact();
    const records = value.records.map(parseRecord);
    const recordBuildingIds = records.map((record) => record.buildingId);
    if (JSON.stringify(recordBuildingIds) !== JSON.stringify(observedBuildingIds)) invalidArtifact();
    const ready = records.filter((record) => record.status === 'ready');
    const pending = records.length - ready.length;
    for (const record of ready) {
      if (record.nearestStation === null || record.nearestSchool === null) invalidArtifact();
      const stationReferences = [record.nearestStation, ...record.stations];
      const schoolReferences = [record.nearestSchool, ...record.schools];
      if (stationReferences.some((match) => {
        const catalog = stationsById.get(match.sourceId);
        return catalog === undefined || !stationReferenceMatches(match, catalog);
      }) || schoolReferences.some((match) => {
        const catalog = schoolsById.get(match.sourceId);
        return catalog === undefined || !schoolReferenceMatches(match, catalog);
      })) invalidArtifact();
    }
    const counts = {
      observedBuildingCount: value.counts.observedBuildingCount as number,
      coordinateReadyCount: value.counts.coordinateReadyCount as number,
      pendingCoordinateCount: value.counts.pendingCoordinateCount as number,
      stationCount: value.counts.stationCount as number,
      schoolCount: value.counts.schoolCount as number,
      stationMatchedBuildingCount: value.counts.stationMatchedBuildingCount as number,
      schoolMatchedBuildingCount: value.counts.schoolMatchedBuildingCount as number,
    };
    if (
      counts.observedBuildingCount !== records.length || counts.coordinateReadyCount !== ready.length ||
      counts.pendingCoordinateCount !== pending || counts.stationCount !== stationsCatalog.length || counts.schoolCount !== schoolsCatalog.length ||
      counts.observedBuildingCount === 0 || counts.stationCount === 0 || counts.schoolCount === 0 ||
      counts.stationMatchedBuildingCount !== ready.filter((record) => record.stations.length > 0).length ||
      counts.schoolMatchedBuildingCount !== ready.filter((record) => record.schools.length > 0).length ||
      value.coverage.coordinateRatio !== (records.length === 0 ? 0 : ready.length / records.length) ||
      value.coverage.coordinateRatio < value.coverage.minimumReleaseRatio ||
      value.coverage.minimumReleaseRatio !== KOREA_PROXIMITY_MINIMUM_COORDINATE_COVERAGE
    ) invalidArtifact();

    return Object.freeze({
      artifactVersion: KOREA_PROXIMITY_ARTIFACT_VERSION,
      generatedAt: value.generatedAt,
      provenance: Object.freeze({
        marketId: expected.marketId,
        period: expected.period,
        stationSource: Object.freeze(stationSource),
        schoolSource: Object.freeze(schoolSource),
        coordinateSource: Object.freeze(coordinateSource),
        methodology: Object.freeze({
          distance: 'WGS84 Haversine straight-line metres',
          nearbyLimitMeters: 1_000,
          bucketsMeters: KOREA_PROXIMITY_BUCKETS_METERS,
          stationMergeRadiusMeters: 75,
        }),
      }),
      counts: Object.freeze({
        observedBuildingCount: counts.observedBuildingCount,
        coordinateReadyCount: counts.coordinateReadyCount,
        pendingCoordinateCount: counts.pendingCoordinateCount,
        stationCount: counts.stationCount,
        schoolCount: counts.schoolCount,
        stationMatchedBuildingCount: counts.stationMatchedBuildingCount,
        schoolMatchedBuildingCount: counts.schoolMatchedBuildingCount,
      }),
      coverage: Object.freeze({
        coordinateRatio: value.coverage.coordinateRatio,
        minimumReleaseRatio: value.coverage.minimumReleaseRatio,
      }),
      stations: Object.freeze(stationsCatalog),
      schools: Object.freeze(schoolsCatalog),
      records: Object.freeze(records),
      sha256: value.sha256,
    });
  } catch {
    invalidArtifact();
  }
}
