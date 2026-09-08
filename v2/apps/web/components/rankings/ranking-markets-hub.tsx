import Link from 'next/link';

import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { ResearchPageHeading } from '../market-ui/research-page-heading';
import { homepageCopy } from '../../lib/site-copy';
import styles from '../global-product-hub.module.css';

type Locale = 'en' | 'ko';

export function RankingMarketsHub({ locale = 'en' }: Readonly<{ locale?: Locale }>) {
  const ko = locale === 'ko';
  const prefix = ko ? '/ko' : '';
  const currentHref = `${prefix}/rankings/`;
  const header = {
    ...homepageCopy.header,
    homeHref: ko ? '/ko/' : '/',
    languageLabel: ko ? 'KO' : 'EN',
    languageSwitch: ko
      ? { label: 'EN', href: '/rankings/', hrefLang: 'en' as const }
      : { label: 'KO', href: '/ko/rankings/', hrefLang: 'ko' as const },
    links: [{ label: ko ? '순위' : 'Rankings', href: currentHref, isCurrent: true }],
  };
  return <div id="top" lang={locale}>
    <SiteHeader copy={header} />
    <main className={styles.main}>
      <ResearchPageHeading
        title={ko ? '가격 순위' : 'Property price rankings'}
        description={ko
          ? '서울 자치구와 싱가포르 단지의 신고 가격을 자료 기간별로 높은 순서부터 비교해 보세요.'
          : 'Compare reported prices across Seoul districts and Singapore projects, ranked from highest to lowest for each source period.'}
        actions={<Link href={ko ? '/ko/guides/' : '/guides/'}>{ko ? '지역 비교 가이드' : 'How to read rankings'}</Link>}
      />
      <section className={styles.section} aria-labelledby="ranking-markets-title">
        <div className={styles.sectionHeading}><p>{ko ? '시장별 순위' : 'Market rankings'}</p><h2 id="ranking-markets-title">{ko ? '서울과 싱가포르 가격을 비교해 보세요.' : 'Compare prices in Seoul and Singapore.'}</h2></div>
        <div className={styles.productGrid}>
          <Link href={`${prefix}/kr/seoul/rankings/`}><span>{ko ? '서울 · 자치구' : 'Seoul · districts'}</span><h3>{ko ? '자치구별 매매·전세·월세 중앙값' : 'Sale, jeonse and monthly rent by district'}</h3><p>{ko ? '각 순위에 표시된 기간의 국토교통부 신고 자료로 자치구별 가격을 비교합니다.' : 'Compare district prices from MOLIT filings for the source period shown on each ranking.'}</p><strong>{ko ? '서울 순위 보기 →' : 'Open Seoul rankings →'}</strong></Link>
          <Link href={`${prefix}/sg/singapore/rankings/`}><span>{ko ? '싱가포르 · 단지' : 'Singapore · projects'}</span><h3>{ko ? '민간주택 단지별 매매 가격' : 'Private home prices by project'}</h3><p>{ko ? '각 순위에 표시된 기간의 URA 신고 자료로 단지 가격과 제곱피트당 가격을 비교합니다.' : 'Compare project prices and prices per square foot from URA filings for the source period shown.'}</p><strong>{ko ? '싱가포르 순위 보기 →' : 'Open Singapore rankings →'}</strong></Link>
        </div>
      </section>
    </main>
    <SiteFooter copy={{ ...homepageCopy.footer, descriptor: ko ? '신고 가격 순위와 자료 기간, 집계 범위를 함께 확인할 수 있습니다.' : 'Reported price rankings with source periods and coverage notes.' }} locale={locale} />
  </div>;
}
