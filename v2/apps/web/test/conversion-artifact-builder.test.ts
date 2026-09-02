import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  KR_MOLIT_RENT_RIGHTS,
  parseKoreaConversionArtifact,
  type KoreaRentRecord,
} from '@signedprice/korea-rent';
import { buildKoreaConversionArtifact } from '../lib/public-market/conversion-artifact-builder.server';

const generatedAt = '2026-08-30T00:00:00.000Z';
const period = '2026-01/2026-07';

function pairs(
  housingType: 'apartment' | 'officetel',
  keyedDepositWon: number,
  annualRate: number,
  prefix: string,
): KoreaRentRecord[] {
  const gap = 240_000_000;
  return Array.from({ length: 2 }, (_, index) => {
    const common = {
      sourceHousingType: housingType,
      buildingLabel: `${prefix}-${index}`,
      legalDong: '성산동',
      areaSqm: 84.97,
      contractType: 'new' as const,
      contractDate: '2026-03-10',
      recordStatus: 'active' as const,
    };
    return [
      {
        ...common,
        depositWon: keyedDepositWon,
        monthlyRentWon: (annualRate * gap) / 12,
      },
      { ...common, depositWon: keyedDepositWon + gap, monthlyRentWon: 0 },
    ];
  }).flat();
}

const records = [
  ...pairs('apartment', 60_000_000, 0.05, 'AL'),
  ...pairs('apartment', 200_000_000, 0.045, 'AH'),
  ...pairs('officetel', 50_000_000, 0.06, 'OL'),
  ...pairs('officetel', 140_000_000, 0.055, 'OH'),
];

describe('Korea conversion artifact builder', () => {
  it('seals the normalized source and emits an artifact accepted by the runtime parser', async () => {
    const built = await buildKoreaConversionArtifact({
      records,
      period,
      generatedAt,
      options: { minimumPairsPerAnchor: 2 },
    });

    expect(built.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(built.eligiblePairCount).toBe(8);
    const verified = parseKoreaConversionArtifact(
      built.artifact,
      {
        marketId: 'kr-seoul',
        period,
        sha256: built.sha256,
        rightsLookup: (policyId) => (
          policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined
        ),
      },
      generatedAt,
    );
    expect(verified.curves.map(({ housingType }) => housingType)).toEqual([
      'apartment',
      'officetel',
    ]);
    expect(JSON.parse(built.serialized)).toEqual(built.artifact);
  });

  it('refuses to publish a half artifact when a required curve is thin', async () => {
    await expect(buildKoreaConversionArtifact({
      records: records.filter(({ sourceHousingType }) => sourceHousingType === 'apartment'),
      period,
      generatedAt,
      options: { minimumPairsPerAnchor: 2 },
    })).rejects.toThrow('required conversion curves');
  });
});
