import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { getJourneyArticle } from '../content/city-journey-articles';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import { NEIGHBOURHOOD_STORIES } from '../content/neighbourhood-stories';
import { INSIGHT_REFERENCE_SLUGS } from '../content/insight-curation';
import { buildInsightItems } from '../components/newsroom/insights-index';
import { JourneyArticle } from '../components/newsroom/journey-article';
import { NeighbourhoodArticle } from '../components/newsroom/neighbourhood-story';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';

afterEach(() => vi.useRealTimers());

describe('consistent insight articles and curation', () => {
  it('publishes both recent property insights in English and Korean without draft tokens', () => {
    for (const slug of ['singapore-condo-prices-2026-by-project', 'tokyo-asking-price-vs-contracted-price-2026']) {
      for (const locale of ['en', 'ko'] as const) {
        const article = getPortfolioRecord(locale, slug);
        expect(article).not.toBeNull();
        expect(article!.title + article!.bodyMarkdown).not.toMatch(/\[(?:n|month|date|district[^\]]*)\]/i);
        const html = renderToStaticMarkup(<NewsroomArticle article={article!} />);
        expect(html).toContain('id="section-1"');
        expect(html).toContain('%2Fassets%2Feditorial-2026-09%2F');
        expect(html).toContain('id="article-sources-title"');
        expect(article!.canonicalHref).toBe(`${locale === 'ko' ? '/ko' : ''}/news/${slug}/`);
      }
    }
  });
  it('uses the verified Seongsu street photo on both the card and the article', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    const item = buildInsightItems([], 'seoul').find(item => item.href.endsWith('/seongsu/'));
    expect(item?.photo?.src).toBe('/assets/stories/seongsu-evening-street.jpg');
    expect(item?.photo?.source).toContain('Evening_street_in_Seongsu-dong');
    for (const locale of ['en', 'ko'] as const) {
      const html = renderToStaticMarkup(<JourneyArticle article={getJourneyArticle('seoul', 'seongsu')!} locale={locale} />);
      expect(html).toContain('data-neighbourhood-photo="seoul-street"');
      expect(html.indexOf('data-neighbourhood-photo="seoul-street"')).toBeLessThan(html.indexOf('data-article-contents'));
    }
  });

  it('keeps all three Seoul stories readable without adding the full buying journey or an unrelated city photo', () => {
    for (const id of ['seongsu', 'wangsimni', 'mangwon']) {
      const html = renderToStaticMarkup(<JourneyArticle article={getJourneyArticle('seoul', id)!} locale="en" />);
      expect(html).toContain('data-editorial-article-header');
      expect(html).toContain('data-article-contents');
      expect(html).toContain('Related reading');
      expect(html).toContain('id="article-sources"');
      expect(html).not.toContain('aria-label="City buying journey"');
      expect(html).not.toContain('data-market-representative-photo');
      expect(html).toContain('data-neighbourhood-photo');
    }
  });

  it('gives the published insight cards credited photos with varied scenes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    const items = buildInsightItems([], 'all');
    expect(items.every(item => item.photo?.source && item.photo.licenseUrl)).toBe(true);
    for (const item of items) {
      expect(item.photo?.src.startsWith('/')).toBe(true);
      expect(existsSync(fileURLToPath(new URL(`../public${item.photo?.src}`, import.meta.url)))).toBe(true);
    }
    expect(new Set(items.map(item => item.photo?.src)).size).toBeGreaterThanOrEqual(24);
    expect(items.find(item => item.href.endsWith('/wangsimni/'))?.photo?.src).toContain('wangsimni-station');
    expect(items.find(item => item.href.endsWith('/mangwon/'))?.photo?.src).toContain('mangwon-river');
  });

  it('uses the same article header for daily neighbourhood stories and existing analysis', () => {
    for (const story of NEIGHBOURHOOD_STORIES) {
      const html = renderToStaticMarkup(<NeighbourhoodArticle story={story} />);
      expect(html).toContain('data-editorial-article-header');
      expect(html).toContain('data-article-contents');
      expect(html).toContain('id="article-sources"');
    }
    const article = getPortfolioRecord('en', 'dubai-rental-yield-after-costs')!;
    const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
    expect(html).toContain('data-editorial-article-header');
    expect(html).toContain(article.title.replaceAll("'", '&#x27;'));
  });

  it('moves four coverage explainers out of Latest stories while preserving their pages and monthly-report links', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    const items = buildInsightItems([], 'all');
    expect(items).toHaveLength(33);
    const seoul = renderToStaticMarkup(<NewsroomArticle article={getPortfolioRecord('en', 'seoul-monthly-2026-09')!} />);
    const singapore = renderToStaticMarkup(<NewsroomArticle article={getPortfolioRecord('en', 'singapore-monthly-2026-09')!} />);
    for (const slug of INSIGHT_REFERENCE_SLUGS) {
      expect(items.some(item => item.href.includes(slug))).toBe(false);
      expect(getPortfolioRecord('en', slug)?.status).toBe('published');
      expect(seoul + singapore).toContain(`/news/${slug}`);
    }
  });
});
