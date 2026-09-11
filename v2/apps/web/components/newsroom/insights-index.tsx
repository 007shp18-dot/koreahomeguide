import Image from 'next/image';
import Link from 'next/link';
import { listNeighbourhoodStories, neighbourhoodHref, type NeighbourhoodPhoto } from '../../content/neighbourhood-stories';
import { CITY_JOURNEY_ARTICLES } from '../../content/city-journey-articles';
import { journeyArticlePhoto } from '../../content/journey-article-photos';
import { insightPhoto } from '../../content/insight-photos';
import { isInsightReference } from '../../content/insight-curation';
import { journeyArticleHref } from '../../content/city-journey-routes';
import { BUDGET_GUIDE_SLUGS } from '../../content/guide-directory';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import type { ContentLocale, PublishedContentArticle } from '../../lib/content/content-types';
import { MARKET_PHOTOS } from '../market-representative-photo';
import type { NewsroomMarketFilter } from './newsroom-index';
import styles from './insights-index.module.css';

const cities = ['seoul', 'singapore', 'dubai', 'tokyo'] as const;
type City = typeof cities[number];
const cityNames = { seoul: 'Seoul', tokyo: 'Tokyo', singapore: 'Singapore', dubai: 'Dubai' };
const marketIds = { seoul: 'kr-seoul', tokyo: 'jp-tokyo', singapore: 'sg-singapore', dubai: 'ae-dubai' };
export type InsightTopic = 'all' | 'investment';
type Insight = { investment: boolean; language: ContentLocale; id: string; title: string; deck: string; href: string; date: string; city: City | null; topic: string; type: string; photo?: NeighbourhoodPhoto; requiresLocalPhoto?: boolean };

function topicFor(title: string, type: string) {
  if (/maintenance|holding|ownership|ten years|costs|service charge/i.test(title)) return 'Ownership costs';
  if (/budget|premium|afford|JPY|price|rent|jeonse/i.test(title)) return 'Housing prices & costs';
  if (type === 'policy-update' || /eligibility|tax|buying rule/i.test(title)) return 'Buying rules';
  if (type === 'neighborhood') return 'Neighborhood living';
  return 'Housing market';
}

export function buildInsightItems(articles: readonly PublishedContentArticle[], market: NewsroomMarketFilter, locale: ContentLocale = 'en', topic: InsightTopic = 'all'): Insight[] {
  const storyLocale = locale === 'ko' ? 'ko' : 'en';
  const notebook: Insight[] = listNeighbourhoodStories('all', storyLocale).map(item => ({ investment: false, language: storyLocale, id: `${storyLocale}:${item.slug}`, title: item.title, deck: item.deck, href: neighbourhoodHref(item.slug, storyLocale), date: item.publishedAt, city: item.city as City, topic: 'Neighborhood living', type: 'guide', photo: item.photosWithheld ? undefined : item.hero, requiresLocalPhoto: true }));
  // Investment includes explicit local financial analyses, published market/data/policy
  // records and reviewed buying-budget guides; lifestyle stories remain in All.
  const local: Insight[] = CITY_JOURNEY_ARTICLES.filter(item => item.kind !== 'journey').map(item => ({ investment: item.kind === 'local-issue', language: storyLocale, id: `${storyLocale}:city-article-${item.city}-${item.id}`, title: item.title[storyLocale], deck: item.deck[storyLocale], href: journeyArticleHref(item.city, item.id, storyLocale), date: item.checkedAt, city: item.city, topic: topicFor(item.title.en, item.kind), type: item.kind === 'neighborhood' ? 'guide' : 'data-story', photo: journeyArticlePhoto(item.city, item.id), requiresLocalPhoto: item.kind === 'neighborhood' }));
  const english = listPortfolioRecords('en');
  const englishTitles = new Map(english.flatMap(item => [[item.slug, item.title] as const, [item.translationGroupId ?? item.slug, item.title] as const]));
  const translated = listPortfolioRecords(locale);
  const translatedGroups = new Set(translated.map(item => item.translationGroupId ?? item.slug));
  const fallback = locale === 'en' ? [] : english.filter(item => !translatedGroups.has(item.translationGroupId ?? item.slug) && !translated.some(local => local.slug === item.slug));
  const records = [...articles, ...fallback, ...translated.filter(item => item.type !== 'guide' || BUDGET_GUIDE_SLUGS.some(slug => slug === item.slug))].filter(item => !isInsightReference(item.slug));
  const analysis: Insight[] = records.filter(item => item.status === 'published' && item.evidenceState !== 'withdrawn' && item.type !== 'news-brief' && (item.type !== 'guide' || BUDGET_GUIDE_SLUGS.some(slug => slug === item.slug))).map(item => ({ investment: ['market-brief', 'data-story', 'policy-update'].includes(item.type) || BUDGET_GUIDE_SLUGS.some(slug => slug === item.slug), language: item.locale, id: item.id, title: item.title, deck: item.deck, href: 'canonicalHref' in item ? String(item.canonicalHref) : `${item.locale === 'ko' ? '/ko' : item.locale === 'zh-CN' ? '/zh-cn' : ''}/news/${item.type === 'policy-update' ? 'policy/' : ''}${item.slug}/`, date: item.publishedAt, city: cities.find(city => marketIds[city] === item.marketId) ?? null, topic: topicFor(englishTitles.get(item.slug) ?? ('translationGroupId' in item && typeof item.translationGroupId === 'string' ? englishTitles.get(item.translationGroupId) : undefined) ?? item.title, item.type), type: item.type, photo: insightPhoto(item.slug) }));
  const seen = new Set<string>();
  const now = Date.now();
  return [...notebook, ...local, ...analysis].filter(item => {
    if (!Number.isFinite(Date.parse(item.date)) || Date.parse(item.date) > now) return false;
    if (topic === 'investment' && !item.investment) return false;
    if ((market !== 'all' && item.city !== market) || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).sort((a, b) => b.date.slice(0, 10).localeCompare(a.date.slice(0, 10)));
}

function StoryPhoto({ item, eager = false, locale = 'en' }: { item: Insight; eager?: boolean; locale?: ContentLocale }) {
  const photo = item.photo ?? (!item.requiresLocalPhoto && item.city ? MARKET_PHOTOS[item.city] : undefined);
  if (!photo) return null;
  return <figure className={styles.photo}>
    <Link href={item.href} data-editorial-event="article_open" aria-label={item.title} tabIndex={-1}>
      <Image src={photo.src} alt={photo.alt} fill priority={eager} sizes={eager ? '(max-width: 760px) calc(100vw - 40px), 700px' : '(max-width: 600px) calc(100vw - 40px), (max-width: 960px) 45vw, 380px'} />
    </Link>
    {item.photo && <details className={styles.credit}><summary aria-label={locale === 'ko' ? '사진 출처' : locale === 'zh-CN' ? '图片来源' : 'Photo credit'}>{locale === 'ko' ? '사진' : locale === 'zh-CN' ? '图片' : 'Photo'}</summary><span>{item.photo.caption} · <a href={item.photo.source}>{item.photo.author}</a> · <a href={item.photo.licenseUrl}>{item.photo.license}</a></span></details>}
  </figure>;
}

function StoryCard({ item, hero = false, locale = 'en' }: { item: Insight; hero?: boolean; locale?: ContentLocale }) {
  const Heading = hero ? 'h2' : 'h3';
  return <article className={`${hero ? styles.hero : styles.card} ${item.requiresLocalPhoto && !item.photo ? styles.textStory : ''}`} data-newsroom-lead={hero ? "Featured story" : undefined} data-editorial-content-id={item.id} data-editorial-content-type={item.type} data-editorial-locale={item.language} lang={item.language} data-editorial-market={item.city ? marketIds[item.city] : undefined}>
    <StoryPhoto item={item} eager={hero} locale={locale} />
    <div className={styles.copy}><p className={styles.topic}>{item.city ? localizedCities[locale][item.city] : locale === 'ko' ? '전체 도시' : locale === 'zh-CN' ? '跨城市' : 'Across cities'} <span>·</span> {topicLabels[locale][item.topic] ?? item.topic}{item.language !== locale && <span className={styles.language}>English</span>}</p>
      <Heading><Link href={item.href} data-editorial-event="article_open">{item.title}</Link></Heading><p className={styles.deck}>{item.deck}</p>
      {hero && <Link className={styles.read} href={item.href} data-editorial-event="article_open">{copy[locale].read} <span aria-hidden="true">→</span></Link>}
    </div>
  </article>;
}

const copy = {
  en: { title: 'Insights', deck: 'Property markets, investment decisions and life across four cities.', all: 'All', investment: 'Investment', topics: 'Insight topics', cities: 'Insight cities', latest: 'Latest stories', more: 'More stories', read: 'Read the story', empty: 'No stories match these filters yet.', clear: 'View all stories', note: 'Articles marked English are available in their original language.' },
  ko: { title: '인사이트', deck: '네 도시의 부동산 시장, 투자 판단과 동네 이야기를 살펴보세요.', all: '전체', investment: '투자', topics: '인사이트 주제', cities: '인사이트 도시', latest: '최신 이야기', more: '이야기 더 보기', read: '이야기 읽기', empty: '이 조건에 맞는 글이 아직 없습니다.', clear: '전체 이야기 보기', note: 'English로 표시된 글은 영어 원문으로 제공됩니다.' },
  'zh-CN': { title: '洞察', deck: '了解四座城市的房地产市场、投资决策与社区生活。', all: '全部', investment: '投资', topics: '洞察主题', cities: '洞察城市', latest: '最新文章', more: '更多文章', read: '阅读全文', empty: '暂无符合这些条件的文章。', clear: '查看全部文章', note: '标有 English 的文章以英文原文提供。' },
};
const topicLabels: Record<ContentLocale, Record<string, string>> = {
  en: {},
  ko: { 'Ownership costs': '보유 비용', 'Housing prices & costs': '주택 가격과 비용', 'Buying rules': '매수 규정', 'Neighborhood living': '동네 생활', 'Housing market': '부동산 시장' },
  'zh-CN': { 'Ownership costs': '持有成本', 'Housing prices & costs': '房价与成本', 'Buying rules': '购房规则', 'Neighborhood living': '社区生活', 'Housing market': '房地产市场' },
};
const localizedCities = { en: cityNames, ko: { seoul: '서울', tokyo: '도쿄', singapore: '싱가포르', dubai: '두바이' }, 'zh-CN': { seoul: '首尔', tokyo: '东京', singapore: '新加坡', dubai: '迪拜' } };
export function insightFilterHref(locale: ContentLocale, market: NewsroomMarketFilter, topic: InsightTopic): string {
  const query = new URLSearchParams();
  if (market !== 'all') query.set('market', market);
  if (topic !== 'all') query.set('topic', topic);
  return `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}/news/${query.size ? `?${query}` : ''}`;
}
export function InsightsIndex({ articles, market, locale = 'en', topic = 'all' }: { articles: readonly PublishedContentArticle[]; market: NewsroomMarketFilter; locale?: ContentLocale; topic?: InsightTopic }) {
  const [hero, ...items] = buildInsightItems(articles, market, locale, topic);
  const t = copy[locale];
  return <main className={styles.index} data-newsroom-layout="insights" lang={locale}>
    <header className={styles.header}><h1>{t.title}</h1><p>{t.deck}</p></header>
    <nav className={styles.filters} aria-label={t.cities}>{(['all', ...cities] as const).map(city => <Link prefetch={false} key={city} href={insightFilterHref(locale, city, topic)} aria-current={market === city ? 'page' : undefined}>{city === 'all' ? t.all : localizedCities[locale][city]}</Link>)}</nav>
    <nav className={styles.topicFilters} aria-label={t.topics}>{(['all', 'investment'] as const).map(value => <Link prefetch={false} key={value} href={insightFilterHref(locale, market, value)} aria-current={topic === value ? 'page' : undefined}>{value === 'all' ? t.all : t.investment}</Link>)}</nav>
    {locale !== 'en' && [hero, ...items].some(item => item && item.language !== locale) && <p className={styles.translationNote}>{t.note}</p>}
    {hero ? <StoryCard item={hero} hero locale={locale} /> : <p>{t.empty} <Link href={insightFilterHref(locale, 'all', 'all')}>{t.clear}</Link></p>}
    {items.length > 0 && <section className={styles.latest} aria-labelledby="latest-insights"><h2 id="latest-insights">{t.latest}</h2><div className={styles.grid}>{items.slice(0, 6).map(item => <StoryCard key={item.href} item={item} locale={locale} />)}</div>
      {items.length > 6 && <details className={styles.more}><summary>{t.more} <span aria-hidden="true">+</span></summary><div className={styles.grid}>{items.slice(6).map(item => <StoryCard key={item.href} item={item} locale={locale} />)}</div></details>}
    </section>}
  </main>;
}
