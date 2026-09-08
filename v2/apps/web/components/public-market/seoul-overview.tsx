import { PublicBreadcrumbJsonLd } from '../public-json-ld';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { KOREAN_SITE_HEADER, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { MarketOverview } from '../market-ui/market-overview';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';

export function SeoulOverview({ locale = 'en' }: { locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko', prefix = ko ? '/ko' : '';
  const repositories = koreaEvidenceRepositoriesFromEnvironment();
  const sale = repositories.sale?.getArtifact(), rent = repositories.rent?.getArtifact();
  const districts = new Set([...repositories.sale?.listBuildingRecords() ?? [], ...repositories.rent?.listBuildingRecords() ?? []].map(b => b.districtSlug));
  const updated = [sale?.generatedAt, rent?.generatedAt].filter((d): d is string => !!d).sort().at(-1);
  const actions = [
    { label: ko ? '실거래가 탐색' : 'Explore reported prices', href: `${prefix}/kr/seoul/explore/`, description: ko ? '구 → 동 → 단지 탐색' : 'District → neighbourhood → building', external: false },
    { label: ko ? '매물 가격 비교' : 'Compare an asking price', href: `${prefix}/kr/seoul/check/`, description: ko ? '단지와 면적, 매물 가격을 입력해 실거래가와 비교하세요.' : 'Compare a building, size and asking price with reported contracts.', external: false },
    { label: ko ? '서울 실거래 분석' : 'Seoul price analysis', href: `${prefix}/news/?type=data-stories&market=seoul`, description: ko ? '실제 거래로 읽는 지역별 가격' : 'Read local price stories based on reported transactions.', external: false },
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
      <MarketOverview locale={locale} city={ko ? '서울' : 'Seoul'} description={ko ? '동네와 단지별 매매·전세·월세 실거래가를 살펴보고 매물 가격을 비교하세요.' : 'Explore sale, jeonse and monthly-rent contracts by neighbourhood and building.'}
        media={<MarketRepresentativePhoto photo={ko ? { ...MARKET_PHOTOS.seoul, alt: '남산을 배경으로 한 서울 아파트 전경' } : MARKET_PHOTOS.seoul} eager context="city" locale={locale} />}
        facts={summaries} available={!!sale || !!rent} actions={actions}
        notes={<><p>{ko ? '매매와 전세·월세는 각각 표시된 기간으로 따로 집계합니다. 신고된 계약 내역이며, 현재 나온 매물이 아닙니다. 신고 지연이나 정정으로 수치가 달라질 수 있습니다.' : 'Sale and rental samples are counted separately for their stated periods. Reported transactions are not current listings and may change after reporting delays or corrections.'}</p>
          <p><a href="https://rt.molit.go.kr/">{ko ? '국토교통부 실거래가 공개시스템' : 'MOLIT reported contracts'}</a></p></>} />
    </main>
    <PublicBreadcrumbJsonLd items={[{ name: ko ? '홈' : 'Home', path: '/' }, { name: ko ? '서울' : 'Seoul', path: `${prefix}/kr/seoul/` }]} />
    <SiteFooter locale={locale} copy={ko ? KOREAN_SITE_FOOTER : homepageCopy.footer} />
  </div>;
}
