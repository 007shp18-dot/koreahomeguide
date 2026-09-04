import type { Metadata } from 'next';

import { EditorialGrowthPublicShell } from '@/components/editorial-growth/editorial-growth-public-shell';
import { buildEditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/zh-cn/kr/seoul/',
  title: '韩国租房真实成交数据与指南 | signedprice',
  description: '通过首尔已申报合同、明确的可比范围和实用中文指南，判断韩国租房与购房价格。',
  languageAlternates: {
    en: '/',
    'zh-Hans': '/zh-cn/kr/seoul/',
  },
  locale: 'zh_CN',
});

export default async function ChineseHome() {
  const model = await buildEditorialGrowthReviewModel({
    locale: 'zh-CN',
    state: 'ready',
    ad: 'empty',
  });

  return <EditorialGrowthPublicShell surface="home" model={model} />;
}
