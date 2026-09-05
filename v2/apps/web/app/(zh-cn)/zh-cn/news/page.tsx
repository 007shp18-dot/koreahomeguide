import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { EditorialPortfolioIndex } from '@/components/newsroom/editorial-portfolio-index';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({ path: '/zh-cn/news/', title: '房地产政策、市场与数据故事 | signedprice', description: '首尔与新加坡的已核验中文政策更新、市场简报和数据故事。', languageAlternates: { en: '/news/', 'zh-Hans': '/zh-cn/news/' }, locale: 'zh_CN' });

export default function ChineseNewsPage() {
  const records = listPortfolioRecords('zh-CN').filter(({ type }) => type !== 'guide');
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="content"><EditorialPortfolioIndex locale="zh-CN" records={records} section="news" /></EditorialGrowthPublicFrame>;
}
