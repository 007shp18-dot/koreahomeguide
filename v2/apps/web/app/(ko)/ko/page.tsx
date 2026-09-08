import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { PropertyHome } from '@/components/design-review/editorial-growth-home';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/', title: '서울·싱가포르·두바이·도쿄 부동산 가격 탐색 | SignedPrice', description: '네 도시의 실거래를 살펴보고 지역·건물의 가격과 매입 비용을 비교하세요. 도쿄는 지역별 익명 거래를 제공합니다.', locale: 'ko_KR', languageAlternates: { en: '/', ko: '/ko/', 'zh-Hans': '/zh-cn/kr/seoul/' }, imagePath: '/og/ko/' });
export default function KoreanHome() {
  return <KoreanSiteFrame><PropertyHome locale="ko" /></KoreanSiteFrame>;
}
