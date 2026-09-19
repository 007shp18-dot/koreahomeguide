import { listLatestInsightArticles } from '@/lib/content/newsroom-content.server';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { PropertyHome } from '@/components/design-review/editorial-growth-home';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/', title: '서울·싱가포르·두바이·도쿄 부동산 거래와 분석 | SignedPrice', description: '네 도시의 실거래를 살펴보고 지역·건물의 가격과 매입 비용을 비교하세요. 도쿄는 지역별 익명 거래를 제공합니다.', locale: 'ko_KR', languageAlternates: { en: '/', ko: '/ko/', 'zh-Hans': '/zh-cn/' }, imagePath: '/og/ko/' });
export default async function KoreanHome() {
  const articles = await listLatestInsightArticles('ko', 4);
  return <EditorialGrowthPublicFrame locale="ko" surface="home" shell><PropertyHome locale="ko" articles={articles} /></EditorialGrowthPublicFrame>;
}

// Editorial discovery must reflect publication without a new static deployment.
export const dynamic = 'force-dynamic';
