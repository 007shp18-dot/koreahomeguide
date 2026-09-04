import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { ChineseInsightsIndex } from '@/components/insights/chinese-insights';
import { CHINESE_KOREA_ARTICLES } from '@/lib/insights/chinese-korea-articles';
import { indexableMetadata } from '@/lib/public-metadata';

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
  return (
    <EditorialGrowthPublicFrame locale="zh-CN" surface="content" shell>
      <ChineseInsightsIndex articles={CHINESE_KOREA_ARTICLES} />
    </EditorialGrowthPublicFrame>
  );
}
