import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { AboutPageContent } from '@/components/operator/about-page-content';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/about/', title: 'SignedPrice 소개 | 해외 주택 비교와 현지 업체 연결', description: '가격·단지 비교부터 구매 준비와 현지 업체 연결까지. SignedPrice의 서비스와 운영 배경을 알아보세요.', locale: 'ko_KR', languageAlternates: { en: '/about/', ko: '/ko/about/' } });
export default function KoreanAbout() { return <KoreanSiteFrame href="/ko/about/"><AboutPageContent locale="ko" /></KoreanSiteFrame>; }
