import { PricesPage } from '@/components/prices-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/prices/', title: '도시별 실거래가 둘러보기 | SignedPrice', description: '도시별 신고 매매가와 임대료를 확인하고 지역·건물·단지를 비교하세요.', locale: 'ko_KR', languageAlternates: { en: '/prices/', ko: '/ko/prices/', 'zh-Hans': '/zh-cn/prices/' } });

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <PricesPage locale="ko" searchParams={searchParams} />;
}
