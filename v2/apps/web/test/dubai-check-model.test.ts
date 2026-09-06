import { describe, expect, it } from 'vitest';

import {
  calculateDubaiCheck,
  createDubaiCheckHref,
  parseDubaiCheckQuery,
  resolveDubaiCheckRouteState,
} from '../lib/dubai/check-model';
import type { DubaiSaleDistribution } from '../lib/dubai/evidence-contract';

const benchmark: DubaiSaleDistribution = {
  n: 120,
  medianPriceAed: 1_280_000,
  priceP25Aed: 1_050_000,
  priceP75Aed: 1_600_000,
  medianPricePerSqmAed: 18_900,
  pricePerSqmP25Aed: 16_000,
  pricePerSqmP75Aed: 21_000,
};

describe('Dubai Check model', () => {
  it('compares the asking price and user rent without inventing a forecast', () => {
    expect(calculateDubaiCheck({
      askingPriceAed: 1_500_000,
      areaSqm: 70,
      annualRentAed: 91_500,
      benchmark,
    })).toEqual({
      askingPriceAed: 1_500_000,
      benchmarkMedianPriceAed: 1_280_000,
      priceDifferencePct: 17.2,
      askingPricePerSqmAed: 21_428.57,
      benchmarkMedianPricePerSqmAed: 18_900,
      pricePerSqmDifferencePct: 13.4,
      grossYieldPct: 6.1,
      verdict: 'above-middle-range',
    });
  });

  it.each([
    [16_000, 'within-middle-range'],
    [18_900, 'within-middle-range'],
    [21_000, 'within-middle-range'],
    [15_999, 'below-middle-range'],
    [21_001, 'above-middle-range'],
  ])('uses inclusive released middle-half boundaries at AED %s/m²', (perSqm, verdict) => {
    expect(calculateDubaiCheck({
      askingPriceAed: perSqm * 50,
      areaSqm: 50,
      annualRentAed: 60_000,
      benchmark,
    }).verdict).toBe(verdict);
  });

  it('round-trips a canonical query-backed Check URL', () => {
    const href = createDubaiCheckHref({
      area: 'marsa-dubai',
      housing: 'apartment',
      completion: 'ready',
      askingPriceAed: 1_500_000,
      areaSqm: 70,
      annualRentAed: 91_500,
      returnTo: '/ae/dubai/explore/marsa-dubai/',
    });
    expect(href).toBe('/ae/dubai/check/?area=marsa-dubai&housing=apartment&completion=ready&price=1500000&areaSqm=70&annualRent=91500&returnTo=%2Fae%2Fdubai%2Fexplore%2Fmarsa-dubai%2F');
    expect(parseDubaiCheckQuery(Object.fromEntries(new URL(`https://signedprice.test${href}`).searchParams))).toEqual({
      area: 'marsa-dubai',
      housing: 'apartment',
      completion: 'ready',
      askingPriceAed: 1_500_000,
      areaSqm: 70,
      annualRentAed: 91_500,
      returnTo: '/ae/dubai/explore/marsa-dubai/',
    });
  });

  it('distinguishes an untouched Check route from malformed and valid query state', () => {
    expect(resolveDubaiCheckRouteState({})).toEqual({ kind: 'empty', query: null });
    expect(resolveDubaiCheckRouteState({ price: '1e6' })).toEqual({ kind: 'invalid', query: null });
    expect(resolveDubaiCheckRouteState({
      area: 'marsa-dubai',
      housing: 'apartment',
      completion: 'ready',
    })).toMatchObject({ kind: 'ready', query: { area: 'marsa-dubai' } });
    expect(resolveDubaiCheckRouteState({ campaign: 'ignored' }))
      .toEqual({ kind: 'empty', query: null });
  });

  it.each([
    [{ price: ['1500000'] }, 'array'],
    [{ price: '1e6' }, 'exponent'],
    [{ price: '0' }, 'zero'],
    [{ areaSqm: '-1' }, 'negative'],
    [{ annualRent: 'Infinity' }, 'infinity'],
    [{ returnTo: 'https://example.com/' }, 'external return'],
  ])('rejects an invalid %s query value', (override, label) => {
    void label;
    expect(parseDubaiCheckQuery({
      area: 'marsa-dubai',
      housing: 'apartment',
      completion: 'ready',
      price: '1500000',
      areaSqm: '70',
      annualRent: '91500',
      ...override,
    })).toBeNull();
  });
});
