import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

import CommunityPage, { metadata as communityMetadata } from '../app/(en)/community/page';
import NewsPage, { metadata as newsMetadata } from '../app/(en)/news/page';
import MarketFeatureRoute from '../app/(en)/[country]/[city]/[intent]/page';

afterEach(() => vi.unstubAllGlobals());

describe('global roadmap routes', () => {
  it('server-renders global market news before client refresh', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      const market = url.searchParams.get('q')?.includes('Singapore') ? 'Singapore' : url.searchParams.get('q')?.includes('Dubai') ? 'Dubai' : 'Seoul';
      const rss = `<?xml version="1.0"?><rss><channel><item>
        <title>${market} property market update - Example News</title>
        <link>https://news.google.com/rss/articles/${market.toLowerCase()}</link>
        <pubDate>Fri, 04 Sep 2026 01:00:00 GMT</pubDate>
        <description>${market} housing evidence update</description>
        <source>Example News</source>
      </item></channel></rss>`;
      return new Response(rss, { status: 200 });
    }));

    const news = renderToStaticMarkup(await NewsPage());
    const community = renderToStaticMarkup(<CommunityPage />);

    expect(newsMetadata.alternates).toEqual({ canonical: 'https://www.signedprice.com/news/' });
    expect(communityMetadata.alternates).toEqual({ canonical: 'https://www.signedprice.com/community/' });
    expect(news).toContain('News, with the evidence boundary attached.');
    expect(news).toContain('data-market-context="global"');
    expect(news).toContain('Singapore housing evidence update');
    expect(news).toMatch(/Singapore<\/span><small>[1-9]/);
    expect(community).toContain('One community, organized by place.');
    expect(community).toContain('District');
    expect(community).toContain('Building');
    expect(community).toContain('Read-only launch state');
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
      expect(html).toContain('data-navigation-tier="product"');
      expect(html).toContain('<strong>Explore</strong>');
      expect(html).toContain('No unsupported values substituted');
    }
  });
});
