import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildHdbSnapshot,
  buildHdbPublishedSnapshot,
  type HdbPropertyRecord,
  type HdbRentalRecord,
  type HdbResaleRecord,
} from '@signedprice/singapore-property';
import { createHdbSnapshotRepositoryFromInstalled } from '../lib/singapore/hdb-snapshot-repository.server';

const resale = (town: string, price: number, month = '2026-08'): HdbResaleRecord => ({
  month, town, flatType: '4 ROOM', block: '10', street: `${town} STREET`,
  storeyRange: '07 TO 09', floorAreaSqm: 92, flatModel: 'Model A',
  leaseCommenceYear: 1995, remainingLease: '68 years', resalePriceSgd: price, sourceRow: price,
});
const rental = (town: string, rent: number, approvalMonth = '2026-08'): HdbRentalRecord => ({
  approvalMonth, town, block: '10', street: `${town} STREET`, flatType: '4-ROOM',
  monthlyRentSgd: rent, sourceRow: rent,
});
const property = (town: string): HdbPropertyRecord => ({
  block: '10', street: `${town} STREET`, maxFloorLevel: 12, yearCompleted: 1995,
  residential: true, commercial: false, marketHawker: false, miscellaneous: false,
  multistoreyCarpark: false, precinctPavilion: false, townCode: town.slice(0, 2),
  totalDwellingUnits: 80, oneRoomSold: 0, twoRoomSold: 0, threeRoomSold: 20,
  fourRoomSold: 40, fiveRoomSold: 20, executiveSold: 0, multigenSold: 0,
  studioApartmentSold: 0, oneRoomRental: 0, twoRoomRental: 0, threeRoomRental: 0,
  otherRoomRental: 0, sourceRow: 2,
});

describe('HDB snapshot repository', () => {
  it('keeps resale and rent distributions separate and joins property facts by block', () => {
    const snapshot = buildHdbPublishedSnapshot(buildHdbSnapshot({
      resale: [1, 2, 3, 4, 5].map((n) => resale('ANG MO KIO', 400_000 + n * 10_000)),
      rental: [1, 2, 3, 4, 5].map((n) => rental('ANG MO KIO', 2_500 + n * 100)),
      properties: [property('ANG MO KIO')],
      generatedAt: '2026-09-02T00:00:00.000Z',
    }));
    const repository = createHdbSnapshotRepositoryFromInstalled({
      metadata: {
        marketId: 'sg-singapore', dataset: 'sg-hdb', schemaVersion: snapshot.version,
        sourceVersion: 'fixture', parserVersion: 'fixture', rightsPolicyId: 'sg-open-data-licence-v1',
        period: '2026-08/2026-08', generatedAt: snapshot.generatedAt,
        objectUrl: 'installed://sg-hdb', sha256: '0'.repeat(64), recordCount: 11,
      },
      payload: snapshot,
    });

    expect(repository.getContext()).toMatchObject({ resale: 5, rental: 5, properties: 1 });
    expect(repository.listTowns()).toEqual([expect.objectContaining({
      town: 'ANG MO KIO', resaleCount: 5, resaleMedianSgd: 430_000,
      rentalCount: 5, rentalMedianSgd: 2_800,
    })]);
    const block = repository.listBlocks('ANG MO KIO')[0]!;
    expect(block.property).toMatchObject({ totalDwellingUnits: 80, maxFloorLevel: 12 });
    expect(block.resaleMedianSgd).toBe(430_000);
    expect(block.rentalMedianSgd).toBe(2_800);
  });

  it('withholds a distribution with fewer than five observations', () => {
    const snapshot = buildHdbPublishedSnapshot(buildHdbSnapshot({
      resale: [resale('BEDOK', 500_000)], rental: [rental('BEDOK', 3_000)],
      properties: [property('BEDOK')], generatedAt: '2026-09-02T00:00:00.000Z',
    }));
    const repository = createHdbSnapshotRepositoryFromInstalled({
      metadata: {
        marketId: 'sg-singapore', dataset: 'sg-hdb', schemaVersion: snapshot.version,
        sourceVersion: 'fixture', parserVersion: 'fixture', rightsPolicyId: 'sg-open-data-licence-v1',
        period: '2026-08/2026-08', generatedAt: snapshot.generatedAt,
        objectUrl: 'installed://sg-hdb', sha256: '0'.repeat(64), recordCount: 3,
      }, payload: snapshot,
    });
    expect(repository.listTowns()[0]).toMatchObject({ resaleMedianSgd: null, rentalMedianSgd: null });
  });
});
