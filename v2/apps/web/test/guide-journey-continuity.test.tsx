import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { BudgetGuideCallout } from '../components/guide/budget-guide-callout';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { JourneyArticle } from '../components/newsroom/journey-article';
import { getJourneyArticle, journeyArticleActions } from '../content/city-journey-articles';
import { marketDestination } from '../lib/navigation/site-navigation';
import { SiteHeader } from '../components/site-header';
import { homepageCopy } from '../lib/site-copy';
import { RegionalResource } from '../components/guide/regional-resource';

describe('guide journey continuity', () => {
  it.each(['en', 'ko', 'zh-CN'] as const)('opens the actual budget guide from the %s guide hub', locale => {
    const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
    const html = renderToStaticMarkup(<BudgetGuideCallout locale={locale} market="tokyo" />);
    expect(html).toContain(`href="${prefix}/guides/tokyo-apartment-buying-budget-guide"`);
    expect(html).not.toContain('/news?');
  });
  it.each(['en', 'ko', 'zh-CN'] as const)('keeps budget article breadcrumbs and next steps in %s and Tokyo', locale => {
    const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
    const html = renderToStaticMarkup(<NewsroomArticle article={getPortfolioRecord(locale, 'tokyo-apartment-buying-budget-guide')!} />);
    expect(html.match(/<nav[^>]*aria-label="(?:Breadcrumb|현재 위치|当前位置)"[\s\S]*?<\/nav>/)?.[0]).toContain(`href="${prefix}/guides?market=tokyo"`);
    expect(html).toContain('data-guide-next-steps="tokyo"');
    expect(html).toContain(`href="${prefix}/tools/property-scenario?market=jp-tokyo&amp;currency=JPY"`);
  });
  it.each(['en', 'ko'] as const)('classifies practical stages as guides and retains analysis in %s insights', locale => {
    const prefix = locale === 'ko' ? '/ko' : '';
    for (const stage of ['can-i-buy', 'which-home', 'make-it-happen']) {
      const html = renderToStaticMarkup(<JourneyArticle article={getJourneyArticle('tokyo', stage)!} locale={locale} />);
      expect(html.match(/<nav[\s\S]*?<\/nav>/)?.[0]).toContain(`${prefix}/guides?market=tokyo`);
      const header = renderToStaticMarkup(<SiteHeader copy={{...homepageCopy.header, languageLabel: locale === 'ko' ? 'KO' : 'EN', links: [{label:'current',href:`${prefix}/news/city-stories/tokyo/${stage}/`,isCurrent:true}]}} />);
      expect(header).toMatch(new RegExp(`aria-current="page"[^>]*href="${prefix}/guides"`));
      expect(marketDestination('sg-singapore', `${prefix}/news/city-stories/tokyo/${stage}/`, locale)).toBe(`${prefix}/guides/?market=singapore`);
    }
    const analysis = renderToStaticMarkup(<JourneyArticle article={getJourneyArticle('tokyo', 'old-condo-costs')!} locale={locale} />);
    expect(analysis.match(/<nav[\s\S]*?<\/nav>/)?.[0]).toContain(`${prefix}/news?market=tokyo`);
  });
  it('preserves city and currency in the calculator and Korean Tokyo exploration', () => {
    const actions = journeyArticleActions(getJourneyArticle('tokyo', 'can-i-buy')!, 'ko');
    expect(actions.related.find(link => link.href.includes('/tools/'))?.href).toBe('/ko/tools/property-scenario/?market=jp-tokyo&currency=JPY');
    expect(journeyArticleActions(getJourneyArticle('tokyo', 'make-it-happen')!, 'ko').primary.href).toBe('/ko/jp/tokyo/explore/');
  });
  it('uses the available Korean rental contract guide inside the Seoul reference content', () => {
    const html = renderToStaticMarkup(<RegionalResource city="seoul" resource="checklist" locale="ko" />);
    expect(html).toContain('href="/ko/guides/korea-rental-contract-checklist"');
    expect(html).not.toContain('(영어)');
  });
});

import EnglishGuidesPage from '../app/(en)/guides/page';
import KoreanGuidesPage from '../app/(ko)/ko/guides/page';
import ChineseGuidesPage from '../app/(zh-cn)/zh-cn/guides/page';

it.each([
  ['en', EnglishGuidesPage, 'Before you buy'],
  ['ko', KoreanGuidesPage, '매수 전 준비'],
  ['zh-CN', ChineseGuidesPage, '购房前准备'],
] as const)('offers the same city-scoped guide journey in %s', async (locale, Page, heading) => {
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({market:'tokyo'}) }));
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
  expect(main).toContain(heading);
  expect(main).toContain('tokyo-apartment-buying-budget-guide');
  expect(main).toContain('market=jp-tokyo&amp;currency=JPY');
  expect(main).not.toContain('rent-in-korea-zh');
  expect(main).not.toContain('/guides/rent-an-apartment-in-korea');
  if (locale === 'zh-CN') expect(main).toContain('（英文）');
});

import { BuyingGuide } from '../components/newsroom/buying-guide';
import { BUYING_GUIDE_DATA } from '../content/en/buying-guide-data';
import { parsePropertyScenarioContext } from '../lib/tools/property-scenario-context';
it('carries the selected buying-guide price ceiling into the city calculator', () => {
  for (const locale of ['en', 'ko'] as const) for (const guide of BUYING_GUIDE_DATA) for (const band of guide.bands) {
    const html = renderToStaticMarkup(<BuyingGuide guide={guide} locale={locale} initialBudget={String(band.cap)} />);
    const href = html.match(/href="([^"]*\/tools\/property-scenario[^\"]*)"/)?.[1];
    expect(href).toBeDefined();
    const url = new URL(href!.replaceAll('&amp;', '&'), 'https://signedprice.com');
    expect(parsePropertyScenarioContext(Object.fromEntries(url.searchParams), locale)).toMatchObject({ currency: guide.currency, price: band.cap });
    expect(url.pathname).toBe(`${locale === 'ko' ? '/ko' : ''}/tools/property-scenario`);
  }
});

it('keeps rental-guide next steps in rental evidence rather than the sale default', () => {
  const html = renderToStaticMarkup(<NewsroomArticle article={getPortfolioRecord('ko', 'wolse-vs-jeonse')!} />);
  expect(html).toContain('href="/ko/kr/seoul/explore?transaction=jeonse"');
  expect(html).toContain('href="/ko/kr/seoul/explore?transaction=monthly"');
});
