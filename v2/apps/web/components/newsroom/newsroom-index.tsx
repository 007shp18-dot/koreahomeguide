import { NewsFeedIndex } from './news-feed-index';
import { InsightsIndex } from './insights-index';
import { listNeighbourhoodStories, neighbourhoodHref } from '../../content/neighbourhood-stories';
import { NeighbourhoodStoryCards } from './neighbourhood-story';
import { BUDGET_GUIDE_SLUGS } from '../../content/guide-directory';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import { ResearchPageHeading } from '../market-ui/research-page-heading';

import type { PublishedContentArticle } from '../../lib/content/content-types';
import type { PolicyRecord } from '../../lib/policy/policy-types';
import { ExternalHeadlines } from '../news/external-headlines';
import { CITY_STORIES, cityStoryHref, type StoryLocale } from '../../content/city-stories';
import { CITY_JOURNEY_ARTICLES, getJourneyArticle, journeyArticleActions } from '../../content/city-journey-articles';
import { STORY_STEPS, journeyArticleHref, localIssueHref } from '../../content/city-journey-routes';
import { LOCAL_CONVERSATIONS } from '../../content/local-conversations';
import { CityStoryPhoto } from './city-story-photo';
import { JourneySteps } from './journey-steps';
import styles from './newsroom-journey.module.css';

export type NewsroomTypeFilter = 'insights' | 'news' | 'policy' | 'market' | 'data-stories';
export type NewsroomMarketFilter = 'all' | 'seoul' | 'singapore' | 'dubai' | 'tokyo';
export type NewsroomFilters = Readonly<{
  type: NewsroomTypeFilter;
  market: NewsroomMarketFilter;
  canonicalHref: string;
  topic?: 'investment';
}>;

type SearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

export function resolveNewsroomFilters(input: SearchParams): NewsroomFilters {
  const requestedType = typeof input.type === 'string' ? input.type : 'insights';
  const type = requestedType === 'headlines'
    ? 'news'
    : ['news', 'policy', 'market', 'data-stories'].includes(requestedType)
      ? requestedType as NewsroomTypeFilter
      : 'insights';
  const market = typeof input.market === 'string'
    && ['all', 'seoul', 'singapore', 'dubai', 'tokyo'].includes(input.market)
    ? input.market as NewsroomMarketFilter
    : 'all';
  const query = new URLSearchParams();
  if (type !== 'insights') query.set('type', type);
  if (market !== 'all') query.set('market', market);
  const topic = type === 'insights' && input.topic === 'investment' ? 'investment' : undefined;
  if (topic) query.set('topic', topic);
  return Object.freeze({
    type,
    market,
    ...(topic ? { topic } : {}),
    canonicalHref: query.size === 0 ? '/news/' : `/news/?${query.toString()}`,
  });
}

type StoryItem = { id: string; title: string; deck: string; href: string; date: string; type: string };

function ArticleRows({ items, locale = 'en' }: Readonly<{ items: readonly StoryItem[]; locale?: StoryLocale }>) {
  return <ol className={styles.rows} data-newsroom-latest-list="rows">{items.map(item => <li key={item.id} data-editorial-content-id={/^[a-z]{2}(?:-[A-Z]{2})?:/.test(item.id) ? item.id : `${locale}:${item.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} data-editorial-content-type={['news-brief','policy-update','market-brief','data-story','guide'].includes(item.type) ? item.type : 'guide'} data-editorial-locale={locale} data-editorial-market={(['seoul','singapore','dubai','tokyo'] as const).map(city => ({city, market:{seoul:'kr-seoul',singapore:'sg-singapore',dubai:'ae-dubai',tokyo:'jp-tokyo'}[city]})).find(({city}) => `${item.id} ${item.href}`.includes(city))?.market}>
    <time dateTime={item.date}>{item.date.slice(0, 10)}</time><div><h3><Link href={item.href} data-editorial-event="article_open">{item.title}</Link></h3><p>{item.deck}</p></div>
  </li>)}</ol>;
}

export function NewsroomIndex({ articles, policies, filters, headlines, locale = 'en' }: Readonly<{
  articles: readonly PublishedContentArticle[]; policies: readonly PolicyRecord[];
  filters: NewsroomFilters; headlines?: ReactNode; locale?: StoryLocale;
}>) {
  if (filters.type === 'insights') return <InsightsIndex articles={articles} market={filters.market} locale={locale} topic={filters.topic} />;
  if (['news'].includes(filters.type)) return <NewsFeedIndex articles={articles} market={filters.market} locale={locale} headlines={headlines} />;
  const ko = locale === 'ko';
  const base = ko ? '/ko/news/' : '/news/';
  const href = (type: NewsroomTypeFilter, market = filters.market) => `${ko ? '/ko' : ''}${resolveNewsroomFilters({ type, market }).canonicalHref}`;
  const analysis = ['insights', 'market', 'data-stories'].includes(filters.type);
  const fullJourney = ['insights'].includes(filters.type);
  const story = CITY_STORIES.find(item => item.city === filters.market) ?? CITY_STORIES[0];
  const featured = getJourneyArticle(story.city, 'discover')!;
  const journeyStages = STORY_STEPS.map(({ id }) => {
    const article = getJourneyArticle(story.city, id)!;
    return { id, title: article.title[locale], deck: article.deck[locale], href: journeyArticleHref(story.city, id, locale), related: journeyArticleActions(article, locale).related.map(link => ({ href: link.href, label: link.label[locale] })) };
  });
  const standaloneItems: StoryItem[] = CITY_JOURNEY_ARTICLES.filter(article => filters.market === 'all' || article.city === filters.market).map(article => ({ id: `city-article-${article.city}-${article.id}`, title: article.title[locale], deck: article.deck[locale], href: journeyArticleHref(article.city, article.id, locale), date: article.checkedAt, type: article.kind }));
  const pilotItems: StoryItem[] = CITY_STORIES.filter(city => filters.market === 'all' || city.city === filters.market).map(city => {
    const article = CITY_JOURNEY_ARTICLES.find(item => item.city === city.city && item.kind === 'local-issue');
    const published = listPortfolioRecords(locale).find(item => item.canonicalHref === localIssueHref(city.city, locale));
    return { id: `local-pilot-${city.city}`, title: article?.title[locale] ?? published!.title, deck: article?.deck[locale] ?? published!.deck, date: article?.checkedAt ?? published!.updatedAt, type: 'local-issue', href: localIssueHref(city.city, locale) };
  });
  const markets = [['all', ko ? '모든 도시' : 'All'], ...CITY_STORIES.map(item => [item.city, item.name[locale]] as const)] as readonly (readonly [NewsroomMarketFilter, string])[];
  const marketId = { all: null, seoul: 'kr-seoul', singapore: 'sg-singapore', dubai: 'ae-dubai', tokyo: 'jp-tokyo' }[filters.market];
  const items: StoryItem[] = articles.filter(item => item.type !== 'guide' && (!marketId || item.marketId === marketId)).map(item => ({ id: item.id, title: item.title, deck: item.deck, date: item.publishedAt, type: item.type,
    href: 'canonicalHref' in item ? String(item.canonicalHref) : `${base}${item.type === 'policy-update' ? 'policy/' : ''}${item.slug}/`,
  }));
  if (!ko && filters.type === 'policy') for (const policy of policies) {
    const policyHref = `/news/policy/${policy.slug}/`;
    if ((!marketId || policy.marketId === marketId) && !items.some(item => item.href === policyHref)) items.push({ id: policy.id, title: policy.title, deck: policy.summary, href: policyHref, date: policy.lastCheckedOn, type: 'policy-update' });
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  const budgetComparisons: StoryItem[] = listPortfolioRecords(locale).filter(item => BUDGET_GUIDE_SLUGS.some(slug => slug === item.slug) && (!marketId || item.marketId === marketId)).map(item => ({ id: item.id, title: item.title, deck: item.deck, date: item.updatedAt, type: item.type, href: item.canonicalHref }));
  const comparisons = [...standaloneItems.filter(item => item.type === 'neighborhood'), ...budgetComparisons, ...items.filter(item => item.type === 'data-story').slice(0, 3)];
  const updates = items.filter(item => item.type === 'market-brief').slice(0, 3);
  const notebookItems: StoryItem[] = ko ? [] : listNeighbourhoodStories(filters.market).map(item => ({ id: `notebook-${item.slug}`, title: item.title, deck: item.deck, href: neighbourhoodHref(item.slug), date: item.publishedAt, type: 'neighborhood' }));
  const promoted = new Set(fullJourney ? [...notebookItems, ...comparisons, ...updates, ...pilotItems].map(item => item.href).concat(journeyArticleHref(story.city, 'discover', locale), ...(filters.market === 'all' ? [] : ['why-buy','can-i-buy'].map(id => journeyArticleHref(story.city,id,locale)))) : []);
  const seen = new Set<string>();
  const filtered = [...(fullJourney ? notebookItems : []), ...(fullJourney ? standaloneItems : []), ...items, ...(['insights', 'data-stories'].includes(filters.type) ? budgetComparisons : [])].filter(item => { if (promoted.has(item.href) || seen.has(item.href)) return false; seen.add(item.href); return true; }).filter(item => fullJourney ? true : filters.type === 'news' ? item.type === 'news-brief' : filters.type === 'policy' ? item.type === 'policy-update' : filters.type === 'market' ? item.type === 'market-brief' : item.type === 'data-story' || item.type === 'guide').sort((a, b) => b.date.localeCompare(a.date));
  const conversations = filters.market === 'all' ? CITY_STORIES.map(city => LOCAL_CONVERSATIONS.find(item => item.city === city.city)!) : LOCAL_CONVERSATIONS.filter(item => item.city === filters.market);
  return <main className={styles.index} data-newsroom-layout="research" lang={locale}>
    <ResearchPageHeading title={ko ? '뉴스 & 인사이트' : 'News & Insights'} description={ko ? '마음이 가는 도시에서 나에게 맞는 집까지. 동네의 이야기와 가격, 구매의 다음 단계를 함께 읽어보세요.' : 'Find a city you connect with, a neighbourhood that fits, and a clearer path to a home of your own.'} />
    <div className={styles.filterBar} data-newsroom-filter-bar="true">
      <nav className={styles.tabs} aria-label={ko ? '뉴스와 인사이트 유형' : 'News and insight types'}>{([['insights', ko ? '인사이트' : 'Insights'], ['news', ko ? '뉴스' : 'News'], ['policy', ko ? '정책' : 'Policy']] as const).map(([id, label]) => <Link key={id} href={href(id)} aria-current={(id === 'insights' ? analysis : filters.type === id) ? 'page' : undefined}>{label}</Link>)}</nav>
      <nav className={styles.tabs} aria-label={ko ? '기사 도시' : 'News markets'}>{markets.map(([id, label]) => <Link key={id} href={href(filters.type, id)} aria-current={filters.market === id ? 'page' : undefined}>{label}</Link>)}</nav>
    </div>
    {filters.type === 'policy' && <div className={styles.policyEntry}><p>{ko ? '정책 변경 사항을 날짜별로 확인하세요.' : 'Follow policy changes, by date and market.'}</p><Link href="/news/policy/">{ko ? '정책 타임라인 · English' : 'Policy tracker'} <UiIcon name="arrow-right" /></Link></div>}
    {fullJourney && <>
      {!ko && <NeighbourhoodStoryCards city={filters.market} />}
      <section className={styles.hero} aria-label={ko ? '대표 이야기' : 'Featured stories'}>
        <article data-newsroom-lead="City Story"><CityStoryPhoto city={story.city} locale={locale} eager /><p className={styles.eyebrow}>{story.name[locale]} · City Stories</p><h2><Link href={journeyArticleHref(story.city, 'discover', locale)}>{featured.title[locale]}</Link></h2><p>{featured.deck[locale]}</p><Link className={styles.readLink} href={journeyArticleHref(story.city, 'discover', locale)}>{ko ? '도시 이야기 읽기' : 'Read the city story'} <UiIcon name="arrow-right" /></Link></article>
        <aside className={styles.related}>{(filters.market === 'all' ? CITY_STORIES.filter(item => item.city !== story.city).slice(0, 2).map(item => ({ title: item.title[locale], deck: item.deck[locale], href: cityStoryHref(item.city, locale), label: item.name[locale] })) : [story.sections[1], story.sections[2]].map(section => ({ title: getJourneyArticle(story.city, section.id)!.title[locale], deck: getJourneyArticle(story.city, section.id)!.deck[locale], href: journeyArticleHref(story.city, section.id, locale), label: story.name[locale] }))).map(item => <article key={item.href}><p className={styles.eyebrow}>{item.label}</p><h3><Link href={item.href}>{item.title}</Link></h3><p>{item.deck}</p><Link className={styles.readLink} href={item.href}>{ko ? '이어서 읽기' : 'Continue reading'} <UiIcon name="arrow-right" /></Link></article>)}</aside>
      </section>
      <section className={styles.section} id="city-journey"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{story.name[locale]}</p><h2>{ko ? '마음이 가는 도시, 내 집이 되기까지' : 'Your path to owning here'}</h2></div></div><details><summary>{ko ? '도시별 구매 단계 보기' : 'View the buying steps'}</summary><JourneySteps key={story.city} stages={journeyStages} locale={locale} /></details></section>
      <section className={styles.section} id="find-your-place"><div className={styles.sectionHeading}><h2>{ko ? '나에게 맞는 동네와 집' : 'Find your place'}</h2><Link href={`${ko && story.city !== 'tokyo' ? '/ko' : ''}${{seoul:'/kr/seoul/explore/',singapore:'/sg/singapore/explore/',dubai:'/ae/dubai/explore/',tokyo:'/jp/tokyo/explore/'}[story.city]}`}>{ko ? '동네 둘러보기' : 'Explore neighbourhoods'} <UiIcon name="arrow-right" /></Link></div>{comparisons.length ? <ArticleRows locale={locale} items={comparisons} /> : <div className={styles.simpleStory}><h3><Link href={journeyArticleHref(story.city, 'where', locale)}>{story.sections[3].title[locale]}</Link></h3><p>{story.sections[3].paragraphs[locale][0]}</p></div>}</section>
      <section className={styles.section} id="local-conversation"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{ko ? '현지의 질문을 더 깊이 읽기' : 'Questions people are asking locally'}</p><h2>{ko ? '현지에서 이야기하는 것들' : 'The local conversation'}</h2></div></div><ArticleRows locale={locale} items={pilotItems} /><p className={styles.eyebrow}>{ko ? '함께 살펴볼 현지의 질문' : 'More questions from the local conversation'}</p><div className={styles.issues}>{conversations.map((item, index) => <details key={item.url} open={index === 0} className={styles.issue}><summary><span>{CITY_STORIES.find(city => city.city === item.city)!.name[locale]}</span><h3>{item.title[locale]}</h3></summary><div><p>{item.point[locale]}</p><p><strong>{ko ? '내 집을 찾는다면' : 'For your home search'}</strong> · {item.check[locale]}</p><a href={item.url} target="_blank" rel="noopener noreferrer">{ko ? 'Reddit 원문 토론' : 'Read the Reddit discussion'} <UiIcon name="arrow-up-right" /></a>{filters.market === 'all' && <Link href={`${href('insights', item.city)}#local-conversation`}>{ko ? '이 도시의 이슈 5개 보기' : 'All five issues in this city'} <UiIcon name="arrow-right" /></Link>}</div></details>)}</div></section>
      {updates.length > 0 && <section className={styles.section} id="market-updates"><div className={styles.sectionHeading}><h2>{ko ? '시장을 읽는 데이터' : 'Market updates'}</h2><Link href={href('market')}>{ko ? '시장 분석 전체' : 'All market analysis'} <UiIcon name="arrow-right" /></Link></div><ArticleRows locale={locale} items={updates} /></section>}
    </>}
    {(fullJourney || filters.type === 'news') && <div className={styles.section}>{headlines ?? <ExternalHeadlines market={filters.market} preview={fullJourney} locale={locale} />}</div>}
    <section className={styles.section} id="all-stories"><div className={styles.sectionHeading}><h2>{ko ? filters.type === 'policy' ? '정책 소식' : '전체 콘텐츠' : filters.type === 'policy' ? 'Policy updates' : 'All stories'}</h2></div>
      {analysis && <nav className={styles.tabs} aria-label={ko ? '인사이트 유형' : 'Insight types'}>{([['insights', ko ? '전체 인사이트' : 'All insights'], ['market', ko ? '시장 분석' : 'Market Insight'], ['data-stories', ko ? '데이터 스토리' : 'Data Stories']] as const).map(([id, label]) => <Link key={id} href={href(id)} aria-current={filters.type === id ? 'page' : undefined}>{label}</Link>)}</nav>}
      <ArticleRows locale={locale} items={filtered.slice(0, 8)} />{filtered.length > 8 && <details className={styles.more}><summary>{ko ? `이전 글 ${filtered.length - 8}편 더 보기` : `Browse ${filtered.length - 8} more stories`}</summary><ArticleRows locale={locale} items={filtered.slice(8)} /></details>}
      {!filtered.length && !fullJourney && filters.type !== 'news' && <p>{ko ? '이 도시의 구매 이야기를 먼저 살펴보세요.' : 'Start with the city story and its buying chapters.'} <Link href={cityStoryHref(story.city, locale)}>{story.name[locale]} <UiIcon name="arrow-right" /></Link></p>}
    </section>
  </main>;
}

