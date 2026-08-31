import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { AreaExplorer } from '../components/public-market/area-explorer';
import { DistrictDetailPage } from '../components/public-market/district-detail-page';
import { PublicSectionTabs } from '../components/public-market/public-section-tabs';
import {
  buildPublicAreaExploreModel,
  buildPublicDistrictModel,
} from '../lib/public-market/area-route-model.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

describe('Contract Check evidence navigation', () => {
  test.each(['check', 'explore', 'guide'] as const)(
    'keeps Check, Explore, and Guide primary while News remains absent from %s',
    (current) => {
      const html = renderToStaticMarkup(<PublicSectionTabs current={current} />);

      expect(html).toContain('href="/kr"');
      expect(html).toContain('href="/kr/seoul/explore"');
      expect(html).toContain('data-public-tab="guide"');
      expect(html).toContain('href="/kr/seoul/guide"');
      expect(html).not.toMatch(/data-public-tab="news"|>News</);
      expect((html.match(/<a\b/g) ?? [])).toHaveLength(3);
      expect(html).not.toContain('data-public-tab="rankings"');
    },
  );

  test('offers Rankings only as a secondary link from the district Explorer', () => {
    const model = buildPublicAreaExploreModel('gangnam-gu', {
      source: createPublicAreaFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    if (model.status !== 'ready') throw new Error('Expected ready Explorer fixture.');

    const html = renderToStaticMarkup(<AreaExplorer model={model} />);

    expect(html).toContain('href="/kr"');
    expect(html).toContain('href="/kr/seoul/rankings"');
    expect(html).toContain('View district rankings');
    expect(html).toContain('href="/kr/seoul/guide"');
  });

  test.each([
    ['published', createPublicAreaFixture()],
    ['withheld', createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 500_000_000 },
      withheldCounts: { 'gangnam-gu': 4 },
    })],
    ['unavailable', { invalid: true }],
  ])('offers Contract Check and Rankings from %s district detail', (_, source) => {
    const model = buildPublicDistrictModel('gangnam-gu', {
      source,
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    if (model === null) throw new Error('Expected district identity.');

    const html = renderToStaticMarkup(<DistrictDetailPage model={model} />);

    expect(html).toContain('href="/kr"');
    expect(html).toContain('href="/kr/seoul/rankings"');
    expect(html).toContain('View district rankings');
    expect(html).toContain('href="/kr/seoul/guide"');
  });
});
