import type { KoreaRentRecord } from './input';
import type {
  KoreaConversionHousingType,
  VerifiedKoreaConversionAnchor,
  VerifiedKoreaConversionCurve,
} from './conversion-artifact';

export type ConversionPairExclusions = Readonly<{
  cancelled: number;
  invalidMoney: number;
  differentBuildingOrArea: number;
}>;

export type ConversionPairRejections = Readonly<{
  rentDidNotFall: number;
  depositGapTooSmall: number;
  outsideDateWindow: number;
  implausibleRate: number;
}>;

export type DroppedAnchor = Readonly<{
  housingType: KoreaConversionHousingType;
  bandFloorWon: number;
  bandCeilingWon: number | null;
  pairCount: number;
  reason: 'below_minimum_pairs' | 'deposit_not_increasing';
}>;

export type ConversionCurveDiagnostics = Readonly<{
  recordsIn: number;
  recordsUsable: number;
  groupsConsidered: number;
  pairsFormed: number;
  rejections: ConversionPairRejections;
  droppedAnchors: readonly DroppedAnchor[];
  omittedHousingTypes: readonly KoreaConversionHousingType[];
}>;

export type ConversionCurveBuild = Readonly<{
  curves: readonly VerifiedKoreaConversionCurve[];
  eligiblePairCount: number;
  excluded: ConversionPairExclusions;
  diagnostics: ConversionCurveDiagnostics;
}>;

export type ConversionPairOptions = Readonly<{
  minimumPairsPerAnchor: number;
  maximumDaysBetween: number;
  minimumDepositGapWon: number;
  minimumAnnualRate: number;
  maximumAnnualRate: number;
  bandFloorsWon: Readonly<Record<KoreaConversionHousingType, readonly number[]>>;
  maximumGroupSize: number;
}>;

export const DEFAULT_CONVERSION_PAIR_OPTIONS: ConversionPairOptions = Object.freeze({
  minimumPairsPerAnchor: 120,
  maximumDaysBetween: 90,
  minimumDepositGapWon: 10_000_000,
  minimumAnnualRate: 0.005,
  maximumAnnualRate: 0.15,
  maximumGroupSize: 400,
  bandFloorsWon: Object.freeze({
    apartment: Object.freeze([
      0,
      40_000_000,
      75_000_000,
      125_000_000,
      175_000_000,
      250_000_000,
      350_000_000,
      450_000_000,
    ]),
    officetel: Object.freeze([
      0,
      40_000_000,
      62_500_000,
      87_500_000,
      125_000_000,
      175_000_000,
    ]),
  }),
});

const HOUSING_TYPES = Object.freeze([
  'apartment',
  'officetel',
] as const satisfies readonly KoreaConversionHousingType[]);
const DAY_MS = 86_400_000;

type UsableRecord = Readonly<{
  housingType: KoreaConversionHousingType;
  depositWon: number;
  monthlyRentWon: number;
  signedAtMs: number;
}>;

type ConversionPair = Readonly<{
  housingType: KoreaConversionHousingType;
  keyedDepositWon: number;
  annualRate: number;
}>;

function isConversionHousingType(value: string): value is KoreaConversionHousingType {
  return value === 'apartment' || value === 'officetel';
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function nonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function groupKey(record: KoreaRentRecord, housingType: KoreaConversionHousingType): string | null {
  const building = record.buildingLabel?.trim();
  const legalDong = record.legalDong?.trim();
  if (building === undefined || building === '' || legalDong === undefined || legalDong === '') {
    return null;
  }
  if (!positive(record.areaSqm)) return null;
  return [housingType, legalDong, building, record.areaSqm.toFixed(2)].join('\u0000');
}

function median(sorted: readonly number[]): number {
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function bandIndex(depositWon: number, floors: readonly number[]): number {
  let result = 0;
  for (let index = 0; index < floors.length; index += 1) {
    if (depositWon < floors[index]!) break;
    result = index;
  }
  return result;
}

export function buildKoreaConversionCurves(
  records: readonly KoreaRentRecord[],
  options: ConversionPairOptions = DEFAULT_CONVERSION_PAIR_OPTIONS,
): ConversionCurveBuild {
  let cancelled = 0;
  let invalidMoney = 0;
  const groups = new Map<string, UsableRecord[]>();

  for (const record of records) {
    if (record.recordStatus === 'cancelled') {
      cancelled += 1;
      continue;
    }
    if (!isConversionHousingType(record.sourceHousingType)) continue;
    if (!positive(record.depositWon) || !nonNegative(record.monthlyRentWon)) {
      invalidMoney += 1;
      continue;
    }
    const key = groupKey(record, record.sourceHousingType);
    const signedAtMs = new Date(record.contractDate).getTime();
    if (key === null || !Number.isFinite(signedAtMs)) {
      invalidMoney += 1;
      continue;
    }
    const usable = Object.freeze({
      housingType: record.sourceHousingType,
      depositWon: record.depositWon,
      monthlyRentWon: record.monthlyRentWon,
      signedAtMs,
    });
    const group = groups.get(key);
    if (group === undefined) groups.set(key, [usable]);
    else group.push(usable);
  }

  const recordsUsable = [...groups.values()].reduce((sum, group) => sum + group.length, 0);
  const pairs: ConversionPair[] = [];
  let differentBuildingOrArea = 0;
  let rentDidNotFall = 0;
  let depositGapTooSmall = 0;
  let outsideDateWindow = 0;
  let implausibleRate = 0;
  const maximumWindowMs = options.maximumDaysBetween * DAY_MS;

  for (const originalGroup of groups.values()) {
    const group = originalGroup.slice(0, options.maximumGroupSize);
    if (group.length < 2) {
      differentBuildingOrArea += group.length;
      continue;
    }
    let formed = false;
    for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
        const first = group[leftIndex]!;
        const second = group[rightIndex]!;
        const [low, high] = first.depositWon <= second.depositWon
          ? [first, second]
          : [second, first];
        const depositGapWon = high.depositWon - low.depositWon;
        if (depositGapWon < options.minimumDepositGapWon) {
          depositGapTooSmall += 1;
          continue;
        }
        if (Math.abs(first.signedAtMs - second.signedAtMs) > maximumWindowMs) {
          outsideDateWindow += 1;
          continue;
        }
        if (low.monthlyRentWon <= high.monthlyRentWon) {
          rentDidNotFall += 1;
          continue;
        }
        const annualRate = ((low.monthlyRentWon - high.monthlyRentWon) * 12)
          / depositGapWon;
        if (
          annualRate < options.minimumAnnualRate
          || annualRate > options.maximumAnnualRate
        ) {
          implausibleRate += 1;
          continue;
        }
        formed = true;
        pairs.push(Object.freeze({
          housingType: low.housingType,
          keyedDepositWon: low.depositWon,
          annualRate,
        }));
      }
    }
    if (!formed) differentBuildingOrArea += group.length;
  }

  const curves: VerifiedKoreaConversionCurve[] = [];
  const droppedAnchors: DroppedAnchor[] = [];
  const omittedHousingTypes: KoreaConversionHousingType[] = [];
  let eligiblePairCount = 0;

  for (const housingType of HOUSING_TYPES) {
    const floors = options.bandFloorsWon[housingType];
    const buckets = floors.map(() => ({ deposits: [] as number[], rates: [] as number[] }));
    for (const pair of pairs) {
      if (pair.housingType !== housingType) continue;
      const bucket = buckets[bandIndex(pair.keyedDepositWon, floors)]!;
      bucket.deposits.push(pair.keyedDepositWon);
      bucket.rates.push(pair.annualRate);
    }

    const anchors: VerifiedKoreaConversionAnchor[] = [];
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index]!;
      const pairCount = bucket.rates.length;
      const bandFloorWon = floors[index]!;
      const bandCeilingWon = floors[index + 1] ?? null;
      if (pairCount < options.minimumPairsPerAnchor) {
        if (pairCount > 0) {
          droppedAnchors.push(Object.freeze({
            housingType,
            bandFloorWon,
            bandCeilingWon,
            pairCount,
            reason: 'below_minimum_pairs',
          }));
        }
        continue;
      }
      bucket.deposits.sort((left, right) => left - right);
      bucket.rates.sort((left, right) => left - right);
      const depositWon = Math.round(median(bucket.deposits));
      const annualRate = Number(median(bucket.rates).toFixed(4));
      if (anchors.at(-1) !== undefined && depositWon <= anchors.at(-1)!.depositWon) {
        droppedAnchors.push(Object.freeze({
          housingType,
          bandFloorWon,
          bandCeilingWon,
          pairCount,
          reason: 'deposit_not_increasing',
        }));
        continue;
      }
      anchors.push(Object.freeze({ depositWon, annualRate, pairCount }));
    }

    if (anchors.length < 2) {
      omittedHousingTypes.push(housingType);
      continue;
    }
    eligiblePairCount += anchors.reduce((sum, anchor) => sum + anchor.pairCount, 0);
    curves.push(Object.freeze({
      housingType,
      observedMinDepositWon: anchors[0]!.depositWon,
      observedMaxDepositWon: anchors.at(-1)!.depositWon,
      anchors: Object.freeze(anchors),
    }));
  }

  return Object.freeze({
    curves: Object.freeze(curves),
    eligiblePairCount,
    excluded: Object.freeze({ cancelled, invalidMoney, differentBuildingOrArea }),
    diagnostics: Object.freeze({
      recordsIn: records.length,
      recordsUsable,
      groupsConsidered: groups.size,
      pairsFormed: pairs.length,
      rejections: Object.freeze({
        rentDidNotFall,
        depositGapTooSmall,
        outsideDateWindow,
        implausibleRate,
      }),
      droppedAnchors: Object.freeze(droppedAnchors),
      omittedHousingTypes: Object.freeze(omittedHousingTypes),
    }),
  });
}
