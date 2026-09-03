import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

import CommunityPage, { metadata as communityMetadata } from '../app/(en)/community/page';
import NewsPage, { metadata as newsMetadata } from '../app/(en)/news/page';
import MarketFeatureRoute from '../app/(en)/[country]/[city]/[intent]/page';

describe('global roadmap routes', () => {
  it('publishes global News and Community destinations in the shared product shell', () => {
    const news = renderToStaticMarkup(<NewsPage />);
    const community = renderToStaticMarkup(<CommunityPage />);

    expect(newsMetadata.alternates).toEqual({ canonical: 'https://www.signedprice.com/news/' });
    expect(communityMetadata.alternates).toEqual({ canonical: 'https://www.signedprice.com/community/' });
    expect(news).toContain('Property market news');
    expect(news).toContain('data-market-context="global"');
    expect(community).toContain('Community, grounded in a place.');
    expect(community).toContain('District and neighbourhood');
    expect(community).toContain('Building and project');
    expect(community).toContain('Read-only foundation');
  });

  it.each([
    ['sg', 'singapore', 'Singapore'],
    ['ae', 'dubai', 'Dubai'],
  ])('keeps the same six local tools for %s while showing honest availability', async (country, city, label) => {
    for (const intent of ['explore', 'check', 'rankings', 'news', 'community', 'guide']) {
      const html = renderToStaticMarkup(await MarketFeatureRoute({
        params: Promise.resolve({ country, city, intent }),
      }));

      expect(html).toContain(`data-market-context="${city}"`);
      expect(html).toContain(`aria-label="${label} product navigation"`);
      expect(html).toContain('data-local-navigation="true"');
      expect(html).toContain('Availability');
      expect(html).toContain('Not publicly available yet');
    }
  });
});
