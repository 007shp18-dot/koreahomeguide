import 'server-only';

import { createHash } from 'node:crypto';

import {
  getSeoulDistrictBySlug,
  type SeoulDistrictSlug,
} from '@signedprice/korea-rent/browser';

export const PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION =
  'signedprice-public-building-summary-v2' as const;

export type PublicBuildingDeal = 'jeonse' | 'monthly_rent' | 'sale';
export type PublicBuildingHousingType = 'apartment' | 'officetel' | 'villa_multifamily';
export type PublicBuildingFloorMissingReason = 'not_retained_in_v2_snapshot';

export type PublicBuildingDistribution =
  | Readonly<{ n: number; published: false }>
  | Readonly<{
      n: number;
      published: true;
      min: number;
      p25: number;
      med: number;
      p75: number;
      max: number;
      chg3m: number | null;
    }>;

type PublicBuildingRecentContractIdentity = Readonly<{
  filedMonth: string;
  areaSqm: number;
  contractType: 'new' | 'renewal' | 'unknown';
  depositWon: number;
  deal: 'jeonse';
  monthlyRentWon: 0;
}>;

export type PublicBuildingRecentContract = PublicBuildingRecentContractIdentity & (
  | Readonly<{ floor: number; floorMissingReason: null }>
  | Readonly<{
      floor: null;
      floorMissingReason: PublicBuildingFloorMissingReason;
    }>
);

export type PublicBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  name: string;
  housingType: PublicBuildingHousingType;
  latitude: number | null;
  longitude: number | null;
  supportedDeals: readonly ['jeonse'];
  period: string;
  generatedAt: string;
  publicationMinimum: number;
  groups: Readonly<{
    all: PublicBuildingDistribution;
    new: PublicBuildingDistribution;
    renewal: PublicBuildingDistribution;
  }>;
  unknownContractCount: number;
  overall: PublicBuildingDistribution;
  areaBands: readonly Readonly<{
    band: '45–55㎡';
    summary: PublicBuildingDistribution;
  }>[];
  recentContracts: readonly PublicBuildingRecentContract[];
}>;

export type PublicBuildingArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
}>;

export type VerifiedPublicBuildingArtifact = Readonly<{
  artifactVersion: typeof PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  provider: 'MOLIT';
  dataset: 'reported rent contracts';
  rightsPolicyId: 'kr-molit-rent-v1';
  exclusions: readonly string[];
  totalRecordCount: number;
  records: readonly PublicBuildingRecord[];
  sha256: string;
}>;

const ROOT_KEYS = [
  'artifactVersion', 'generatedAt', 'provenance', 'totalRecordCount', 'records', 'sha256',
] as const;
const PROVENANCE_KEYS = [
  'marketId', 'period', 'provider', 'dataset', 'endpointVersion', 'parserVersion',
  'rightsPolicyId', 'sourceComplete', 'displayRights', 'exclusions',
] as const;
const RECORD_KEYS = [
  'buildingId', 'districtSlug', 'neighborhoodId', 'neighborhoodName', 'name',
  'housingType', 'latitude', 'longitude', 'period', 'generatedAt',
  'publicationMinimum', 'groups', 'unknownContractCount', 'areaBands', 'recentContracts',
] as const;
const WITHHELD_DISTRIBUTION_KEYS = ['n', 'published'] as const;
const PUBLISHED_DISTRIBUTION_KEYS = [
  ...WITHHELD_DISTRIBUTION_KEYS, 'min', 'p25', 'med', 'p75', 'max', 'chg3m',
] as const;
const AREA_BAND_KEYS = ['band', 'summary'] as const;
const GROUP_KEYS = ['all', 'new', 'renewal'] as const;
const CONTRACT_KEYS = [
  'filedMonth', 'areaSqm', 'contractType', 'depositWon',
] as const;

const housingTypes = new Set<PublicBuildingHousingType>([
  'apartment', 'officetel', 'villa_multifamily',
]);

function invalidArtifact(): never {
  throw new TypeError('Invalid public building artifact.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && actual.every((key) => expected.includes(key));
}

function isTrimmedText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPeriod(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2})\/(\d{4}-\d{2})$/.exec(value);
  if (match === null) return false;
  const [, start, end] = match;
  if (start === undefined || end === undefined || start > end) return false;
  return isMonth(start) && isMonth(end);
}

function isMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function monthWithinPeriod(month: string, period: string): boolean {
  const [start, end] = period.split('/');
  return start !== undefined && end !== undefined && month >= start && month <= end;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) invalidArtifact();
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(object).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

function validChange(value: unknown): value is number | null {
  return value === null || (
    typeof value === 'number'
    && Number.isFinite(value)
    && value > -100
    && Number.isInteger(value * 10)
  );
}

function parseDistribution(value: unknown, threshold: number): PublicBuildingDistribution {
  if (!isRecord(value) || typeof value.published !== 'boolean') invalidArtifact();
  const keys = value.published ? PUBLISHED_DISTRIBUTION_KEYS : WITHHELD_DISTRIBUTION_KEYS;
  if (!hasExactKeys(value, keys) || !isSafeNonNegativeInteger(value.n)) invalidArtifact();
  if (!value.published) {
    if (value.n >= threshold) invalidArtifact();
    return Object.freeze({ n: value.n, published: false });
  }
  const measures = [value.min, value.p25, value.med, value.p75, value.max];
  if (
    value.n < threshold
    || !measures.every(isSafeNonNegativeInteger)
    || !measures.every((item, index) => index === 0 || (measures[index - 1] as number) <= item)
    || !validChange(value.chg3m)
  ) {
    invalidArtifact();
  }
  return Object.freeze({
    n: value.n,
    published: true,
    min: value.min as number,
    p25: value.p25 as number,
    med: value.med as number,
    p75: value.p75 as number,
    max: value.max as number,
    chg3m: value.chg3m,
  });
}

function parseContract(
  value: unknown,
  period: string,
): PublicBuildingRecentContract {
  if (!isRecord(value) || !hasExactKeys(value, CONTRACT_KEYS)) invalidArtifact();
  if (
    typeof value.filedMonth !== 'string'
    || !isMonth(value.filedMonth)
    || !monthWithinPeriod(value.filedMonth, period)
    || typeof value.areaSqm !== 'number'
    || !Number.isFinite(value.areaSqm)
    || value.areaSqm <= 0
    || !Number.isInteger(value.areaSqm * 10)
    || !['new', 'renewal', 'unknown'].includes(value.contractType as string)
    || !isSafeNonNegativeInteger(value.depositWon)
  ) {
    invalidArtifact();
  }
  return Object.freeze({
    filedMonth: value.filedMonth,
    areaSqm: value.areaSqm,
    contractType: value.contractType as 'new' | 'renewal' | 'unknown',
    depositWon: value.depositWon,
    deal: 'jeonse',
    monthlyRentWon: 0,
    floor: null,
    floorMissingReason: 'not_retained_in_v2_snapshot',
  });
}

function parseCoordinates(latitude: unknown, longitude: unknown): readonly [number | null, number | null] {
  if (latitude === null && longitude === null) return Object.freeze([null, null]);
  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude)
    || typeof longitude !== 'number' || !Number.isFinite(longitude)
    || latitude < 37.4 || latitude > 37.72
    || longitude < 126.75 || longitude > 127.25
  ) invalidArtifact();
  return Object.freeze([latitude, longitude]);
}

function parseRecord(
  value: unknown,
  period: string,
  artifactGeneratedAt: string,
): PublicBuildingRecord {
  if (!isRecord(value) || !hasExactKeys(value, RECORD_KEYS)) invalidArtifact();
  if (
    !isTrimmedText(value.buildingId)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.buildingId)
    || typeof value.districtSlug !== 'string'
    || getSeoulDistrictBySlug(value.districtSlug) === null
    || !isTrimmedText(value.neighborhoodId)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.neighborhoodId)
    || !isTrimmedText(value.neighborhoodName)
    || !isTrimmedText(value.name)
    || typeof value.housingType !== 'string'
    || !housingTypes.has(value.housingType as PublicBuildingHousingType)
    || value.period !== period
    || value.generatedAt !== artifactGeneratedAt
    || !Number.isSafeInteger(value.publicationMinimum)
    || (value.publicationMinimum as number) <= 0
  ) {
    invalidArtifact();
  }
  const publicationMinimum = value.publicationMinimum as number;
  const [latitude, longitude] = parseCoordinates(value.latitude, value.longitude);
  if (!isRecord(value.groups) || !hasExactKeys(value.groups, GROUP_KEYS)) invalidArtifact();
  const groups = Object.freeze({
    all: parseDistribution(value.groups.all, publicationMinimum),
    new: parseDistribution(value.groups.new, publicationMinimum),
    renewal: parseDistribution(value.groups.renewal, publicationMinimum),
  });
  if (
    !isSafeNonNegativeInteger(value.unknownContractCount)
    || groups.all.n !== groups.new.n + groups.renewal.n + value.unknownContractCount
  ) invalidArtifact();
  if (!Array.isArray(value.areaBands)) invalidArtifact();
  const areaBands = Object.freeze(value.areaBands.map((areaBand) => {
    if (
      !isRecord(areaBand)
      || !hasExactKeys(areaBand, AREA_BAND_KEYS)
      || areaBand.band !== '45-55sqm'
    ) {
      invalidArtifact();
    }
    return Object.freeze({
      band: '45–55㎡' as const,
      summary: parseDistribution(areaBand.summary, publicationMinimum),
    });
  }));
  if (new Set(areaBands.map(({ band }) => band)).size !== areaBands.length) invalidArtifact();
  if (!Array.isArray(value.recentContracts)) invalidArtifact();
  const recentContracts = Object.freeze(value.recentContracts.map((contract) => (
    parseContract(contract, period)
  )));
  if (
    recentContracts.some((contract, index) => (
      index > 0 && recentContracts[index - 1]!.filedMonth < contract.filedMonth
    ))
    || recentContracts.length > groups.all.n
  ) {
    invalidArtifact();
  }
  return Object.freeze({
    buildingId: value.buildingId,
    districtSlug: value.districtSlug as SeoulDistrictSlug,
    neighborhoodId: value.neighborhoodId,
    neighborhoodName: value.neighborhoodName,
    name: value.name,
    housingType: value.housingType as PublicBuildingHousingType,
    latitude,
    longitude,
    supportedDeals: Object.freeze(['jeonse'] as const),
    period,
    generatedAt: artifactGeneratedAt,
    publicationMinimum,
    groups,
    unknownContractCount: value.unknownContractCount,
    overall: groups.all,
    areaBands,
    recentContracts,
  });
}

function parseArtifact(
  value: unknown,
  expected: PublicBuildingArtifactExpectation,
): VerifiedPublicBuildingArtifact {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) invalidArtifact();
  if (
    value.artifactVersion !== PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION
    || !isCanonicalInstant(value.generatedAt)
    || !isPeriod(expected.period)
    || !isSafeNonNegativeInteger(value.totalRecordCount)
    || !Array.isArray(value.records)
    || typeof value.sha256 !== 'string'
    || !/^[0-9a-f]{64}$/.test(value.sha256)
  ) {
    invalidArtifact();
  }
  if (!isRecord(value.provenance) || !hasExactKeys(value.provenance, PROVENANCE_KEYS)) {
    invalidArtifact();
  }
  const provenance = value.provenance;
  if (
    provenance.marketId !== expected.marketId
    || provenance.period !== expected.period
    || provenance.provider !== 'MOLIT'
    || provenance.dataset !== 'reported rent contracts'
    || provenance.endpointVersion !== 'v1'
    || provenance.parserVersion !== 'kr-molit-building-parser-v2'
    || provenance.rightsPolicyId !== 'kr-molit-rent-v1'
    || provenance.sourceComplete !== true
    || provenance.displayRights !== true
    || !Array.isArray(provenance.exclusions)
    || !provenance.exclusions.every(isTrimmedText)
    || new Set(provenance.exclusions).size !== provenance.exclusions.length
  ) {
    invalidArtifact();
  }
  const unsigned = { ...value };
  delete unsigned.sha256;
  const digest = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');
  if (digest !== value.sha256) invalidArtifact();
  const records = Object.freeze(value.records.map((record) => (
    parseRecord(record, expected.period, value.generatedAt as string)
  )));
  if (
    value.totalRecordCount !== records.length
    || new Set(records.map(({ buildingId }) => buildingId)).size !== records.length
  ) {
    invalidArtifact();
  }
  return Object.freeze({
    artifactVersion: PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION,
    generatedAt: value.generatedAt as string,
    marketId: expected.marketId,
    period: expected.period,
    provider: 'MOLIT',
    dataset: 'reported rent contracts',
    rightsPolicyId: 'kr-molit-rent-v1',
    exclusions: Object.freeze([...(provenance.exclusions as string[])]),
    totalRecordCount: records.length,
    records,
    sha256: value.sha256,
  });
}

export function parsePublicBuildingSummaryArtifact(
  value: unknown,
  expected: PublicBuildingArtifactExpectation,
): VerifiedPublicBuildingArtifact {
  try {
    return parseArtifact(value, expected);
  } catch {
    invalidArtifact();
  }
}
