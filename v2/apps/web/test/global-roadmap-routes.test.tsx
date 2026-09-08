import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

import CommunityPage, { metadata as communityMetadata } from '../app/(en)/community/page';
import NewsPage, { generateMetadata as generateNewsMetadata } from '../app/(en)/news/page';
import { metadata as guidesMetadata } from '../app/(en)/guides/page';
import { metadata as chineseGuidesMetadata } from '../app/(zh-cn)/zh-cn/guides/page';
import { metadata as chineseNewsMetadata } from '../app/(zh-cn)/zh-cn/news/page';
import MarketFeatureRoute from '../app/(en)/[country]/[city]/[intent]/page';

afterEach(() => vi.unstubAllGlobals());

describe('global roadmap routes', () => {
  it('server-renders reviewed global market news without fetching external discovery', async () => {
    const externalFetch = vi.fn();
    vi.stubGlobal('fetch', externalFetch);

    const news = renderToStaticMarkup(await NewsPage());
    const newsMetadata = await generateNewsMetadata();
    const community = renderToStaticMarkup(<CommunityPage />);

    expect(newsMetadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/news/',
      languages: {
        en: 'https://www.signedprice.com/news/',
        ko: 'https://www.signedprice.com/ko/news/',
        'zh-Hans': 'https://www.signedprice.com/zh-cn/news/',
        'x-default': 'https://www.signedprice.com/news/',
      },
    });
    expect(guidesMetadata.alternates?.languages).toEqual({
      en: 'https://www.signedprice.com/guides/',
      ko: 'https://www.signedprice.com/ko/guides/',
      'zh-Hans': 'https://www.signedprice.com/zh-cn/guides/',
      'x-default': 'https://www.signedprice.com/guides/',
    });
    expect(chineseGuidesMetadata.alternates?.languages).toEqual(
      guidesMetadata.alternates?.languages,
    );
    expect(chineseNewsMetadata.alternates?.languages).toEqual(
      newsMetadata.alternates?.languages,
    );
    expect(communityMetadata.alternates).toEqual({ canonical: 'https://www.signedprice.com/community/' });
    expect(news).toContain('<h1>News &amp; Insights</h1>');
    expect(news).toContain('Find a city you connect with, a neighbourhood that fits, and a clearer path to a home of your own.');
    expect(news).toContain('data-public-editorial-frame="content"');
    expect(news).toContain('Singapore condo prices: CCR vs RCR vs OCR compared');
    expect(news).toContain('aria-label="News markets"');
    expect(news).not.toContain('Live external news');
    expect(externalFetch).not.toHaveBeenCalled();
    expect(community).toContain('One community, organized by place.');
    expect(community).toContain('District');
    expect(community).toContain('Building');
    expect(community).toContain('Read-only launch state');
  });

  it.each([
    ['sg', 'singapore', 'Singapore'],
    ['ae', 'dubai', 'Dubai'],
  ])('keeps capability-safe market navigation for %s', async (country, city, label) => {
    for (const intent of ['explore', 'check', 'rankings', 'news', 'community', 'guide']) {
      const html = renderToStaticMarkup(await MarketFeatureRoute({
        params: Promise.resolve({ country, city, intent }),
      }));

      expect(html).toContain(`data-market-context="${country === 'sg' ? 'sg-singapore' : 'ae-dubai'}"`);
      expect(html).toContain(`aria-label="${label} market navigation"`);
      expect(html).toContain('data-navigation-tier="global"');
      expect(html).toContain('data-navigation-tier="market-local"');
      expect(html).toContain('>Explore');
      expect(html).toContain('No unsupported values substituted');
    }
  });
});
