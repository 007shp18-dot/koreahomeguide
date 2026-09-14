import { RankingsPage } from '@/components/rankings/rankings-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({
  path: '/ko/rankings/',
  title: '시장별 부동산 가격 순위 | signedprice',
  description: '서울·싱가포르는 단지별 대표 계약, 두바이는 단지별 중앙값, 도쿄는 신고 거래가격을 비교하고 조건에 맞는 지역별 월세 순위를 확인하세요.',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/', 'zh-Hans': '/zh-cn/rankings/' },
  locale: 'ko_KR',
  imagePath: '/og/ko/',
});

export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
 const query = await searchParams;
 return RankingsPage({ searchParams: Promise.resolve(query), locale: 'ko' });
}
