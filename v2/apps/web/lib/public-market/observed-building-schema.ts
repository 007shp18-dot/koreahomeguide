import 'server-only';

import { createHash } from 'node:crypto';

import {
  getSeoulDistrictBySlug,
  type SeoulDistrictSlug,
} from '@signedprice/korea-rent/browser';

export const OBSERVED_BUILDING_ARTIFACT_VERSION =
  'signedprice-observed-building-inventory-v1' as const;

export type ObservedBuildingHousingType =
  | 'apartment'
  | 'officetel'
  | 'villa_multifamily'
  | 'detached';

export type ObservedBuildingCoordinate =
  | Readonly<{ state: 'ready'; latitude: number; longitude: number }>
  | Readonly<{ state: 'pending'; reason: 'coordinate_not_resolved' }>;

export type ObservedBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: ObservedBuildingHousingType;
  observationCount: number;
  jeonseObservationCount: number;
  monthlyObservationCount: number;
  firstObservedMonth: string;
  lastObservedMonth: string;
  coordinate: ObservedBuildingCoordinate;
}>;

export type ObservedBuildingStats = Readonly<{
  sourceRecordCount: number;
  observedRecordCount: number;
  observedBuildingCount: number;
  cancelledRecordCount: number;
  missingIdentityRecordCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
}>;

export type ObservedBuildingArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
}>;

export type VerifiedObservedBuildingArtifact = Readonly<{
  artifactVersion: typeof OBSERVED_BUILDING_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  provider: 'MOLIT';
  dataset: 'reported rent contracts';
  rightsPolicyId: 'kr-molit-rent-v1';
  exclusions: readonly string[];
  stats: ObservedBuildingStats;
  records: readonly ObservedBuildingRecord[];
  sha256: string;
}>;

const ROOT_KEYS = ['artifactVersion', 'generatedAt', 'provenance', 'stats', 'records', 'sha256'];
const PROVENANCE_KEYS = [
  'marketId', 'period', 'provider', 'dataset', 'endpointVersion', 'parserVersion',
  'rightsPolicyId', 'sourceComplete', 'displayRights', 'exclusions',
];
const STATS_KEYS = [
  'sourceRecordCount', 'observedRecordCount', 'observedBuildingCount',
  'cancelledRecordCount', 'missingIdentityRecordCount', 'coordinateReadyCount',
  'coordinatePendingCount',
];
const RECORD_KEYS = [
  'buildingId', 'districtSlug', 'neighborhoodId', 'neighborhoodName', 'officialName',
  'housingType', 'observationCount', 'jeonseObservationCount', 'monthlyObservationCount',
  'firstObservedMonth', 'lastObservedMonth', 'coordinate',
];
const housingTypes = new Set<ObservedBuildingHousingType>([
  'apartment', 'officetel', 'villa_multifamily', 'detached',
]);

function invalidArtifact(): never {
  throw new TypeError('Invalid observed building artifact.');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function isMonth(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^\d{4}-(\d{2})$/.exec(value);
  return match !== null && Number(match[1]) >= 1 && Number(match[1]) <= 12;
}

function isPeriod(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2})\/(\d{4}-\d{2})$/.exec(value);
  return match !== null && isMonth(match[1]) && isMonth(match[2]) && match[1]! <= match[2]!;
}

function isInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) invalidArtifact();
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

function parseCoordinate(value: unknown): ObservedBuildingCoordinate {
  if (!isObject(value) || typeof value.state !== 'string') invalidArtifact();
  if (value.state === 'pending') {
    if (!hasExactKeys(value, ['state', 'reason']) || value.reason !== 'coordinate_not_resolved') {
      invalidArtifact();
    }
    return Object.freeze({ state: 'pending', reason: 'coordinate_not_resolved' });
  }
  if (
    value.state !== 'ready'
    || !hasExactKeys(value, ['state', 'latitude', 'longitude'])
    || typeof value.latitude !== 'number' || !Number.isFinite(value.latitude)
    || typeof value.longitude !== 'number' || !Number.isFinite(value.longitude)
    || value.latitude < 37.4 || value.latitude > 37.72
    || value.longitude < 126.75 || value.longitude > 127.25
  ) invalidArtifact();
  return Object.freeze({ state: 'ready', latitude: value.latitude, longitude: value.longitude });
}

function parseStats(value: unknown): ObservedBuildingStats {
  if (!isObject(value) || !hasExactKeys(value, STATS_KEYS) || !STATS_KEYS.every((key) => isCount(value[key]))) {
    invalidArtifact();
  }
  return Object.freeze({
    sourceRecordCount: value.sourceRecordCount as number,
    observedRecordCount: value.observedRecordCount as number,
    observedBuildingCount: value.observedBuildingCount as number,
    cancelledRecordCount: value.cancelledRecordCount as number,
    missingIdentityRecordCount: value.missingIdentityRecordCount as number,
    coordinateReadyCount: value.coordinateReadyCount as number,
    coordinatePendingCount: value.coordinatePendingCount as number,
  });
}

function parseRecord(value: unknown, period: string): ObservedBuildingRecord {
  if (!isObject(value) || !hasExactKeys(value, RECORD_KEYS)) invalidArtifact();
  const [start, end] = period.split('/');
  if (
    !isText(value.buildingId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.buildingId)
    || typeof value.districtSlug !== 'string' || getSeoulDistrictBySlug(value.districtSlug) === null
    || !isText(value.neighborhoodId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.neighborhoodId)
    || !isText(value.neighborhoodName) || !isText(value.officialName)
    || typeof value.housingType !== 'string'
    || !housingTypes.has(value.housingType as ObservedBuildingHousingType)
    || !isCount(value.observationCount) || value.observationCount === 0
    || !isCount(value.jeonseObservationCount) || !isCount(value.monthlyObservationCount)
    || value.jeonseObservationCount + value.monthlyObservationCount > value.observationCount
    || !isMonth(value.firstObservedMonth) || !isMonth(value.lastObservedMonth)
    || value.firstObservedMonth > value.lastObservedMonth
    || value.firstObservedMonth < start! || value.lastObservedMonth > end!
  ) invalidArtifact();
  return Object.freeze({
    buildingId: value.buildingId,
    districtSlug: value.districtSlug as SeoulDistrictSlug,
    neighborhoodId: value.neighborhoodId,
    neighborhoodName: value.neighborhoodName,
    officialName: value.officialName,
    housingType: value.housingType as ObservedBuildingHousingType,
    observationCount: value.observationCount,
    jeonseObservationCount: value.jeonseObservationCount,
    monthlyObservationCount: value.monthlyObservationCount,
    firstObservedMonth: value.firstObservedMonth,
    lastObservedMonth: value.lastObservedMonth,
    coordinate: parseCoordinate(value.coordinate),
  });
}

export function parseObservedBuildingArtifact(
  value: unknown,
  expected: ObservedBuildingArtifactExpectation,
): VerifiedObservedBuildingArtifact {
  try {
    if (!isObject(value) || !hasExactKeys(value, ROOT_KEYS)) invalidArtifact();
    if (
      value.artifactVersion !== OBSERVED_BUILDING_ARTIFACT_VERSION
      || !isInstant(value.generatedAt) || !isPeriod(expected.period)
      || typeof value.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.sha256)
      || !Array.isArray(value.records)
    ) invalidArtifact();
    if (!isObject(value.provenance) || !hasExactKeys(value.provenance, PROVENANCE_KEYS)) invalidArtifact();
    const provenance = value.provenance;
    if (
      provenance.marketId !== expected.marketId || provenance.period !== expected.period
      || provenance.provider !== 'MOLIT' || provenance.dataset !== 'reported rent contracts'
      || provenance.endpointVersion !== 'v1'
      || provenance.parserVersion !== 'kr-molit-building-parser-v2'
      || provenance.rightsPolicyId !== 'kr-molit-rent-v1'
      || provenance.sourceComplete !== true || provenance.displayRights !== true
      || !Array.isArray(provenance.exclusions) || !provenance.exclusions.every(isText)
      || new Set(provenance.exclusions).size !== provenance.exclusions.length
    ) invalidArtifact();
    const unsigned = { ...value };
    delete unsigned.sha256;
    if (createHash('sha256').update(canonicalJson(unsigned)).digest('hex') !== value.sha256) {
      invalidArtifact();
    }
    const stats = parseStats(value.stats);
    const records = Object.freeze(value.records.map((record) => parseRecord(record, expected.period)));
    const observedRecordCount = records.reduce((sum, record) => sum + record.observationCount, 0);
    const readyCount = records.filter(({ coordinate }) => coordinate.state === 'ready').length;
    if (
      new Set(records.map(({ buildingId }) => buildingId)).size !== records.length
      || stats.observedBuildingCount !== records.length
      || stats.observedRecordCount !== observedRecordCount
      || stats.sourceRecordCount !== stats.observedRecordCount
        + stats.cancelledRecordCount + stats.missingIdentityRecordCount
      || stats.coordinateReadyCount !== readyCount
      || stats.coordinatePendingCount !== records.length - readyCount
    ) invalidArtifact();
    return Object.freeze({
      artifactVersion: OBSERVED_BUILDING_ARTIFACT_VERSION,
      generatedAt: value.generatedAt as string,
      marketId: expected.marketId,
      period: expected.period,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      rightsPolicyId: 'kr-molit-rent-v1',
      exclusions: Object.freeze([...(provenance.exclusions as string[])]),
      stats,
      records,
      sha256: value.sha256,
    });
  } catch {
    invalidArtifact();
  }
}
