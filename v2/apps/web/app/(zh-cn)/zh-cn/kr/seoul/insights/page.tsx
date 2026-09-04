import type { Metadata } from 'next';

import { EditorialGrowthPublicShell } from '@/components/editorial-growth/editorial-growth-public-shell';
import { buildEditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = indexableMetadata({
  path: '/zh-cn/kr/seoul/insights/',
  title: '韩国房地产中文报告与实用指南 | signedprice',
  description: '阅读面向跨境租客与买家的韩国房地产原创中文报告、成交数据说明和实用指南。',
  languageAlternates: {
    en: '/insights/',
    'zh-Hans': '/zh-cn/kr/seoul/insights/',
  },
  locale: 'zh_CN',
});

export default async function ChineseInsights() {
  const model = await buildEditorialGrowthReviewModel({
    locale: 'zh-CN',
    state: 'ready',
    ad: 'empty',
  });

  return <EditorialGrowthPublicShell surface="content" model={model} />;
}
