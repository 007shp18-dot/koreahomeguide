import { SeoulShortlist } from '@/components/seoul-shortlist/shortlist';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { buildKoreanSiteHeader, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/shortlist/', title: '내 예산에 맞는 서울 아파트 찾기 · 관심 단지 | signedprice',
  description: '예산·지역·전용면적에 맞는 최근 서울 아파트 실거래를 찾고, 관심 단지를 저장해 거래 변화를 확인하세요.',
  locale: 'ko_KR', languageAlternates: { en: '/kr/seoul/shortlist/', ko: '/ko/kr/seoul/shortlist/' },
  imagePath: '/og/ko/',
});
export default function Page() {
  return <><SiteHeader copy={{ ...buildKoreanSiteHeader('/kr/seoul/shortlist/'), links: [{ label: '예산·관심 목록', href: '/ko/kr/seoul/shortlist/', isCurrent: true }] }} /><SeoulShortlist locale="ko" /><SiteFooter copy={KOREAN_SITE_FOOTER} /></>;
}
