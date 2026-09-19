import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { EditorialGuides } from '@/components/guide/editorial-guides';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({ path: '/zh-cn/guides/', title: '买房与租房实用指南 | signedprice', description: '首尔、新加坡、迪拜与东京的购房预算、费用和签约准备。', languageAlternates: { en: '/guides/', ko: '/ko/guides/', 'zh-Hans': '/zh-cn/guides/' }, locale: 'zh_CN' });
export default async function ChineseGuidesPage({ searchParams }: { searchParams: Promise<{ market?: string; q?: string }> }) {
  const { market, q } = await searchParams;
  const selected = market === 'seoul' || market === 'singapore' || market === 'dubai' || market === 'tokyo' ? market : 'seoul';
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="content" activeSection="guides" currentHref={`/zh-cn/guides/?market=${selected}`}><EditorialGuides locale="zh-CN" market={selected} query={typeof q === 'string' ? q.slice(0, 120) : ''} /></EditorialGrowthPublicFrame>;
}
