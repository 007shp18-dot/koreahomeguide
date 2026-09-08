import { describe, expect, it } from 'vitest';
import { formatPricePercentile } from '../lib/locale/price-percentile';

describe('price percentile formatting', () => {
  it.each([[1, '1st'], [2, '2nd'], [3, '3rd'], [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [100, '100th']] as const)('formats %s with its English ordinal', (value, expected) => {
    expect(formatPricePercentile(value, 'en')).toBe(expected);
  });
  it('keeps Korean percentiles free of English ordinal suffixes', () => {
    expect(formatPricePercentile(21, 'ko')).toBe('21백분위');
  });
  it('does not invent an ordinal for a fractional percentile', () => {
    expect(formatPricePercentile(21.5, 'en')).toBe('Percentile 21.5');
    expect(formatPricePercentile(21.5, 'ko')).toBe('21.5백분위');
  });
});
