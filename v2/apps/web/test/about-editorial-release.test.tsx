import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import AboutPage, { generateMetadata } from '../app/(en)/about/page';
import KoreanAbout, { metadata as koMetadata } from '../app/(ko)/ko/about/page';
import { ContactPageContent } from '../components/operator/contact-page-content';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { insightPhoto } from '../content/insight-photos';
import sitemap from '../app/sitemap';
import { languageDestinations } from '../lib/navigation/site-navigation';

describe('About and September editorial release', () => {
  it('links the service introduction to the existing form in each language and publishes canonical pairs', () => {
    for (const [locale, Page, path] of [['en', AboutPage, '/about/'], ['ko', KoreanAbout, '/ko/about/']] as const) {
      const html = renderToStaticMarkup(<Page />);
      const contact = locale === 'ko' ? '/ko/contact/' : '/contact/';
      expect(html).toMatch(new RegExp(`href="${contact.slice(0, -1)}/?"`));
      expect(html).not.toMatch(/Samsung|삼성|준비 중|coming soon/i);
      expect(renderToStaticMarkup(<ContactPageContent locale={locale} privacyContact="privacy@signedprice.com" />)).toMatch(new RegExp(`href="${path.slice(0, -1)}/?"`));
      expect(sitemap().some(entry => entry.url.endsWith(path))).toBe(true);
    }
    expect(languageDestinations('/about/')).toEqual({ en: '/about/', ko: '/ko/about/', 'zh-CN': null });
    expect(generateMetadata().alternates?.canonical).toBe('https://www.signedprice.com/about/');
    expect(koMetadata.alternates?.canonical).toBe('https://www.signedprice.com/ko/about/');
  });
  it('renders the missing Singapore photograph with attribution in both editions', () => {
    const slug = 'singapore-everton-park-blair-plain-afternoon';
    const photo = insightPhoto(slug)!;
    expect(existsSync(resolve('apps/web/public', '.' + photo.src))).toBe(true);
    for (const locale of ['en', 'ko']) {
      const article = EDITORIAL_PORTFOLIO.find(a => a.slug === slug && a.locale === locale)!;
      const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
      expect(html).toContain('data-neighbourhood-photo="singapore-baba-house"');
      expect(html).toContain('Franklin Heijnen');
      expect(html).toContain('CC BY-SA 2.0');
    }
  });
  it('publishes a substantive bilingual crypto column with local follow-through and explicit scenarios', () => {
    const articles = EDITORIAL_PORTFOLIO.filter(a => a.slug === 'dubai-buy-property-with-bitcoin');
    expect(articles.map(a => a.locale).sort()).toEqual(['en', 'ko']);
    for (const article of articles) {
      expect(article.bodyMarkdown).toContain(article.locale === 'ko' ? '](/ko/contact/)' : '](/contact/)');
      expect(article.sources.every(source => source.kind === 'primary')).toBe(true);
      expect(renderToStaticMarkup(<NewsroomArticle article={article} />)).toContain('dubai-day');
    }
  });
});
