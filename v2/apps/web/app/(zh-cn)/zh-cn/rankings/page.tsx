import { RankingsPage } from '@/components/rankings/rankings-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({
  path: '/zh-cn/rankings/',
  title: '房产成交排行榜 | signedprice',
  description: '比较首尔与新加坡每个项目的代表合同、迪拜项目中位价、东京申报成交，以及条件匹配的区域租金排行。',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/', 'zh-Hans': '/zh-cn/rankings/' },
  locale: 'zh_CN',
});

export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
 const query = await searchParams;
 return RankingsPage({ searchParams: Promise.resolve(query), locale: 'zh-CN' });
}
