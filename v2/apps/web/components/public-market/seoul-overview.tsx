import { PublicBreadcrumbJsonLd } from '../public-json-ld';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { KOREAN_SITE_HEADER, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { MarketHero } from '../market-hero';
import { MarketOverviewRows } from '../market-overview-rows';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
import type { MarketOverviewRowModel } from '@/lib/route-model';

export function SeoulOverview({ locale = 'en' }: { locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko', prefix = ko ? '/ko' : '';
  const repositories = koreaEvidenceRepositoriesFromEnvironment();
  const sale = repositories.sale?.getArtifact(), rent = repositories.rent?.getArtifact();
  const districts = new Set([...repositories.sale?.listBuildingRecords() ?? [], ...repositories.rent?.listBuildingRecords() ?? []].map(b => b.districtSlug));
  const updated = [sale?.generatedAt, rent?.generatedAt].filter((d): d is string => !!d).sort().at(-1);
  const actions = [
    { label: ko ? '실거래가 탐색' : 'Explore reported prices', href: `${prefix}/kr/seoul/explore/`, description: ko ? '구 → 동 → 단지 탐색' : 'District → neighbourhood → building', external: false },
    { label: ko ? '제시가격 확인' : 'Check an asking price', href: `${prefix}/kr/seoul/check/`, description: ko ? '단지·면적·가격으로 신고 거래와 비교' : 'Compare a building, size and asking price with reported contracts.', external: false },
    { label: ko ? '서울 실거래 분석' : 'Seoul price analysis', href: '/news/?market=seoul&type=analysis', description: ko ? '실제 거래로 읽는 지역별 가격' : 'Read local price stories based on reported transactions.', external: false },
  ];
  const rows: MarketOverviewRowModel[] = [
    { number: '02', title: ko ? '실거래 자료' : 'Reported prices', description: ko ? '구와 동을 골라 단지별 최근 계약과 같은 면적대의 가격을 확인하세요.' : 'Choose a district and neighbourhood to see recent building contracts and prices for similar sizes.', state: 'available', stateLabel: ko ? '매매 · 전세 · 월세' : 'Sale · jeonse · monthly rent', items: [{ label: ko ? '국토교통부 신고 자료' : 'MOLIT reported contracts', description: ko ? '매매와 임대 표본은 별도로 집계합니다. 신고된 거래이며 현재 판매 중인 매물은 아닙니다.' : 'Sale and rental samples are counted separately. Reported transactions are not current listings.' }] },
    { number: '03', title: ko ? '제시가격 확인' : 'Check an asking price', description: ko ? '단지·면적·가격을 입력하고 같은 단지와 같은 구의 신고 거래를 나란히 비교하세요.' : 'Enter a building, size and price to compare reported contracts in the building and district.', state: 'available', stateLabel: ko ? '같은 단지 · 같은 구' : 'This building · this district', items: actions.map(({ label, href, description }) => ({ label, href, description })) },
  ];
  const summaries = [
    ...(sale ? [{ label: ko ? '매매 계약' : 'Sale contracts', value: sale.stats.eligibleRecordCount.toLocaleString(), detail: sale.period.replace('/', '–') }] : []),
    ...(rent ? [{ label: ko ? '전세·월세 계약' : 'Rental contracts', value: rent.stats.eligibleRecordCount.toLocaleString(), detail: rent.period.replace('/', '–') }] : []),
    ...(districts.size ? [{ label: ko ? '서울 자치구' : 'Seoul districts', value: String(districts.size), detail: ko ? '구 → 동 → 단지' : 'District → neighbourhood → building' }] : []),
    ...(updated ? [{ label: ko ? '자료 갱신' : 'Data updated', value: updated.slice(0, 10), detail: ko ? '국토교통부 신고 자료 기준' : 'Source: MOLIT reported contracts' }] : []),
  ];
  return <div id="top">
    <SiteHeader copy={ko ? KOREAN_SITE_HEADER : { ...homepageCopy.header, marketLabel: 'Seoul', links: [{ label: 'Seoul', href: '/kr/seoul/', isCurrent: true }] }} />
    <main>
      <MarketHero model={{ sectionLabel: ko ? '서울 실거래가' : 'Seoul reported prices', eyebrow: ko ? '대한민국 · 서울' : 'SOUTH KOREA · SEOUL', heading: ko ? '서울 실거래가' : 'Seoul reported prices', description: ko ? '매매·전세·월세, 실제 계약으로 확인하세요. 지역과 단지를 찾고 내가 본 가격을 비교할 수 있습니다.' : 'Explore sale, jeonse and monthly-rent contracts. Find a neighbourhood and building, then compare an asking price with reported transactions.', facts: [] }} media={<MarketRepresentativePhoto photo={ko ? { ...MARKET_PHOTOS.seoul, alt: '남산을 배경으로 한 서울 아파트 전경' } : MARKET_PHOTOS.seoul} eager context="city" />} />
      {!sale && !rent ? <p role="status">{ko ? '실거래 자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.' : 'Transaction data could not be loaded. Please try again shortly.'}</p> : null}
      <MarketOverviewRows rows={rows} actions={actions} actionsLabel={ko ? '서울 실거래가 탐색' : 'Explore Seoul prices'} primaryAction summaryItems={summaries} visitorLocale={locale} />
    </main>
    <PublicBreadcrumbJsonLd items={[{ name: ko ? '홈' : 'Home', path: '/' }, { name: ko ? '서울' : 'Seoul', path: `${prefix}/kr/seoul/` }]} />
    <SiteFooter copy={ko ? KOREAN_SITE_FOOTER : homepageCopy.footer} />
  </div>;
}
