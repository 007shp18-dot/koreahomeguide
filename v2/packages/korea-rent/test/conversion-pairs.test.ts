import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CONVERSION_PAIR_OPTIONS,
  buildKoreaConversionCurves,
  type ConversionPairOptions,
} from '../src/conversion-pairs';
import type { KoreaRentRecord } from '../src/input';

const options: ConversionPairOptions = {
  ...DEFAULT_CONVERSION_PAIR_OPTIONS,
  minimumPairsPerAnchor: 2,
};

function record(
  input: Partial<KoreaRentRecord>
    & Pick<KoreaRentRecord, 'depositWon' | 'monthlyRentWon'>,
): KoreaRentRecord {
  return {
    contractType: 'new',
    contractDate: '2026-03-10',
    areaSqm: 84.97,
    buildingLabel: '성산시영',
    legalDong: '성산동',
    sourceHousingType: 'apartment',
    recordStatus: 'active',
    ...input,
  } as KoreaRentRecord;
}

function pairsAt(input: Readonly<{
  count: number;
  depositWon: number;
  annualRate: number;
  prefix: string;
  housingType?: 'apartment' | 'officetel';
}>): KoreaRentRecord[] {
  const gap = 240_000_000;
  const monthlyRentWon = (input.annualRate * gap) / 12;
  return Array.from({ length: input.count }, (_, index) => {
    const buildingLabel = `${input.prefix}-${index}`;
    const common = {
      buildingLabel,
      sourceHousingType: input.housingType ?? 'apartment',
    } as const;
    return [
      record({ ...common, depositWon: input.depositWon, monthlyRentWon }),
      record({ ...common, depositWon: input.depositWon + gap, monthlyRentWon: 0 }),
    ];
  }).flat();
}

describe('buildKoreaConversionCurves', () => {
  it('measures annual rates from same-building, same-area filed pairs', () => {
    const build = buildKoreaConversionCurves([
      ...pairsAt({ count: 3, depositWon: 60_000_000, annualRate: 0.05, prefix: 'L' }),
      ...pairsAt({ count: 3, depositWon: 200_000_000, annualRate: 0.045, prefix: 'H' }),
    ], options);

    expect(build.curves).toEqual([{
      housingType: 'apartment',
      observedMinDepositWon: 60_000_000,
      observedMaxDepositWon: 200_000_000,
      anchors: [
        { depositWon: 60_000_000, annualRate: 0.05, pairCount: 3 },
        { depositWon: 200_000_000, annualRate: 0.045, pairCount: 3 },
      ],
    }]);
    expect(build.eligiblePairCount).toBe(6);
  });

  it('never manufactures a pair across filed areas', () => {
    const build = buildKoreaConversionCurves([
      record({ areaSqm: 84.97, depositWon: 60_000_000, monthlyRentWon: 1_000_000 }),
      record({ areaSqm: 59.94, depositWon: 300_000_000, monthlyRentWon: 0 }),
    ], options);

    expect(build.curves).toEqual([]);
    expect(build.excluded.differentBuildingOrArea).toBe(2);
  });

  it('drops thin anchors and refuses a one-point curve', () => {
    const build = buildKoreaConversionCurves([
      ...pairsAt({ count: 2, depositWon: 60_000_000, annualRate: 0.05, prefix: 'L' }),
      ...pairsAt({ count: 1, depositWon: 200_000_000, annualRate: 0.045, prefix: 'H' }),
    ], options);

    expect(build.curves).toEqual([]);
    expect(build.diagnostics.droppedAnchors).toContainEqual({
      housingType: 'apartment',
      bandFloorWon: 175_000_000,
      bandCeilingWon: 250_000_000,
      pairCount: 1,
      reason: 'below_minimum_pairs',
    });
  });
});
