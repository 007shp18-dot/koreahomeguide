import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { listPortfolioRecords } from '../content/portfolio-manifest';
import { JOURNEY_ARTICLE_ROUTES, journeyArticleHref } from '../content/city-journey-routes';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { globalNavigation, languageDestinations, marketDestination } from '../lib/navigation/site-navigation';
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
      expect(globalNavigation(locale)).toHaveLength(5);
      expect(globalNavigation(locale).map(({ href }) => href.replace(/^\/(?:zh-cn|ko)(?=\/)/, '')))
        .toEqual(['/prices/', '/news/', '/news/?type=news', '/tools/', '/guides/']);
    }
  });
  it('keeps the news view while changing city and advertises only supported Tokyo guides', () => {
    expect(marketDestination('jp-tokyo', '/news/?type=news&market=dubai')).toBe('/news/?type=news&market=tokyo');
    expect(marketDestination('sg-singapore', '/news/?type=policy')).toBe('/news/?type=policy&market=singapore');
    expect(marketDestination('jp-tokyo', '/guides/', 'en')).toBe('/guides/?market=tokyo');
    expect(marketDestination('jp-tokyo', '/ko/guides/', 'ko')).toBe('/ko/guides/?market=tokyo');
    expect(marketDestination('jp-tokyo', '/zh-cn/guides/', 'zh-CN')).toBe('/zh-cn/guides/?market=tokyo');
  });
  it('retains Tokyo tools and saved tasks in every supported language', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
      expect(marketDestination('jp-tokyo', `${prefix}/tools/`, locale)).toBe(`${prefix}/jp/tokyo/tools/`);
      expect(marketDestination('jp-tokyo', `${prefix}/kr/seoul/check/`, locale)).toBe(`${prefix}/jp/tokyo/tools/`);
      expect(marketDestination('jp-tokyo', `${prefix}/kr/seoul/shortlist/`, locale)).toBe(`${prefix}/jp/tokyo/shortlist/`);
      expect(marketDestination('jp-tokyo', `${prefix}/news/?type=news&market=seoul`, locale)).toBe(`${prefix}/news/?type=news&market=tokyo`);
    }
  });
  it('advertises real Tokyo locale routes and preserves the selected ward and period', () => {
    const query = '?city=13113&year=2026&quarter=1';
    for (const section of ['', 'explore/', 'shortlist/']) {
      const path = `/jp/tokyo/${section}`;
      const destinations = languageDestinations(path, query);
      expect(destinations).toEqual({ en: `${path}${query}`, ko: `/ko${path}${query}`, 'zh-CN': `/zh-cn${path}${query}` });
      for (const [group, prefix] of [['(en)', ''], ['(ko)', '/ko'], ['(zh-cn)', '/zh-cn']]) {
        expect(existsSync(new URL(`../app/${group}${prefix}${path}page.tsx`, import.meta.url))).toBe(true);
      }
    }
    expect(languageDestinations('/zh-cn/')).toEqual({ en: '/', ko: '/ko/', 'zh-CN': '/zh-cn/' });
  });
  it('switches between the published English and Korean ranking hubs', () => {
    expect(languageDestinations('/rankings/', '?view=markets')).toEqual({
      en: '/rankings/?view=markets',
      ko: '/ko/rankings/?view=markets',
      'zh-CN': '/zh-cn/rankings/?view=markets',
    });
    expect(languageDestinations('/ko/rankings/').en).toBe('/rankings/');
  });
  it('preserves Seoul selection and building detail when switching languages', () => {
    const path = '/kr/seoul/explore/gangnam-gu/example/';
    const query = '?transaction=sale&area=all&buildingId=example';
    expect(languageDestinations(path, query).ko).toBe(`/ko${path}${query}`);
    expect(languageDestinations(`/ko${path}`, query).en).toBe(`${path}${query}`);
    expect(languageDestinations(path, query)['zh-CN']).toBe(`/zh-cn${path}${query}`);
  });
  it('offers the same Explore routes in all three languages', () => {
    for (const path of ['/sg/singapore/explore/', '/ae/dubai/explore/', '/kr/seoul/explore/']) {
      const html = renderToStaticMarkup(<LanguageLinks pathname={path} />);
      expect(html).toContain('>EN<');
      expect(html).toContain('>KO<');
      expect(html).toContain('>中文<');
      expect(html).not.toContain('aria-disabled');
      expect(languageDestinations(path)['zh-CN']).toBe(`/zh-cn${path}`);
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
    expect(html).toContain('>中文<');
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
  it('preserves Korean and Chinese Tokyo destinations in the footer and brand link', () => {
    for (const locale of ['ko', 'zh-CN'] as const) {
      const prefix = locale === 'ko' ? '/ko' : '/zh-cn';
      const html = renderToStaticMarkup(<SiteFooter locale={locale} copy={homepageCopy.footer} />);
      expect(html).toContain(`href="${prefix}/jp/tokyo"`);
      expect(html).toMatch(new RegExp(`aria-label="signedprice home"[^>]*href="${prefix}/?"`));
    }
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
