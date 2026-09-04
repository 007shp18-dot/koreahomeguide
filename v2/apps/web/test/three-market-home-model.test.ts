import { describe, expect, it } from 'vitest';

import { createThreeMarketHomeModel } from '../lib/home/three-market-home-model';

describe('three-market home model', () => {
  it('gives Seoul, Singapore, and Dubai equal first-screen presence in stable order', () => {
    const model = createThreeMarketHomeModel({
      locale: 'en',
      seoulMetric: { label: 'Median deposit', value: '₩480,000,000', context: '2026-01–2026-07 · 24 contracts' },
    });

    expect(model.headline).toBe('See the market before you make the move.');
    expect(model.markets.map(({ id }) => id)).toEqual(['kr-seoul', 'sg-singapore', 'ae-dubai']);
    expect(model.markets.every(({ summary }) => summary.length <= 60)).toBe(true);
    expect(model.markets.map(({ photo }) => photo.src)).toEqual([
      '/assets/markets/seoul-residential.jpg',
      '/assets/markets/singapore-residential.jpg',
      '/assets/markets/dubai-skyline.jpg',
    ]);
  });

  it('keeps evidence and actions inside each market capability boundary', () => {
    const model = createThreeMarketHomeModel({ locale: 'en', seoulMetric: null });
    const seoul = model.markets[0]!;
    const singapore = model.markets[1]!;
    const dubai = model.markets[2]!;

    expect(seoul).toMatchObject({
      evidenceState: 'insufficient',
      primaryAction: { label: 'Explore Seoul', href: '/kr/seoul/explore/' },
      secondaryAction: { label: 'Check a price', href: '/kr/seoul/check/' },
    });
    expect(singapore).toMatchObject({
      evidenceState: 'limited',
      primaryAction: { label: 'Explore Singapore', href: '/sg/singapore/explore/' },
      secondaryAction: { label: 'Check a price', href: '/sg/singapore/check/' },
    });
    expect(dubai).toMatchObject({
      evidenceState: 'rights_blocked',
      primaryAction: { label: 'Explore Dubai', href: '/ae/dubai/' },
      secondaryAction: { label: 'Read Dubai research', href: '/insights/' },
    });
    expect(JSON.stringify(dubai)).not.toContain('/check/');
  });

  it('uses independent Simplified Chinese copy without changing the market routes', () => {
    const model = createThreeMarketHomeModel({ locale: 'zh-CN', seoulMetric: null });

    expect(model.headline).toBe('做决定之前，先看懂市场。');
    expect(model.markets[0]?.primaryAction).toEqual({ label: '探索首尔', href: '/kr/seoul/explore/' });
    expect(model.markets[1]?.evidenceTitle).toContain('私人住宅');
    expect(model.markets[2]?.evidenceNote).toContain('数据展示权');
  });
});
