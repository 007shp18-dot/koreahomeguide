import { describe, expect, it } from 'vitest';
import {
  createPublicMarketSummary,
  type PublicMarketSummary,
  type WithheldMarketSummary,
} from '../src';

const identity = {
  marketId: 'kr-seoul',
  area: 'seoul',
  parent: 'kr',
  deal: 'rent',
  band: 'all-homes',
  period: '2026-05/2026-07',
} as const;

describe('public market summary boundary', () => {
  it.each([0, 4])('withholds every monetary key when n=%i', (n) => {
    const summary = createPublicMarketSummary({
      ...identity,
      n,
      min: 100,
      p25: 200,
      med: 300,
      p75: 400,
      max: 500,
      chg3m: 2.5,
    });

    expect(summary).toEqual({ ...identity, n, published: false });
    for (const forbidden of ['min', 'p25', 'med', 'p75', 'max', 'chg3m']) {
      expect(summary).not.toHaveProperty(forbidden);
    }
    expect(Object.isFrozen(summary)).toBe(true);
  });

  it('publishes an ordered five-number summary at n=5', () => {
    const summary = createPublicMarketSummary({
      ...identity,
      n: 5,
      min: 100,
      p25: 200,
      med: 300,
      p75: 400,
      max: 500,
      chg3m: null,
    });

    expect(summary).toEqual({
      ...identity,
      n: 5,
      published: true,
      min: 100,
      p25: 200,
      med: 300,
      p75: 400,
      max: 500,
      chg3m: null,
    });
    expect(Object.isFrozen(summary)).toBe(true);
  });

  it.each([
    [{ ...identity, n: -1 }, 'non-negative integer'],
    [{ ...identity, n: 1.5 }, 'non-negative integer'],
    [{ ...identity, n: 5, min: 200, p25: 100, med: 300, p75: 400, max: 500 }, 'ordered'],
    [{ ...identity, n: 5, min: -1, p25: 100, med: 300, p75: 400, max: 500 }, 'non-negative'],
    [{ ...identity, n: 5, min: 100, p25: 200, med: Number.NaN, p75: 400, max: 500 }, 'finite'],
    [{ ...identity, n: 5, min: 100, p25: 200, med: 300, p75: 400 }, 'five-number'],
    [{ ...identity, n: 5, min: 100, p25: 200, med: 300, p75: 400, max: 500, chg3m: Number.POSITIVE_INFINITY }, 'finite'],
    [{ ...identity, period: 'latest', n: 0 }, 'period'],
    [{ ...identity, period: '2026-08/2026-07', n: 0 }, 'ordered'],
    [{ ...identity, marketId: 'kr-busan' as never, n: 0 }, 'marketId'],
  ] as const)('rejects malformed input %#', (input, message) => {
    expect(() => createPublicMarketSummary(input)).toThrow(message);
  });

  it('narrows withheld summaries without published-only fields', () => {
    const summary: PublicMarketSummary = createPublicMarketSummary({ ...identity, n: 2 });

    if (!summary.published) {
      const withheld: WithheldMarketSummary = summary;
      expect(withheld.n).toBe(2);

      if (false) {
        // @ts-expect-error Withheld summaries cannot expose a median.
        void withheld.med;
        // @ts-expect-error Withheld summaries cannot expose a range maximum.
        void withheld.max;
      }
    }
  });
});
