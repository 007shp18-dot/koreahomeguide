import { KOREAN_BUYING_GUIDE_DATA } from '../../content/ko/buying-guides';
import { BuyingGuide } from './buying-guide';
import { BUYING_GUIDE_DATA } from '../../content/en/buying-guide-data';
import { relatedReading } from '../../content/related-reading';
import { MonthlyReportNavigation, MonthlyReportTrend, isMonthlyReport } from './monthly-reports';
import Link from 'next/link';
import { EditorialMarkdown } from '../insights/editorial-markdown';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';

import type { PublishedContentArticle } from '../../lib/content/content-types';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { KOREAN_RESEARCH_FIGURES } from '../../content/ko/research-figures';
import { getPortfolioRecord } from '../../content/portfolio-manifest';
import { marketHref } from '../../lib/locale/market-localization';
import { RESEARCH_FIGURES } from '../../content/en/research-figures';
import { Infographic } from '../infographics/infographic';
import styles from './newsroom.module.css';

const typeLabels = Object.freeze({
  'news-brief': 'News Brief',
  'policy-update': 'Policy Update',
  'market-brief': 'Market Brief',
  'data-story': 'Data Story',
  guide: 'Guide',
});

function sections(body: string): readonly Readonly<{ heading: string; body: string }>[] {
  return body.split(/(?=^## )/mu).map(block => {
    const text = block.trim();
    if (!text.startsWith('## ')) return { heading: '', body: text };
    const end = text.indexOf('\n');
    return { heading: text.slice(3, end < 0 ? undefined : end).trim(), body: end < 0 ? '' : text.slice(end).trim() };
  }).filter(section => section.body.length > 0);
}

export function NewsroomArticle({ article }: Readonly<{
  article: PublishedContentArticle & Readonly<{ infographic?: InfographicSpec | null }>;
}>) {
  const ko = article.locale === 'ko';
  const t = (en:string, translated:string) => ko ? translated : en;
  const typeLabel = ko ? ({'news-brief':'뉴스','policy-update':'정책','market-brief':'시장 분석','data-story':'데이터 분석',guide:'가이드'} as const)[article.type] : typeLabels[article.type];
  const buyingGuide = (ko ? KOREAN_BUYING_GUIDE_DATA : article.locale === 'en' ? BUYING_GUIDE_DATA : []).find(guide => guide.slug === article.slug);
  const figure = article.infographic ?? (ko ? KOREAN_RESEARCH_FIGURES[article.slug] : article.locale === 'en' ? RESEARCH_FIGURES[article.slug] : undefined);
  const contentSections = sections(article.bodyMarkdown);
  const section = article.type === 'guide'
    ? { label: t('Guides','가이드'), href: ko ? '/ko/guides/' : '/guides/' }
    : { label: t('News', '뉴스'), href: ko ? '/ko/news/' : '/news/' };
  const market = article.marketId === 'kr-seoul' ? t('Seoul','서울')
    : article.marketId === 'sg-singapore' ? t('Singapore','싱가포르') : article.marketId === 'ae-dubai' ? t('Dubai','두바이') : t('Global','전체 도시');
  const relatedHref = article.relatedHref === null ? null : marketHref(ko ? 'ko' : 'en', article.relatedHref);
  const relatedLabel = relatedHref?.includes('/check') ? t('Check a price', '가격 확인하기')
    : relatedHref?.includes('/explore') ? t('Explore transaction records', '실거래가 탐색하기')
    : relatedHref?.includes('/rankings') ? t('Compare areas', '지역 비교하기')
    : relatedHref?.includes('/tools/') ? t('Open calculator', '계산기 열기')
    : relatedHref?.includes('/guide') ? t('Read the guide', '가이드 읽기')
    : t('Read related analysis', '관련 분석 읽기');
  const reading = relatedReading(article).map(item => {
    if (!ko) return item;
    const slug = item.href.split('/').filter(Boolean).at(-1) ?? '';
    const translated = getPortfolioRecord('ko', slug);
    return { href: translated?.canonicalHref ?? marketHref('ko', item.href), label: translated?.title ?? '두바이 매수 절차 살펴보기' };
  });
  const relatedEvent = article.relatedHref?.includes('/check') ? 'article_to_check' : article.relatedHref?.includes('/explore') ? 'article_to_explore' : 'article_open';
  return <main
    className={`${styles.article} ${isMonthlyReport(article.slug) ? styles.monthlyArticle : ''}`}
    data-editorial-content-id={article.id}
    data-editorial-content-type={article.type}
    data-editorial-locale={article.locale}
    data-editorial-market={article.marketId ?? undefined}
  >
    <nav className={styles.breadcrumb} aria-label={t('Breadcrumb', '현재 위치')}><Link href={section.href}>{section.label}</Link><span>{typeLabel}</span></nav>
    {isMonthlyReport(article.slug) ? <MonthlyReportNavigation slug={article.slug} locale={ko ? 'ko' : 'en'} /> : null}
    <header className={styles.articleHero}>
      <p>{typeLabel} · {market}</p>
      <h1>{article.title}</h1>
      <div className={styles.deck}>{article.deck}</div>
      <dl className={styles.byline}>
        <div><dt>{t("Publisher","발행")}</dt><dd>SignedPrice</dd></div>
        <div><dt>{t("Published","발행일")}</dt><dd><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time></dd></div>
        <div><dt>{t("Sources","출처")}</dt><dd><a href="#article-sources-title">{ko ? `${article.sources.length}개` : `${article.sources.length} source${article.sources.length === 1 ? '' : 's'}`}</a></dd></div>
        <div><dt>{t("Updated","수정일")}</dt><dd><time dateTime={article.updatedAt}>{article.updatedAt.slice(0, 10)}</time></dd></div>
      </dl>
    </header>
    {isMonthlyReport(article.slug) ? <MonthlyReportTrend slug={article.slug} locale={ko ? 'ko' : 'en'} /> : null}
    {article.type === 'guide' && article.marketId ? <div className={styles.articlePhoto}><MarketRepresentativePhoto context="city" photo={article.marketId === 'kr-seoul' ? MARKET_PHOTOS.seoul : article.marketId === 'sg-singapore' ? MARKET_PHOTOS.singapore : article.marketId === 'ae-dubai' ? MARKET_PHOTOS.dubai : null} cityLabel={market} /></div> : null}
    {figure == null ? null : <Infographic spec={figure} />}
    {buyingGuide || contentSections.length < 5 ? null : <nav className={styles.contents} aria-label={t('In this article', '이 글의 내용')}><p>{t("In this article","이 글의 내용")}</p>{contentSections.map((item, index) => item.heading ? <a href={`#section-${index + 1}`} key={item.heading}>{item.heading}</a> : null)}</nav>}
    {buyingGuide ? <BuyingGuide guide={buyingGuide} locale={ko ? "ko" : "en"} /> : <article className={styles.articleBody}>
      {contentSections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}>{section.heading ? <h2>{section.heading}</h2> : null}<EditorialMarkdown source={section.body} /></section>)}
    </article>}
    <section className={styles.sources} aria-labelledby="article-sources-title" data-editorial-event="article_complete">
      <h2 id="article-sources-title">{t("Sources","출처")}</h2>
      <ol>{article.sources.map((source) => <li key={source.id}><span>{ko ? (source.kind === "primary" ? "공식 자료" : "참고 자료") : source.kind}</span><a href={source.href} rel="noreferrer" data-editorial-event="policy_source_open">{source.publisher} · {source.title}</a><small>{t("Checked", "확인일")} {source.checkedAt.slice(0, 10)}</small></li>)}</ol>
    </section>
    {relatedHref === null ? null : <aside className={styles.relatedAction}><p>{t("Related reading and tools","이어서 살펴보기")}</p><Link href={relatedHref} data-editorial-event={relatedEvent}>{relatedLabel}</Link>{reading.filter(({ href }) => !href.endsWith(`/${article.slug}/`)).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</aside>}
  </main>;
}
