import { describe, expect, it } from 'vitest';

import {
  KR_MOLIT_SALE_RIGHTS,
  buildKoreaSaleSummaryPlan,
  createSaleSourceMonthStore,
  finalizeKoreaSaleSnapshotJob,
  runKoreaSaleSummaryBatch,
  type KoreaSaleRecord,
  type KoreaSaleSummaryCoordinate,
  type MolitFetch,
  type MolitSaleMonth,
  type RuntimeCacheEntryOptions,
  type RuntimeCachePort,
} from '../src';

const REFERENCE_INSTANT = '2026-08-30T00:00:00.000Z';
const JOB_TAG = 'kr-sale-summary-job:v1';

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
  policyId === KR_MOLIT_SALE_RIGHTS.id ? KR_MOLIT_SALE_RIGHTS : undefined;

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
      return { consume() {
        if (remaining <= 0) throw new Error('budget exhausted');
        remaining -= 1;
      } };
    },
  } as const;
}

function month(
  coordinate: KoreaSaleSummaryCoordinate,
  records: readonly KoreaSaleRecord[] = [],
): MolitSaleMonth {
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

function saleRecord(
  coordinate: KoreaSaleSummaryCoordinate,
  index: number,
  recordStatus: KoreaSaleRecord['recordStatus'] = 'active',
): KoreaSaleRecord {
  return {
    sourceHousingType: coordinate.sourceHousingType,
    areaSqm: [20, 40, 60, 85, 120, 50][index] ?? 50,
    priceWon: (index + 1) * 100_000_000,
    contractDate: `${coordinate.dealYmd.slice(0, 4)}-${coordinate.dealYmd.slice(4)}-15`,
    recordStatus,
    sourceRecordId: `sale-${index}`,
    legalDong: '청운동',
    buildingLabel: '전면적 검증아파트',
  };
}

describe('Korea sale coordinate plan', () => {
  it('is a complete and unique 25 × 4 × 7 matrix', () => {
    const plan = buildKoreaSaleSummaryPlan(REFERENCE_INSTANT);
    expect(plan).toHaveLength(700);
    expect(plan[0]).toEqual({
      index: 0,
      lawdCd: '11110',
      sourceHousingType: 'apartment',
      dealYmd: '202601',
    });
    expect(plan[7]).toMatchObject({ sourceHousingType: 'officetel', dealYmd: '202601' });
    expect(plan[21]).toMatchObject({ sourceHousingType: 'detached', dealYmd: '202601' });
    expect(new Set(plan.map((coordinate) =>
      `${coordinate.lawdCd}:${coordinate.sourceHousingType}:${coordinate.dealYmd}`)).size)
      .toBe(700);
  });
});

describe('Korea sale resumable batch', () => {
  it('writes a bounded batch and reuses verified sale coordinates on replay', async () => {
    const cache = new MemoryCache();
    let fetchCalls = 0;
    const fetch: MolitFetch = async () => {
      fetchCalls += 1;
      return response(zeroPage());
    };
    await expect(runKoreaSaleSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      dependencies(cache, fetch),
    )).resolves.toEqual({
      status: 'progress', nextCursor: 4, completedCoordinates: 4, totalCoordinates: 700,
    });
    await runKoreaSaleSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      dependencies(cache, fetch),
    );
    expect(fetchCalls).toBe(4);
  });

  it('returns a categorical access diagnostic and never a provider message', async () => {
    const providerError = `<?xml version="1.0" encoding="UTF-8"?>
<response><header><resultCode>20</resultCode><resultMsg>SECRET PROVIDER MESSAGE</resultMsg></header>
<body><items></items><numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>0</totalCount></body></response>`;
    const result = await runKoreaSaleSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      dependencies(new MemoryCache(), async () => response(providerError)),
    );
    expect(result).toEqual({
      status: 'retryable', nextCursor: 0, completedCoordinates: 0, totalCoordinates: 700,
      code: 'source_malformed', diagnostic: 'provider_access_denied',
    });
    expect(JSON.stringify(result)).not.toContain('SECRET PROVIDER MESSAGE');
  });

  it('blocks collection before fetching when sale rights are unavailable', async () => {
    let fetchCalls = 0;
    const result = await runKoreaSaleSummaryBatch(
      { referenceInstant: REFERENCE_INSTANT, cursor: 0 },
      {
        ...dependencies(new MemoryCache(), async () => {
          fetchCalls += 1;
          return response(zeroPage());
        }),
        rightsLookup: () => undefined,
      },
    );
    expect(result).toMatchObject({ status: 'blocked', code: 'rights_blocked', nextCursor: 0 });
    expect(fetchCalls).toBe(0);
  });
});

describe('Korea sale finalization', () => {
  it('builds the sale artifact model only from complete 700-coordinate coverage', async () => {
    const cache = new MemoryCache();
    const store = createSaleSourceMonthStore({
      namespacePrefix: 'signedprice:kr-sale-summary-job:v1',
      ttlSeconds: 86_400,
      tags: [JOB_TAG],
      corruptTag: JOB_TAG,
    });
    const plan = buildKoreaSaleSummaryPlan(REFERENCE_INSTANT);
    for (const coordinate of plan) {
      const records = coordinate.index < 5
        ? [saleRecord(coordinate, coordinate.index)]
        : coordinate.index === 5
          ? [saleRecord(coordinate, 5, 'cancelled')]
          : [];
      await store.write(cache, month(coordinate, records));
    }

    const finalized = await finalizeKoreaSaleSnapshotJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    );
    expect(finalized).toMatchObject({
      period: '2026-01/2026-07',
      generatedAt: REFERENCE_INSTANT,
      completedCoordinates: 700,
      evidence: { stats: {
        sourceRecordCount: 6,
        eligibleRecordCount: 5,
        cancelledRecordCount: 1,
        observedBuildingCount: 1,
      } },
    });
    const cityAll = finalized.evidence.areaRecords.find(({ areaId }) => areaId === 'seoul:all')!;
    expect(cityAll.cohorts.find(({ areaBand }) => areaBand === 'all')?.price)
      .toMatchObject({ n: 5, published: true });

    const missingManifest = [...cache.entries.keys()].find((key) =>
      key.includes('lawd=11740') && key.endsWith(':manifest'))!;
    cache.entries.delete(missingManifest);
    await expect(finalizeKoreaSaleSnapshotJob(
      { referenceInstant: REFERENCE_INSTANT },
      { cache, now: () => new Date(REFERENCE_INSTANT), rightsLookup },
    )).rejects.toThrow('Sale summary source coverage is incomplete.');
  }, 30_000);
});
