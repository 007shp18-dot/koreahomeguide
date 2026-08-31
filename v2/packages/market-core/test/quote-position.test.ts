import { describe, expect, it } from 'vitest';
import {
  createPublicMarketSummary,
  positionQuote,
  type PublishedMarketSummary,
  type WithheldMarketSummary,
} from '../src';

function published(overrides: Partial<PublishedMarketSummary> = {}): PublishedMarketSummary {
  const summary = createPublicMarketSummary({
    marketId: 'kr-seoul',
    area: 'seoul',
    parent: 'kr',
    deal: 'rent',
    band: 'all-homes',
    period: '2026-05/2026-07',
    n: 20,
    min: 1_000_000,
    p25: 1_500_000,
    med: 2_000_000,
    p75: 2_500_000,
    max: 3_000_000,
    chg3m: null,
    ...overrides,
  });
  if (!summary.published) throw new Error('fixture must publish');
  return summary;
}

const axis = { min: 0, max: 5_000_000 } as const;

describe('five-point quote positioning', () => {
  it.each([
    [500_000, 0],
    [1_000_000, 0],
    [1_500_000, 25],
    [2_000_000, 50],
    [2_500_000, 75],
    [3_000_000, 100],
    [3_500_000, 100],
  ] as const)('positions quote %i at percentile %i', (quote, percentile) => {
    expect(positionQuote(published(), quote, axis).percentile).toBe(percentile);
  });

  it('interpolates between every adjacent five-point segment', () => {
    expect(positionQuote(published(), 1_250_000, axis).percentile).toBe(12.5);
    expect(positionQuote(published(), 1_750_000, axis).percentile).toBe(37.5);
    expect(positionQuote(published(), 2_250_000, axis).percentile).toBe(62.5);
    expect(positionQuote(published(), 2_750_000, axis).percentile).toBe(87.5);
  });

  it('clamps marker geometry to the configured market axis', () => {
    expect(positionQuote(published(), 0, axis)).toMatchObject({
      clampedQuote: 0,
      markerPct: 0,
    });
    expect(positionQuote(published(), 2_500_000, axis).markerPct).toBe(50);
    expect(positionQuote(published(), 7_000_000, axis)).toMatchObject({
      clampedQuote: 5_000_000,
      markerPct: 100,
    });
  });

  it.each([
    [1_499_999, 'below-typical', 'Below the typical range'],
    [1_500_000, 'within-typical', 'Within the typical range'],
    [2_500_000, 'within-typical', 'Within the typical range'],
    [2_500_001, 'above-typical', 'Above the typical range'],
  ] as const)('labels quote %i as %s', (quote, verdict, verdictLabel) => {
    expect(positionQuote(published(), quote, axis)).toMatchObject({ verdict, verdictLabel });
  });

  it('returns a signed one-decimal difference from the median', () => {
    expect(positionQuote(published(), 1_500_000, axis).differencePct).toBe(-25);
    expect(positionQuote(published(), 2_246_980, axis).differencePct).toBe(12.3);
  });

  it('handles duplicate five-point anchors without dividing by zero', () => {
    const summary = published({
      min: 1_000_000,
      p25: 1_000_000,
      med: 2_000_000,
      p75: 3_000_000,
      max: 3_000_000,
    });

    expect(positionQuote(summary, 1_000_000, axis).percentile).toBe(12.5);
    expect(positionQuote(summary, 1_500_000, axis).percentile).toBe(37.5);
    expect(positionQuote(summary, 3_000_000, axis).percentile).toBe(87.5);
  });

  it('uses the median percentile for a fully flat distribution', () => {
    const summary = published({
      min: 2_000_000,
      p25: 2_000_000,
      med: 2_000_000,
      p75: 2_000_000,
      max: 2_000_000,
    });

    expect(positionQuote(summary, 2_000_000, axis).percentile).toBe(50);
  });

  it.each([
    [Number.NaN, axis, 'quote'],
    [-1, axis, 'quote'],
    [1_000_000, { min: 1, max: 1 }, 'axis'],
    [1_000_000, { min: Number.NaN, max: 1 }, 'axis'],
  ] as const)('rejects invalid positioning input %#', (quote, invalidAxis, message) => {
    expect(() => positionQuote(published(), quote, invalidAxis)).toThrow(message);
  });

  it('cannot position a withheld summary', () => {
    const withheld: WithheldMarketSummary = {
      marketId: 'kr-seoul',
      area: 'seoul',
      parent: 'kr',
      deal: 'rent',
      band: 'all-homes',
      period: '2026-05/2026-07',
      n: 4,
      published: false,
    };

    if (false) {
      // @ts-expect-error Withheld evidence cannot create a marker or verdict.
      positionQuote(withheld, 2_000_000, axis);
    }

    expect(withheld.published).toBe(false);
  });
});
