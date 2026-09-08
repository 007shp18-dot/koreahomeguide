import { DistrictRankings } from '@/components/public-market/district-rankings';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { resolveKoreaRankingsPageModel } from '@/app/(en)/kr/seoul/rankings/page';
import { buildKoreanSiteHeader, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '../korean-evidence.module.css';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/rankings/',
  title: '서울 건물 실거래가 순위 | signedprice',
  description: '선택 조건에 맞는 서울 건물의 매매·전세·월세 중앙값을 비교하고 구별 가격과 자료 기간을 함께 확인합니다.',
  locale: 'ko_KR',
  imagePath: '/og/ko/',
  languageAlternates: { en: '/kr/seoul/rankings/', ko: '/ko/kr/seoul/rankings/' },
});

type KoreanRankingsPageProps = Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function KoreanRankingsPage({
  searchParams = Promise.resolve({}),
}: KoreanRankingsPageProps = {}) {
  const model = resolveKoreaRankingsPageModel(
    await searchParams,
    koreaEvidenceRepositoriesFromEnvironment(),
  );
  return (
    <div id="top" lang="ko" className={styles.page}>
      <SiteHeader copy={buildKoreanSiteHeader('/kr/seoul/rankings/')} />
      <main>
        <DistrictRankings locale="ko" model={model} />
      </main>
      <SiteFooter locale="ko" copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
