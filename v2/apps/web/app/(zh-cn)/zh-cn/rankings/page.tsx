import { RankingMarketsHub } from '@/components/rankings/ranking-markets-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({
  path: '/zh-cn/rankings/',
  title: '房产成交排行榜 | signedprice',
  description: '比较首尔楼宇、新加坡住宅项目的申报成交价格，并查看东京官方住宅成交记录。',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/', 'zh-Hans': '/zh-cn/rankings/' },
  locale: 'zh_CN',
});

export default function ChineseRankingsHubPage() { return <RankingMarketsHub locale="zh-CN" />; }
