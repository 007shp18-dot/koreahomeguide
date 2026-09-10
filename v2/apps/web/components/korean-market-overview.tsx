import Link from 'next/link';
import { KoreanSiteFrame } from './korean-site-frame';
import { MarketOverview } from './market-ui/market-overview';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from './market-representative-photo';
import { DUBAI_SOURCES } from '@/lib/dubai/research';

export function KoreanMarketOverview({ market, facts, period, available }: Readonly<{ market: 'singapore' | 'dubai'; facts: readonly { label: string; value: string; detail?: string }[]; period: string; available: boolean }>) {
  const sg = market === 'singapore';
  const name = sg ? '싱가포르' : '두바이';
  const base = sg ? '/ko/sg/singapore' : '/ko/ae/dubai';
  return <KoreanSiteFrame href={sg ? '/ko/sg/' : '/ko/ae/dubai/'}><main>
    <MarketOverview locale="ko" city={name}
      description={sg ? '민간 주택과 공공주택(HDB)의 거래를 구분해 살펴보고 매물 가격을 비교하세요.' : '완공 주택(Ready)과 분양 중인 주택(Off-Plan)의 지역별 가격과 연간 임대료를 비교하세요.'}
      media={<MarketRepresentativePhoto photo={{ ...MARKET_PHOTOS[market], alt: `${name} 도시 전경` }} cityLabel={name} eager locale="ko" />}
      facts={facts} period={period} available={available}
      actions={[
        { label: '실거래가 탐색', href: `${base}/explore/`, description: sg ? '동네와 단지별 거래를 확인하세요.' : '완공 주택과 분양 중인 주택의 가격을 지역별로 확인하세요.' },
        { label: '매물 가격 비교', href: `${base}/check/`, description: '매물 가격과 면적을 입력해 실제 거래된 가격과 비교하세요.' },
        { label: '구입 전 확인사항', href: sg ? '/ko/guides/singapore-condo-buying-budget-guide/' : '/ko/guides/dubai-ready-apartment-buying-budget-guide/', description: '구입 비용과 계약 전에 확인할 서류를 살펴보세요.' },
      ]}
      notes={<>{sg ? <>
        <p>민간 주택 매매 통계는 URA 민간 주택 매매 자료를 기준으로 집계합니다. HDB 재판매와 임대 자료는 별도로 확인하세요. CCR·RCR·OCR을 구분하고 지역·단지·면적·소유권 조건과 거래 유형이 비슷한 집끼리 비교하세요.</p>
        <p>신고 거래는 정정될 수 있습니다. 표본이 부족하면 가격 통계를 표시하지 않습니다. PSF는 신고된 SGD 가격과 제곱미터 면적으로 계산하며, PSM도 같은 원본 면적을 사용합니다. 현재 매물이나 맞춤 투자 추천은 제공하지 않습니다.</p>
        <p><a href="https://www.ura.gov.sg/Corporate/Property/Property-Data">싱가포르 도시재개발청(URA) 주택 거래 자료</a> · <Link href={`${base}/corrections/`}>자료 정정 내역</Link></p>
      </> : <>
        <p>지역별 중앙값은 지역을 비교하기 위한 통계이며 특정 집의 가격이나 현재 매물을 뜻하지 않습니다. 표본이 부족하면 가격 통계를 표시하지 않습니다.</p>
        <p>매매가격과 연간 임대료를 집계한 주택이 서로 다를 수 있습니다. 임대수익률은 비용 차감 전 추정치입니다. 거래 건수와 기간을 함께 보고, 관리비·구입 비용·공실 기간을 따로 따져보세요.</p>
        <p><a href={DUBAI_SOURCES.data}>두바이 토지청(DLD) 공개 자료</a></p>
      </>}<p><Link href={`/ko/contact/#research-${market}`}>궁금한 점 문의하기</Link></p></>} />
  </main></KoreanSiteFrame>;
}
