import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { EditorialPortfolioIndex } from '@/components/newsroom/editorial-portfolio-index';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({ path: '/zh-cn/guides/', title: '韩国房地产中文实用指南 | signedprice', description: '面向跨境租客与买家的已核验韩国房地产中文指南。', languageAlternates: { en: '/guides/', 'zh-Hans': '/zh-cn/guides/' }, locale: 'zh_CN' });
export default function ChineseGuidesPage() { return <EditorialGrowthPublicFrame locale="zh-CN" surface="content"><EditorialPortfolioIndex locale="zh-CN" records={listPortfolioRecords('zh-CN').filter(({ type }) => type === 'guide')} section="guides" /></EditorialGrowthPublicFrame>; }
