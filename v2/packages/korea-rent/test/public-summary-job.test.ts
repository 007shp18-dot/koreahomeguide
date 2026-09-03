import { describe, expect, it } from 'vitest';

import {
  KR_MOLIT_RENT_RIGHTS,
  MolitSourceError,
  SEOUL_RENT_CHECK_DISTRICTS,
  buildKoreaPublicSummaryPlan,
  createSourceMonthStore,
  finalizeKoreaPublicAreaSummaryJob,
  finalizeKoreaPublicBuildingSummaryJob,
  finalizeKoreaObservedBuildingInventoryJob,
  finalizeKoreaRentSnapshotJob,
  finalizeKoreaPublicSummaryJob,
  runKoreaPublicSummaryBatch,
  type KoreaPublicSummaryCoordinate,
  type KoreaRentRecord,
  type MolitFetch,
  type MolitRentalMonth,
  type RuntimeCacheEntryOptions,
  type RuntimeCachePort,
} from '../src';

const REFERENCE_INSTANT = '2026-08-30T00:00:00.000Z';
const JOB_TAG = 'kr-public-summary-job:v1';

type Stored = { value: unknown; options: RuntimeCacheEntryOptions };

class MemoryCache implements RuntimeCachePort {
  readonly entries = new Map<string, Stored>();

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key)?.value as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T, options: RuntimeCacheEntryOptions): Promise<void> {
    this.entries.set(key, { value, options });
  }

  async hardDeleteByTag(tag: string): Promise<void> {
    for (const [key, entry] of this.entries) {
      if (entry.options.tags.includes(tag)) this.entries.delete(key);
    }
  }
}

const rightsLookup = (policyId: string) =>
  policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined;

function zeroPage(pageSize = 1_000): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<response><header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
<body><items></items><numOfRows>${pageSize}</numOfRows><pageNo>1</pageNo>
<totalCount>0</totalCount></body></response>`;
}

function response(body: string) {
  return { ok: true, status: 200, text: async () => body };
}

function dependencies(cache: RuntimeCachePort, fetch: MolitFetch) {
  return {
    serviceKey: 'test-only-key',
    cache,
    fetch,
    now: () => new Date(REFERENCE_INSTANT),
    rightsLookup,
    coordinateLimit: 4,
    createDeadlineSignal: () => new AbortController().signal,
    createProviderBudget: (limit: number) => {
      let remaining = limit;
      return {
        consume() {
          if (remaining <= 0) throw new Error('budget exhausted');
          remaining -= 1;
        },
      };
    },
  } as const;
}

function emptyMonth(
  coordinate: KoreaPublicSummaryCoordinate,
  records: readonly KoreaRentRecord[] = [],
): MolitRentalMonth {
  return {
    sourceHousingType: coordinate.sourceHousingType,
    lawdCd: coordinate.lawdCd,
    dealYmd: coordinate.dealYmd,
    pageSize: 1_000,
    totalCount: records.length,
    pages: [{
      pageNo: 1,
      rows: records,
      rowFingerprintDigests: records.map((_record, index) =>
        (index + 1).toString(16).padStart(64, '0')),
    }],
    records,
    retrievedAt: REFERENCE_INSTANT,
  };
}

function eligibleRecord(
  coordinate: KoreaPublicSummaryCoordinate,
  index: number,
  contractType: KoreaRentRecord['contractType'] = 'new',
  recordStatus: KoreaRentRecord['recordStatus'] = 'active',
): KoreaRentRecord {
  return {
    sourceHousingType: coordinate.sourceHousingType,
    areaSqm: 50,
    depositWon: (index + 1) * 100_000_000,
    monthlyRentWon: 0,
    contractDate: `${coordinate.dealYmd.slice(0, 4)}-${coordinate.dealYmd.slice(4)}-15`,
    contractType,
    recordStatus,
    sourceRecordId: `record-${index}`,
  };
}

function fixedEligibleRecords(
  coordinate: KoreaPublicSummaryCoordinate,
  count: number,
  depositWon: number,
  identity: string,
  contractType: KoreaRentRecord['contractType'] = 'new',
): readonly KoreaRentRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    sourceHousingType: coordinate.sourceHousingType,
    areaSqm: 50,
    depositWon,
    monthlyRentWon: 0,
    contractDate: `${coordinate.dealYmd.slice(0, 4)}-${coordinate.dealYmd.slice(4)}-15`,
    contractType,
    recordStatus: 'active' as const,
    sourceRecordId: `${identity}-${index}`,
  }));
}

describe('Korea public summary coordinate plan', () => {
  it('is a unique district-major, source-second, month-last 700-coordinate matrix', () => {
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);

    expect(plan).toHaveLength(700);
    expect(plan[0]).toEqual({
      index: 0,
      lawdCd: '11110',
      sourceHousingType: 'apartment',
      dealYmd: '202601',
    });
    expect(plan[6]).toMatchObject({ index: 6, dealYmd: '202607' });
    expect(plan[7]).toMatchObject({
      index: 7,
      lawdCd: '11110',
      sourceHousingType: 'officetel',
      dealYmd: '202601',
    });
    expect(plan[28]).toMatchObject({
      index: 28,
      lawdCd: '11140',
      sourceHousingType: 'apartment',
      dealYmd: '202601',
    });
    expect(new Set(plan.map((coordinate) =>
      `${coordinate.lawdCd}:${coordinate.sourceHousingType}:${coordinate.dealYmd}`)).size)
      .toBe(700);
  });
});

describe('Korea public summary resumable batch', () => {
  it('writes a bounded batch and reuses verified coordinates on replay', async () => {
    const cache = new MemoryCache();
    let fetchCalls = 0;
    const fetch: MolitFetch = async () => {
      fetchCalls += 1;
      return response(zeroPage());
    };

    await expect(runKoreaPublicSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      dependencies(cache, fetch),
    )).resolves.toEqual({
      status: 'progress',
      nextCursor: 4,
      completedCoordinates: 4,
      totalCoordinates: 700,
    });
    expect(fetchCalls).toBe(4);

    await runKoreaPublicSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      dependencies(cache, fetch),
    );
    expect(fetchCalls).toBe(4);
  });

  it('returns a retryable cursor without advancing past a deadline failure', async () => {
    const cache = new MemoryCache();
    const fetch: MolitFetch = async () => response(zeroPage());
    await runKoreaPublicSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      dependencies(cache, fetch),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(runKoreaPublicSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 4 },
      {
        ...dependencies(cache, fetch),
        createDeadlineSignal: () => controller.signal,
      },
    )).resolves.toEqual({
      status: 'retryable',
      nextCursor: 4,
      completedCoordinates: 4,
      totalCoordinates: 700,
      code: 'source_timeout',
    });
  });

  it('returns only a categorical parser diagnostic for a malformed source coordinate', async () => {
    const cache = new MemoryCache();
    const providerError = `<?xml version="1.0" encoding="UTF-8"?>
<response><header><resultCode>20</resultCode><resultMsg>SECRET PROVIDER MESSAGE</resultMsg></header>
<body><items></items><numOfRows>1000</numOfRows><pageNo>1</pageNo>
<totalCount>0</totalCount></body></response>`;

    const result = await runKoreaPublicSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 84 },
      dependencies(cache, async () => response(providerError)),
    );

    expect(result).toEqual({
      status: 'retryable',
      nextCursor: 84,
      completedCoordinates: 84,
      totalCoordinates: 700,
      code: 'source_malformed',
      diagnostic: 'provider_access_denied',
    });
    expect(JSON.stringify(result)).not.toContain('SECRET PROVIDER MESSAGE');
  });
});

describe('Korea public summary finalization', () => {
  it('finalizes observed inventory and all-area rent evidence from one complete cache', async () => {
    const cache = new MemoryCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);
    for (const coordinate of plan) {
      let records: readonly KoreaRentRecord[] = [];
      if (coordinate.index < 5) {
        records = [{
          ...eligibleRecord(coordinate, coordinate.index),
          legalDong: '청운동',
          buildingLabel: '전면적 검증아파트',
          areaSqm: [20, 40, 60, 85, 120][coordinate.index]!,
        }];
      } else if (coordinate.index >= 7 && coordinate.index < 12) {
        records = [{
          ...eligibleRecord(coordinate, coordinate.index),
          legalDong: '청운동',
          buildingLabel: '월세 검증오피스텔',
          areaSqm: 30,
          depositWon: (12 - coordinate.index) * 10_000_000,
          monthlyRentWon: (coordinate.index - 2) * 100_000,
        }];
      }
      await store.write(cache, emptyMonth(coordinate, records));
    }

    const finalized = await finalizeKoreaRentSnapshotJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    );

    expect(finalized).toMatchObject({
      period: '2026-01/2026-07',
      generatedAt: REFERENCE_INSTANT,
      completedCoordinates: 700,
      conversionRecords: expect.any(Array),
      evidence: {
        stats: {
          sourceRecordCount: 10,
          eligibleRecordCount: 10,
          jeonseRecordCount: 5,
          monthlyRecordCount: 5,
          observedBuildingCount: 2,
        },
      },
      inventory: {
        stats: {
          observedRecordCount: 10,
          observedBuildingCount: 2,
        },
      },
    });
    expect(finalized.conversionRecords).toHaveLength(10);
    const cityAll = finalized.evidence.areaRecords.find(({ areaId }) => areaId === 'seoul:all')!;
    const allJeonse = cityAll.cohorts.find(({ transaction, areaBand, contractGroup }) => (
      transaction === 'jeonse' && areaBand === 'all' && contractGroup === 'all'
    ));
    expect(allJeonse?.primary).toMatchObject({ n: 5, published: true });
  }, 30_000);

  it('finalizes when the official cache contains a zero-value active filing', async () => {
    const cache = new MemoryCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);
    for (const coordinate of plan) {
      const records = coordinate.index === 0
        ? [{
            ...eligibleRecord(coordinate, 0),
            legalDong: '청운동',
            buildingLabel: '금액누락 신고 건물',
            depositWon: 0,
            monthlyRentWon: 0,
          }]
        : [];
      await store.write(cache, emptyMonth(coordinate, records));
    }

    const finalized = await finalizeKoreaRentSnapshotJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    );

    expect(finalized.evidence.stats).toMatchObject({
      sourceRecordCount: 1,
      eligibleRecordCount: 0,
      invalidPaymentRecordCount: 1,
    });
    expect(finalized.inventory.stats.observedBuildingCount).toBe(1);
    expect(finalized.conversionRecords).toHaveLength(1);
  }, 30_000);

  it('derives all observed identities from the complete cohort without a price gate', async () => {
    const cache = new MemoryCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);
    for (const coordinate of plan) {
      let records: readonly KoreaRentRecord[] = [];
      if (coordinate.index < 5) {
        records = [{
          ...eligibleRecord(coordinate, coordinate.index),
          legalDong: '청운동',
          buildingLabel: coordinate.index === 0 ? ' 검증   아파트 ' : '검증 아파트',
        }];
      } else if (coordinate.index === 7) {
        records = [{
          ...eligibleRecord(coordinate, 7),
          legalDong: '청운동',
          buildingLabel: '월세 오피스텔',
          areaSqm: 18,
          depositWon: 10_000_000,
          monthlyRentWon: 900_000,
        }];
      } else if (coordinate.index === 21) {
        records = [{
          ...eligibleRecord(coordinate, 21),
          legalDong: '청운동',
          buildingLabel: '대형 단독주택',
          areaSqm: 180,
        }];
      } else if (coordinate.index === 22) {
        records = [{
          ...eligibleRecord(coordinate, 22, 'new', 'cancelled'),
          legalDong: '청운동',
          buildingLabel: '취소 단독주택',
        }];
      } else if (coordinate.index === 23) {
        records = [{ ...eligibleRecord(coordinate, 23), legalDong: '청운동' }];
      }
      await store.write(cache, emptyMonth(coordinate, records));
    }

    const finalized = await finalizeKoreaObservedBuildingInventoryJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    );

    expect(finalized).toMatchObject({
      period: '2026-01/2026-07',
      generatedAt: REFERENCE_INSTANT,
      completedCoordinates: 700,
      inventory: {
        stats: {
          sourceRecordCount: 9,
          observedRecordCount: 7,
          observedBuildingCount: 3,
          cancelledRecordCount: 1,
          missingIdentityRecordCount: 1,
          coordinateReadyCount: 0,
          coordinatePendingCount: 3,
        },
      },
    });
    expect(finalized.inventory.records).toEqual(expect.arrayContaining([
      expect.objectContaining({
        officialName: '검증 아파트',
        housingType: 'apartment',
        observationCount: 5,
      }),
      expect.objectContaining({
        officialName: '월세 오피스텔',
        housingType: 'officetel',
        monthlyObservationCount: 1,
      }),
      expect.objectContaining({
        officialName: '대형 단독주택',
        housingType: 'detached',
      }),
    ]));

    const missingManifest = [...cache.entries.keys()].find((key) =>
      key.includes('lawd=11740') && key.endsWith(':manifest'))!;
    cache.entries.delete(missingManifest);
    await expect(finalizeKoreaObservedBuildingInventoryJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    )).rejects.toThrow('Public summary source coverage is incomplete.');
  }, 30_000);

  it('derives privacy-safe building rows from the complete cached cohort', async () => {
    const cache = new MemoryCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);
    const contractTypes = ['new', 'new', 'new', 'renewal', 'renewal', 'unknown'] as const;
    for (const coordinate of plan) {
      const records = coordinate.index < contractTypes.length
        ? [{
            ...eligibleRecord(coordinate, coordinate.index, contractTypes[coordinate.index]),
            legalDong: '청운동',
            buildingLabel: '검증타워',
          }]
        : [];
      await store.write(cache, emptyMonth(coordinate, records));
    }

    const finalized = await finalizeKoreaPublicBuildingSummaryJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    );

    expect(finalized).toMatchObject({
      period: '2026-01/2026-07', completedCoordinates: 700,
      eligibleRecords: 6, publishedBuildings: 1,
      records: [{
        districtSlug: 'jongno-gu', neighborhoodName: '청운동', name: '검증타워',
        groups: { all: { n: 6 }, new: { n: 3 }, renewal: { n: 2 } },
        unknownContractCount: 1,
      }],
    });
  }, 30_000);

  it('requires all 700 verified months and reports exact eligible counts', async () => {
    const cache = new MemoryCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);
    const types = ['new', 'new', 'new', 'renewal', 'unknown'] as const;
    const statuses = ['active', 'active', 'active', 'unknown', 'active'] as const;
    for (const coordinate of plan) {
      const recordIndex = coordinate.index < 5 ? coordinate.index : -1;
      const records = recordIndex === -1
        ? []
        : [eligibleRecord(coordinate, recordIndex, types[recordIndex], statuses[recordIndex])];
      await store.write(cache, emptyMonth(coordinate, records));
    }

    const finalized = await finalizeKoreaPublicSummaryJob(
      { referenceInstant: REFERENCE_INSTANT },
      {
        cache,
        now: () => new Date(REFERENCE_INSTANT),
        rightsLookup,
      },
    );

    expect(finalized).toMatchObject({
      period: '2026-01/2026-07',
      generatedAt: REFERENCE_INSTANT,
      completedCoordinates: 700,
      eligibleRecords: 5,
      activeRecords: 4,
      unknownStatusRecords: 1,
      newContracts: 3,
      renewalContracts: 1,
      unknownContracts: 1,
      summary: {
        deal: 'jeonse',
        band: '45-55sqm',
        n: 5,
        published: true,
      },
    });

    const firstManifest = [...cache.entries.keys()].find((key) =>
      key.includes('lawd=11110') && key.endsWith(':manifest'))!;
    cache.entries.delete(firstManifest);
    await expect(finalizeKoreaPublicSummaryJob(
      { referenceInstant: REFERENCE_INSTANT },
      {
        cache,
        now: () => new Date(REFERENCE_INSTANT),
        rightsLookup,
      },
    )).rejects.toThrow('Public summary source coverage is incomplete.');
  }, 30_000);

  it('maps provider source errors to the public retryable code', () => {
    expect(new MolitSourceError('source_timeout').code).toBe('source_timeout');
  });

  it('derives the city and all 25 districts from only their legal-code records', async () => {
    const cache = new MemoryCache();
    const store = createSourceMonthStore({
      namespacePrefix: 'signedprice:kr-public-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaPublicSummaryPlan(REFERENCE_INSTANT);
    for (const coordinate of plan) {
      let records: readonly KoreaRentRecord[] = [];
      if (coordinate.index === 1) {
        records = fixedEligibleRecords(coordinate, 5, 200_000_000, 'jongno-prior');
      } else if (coordinate.index === 4) {
        records = fixedEligibleRecords(coordinate, 5, 220_000_000, 'jongno-latest');
      } else if (coordinate.index === 29) {
        records = fixedEligibleRecords(
          coordinate, 4, 200_000_000, 'jung-prior', 'renewal',
        );
      } else if (coordinate.index === 32) {
        records = fixedEligibleRecords(
          coordinate, 5, 220_000_000, 'jung-latest', 'renewal',
        );
      } else if (coordinate.index === 60) {
        records = fixedEligibleRecords(
          coordinate, 4, 900_000_000, 'yongsan-thin', 'unknown',
        );
      }
      await store.write(cache, emptyMonth(coordinate, records));
    }

    const finalized = await finalizeKoreaPublicAreaSummaryJob(
      { referenceInstant: REFERENCE_INSTANT },
      {
        cache,
        now: () => new Date(REFERENCE_INSTANT),
        rightsLookup,
      },
    );

    expect(finalized.groups.all.districtSummaries).toHaveLength(25);
    expect(finalized.groups.all.districtSummaries.map(({ area }) => area)).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    );
    expect(finalized.groups.all.citySummary).toMatchObject({
      area: 'seoul',
      parent: 'kr',
      n: 23,
      published: true,
    });
    expect(finalized.groups.new.citySummary).toMatchObject({
      area: 'seoul',
      n: 10,
      published: true,
      med: 210_000_000,
      chg3m: 10,
    });
    expect(finalized.groups.renewal.citySummary).toMatchObject({
      area: 'seoul',
      n: 9,
      published: true,
      chg3m: null,
    });
    expect(finalized.groups.all.districtSummaries[0]).toMatchObject({
      area: 'jongno-gu',
      parent: 'seoul',
      n: 10,
      published: true,
      med: 210_000_000,
      chg3m: 10,
    });
    expect(finalized.groups.all.districtSummaries[1]).toMatchObject({
      area: 'jung-gu',
      parent: 'seoul',
      n: 9,
      published: true,
      chg3m: null,
    });
    expect(finalized.groups.all.districtSummaries[2]).toEqual({
      marketId: 'kr-seoul',
      area: 'yongsan-gu',
      parent: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
      period: '2026-01/2026-07',
      n: 4,
      published: false,
    });
    expect(JSON.stringify(finalized.groups.all.districtSummaries[2])).not.toMatch(
      /min|p25|med|p75|max|chg3m/,
    );
    expect(finalized.unknownContractCounts).toEqual({
      city: 4,
      districts: [0, 0, 4, ...Array.from({ length: 22 }, () => 0)],
    });
    for (const [index, all] of finalized.groups.all.districtSummaries.entries()) {
      expect(all.n).toBe(
        finalized.groups.new.districtSummaries[index]!.n +
        finalized.groups.renewal.districtSummaries[index]!.n +
        finalized.unknownContractCounts.districts[index]!,
      );
    }
    expect(finalized.groups.all.citySummary.n).toBe(
      finalized.groups.all.districtSummaries.reduce((sum, summary) => sum + summary.n, 0),
    );
    expect(finalized.groups.all.citySummary.n).toBe(
      finalized.groups.new.citySummary.n +
      finalized.groups.renewal.citySummary.n +
      finalized.unknownContractCounts.city,
    );
    expect(Object.isFrozen(finalized)).toBe(true);
    expect(Object.isFrozen(finalized.groups)).toBe(true);
    expect(Object.isFrozen(finalized.groups.all)).toBe(true);
    expect(Object.isFrozen(finalized.groups.all.districtSummaries)).toBe(true);
    expect(Object.isFrozen(finalized.unknownContractCounts)).toBe(true);
    expect(Object.isFrozen(finalized.unknownContractCounts.districts)).toBe(true);

    const missingManifest = [...cache.entries.keys()].find((key) =>
      key.includes('lawd=11740') && key.endsWith(':manifest'))!;
    cache.entries.delete(missingManifest);
    await expect(finalizeKoreaPublicAreaSummaryJob(
      { referenceInstant: REFERENCE_INSTANT },
      {
        cache,
        now: () => new Date(REFERENCE_INSTANT),
        rightsLookup,
      },
    )).rejects.toThrow('Public summary source coverage is incomplete.');
  }, 30_000);
});
