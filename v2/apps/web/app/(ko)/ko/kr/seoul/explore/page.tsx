import { AreaExplorer } from '@/components/public-market/area-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildKoreanSiteHeader, KOREAN_ROUTE_COPY, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { buildPublicAreaExploreModel } from '@/lib/public-market/area-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '../korean-evidence.module.css';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/explore/',
  title: '서울 25개 구 전세 근거 | signedprice',
  description: '서울 25개 구의 45–55㎡ 신고 전세 계약 중앙값, 표본 수와 게시 제한을 확인하세요.',
  locale: 'ko_KR',
  imagePath: '/og/ko/',
  languageAlternates: { en: '/kr/seoul/explore/', ko: '/ko/kr/seoul/explore/' },
});

export default function KoreanExplorePage() {
  return (
    <div id="top" lang="ko" className={styles.page}>
      <SiteHeader copy={buildKoreanSiteHeader('/kr/seoul/explore/')} />
      <main>
        <header className={styles.intro}>
          <p>{KOREAN_ROUTE_COPY.explore.eyebrow}</p>
          <h1>{KOREAN_ROUTE_COPY.explore.heading}</h1>
          <p>{KOREAN_ROUTE_COPY.explore.description}</p>
        </header>
        <AreaExplorer
          locale="ko"
          model={buildPublicAreaExploreModel(undefined)}
          naverMapClientId={process.env.NAVER_MAP_CLIENT_ID?.trim() || null}
        />
      </main>
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
