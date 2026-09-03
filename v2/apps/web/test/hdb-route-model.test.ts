import { describe, expect, it } from 'vitest';

import { buildHdbExploreModel, buildHdbTownModel } from '../lib/singapore/hdb-route-model.server';

describe('HDB route model', () => {
  it('formats but never combines resale and rental evidence', () => {
    const model = buildHdbExploreModel({
      getContext: () => ({
        generatedAt: '2026-09-02T00:00:00.000Z', resalePeriod: '2017-01/2026-09',
        rentalPeriod: '2021-01/2026-08', propertyThrough: '2025-12',
        resale: 239_583, rental: 209_852, properties: 13_357, publicationMinimum: 5,
      }),
      listTowns: () => [{
        town: 'BEDOK', resaleCount: 100, resaleMedianSgd: 500_000,
        rentalCount: 80, rentalMedianSgd: 3_200,
      }],
      listBlocks: () => [],
    });
    expect(model).toMatchObject({
      status: 'ready', resaleTotalLabel: '239,583', rentalTotalLabel: '209,852',
      towns: [{ resaleMedianLabel: 'SGD 500,000', rentalMedianLabel: 'SGD 3,200' }],
    });
    expect(JSON.stringify(model)).not.toContain('combinedMedian');
  });

  it('builds stable town and block links with separate block medians', () => {
    const repository = {
      getContext: () => ({
        generatedAt: '2026-09-02T00:00:00.000Z', resalePeriod: '2017-01/2026-09',
        rentalPeriod: '2021-01/2026-08', propertyThrough: '2025-12', resale: 5,
        rental: 5, properties: 1, publicationMinimum: 5 as const,
      }),
      listTowns: () => [{
        town: 'ANG MO KIO', resaleCount: 5, resaleMedianSgd: 430_000,
        rentalCount: 5, rentalMedianSgd: 2_800,
      }],
      listBlocks: () => [{
        blockId: 'a'.repeat(64), town: 'ANG MO KIO', block: '10', street: 'ANG MO KIO AVE 1',
        resaleCount: 5, resaleMedianSgd: 430_000, rentalCount: 5, rentalMedianSgd: 2_800,
        property: null,
      }],
    };
    expect(buildHdbTownModel(repository, 'ang-mo-kio')).toMatchObject({
      town: 'ANG MO KIO',
      blocks: [{
        href: `/sg/singapore/hdb/ang-mo-kio/${'a'.repeat(64)}/`,
        resaleMedianLabel: 'SGD 430,000', rentalMedianLabel: 'SGD 2,800',
      }],
    });
    expect(buildHdbTownModel(repository, 'missing')).toBeNull();
  });
});
