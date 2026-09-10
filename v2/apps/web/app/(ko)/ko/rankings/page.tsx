import { RankingMarketsHub } from '@/components/rankings/ranking-markets-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({
  path: '/ko/rankings/',
  title: '시장별 부동산 가격 순위 | signedprice',
  description: '게시 기준을 통과한 서울 구별·싱가포르 단지별 실거래 중앙값을 높은 가격부터 비교합니다.',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/', 'zh-Hans': '/zh-cn/rankings/' },
  locale: 'ko_KR',
  imagePath: '/og/ko/',
});

export default function KoreanRankingsHubPage() { return <RankingMarketsHub locale="ko" />; }
