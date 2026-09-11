import { Suspense } from 'react';
import { NewsFeedIndex } from '@/components/newsroom/news-feed-index';
import { StoredExternalHeadlines } from '@/components/news/stored-external-headlines';
import type { Metadata } from 'next';
import Link from 'next/link';
import { InsightsIndex } from '@/components/newsroom/insights-index';
import { resolveNewsroomFilters } from '@/components/newsroom/newsroom-index';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { EditorialPortfolioIndex } from '@/components/newsroom/editorial-portfolio-index';
import { listNewsroomArticles } from '@/lib/content/newsroom-content.server';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/tools/tools.module.css';

export const revalidate = 900;

export const metadata: Metadata = indexableMetadata({ path: '/zh-cn/news/', title: '房地产政策、新闻与市场洞察 | signedprice', description: '首尔与新加坡的已核验中文政策更新、新闻、市场简报和数据故事。', languageAlternates: { en: '/news/', ko: '/ko/news/', 'zh-Hans': '/zh-cn/news/' }, locale: 'zh_CN' });
const tabs = [['insights', '洞察'], ['news', '新闻'], ['policy', '政策']] as const;
const insightTabs = [['insights', '全部洞察'], ['market', '市场洞察'], ['data-stories', '数据故事']] as const;
const isInsight = (type: string) => ['insights', 'market', 'data-stories'].includes(type);

export default async function ChineseNewsPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | readonly string[] | undefined>> }> = {}) {
  const params = await searchParams ?? {};
  const requested = params.type;
  const filters = resolveNewsroomFilters(params);
  if (filters.type === 'insights') return <EditorialGrowthPublicFrame locale="zh-CN" surface="content" currentHref={`/zh-cn${filters.canonicalHref}`}><InsightsIndex articles={await listNewsroomArticles('zh-CN')} market={filters.market} topic={filters.topic} locale="zh-CN" /></EditorialGrowthPublicFrame>;
  if (filters.type === 'news') return <EditorialGrowthPublicFrame locale="zh-CN" surface="content" currentHref={`/zh-cn${filters.canonicalHref}`}><NewsFeedIndex articles={await listNewsroomArticles('zh-CN')} market={filters.market} locale="zh-CN" headlines={<Suspense fallback={<p role="status">正在加载新闻…</p>}><StoredExternalHeadlines market={filters.market} preview={false} locale="zh-CN" /></Suspense>} /></EditorialGrowthPublicFrame>;
  const type = typeof requested === 'string' && [...tabs, ...insightTabs].some(([id]) => id === requested) ? requested : 'insights';
  const records = (await listNewsroomArticles('zh-CN')).filter(article => article.type !== 'guide'
    && (filters.market === 'all' || article.marketId === ({ seoul: 'kr-seoul', singapore: 'sg-singapore', dubai: 'ae-dubai', tokyo: 'jp-tokyo' } as const)[filters.market])
    && (type === 'insights' ? article.type === 'data-story' || article.type === 'market-brief'
      : type === 'market' ? article.type === 'market-brief'
        : type === 'data-stories' ? article.type === 'data-story'
          : type === 'news' ? article.type === 'news-brief'
            : article.type === 'policy-update'));
  const href = (next: string) => `/zh-cn${resolveNewsroomFilters({ type: next, market: filters.market }).canonicalHref}`;
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="content" currentHref={`/zh-cn${filters.canonicalHref}`}><div className={styles.page}>
    <nav className={styles.links} aria-label="新闻与洞察类型">{tabs.map(([id, label]) => <Link key={id} href={href(id)} aria-current={id === 'insights' ? isInsight(type) ? 'page' : undefined : type === id ? 'page' : undefined}>{label}</Link>)}</nav>
    {isInsight(type) ? <nav className={styles.links} aria-label="洞察类型">{insightTabs.map(([id, label]) => <Link key={id} href={href(id)} aria-current={type === id ? 'page' : undefined}>{label}</Link>)}</nav> : null}
    <EditorialPortfolioIndex locale="zh-CN" records={records} section="news" />
  </div></EditorialGrowthPublicFrame>;
}

