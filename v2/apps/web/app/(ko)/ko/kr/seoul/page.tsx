import { SeoulOverview } from '@/components/public-market/seoul-overview';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/kr/seoul/', title: '서울 실거래가 · 아파트 매매 전세 월세 | signedprice', description: '서울 25개 구의 매매·전세·월세 실거래를 동과 단지별로 확인하세요. 계약 수, 기간과 국토교통부 출처를 함께 제공합니다.', locale: 'ko_KR', imagePath: '/og/ko/', languageAlternates: { en: '/kr/seoul/', ko: '/ko/kr/seoul/' } });
export default function KoreanSeoulPage() { return <SeoulOverview locale="ko" />; }
