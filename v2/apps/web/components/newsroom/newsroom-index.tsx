import type { ReactNode } from 'react';
import Link from 'next/link';
import { ResearchPageHeading } from '../market-ui/research-page-heading';

import type { PublishedContentArticle } from '../../lib/content/content-types';
import type { PolicyRecord } from '../../lib/policy/policy-types';
import { ExternalHeadlines } from '../news/external-headlines';
import styles from './newsroom.module.css';

export type NewsroomTypeFilter = 'insights' | 'news' | 'policy' | 'market' | 'data-stories';
export type NewsroomMarketFilter = 'all' | 'seoul' | 'singapore' | 'dubai';
export type NewsroomFilters = Readonly<{
  type: NewsroomTypeFilter;
  market: NewsroomMarketFilter;
  canonicalHref: string;
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
    && ['all', 'seoul', 'singapore', 'dubai'].includes(input.market)
    ? input.market as NewsroomMarketFilter
    : 'all';
  const query = new URLSearchParams();
  if (type !== 'insights') query.set('type', type);
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
  market: 'Seoul' | 'Singapore' | 'Dubai' | 'Global';
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
      : article.marketId === 'sg-singapore' ? 'Singapore' : article.marketId === 'ae-dubai' ? 'Dubai' : 'Global',
    marketKey: article.marketId === 'kr-seoul' ? 'seoul'
      : article.marketId === 'sg-singapore' ? 'singapore' : article.marketId === 'ae-dubai' ? 'dubai' : 'all',
    title: article.title,
    deck: article.deck,
    date: article.publishedAt,
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

export function NewsroomIndex({ articles, policies, filters, headlines }: Readonly<{
  articles: readonly PublishedContentArticle[];
  policies: readonly PolicyRecord[];
  filters: NewsroomFilters;
  headlines?: ReactNode;
}>) {
  const uniqueItems = new Map([...articles.filter(({ type }) => type !== 'guide').map(articleItem), ...policies.map(policyItem)]
    .map((item) => [item.href, item] as const));
  const items = [...uniqueItems.values()]
    .filter((item) => (
      (filters.market === 'all' || item.marketKey === filters.market)
      && (filters.type === 'insights' && (item.type === 'Market' || item.type === 'Data Story')
        || (filters.type === 'news' && item.type === 'News')
        || (filters.type === 'policy' && item.type === 'Policy')
        || (filters.type === 'market' && item.type === 'Market')
        || (filters.type === 'data-stories' && item.type === 'Data Story'))
    ))
    .sort((left, right) => right.date.localeCompare(left.date));
  const lead = items[0] ?? null;
  const latest = items.slice(1);
  const category = (item:NewsroomListItem) => /monthly-2026/.test(item.href) ? 'Monthly market updates' : /under-|rental-yield/.test(item.href) ? 'Homes within budget and ownership costs' : 'Price and rental comparisons';
  const analysis = ['insights', 'market', 'data-stories'].includes(filters.type);
  const groups = analysis ? ['Monthly market updates','Homes within budget and ownership costs','Price and rental comparisons'].map(label=>({label,items:latest.filter(item=>category(item)===label)})).filter(group=>group.items.length>0) : [{label:'More articles',items:latest}];
  const typeTabs = [['insights', 'Insights'], ['news', 'News'], ['policy', 'Policy']] as const;
  const insightTabs = [['insights', 'All insights'], ['market', 'Market Insight'], ['data-stories', 'Data Stories']] as const;
  const marketTabs = [['all', 'All'], ['seoul', 'Seoul'], ['singapore', 'Singapore'], ['dubai', 'Dubai']] as const;

  return <main className={styles.index} data-newsroom-layout="research">
    <ResearchPageHeading title="News & Insights" description="Official property updates, policy changes, market interpretation and transaction-led research across Seoul, Singapore and Dubai." actions={<Link href="/news/policy/">Open the Policy Tracker</Link>} />
    <div className={styles.filterBar} data-newsroom-filter-bar="true">
      <nav className={styles.typeTabs} aria-label="News and insight types">
        {typeTabs.map(([id, label]) => <Link key={id} href={filterHref(id, filters.market)} aria-current={id === 'insights' ? analysis ? 'page' : undefined : filters.type === id ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <nav className={styles.marketFilters} aria-label="News markets">
        {marketTabs.map(([id, label]) => <Link key={id} href={filterHref(filters.type, id)} aria-current={filters.market === id ? 'page' : undefined}>{label}</Link>)}
      </nav>
    </div>
    {analysis ? <nav className={styles.insightTabs} aria-label="Insight types">
      {insightTabs.map(([id, label]) => <Link key={id} href={filterHref(id, filters.market)} aria-current={filters.type === id ? 'page' : undefined}>{label}</Link>)}
    </nav> : null}
    {filters.type === 'news' ? headlines ?? <ExternalHeadlines market={filters.market} preview={false} /> : null}
    {filters.type === 'news' && lead === null ? null : lead === null ? <section className={styles.empty} data-newsroom-state="empty"><h2>No articles match these filters yet.</h2><Link href="/news/">Return to Insights</Link></section> : <>
      <article className={styles.leadStory} data-newsroom-lead={lead.type}>
        <div><span>{lead.type} · {lead.market}</span><time dateTime={lead.date}>{lead.date.slice(0, 10)}</time></div>
        <h2><Link href={lead.href} data-editorial-event="article_open">{lead.title}</Link></h2>
        <p>{lead.deck}</p>
        <Link href={lead.href} data-editorial-event="article_open">Read article</Link>
      </article>
      {latest.length > 0 ? <section className={styles.latest} aria-labelledby="latest-reviewed-title">
        <div className={styles.sectionHeading}><p>Latest articles</p><h2 id="latest-reviewed-title">{analysis ? 'More analysis' : 'More articles'}</h2></div>
        {groups.map(group=><section key={group.label} aria-label={group.label}>{analysis && <h3>{group.label}</h3>}<ol data-newsroom-latest-list="rows">
          {group.items.map((item) => <li key={`${item.type}:${item.id}`}>
            <div><span>{item.type} · {item.market}</span><time dateTime={item.date}>{item.date.slice(0, 10)}</time></div>
            <h3><Link href={item.href} data-editorial-event="article_open">{item.title}</Link></h3>
            <p>{item.deck}</p>
          </li>)}
        </ol></section>)}
      </section> : null}
    </>}
  </main>;
}
