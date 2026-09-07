import Link from 'next/link';
import { KoreanSiteFrame } from './korean-site-frame';
import { MarketHero } from './market-hero';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from './market-representative-photo';
import styles from './global-product-hub.module.css';

export function KoreanMarketOverview({ market, facts, period, available }: Readonly<{ market: 'singapore' | 'dubai'; facts: readonly { label: string; value: string }[]; period: string; available: boolean }>) {
  const sg = market === 'singapore';
  const name = sg ? '싱가포르' : '두바이';
  const base = sg ? '/sg/singapore' : '/ae/dubai';
  return <KoreanSiteFrame href={sg ? '/ko/sg/' : '/ko/ae/dubai/'}><main>
    <MarketHero model={{ sectionLabel: `${name} 시장 개요`, eyebrow: name, heading: `${name} 부동산 시장`, description: sg ? '민간 주택과 HDB를 구분해 지역·건물의 거래를 살펴보세요. 주택 유형과 보유 기간 조건을 확인하고 같은 조건의 가격을 비교하세요.' : '준공 주택(Ready)과 분양 단계(Off-Plan)를 나누어 지역별 가격과 임대료를 비교하세요. 지역 통계는 개별 호실의 감정가격이 아닙니다.', facts: [], layout: 'overview' }} media={<MarketRepresentativePhoto photo={{ ...MARKET_PHOTOS[market], alt: `${name} 도시 전경` }} cityLabel={name} eager />} />
    <section className={styles.section}><h2>비교할 수 있는 자료</h2>
      {!available ? <p role="status">현재 집계 자료를 불러오지 못했습니다. 데이터 출처와 이용 안내를 먼저 확인해 주세요.</p> : <><div className={styles.productGrid}>{facts.map(fact => <article key={fact.label}><h3>{fact.label}</h3><p>{fact.value}</p></article>)}</div><p>{period}</p></>}
      <p>{sg ? '민간 주택은 지역·프로젝트·면적·소유권 기간·거래 유형을 맞춰 비교하세요. HDB는 별도 자료와 조건으로 확인해야 합니다.' : '가격과 임대료는 서로 다른 주택 표본일 수 있습니다. 지역별 거래 건수와 기간을 확인하고 실제 관리비·공실·취득 비용은 별도로 검토하세요.'}</p>
    </section>
    <section className={styles.section}><h2>다음 단계</h2><p>이 개요는 한국어로 제공됩니다. 아래 탐색·가격 확인·상세 가이드는 현재 영문 화면으로 연결됩니다.</p><div className={styles.productGrid}>
      <Link href={`${base}/explore/`}><h3>지역과 후보 찾기 (영문)</h3><p>{sg ? '프로젝트와 거래 내역을 찾아보세요.' : '지역별 준공·분양 가격을 살펴보세요.'}</p></Link>
      <Link href={`${base}/check/`}><h3>제시가격 확인 (영문)</h3><p>검토 중인 가격과 면적을 입력해 공개된 거래 통계와 비교하세요.</p></Link>
      <Link href={sg ? '/guides/read-singapore-private-transactions/' : '/ae/dubai/guide/'}><h3>비교·구매 가이드 (영문)</h3><p>비교 기준과 추가 확인할 비용·서류를 살펴보세요.</p></Link>
    </div><p><Link href={`/ko/contact/#research-${market}`}>자료 관련 질문 보내기</Link></p></section>
  </main></KoreanSiteFrame>;
}
