import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';
import { buildKoreanSiteHeader, KOREAN_ROUTE_COPY, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '../korean-evidence.module.css';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/check/',
  title: '서울 임대차 계약 조건 비교 | signedprice',
  description: '보증금과 월세가 다른 두 서울 임대차 계약 조건을 같은 월 비용 기준으로 비교합니다.',
  locale: 'ko_KR',
  imagePath: '/og/ko/',
  languageAlternates: { en: '/kr/seoul/check/', ko: '/ko/kr/seoul/check/' },
});

export default function KoreanContractCheckPage() {
  const model = buildContractCheckRouteModel();
  return (
    <div id="top" lang="ko" className={styles.page}>
      <SiteHeader copy={buildKoreanSiteHeader('/kr/seoul/check/')} />
      <main>
        <header className={styles.intro}>
          <p>{KOREAN_ROUTE_COPY.check.eyebrow}</p>
          <h1>{KOREAN_ROUTE_COPY.check.heading}</h1>
          <p>{KOREAN_ROUTE_COPY.check.description}</p>
        </header>
        <ContractCheckWorkspace locale="ko" model={model} />
      </main>
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
