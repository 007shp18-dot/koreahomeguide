import type { Metadata } from 'next';
import Link from 'next/link';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { EditorialPortfolioIndex } from '@/components/newsroom/editorial-portfolio-index';
import { listNewsroomArticles } from '@/lib/content/newsroom-content.server';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/tools/tools.module.css';

export const metadata: Metadata = indexableMetadata({ path: '/zh-cn/news/', title: '房地产政策、新闻与市场洞察 | signedprice', description: '首尔与新加坡的已核验中文政策更新、新闻、市场简报和数据故事。', languageAlternates: { en: '/news/', ko: '/ko/news/', 'zh-Hans': '/zh-cn/news/' }, locale: 'zh_CN' });
const tabs = [['insights', '洞察'], ['news', '新闻'], ['policy', '政策']] as const;
const insightTabs = [['insights', '全部洞察'], ['market', '市场洞察'], ['data-stories', '数据故事']] as const;
const isInsight = (type: string) => ['insights', 'market', 'data-stories'].includes(type);

export default async function ChineseNewsPage({ searchParams }: Readonly<{ searchParams?: Promise<{ type?: string | string[] }> }> = {}) {
  const requested = (await searchParams)?.type;
  const type = typeof requested === 'string' && [...tabs, ...insightTabs].some(([id]) => id === requested) ? requested : 'insights';
  const records = (await listNewsroomArticles('zh-CN')).filter(article => article.type !== 'guide'
    && (type === 'insights' ? article.type === 'data-story' || article.type === 'market-brief'
      : type === 'market' ? article.type === 'market-brief'
        : type === 'data-stories' ? article.type === 'data-story'
          : type === 'news' ? article.type === 'news-brief'
            : article.type === 'policy-update'));
  const href = (next: string) => next === 'insights' ? '/zh-cn/news/' : `/zh-cn/news/?type=${next}`;
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="content"><div className={styles.page}>
    <nav className={styles.links} aria-label="新闻与洞察类型">{tabs.map(([id, label]) => <Link key={id} href={href(id)} aria-current={id === 'insights' ? isInsight(type) ? 'page' : undefined : type === id ? 'page' : undefined}>{label}</Link>)}</nav>
    {isInsight(type) ? <nav className={styles.links} aria-label="洞察类型">{insightTabs.map(([id, label]) => <Link key={id} href={href(id)} aria-current={type === id ? 'page' : undefined}>{label}</Link>)}</nav> : null}
    <EditorialPortfolioIndex locale="zh-CN" records={records} section="news" />
  </div></EditorialGrowthPublicFrame>;
}
