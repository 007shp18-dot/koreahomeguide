import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { CITY_JOURNEY_ARTICLES, getJourneyArticle, journeyArticleActions, journeyArticleParams } from '../content/city-journey-articles';
import { JOURNEY_ARTICLE_ROUTES, JOURNEY_CITIES, STORY_STEPS, journeyArticleHref, localIssueHref } from '../content/city-journey-routes';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { JourneyArticle } from '../components/newsroom/journey-article';
import { getPortfolioRecord } from '../content/portfolio-manifest';

describe('standalone city article publication', () => {
  it('publishes 24 distinct stages, three Seoul neighbourhoods and three new local issues', () => {
    expect(CITY_JOURNEY_ARTICLES).toHaveLength(30);
    expect(CITY_JOURNEY_ARTICLES.filter(item => item.kind === 'journey')).toHaveLength(24);
    expect(new Set(CITY_JOURNEY_ARTICLES.map(item => journeyArticleHref(item.city, item.id))).size).toBe(30);
    expect(CITY_JOURNEY_ARTICLES.map(({ city, id }) => `${city}/${id}`).sort()).toEqual(JOURNEY_ARTICLE_ROUTES.map(({ city, id }) => `${city}/${id}`).sort());
    for (const city of JOURNEY_CITIES) expect(CITY_JOURNEY_ARTICLES.filter(item => item.city === city && item.kind === 'journey').map(item => item.id)).toEqual(STORY_STEPS.map(step => step.id));
    expect(journeyArticleParams()).toHaveLength(30);
    expect(getJourneyArticle('unknown', 'discover')).toBeUndefined();
    expect(getJourneyArticle('tokyo', 'seongsu')).toBeUndefined();
  });

  it('offers complete localized bodies and traceable sources for every article', () => {
    expect(CITY_JOURNEY_ARTICLES.length).toBeGreaterThan(0);
    for (const article of CITY_JOURNEY_ARTICLES) {
      expect(article.checkedAt).toBe('2026-09-09');
      expect(article.sections.length).toBeGreaterThanOrEqual(3);
      expect(article.sections.flatMap(section => section.paragraphs.en).length).toBeGreaterThanOrEqual(5);
      expect(new Set(article.sections.map(section => section.id)).size).toBe(article.sections.length);
      expect(article.sources.length, article.id).toBeGreaterThan(0);
      for (const source of article.sources) expect(new URL(source.href).protocol).toBe('https:');
      for (const locale of ['en', 'ko'] as const) {
        expect(article.title[locale].trim().length).toBeGreaterThan(8);
        expect(article.deck[locale].trim().length).toBeGreaterThan(30);
        for (const section of article.sections) {
          expect(section.title[locale].trim().length).toBeGreaterThan(0);
          expect(section.paragraphs[locale].length).toBeGreaterThan(0);
          if (locale === 'ko') expect(section.paragraphs.ko.every(paragraph => /[가-힣]/.test(paragraph)), `${article.city}/${article.id}/${section.id}`).toBe(true);
          for (const id of section.sourceIds) expect(article.sources.some(source => source.id === id), `${article.id}: ${id}`).toBe(true);
        }
        const actions = journeyArticleActions(article, locale);
        expect(actions.related).toHaveLength(2);
        expect(new Set([actions.primary.href, ...actions.related.map(link => link.href)]).size).toBe(3);
        expect(editorialLanguageRoutes()[journeyArticleHref(article.city, article.id, locale)]?.[locale === 'ko' ? 'en' : 'ko']).toBe(journeyArticleHref(article.city, article.id, locale === 'ko' ? 'en' : 'ko'));
      }
    }
  });

  it('renders independent contents, source citations, neighbourhood links and both illustrative cost tables', () => {
    for (const locale of ['en', 'ko'] as const) {
      const where = renderToStaticMarkup(<JourneyArticle article={getJourneyArticle('seoul', 'where')!} locale={locale} />);
      for (const id of ['seongsu', 'wangsimni', 'mangwon']) expect(where).toContain(journeyArticleHref('seoul', id, locale).replace(/\/$/, ''));
      for (const [city, id] of [['seoul', 'buy-jeonse-rent'], ['tokyo', 'old-condo-costs']] as const) {
        const html = renderToStaticMarkup(<JourneyArticle article={getJourneyArticle(city, id)!} locale={locale} />);
        expect(html).toContain('data-article-contents');
        expect(html).toContain('href="#source-');
        expect(html).toContain('<table>');
        expect(html).toContain('data-editorial-event="article_complete"');
        expect(html).toMatch(/data-editorial-event="article_(?:open|to_explore|to_check)"/);
        expect(html).toContain(locale === 'ko' ? '가정' : 'hypothetical');
      }
    }
  });

  it('reuses the published Dubai analysis in both languages', () => {
    for (const locale of ['en', 'ko'] as const) {
      const existing = getPortfolioRecord(locale, 'dubai-rental-yield-after-costs');
      expect(existing?.canonicalHref).toBe(localIssueHref('dubai', locale));
    }
    expect(CITY_JOURNEY_ARTICLES.some(item => item.city === 'dubai' && item.kind === 'local-issue')).toBe(false);
  });
});
