import {
  buildKoreaBuildingIdentity,
  normalizeKoreaBuildingText,
  type KoreaBuildingHousingType,
} from './building-identity';
import type { SeoulDistrictSlug } from './districts';
import type {
  KoreaPublicBuildingGeocode,
  KoreaPublicBuildingSourceRecord,
} from './public-building-summary';

export type KoreaObservedBuildingCoordinate =
  | Readonly<{
      state: 'ready';
      latitude: number;
      longitude: number;
    }>
  | Readonly<{
      state: 'pending';
      reason: 'coordinate_not_resolved';
    }>;

export type KoreaObservedBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: KoreaBuildingHousingType;
  observationCount: number;
  jeonseObservationCount: number;
  monthlyObservationCount: number;
  firstObservedMonth: string;
  lastObservedMonth: string;
  coordinate: KoreaObservedBuildingCoordinate;
}>;

export type KoreaObservedBuildingInventoryStats = Readonly<{
  sourceRecordCount: number;
  observedRecordCount: number;
  observedBuildingCount: number;
  cancelledRecordCount: number;
  missingIdentityRecordCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
}>;

export type KoreaObservedBuildingInventory = Readonly<{
  marketId: 'kr-seoul';
  period: string;
  generatedAt: string;
  records: readonly KoreaObservedBuildingRecord[];
  stats: KoreaObservedBuildingInventoryStats;
}>;

export type KoreaObservedBuildingInventoryInput = Readonly<{
  period: string;
  generatedAt: string;
  records: readonly KoreaPublicBuildingSourceRecord[];
  geocodes: readonly KoreaPublicBuildingGeocode[];
}>;

function coordinateKey(
  districtSlug: SeoulDistrictSlug,
  neighborhoodName: string,
  buildingName: string,
): string {
  return `${districtSlug}\u0000${neighborhoodName}\u0000${buildingName}`;
}

function assertInput(input: KoreaObservedBuildingInventoryInput): void {
  if (!/^\d{4}-\d{2}\/\d{4}-\d{2}$/.test(input.period)) {
    throw new TypeError('Observed building period is invalid.');
  }
  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime()) || generatedAt.toISOString() !== input.generatedAt) {
    throw new TypeError('Observed building generation time is invalid.');
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
      throw new TypeError('Observed building geocode is outside Seoul.');
    }
  }
}

export function buildKoreaObservedBuildingInventory(
  input: KoreaObservedBuildingInventoryInput,
): KoreaObservedBuildingInventory {
  assertInput(input);

  const coordinates = new Map(input.geocodes.map((geocode) => [
    coordinateKey(
      geocode.districtSlug,
      normalizeKoreaBuildingText(geocode.neighborhoodName),
      normalizeKoreaBuildingText(geocode.buildingName),
    ),
    geocode,
  ] as const));
  const groups = new Map<string, {
    buildingId: string;
    districtSlug: SeoulDistrictSlug;
    neighborhoodId: string;
    neighborhoodName: string;
    officialName: string;
    housingType: KoreaBuildingHousingType;
    observationCount: number;
    jeonseObservationCount: number;
    monthlyObservationCount: number;
    firstObservedMonth: string;
    lastObservedMonth: string;
  }>();
  let cancelledRecordCount = 0;
  let missingIdentityRecordCount = 0;

  for (const source of input.records) {
    if (source.record.recordStatus === 'cancelled') {
      cancelledRecordCount += 1;
      continue;
    }
    const identity = buildKoreaBuildingIdentity({
      districtSlug: source.districtSlug,
      legalDong: source.record.legalDong,
      buildingLabel: source.record.buildingLabel,
      sourceHousingType: source.record.sourceHousingType,
    });
    if (identity === null) {
      missingIdentityRecordCount += 1;
      continue;
    }
    const observedMonth = source.record.contractDate.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(observedMonth)) {
      throw new TypeError('Observed building contract date is invalid.');
    }
    const group = groups.get(identity.buildingId) ?? {
      buildingId: identity.buildingId,
      districtSlug: identity.districtSlug,
      neighborhoodId: identity.neighborhoodId,
      neighborhoodName: identity.neighborhoodName,
      officialName: identity.buildingName,
      housingType: identity.housingType,
      observationCount: 0,
      jeonseObservationCount: 0,
      monthlyObservationCount: 0,
      firstObservedMonth: observedMonth,
      lastObservedMonth: observedMonth,
    };
    group.observationCount += 1;
    if (source.record.monthlyRentWon > 0) group.monthlyObservationCount += 1;
    if (source.record.depositWon > 0 && source.record.monthlyRentWon === 0) {
      group.jeonseObservationCount += 1;
    }
    if (observedMonth < group.firstObservedMonth) group.firstObservedMonth = observedMonth;
    if (observedMonth > group.lastObservedMonth) group.lastObservedMonth = observedMonth;
    groups.set(identity.buildingId, group);
  }

  let coordinateReadyCount = 0;
  let coordinatePendingCount = 0;
  const records = [...groups.values()].map((group): KoreaObservedBuildingRecord => {
    const geocode = coordinates.get(coordinateKey(
      group.districtSlug,
      group.neighborhoodName,
      group.officialName,
    ));
    const coordinate: KoreaObservedBuildingCoordinate = geocode === undefined
      ? Object.freeze({ state: 'pending', reason: 'coordinate_not_resolved' })
      : Object.freeze({
          state: 'ready',
          latitude: geocode.latitude,
          longitude: geocode.longitude,
        });
    if (coordinate.state === 'ready') coordinateReadyCount += 1;
    else coordinatePendingCount += 1;
    return Object.freeze({ ...group, coordinate });
  }).sort((left, right) => (
    left.districtSlug.localeCompare(right.districtSlug)
    || left.neighborhoodName.localeCompare(right.neighborhoodName, 'ko-KR')
    || left.officialName.localeCompare(right.officialName, 'ko-KR')
    || left.buildingId.localeCompare(right.buildingId)
  ));
  const observedRecordCount = records.reduce(
    (total, record) => total + record.observationCount,
    0,
  );
  const stats = Object.freeze({
    sourceRecordCount: input.records.length,
    observedRecordCount,
    observedBuildingCount: records.length,
    cancelledRecordCount,
    missingIdentityRecordCount,
    coordinateReadyCount,
    coordinatePendingCount,
  });

  return Object.freeze({
    marketId: 'kr-seoul',
    period: input.period,
    generatedAt: input.generatedAt,
    records: Object.freeze(records),
    stats,
  });
}
