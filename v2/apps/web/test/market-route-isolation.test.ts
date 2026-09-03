import { describe, expect, it } from 'vitest';

import { resolveMarketNavigation } from '../lib/navigation/market-route-resolver';

describe('market route isolation', () => {
  it('keeps Singapore product navigation inside Singapore', () => {
    const navigation = resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'check' });
    expect(navigation.links.find(({ isCurrent }) => isCurrent)?.href).toBe('/sg/singapore/check/');
    expect(navigation.links.map(({ href }) => href).join('\n')).not.toContain('/kr/seoul/');
  });

  it('keeps Seoul product navigation inside Seoul and preserves locale', () => {
    const english = resolveMarketNavigation({ market: 'seoul', locale: 'en', surface: 'explore' });
    const korean = resolveMarketNavigation({ market: 'seoul', locale: 'ko', surface: 'explore' });
    expect(english.links.find(({ isCurrent }) => isCurrent)?.href).toBe('/kr/seoul/explore/');
    expect(korean.links.find(({ isCurrent }) => isCurrent)?.href).toBe('/ko/kr/seoul/explore/');
    expect(english.links.map(({ href }) => href).join('\n')).not.toContain('/sg/singapore/');
  });

  it('distinguishes intentional market switching from product links', () => {
    const navigation = resolveMarketNavigation({ market: 'singapore', locale: 'en', surface: 'explore' });
    expect(navigation.marketSwitch).toEqual([
      { label: 'Seoul', href: '/kr/seoul/' },
      { label: 'Singapore', href: '/sg/' },
      { label: 'Dubai', href: '/compare/?market=dubai' },
    ]);
  });
});
