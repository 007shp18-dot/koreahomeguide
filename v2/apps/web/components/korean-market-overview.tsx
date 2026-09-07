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
    <MarketHero model={{ sectionLabel: `${name} 시장 개요`, eyebrow: name, heading: `${name} 부동산 시장`, description: sg ? '민간 주택과 공공주택(HDB)의 거래를 각각 살펴보세요. 같은 단지에서도 면적과 소유권 조건에 따라 가격이 달라질 수 있습니다.' : '완공된 주택(Ready)과 분양 중인 주택(Off-Plan)의 지역별 가격과 임대료를 살펴보세요. 지역 통계만으로 특정 집의 가격을 판단하기는 어렵습니다.', facts: [], layout: 'overview' }} media={<MarketRepresentativePhoto photo={{ ...MARKET_PHOTOS[market], alt: `${name} 도시 전경` }} cityLabel={name} eager />} />
    <section className={styles.section}><h2>어떤 거래를 볼 수 있나요?</h2>
      {!available ? <p role="status">지금은 거래 정보를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.</p> : <><div className={styles.productGrid}>{facts.map(fact => <article key={fact.label}><h3>{fact.label}</h3><p>{fact.value}</p></article>)}</div><p>{period}</p></>}
      <p>{sg ? '민간 주택은 지역·단지·면적·소유권 조건과 거래 유형이 비슷한 집끼리 비교하세요. HDB 거래는 민간 주택과 따로 살펴보세요.' : '매매가격과 임대료를 집계한 주택이 서로 다를 수 있습니다. 거래 건수와 기간을 함께 보고, 관리비와 구입 비용, 집이 비어 있는 기간도 따로 따져보세요.'}</p>
    </section>
    <section className={styles.section}><h2>이어서 살펴보기</h2><p>실거래가 탐색과 가격 비교는 현재 영어로 제공됩니다.</p><div className={styles.productGrid}>
      <Link href={`${base}/explore/`}><h3>지역별 실거래가 (영문)</h3><p>{sg ? '관심 있는 단지의 거래 내역을 확인하세요.' : '완공 주택과 분양 중인 주택의 가격을 지역별로 확인하세요.'}</p></Link>
      <Link href={`${base}/check/`}><h3>관심 매물 가격 비교 (영문)</h3><p>매물의 가격과 면적을 입력해 실제 거래된 가격과 비교하세요.</p></Link>
      <Link href={sg ? '/ko/guides/singapore-condo-buying-budget-guide/' : '/ko/guides/dubai-ready-apartment-buying-budget-guide/'}><h3>구매 전 확인사항</h3><p>가격을 비교하는 방법과 구입 전에 확인할 비용·서류를 정리했습니다.</p></Link>
    </div><p><Link href={`/ko/contact/#research-${market}`}>궁금한 점 문의하기</Link></p></section>
  </main></KoreanSiteFrame>;
}
