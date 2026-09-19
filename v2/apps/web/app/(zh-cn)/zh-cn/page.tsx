import { listLatestInsightArticles } from '@/lib/content/newsroom-content.server';
import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { PropertyHome } from '@/components/design-review/editorial-growth-home';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/zh-cn/',
  title: '首尔、新加坡、迪拜与东京购房预算比较 | SignedPrice',
  description: '探索首尔、新加坡、迪拜与东京的房产成交资料，比较区域、核对报价并规划购房。查看数据来源、交易时期和覆盖范围。',
  languageAlternates: {
    en: '/',
    ko: '/ko/',
    'zh-Hans': '/zh-cn/',
  },
  locale: 'zh_CN',
});

export default async function ChineseHome() {
  const articles = await listLatestInsightArticles('zh-CN', 4);
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="home" shell><PropertyHome locale="zh-CN" articles={articles} /></EditorialGrowthPublicFrame>;
}

// Editorial discovery must reflect publication without a new static deployment.
export const dynamic = 'force-dynamic';
