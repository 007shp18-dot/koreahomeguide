import { describe, expect, it } from 'vitest';

import {
  buildSingaporeCheckArtifact,
  type HdbRentCheckRecord,
  type UraPrivateSaleCheckRecord,
} from '../src/check-artifact';
import {
  compareSingaporeCheckOffers,
  evaluateSingaporeCheckOffer,
  singaporeCompletedMonthWindow,
} from '../src/check-engine';

function uraRecord(
  amountSgd: number,
  overrides: Partial<UraPrivateSaleCheckRecord> = {},
): UraPrivateSaleCheckRecord {
  return {
    market: 'ura-private-sale', month: '2026-08', amountSgd,
    marketSegment: 'CCR', projectId: 'project-a', project: 'Project A',
    propertyType: 'Condominium', district: '09', floorAreaSqm: 100,
    floorRange: '06-10', tenure: '99 yrs from 2020', saleType: 'Resale', psf: 1_858,
    ...overrides,
  };
}

function hdbRentRecord(
  amountSgd: number,
  overrides: Partial<HdbRentCheckRecord> = {},
): HdbRentCheckRecord {
  return {
    market: 'hdb-rent', month: '2026-08', amountSgd,
    town: 'ANG MO KIO', blockId: 'block-a', block: '108',
    street: 'ANG MO KIO AVE 4', flatType: '3-ROOM',
    ...overrides,
  };
}

const generatedAt = '2026-09-02T00:00:00.000Z';

describe('Singapore Check engine', () => {
  it('uses at most the latest 12 completed months across a year boundary', () => {
    expect(singaporeCompletedMonthWindow({ from: '2024-01', to: '2025-02' }))
      .toEqual({ from: '2024-03', to: '2025-02', monthCount: 12, maximumMonthCount: 12 });
  });

  it('excludes old outliers before calculating quartiles, median, percentile, and sample', () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale', sourceIdentifier: 'URA', generatedAt,
      records: [
        uraRecord(99_000_000, { month: '2025-08' }),
        ...[100, 200, 300, 400, 500].map((value) => uraRecord(value)),
      ],
    });
    const result = evaluateSingaporeCheckOffer({
      artifact,
      offer: {
        market: 'ura-private-sale', amountSgd: 350,
        filters: {
          marketSegment: 'CCR', projectId: 'project-a', district: '09',
          propertyType: 'Condominium', areaBand: { minimum: 80, maximum: 120 },
          floorRange: '06-10', saleType: 'Resale',
        },
      },
    });

    expect(result).toMatchObject({
      status: 'ready',
      window: { from: '2025-09', to: '2026-08', monthCount: 12 },
      scope: { level: 'exact' },
      distribution: { minimum: 100, p25: 200, median: 300, p75: 400, maximum: 500 },
      percentile: 60,
      sampleCount: 5,
    });
  });

  it('widens scope from project to district without widening the 12-month window', () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale', sourceIdentifier: 'URA', generatedAt,
      records: [
        uraRecord(99_000_000, { month: '2025-08' }),
        uraRecord(100),
        ...[200, 300, 400, 500].map((amountSgd, index) => uraRecord(amountSgd, {
          projectId: `project-${index + 2}`, project: `Project ${index + 2}`,
        })),
      ],
    });
    const result = evaluateSingaporeCheckOffer({
      artifact,
      offer: {
        market: 'ura-private-sale', amountSgd: 350,
        filters: {
          marketSegment: 'CCR', projectId: 'project-a', district: '09',
          propertyType: 'Condominium', areaBand: { minimum: 80, maximum: 120 },
          floorRange: null, saleType: null,
        },
      },
    });

    expect(result).toMatchObject({
      status: 'ready', scope: { level: 'district' }, sampleCount: 5,
      window: { from: '2025-09', to: '2026-08' },
    });
    if (result.status === 'ready') expect(result.fallbackDisclosure).toMatch(/district/i);
  });

  it('reports insufficient recent evidence instead of pulling an old fifth record', () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'hdb-rent', sourceIdentifier: 'HDB rental approvals', generatedAt,
      records: [
        hdbRentRecord(1_000, { month: '2025-08' }),
        ...[2_000, 2_100, 2_200, 2_300].map((amount) => hdbRentRecord(amount)),
      ],
    });
    const result = evaluateSingaporeCheckOffer({
      artifact,
      offer: {
        market: 'hdb-rent', amountSgd: 2_150,
        filters: { town: 'ANG MO KIO', blockId: 'block-a', flatType: '3-ROOM' },
      },
    });

    expect(result).toMatchObject({
      status: 'insufficient', sampleCount: 4, minimumSample: 5,
      window: { from: '2025-09', to: '2026-08' },
    });
  });

  it('keeps cross-market A/B neutral and never converts native amounts', () => {
    const ura = buildSingaporeCheckArtifact({
      market: 'ura-private-sale', sourceIdentifier: 'URA', generatedAt,
      records: [100, 200, 300, 400, 500].map((value) => uraRecord(value)),
    });
    const rent = buildSingaporeCheckArtifact({
      market: 'hdb-rent', sourceIdentifier: 'HDB rental approvals', generatedAt,
      records: [2_000, 2_100, 2_200, 2_300, 2_400].map((value) => hdbRentRecord(value)),
    });
    const left = evaluateSingaporeCheckOffer({
      artifact: ura,
      offer: { market: 'ura-private-sale', amountSgd: 350, filters: {
        marketSegment: 'CCR', projectId: 'project-a', district: '09',
        propertyType: 'Condominium', areaBand: { minimum: 80, maximum: 120 },
        floorRange: null, saleType: null,
      } },
    });
    const right = evaluateSingaporeCheckOffer({
      artifact: rent,
      offer: { market: 'hdb-rent', amountSgd: 2_150, filters: {
        town: 'ANG MO KIO', blockId: 'block-a', flatType: '3-ROOM',
      } },
    });

    expect(compareSingaporeCheckOffers(left, right)).toEqual({
      status: 'ready', basis: 'native-market-position', verdict: 'tradeoff', winner: null,
      marketRelationship: 'cross-market', offers: [left, right],
    });
  });
});
