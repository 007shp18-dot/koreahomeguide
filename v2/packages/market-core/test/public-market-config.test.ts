import { describe, expect, it } from 'vitest';
import {
  getPublicMarketConfig,
  publicMarketConfigs,
  type PublicMarketConfig,
} from '../src';

describe('public market configuration', () => {
  it('ships Korea alone and keeps future markets unavailable', () => {
    expect(publicMarketConfigs.map(({ marketId, availability }) => ({ marketId, availability })))
      .toEqual([
        { marketId: 'kr-seoul', availability: 'ready' },
        { marketId: 'sg-singapore', availability: 'unavailable' },
        { marketId: 'ae-dubai', availability: 'unavailable' },
      ]);
  });

  it('drives Korea formatting, evidence and route language without UI branches', () => {
    expect(getPublicMarketConfig('kr-seoul')).toEqual({
      marketId: 'kr-seoul',
      availability: 'ready',
      publicPath: '/kr/',
      areaSlug: 'seoul',
      marketLabel: 'Seoul',
      currencyCode: 'KRW',
      currencySymbol: '₩',
      formatLocale: 'ko-KR',
      quoteLabel: 'Monthly rent',
      quoteUnit: 'KRW/month',
      geographyNoun: 'area',
      parentGeographyNoun: 'country',
      registryLabel: 'MOLIT reported rental contracts',
      axis: { min: 0, max: 5_000_000, step: 10_000 },
      dealTypes: ['rent'],
      guideFamilies: ['rent', 'buy', 'invest'],
    });
  });

  it('keeps canonical configs deeply immutable', () => {
    const korea = getPublicMarketConfig('kr-seoul');
    const mutable = korea as unknown as {
      availability: string;
      axis: { max: number };
      guideFamilies: string[];
    };

    for (const mutate of [
      () => { mutable.availability = 'unavailable'; },
      () => { mutable.axis.max = 0; },
      () => { mutable.guideFamilies.push('invented'); },
    ]) {
      try {
        mutate();
      } catch {
        // Frozen contract objects reject mutation in strict mode.
      }
    }

    expect(getPublicMarketConfig('kr-seoul')).toEqual(korea);
    expect(Object.isFrozen(korea)).toBe(true);
    expect(Object.isFrozen(korea.axis)).toBe(true);
    expect(Object.isFrozen(korea.guideFamilies)).toBe(true);
  });

  it('exposes readonly config types', () => {
    const config: PublicMarketConfig = getPublicMarketConfig('sg-singapore');

    if (false) {
      // @ts-expect-error Public availability cannot be reassigned.
      config.availability = 'ready';
      // @ts-expect-error Axes are immutable.
      config.axis.max = 1;
      // @ts-expect-error Guide families are immutable.
      config.guideFamilies.push('invented');
    }

    expect(config.marketId).toBe('sg-singapore');
  });
});
