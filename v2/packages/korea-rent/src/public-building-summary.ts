import { median, percentile, roundWon } from '@signedprice/market-core';

import type { KoreaRentRecord } from './input';
import type { SeoulDistrictSlug } from './districts';

const PUBLICATION_MINIMUM = 5;
const RECENT_CONTRACT_LIMIT = 10;

export type KoreaPublicBuildingDistribution =
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

export type KoreaPublicBuildingHousingType =
  | 'apartment'
  | 'officetel'
  | 'villa_multifamily';

export type KoreaPublicBuildingSourceRecord = Readonly<{
  districtSlug: SeoulDistrictSlug;
  record: KoreaRentRecord;
}>;

export type KoreaPublicBuildingGeocode = Readonly<{
  districtSlug: SeoulDistrictSlug;
  neighborhoodName: string;
  buildingName: string;
  latitude: number;
  longitude: number;
}>;

export type KoreaPublicBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  housingType: KoreaPublicBuildingHousingType;
  period: string;
  generatedAt: string;
  publicationMinimum: typeof PUBLICATION_MINIMUM;
  groups: Readonly<{
    all: KoreaPublicBuildingDistribution;
    new: KoreaPublicBuildingDistribution;
    renewal: KoreaPublicBuildingDistribution;
  }>;
  unknownContractCount: number;
  areaBands: readonly Readonly<{
    band: '45-55sqm';
    summary: KoreaPublicBuildingDistribution;
  }>[];
  recentContracts: readonly Readonly<{
    filedMonth: string;
    areaSqm: number;
    deal: 'jeonse';
    depositWon: number;
    monthlyRentWon: 0;
    contractType: 'new' | 'renewal' | 'unknown';
  }>[];
}>;

export type KoreaPublicBuildingSummaryInput = Readonly<{
  period: string;
  generatedAt: string;
  records: readonly KoreaPublicBuildingSourceRecord[];
  geocodes: readonly KoreaPublicBuildingGeocode[];
}>;

function normalizeText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function supportedHousingType(
  value: KoreaRentRecord['sourceHousingType'],
): KoreaPublicBuildingHousingType | null {
  if (value === 'apartment' || value === 'officetel') return value;
  if (value === 'villa') return 'villa_multifamily';
  return null;
}

function eligible(record: KoreaRentRecord): boolean {
  return record.recordStatus !== 'cancelled'
    && record.depositWon > 0
    && record.monthlyRentWon === 0
    && record.areaSqm >= 45
    && record.areaSqm <= 55;
}

function change3m(records: readonly KoreaRentRecord[], period: string): number | null {
  const [start, end] = period.split('/');
  if (start === undefined || end === undefined) return null;
  const [endYear, endMonth] = end.split('-').map(Number);
  if (!Number.isInteger(endYear) || !Number.isInteger(endMonth)) return null;
  const monthKey = (offset: number) => {
    const instant = new Date(Date.UTC(endYear!, endMonth! - 1 - offset, 1));
    return `${instant.getUTCFullYear()}-${String(instant.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  const latest = new Set([monthKey(0), monthKey(1), monthKey(2)]);
  const preceding = new Set([monthKey(3), monthKey(4), monthKey(5)]);
  const latestValues = records
    .filter((record) => latest.has(record.contractDate.slice(0, 7)))
    .map((record) => record.depositWon);
  const precedingValues = records
    .filter((record) => preceding.has(record.contractDate.slice(0, 7)))
    .map((record) => record.depositWon);
  if (latestValues.length < PUBLICATION_MINIMUM || precedingValues.length < PUBLICATION_MINIMUM) {
    return null;
  }
  const before = median(precedingValues);
  return before === 0
    ? null
    : Math.round(((median(latestValues) - before) / before) * 1_000) / 10;
}

function distribution(
  records: readonly KoreaRentRecord[],
  period: string,
): KoreaPublicBuildingDistribution {
  const values = records.map((record) => record.depositWon);
  if (values.length < PUBLICATION_MINIMUM) {
    return Object.freeze({ n: values.length, published: false });
  }
  return Object.freeze({
    n: values.length,
    published: true,
    min: roundWon(Math.min(...values)),
    p25: roundWon(percentile(values, 0.25)),
    med: roundWon(median(values)),
    p75: roundWon(percentile(values, 0.75)),
    max: roundWon(Math.max(...values)),
    chg3m: change3m(records, period),
  });
}

function identityKey(
  districtSlug: SeoulDistrictSlug,
  neighborhoodName: string,
  buildingName: string,
  housingType: KoreaPublicBuildingHousingType,
): string {
  return `${districtSlug}\u0000${neighborhoodName}\u0000${buildingName}\u0000${housingType}`;
}

function assertInput(input: KoreaPublicBuildingSummaryInput): void {
  if (!/^\d{4}-\d{2}\/\d{4}-\d{2}$/.test(input.period)) {
    throw new TypeError('Public building period is invalid.');
  }
  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime()) || generatedAt.toISOString() !== input.generatedAt) {
    throw new TypeError('Public building generation time is invalid.');
  }
  for (const geocode of input.geocodes) {
    if (
      !Number.isFinite(geocode.latitude)
      || !Number.isFinite(geocode.longitude)
      || geocode.latitude < 37.4
      || geocode.latitude > 37.72
      || geocode.longitude < 126.75
      || geocode.longitude > 127.25
    ) {
      throw new TypeError('Public building geocode is outside Seoul.');
    }
  }
}

export function buildKoreaPublicBuildingSummaries(
  input: KoreaPublicBuildingSummaryInput,
): readonly KoreaPublicBuildingRecord[] {
  assertInput(input);
  const geocodes = new Map(input.geocodes.map((geocode) => {
    const neighborhoodName = normalizeText(geocode.neighborhoodName);
    const buildingName = normalizeText(geocode.buildingName);
    return [
      `${geocode.districtSlug}\u0000${neighborhoodName}\u0000${buildingName}`,
      geocode,
    ] as const;
  }));
  const groups = new Map<string, {
    districtSlug: SeoulDistrictSlug;
    neighborhoodName: string;
    buildingName: string;
    housingType: KoreaPublicBuildingHousingType;
    records: KoreaRentRecord[];
  }>();

  for (const source of input.records) {
    const housingType = supportedHousingType(source.record.sourceHousingType);
    const rawBuildingName = source.record.buildingLabel;
    const rawNeighborhoodName = source.record.legalDong;
    if (housingType === null || rawBuildingName === undefined || rawNeighborhoodName === undefined) {
      continue;
    }
    const buildingName = normalizeText(rawBuildingName);
    const neighborhoodName = normalizeText(rawNeighborhoodName);
    if (buildingName === '' || neighborhoodName === '') continue;
    const key = identityKey(source.districtSlug, neighborhoodName, buildingName, housingType);
    const group = groups.get(key) ?? {
      districtSlug: source.districtSlug,
      neighborhoodName,
      buildingName,
      housingType,
      records: [],
    };
    group.records.push(source.record);
    groups.set(key, group);
  }

  const records = [...groups.values()].flatMap((group) => {
    const all = group.records.filter(eligible);
    if (all.length === 0) return [];
    const fresh = all.filter((record) => record.contractType === 'new');
    const renewal = all.filter((record) => record.contractType === 'renewal');
    const unknownContractCount = all.filter((record) => record.contractType === 'unknown').length;
    const geocode = geocodes.get(
      `${group.districtSlug}\u0000${group.neighborhoodName}\u0000${group.buildingName}`,
    );
    const neighborhoodId = `${group.districtSlug}-dong-${stableHash(group.neighborhoodName)}`;
    const buildingId = `${group.districtSlug}-${stableHash(
      `${group.neighborhoodName}\u0000${group.buildingName}\u0000${group.housingType}`,
    )}`;
    const allDistribution = distribution(all, input.period);
    return [Object.freeze({
      buildingId,
      districtSlug: group.districtSlug,
      neighborhoodId,
      neighborhoodName: group.neighborhoodName,
      name: group.buildingName,
      latitude: geocode?.latitude ?? null,
      longitude: geocode?.longitude ?? null,
      housingType: group.housingType,
      period: input.period,
      generatedAt: input.generatedAt,
      publicationMinimum: PUBLICATION_MINIMUM,
      groups: Object.freeze({
        all: allDistribution,
        new: distribution(fresh, input.period),
        renewal: distribution(renewal, input.period),
      }),
      unknownContractCount,
      areaBands: Object.freeze([Object.freeze({
        band: '45-55sqm' as const,
        summary: allDistribution,
      })]),
      recentContracts: Object.freeze([...all]
        .sort((left, right) => (
          right.contractDate.localeCompare(left.contractDate)
          || right.depositWon - left.depositWon
        ))
        .slice(0, RECENT_CONTRACT_LIMIT)
        .map((record) => Object.freeze({
          filedMonth: record.contractDate.slice(0, 7),
          areaSqm: Math.round(record.areaSqm * 10) / 10,
          deal: 'jeonse' as const,
          depositWon: record.depositWon,
          monthlyRentWon: 0 as const,
          contractType: record.contractType,
        }))),
    })];
  });

  return Object.freeze(records.sort((left, right) => (
    left.districtSlug.localeCompare(right.districtSlug)
    || left.neighborhoodName.localeCompare(right.neighborhoodName, 'ko-KR')
    || left.name.localeCompare(right.name, 'ko-KR')
    || left.buildingId.localeCompare(right.buildingId)
  )));
}
