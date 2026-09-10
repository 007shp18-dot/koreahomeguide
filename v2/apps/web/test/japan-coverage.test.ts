import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { readJapanCoverage } from '../lib/japan/repository.server';
import type { MarketRefreshSqlPort } from '../lib/market-data/refresh-repository.server';

describe('Japan coverage availability', () => {
  it('reports an unconfigured database instead of claiming no wards are published', async () => {
    await expect(readJapanCoverage(null)).rejects.toThrow('database_not_configured');
  });

  it('preserves database failures instead of turning them into empty coverage', async () => {
    const unavailable = new Error('database unavailable');
    const port: MarketRefreshSqlPort = {
      query: vi.fn().mockRejectedValue(unavailable),
      transaction: vi.fn(),
    };
    await expect(readJapanCoverage(port)).rejects.toBe(unavailable);
  });
});
