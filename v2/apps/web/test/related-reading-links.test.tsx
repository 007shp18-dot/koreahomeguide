import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { localizeReadingLink } from '../content/related-reading';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';

describe('localized related reading', () => {
  it('uses the actual translated slug when English and Chinese slugs differ', () => {
    expect(localizeReadingLink({ href: '/guides/wolse-vs-jeonse/', label: 'Compare leases' }, 'zh-CN', EDITORIAL_PORTFOLIO).href)
      .toBe('/zh-cn/guides/wolse-vs-jeonse-zh/');
  });
  it('keeps the English destination and labels its language when no translation exists', () => {
    expect(localizeReadingLink({ href: '/guides/seoul-apartment-buying-budget-guide/', label: 'Seoul budget' }, 'zh-CN', EDITORIAL_PORTFOLIO))
      .toEqual({ href: '/guides/seoul-apartment-buying-budget-guide/', label: 'Seoul budget（英文）' });
  });
  it('preserves language, query and anchor on an existing tool route', () => {
    expect(localizeReadingLink({ href: '/kr/seoul/explore/?transaction=monthly#results', label: 'Explore' }, 'ko', EDITORIAL_PORTFOLIO).href)
      .toBe('/ko/kr/seoul/explore/?transaction=monthly#results');
  });
  it('renders every Chinese portfolio article without the five nonexistent translations', () => {
    const missing = ['guides/seoul-apartment-buying-budget-guide', 'guides/read-seoul-sale-transactions', 'guides/read-singapore-private-transactions', 'news/singapore-ccr-rcr-ocr-comparison', 'guides/dubai-ready-apartment-buying-budget-guide'];
    for (const article of EDITORIAL_PORTFOLIO.filter(record => record.locale === 'zh-CN')) {
      const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
      for (const path of missing) expect(html).not.toContain(`href="/zh-cn/${path}/"`);
    }
  });
});
