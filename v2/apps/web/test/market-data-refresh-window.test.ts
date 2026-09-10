import { describe, expect, it } from 'vitest';

import {
  MARKET_REFRESH_JOBS,
  isMarketRefreshJob,
} from '../lib/market-data/refresh-types';
import {
  refreshMonthKeys,
  refreshQuarterKeys,
} from '../lib/market-data/refresh-window';

describe('market data refresh windows', () => {
  it('covers the current and previous Seoul filing months in UTC', () => {
    expect(refreshMonthKeys(new Date('2026-09-06T23:59:59.000Z'))).toEqual([
      '202609',
      '202608',
    ]);
    expect(refreshMonthKeys(new Date('2026-01-02T00:00:00.000Z'))).toEqual([
      '202601',
      '202512',
    ]);
  });

  it('covers the current and previous URA rental quarters', () => {
    expect(refreshQuarterKeys(new Date('2026-09-06T00:00:00.000Z'))).toEqual([
      '26q3',
      '26q2',
    ]);
    expect(refreshQuarterKeys(new Date('2026-01-01T00:00:00.000Z'))).toEqual([
      '26q1',
      '25q4',
    ]);
  });

  it('rejects an invalid reference instant rather than inventing a window', () => {
    expect(() => refreshMonthKeys(new Date(Number.NaN))).toThrow(/reference instant/i);
    expect(() => refreshQuarterKeys(new Date(Number.NaN))).toThrow(/reference instant/i);
  });
});

describe('market refresh job registry', () => {
  it('accepts exactly the six isolated production jobs', () => {
    expect(MARKET_REFRESH_JOBS).toEqual([
      'kr-seoul-sale',
      'kr-seoul-rent',
      'sg-private-sale',
      'sg-private-rent',
      'ae-dubai-transaction',
      'ae-dubai-rent',
    ]);
    for (const job of MARKET_REFRESH_JOBS) expect(isMarketRefreshJob(job)).toBe(true);
    expect(isMarketRefreshJob('')).toBe(false);
    expect(isMarketRefreshJob('kr-seoul-sale&job=ae-dubai-rent')).toBe(false);
  });
});
