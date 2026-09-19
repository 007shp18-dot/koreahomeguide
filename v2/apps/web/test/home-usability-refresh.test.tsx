import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { PropertyHome } from '../components/design-review/editorial-growth-home';
import { getPortfolioRecord } from '../content/portfolio-manifest';

describe('home research entry', () => {
  it.each(['en', 'ko', 'zh-CN'] as const)('offers direct city navigation and a real search in %s', locale => {
    const html = renderToStaticMarkup(<PropertyHome locale={locale} />);
    expect(html).toContain('role="search"');
    expect(html.match(/data-city-destination=/g)).toHaveLength(4);
    expect(html).not.toContain('data-buying-city=');
    expect(html).not.toContain('id="buying-selection"');
  });
  it('uses the supplied latest article instead of a fixed monthly selection', () => {
    const base = getPortfolioRecord('en', 'seoul-monthly-2026-09')!;
    const article = { ...base, id: 'new-story', title: 'A new published analysis', slug: 'new-story', canonicalHref: '/news/new-story/', publishedAt: '2026-09-19T08:00:00.000Z' };
    const html = renderToStaticMarkup(<PropertyHome locale="en" articles={[article]} />);
    expect(html).toContain('A new published analysis');
    expect(html).toContain('href="/news/new-story"');
    expect(html).toContain('2026-09-19T08:00:00.000Z');
  });
});

it.each([
  ['en', 'House view', 'Cost category', 'Illustrative model; shapes do not represent cost amounts.'],
  ['ko', '집 보기 방향', '비용 항목', '이해를 돕는 모형이며, 형태의 크기는 비용을 나타내지 않습니다.'],
  ['zh-CN', '房屋视角', '成本类别', '示意模型，形状大小不代表费用金额。'],
] as const)('provides localized interactive 3D controls without implying a priced property: %s', (locale, view, category, note) => {
  const html = renderToStaticMarkup(<PropertyHome locale={locale} />);
  expect(html).toContain('data-budget-house="interactive"');
  expect(html).toContain(`aria-label="${view}"`);
  expect(html).toContain(`aria-label="${category}"`);
  expect(html).toContain(note);
  expect(html).toContain('aria-pressed="true"');
  expect(html).not.toContain('budget-house-3d.png');
});
