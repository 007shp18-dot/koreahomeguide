import { describe, expect, test } from 'vitest';

import {
  evaluateSingleQuote,
  type SingleQuoteComparable,
} from '../lib/single-quote-check/calculation';

const records: readonly SingleQuoteComparable[] = Object.freeze([
  ...[0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
    transaction: 'monthly' as const,
    districtSlug: 'gangnam-gu',
    neighborhoodId: 'yeoksam',
    buildingId: 'alpha',
    housingType: 'apartment' as const,
    areaSqm: 84 + index / 10,
    filedMonth: `2026-0${index + 2}`,
    depositWon: 100_000_000 + index * 10_000_000,
    valueWon: 2_000_000 - index * 40_000,
  })),
  ...[0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
    transaction: 'sale' as const,
    districtSlug: 'gangnam-gu',
    neighborhoodId: 'yeoksam',
    buildingId: 'beta',
    housingType: 'apartment' as const,
    areaSqm: 84 + index / 10,
    filedMonth: `2026-0${index + 2}`,
    depositWon: null,
    valueWon: 1_000_000_000 + index * 100_000_000,
  })),
]);

describe('single quote Check calculation', () => {
  test('reuses the KoreaHomeGuide deposit adjustment for monthly rent', () => {
    const result = evaluateSingleQuote({
      transaction: 'monthly',
      districtSlug: 'gangnam-gu',
      buildingId: 'alpha',
      housingType: 'apartment',
      areaSqm: 84,
      depositWon: 100_000_000,
      quoteWon: 2_500_000,
    }, records, '2026-02/2026-08');

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.scope).toBe('building');
    expect(result.comparisonBasis).toBe('deposit-adjusted-monthly-rent');
    expect(result.verdict).toBe('above');
    expect(result.sampleCount).toBe(6);
    expect(result.comparables[1]?.adjustedValueWon).toBe(2_006_667);
  });

  test('supports sale quotes without applying rent conversion', () => {
    const result = evaluateSingleQuote({
      transaction: 'sale',
      districtSlug: 'gangnam-gu',
      buildingId: 'beta',
      housingType: 'apartment',
      areaSqm: 84,
      depositWon: null,
      quoteWon: 900_000_000,
    }, records, '2026-02/2026-08');

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.comparisonBasis).toBe('reported-sale-price');
    expect(result.verdict).toBe('below');
    expect(result.middleHalfWon).toEqual([1_125_000_000, 1_375_000_000]);
  });

  test('falls back from an insufficient building to its neighborhood, then district', () => {
    let saleIndex = 0;
    const sparse = records.map((record) => {
      if (record.transaction !== 'sale') return record;
      const current = saleIndex;
      saleIndex += 1;
      return current < 4
        ? { ...record, buildingId: 'sparse', neighborhoodId: 'yeoksam' }
        : record;
    });
    const result = evaluateSingleQuote({
      transaction: 'sale',
      districtSlug: 'gangnam-gu',
      buildingId: 'sparse',
      housingType: 'apartment',
      areaSqm: 84,
      depositWon: null,
      quoteWon: 1_300_000_000,
    }, sparse, '2026-02/2026-08');

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.scope).toBe('neighborhood');
    expect(result.sampleCount).toBe(6);
  });

  test('exhausts the area tiers at the building before widening geography', () => {
    const tiered = [
      ...records,
      ...[0, 1, 2, 3, 4].map((index) => ({
        transaction: 'sale' as const,
        districtSlug: 'gangnam-gu',
        neighborhoodId: 'sinsa',
        buildingId: 'wide-building',
        housingType: 'apartment' as const,
        areaSqm: index < 4 ? 84 : 100,
        filedMonth: '2026-08',
        depositWon: null,
        valueWon: 1_100_000_000 + index * 10_000_000,
      })),
    ];
    const result = evaluateSingleQuote({
      transaction: 'sale', districtSlug: 'gangnam-gu', buildingId: 'wide-building',
      housingType: 'apartment', areaSqm: 84, depositWon: null, quoteWon: 1_130_000_000,
    }, tiered, '2026-02/2026-08');

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.scope).toBe('building');
    expect(result.areaTolerancePct).toBe(20);
  });

  test('withholds a verdict below five compatible reported contracts', () => {
    const result = evaluateSingleQuote({
      transaction: 'jeonse',
      districtSlug: 'jongno-gu',
      buildingId: null,
      housingType: 'apartment',
      areaSqm: 84,
      depositWon: null,
      quoteWon: 500_000_000,
    }, records, '2026-02/2026-08');

    expect(result).toEqual(expect.objectContaining({ status: 'insufficient', sampleCount: 0 }));
  });
});
