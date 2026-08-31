import { describe, expect, it } from 'vitest';

import {
  KR_MOLIT_RENT_RIGHTS,
  MolitSourceError,
  buildKoreaPublicSummaryPlan,
  createSourceMonthStore,
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
});
