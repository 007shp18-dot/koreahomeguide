import { PricesPage } from '@/components/prices-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/zh-cn/prices/', title: '按城市探索房地产价格 | SignedPrice', description: '按城市查找已申报的成交价和租金，比较区域、楼宇与项目。', locale: 'zh_CN', languageAlternates: { en: '/prices/', ko: '/ko/prices/', 'zh-Hans': '/zh-cn/prices/' } });

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <PricesPage locale="zh-CN" searchParams={searchParams} />;
}
