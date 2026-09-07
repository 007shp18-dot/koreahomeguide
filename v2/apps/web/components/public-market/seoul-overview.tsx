import Link from 'next/link';
import {PublicBreadcrumbJsonLd} from '../public-json-ld';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { KOREAN_SITE_HEADER, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import styles from './seoul-overview.module.css';

export function SeoulOverview({ locale = 'en' }: { locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko', prefix = ko ? '/ko' : '';
  const repositories = koreaEvidenceRepositoriesFromEnvironment();
  const sale = repositories.sale?.getArtifact(), rent = repositories.rent?.getArtifact();
  const districts = new Set([...repositories.sale?.listBuildingRecords() ?? [], ...repositories.rent?.listBuildingRecords() ?? []].map(b => b.districtSlug));
  const updated = [sale?.generatedAt, rent?.generatedAt].filter((d): d is string => !!d).sort().at(-1);
  return <><SiteHeader copy={ko ? KOREAN_SITE_HEADER : { ...homepageCopy.header, marketLabel: 'Seoul', links: [{ label: 'Seoul', href: '/kr/seoul/', isCurrent: true }] }} />
    <main className={styles.page}>
      <header className={styles.intro}>
        <div><p className={styles.eyebrow}>{ko ? '서울 부동산' : 'SEOUL PROPERTY'}</p><h1>{ko ? '서울 실거래가' : 'Seoul reported prices'}</h1>
          <p className={styles.summary}>{ko ? '매매·전세·월세, 실제 계약으로 확인하세요.' : 'Explore neighbourhoods and check asking prices against reported contracts.'}</p></div>
        <dl className={styles.stats}>
          {sale && <div><dt>{ko ? '매매 계약' : 'Sale contracts'}</dt><dd>{sale.stats.eligibleRecordCount.toLocaleString()}</dd></div>}
          {rent && <div><dt>{ko ? '전세·월세 계약' : 'Rental contracts'}</dt><dd>{rent.stats.eligibleRecordCount.toLocaleString()}</dd></div>}
          {districts.size > 0 && <div><dt>{ko ? '서울 자치구' : 'Seoul districts'}</dt><dd>{districts.size}</dd></div>}
        </dl>
      </header>
      {!sale && !rent && <p role="status">{ko ? '실거래 자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.' : 'Transaction data could not be loaded. Please try again shortly.'}</p>}
      <nav className={styles.actions} aria-label={ko ? '서울 실거래가 탐색' : 'Explore Seoul prices'}>
        <Link href={`${prefix}/kr/seoul/explore/`}><span className={styles.step}>{ko ? '01 · 지역·단지 찾기' : '01 · FIND A PLACE'}</span><h2>{ko ? '실거래가 탐색' : 'Explore reported prices'}</h2><p>{ko ? '구와 동을 골라 단지별 매매·전세·월세와 최근 거래를 살펴보세요.' : 'Choose a district and neighbourhood to see building prices and recent sale and rental contracts.'}</p><strong>{ko ? '구 → 동 → 단지 탐색' : 'District → neighbourhood → building'} →</strong></Link>
        <Link href={`${prefix}/kr/seoul/check/`}><span className={styles.step}>{ko ? '02 · 본 매물 비교하기' : '02 · CHECK A PROPERTY'}</span><h2>{ko ? '제시가격 확인' : 'Check an asking price'}</h2><p>{ko ? '단지·면적·가격을 입력하면 같은 단지와 같은 구의 신고 거래를 나란히 비교합니다.' : 'Enter a building, size and price to compare reported contracts in the building and district.'}</p><strong>{ko ? '내가 본 가격 비교하기 →' : 'Compare my asking price →'}</strong></Link>
      </nav>
      <div className={styles.source}><div><p>{ko ? '출처: 국토교통부 신고 자료' : 'Source: MOLIT reported contracts'}</p><p>{sale && `${ko ? '매매' : 'Sales'} ${sale.period.replace('/', '–')}`} {rent && ` · ${ko ? '임대' : 'Rentals'} ${rent.period.replace('/', '–')}`}{updated && ` · ${ko ? '갱신' : 'Updated'} ${updated.slice(0, 10)}`}</p></div><Link href="/news/?market=seoul&type=analysis">{ko ? '서울 실거래 분석 보기 →' : 'Read Seoul price analysis →'}</Link></div>
    </main><PublicBreadcrumbJsonLd items={[{name:ko?'홈':'Home',path:'/'},{name:ko?'서울':'Seoul',path:`${prefix}/kr/seoul/`}]} /><SiteFooter copy={ko ? KOREAN_SITE_FOOTER : homepageCopy.footer} /></>;
}
