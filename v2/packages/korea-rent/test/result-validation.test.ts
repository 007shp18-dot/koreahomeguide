import { describe, expect, it } from 'vitest';

import { isPublishedRentCheckResultTuplePossible } from '../src/index';

const typicalFair = {
  askingValueWon: 900_000,
  medianValueWon: 910_000,
  p25ValueWon: 850_000,
  p75ValueWon: 950_000,
  differencePct: -1.1,
  percentileRank: 40,
  rating: 'fair',
  verdictBasis: 'typical-range',
} as const;

describe('published Korea result tuple validation', () => {
  it('accepts valid rounded typical-range and median-fallback boundary tuples', () => {
    expect(isPublishedRentCheckResultTuplePossible(typicalFair)).toBe(true);
    expect(isPublishedRentCheckResultTuplePossible({
      askingValueWon: 1_100_200,
      medianValueWon: 1_000_000,
      p25ValueWon: null,
      p75ValueWon: null,
      differencePct: 10,
      percentileRank: null,
      rating: 'above',
      verdictBasis: 'median-fallback',
    })).toBe(true);
    expect(isPublishedRentCheckResultTuplePossible({
      askingValueWon: 899_800,
      medianValueWon: 1_000_000,
      p25ValueWon: null,
      p75ValueWon: null,
      differencePct: -10,
      percentileRank: null,
      rating: 'below',
      verdictBasis: 'median-fallback',
    })).toBe(true);
  });

  it.each([
    ['above typical rating', { ...typicalFair, rating: 'above' }],
    ['below typical rating', { ...typicalFair, rating: 'below' }],
    ['fabricated difference', { ...typicalFair, differencePct: 999 }],
    ['missing typical percentile', { ...typicalFair, percentileRank: null }],
    ['median percentile', {
      askingValueWon: 1_100_200,
      medianValueWon: 1_000_000,
      p25ValueWon: null,
      p75ValueWon: null,
      differencePct: 10,
      percentileRank: 50,
      rating: 'above',
      verdictBasis: 'median-fallback',
    }],
    ['fair at above boundary', {
      askingValueWon: 1_100_200,
      medianValueWon: 1_000_000,
      p25ValueWon: null,
      p75ValueWon: null,
      differencePct: 10,
      percentileRank: null,
      rating: 'fair',
      verdictBasis: 'median-fallback',
    }],
    ['fair at below boundary', {
      askingValueWon: 899_800,
      medianValueWon: 1_000_000,
      p25ValueWon: null,
      p75ValueWon: null,
      differencePct: -10,
      percentileRank: null,
      rating: 'fair',
      verdictBasis: 'median-fallback',
    }],
  ] as const)('rejects a contradictory %s tuple', (_label, tuple) => {
    expect(isPublishedRentCheckResultTuplePossible(tuple)).toBe(false);
  });
});
