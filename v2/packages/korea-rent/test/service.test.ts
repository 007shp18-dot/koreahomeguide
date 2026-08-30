import { describe, expect, test } from 'vitest';

import { createRightsPolicy, type RightsPolicy } from '@signedprice/market-core';

import {
  KR_MOLIT_RENT_RIGHTS,
  KoreaRentServiceError,
  createSeoulRentCheckService,
  deriveCoverageNamespace,
  type MolitFetch,
  type MolitRightsLookup,
  type ProviderCallBudget,
  type RentCheckQuote,
  type RuntimeCacheEntryOptions,
  type RuntimeCachePort,
  type SeoulRentCheckEnvelope,
} from '../src/index';
import {
  readDerivedCache,
  readSourceMonthCache,
  sourceCacheNamespace,
  writeDerivedCache,
  writeSourceMonthCache,
  type DerivedRentCheckCacheEntry,
  type DerivedRentCheckCachePayload,
} from '../src/cache';
import type { KoreaRentRecord, MolitRentalMonth } from '../src/index';

type StoredEntry = {
  readonly value: unknown;
  readonly expiresAt: number;
  readonly tags: readonly string[];
};

class MemoryRuntimeCache implements RuntimeCachePort {
  readonly entries = new Map<string, StoredEntry>();
  readonly writes: {
    readonly key: string;
    readonly value: unknown;
    readonly options: RuntimeCacheEntryOptions;
  }[] = [];
  onGet: ((key: string) => void) | undefined;
  onSet: ((key: string) => void) | undefined;
  failSet: ((key: string) => boolean) | undefined;
  hardDeleteCalls = 0;

  constructor(private readonly nowMs: () => number) {}

  async get<T>(key: string): Promise<T | null> {
    this.onGet?.(key);
    const entry = this.entries.get(key);
    if (entry === undefined) return null;
    if (entry.expiresAt <= this.nowMs()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options: RuntimeCacheEntryOptions): Promise<void> {
    this.writes.push({ key, value, options });
    if (this.failSet?.(key)) throw new Error('in-memory cache write failure');
    this.entries.set(key, {
      value,
      expiresAt: this.nowMs() + options.ttlSeconds * 1_000,
      tags: [...options.tags],
    });
    this.onSet?.(key);
  }

  async hardDeleteByTag(tag: string): Promise<void> {
    this.hardDeleteCalls += 1;
    for (const [key, entry] of this.entries) {
      if (entry.tags.includes(tag)) this.entries.delete(key);
    }
  }

  deleteWhere(predicate: (key: string) => boolean): void {
    for (const key of this.entries.keys()) {
      if (predicate(key)) this.entries.delete(key);
    }
  }

  value(key: string): unknown {
    return this.entries.get(key)?.value;
  }

  replaceValue(key: string, value: unknown): void {
    const current = this.entries.get(key);
    if (current === undefined) throw new Error('missing in-memory cache entry');
    this.entries.set(key, { ...current, value });
  }
}

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function settleWithin<T>(promise: Promise<T>, timeoutMs = 150): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error('operation did not observe the deadline')), timeoutMs);
    }),
  ]);
}

function sourceRecord(label: string, sourceRecordId: string): KoreaRentRecord {
  return {
    buildingLabel: label,
    sourceHousingType: 'apartment',
    areaSqm: 25,
    depositWon: 10_000_000,
    monthlyRentWon: 900_000,
    contractDate: '2026-08-15',
    contractType: 'new',
    recordStatus: 'active',
    sourceRecordId,
  };
}

function sourceMonth(label: 'A' | 'B', retrievedAt: string): MolitRentalMonth {
  const first = sourceRecord(`${label}1`, `${label}-001`);
  const second = sourceRecord(`${label}2`, `${label}-002`);
  return {
    sourceHousingType: 'apartment',
    lawdCd: '11590',
    dealYmd: '202608',
    pageSize: 1,
    totalCount: 2,
    pages: [
      { pageNo: 1, rows: [first], rowFingerprintDigests: ['1'.repeat(64)] },
      { pageNo: 2, rows: [second], rowFingerprintDigests: ['2'.repeat(64)] },
    ],
    records: [first, second],
    retrievedAt,
  };
}

function anonymousSourceMonth(
  rowFingerprintDigests: readonly [string, string],
): MolitRentalMonth {
  const first: KoreaRentRecord = {
    buildingLabel: 'Raw-distinct row',
    sourceHousingType: 'apartment',
    areaSqm: 25,
    depositWon: 10_000_000,
    monthlyRentWon: 900_000,
    contractDate: '2026-08-15',
    contractType: 'new',
    recordStatus: 'active',
  };
  const second = { ...first };
  return {
    sourceHousingType: 'apartment',
    lawdCd: '11590',
    dealYmd: '202608',
    pageSize: 1,
    totalCount: 2,
    pages: [
      { pageNo: 1, rows: [first], rowFingerprintDigests: [rowFingerprintDigests[0]] },
      { pageNo: 2, rows: [second], rowFingerprintDigests: [rowFingerprintDigests[1]] },
    ],
    records: [first, second],
    retrievedAt: '2026-09-15T00:00:01.000Z',
  } as MolitRentalMonth;
}

class InterleavingRuntimeCache implements RuntimeCachePort {
  private readonly base = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
  private readonly aPageOneWritten = deferred();
  private readonly releaseAWriter = deferred();
  private readonly bManifestWritten = deferred();

  async get<T>(key: string): Promise<T | null> {
    return this.base.get<T>(key);
  }

  async set<T>(key: string, value: T, options: RuntimeCacheEntryOptions): Promise<void> {
    const object = value as Readonly<Record<string, unknown>>;
    const rows = object.rows as readonly KoreaRentRecord[] | undefined;
    const isAPageOne = object.kind === 'kr-molit-rent-source-page-v2' &&
      object.pageNo === 1 && rows?.[0]?.buildingLabel === 'A1';
    if (isAPageOne) {
      await this.base.set(key, value, options);
      this.aPageOneWritten.resolve();
      await this.releaseAWriter.promise;
      return;
    }
    if (object.kind === 'kr-molit-rent-source-page-v2' && rows?.[0]?.buildingLabel?.startsWith('B')) {
      await this.aPageOneWritten.promise;
    }
    await this.base.set(key, value, options);
    if (
      object.kind === 'kr-molit-rent-source-manifest-v2' &&
      object.retrievedAt === '2026-09-15T00:00:02.000Z'
    ) {
      this.bManifestWritten.resolve();
    }
  }

  async hardDeleteByTag(tag: string): Promise<void> {
    return this.base.hardDeleteByTag(tag);
  }

  waitForAPageOne(): Promise<void> {
    return this.aPageOneWritten.promise;
  }

  waitForBManifest(): Promise<void> {
    return this.bManifestWritten.promise;
  }

  releaseA(): void {
    this.releaseAWriter.resolve();
  }
}

function quote(overrides: Partial<RentCheckQuote> = {}): RentCheckQuote {
  return {
    lawdCd: '11590',
    requestedHousingType: 'apartment',
    sourceHousingType: 'apartment',
    depositWon: 10_000_000,
    monthlyRentWon: 950_000,
    areaSqm: 25,
    ...overrides,
  };
}

function completeMonthXml(dealYmd: string): string {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);
  return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <dealSn>APT-${dealYmd}-001</dealSn>
        <dealYear>${year}</dealYear>
        <dealMonth>${month}</dealMonth>
        <dealDay>15</dealDay>
        <deposit>1,000</deposit>
        <monthlyRent>90</monthlyRent>
        <excluUseAr>25.00</excluUseAr>
        <aptNm>Building ${dealYmd}</aptNm>
        <contractType>신규</contractType>
        <cdealType>N</cdealType>
      </item>
    </items>
    <numOfRows>100</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>1</totalCount>
  </body>
</response>`;
}

type Harness = ReturnType<typeof createHarness>;

function createHarness(options: {
  readonly serviceKey?: string;
  readonly policy?: RightsPolicy;
  readonly fetchMode?: 'success' | 'network-failure' | 'malformed';
  readonly delayDealYmdUntilAnotherManifest?: string;
} = {}) {
  let clockMs = Date.parse('2026-09-15T00:00:00.000Z');
  let nowOffsetMs = 0;
  let activeFetches = 0;
  let maximumFetches = 0;
  let providerCalls = 0;
  let fetchMode = options.fetchMode ?? 'success';
  let currentPolicy = options.policy ?? KR_MOLIT_RENT_RIGHTS;
  let requestedDeadlineMs: number | undefined;
  const attemptTimeouts: number[] = [];
  const budgetLimits: number[] = [];
  let budgetAttempts = 0;
  const cache = new MemoryRuntimeCache(() => clockMs);
  const neverAborts = new AbortController().signal;
  const anotherManifestWritten = deferred();
  if (options.delayDealYmdUntilAnotherManifest !== undefined) {
    cache.onSet = (key) => {
      if (key.endsWith(':manifest') &&
        !key.includes(`month=${options.delayDealYmdUntilAnotherManifest}`)) {
        anotherManifestWritten.resolve();
      }
    };
  }

  const fetcher: MolitFetch = async (input) => {
    providerCalls += 1;
    activeFetches += 1;
    maximumFetches = Math.max(maximumFetches, activeFetches);
    await Promise.resolve();
    activeFetches -= 1;
    if (fetchMode === 'network-failure') throw new Error('provider failed with secret detail');
    if (fetchMode === 'malformed') {
      return new Response('<response><header></response>', { status: 200 });
    }
    const url = new URL(String(input));
    if (url.searchParams.get('DEAL_YMD') === options.delayDealYmdUntilAnotherManifest) {
      await anotherManifestWritten.promise;
    }
    return new Response(completeMonthXml(url.searchParams.get('DEAL_YMD')!), { status: 200 });
  };
  const lookup: MolitRightsLookup = (policyId) =>
    currentPolicy.id === policyId ? currentPolicy : undefined;

  const service = createSeoulRentCheckService({
    serviceKey: options.serviceKey ?? 'server-only-service-key',
    cache,
    fetch: fetcher,
    rightsLookup: lookup,
    now() {
      const value = new Date(clockMs + nowOffsetMs);
      nowOffsetMs += 1_000;
      return value;
    },
    createDeadlineSignal(timeoutMs) {
      requestedDeadlineMs = timeoutMs;
      return neverAborts;
    },
    createAttemptSignal(timeoutMs) {
      attemptTimeouts.push(timeoutMs);
      return neverAborts;
    },
    createProviderBudget(limit): ProviderCallBudget {
      budgetLimits.push(limit);
      return {
        consume() {
          if (budgetAttempts >= limit) {
            throw new KoreaRentServiceError('source_unavailable');
          }
          budgetAttempts += 1;
        },
      };
    },
  });

  return {
    service,
    cache,
    get providerCalls() {
      return providerCalls;
    },
    get maximumFetches() {
      return maximumFetches;
    },
    get requestedDeadlineMs() {
      return requestedDeadlineMs;
    },
    get attemptTimeouts() {
      return [...attemptTimeouts];
    },
    get budgetLimits() {
      return [...budgetLimits];
    },
    get budgetAttempts() {
      return budgetAttempts;
    },
    advance(milliseconds: number) {
      clockMs += milliseconds;
      nowOffsetMs = 0;
    },
    setFetchMode(mode: 'success' | 'network-failure' | 'malformed') {
      fetchMode = mode;
    },
    setPolicy(policy: RightsPolicy) {
      currentPolicy = policy;
    },
  };
}

function policy(overrides: Partial<RightsPolicy>): RightsPolicy {
  return createRightsPolicy({
    ...KR_MOLIT_RENT_RIGHTS,
    ...overrides,
    id: overrides.id ?? KR_MOLIT_RENT_RIGHTS.id,
  });
}

function derivedKeys(harness: Harness): string[] {
  return [...harness.cache.entries.keys()].filter((key) => key.includes(':derived:'));
}

async function seedMedianFallbackCache(
  harness: Harness,
  canonicalQuote: RentCheckQuote,
  tuple: {
    readonly rating: 'below' | 'fair' | 'above';
    readonly medianValueWon: number;
    readonly differencePct: number;
  },
): Promise<void> {
  await harness.service.check(canonicalQuote);
  const key = derivedKeys(harness)[0]!;
  const stored = structuredClone(
    harness.cache.value(key),
  ) as DerivedRentCheckCacheEntry;
  const { contentDigest: _contentDigest, ...payload } = stored;
  const comparables = payload.envelope.comparables.slice(0, 3);
  const medianFallback: DerivedRentCheckCachePayload = {
    ...payload,
    envelope: {
      ...payload.envelope,
      coverage: { ...payload.envelope.coverage, monthsUsed: 12 },
      methodology: {
        ...payload.envelope.methodology,
        verdictBasis: 'median-fallback',
        eligibleContractTypeCounts: { new: 3, renewal: 0, unknown: 0 },
        selectedContractTypeCounts: { new: 3, renewal: 0, unknown: 0 },
        sourceRecordStatusCounts: { active: 3, cancelled: 0, unknown: 0 },
      },
      result: {
        ...payload.envelope.result,
        rating: tuple.rating,
        comparableCount: 3,
        medianValueWon: tuple.medianValueWon,
        minValueWon: null,
        p25ValueWon: null,
        p75ValueWon: null,
        maxValueWon: null,
        differencePct: tuple.differencePct,
        percentileRank: null,
        verdictBasis: 'median-fallback',
        confidence: 'low',
        monthsUsed: 12,
        tier: 3,
      },
      comparables,
    },
  };
  await writeDerivedCache(harness.cache, key, medianFallback);
}

function sourceKeys(harness: Harness): string[] {
  return [...harness.cache.entries.keys()].filter((key) => key.includes(':source:'));
}

function createSharedRequestHarness() {
  const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
  const releaseProvider = deferred();
  const callWaiters: { readonly count: number; readonly resolve: () => void }[] = [];
  const sourceReadWaiters: { readonly count: number; readonly resolve: () => void }[] = [];
  let providerCalls = 0;
  let sourceManifestReads = 0;
  let fetchMode: 'success' | 'network-failure' = 'success';
  cache.onGet = (key) => {
    if (!key.includes(':source:') || !key.endsWith(':manifest')) return;
    sourceManifestReads += 1;
    for (const waiter of sourceReadWaiters) {
      if (sourceManifestReads >= waiter.count) waiter.resolve();
    }
  };

  const fetcher: MolitFetch = async (input) => {
    providerCalls += 1;
    for (const waiter of callWaiters) {
      if (providerCalls >= waiter.count) waiter.resolve();
    }
    await releaseProvider.promise;
    if (fetchMode === 'network-failure') throw new Error('provider unavailable');
    const url = new URL(String(input));
    return new Response(completeMonthXml(url.searchParams.get('DEAL_YMD')!), { status: 200 });
  };

  function createService(options: {
    readonly deadlineSignal?: AbortSignal;
    readonly initialPolicy?: RightsPolicy;
  } = {}) {
    let currentPolicy = options.initialPolicy ?? KR_MOLIT_RENT_RIGHTS;
    let budgetAttempts = 0;
    const neverAborts = new AbortController().signal;
    const service = createSeoulRentCheckService({
      serviceKey: 'server-only-service-key',
      cache,
      fetch: fetcher,
      now: () => new Date('2026-09-15T00:00:00.000Z'),
      rightsLookup: (policyId) => currentPolicy.id === policyId ? currentPolicy : undefined,
      createDeadlineSignal: () => options.deadlineSignal ?? neverAborts,
      createAttemptSignal: () => neverAborts,
      createProviderBudget(limit) {
        return {
          consume() {
            if (budgetAttempts >= limit) throw new KoreaRentServiceError('source_unavailable');
            budgetAttempts += 1;
          },
        };
      },
    });
    return {
      service,
      get budgetAttempts() {
        return budgetAttempts;
      },
      setPolicy(nextPolicy: RightsPolicy) {
        currentPolicy = nextPolicy;
      },
    };
  }

  return {
    cache,
    createService,
    get providerCalls() {
      return providerCalls;
    },
    release() {
      releaseProvider.resolve();
    },
    setFetchMode(mode: 'success' | 'network-failure') {
      fetchMode = mode;
    },
    async waitForProviderCalls(count: number) {
      if (providerCalls >= count) return;
      await new Promise<void>((resolve) => callWaiters.push({ count, resolve }));
    },
    async waitForSourceManifestReads(count: number) {
      if (sourceManifestReads >= count) return;
      await new Promise<void>((resolve) => sourceReadWaiters.push({ count, resolve }));
    },
  };
}

const SERVICE_EXISTS = typeof createSeoulRentCheckService === 'function';

describe('coverage namespace', () => {
  test('publishes a pre-lookup coverage namespace derivation', () => {
    expect(deriveCoverageNamespace).toBeTypeOf('function');
  });

  test.runIf(SERVICE_EXISTS)('rolls over at the Asia/Seoul completed-month boundary only', () => {
    expect(deriveCoverageNamespace('2026-08-31T14:59:59.999Z')).toBe(
      'kr-seoul-rent-coverage-v2:through=2026-07:months=12',
    );
    expect(deriveCoverageNamespace('2026-08-31T15:00:00.000Z')).toBe(
      'kr-seoul-rent-coverage-v2:through=2026-08:months=12',
    );
    expect(deriveCoverageNamespace('2026-09-29T12:00:00.000Z')).toBe(
      'kr-seoul-rent-coverage-v2:through=2026-08:months=12',
    );
  });
});

describe('atomic source cache generations', () => {
  const cacheInput = {
    sourceHousingType: 'apartment',
    lawdCd: '11590',
    dealYmd: '202608',
    pageSize: 1,
  } as const;

  test('keeps the old complete generation visible when a refresh fails mid-write', async () => {
    const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
    await writeSourceMonthCache(cache, sourceMonth('A', '2026-09-15T00:00:01.000Z'));
    cache.failSet = (key) => key.includes(':page=2');

    await writeSourceMonthCache(cache, sourceMonth('B', '2026-09-15T00:00:02.000Z'));

    const visible = await readSourceMonthCache(cache, cacheInput);
    expect(visible?.records.map((record) => record.buildingLabel)).toEqual(['A1', 'A2']);
    expect(visible?.retrievedAt).toBe('2026-09-15T00:00:01.000Z');
  });

  test('interleaved writers publish only their own complete immutable generations', async () => {
    const cache = new InterleavingRuntimeCache();
    const writerA = writeSourceMonthCache(cache, sourceMonth('A', '2026-09-15T00:00:01.000Z'));
    await cache.waitForAPageOne();
    const writerB = writeSourceMonthCache(cache, sourceMonth('B', '2026-09-15T00:00:02.000Z'));
    await cache.waitForBManifest();

    const whileBIsPublished = await readSourceMonthCache(cache, cacheInput);
    expect(whileBIsPublished?.records.map((record) => record.buildingLabel)).toEqual(['B1', 'B2']);

    cache.releaseA();
    await Promise.all([writerA, writerB]);
    const afterAIsPublished = await readSourceMonthCache(cache, cacheInput);
    expect(afterAIsPublished?.records.map((record) => record.buildingLabel)).toEqual(['A1', 'A2']);

    expect(sourceCacheNamespace(cacheInput)).toContain('month=202608');
  });
});

describe('source cache runtime validation', () => {
  const cacheInput = {
    sourceHousingType: 'apartment',
    lawdCd: '11590',
    dealYmd: '202608',
    pageSize: 1,
  } as const;

  type MutableManifest = {
    retrievedAt: string;
    totalCount: number;
    chunkKeys: string[];
  };
  type MutablePage = { rows: KoreaRentRecord[]; rowFingerprintDigests: string[] };

  test.each([
    ['noncanonical retrieval timestamp', (manifest: MutableManifest) => {
      manifest.retrievedAt = '2026-09-15';
    }],
    ['manifest total inconsistent with its pages', (manifest: MutableManifest) => {
      manifest.totalCount = 3;
    }],
    ['torn first page', (_manifest: MutableManifest, first: MutablePage) => {
      first.rows = [];
    }],
    ['wrong-month source record', (_manifest: MutableManifest, first: MutablePage) => {
      first.rows[0] = { ...first.rows[0]!, contractDate: '2026-07-15' };
    }],
    ['invalid monetary source record', (_manifest: MutableManifest, first: MutablePage) => {
      first.rows[0] = { ...first.rows[0]!, depositWon: -1 };
    }],
    ['misaligned raw fingerprint digests', (_manifest: MutableManifest, first: MutablePage) => {
      first.rowFingerprintDigests = [];
    }],
    ['tampered raw fingerprint digest', (_manifest: MutableManifest, first: MutablePage) => {
      first.rowFingerprintDigests[0] = 'f'.repeat(64);
    }],
    [
      'conflicting stable source identity',
      (_manifest: MutableManifest, first: MutablePage, second: MutablePage) => {
        second.rows[0] = {
          ...second.rows[0]!,
          sourceRecordId: first.rows[0]!.sourceRecordId,
          monthlyRentWon: 901_000,
        };
      },
    ],
  ] as const)('rejects and hard-deletes a %s cache generation', async (_label, mutate) => {
    const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
    await writeSourceMonthCache(cache, sourceMonth('A', '2026-09-15T00:00:01.000Z'));
    const manifestKey = `${sourceCacheNamespace(cacheInput)}:manifest`;
    const manifest = structuredClone(cache.value(manifestKey)) as MutableManifest;
    const first = structuredClone(cache.value(manifest.chunkKeys[0]!)) as MutablePage;
    const second = structuredClone(cache.value(manifest.chunkKeys[1]!)) as MutablePage;
    mutate(manifest, first, second);
    cache.replaceValue(manifestKey, manifest);
    cache.replaceValue(manifest.chunkKeys[0]!, first);
    cache.replaceValue(manifest.chunkKeys[1]!, second);

    await expect(readSourceMonthCache(cache, cacheInput)).resolves.toBeNull();
    expect(cache.hardDeleteCalls).toBe(1);
    expect(cache.entries.size).toBe(0);
  });

  test('replays normalized-identical raw-distinct anonymous rows with persisted identity digests', async () => {
    const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
    const month = anonymousSourceMonth(['a'.repeat(64), 'b'.repeat(64)]);

    await writeSourceMonthCache(cache, month);
    const replayed = await readSourceMonthCache(cache, cacheInput);

    expect(replayed?.records).toHaveLength(2);
    expect(replayed?.records[0]).toEqual(replayed?.records[1]);
    expect(replayed?.pages.map((page) => page.rowFingerprintDigests)).toEqual([
      ['a'.repeat(64)],
      ['b'.repeat(64)],
    ]);
  });

  test('rejects an exact anonymous raw overlap reconstructed from immutable chunks', async () => {
    const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
    const month = anonymousSourceMonth(['a'.repeat(64), 'a'.repeat(64)]);

    await writeSourceMonthCache(cache, month);

    await expect(readSourceMonthCache(cache, cacheInput)).resolves.toBeNull();
    expect(cache.hardDeleteCalls).toBe(1);
  });

  test('deduplicates an exact stable-ID overlap reconstructed from immutable chunks', async () => {
    const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
    const original = sourceMonth('A', '2026-09-15T00:00:01.000Z');
    const first = original.pages[0]!.rows[0]!;
    const month: MolitRentalMonth = {
      ...original,
      pages: [
        original.pages[0]!,
        { pageNo: 2, rows: [first], rowFingerprintDigests: ['1'.repeat(64)] },
      ],
      records: [first],
    };

    await writeSourceMonthCache(cache, month);

    await expect(readSourceMonthCache(cache, cacheInput)).resolves.toMatchObject({
      records: [first],
    });
    expect(cache.hardDeleteCalls).toBe(0);
  });
});

describe('versioned cache-aware Seoul Rent Check service', () => {
  test.each([
    [0, null],
    [1, '2026-08'],
    [2, '2026-07'],
  ] as const)(
    'accepts a derived insufficient %i-record entry with private latest-month provenance',
    async (comparableCount, latestContractMonth) => {
      const harness = createHarness();
      const canonicalQuote = quote();
      await harness.service.check(canonicalQuote);
      const key = derivedKeys(harness)[0]!;
      const stored = harness.cache.value(key) as DerivedRentCheckCacheEntry;
      const { contentDigest: _contentDigest, ...payload } = stored;
      const insufficient: DerivedRentCheckCachePayload = {
        ...payload,
        envelope: {
          ...payload.envelope,
          status: 'insufficient',
          coverage: {
            ...payload.envelope.coverage,
            latestContractMonth,
            monthsUsed: 12,
          },
          methodology: {
            ...payload.envelope.methodology,
            verdictBasis: null,
            contractSelection: comparableCount === 0 ? null : 'mixed',
            eligibleContractTypeCounts: { new: comparableCount, renewal: 0, unknown: 0 },
            selectedContractTypeCounts: { new: comparableCount, renewal: 0, unknown: 0 },
            sourceRecordStatusCounts: { active: comparableCount, cancelled: 0, unknown: 0 },
          },
          result: {
            ...payload.envelope.result,
            rating: 'insufficient',
            comparableCount,
            medianValueWon: null,
            minValueWon: null,
            p25ValueWon: null,
            p75ValueWon: null,
            maxValueWon: null,
            differencePct: null,
            percentileRank: null,
            verdictBasis: null,
            confidence: null,
            monthsUsed: 12,
            tier: null,
          },
          comparables: [],
        },
      };
      await writeDerivedCache(harness.cache, key, insufficient);

      await expect(readDerivedCache(
        harness.cache,
        key,
        insufficient.coverageNamespace,
        canonicalQuote,
      )).resolves.toMatchObject({
        envelope: { coverage: { latestContractMonth }, result: { comparableCount } },
      });
    },
  );

  test('coalesces identical cold source work across fresh service instances', async () => {
    const harness = createSharedRequestHarness();
    const first = harness.createService();
    const second = harness.createService();
    const firstCheck = first.service.check(quote());
    await harness.waitForProviderCalls(3);
    const secondCheck = second.service.check(quote());
    await harness.waitForSourceManifestReads(6);

    harness.release();
    const results = await Promise.all([firstCheck, secondCheck]);

    expect(results.map((result) => result.envelope.status)).toEqual(['success', 'success']);
    expect(harness.providerCalls).toBe(12);
    expect(first.budgetAttempts + second.budgetAttempts).toBe(12);
  });

  test('does not coalesce distinct exact source-cache namespaces', async () => {
    const harness = createSharedRequestHarness();
    const first = harness.createService();
    const second = harness.createService();
    const firstCheck = first.service.check(quote());
    await harness.waitForProviderCalls(3);
    const secondCheck = second.service.check(quote({ lawdCd: '11680' }));
    await harness.waitForSourceManifestReads(6);

    harness.release();
    await Promise.all([firstCheck, secondCheck]);

    expect(harness.providerCalls).toBe(24);
    expect(first.budgetAttempts).toBe(12);
    expect(second.budgetAttempts).toBe(12);
  });

  test('cleans rejected shared work so the exact source key can retry', async () => {
    const harness = createSharedRequestHarness();
    harness.setFetchMode('network-failure');
    const first = harness.createService();
    const second = harness.createService();
    const firstCheck = first.service.check(quote());
    await harness.waitForProviderCalls(3);
    const secondCheck = second.service.check(quote());
    await harness.waitForSourceManifestReads(6);
    harness.release();

    const rejected = await Promise.allSettled([firstCheck, secondCheck]);
    expect(rejected.every((result) => result.status === 'rejected' &&
      result.reason instanceof KoreaRentServiceError &&
      result.reason.code === 'source_unavailable')).toBe(true);
    expect(harness.providerCalls).toBe(9);

    harness.setFetchMode('success');
    await expect(first.service.check(quote())).resolves.toMatchObject({ cacheStatus: 'miss' });
    expect(harness.providerCalls).toBe(21);
  });

  test('keeps each coalesced waiter bound to its own total deadline', async () => {
    const harness = createSharedRequestHarness();
    const waiterDeadline = new AbortController();
    const leader = harness.createService();
    const waiter = harness.createService({ deadlineSignal: waiterDeadline.signal });
    const leaderCheck = leader.service.check(quote());
    await harness.waitForProviderCalls(3);
    const waiterCheck = waiter.service.check(quote());
    const waiterResult = expect(settleWithin(waiterCheck)).rejects.toMatchObject({
      code: 'source_timeout',
    });
    await harness.waitForSourceManifestReads(6);
    waiterDeadline.abort();

    await waiterResult;
    harness.release();
    await expect(leaderCheck).resolves.toMatchObject({ cacheStatus: 'miss' });
    expect(harness.providerCalls).toBe(12);
    expect(leader.budgetAttempts + waiter.budgetAttempts).toBe(12);
  });

  test('rechecks current rights independently for every coalesced waiter', async () => {
    const harness = createSharedRequestHarness();
    const leader = harness.createService();
    const waiter = harness.createService();
    const leaderCheck = leader.service.check(quote());
    await harness.waitForProviderCalls(3);
    const waiterCheck = waiter.service.check(quote());
    const waiterResult = expect(waiterCheck).rejects.toMatchObject({ code: 'rights_blocked' });
    await harness.waitForSourceManifestReads(6);
    waiter.setPolicy(policy({ canDisplay: false }));
    harness.release();

    await Promise.all([
      expect(leaderCheck).resolves.toMatchObject({ cacheStatus: 'miss' }),
      waiterResult,
    ]);
    expect(harness.providerCalls).toBe(12);
  });

  test.runIf(SERVICE_EXISTS)(
    'writes complete source pages before atomic manifests with exact TTL, keys, tags, and bounded provider work',
    async () => {
      const harness = createHarness({ delayDealYmdUntilAnotherManifest: '202608' });
      const checked = await harness.service.check(quote());

      expect(checked.cacheStatus).toBe('miss');
      expect(checked.envelope).toMatchObject({
        marketId: 'kr-seoul',
        status: 'success',
        source: {
          provider: 'MOLIT',
          dataset: 'Apartment rental contracts',
          endpointVersion: 'v1',
          parserVersion: 'kr-molit-rent-parser-v2',
          rightsPolicyId: 'kr-molit-rent-v1',
          attribution: KR_MOLIT_RENT_RIGHTS.attribution,
        },
        coverage: {
          basis: 'contract_date',
          timezone: 'Asia/Seoul',
          coverageThroughMonth: '2026-08',
          latestContractMonth: '2026-08',
          monthsUsed: 6,
        },
        methodology: {
          policyId: 'kr-rent-check-quote-normalization',
          version: 1,
        },
      });
      expect(checked.envelope.coverage.sourceRetrievedAt.earliest).toBe(
        '2026-09-15T00:00:01.000Z',
      );
      expect(checked.envelope.coverage.sourceRetrievedAt.latest).toBe(
        '2026-09-15T00:00:06.000Z',
      );

      const sourceWrites = harness.cache.writes.filter((write) => write.key.includes(':source:'));
      const sourcePageWrites = sourceWrites.filter((write) => write.key.includes(':page='));
      const sourceManifestWrites = sourceWrites.filter((write) => write.key.endsWith(':manifest'));
      expect(sourcePageWrites).toHaveLength(12);
      expect(sourceManifestWrites).toHaveLength(12);
      expect(sourceWrites.every((write) => write.options.ttlSeconds === 86_400)).toBe(true);
      for (const manifest of sourceManifestWrites) {
        const chunkKeys = (manifest.value as { readonly chunkKeys: readonly string[] }).chunkKeys;
        const manifestIndex = harness.cache.writes.indexOf(manifest);
        const pageIndices = harness.cache.writes
          .map((write, index) => ({ write, index }))
          .filter(({ write }) => chunkKeys.includes(write.key))
          .map(({ index }) => index);
        expect(pageIndices.length).toBeGreaterThan(0);
        expect(pageIndices.every((index) => index < manifestIndex)).toBe(true);
      }

      const sourceNamespace = sourceManifestWrites.find((write) =>
        write.key.includes('month=202608'))!.key;
      expect(sourceNamespace).toContain('market=kr-seoul');
      expect(sourceNamespace).toContain('endpoint=v1');
      expect(sourceNamespace).toContain('type=apartment');
      expect(sourceNamespace).toContain('lawd=11590');
      expect(sourceNamespace).toContain('month=202608');
      expect(sourceNamespace).toContain('pageSize=100');
      expect(sourceNamespace).toContain('parser=kr-molit-rent-parser-v2');
      expect(sourceNamespace).toContain('rights=kr-molit-rent-v1');

      const allWrites = harness.cache.writes;
      for (const write of allWrites) {
        expect(write.options.tags).toEqual([
          'kr-seoul-rent-check',
          'market:kr-seoul',
          'parser:kr-molit-rent-parser-v2',
          'methodology:kr-rent-check-quote-normalization:1',
          'rights:kr-molit-rent-v1',
        ]);
      }
      expect(harness.requestedDeadlineMs).toBe(55_000);
      expect(harness.attemptTimeouts).toEqual(Array(12).fill(5_000));
      expect(harness.budgetLimits).toEqual([48]);
      expect(harness.budgetAttempts).toBe(12);
      expect(harness.maximumFetches).toBeLessThanOrEqual(3);
    },
  );

  test.runIf(SERVICE_EXISTS)('includes the canonical quote and every policy namespace in the derived key', async () => {
    const harness = createHarness();
    await harness.service.check(quote());

    const key = derivedKeys(harness)[0]!;
    expect(key).toContain('lawd=11590');
    expect(key).toContain('requested=apartment');
    expect(key).toContain('source=apartment');
    expect(key).toContain('deposit=10000000');
    expect(key).toContain('rent=950000');
    expect(key).toContain('area=25');
    expect(key).toContain('coverage=kr-seoul-rent-coverage-v2%3Athrough%3D2026-08%3Amonths%3D12');
    expect(key).toContain('parser=kr-molit-rent-parser-v2');
    expect(key).toContain('methodology=kr-rent-check-quote-normalization');
    expect(key).toContain('methodologyVersion=1');
    expect(key).toContain('methodologyCacheVersion=2');
    expect(key).toContain('rights=kr-molit-rent-v1');
  });

  test.runIf(SERVICE_EXISTS)('binds the complete canonical quote inside the derived entry', async () => {
    const harness = createHarness();
    const canonicalQuote = quote();
    await harness.service.check(canonicalQuote);

    const stored = harness.cache.value(derivedKeys(harness)[0]!) as {
      readonly canonicalQuote?: RentCheckQuote;
    };
    expect(stored.canonicalQuote).toEqual(canonicalQuote);
  });

  type MutableDerivedEntry = {
    canonicalQuote: RentCheckQuote;
    freshUntil: string;
    staleUntil: string;
    envelope: SeoulRentCheckEnvelope;
  };

  test.runIf(SERVICE_EXISTS).each([
    ['canonical quote mismatch', (entry: MutableDerivedEntry) => {
      entry.canonicalQuote = quote({ monthlyRentWon: 1 });
    }],
    ['embedded parser version mismatch', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        source: { ...entry.envelope.source, parserVersion: 'fabricated-parser' },
      };
    }],
    ['embedded rights version mismatch', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        source: { ...entry.envelope.source, rightsPolicyId: 'alternate-policy' },
      };
    }],
    ['fabricated source attribution', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        source: { ...entry.envelope.source, attribution: ['Fabricated provider'] },
      };
    }],
    ['coverage namespace mismatch', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        coverage: { ...entry.envelope.coverage, coverageThroughMonth: '2026-07' },
      };
    }],
    ['result and comparable count mismatch', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        result: {
          ...entry.envelope.result,
          comparableCount: entry.envelope.result.comparableCount + 1,
        },
      };
    }],
    ['rating contradicts its published distribution', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        result: { ...entry.envelope.result, rating: 'below' },
      };
    }],
    ['difference contradicts asking and median', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        result: { ...entry.envelope.result, differencePct: 42 },
      };
    }],
    ['inverted result distribution', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        result: {
          ...entry.envelope.result,
          p25ValueWon: 1_000_000,
          p75ValueWon: 800_000,
        },
      };
    }],
    ['cancelled public comparable', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        comparables: [
          { ...entry.envelope.comparables[0]!, recordStatus: 'cancelled' as 'active' },
          ...entry.envelope.comparables.slice(1),
        ],
      };
    }],
    ['comparable contract type disagrees with selected counts', (entry: MutableDerivedEntry) => {
      entry.envelope = {
        ...entry.envelope,
        comparables: [
          { ...entry.envelope.comparables[0]!, contractType: 'renewal' },
          ...entry.envelope.comparables.slice(1),
        ],
      };
    }],
    ['inverted fresh and stale instants', (entry: MutableDerivedEntry) => {
      entry.freshUntil = '2026-09-15T02:00:00.000Z';
      entry.staleUntil = '2026-09-15T01:00:00.000Z';
    }],
    ['insufficient status with successful result', (entry: MutableDerivedEntry) => {
      entry.envelope = { ...entry.envelope, status: 'insufficient' };
    }],
    ['fabricated limitation disclosure', (entry: MutableDerivedEntry) => {
      entry.envelope = { ...entry.envelope, limitations: ['Everything is guaranteed.'] };
    }],
  ] as const)('rejects and hard-deletes a corrupt derived entry: %s', async (_label, mutate) => {
    const harness = createHarness();
    await harness.service.check(quote());
    const key = derivedKeys(harness)[0]!;
    const corrupt = structuredClone(harness.cache.value(key)) as MutableDerivedEntry;
    mutate(corrupt);
    harness.cache.replaceValue(key, corrupt);
    const providerCallsBefore = harness.providerCalls;

    const checked = await harness.service.check(quote());

    expect(checked.cacheStatus).toBe('miss');
    expect(harness.providerCalls).toBeGreaterThan(providerCallsBefore);
    expect(harness.cache.hardDeleteCalls).toBe(1);
  });

  test.runIf(SERVICE_EXISTS)('serves a fresh derived hit without a provider call', async () => {
    const harness = createHarness();
    const first = await harness.service.check(quote());
    const callsAfterMiss = harness.providerCalls;
    const second = await harness.service.check(quote());

    expect(first.cacheStatus).toBe('miss');
    expect(second.cacheStatus).toBe('hit');
    expect(second.envelope).toEqual(first.envelope);
    expect(harness.providerCalls).toBe(callsAfterMiss);
  });

  test.runIf(SERVICE_EXISTS).each([
    ['above-only upper boundary', 1_100_200, 10],
    ['below-only lower boundary', 899_800, -10],
  ] as const)(
    'rejects a median-fallback fair tuple whose raw interval is %s',
    async (_label, askingValueWon, differencePct) => {
      const harness = createHarness();
      const canonicalQuote = quote({ monthlyRentWon: askingValueWon });
      await seedMedianFallbackCache(harness, canonicalQuote, {
        rating: 'fair',
        medianValueWon: 1_000_000,
        differencePct,
      });
      const providerCallsBefore = harness.providerCalls;

      const checked = await harness.service.check(canonicalQuote);

      expect(checked.cacheStatus).toBe('miss');
      expect(harness.providerCalls).toBeGreaterThan(providerCallsBefore);
      expect(harness.cache.hardDeleteCalls).toBe(1);
    },
  );

  test.runIf(SERVICE_EXISTS)(
    'accepts public 10.0 and fair when their raw median interval intersects below 10',
    async () => {
      const harness = createHarness();
      const canonicalQuote = quote({ monthlyRentWon: 1_099_800 });
      await seedMedianFallbackCache(harness, canonicalQuote, {
        rating: 'fair',
        medianValueWon: 1_000_000,
        differencePct: 10,
      });
      const providerCallsBefore = harness.providerCalls;

      const checked = await harness.service.check(canonicalQuote);

      expect(checked.cacheStatus).toBe('hit');
      expect(harness.providerCalls).toBe(providerCallsBefore);
      expect(harness.cache.hardDeleteCalls).toBe(0);
    },
  );

  test.runIf(SERVICE_EXISTS)('hard-deletes all source and derived entries through the stable port tag', async () => {
    const harness = createHarness();
    await harness.service.check(quote());
    expect(harness.cache.entries.size).toBeGreaterThan(0);

    await harness.cache.hardDeleteByTag('kr-seoul-rent-check');
    expect(harness.cache.entries.size).toBe(0);

    const callsBefore = harness.providerCalls;
    const result = await harness.service.check(quote());
    expect(result.cacheStatus).toBe('miss');
    expect(harness.providerCalls).toBeGreaterThan(callsBefore);
  });

  test.runIf(SERVICE_EXISTS).each([
    ['canStore', policy({ canStore: false })],
    ['retention approval', policy({ retention: 'not approved' })],
    ['retention bound', policy({ retention: '23 hours' })],
  ])('rejects missing source-storage %s before provider loading', async (_label, currentPolicy) => {
    const harness = createHarness({ policy: currentPolicy });

    await expect(harness.service.check(quote())).rejects.toMatchObject({ code: 'rights_blocked' });
    expect(harness.providerCalls).toBe(0);
    expect(harness.cache.writes).toHaveLength(0);
  });

  test.runIf(SERVICE_EXISTS)(
    'never publishes an incomplete source manifest and cannot serve its orphaned page chunks',
    async () => {
      const harness = createHarness();
      let failedSourceNamespace: string | undefined;
      harness.cache.failSet = (key) => {
        if (
          failedSourceNamespace === undefined &&
          key.includes(':source:') &&
          key.includes(':page=1')
        ) {
          failedSourceNamespace = key.slice(0, key.indexOf(':generation='));
          return true;
        }
        return false;
      };

      await harness.service.check(quote());
      expect(failedSourceNamespace).toBeDefined();
      expect(harness.cache.entries.has(`${failedSourceNamespace}:manifest`)).toBe(false);

      harness.cache.failSet = undefined;
      harness.cache.deleteWhere((key) => key.includes(':derived:'));
      const callsBefore = harness.providerCalls;
      await harness.service.check(quote());
      expect(harness.providerCalls - callsBefore).toBe(1);
    },
  );

  test.runIf(SERVICE_EXISTS)('revalidates synchronously after freshness and does not label success as stale', async () => {
    const harness = createHarness();
    await harness.service.check(quote());
    const callsBefore = harness.providerCalls;
    harness.advance(16 * 60 * 1_000);

    const result = await harness.service.check(quote());
    expect(result.cacheStatus).toBe('miss');
    expect(harness.providerCalls).toBe(callsBefore);
    expect(derivedKeys(harness)).toHaveLength(1);
  });

  test.runIf(SERVICE_EXISTS)(
    'serves labelled stale only after failed revalidation and only inside 60 minutes',
    async () => {
      const harness = createHarness();
      const original = await harness.service.check(quote());
      harness.advance(16 * 60 * 1_000);
      harness.cache.deleteWhere((key) => key.includes(':source:'));
      harness.setFetchMode('network-failure');

      const stale = await harness.service.check(quote());
      expect(stale.cacheStatus).toBe('stale');
      expect(stale.envelope).toEqual(original.envelope);

      harness.advance(45 * 60 * 1_000);
      await expect(harness.service.check(quote())).rejects.toMatchObject({
        code: 'source_unavailable',
      });
    },
  );

  test.runIf(SERVICE_EXISTS)(
    'does not serve stale when revalidation succeeded but the derived write hit the deadline',
    async () => {
      const derivedSetStarted = deferred();
      const releaseDerivedSets = deferred();
      class BlockingDerivedCache extends MemoryRuntimeCache {
        blockDerivedWrites = false;

        override async set<T>(
          key: string,
          value: T,
          options: RuntimeCacheEntryOptions,
        ): Promise<void> {
          if (this.blockDerivedWrites && key.includes(':derived:')) {
            derivedSetStarted.resolve();
            await releaseDerivedSets.promise;
          }
          return super.set(key, value, options);
        }
      }
      let clockMs = Date.parse('2026-09-15T00:00:00.000Z');
      let requestDeadline = new AbortController();
      const cache = new BlockingDerivedCache(() => clockMs);
      const service = createSeoulRentCheckService({
        serviceKey: 'test-key',
        cache,
        fetch: async (input) => {
          const dealYmd = new URL(String(input)).searchParams.get('DEAL_YMD')!;
          return new Response(completeMonthXml(dealYmd));
        },
        now: () => new Date(clockMs),
        createDeadlineSignal: () => requestDeadline.signal,
        createAttemptSignal: () => new AbortController().signal,
      });
      await service.check(quote());
      clockMs += 16 * 60 * 1_000;
      requestDeadline = new AbortController();
      cache.blockDerivedWrites = true;

      const pending = service.check(quote());
      await derivedSetStarted.promise;
      requestDeadline.abort();

      await expect(settleWithin(pending)).rejects.toMatchObject({ code: 'source_timeout' });
      releaseDerivedSets.resolve();
    },
  );

  test.runIf(SERVICE_EXISTS)('returns source unavailable when no stale derived entry exists', async () => {
    const harness = createHarness({ fetchMode: 'network-failure' });
    await expect(harness.service.check(quote())).rejects.toMatchObject({
      code: 'source_unavailable',
    });
  });

  test.runIf(SERVICE_EXISTS)('does not cache a rejected malformed official month', async () => {
    const harness = createHarness({ fetchMode: 'malformed' });

    await expect(harness.service.check(quote())).rejects.toMatchObject({
      code: 'source_malformed',
    });
    expect(harness.cache.writes).toHaveLength(0);
    expect(harness.cache.entries.size).toBe(0);
  });

  test.runIf(SERVICE_EXISTS).each([
    ['display', policy({ canDisplay: false })],
    ['commercial use', policy({ canUseCommercially: false })],
  ])('rechecks current %s rights before a derived hit', async (_label, revokedPolicy) => {
    const harness = createHarness();
    await harness.service.check(quote());
    const callsBefore = harness.providerCalls;
    harness.setPolicy(revokedPolicy);

    await expect(harness.service.check(quote())).rejects.toMatchObject({ code: 'rights_blocked' });
    expect(harness.providerCalls).toBe(callsBefore);
  });

  test.runIf(SERVICE_EXISTS)('rechecks current rights after reconstructing a cached source month', async () => {
    const harness = createHarness();
    await harness.service.check(quote());
    harness.cache.deleteWhere((key) => key.includes(':derived:'));
    const callsBefore = harness.providerCalls;
    let revoked = false;
    harness.cache.onGet = (key) => {
      if (!revoked && key.endsWith(':manifest') && key.includes(':source:')) {
        revoked = true;
        harness.setPolicy(policy({ canDisplay: false }));
      }
    };

    await expect(harness.service.check(quote())).rejects.toMatchObject({ code: 'rights_blocked' });
    expect(harness.providerCalls).toBe(callsBefore);
  });

  test.runIf(SERVICE_EXISTS)('uses verified source hits without requiring new raw-storage permission', async () => {
    const harness = createHarness();
    await harness.service.check(quote());
    harness.cache.deleteWhere((key) => key.includes(':derived:'));
    harness.setPolicy(policy({ canStore: false }));
    const callsBefore = harness.providerCalls;

    const result = await harness.service.check(quote());
    expect(result.cacheStatus).toBe('miss');
    expect(harness.providerCalls).toBe(callsBefore);
  });

  test.runIf(SERVICE_EXISTS)('rechecks current rights after a derived write and before display', async () => {
    const harness = createHarness();
    harness.cache.onSet = (key) => {
      if (key.includes(':derived:')) {
        harness.setPolicy(policy({ canUseCommercially: false }));
      }
    };

    await expect(harness.service.check(quote())).rejects.toMatchObject({ code: 'rights_blocked' });
  });

  test.runIf(SERVICE_EXISTS)('rechecks raw-storage rights before every source cache write', async () => {
    const harness = createHarness();
    let firstSourceNamespace: string | undefined;
    harness.cache.onSet = (key) => {
      if (firstSourceNamespace === undefined && key.includes(':source:') && key.includes(':page=1')) {
        firstSourceNamespace = key.slice(0, key.indexOf(':generation='));
        harness.setPolicy(policy({ canStore: false }));
      }
    };

    await expect(harness.service.check(quote())).rejects.toMatchObject({ code: 'rights_blocked' });
    expect(firstSourceNamespace).toBeDefined();
    expect(harness.cache.entries.has(`${firstSourceNamespace}:manifest`)).toBe(false);
  });

  test.runIf(SERVICE_EXISTS)('never exceeds the total 48-attempt provider budget', async () => {
    const harness = createHarness({ fetchMode: 'network-failure' });

    await expect(harness.service.check(quote())).rejects.toBeInstanceOf(KoreaRentServiceError);
    expect(harness.providerCalls).toBeLessThanOrEqual(48);
    expect(harness.budgetAttempts).toBeLessThanOrEqual(48);
  });

  test.runIf(SERVICE_EXISTS)('never stores or reports the service key, raw endpoint, or provider error', async () => {
    const serviceKey = 'secret-value-that-must-not-escape';
    const harness = createHarness({ serviceKey });
    const success = await harness.service.check(quote());
    const serializedCache = JSON.stringify([
      ...harness.cache.entries.entries(),
      ...harness.cache.writes,
    ]);

    expect(JSON.stringify(success)).not.toContain(serviceKey);
    expect(serializedCache).not.toContain(serviceKey);
    expect(serializedCache).not.toContain('apis.data.go.kr');
    expect([...harness.cache.entries.keys()].every((key) => !key.includes(serviceKey))).toBe(true);

    await harness.cache.hardDeleteByTag('kr-seoul-rent-check');
    harness.setFetchMode('network-failure');
    const error = await harness.service.check(quote()).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(KoreaRentServiceError);
    expect(String(error)).not.toContain(serviceKey);
    expect(String(error)).not.toContain('provider failed');
    expect(String(error)).not.toContain('apis.data.go.kr');
  });

  test.runIf(SERVICE_EXISTS)('normalizes a deadline dependency failure to a typed safe error', async () => {
    const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
    const service = createSeoulRentCheckService({
      serviceKey: 'test-key',
      cache,
      fetch: async () => new Response(completeMonthXml('202608')),
      now: () => new Date('2026-09-15T00:00:00.000Z'),
      createDeadlineSignal() {
        throw new Error('deadline adapter secret detail');
      },
    });

    const error = await service.check(quote()).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(KoreaRentServiceError);
    expect(error).toMatchObject({ code: 'internal_error' });
    expect(String(error)).not.toContain('adapter secret');
  });

  test.runIf(SERVICE_EXISTS)(
    'expires the one 55-second deadline while the initial derived cache read never resolves',
    async () => {
      const deadline = new AbortController();
      const getStarted = deferred();
      let requestedTimeout: number | undefined;
      const cache: RuntimeCachePort = {
        async get<T>(): Promise<T | null> {
          getStarted.resolve();
          return new Promise<T | null>(() => undefined);
        },
        async set(): Promise<void> {},
        async hardDeleteByTag(): Promise<void> {},
      };
      const service = createSeoulRentCheckService({
        serviceKey: 'test-key',
        cache,
        fetch: async () => new Response(completeMonthXml('202608')),
        now: () => new Date('2026-09-15T00:00:00.000Z'),
        createDeadlineSignal(timeoutMs) {
          requestedTimeout = timeoutMs;
          return deadline.signal;
        },
      });

      const pending = service.check(quote());
      await getStarted.promise;
      deadline.abort();

      await expect(settleWithin(pending)).rejects.toMatchObject({ code: 'source_timeout' });
      expect(requestedTimeout).toBe(55_000);
    },
  );

  test.runIf(SERVICE_EXISTS)(
    'expires the total deadline when provider fetch ignores its abort signal',
    async () => {
      const deadline = new AbortController();
      const fetchStarted = deferred();
      const cache = new MemoryRuntimeCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
      const service = createSeoulRentCheckService({
        serviceKey: 'test-key',
        cache,
        fetch: async () => {
          fetchStarted.resolve();
          return new Promise<Response>(() => undefined);
        },
        now: () => new Date('2026-09-15T00:00:00.000Z'),
        createDeadlineSignal: () => deadline.signal,
        createAttemptSignal: () => new AbortController().signal,
      });

      const pending = service.check(quote());
      await fetchStarted.promise;
      deadline.abort();

      await expect(settleWithin(pending)).rejects.toMatchObject({ code: 'source_timeout' });
    },
  );

  test.runIf(SERVICE_EXISTS)(
    'a deadline during a never-resolving source page write cannot publish its manifest',
    async () => {
      const deadline = new AbortController();
      const pageSetStarted = deferred();
      const releasePageSets = deferred();
      class BlockingPageCache extends MemoryRuntimeCache {
        override async set<T>(
          key: string,
          value: T,
          options: RuntimeCacheEntryOptions,
        ): Promise<void> {
          if (key.includes(':source:') && key.includes(':page=')) {
            pageSetStarted.resolve();
            await releasePageSets.promise;
          }
          return super.set(key, value, options);
        }
      }
      const cache = new BlockingPageCache(() => Date.parse('2026-09-15T00:00:00.000Z'));
      const service = createSeoulRentCheckService({
        serviceKey: 'test-key',
        cache,
        fetch: async (input) => {
          const dealYmd = new URL(String(input)).searchParams.get('DEAL_YMD')!;
          return new Response(completeMonthXml(dealYmd));
        },
        now: () => new Date('2026-09-15T00:00:00.000Z'),
        createDeadlineSignal: () => deadline.signal,
        createAttemptSignal: () => new AbortController().signal,
      });

      const pending = service.check(quote());
      await pageSetStarted.promise;
      deadline.abort();
      await expect(settleWithin(pending)).rejects.toMatchObject({ code: 'source_timeout' });

      releasePageSets.resolve();
      await Promise.resolve();
      await Promise.resolve();
      expect([...cache.entries.keys()].some((key) => key.endsWith(':manifest'))).toBe(false);
    },
  );
});
