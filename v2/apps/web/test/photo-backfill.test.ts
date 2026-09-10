import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPhotoBackfillRunner,
  runOrderedProviderBatch,
  type PhotoBackfillDependencies,
} from '../lib/photos/photo-backfill.server';
import * as photoBackfill from '../lib/photos/photo-backfill.server';

function dependencies(overrides: Partial<PhotoBackfillDependencies> = {}): PhotoBackfillDependencies {
  return {
    readHealth: vi.fn().mockResolvedValue({ state: 'ready', reason: null }),
    readUsage: vi.fn().mockResolvedValue({ requestCount: 0, estimatedCostUsd: 0 }),
    runProvider: vi.fn().mockResolvedValue({ state: 'ready', checked: 0, candidates: 0, entityIds: [] }),
    writeUsage: vi.fn().mockResolvedValue(undefined),
    writeHealth: vi.fn().mockResolvedValue(undefined),
    syncCoverage: vi.fn().mockResolvedValue({ checked: 0, updated: 0 }),
    ...overrides,
  };
}

describe('bounded photo backfill', () => {
  it('stores a NAVER result only as a private rights-review candidate', async () => {
    type StoreFactory = (port: Readonly<{
      query(statement: string, parameters: readonly unknown[]): Promise<readonly Readonly<Record<string, unknown>>[]>;
    }>) => Readonly<{
      save(input: Readonly<{
        buildingKey: string;
        registryKey: string;
        candidate: Readonly<{
          title: string;
          temporaryImageUrl: string;
          temporaryThumbnailUrl: string;
          sourceDocumentUrl: string;
          width: number | null;
          height: number | null;
        }>;
        confidence: number;
        evidence: readonly string[];
      }>): Promise<boolean>;
    }>;
    const createStore = (photoBackfill as typeof photoBackfill & {
      createNaverPhotoCandidateStore?: StoreFactory;
    }).createNaverPhotoCandidateStore;
    expect(createStore).toBeTypeOf('function');
    if (createStore === undefined) return;
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const store = createStore({
      async query(statement, parameters) {
        calls.push({ statement, parameters });
        return [{ id: '7' }];
      },
    });
    await expect(store.save({
      buildingKey: 'dubai:project:burj-khalifa',
      registryKey: 'ae-dubai:burj-khalifa',
      candidate: {
        title: 'Burj Khalifa exterior',
        temporaryImageUrl: 'https://images.example.com/burj.jpg',
        temporaryThumbnailUrl: 'https://images.example.com/burj-thumb.jpg',
        sourceDocumentUrl: 'https://images.example.com/burj.jpg',
        width: 2400,
        height: 1600,
      },
      confidence: 0.65,
      evidence: ['name', 'address-in-search-query', 'rights-review-required'],
    })).resolves.toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.statement).toContain("'review_required'");
    expect(calls[0]?.statement).toContain("'review-required'");
    expect(calls[0]?.statement).toContain("building_photos.status <> 'approved'");
    expect(calls[0]?.parameters).toContain('ae-dubai:burj-khalifa');
    expect(calls[0]?.parameters).toContain('https://images.example.com/burj.jpg');
  });

  it('runs provider work in bounded ordered groups and stops before scheduling another group', async () => {
    let active = 0;
    let maxActive = 0;
    const calls: number[] = [];
    const results = await runOrderedProviderBatch(
      Array.from({ length: 8 }, (_, index) => index),
      async (value) => {
        calls.push(value);
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
        return { value, stop: value === 1 };
      },
      { concurrency: 5, shouldStop: (result) => result.stop },
    );

    expect(maxActive).toBeLessThanOrEqual(5);
    expect(calls).toEqual([0, 1, 2, 3, 4]);
    expect(results.map((result) => result.value)).toEqual([0, 1, 2, 3, 4]);
  });

  it('does not schedule work after the deadline', async () => {
    let now = 0;
    const calls: number[] = [];
    const results = await runOrderedProviderBatch(
      [0, 1, 2, 3],
      async (value) => {
        calls.push(value);
        now = 45_000;
        return value;
      },
      { concurrency: 2, deadlineMs: 45_000, now: () => now },
    );

    expect(calls).toEqual([0, 1]);
    expect(results).toEqual([0, 1]);
  });

  it('keeps a scheduled NAVER-sized batch running beyond the former 45-second window', async () => {
    let now = 0;
    const results = await runOrderedProviderBatch(
      Array.from({ length: 50 }, (_, index) => index),
      async (value) => {
        now += 1_000;
        return value;
      },
      { concurrency: 5, now: () => now },
    );

    expect(results).toHaveLength(50);
  });

  it('continues after terminal entity attempts without duplicating work', async () => {
    const remaining = ['a', 'b', 'c'];
    const deps = dependencies({
      runProvider: vi.fn().mockImplementation(async ({ limit }: { limit: number }) => ({
        state: 'ready', checked: Math.min(limit, remaining.length), candidates: 0,
        entityIds: remaining.splice(0, limit),
      })),
    });
    const runner = createPhotoBackfillRunner(deps);
    const options = {
      market: 'kr-seoul' as const, provider: 'wikimedia' as const, limit: 2,
      dailyRequestCap: 20, dailySpendCapUsd: 2, dryRun: false,
    };

    const first = await runner(options);
    const second = await runner(options);

    expect(first.entityIds).toEqual(['a', 'b']);
    expect(second.entityIds).toEqual(['c']);
  });

  it('pauses a provider immediately after an authentication failure', async () => {
    const writeHealth = vi.fn().mockResolvedValue(undefined);
    const runner = createPhotoBackfillRunner(dependencies({
      writeHealth,
      runProvider: vi.fn().mockResolvedValue({
        state: 'provider-error', checked: 1, candidates: 0, entityIds: ['a'], reason: 'http-403',
      }),
    }));

    const result = await runner({
      market: 'sg-singapore', provider: 'google', limit: 30,
      dailyRequestCap: 100, dailySpendCapUsd: 10, dryRun: false,
    });

    expect(result).toMatchObject({ state: 'provider-paused', checked: 1, reason: 'http-403' });
    expect(writeHealth).toHaveBeenCalledWith('google', 'paused', 'http-403');
  });

  it('honours daily request and spend caps before calling a paid provider', async () => {
    const runProvider = vi.fn().mockResolvedValue({
      state: 'ready', checked: 2, candidates: 1, entityIds: ['a', 'b'],
    });
    const runner = createPhotoBackfillRunner(dependencies({
      runProvider,
      readUsage: vi.fn().mockResolvedValue({ requestCount: 8, estimatedCostUsd: 0.256 }),
    }));

    const result = await runner({
      market: 'kr-seoul', provider: 'google', limit: 30,
      dailyRequestCap: 10, dailySpendCapUsd: 1, dryRun: false,
    });

    expect(runProvider).toHaveBeenCalledWith(expect.objectContaining({ limit: 2 }));
    expect(result.checked).toBe(2);
  });

  it('does not call providers or write state for a dry run', async () => {
    const runProvider = vi.fn();
    const writeUsage = vi.fn();
    const runner = createPhotoBackfillRunner(dependencies({ runProvider, writeUsage }));

    const result = await runner({
      market: 'kr-seoul', provider: 'naver-search', limit: 50,
      dailyRequestCap: 25, dailySpendCapUsd: 0, dryRun: true,
    });

    expect(result).toMatchObject({ state: 'dry-run', requestLimit: 25 });
    expect(runProvider).not.toHaveBeenCalled();
    expect(writeUsage).not.toHaveBeenCalled();
  });

  it('makes no Google request when the spend cap is zero', async () => {
    const runProvider = vi.fn();
    const runner = createPhotoBackfillRunner(dependencies({ runProvider }));

    const result = await runner({
      market: 'kr-seoul', provider: 'google', limit: 30,
      dailyRequestCap: 100, dailySpendCapUsd: 0, dryRun: false,
    });

    expect(result).toMatchObject({ state: 'cap-reached', requestLimit: 0, checked: 0 });
    expect(runProvider).not.toHaveBeenCalled();
  });
});
