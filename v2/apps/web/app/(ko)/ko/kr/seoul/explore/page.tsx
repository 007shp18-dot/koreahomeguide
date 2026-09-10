import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { KOREA_EVIDENCE_AREA_BANDS } from '@signedprice/korea-rent';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';

import { AreaExplorer } from '@/components/public-market/area-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildKoreanSiteHeader, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { parseExplorerSelection } from '@/lib/navigation/explorer-selection';
import {
  buildPublicAreaExploreModel,
  hydratePublicAreaExploreModelWithProjections,
} from '@/lib/public-market/area-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '../korean-evidence.module.css';
import { KOREA_EXPLORER_HOUSING_TYPES } from '@/lib/public-market/korea-explorer-evidence.server';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/explore/',
  title: '서울 아파트·오피스텔 실거래가 · 매매·전세·월세 | signedprice',
  description: '서울 25개 구의 아파트·오피스텔·빌라 매매 실거래가와 전세·월세를 지도에서 비교하세요. 동별 건물과 면적별 거래 이력, 데이터 기준일을 확인할 수 있습니다.',
  locale: 'ko_KR',
  imagePath: '/og/ko/',
  languageAlternates: { en: '/kr/seoul/explore/', ko: '/ko/kr/seoul/explore/' },
});

type KoreanExplorePageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function KoreanExplorePage({ searchParams }: KoreanExplorePageProps = {
  searchParams: Promise.resolve({}),
}) {
  const query = await searchParams;
  const selection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'sale' },
    {
      areas: KOREA_EVIDENCE_AREA_BANDS,
      propertyTypes: KOREA_EXPLORER_HOUSING_TYPES.filter((value) => value !== 'all'),
      districts: SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    },
  );
  const buildingQuery = singleValue(query.q);
  const requestedBuildingId = singleValue(query.buildingId);
  const model = await hydratePublicAreaExploreModelWithProjections(buildPublicAreaExploreModel(
    selection.district,
    undefined,
    selection.contractType ?? singleValue(query.contract),
    buildingQuery,
    {
      transaction: selection.transaction,
      areaBand: selection.area,
      housingType: selection.propertyType,
      contractGroup: selection.contractType ?? singleValue(query.contract),
    },
    singleValue(query.buildingPage),
    requestedBuildingId,
    query,
    singleValue(query.neighborhood),
  ));
  const availableBuildings = model.status === 'ready'
    ? (model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings
      : model.buildingAvailability.fallbackBuildings)
    : Object.freeze([]);
  const requestedBuilding = requestedBuildingId === undefined
    ? undefined
    : availableBuildings
      .find((building) => (
        building.id === requestedBuildingId
        && building.districtSlug === model.selectedSlug
      ));
  const requestedNeighborhood = singleValue(query.neighborhood);
  const restoredSelection = requestedBuilding !== undefined
    ? Object.freeze({
      ...selection,
      district: requestedBuilding.districtSlug,
      neighborhood: requestedBuilding.neighborhoodId,
      buildingId: requestedBuilding.id,
    })
    : requestedNeighborhood !== undefined && availableBuildings.some((building) => (
      building.districtSlug === model.selectedSlug
      && building.neighborhoodId === requestedNeighborhood
    ))
      ? Object.freeze({ ...selection, neighborhood: requestedNeighborhood })
      : selection;
  return (
    <div id="top" lang="ko" className={styles.page}>
      <SiteHeader copy={buildKoreanSiteHeader('/kr/seoul/explore/')} />
      <main>
        <AreaExplorer
          locale="ko"
          model={model}
          naverMapClientId={process.env.NAVER_MAP_CLIENT_ID?.trim() || null}
          googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
          initialQuery={buildingQuery}
          initialSelection={restoredSelection}
        />
      </main>
      <SiteFooter locale="ko" copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
