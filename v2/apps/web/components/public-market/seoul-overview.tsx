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
  const summaries = [sale && `${sale.stats.eligibleRecordCount.toLocaleString()}${ko ? '건 매매' : ' sale contracts'} · ${sale.period.replace('/', '–')}`, rent && `${rent.stats.eligibleRecordCount.toLocaleString()}${ko ? '건 전세·월세' : ' rental contracts'} · ${rent.period.replace('/', '–')}`].filter(Boolean);
  return <><SiteHeader copy={ko ? KOREAN_SITE_HEADER : { ...homepageCopy.header, marketLabel: 'Seoul', links: [{ label: 'Seoul', href: '/kr/seoul/', isCurrent: true }] }} />
    <main className={styles.page}><p className={styles.eyebrow}>SEOUL</p><h1>{ko ? '서울 실거래가' : 'Seoul reported prices'}</h1>
      <p className={styles.summary}>{summaries.join(' · ')}{summaries.length ? ` · ${districts.size}${ko ? '개 구' : ' districts'} · ${ko ? '출처: 국토교통부 신고 자료' : 'Source: MOLIT reported contracts'}` : ko ? '실거래 자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.' : 'Transaction data could not be loaded. Please try again shortly.'}</p>
      <p>{ko ? '구를 고르고, 동과 단지로 좁혀 같은 면적대의 매매·전세·월세를 확인하세요.' : 'Choose a district, narrow to a neighbourhood, then compare recorded prices for a building and size range.'}</p>
      <nav className={styles.actions} aria-label={ko ? '서울 실거래가 탐색' : 'Explore Seoul prices'}><Link href={`${prefix}/kr/seoul/explore/`}>{ko ? '구 → 동 → 단지 탐색' : 'District → neighbourhood → building'}</Link><Link href={`${prefix}/kr/seoul/check/`}>{ko ? '제안받은 가격 확인' : 'Check an asking price'}</Link><Link href="/news/?market=seoul&type=analysis">{ko ? '서울 실거래 분석' : 'Seoul price analysis'}</Link></nav>
      {updated && <p className={styles.updated}>{ko ? '갱신' : 'Updated'} {updated.slice(0, 10)} · {ko ? '매매와 임대 표본은 별도로 집계합니다.' : 'Sale and rental samples are counted separately.'}</p>}
    </main><PublicBreadcrumbJsonLd items={[{name:ko?'홈':'Home',path:'/'},{name:ko?'서울':'Seoul',path:`${prefix}/kr/seoul/`}]} /><SiteFooter copy={ko ? KOREAN_SITE_FOOTER : homepageCopy.footer} /></>;
}
