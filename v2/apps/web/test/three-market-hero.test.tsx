import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThreeMarketHero } from '../components/home/three-market-hero';
import { createThreeMarketHomeModel } from '../lib/home/three-market-home-model';
import {
  advanceHomeMarket,
  selectHomeMarket,
} from '../lib/home/three-market-hero-state';

describe('three-market editorial hero', () => {
  it('renders one global promise and three always-visible city controls', () => {
    const markup = renderToStaticMarkup(createElement(ThreeMarketHero, {
      model: createThreeMarketHomeModel({ locale: 'en', seoulMetric: null }),
    }));

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('See the market before you make the move.');
    expect(markup.match(/role="tab"/g)).toHaveLength(3);
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
    expect(markup).toContain('id="home-market-tab-kr-seoul"');
    expect(markup).toContain('aria-controls="home-market-panel"');
    expect(markup).toContain('aria-labelledby="home-market-tab-kr-seoul"');
  });

  it('server-renders Seoul as a complete photo, evidence, and action panel', () => {
    const markup = renderToStaticMarkup(createElement(ThreeMarketHero, {
      model: createThreeMarketHomeModel({
        locale: 'en',
        seoulMetric: { label: 'Median deposit', value: '₩480,000,000', context: '24 contracts · 2026-01–2026-07' },
      }),
    }));

    expect(markup).toContain('seoul-residential.jpg');
    expect(markup).toContain('alt="Seoul apartment skyline with Namsan in the distance"');
    expect(markup).toContain('Editorial city photograph · not an exact-property claim');
    expect(markup).toContain('Median deposit');
    expect(markup).toContain('₩480,000,000');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).toContain('href="/kr/seoul/check"');
  });

  it('manual selection stops rotation while automatic advancement keeps it enabled', () => {
    expect(selectHomeMarket({ activeIndex: 0, autoRotate: true }, 2)).toEqual({
      activeIndex: 2,
      autoRotate: false,
    });
    expect(advanceHomeMarket({ activeIndex: 2, autoRotate: true }, 3)).toEqual({
      activeIndex: 0,
      autoRotate: true,
    });
    expect(advanceHomeMarket({ activeIndex: 1, autoRotate: false }, 3)).toEqual({
      activeIndex: 1,
      autoRotate: false,
    });
  });

  it('keeps hero labels and evidence states in Simplified Chinese', () => {
    const markup = renderToStaticMarkup(createElement(ThreeMarketHero, {
      model: createThreeMarketHomeModel({ locale: 'zh-CN', seoulMetric: null }),
    }));

    expect(markup).toContain('房地产依据 · 三座城市');
    expect(markup).toContain('城市编辑图片 · 不代表具体房产');
    expect(markup).toContain('数据有限');
    expect(markup).toContain('展示权受限');
    expect(markup).not.toContain('Rights Blocked');
  });
});
