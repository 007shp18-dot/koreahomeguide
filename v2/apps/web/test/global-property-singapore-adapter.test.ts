import { describe, expect, it } from 'vitest';

import {
  projectHdbRentalRecord,
  projectHdbResaleRecord,
  projectUraPrivateSaleRecord,
} from '../lib/global-property/singapore-adapter';

describe('Singapore global property adapter', () => {
  it('keeps a URA private project distinct from HDB and preserves sale attributes', () => {
    const projection = projectUraPrivateSaleRecord({
      projectId: 'marina-one-residences',
      project: 'Marina One Residences',
      street: 'Marina Way',
      x: 103.853,
      y: 1.277,
      marketSegment: 'CCR',
      areaSqm: 70,
      floorRange: '11 to 15',
      units: 1,
      contractDate: '0726',
      contractMonth: '2026-07-01',
      saleType: 'resale',
      priceSgd: 2_100_000,
      netPriceSgd: null,
      propertyType: 'condominium',
      district: '01',
      areaBasis: 'strata',
      tenure: '99 yrs lease commencing from 2011',
      sourceOrder: { batch: 1, project: 2, transaction: 3 },
      psf: 2_787,
    });

    expect(projection.entity).toMatchObject({
      id: 'sg-singapore:project:marina-one-residences',
      kind: 'project',
      localAttributes: { housingSector: 'private_residential', marketSegment: 'CCR' },
    });
    expect(projection.observation).toMatchObject({
      kind: 'sale',
      stage: 'resale',
      observedAt: '2026-07-01',
      amountMinor: 210_000_000,
      currencyCode: 'SGD',
      propertyAreaSqm: 70,
      areaBasis: 'strata',
      floorRange: '11 to 15',
      tenureKind: 'leasehold',
    });
  });

  it('models HDB resale and rental as block observations without merging sectors', () => {
    const resale = projectHdbResaleRecord({
      blockId: '10-anson-road',
      month: '2026-07',
      town: 'CENTRAL AREA',
      flatType: '4 ROOM',
      block: '10',
      street: 'ANSON ROAD',
      storeyRange: '10 TO 12',
      floorAreaSqm: 92,
      flatModel: 'Model A',
      leaseCommenceYear: 1996,
      remainingLease: '68 years 06 months',
      resalePriceSgd: 920_000,
      sourceRow: 14,
    });
    const rental = projectHdbRentalRecord({
      blockId: '10-anson-road',
      approvalMonth: '2026-07',
      town: 'CENTRAL AREA',
      block: '10',
      street: 'ANSON ROAD',
      flatType: '4 ROOM',
      monthlyRentSgd: 3_800,
      sourceRow: 8,
    });

    expect(resale.entity).toMatchObject({ kind: 'block', localAttributes: { housingSector: 'hdb' } });
    expect(resale.observation).toMatchObject({
      kind: 'sale', amountMinor: 92_000_000, currencyCode: 'SGD', tenureStart: '1996-01-01',
    });
    expect(rental.entity).toMatchObject({ kind: 'block', localAttributes: { housingSector: 'hdb' } });
    expect(rental.observation).toMatchObject({
      kind: 'rent', recurringAmountMinor: 380_000, frequency: 'monthly', currencyCode: 'SGD',
    });
  });
});
