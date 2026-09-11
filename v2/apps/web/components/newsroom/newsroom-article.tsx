import { INSIGHT_PHOTOS } from '../../content/insight-photos';
import { NeighbourhoodPhoto } from './neighbourhood-photo';
import { KOREAN_BUYING_GUIDE_DATA } from '../../content/ko/buying-guides';
import { BuyingGuide } from './buying-guide';
import { ArticleContents } from './article-contents';
import { BUDGET_GUIDE_SLUGS } from '../../content/guide-directory';
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
import { MONTHLY_REPORT_REFERENCES } from '../../content/insight-curation';
import { marketHref } from '../../lib/locale/market-localization';
import { RESEARCH_FIGURES } from '../../content/en/research-figures';
import { Infographic } from '../infographics/infographic';
import { EditorialArticleHeader } from './editorial-article-header';
import layout from './journey-article.module.css';
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
  const zh = article.locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const chinese: Record<string, string> = { 'Budget comparison': '预算比较', Guides: '指南', News: '新闻', Insights: '洞察', Seoul: '首尔', Singapore: '新加坡', Dubai: '迪拜', Tokyo: '东京', Global: '全球', 'Check a price': '核对价格', 'Explore transaction records': '查看成交记录', 'Compare areas': '比较地区', 'Open calculator': '打开计算器', 'Read the guide': '阅读指南', 'Read related analysis': '阅读相关分析', Breadcrumb: '当前位置', Publisher: '发布者', Published: '发布日期', Updated: '更新日期', Sources: '来源', 'Related reading and tools': '相关阅读与工具', 'Model purchase costs and rental income': '计算购房成本与租赁收入' };
  const articlePhoto = INSIGHT_PHOTOS[article.slug];
  const budgetComparison = BUDGET_GUIDE_SLUGS.some(slug => slug === article.slug);
  const t = (en:string, translated:string) => ko ? translated : zh ? chinese[en] ?? en : en;
  const typeLabel = budgetComparison ? t('Budget comparison', '예산 비교') : ko ? ({'news-brief':'뉴스','policy-update':'정책','market-brief':'시장 분석','data-story':'데이터 분석',guide:'가이드'} as const)[article.type] : zh ? ({'news-brief':'新闻简报','policy-update':'政策更新','market-brief':'市场简报','data-story':'数据分析',guide:'指南'} as const)[article.type] : typeLabels[article.type];
  const buyingGuide = (ko ? KOREAN_BUYING_GUIDE_DATA : article.locale === 'en' ? BUYING_GUIDE_DATA : []).find(guide => guide.slug === article.slug);
  const figure = article.infographic ?? (ko ? KOREAN_RESEARCH_FIGURES[article.slug] : article.locale === 'en' ? RESEARCH_FIGURES[article.slug] : undefined);
  const contentSections = sections(article.bodyMarkdown);
  const section = article.type === 'guide' && !budgetComparison
    ? { label: t('Guides','가이드'), href: `${prefix}/guides/` }
    : article.type === 'news-brief' ? { label: t('News', '뉴스'), href: `${prefix}/news/?type=news` } : { label: t('Insights', '인사이트'), href: `${prefix}/news/` };
  const market = article.marketId === 'kr-seoul' ? t('Seoul','서울')
    : article.marketId === 'sg-singapore' ? t('Singapore','싱가포르') : article.marketId === 'ae-dubai' ? t('Dubai','두바이') : article.slug.startsWith('tokyo-') ? t('Tokyo','도쿄') : t('Global','전체 도시');
  const relatedHref = article.relatedHref === null ? null : marketHref(article.locale, article.relatedHref);
  const relatedLabel = relatedHref?.includes('/check') ? t('Check a price', '가격 확인하기')
    : relatedHref?.includes('/explore') ? t('Explore transaction records', '실거래가 탐색하기')
    : relatedHref?.includes('/rankings') ? t('Compare areas', '지역 비교하기')
    : relatedHref?.includes('/tools/') ? t('Open calculator', '계산기 열기')
    : relatedHref?.includes('/guide') ? t('Read the guide', '가이드 읽기')
    : t('Read related analysis', '관련 분석 읽기');
  const referenceReading = (MONTHLY_REPORT_REFERENCES[article.slug] ?? []).flatMap(slug => {
    const record = getPortfolioRecord(article.locale, slug);
    return record ? [{ href: record.canonicalHref, label: record.title }] : [];
  });
  const reading = [...relatedReading(article), ...referenceReading].map(item => {
    if (article.locale === 'en') return item;
    const slug = item.href.split('/').filter(Boolean).at(-1) ?? '';
    const translated = getPortfolioRecord(article.locale, slug);
    return { href: translated?.canonicalHref ?? marketHref(article.locale, item.href), label: translated?.title ?? item.label };
  });
  const scenarioCurrency = ({ 'kr-seoul': 'KRW', 'sg-singapore': 'SGD', 'ae-dubai': 'AED', 'jp-tokyo': 'JPY' } as Record<string, string>)[article.marketId ?? ''];
  const scenarioHref = scenarioCurrency && ['market-brief', 'data-story'].includes(article.type)
    ? `${article.locale === 'ko' ? '/ko' : article.locale === 'zh-CN' ? '/zh-cn' : ''}/tools/property-scenario/?market=${article.marketId}&currency=${scenarioCurrency}` : null;
  const relatedEvent = article.relatedHref?.includes('/check') ? 'article_to_check' : article.relatedHref?.includes('/explore') ? 'article_to_explore' : 'article_open';
  return <main
    className={`${layout.article} ${styles.standardArticle} ${isMonthlyReport(article.slug) ? styles.monthlyArticle : ''}`}
    data-editorial-content-id={article.id}
    data-editorial-content-type={article.type}
    data-editorial-locale={article.locale}
    data-editorial-market={article.marketId ?? undefined}
  >
    <nav className={layout.breadcrumb} aria-label={t('Breadcrumb', '현재 위치')}><Link href={section.href}>{section.label}</Link><span>{typeLabel}</span></nav>
    {isMonthlyReport(article.slug) ? <MonthlyReportNavigation slug={article.slug} locale={article.locale} /> : null}
    <EditorialArticleHeader topic={`${market} · ${typeLabel}`} title={article.title} deck={article.deck}>
      <span aria-label={`${t('Publisher', '발행')}: SignedPrice`}>SignedPrice</span><time aria-label={`${t('Published', '발행일')}: ${article.publishedAt.slice(0, 10)}`} dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
      <a href="#article-sources-title">{ko ? `출처 ${article.sources.length}개` : zh ? `${article.sources.length} 个来源` : `${article.sources.length} source${article.sources.length === 1 ? '' : 's'}`}</a>
      {article.updatedAt.slice(0, 10) !== article.publishedAt.slice(0, 10) && <span>{t('Updated', '수정')} <time dateTime={article.updatedAt}>{article.updatedAt.slice(0, 10)}</time></span>}
    </EditorialArticleHeader>
    {buyingGuide ? null : <ArticleContents locale={article.locale} items={contentSections.flatMap((item, index) => item.heading ? [{ id: `section-${index + 1}`, title: item.heading }] : [])} />}
    {isMonthlyReport(article.slug) ? <MonthlyReportTrend slug={article.slug} locale={article.locale} /> : null}
    {articlePhoto ? <div className={layout.hero}><NeighbourhoodPhoto id={articlePhoto} eager context /></div> : article.type === 'guide' && article.marketId ? <div className={styles.articlePhoto}><MarketRepresentativePhoto context="city" photo={article.marketId === 'kr-seoul' ? MARKET_PHOTOS.seoul : article.marketId === 'sg-singapore' ? MARKET_PHOTOS.singapore : article.marketId === 'ae-dubai' ? MARKET_PHOTOS.dubai : null} cityLabel={market} /></div> : null}
    {figure == null ? null : <Infographic spec={figure} />}
    {buyingGuide ? <BuyingGuide guide={buyingGuide} locale={ko ? "ko" : "en"} /> : <article className={layout.body}>
      {contentSections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}>{section.heading ? <h2>{section.heading}</h2> : null}<EditorialMarkdown source={section.body} /></section>)}
    </article>}
    <section className={styles.sources} aria-labelledby="article-sources-title" data-editorial-event="article_complete">
      <h2 id="article-sources-title">{t("Sources","출처")}</h2>
      <ol>{article.sources.map((source) => <li key={source.id}><span>{ko ? (source.kind === "primary" ? "공식 자료" : "참고 자료") : zh ? (source.kind === 'primary' ? '官方资料' : '参考资料') : source.kind}</span><a href={source.href} rel="noreferrer" data-editorial-event="policy_source_open">{source.publisher} · {source.title}</a></li>)}</ol>
    </section>
    {relatedHref === null && reading.length === 0 && !scenarioHref ? null : <aside className={styles.relatedAction}><p>{t("Related reading and tools","이어서 살펴보기")}</p>{relatedHref === null ? null : <Link href={relatedHref} data-editorial-event={relatedEvent}>{relatedLabel}</Link>}{scenarioHref && <Link href={scenarioHref}>{article.locale === 'zh-CN' ? '计算购房成本与租赁收入' : t('Model purchase costs and rental income', '매입 비용·임대수익 계산하기')}</Link>}{reading.filter(({ href }) => !href.endsWith(`/${article.slug}/`)).map((item) => <Link key={item.href} href={item.href} data-editorial-event="article_open">{item.label}</Link>)}</aside>}
  </main>;
}
