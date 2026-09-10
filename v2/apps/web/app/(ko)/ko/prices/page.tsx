import Link from 'next/link';
import { redirect } from 'next/navigation';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/tools/tools.module.css';
import searchStyles from '@/components/price-market-search.module.css';

export const metadata = indexableMetadata({ path: '/ko/prices/', title: '도시별 실거래가 둘러보기 | SignedPrice', description: '도시별 공개 거래 자료를 검색하고 지역·건물·단지의 가격과 자료 범위를 비교하세요.', languageAlternates: { en: '/prices/', ko: '/ko/prices/' }, locale: 'ko_KR', imagePath: '/og/ko/' });
const markets = [
  { id: 'seoul', label: '서울', href: '/ko/kr/seoul/explore/', description: '자치구·동네·건물별 매매가와 전월세 계약을 살펴보세요.' },
  { id: 'singapore', label: '싱가포르', href: '/ko/sg/singapore/explore/', description: '민간 주택 단지와 HDB 재판매 거래를 구분해 비교하세요.' },
  { id: 'dubai', label: '두바이', href: '/ko/ae/dubai/explore/', description: '지역별 준공·분양 매매가와 연간 임대료를 비교하고 공개 자료의 범위를 확인하세요.' },
  { id: 'tokyo', label: '도쿄', href: '/jp/tokyo/explore/', description: '자치구·동네·면적·분기별로 공개된 거래 가격을 살펴보세요.' },
] as const;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const selected = markets.find(({ id }) => id === query.market) ?? markets[0];
  if (q) redirect(`${selected.href}?q=${encodeURIComponent(q)}`);
  return <KoreanSiteFrame href="/ko/prices/"><main className={styles.page}>
    <ResearchPageHeading title="둘러보기" description="도시를 선택하고 공개된 계약 자료로 관심 지역과 주택의 가격을 비교하세요." />
    <section className={searchStyles.search} aria-label="실거래가 검색"><form action="/ko/prices/" role="search">
      <label>도시<select name="market" defaultValue={selected.id}>{markets.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}</select></label>
      <label className={searchStyles.query}>지역·건물·단지<input name="q" type="search" placeholder="지역명 또는 건물·단지명" required /></label><button type="submit">가격 탐색</button>
    </form><p>도시마다 자료의 기간과 공개 범위가 다릅니다. 두바이는 지역별 집계 자료를 제공합니다.</p></section>
    <ul className={styles.list}>{markets.map(market => <li key={market.id}><div><h2>{market.label}</h2><p>{market.description}</p></div><Link href={market.href}>실거래가 탐색</Link></li>)}</ul>
    <nav className={styles.links} aria-label="가격 비교 다음 단계"><Link href="/ko/tools/">계산·비교 도구</Link><Link href="/ko/guides/">계약 전 가이드</Link><Link href="/ko/news/?type=analysis">시장 분석</Link></nav>
  </main></KoreanSiteFrame>;
}
