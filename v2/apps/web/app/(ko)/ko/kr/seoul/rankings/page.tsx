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
  title: '서울 구별 전세 근거 순위 | signedprice',
  description: '서울 구별 신고 전세 계약의 중앙값, 분포 폭과 표본 깊이를 같은 기준으로 비교합니다.',
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
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
