import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  collectSeoulEvidence,
  type SeoulMonthFetcher,
} from '../lib/market-data/seoul-collector.server';
import {
  collectSingaporeEvidence,
  parseUraPrivateRentalEnvelope,
} from '../lib/market-data/singapore-collector.server';

const reference = new Date('2026-09-06T12:00:00.000Z');

describe('Seoul official evidence collector', () => {
  it('refreshes two months, 25 districts, and four housing types', async () => {
    const calls: Array<Readonly<Record<string, unknown>>> = [];
    const fetchMonth: SeoulMonthFetcher = async (input) => {
      calls.push(input);
      const populated = input.lawdCd === '11110'
        && input.dealYmd === '202609'
        && input.sourceHousingType === 'apartment';
      return {
        retrievedAt: '2026-09-06T11:00:00.000Z',
        records: populated ? [{
          sourceHousingType: 'apartment',
          legalDong: '청운동',
          buildingLabel: '테스트 아파트',
          sourceRecordId: 'deal-1',
          contractDate: '2026-09-05',
          recordStatus: 'active',
          areaSqm: 84.9,
          priceWon: 1_500_000_000,
          floor: 10,
        }] : [],
      };
    };

    const batch = await collectSeoulEvidence({
      job: 'kr-seoul-sale',
      serviceKey: 'free-official-test-key',
      reference,
      fetchMonth,
      concurrency: 7,
    });

    expect(calls).toHaveLength(200);
    expect(new Set(calls.map((call) => call.lawdCd)).size).toBe(25);
    expect(new Set(calls.map((call) => call.dealYmd))).toEqual(new Set(['202609', '202608']));
    expect(new Set(calls.map((call) => call.sourceHousingType))).toEqual(
      new Set(['apartment', 'officetel', 'villa', 'detached']),
    );
    expect(batch).toMatchObject({
      job: 'kr-seoul-sale',
      dataset: { id: 'kr-sale', marketId: 'kr-seoul', provider: 'MOLIT' },
      sourceAsOf: '2026-09-06T11:00:00.000Z',
    });
    expect(batch.records).toHaveLength(1);
    expect(batch.records[0]).toMatchObject({
      businessKey: 'apartment:11110:deal-1',
      entity: {
        id: expect.stringMatching(/^kr-seoul:estate:jongno-gu-/),
        canonicalName: '테스트 아파트',
        geography: { officialName: '청운동' },
      },
      observation: {
        kind: 'sale',
        observedAt: '2026-09-05',
        amountMinor: 1_500_000_000,
        floorValue: 10,
        status: 'active',
      },
    });
  });

  it('preserves cancelled rent records instead of silently dropping history', async () => {
    const batch = await collectSeoulEvidence({
      job: 'kr-seoul-rent',
      serviceKey: 'free-official-test-key',
      reference,
      fetchMonth: async (input) => ({
        retrievedAt: reference.toISOString(),
        records: input.lawdCd === '11110' && input.dealYmd === '202609'
          && input.sourceHousingType === 'officetel' ? [{
              sourceHousingType: 'officetel',
              legalDong: '청운동',
              buildingLabel: '테스트 오피스텔',
              sourceRecordId: 'rent-1',
              contractDate: '2026-09-04',
              contractType: 'renewal',
              recordStatus: 'cancelled',
              areaSqm: 29.5,
              depositWon: 20_000_000,
              monthlyRentWon: 1_200_000,
            }] : [],
      }),
    });

    expect(batch.dataset.id).toBe('kr-rent');
    expect(batch.records[0]?.observation).toMatchObject({
      kind: 'rent',
      stage: 'renewal',
      depositMinor: 20_000_000,
      recurringAmountMinor: 1_200_000,
      frequency: 'monthly',
      status: 'cancelled',
    });
  });
});

const uraSaleEnvelope = (batch: number) => ({
  Status: 'Success',
  Message: '',
  Result: [{
    project: `TEST RESIDENCE ${batch}`,
    street: 'TEST STREET',
    marketSegment: 'CCR',
    x: '30000.1',
    y: '30000.2',
    transaction: [{
      area: '80', contractDate: '0926', district: '09', floorRange: '06-10',
      noOfUnits: '1', price: String(2_000_000 + batch), propertyType: 'Condominium',
      tenure: 'Freehold', typeOfArea: 'Strata', typeOfSale: '3',
    }],
  }],
});

const uraRentalEnvelope = (quarter: string) => ({
  Status: 'Success',
  Message: '',
  Result: [{
    project: `RENT RESIDENCE ${quarter}`,
    street: 'RENT STREET',
    rental: [{
      district: '09', propertyType: 'Condominium', leaseDate: '0926',
      areaSqm: '70-80', noOfBedRoom: '2', rent: '6500',
    }],
  }],
});

describe('Singapore official evidence collector', () => {
  it('normalizes all four required URA private-sale batches', async () => {
    const batch = await collectSingaporeEvidence({
      job: 'sg-private-sale',
      accessKey: 'free-ura-test-key',
      reference,
      fetchSaleEnvelopes: async () => [1, 2, 3, 4].map(uraSaleEnvelope),
    });

    expect(batch.dataset.id).toBe('sg-private-sale');
    expect(batch.records).toHaveLength(4);
    expect(batch.records[0]).toMatchObject({
      entity: {
        marketId: 'sg-singapore',
        housingSector: 'private_residential',
      },
      observation: {
        kind: 'sale',
        stage: 'resale',
        currencyCode: 'SGD',
        amountMinor: expect.any(Number),
        floorRange: '06-10',
        tenureKind: 'Freehold',
      },
    });
  });

  it('does not rewrite the five-year URA sale window on every scheduled run', async () => {
    const envelope = uraSaleEnvelope(1);
    envelope.Result[0]!.transaction.push({
      ...envelope.Result[0]!.transaction[0]!,
      contractDate: '0120',
      price: '1000000',
    });
    const batch = await collectSingaporeEvidence({
      job: 'sg-private-sale',
      accessKey: 'free-ura-test-key',
      reference,
      fetchSaleEnvelopes: async () => [envelope, ...[2, 3, 4].map(uraSaleEnvelope)],
    });

    expect(batch.records).toHaveLength(4);
    expect(batch.records.every(({ observation }) => observation?.observedAt === '2026-09-01'))
      .toBe(true);
  });

  it('requests two rental quarters and retains the reported area range', async () => {
    const quarters: string[] = [];
    const batch = await collectSingaporeEvidence({
      job: 'sg-private-rent',
      accessKey: 'free-ura-test-key',
      reference,
      fetchRentalEnvelope: async (quarter) => {
        quarters.push(quarter);
        return uraRentalEnvelope(quarter);
      },
    });

    expect(quarters).toEqual(['26q3', '26q2']);
    expect(batch.dataset.id).toBe('sg-private-rent');
    expect(batch.records).toHaveLength(2);
    expect(batch.records[0]?.observation).toMatchObject({
      kind: 'rent',
      observedAt: '2026-09-01',
      recurringAmountMinor: 650_000,
      annualAmountMinor: 7_800_000,
      frequency: 'monthly',
      propertyAreaSqm: 75,
      areaBasis: 'ura-reported-range-midpoint',
      bedrooms: 2,
    });
    expect(batch.records[0]?.rawMetadata).toMatchObject({ areaRange: '70-80' });
  });

  it('rejects an empty or structurally altered rental envelope', () => {
    expect(() => parseUraPrivateRentalEnvelope({
      Status: 'Success', Message: '', Result: [],
    }, '26q3')).toThrow(/rental schema/i);
    expect(() => parseUraPrivateRentalEnvelope({
      Status: 'Success', Message: '', Result: [{ project: 'A', street: 'B', rental: [] }],
    }, '26q3')).toThrow(/rental schema/i);
  });
});
