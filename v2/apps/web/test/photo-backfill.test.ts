import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPhotoBackfillRunner,
  type PhotoBackfillDependencies,
} from '../lib/photos/photo-backfill.server';

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
