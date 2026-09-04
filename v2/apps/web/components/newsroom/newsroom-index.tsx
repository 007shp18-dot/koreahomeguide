import Link from 'next/link';

import type { PublishedContentArticle } from '../../lib/content/content-types';
import type { PolicyRecord } from '../../lib/policy/policy-types';
import styles from './newsroom.module.css';

export type NewsroomTypeFilter = 'latest' | 'policy' | 'market' | 'data-stories';
export type NewsroomMarketFilter = 'all' | 'seoul' | 'singapore';
export type NewsroomFilters = Readonly<{
  type: NewsroomTypeFilter;
  market: NewsroomMarketFilter;
  canonicalHref: string;
}>;

type SearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

export function resolveNewsroomFilters(input: SearchParams): NewsroomFilters {
  const type = typeof input.type === 'string'
    && ['latest', 'policy', 'market', 'data-stories'].includes(input.type)
    ? input.type as NewsroomTypeFilter
    : 'latest';
  const market = typeof input.market === 'string'
    && ['all', 'seoul', 'singapore'].includes(input.market)
    ? input.market as NewsroomMarketFilter
    : 'all';
  const query = new URLSearchParams();
  if (type !== 'latest') query.set('type', type);
  if (market !== 'all') query.set('market', market);
  return Object.freeze({
    type,
    market,
    canonicalHref: query.size === 0 ? '/news/' : `/news/?${query.toString()}`,
  });
}

type NewsroomListItem = Readonly<{
  id: string;
  type: 'Policy' | 'Market' | 'Data Story' | 'News';
  market: 'Seoul' | 'Singapore' | 'Global';
  marketKey: NewsroomMarketFilter;
  title: string;
  deck: string;
  date: string;
  href: string;
}>;

function articleItem(article: PublishedContentArticle): NewsroomListItem {
  return Object.freeze({
    id: article.id,
    type: article.type === 'market-brief' ? 'Market'
      : article.type === 'data-story' ? 'Data Story'
        : article.type === 'policy-update' ? 'Policy' : 'News',
    market: article.marketId === 'kr-seoul' ? 'Seoul'
      : article.marketId === 'sg-singapore' ? 'Singapore' : 'Global',
    marketKey: article.marketId === 'kr-seoul' ? 'seoul'
      : article.marketId === 'sg-singapore' ? 'singapore' : 'all',
    title: article.title,
    deck: article.deck,
    date: article.updatedAt,
    href: article.type === 'policy-update'
      ? `/news/policy/${article.slug}/` : `/news/${article.slug}/`,
  });
}

function policyItem(policy: PolicyRecord): NewsroomListItem {
  return Object.freeze({
    id: policy.id,
    type: 'Policy',
    market: policy.marketId === 'kr-seoul' ? 'Seoul' : 'Singapore',
    marketKey: policy.marketId === 'kr-seoul' ? 'seoul' : 'singapore',
    title: policy.title,
    deck: policy.summary,
    date: `${policy.lastCheckedOn}T00:00:00.000Z`,
    href: `/news/policy/${policy.slug}/`,
  });
}

function filterHref(type: NewsroomTypeFilter, market: NewsroomMarketFilter): string {
  return resolveNewsroomFilters({ type, market }).canonicalHref;
}

export function NewsroomIndex({ articles, policies, filters }: Readonly<{
  articles: readonly PublishedContentArticle[];
  policies: readonly PolicyRecord[];
  filters: NewsroomFilters;
}>) {
  const items = [...articles.filter(({ type }) => type !== 'guide').map(articleItem), ...policies.map(policyItem)]
    .filter((item) => (
      (filters.market === 'all' || item.marketKey === filters.market)
      && (filters.type === 'latest'
        || (filters.type === 'policy' && item.type === 'Policy')
        || (filters.type === 'market' && item.type === 'Market')
        || (filters.type === 'data-stories' && item.type === 'Data Story'))
    ))
    .sort((left, right) => right.date.localeCompare(left.date));
  const lead = items[0] ?? null;
  const latest = items.slice(1);
  const typeTabs = [
    ['latest', 'Latest'], ['policy', 'Policy'], ['market', 'Market'], ['data-stories', 'Data Stories'],
  ] as const;
  const marketTabs = [['all', 'All'], ['seoul', 'Seoul'], ['singapore', 'Singapore']] as const;

  return <main className={styles.index}>
    <header className={styles.indexHero}>
      <p>SignedPrice Newsroom</p>
      <h1>Property change, checked against evidence.</h1>
      <span>Policy status, market releases and data stories for Seoul and Singapore.</span>
      <Link className={styles.heroAction} href="/news/policy/">Open the Policy Tracker <span aria-hidden="true">→</span></Link>
    </header>
    <nav className={styles.typeTabs} aria-label="News types">
      {typeTabs.map(([id, label]) => <Link key={id} href={filterHref(id, filters.market)} aria-current={filters.type === id ? 'page' : undefined}>{label}</Link>)}
    </nav>
    <nav className={styles.marketFilters} aria-label="News markets">
      {marketTabs.map(([id, label]) => <Link key={id} href={filterHref(filters.type, id)} aria-current={filters.market === id ? 'page' : undefined}>{label}</Link>)}
    </nav>
    {lead === null ? <section className={styles.empty} data-newsroom-state="empty"><h2>No reviewed article matches this view.</h2><Link href="/news/">Return to Latest</Link></section> : <>
      <article className={styles.leadStory} data-newsroom-lead={lead.type}>
        <div><span>{lead.type} · {lead.market}</span><time dateTime={lead.date}>{lead.date.slice(0, 10)}</time></div>
        <h2><Link href={lead.href}>{lead.title}</Link></h2>
        <p>{lead.deck}</p>
        <Link href={lead.href}>Read the reviewed record <span aria-hidden="true">→</span></Link>
      </article>
      <section className={styles.latest} aria-labelledby="latest-reviewed-title">
        <div className={styles.sectionHeading}><p>Latest reviewed records</p><h2 id="latest-reviewed-title">News in evidence order</h2></div>
        <ol data-newsroom-latest-list="rows">
          {latest.map((item) => <li key={`${item.type}:${item.id}`}>
            <div><span>{item.type} · {item.market}</span><time dateTime={item.date}>{item.date.slice(0, 10)}</time></div>
            <h3><Link href={item.href}>{item.title}</Link></h3>
            <p>{item.deck}</p>
          </li>)}
        </ol>
      </section>
    </>}
  </main>;
}
