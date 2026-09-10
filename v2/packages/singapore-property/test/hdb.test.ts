import { describe, expect, it } from 'vitest';

import {
  buildHdbSnapshot,
  parseHdbPropertyCsv,
  parseHdbRentalCsv,
  parseHdbResaleCsv,
  parseHdbSnapshot,
  stringifyHdbSnapshot,
} from '../src/hdb';

const resaleCsv = `month,town,flat_type,block,street_name,storey_range,floor_area_sqm,flat_model,lease_commence_date,remaining_lease,resale_price
2026-08,ANG MO KIO,3 ROOM,108,ANG MO KIO AVE 4,01 TO 03,67,"Model, A",1978,50 years 07 months,500000
2026-07,BEDOK,4 ROOM,1,BEDOK STH AVE 1,10 TO 12,92,Improved,1975,48 years,650000
`;
const rentalCsv = `rent_approval_date,town,block,street_name,flat_type,monthly_rent
2026-08,ANG MO KIO,108,ANG MO KIO AVE 4,3-ROOM,2800
2026-07,BEDOK,1,BEDOK STH AVE 1,4-ROOM,3500
`;
const propertyCsv = `blk_no,street,max_floor_lvl,year_completed,residential,commercial,market_hawker,miscellaneous,multistorey_carpark,precinct_pavilion,bldg_contract_town,total_dwelling_units,1room_sold,2room_sold,3room_sold,4room_sold,5room_sold,exec_sold,multigen_sold,studio_apartment_sold,1room_rental,2room_rental,3room_rental,other_room_rental
108,ANG MO KIO AVE 4,12,1978,Y,N,N,N,N,N,AMK,120,0,0,120,0,0,0,0,0,0,0,0,0
1,BEDOK STH AVE 1,14,1975,Y,N,N,Y,N,N,BD,206,0,0,0,204,2,0,0,0,0,0,0,0
`;

describe('HDB source parsers', () => {
  it('parses official resale, rental and property schemas without mixing them', () => {
    expect(parseHdbResaleCsv(resaleCsv)[0]).toMatchObject({
      month: '2026-08', town: 'ANG MO KIO', flatType: '3 ROOM', block: '108',
      street: 'ANG MO KIO AVE 4', floorAreaSqm: 67, flatModel: 'Model, A',
      leaseCommenceYear: 1978, resalePriceSgd: 500_000, sourceRow: 2,
    });
    expect(parseHdbRentalCsv(rentalCsv)[0]).toMatchObject({
      approvalMonth: '2026-08', town: 'ANG MO KIO', flatType: '3-ROOM',
      block: '108', street: 'ANG MO KIO AVE 4', monthlyRentSgd: 2_800, sourceRow: 2,
    });
    expect(parseHdbPropertyCsv(propertyCsv)[0]).toMatchObject({
      block: '108', street: 'ANG MO KIO AVE 4', maxFloorLevel: 12,
      yearCompleted: 1978, residential: true, commercial: false,
      townCode: 'AMK', totalDwellingUnits: 120, threeRoomSold: 120, sourceRow: 2,
    });
  });

  it('allows trailing blank CSV lines but never treats them as source rows', () => {
    expect(parseHdbResaleCsv(`${resaleCsv}\n\n`)).toHaveLength(2);
  });

  it('preserves cents when HDB reports a non-integer resale consideration', () => {
    expect(parseHdbResaleCsv(resaleCsv.replace('500000', '499999.88'))[0]?.resalePriceSgd)
      .toBe(499999.88);
  });

  it.each([
    ['changed resale header', () => parseHdbResaleCsv(resaleCsv.replace('resale_price', 'price'))],
    ['invalid resale month', () => parseHdbResaleCsv(resaleCsv.replace('2026-08', '2026-13'))],
    ['invalid rental money', () => parseHdbRentalCsv(rentalCsv.replace('2800', '-1'))],
    ['invalid property flag', () => parseHdbPropertyCsv(propertyCsv.replace(',Y,N,N,N,', ',MAYBE,N,N,N,'))],
  ])('rejects %s', (_label, action) => {
    expect(action).toThrow('HDB source schema is invalid.');
  });
});

describe('HDB snapshot', () => {
  it('keeps public housing identity, sources, periods and digest independent from URA', () => {
    const snapshot = buildHdbSnapshot({
      resale: parseHdbResaleCsv(resaleCsv),
      rental: parseHdbRentalCsv(rentalCsv),
      properties: parseHdbPropertyCsv(propertyCsv),
      generatedAt: '2026-09-02T00:00:00.000Z',
    });

    expect(snapshot).toMatchObject({
      version: 'signedprice-singapore-hdb-v1',
      generatedAt: '2026-09-02T00:00:00.000Z',
      periods: { resale: '2026-07/2026-08', rental: '2026-07/2026-08', propertyThrough: '2025-12' },
      totals: { resale: 2, rental: 2, properties: 2, sourceRows: 6 },
    });
    expect(snapshot.properties[0]?.blockId).toMatch(/^[a-f0-9]{64}$/);
    const block = snapshot.properties.find(({ block: value }) => value === '108');
    expect(snapshot.resale[0]?.blockId).toBe(block?.blockId);
    expect(snapshot.rental[0]?.blockId).toBe(block?.blockId);
    expect(parseHdbSnapshot(stringifyHdbSnapshot(snapshot))).toEqual(snapshot);
  });

  it('rejects a mutated digest', () => {
    const snapshot = buildHdbSnapshot({
      resale: parseHdbResaleCsv(resaleCsv),
      rental: parseHdbRentalCsv(rentalCsv),
      properties: parseHdbPropertyCsv(propertyCsv),
      generatedAt: '2026-09-02T00:00:00.000Z',
    });
    const value = JSON.parse(stringifyHdbSnapshot(snapshot));
    value.resale[0].resalePriceSgd = 1;
    expect(() => parseHdbSnapshot(JSON.stringify(value)))
      .toThrow('HDB snapshot digest is invalid.');
  });
});
