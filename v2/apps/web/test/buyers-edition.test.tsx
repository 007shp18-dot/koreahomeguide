import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('server-only', () => ({}));
import { BUYERS_EDITION } from '../content/buyers-edition';
import { EDITORIAL_DEPTH } from '../content/editorial-depth';
import { getPortfolioRecord, listPortfolioRecords } from '../content/portfolio-manifest';
import retired from '../content/retired-editorial.json';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { buildInsightItems } from '../components/newsroom/insights-index';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { isPublishableContent } from '../lib/content/content-repository.server';
import config from '../next.config';
const proseWords = (body: string) => body.replace(/\[[^\]]*\]\([^)]*\)/g, '').split('\n').filter(line => !/^[|#]/.test(line)).join(' ').match(/\b[\w]+(?:[’'-][\w]+)*\b/g)?.length ?? 0;

describe('September buyer edition and community-informed editorial cleanup', () => {
  it('publishes six distinct bilingual subjects with substantial prose and navigable language pairs', () => {
    expect(BUYERS_EDITION).toHaveLength(12);
    const routes = editorialLanguageRoutes();
    for (const record of BUYERS_EDITION) {
      const story = getPortfolioRecord(record.locale, record.slug)!;
      expect(story).toEqual(record);
      expect(routes[record.canonicalHref]?.[record.locale === 'en' ? 'ko' : 'en']).toBe(BUYERS_EDITION.find(item => item.slug === record.slug && item.locale !== record.locale)!.canonicalHref);
      if (record.locale === 'en') expect(proseWords(record.bodyMarkdown)).toBeGreaterThanOrEqual(/without-a-car|everton-park/.test(record.slug) ? 600 : 800);
      else expect(record.bodyMarkdown.length).toBeGreaterThanOrEqual(2000);
      expect(record.bodyMarkdown).not.toMatch(/\*\*|^\d+\. /m);
    }
    for (const slug of Object.keys(EDITORIAL_DEPTH)) expect(proseWords(getPortfolioRecord('en', slug)!.bodyMarkdown), slug).toBeGreaterThanOrEqual(800);
  });
  it('renders the strengthened buying prose alongside the evidence widget', () => {
    const article = getPortfolioRecord('en', 'seoul-apartment-buying-budget-guide')!;
    const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
    expect(html).toContain('Give your budget a second line');
    expect(html).toContain('What changes between these budgets?');
    const budgets = buildInsightItems([], 'all', 'ko', 'budget');
    expect(budgets.some(item => item.slug === 'seoul-59-to-84-upgrade-budget')).toBe(true);
    expect(budgets.some(item => item.slug === 'dubai-two-million-total-purchase-budget')).toBe(true);
    const neighbourhoods = buildInsightItems([], 'all', 'ko', 'neighborhood');
    expect(neighbourhoods.some(item => item.slug === 'singapore-everton-park-blair-plain-afternoon' && item.requiresLocalPhoto)).toBe(true);
  });
  it('retires weak translations as well as originals and retains permanent relevant destinations', async () => {
    const redirects = await config.redirects!();
    for (const [slug, destination] of Object.entries(retired)) {
      expect(listPortfolioRecords().some(item => item.slug === slug)).toBe(false);
      const source = { ...BUYERS_EDITION[0]!, slug };
      expect(isPublishableContent(source)).toBe(false);
      const path = destination.split('/').filter(Boolean);
      if (path[0] === 'guides' || path.length === 2) expect(getPortfolioRecord('en', path.at(-1)!)).toBeDefined();
      expect(redirects).toContainEqual({ source: `/news/${slug}/`, destination, permanent: true });
    }
  });
});
