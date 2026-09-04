import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EditorialGrowthPublicShell } from '../components/editorial-growth/editorial-growth-public-shell';
import type { EditorialGrowthReviewModel } from '../lib/design-review/editorial-growth-review-model';

const MODEL = Object.freeze({
  locale: 'en',
  state: 'ready',
  ad: 'empty',
  seoulStatus: 'Updated 2026-08',
  headlineMetric: { label: 'Reported contracts', value: '120', context: '2026-08' },
  article: {
    title: 'A median is a boundary',
    summary: 'Read the cohort before the conclusion.',
    market: 'Seoul',
    published: '4 Sep 2026',
    updated: '4 Sep 2026',
    readMinutes: 5,
    sections: [{ heading: 'Start with the cohort', body: 'A median describes a defined group.' }],
  },
  articles: [],
  guides: [{
    title: 'Read district evidence',
    summary: 'Understand the comparison boundary.',
    stage: 'Market research',
    updated: '2026-09-04',
    href: '/kr/seoul/guide/read-district-evidence/',
  }],
  check: { state: 'ready', verdict: 'Typical', scope: 'Seoul', metrics: [], disclosure: 'Evidence.' },
  exploreRows: [],
  exploreDistricts: [],
} satisfies EditorialGrowthReviewModel);

describe('public editorial shell', () => {
  it('publishes the approved hierarchy with only public destinations', () => {
    const markup = renderToStaticMarkup(<EditorialGrowthPublicShell surface="home" model={MODEL} />);

    expect(markup).toContain('data-public-editorial-shell="home"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('aria-label="Language navigation"');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).toContain('href="/kr/seoul/check"');
    expect(markup).toContain('href="/kr/seoul/explore"');
    expect(markup).not.toContain('Design review');
    expect(markup).not.toContain('/design-review/');
  });

  it('uses independent Chinese navigation and zero-tracking locale scope', () => {
    const markup = renderToStaticMarkup(
      <EditorialGrowthPublicShell surface="content" model={{ ...MODEL, locale: 'zh-CN' }} />,
    );

    expect(markup).toContain('lang="zh-CN"');
    expect(markup).toContain('data-review-locale="zh-CN"');
    expect(markup).toContain('href="/zh-cn/kr/seoul/check"');
    expect(markup).toContain('>首页<');
    expect(markup).not.toContain('/design-review/');
  });
});
