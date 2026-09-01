import { DistrictRankings } from '../../../../../components/public-market/district-rankings';
import { SiteFooter } from '../../../../../components/site-footer';
import { SiteHeader } from '../../../../../components/site-header';
import { KOREAN_ROUTE_COPY, KOREAN_SITE_FOOTER, KOREAN_SITE_HEADER } from '../../../../../lib/locale/ko';
import { buildPublicAreaRankingsModel } from '../../../../../lib/public-market/rankings-route-model.server';
import { indexableMetadata } from '../../../../../lib/public-metadata';
import styles from '../korean-evidence.module.css';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/rankings/',
  title: '서울 구별 전세 근거 순위 | signedprice',
  description: '서울 구별 신고 전세 계약의 중앙값, 분포 폭과 표본 깊이를 같은 기준으로 비교합니다.',
  languageAlternates: { en: '/kr/seoul/rankings/', ko: '/ko/kr/seoul/rankings/' },
});

export default function KoreanRankingsPage() {
  return (
    <div id="top" lang="ko" className={styles.page}>
      <SiteHeader copy={KOREAN_SITE_HEADER} />
      <main>
        <header className={styles.intro}>
          <p>{KOREAN_ROUTE_COPY.rankings.eyebrow}</p>
          <h1>{KOREAN_ROUTE_COPY.rankings.heading}</h1>
          <p>{KOREAN_ROUTE_COPY.rankings.description}</p>
        </header>
        <DistrictRankings locale="ko" model={buildPublicAreaRankingsModel()} />
      </main>
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
