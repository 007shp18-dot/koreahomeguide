import Link from 'next/link';
import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import { buildPublicAreaExploreModel } from '../../../../lib/public-market/area-route-model.server';
import { indexableMetadata } from '../../../../lib/public-metadata';
import {
  KOREAN_ROUTE_COPY,
  KOREAN_SITE_FOOTER,
  KOREAN_SITE_HEADER,
  formatKrwKo,
} from '../../../../lib/locale/ko';
import styles from './korean-evidence.module.css';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/',
  title: '서울 주거 계약 근거 | signedprice',
  description: '서울 전세 신고 계약의 기간, 표본 수, 중앙값과 게시 기준을 함께 확인하세요.',
  languageAlternates: { en: '/kr/seoul/', ko: '/ko/kr/seoul/' },
});

export default function KoreanSeoulPage() {
  const model = buildPublicAreaExploreModel(undefined);
  const ready = model.status === 'ready' ? model : null;
  const median = ready?.citySummary.published ? formatKrwKo(ready.citySummary.med) : '게시 안 함';
  return (
    <div id="top" lang="ko" className={styles.page}>
      <SiteHeader copy={KOREAN_SITE_HEADER} />
      <main>
        <header className={styles.intro}>
          <p>{KOREAN_ROUTE_COPY.home.eyebrow}</p>
          <h1>{KOREAN_ROUTE_COPY.home.heading}</h1>
          <p>{KOREAN_ROUTE_COPY.home.description}</p>
        </header>
        <dl className={styles.summary}>
          <div><dt>게시된 구</dt><dd>{ready === null ? '확인 불가' : `${ready.coverage.districts.published} / ${ready.coverage.districts.retained}`}</dd></div>
          <div><dt>조건을 충족한 계약</dt><dd>{ready === null ? '확인 불가' : `${ready.coverage.eligibleContracts.toLocaleString('ko-KR')}건`}</dd></div>
          <div><dt>서울 전체 중앙값</dt><dd>{median}</dd></div>
        </dl>
        <nav className={styles.actions} aria-label="서울 근거 기능">
          <Link href="/ko/kr/seoul/check/"><span>계약 비교</span><small>보증금과 월세 조건 비교</small></Link>
          <Link href="/ko/kr/seoul/explore/"><span>구별 탐색</span><small>25개 구 신고 계약 근거</small></Link>
          <Link href="/ko/kr/seoul/rankings/"><span>근거 순위</span><small>중앙값·분포·표본 비교</small></Link>
        </nav>
      </main>
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
