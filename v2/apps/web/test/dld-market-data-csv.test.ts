import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  parseDldRentsCsv,
  parseDldTransactionsCsv,
} from '../lib/market-data/dld-csv.server';

const TRANSACTION_HEADER = [
  'TRANSACTION_NUMBER', 'INSTANCE_DATE', 'GROUP_EN', 'PROCEDURE_EN',
  'IS_OFFPLAN_EN', 'IS_FREE_HOLD_EN', 'USAGE_EN', 'AREA_EN',
  'PROP_TYPE_EN', 'PROP_SB_TYPE_EN', 'TRANS_VALUE', 'PROCEDURE_AREA',
  'ACTUAL_AREA', 'ROOMS_EN', 'PARKING', 'NEAREST_METRO_EN',
  'NEAREST_MALL_EN', 'NEAREST_LANDMARK_EN', 'TOTAL_BUYER', 'TOTAL_SELLER',
  'MASTER_PROJECT_EN', 'PROJECT_EN',
].join(',');

const RENT_HEADER = [
  'REGISTRATION_DATE', 'START_DATE', 'END_DATE', 'VERSION_EN', 'AREA_EN',
  'CONTRACT_AMOUNT', 'ANNUAL_AMOUNT', 'IS_FREE_HOLD_EN', 'ACTUAL_AREA',
  'PROP_TYPE_EN', 'PROP_SUB_TYPE_EN', 'ROOMS', 'USAGE_EN',
  'NEAREST_METRO_EN', 'NEAREST_MALL_EN', 'NEAREST_LANDMARK_EN', 'PARKING',
  'TOTAL_PROPERTIES', 'MASTER_PROJECT_EN', 'PROJECT_EN',
].join(',');

describe('DLD transaction CSV normalization', () => {
  it('normalizes an official sale into a versioned project observation', () => {
    const csv = `\uFEFF${TRANSACTION_HEADER}\r\n`
      + '"102-77401-2026","2026-09-05 16:23:18","Sales","Sell - Pre registration",'
      + '"Off-Plan","Free Hold","Residential","Wadi Al Safa 5","Unit","Flat",'
      + '"1402700","146.13","146.13","2 B/R","1","","","","0","0","","AZRA, RESIDENCE"\r\n';

    const batch = parseDldTransactionsCsv(csv, new Date('2026-09-06T12:00:00.000Z'));

    expect(batch.job).toBe('ae-dubai-transaction');
    expect(batch.dataset.id).toBe('ae-dubai-transactions');
    expect(batch.sourceAsOf).toBe('2026-09-05T12:23:18.000Z');
    expect(batch.records).toHaveLength(1);
    expect(batch.records[0]).toMatchObject({
      businessKey: '102-77401-2026',
      sourceObservedAt: '2026-09-05T12:23:18.000Z',
      entity: {
        marketId: 'ae-dubai',
        canonicalName: 'AZRA, RESIDENCE',
        identityStatus: 'verified',
        geography: { officialName: 'Wadi Al Safa 5' },
      },
      observation: {
        kind: 'sale',
        stage: 'off-plan',
        observedAt: '2026-09-05',
        amountMinor: 140_270_000,
        currencyCode: 'AED',
        propertyAreaSqm: 146.13,
        bedrooms: 2,
        tenureKind: 'freehold',
        status: 'active',
      },
    });
    expect(batch.records[0]?.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('maps mortgage records without presenting them as sales', () => {
    const csv = `${TRANSACTION_HEADER}\n`
      + '"13-24506-2026","2026-09-05 17:50:52","Mortgage","Mortgage Registration",'
      + '"Ready","Free Hold","Residential","Dubai Sports City","Unit","Flat",'
      + '"631912","69.83","69.83","1 B/R","B1-87","","","","0","0","","CONDOR GOLF LINKS 18"\n';

    const [record] = parseDldTransactionsCsv(csv, new Date('2026-09-06T00:00:00Z')).records;
    expect(record?.observation).toMatchObject({ kind: 'mortgage', stage: 'ready' });
  });

  it('can retain only incremental months from a full official snapshot', () => {
    const recent = '"recent","2026-09-05 17:50:52","Sales","Sale",'
      + '"Ready","Free Hold","Residential","Dubai Marina","Unit","Flat",'
      + '"700000","70","70","1 B/R","","","","","0","0","","Recent Home"';
    const historical = '"historical","2026-01-05 17:50:52","Sales","Sale",'
      + '"Ready","Free Hold","Residential","Dubai Marina","Unit","Flat",'
      + '"600000","70","70","1 B/R","","","","","0","0","","Older Home"';

    const batch = parseDldTransactionsCsv(
      `${TRANSACTION_HEADER}\n${historical}\n${recent}\n`,
      new Date('2026-09-06T00:00:00Z'),
      { monthKeys: ['202609', '202608'] },
    );

    expect(batch.records.map(({ businessKey }) => businessKey)).toEqual(['recent']);
  });

  it('does not merge same-named projects from different official areas', () => {
    const businessBay = '"bb","2026-09-05 17:50:52","Sales","Sale",'
      + '"Ready","Free Hold","Residential","Business Bay","Unit","Flat",'
      + '"700000","70","70","1 B/R","","","","","0","0","","AG TOWER"';
    const thanyah = '"thanyah","2026-09-05 17:50:52","Sales","Sale",'
      + '"Ready","Free Hold","Commercial","Al Thanyah Fifth","Unit","Office",'
      + '"900000","70","70","","","","","","0","0","","AG TOWER"';

    const batch = parseDldTransactionsCsv(
      `${TRANSACTION_HEADER}\n${businessBay}\n${thanyah}\n`,
      new Date('2026-09-06T00:00:00Z'),
    );

    expect(new Set(batch.records.map(({ entity }) => entity?.id)).size).toBe(2);
  });
});

describe('DLD rent CSV normalization', () => {
  it('keeps registered contract and annual amounts distinct', () => {
    const csv = `${RENT_HEADER}\n`
      + '"2026-06-01 00:05:09","2026-06-24 00:00:00","2027-06-23 00:00:00",'
      + '"Renewed","Al Karama","69999","69999","Non Free Hold","79.4","Unit",'
      + '"Flat","","Residential","ADCB Metro Station","Dubai Mall","Burj Khalifa",'
      + '"","1","","Karama Residence"\n';

    const batch = parseDldRentsCsv(csv, new Date('2026-09-06T00:00:00Z'));
    expect(batch.job).toBe('ae-dubai-rent');
    expect(batch.dataset.id).toBe('ae-dubai-rents');
    expect(batch.records[0]).toMatchObject({
      entity: { canonicalName: 'Karama Residence' },
      observation: {
        kind: 'rent',
        stage: 'renewed',
        observedAt: '2026-06-01',
        periodStart: '2026-06-24',
        periodEnd: '2027-06-23',
        amountMinor: 6_999_900,
        annualAmountMinor: 6_999_900,
        frequency: 'annual',
        tenureKind: 'non-freehold',
      },
    });
  });

  it('assigns deterministic occurrence keys to indistinguishable contract identities', () => {
    const row = '"2026-06-01 00:05:09","2026-06-24 00:00:00","2027-06-23 00:00:00",'
      + '"New","Al Karama","70000","70000","Non Free Hold","79.4","Unit",'
      + '"Flat","","Residential","","","","","1","","Karama Residence"';
    const batch = parseDldRentsCsv(`${RENT_HEADER}\n${row}\n${row}\n`, new Date('2026-09-06T00:00:00Z'));

    expect(batch.records.map(({ businessKey }) => businessKey)).toEqual([
      expect.stringMatching(/:1$/),
      expect.stringMatching(/:2$/),
    ]);
    expect(new Set(batch.records.map(({ businessKey }) => businessKey)).size).toBe(2);
  });

  it('preserves official rows with optional land fields as unlinked evidence', () => {
    const csv = `${RENT_HEADER}\n`
      + '"2026-09-01 09:16:17","2026-09-01 00:00:00","2027-08-31 00:00:00",'
      + '"Renewed","Al Goze Industrial Fourth","26400","13200","Non Free Hold",'
      + '"465","Land","","","","","","","","1","",""\n';

    const [record] = parseDldRentsCsv(csv, new Date('2026-09-06T00:00:00Z')).records;

    expect(record).toMatchObject({
      rawMetadata: { propertyType: 'Land', propertySubType: null, usage: null },
      entity: null,
      observation: null,
    });
  });
});

describe('DLD CSV fail-closed validation', () => {
  it('rejects empty, incomplete, and unsafe numeric source files', () => {
    expect(() => parseDldTransactionsCsv(TRANSACTION_HEADER, new Date())).toThrow(/no data rows/i);
    expect(() => parseDldTransactionsCsv('INSTANCE_DATE,TRANS_VALUE\n2026-01-01,1', new Date()))
      .toThrow(/required column/i);
    expect(() => parseDldTransactionsCsv(
      `${TRANSACTION_HEADER}\n"id","2026-09-05 00:00:00","Sales","Sale","Ready",`
      + '"Free Hold","Residential","Area","Unit","Flat","NaN","1","1","1 B/R",'
      + '"","","","","0","0","","Project"',
      new Date(),
    )).toThrow(/TRANS_VALUE/i);
  });
});
