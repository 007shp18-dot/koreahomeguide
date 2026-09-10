import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { listPortfolioRecords } from '../content/portfolio-manifest';
import { JOURNEY_ARTICLE_ROUTES, journeyArticleHref } from '../content/city-journey-routes';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { globalNavigation, languageDestinations } from '../lib/navigation/site-navigation';
import { LanguageLinks } from '../components/site-language-navigation';
import { SiteFooter } from '../components/site-footer';
import { homepageCopy } from '../lib/site-copy';

describe('shared navigation destinations', () => {
  it('separates English News from Insights and preserves translated sections', () => {
    expect(globalNavigation('en')).toEqual([
      { label: 'Explore', href: '/prices/' },
      { label: 'Insights', href: '/news/' },
      { label: 'News', href: '/news/?type=news' },
      { label: 'Tools', href: '/tools/' },
      { label: 'Guides', href: '/guides/' },
    ]);

    for (const locale of ['ko', 'zh-CN'] as const) {
      expect(globalNavigation(locale)).toHaveLength(4);
      expect(globalNavigation(locale).map(({ href }) => href.replace(/^\/(?:zh-cn|ko)(?=\/)/, '')))
        .toEqual(['/prices/', '/news/', '/tools/', '/guides/']);
    }
  });
  it('switches between the published English and Korean ranking hubs', () => {
    expect(languageDestinations('/rankings/', '?view=markets')).toEqual({
      en: '/rankings/?view=markets',
      ko: '/ko/rankings/?view=markets',
      'zh-CN': null,
    });
    expect(languageDestinations('/ko/rankings/').en).toBe('/rankings/');
  });
  it('preserves Seoul selection and building detail when switching languages', () => {
    const path = '/kr/seoul/explore/gangnam-gu/example/';
    const query = '?transaction=sale&area=all&buildingId=example';
    expect(languageDestinations(path, query).ko).toBe(`/ko${path}${query}`);
    expect(languageDestinations(`/ko${path}`, query).en).toBe(`${path}${query}`);
    expect(languageDestinations(path)['zh-CN']).toBeNull();
  });
  it('offers published Korean tools while keeping Chinese Explore unavailable', () => {
    for (const path of ['/sg/singapore/explore/', '/ae/dubai/explore/', '/kr/seoul/explore/']) {
      const html = renderToStaticMarkup(<LanguageLinks pathname={path} />);
      expect(html).toContain('>EN<');
      expect(html).toContain('>KO<');
      expect(html).not.toContain('>中文<');
      expect(html).not.toContain('aria-disabled');
      expect(html).not.toContain('href="/zh-cn/kr/seoul/explore/"');
    }
    expect(languageDestinations('/sg/singapore/explore/').ko).toBe('/ko/sg/singapore/explore/');
  });
  it.each(['/sg/singapore/hdb/ang-mo-kio/', '/sg/singapore/hdb/ang-mo-kio/123/'])('keeps both languages and the query on HDB route %s', (path) => {
    const query = '?transaction=resale&flatType=4-room';
    expect(languageDestinations(path, query).ko).toBe(`/ko${path}${query}`);
    expect(languageDestinations(`/ko${path}`, query).en).toBe(`${path}${query}`);
    const html = renderToStaticMarkup(<LanguageLinks pathname={`/ko${path}`} />);
    expect(html).toContain('>EN<');
    expect(html).toContain('>KO<');
    expect(html).not.toContain('>中文<');
  });
  it('keeps the current news filter on the Chinese index', () => {
    expect(languageDestinations('/news/', '?market=singapore')['zh-CN']).toBe('/zh-cn/news/?market=singapore');
  });
  it('does not advertise the redirect-only Korean markets route as a translation', () => {
    expect(languageDestinations('/markets/')).toEqual({
      en: '/markets/',
      ko: null,
      'zh-CN': null,
    });
  });
  it('links translated articles through actual translation groups', () => {
    const routes = editorialLanguageRoutes();
    const published = new Set([
      ...listPortfolioRecords().map((record) => record.canonicalHref),
      ...JOURNEY_ARTICLE_ROUTES.flatMap(({ city, id }) => ['en', 'ko'].map(locale => journeyArticleHref(city, id, locale as 'en' | 'ko'))),
    ]);
    for (const destinations of Object.values(routes)) for (const href of Object.values(destinations)) expect(published.has(href)).toBe(true);
    const translated = Object.entries(routes).find(([, destinations]) => destinations.en && destinations['zh-CN']);
    expect(translated).toBeDefined();
    const [path, destinations] = translated!;
    const html = renderToStaticMarkup(<LanguageLinks pathname={path} translations={routes} />);
    expect(html).toContain(destinations['zh-CN']!.replace(/\/$/, ''));
  });
  it('uses the same footer on editorial and market pages without duplicate market links', () => {
    const html = renderToStaticMarkup(<SiteFooter copy={homepageCopy.footer} />);
    expect(html.match(/href="\/sg\/?"/g)).toHaveLength(1);
    expect(html).not.toContain('Singapore Explore');
    expect(html).toMatch(/href="\/rankings\/?"[^>]*>Rankings<\/a>/);
    expect(html).toContain('Data &amp; sources');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('/kr/seoul/news/');
    expect(html).toMatch(/href="\/jp\/tokyo\/?">Tokyo<\/a>/);
    const positions = ['Explore', 'Insights', 'Tools', 'Guides'].map((label) => html.indexOf(`>${label}</a>`));
    expect(positions).toEqual([...positions].sort((a,b) => a-b));
  });
});
