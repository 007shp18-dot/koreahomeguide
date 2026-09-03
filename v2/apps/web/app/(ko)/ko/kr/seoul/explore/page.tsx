import { KOREA_EVIDENCE_AREA_BANDS } from '@signedprice/korea-rent';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';

import { AreaExplorer } from '@/components/public-market/area-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildKoreanSiteHeader, KOREAN_SITE_FOOTER } from '@/lib/locale/ko';
import { parseExplorerSelection } from '@/lib/navigation/explorer-selection';
import { buildPublicAreaExploreModel } from '@/lib/public-market/area-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '../korean-evidence.module.css';
import { KOREA_EXPLORER_HOUSING_TYPES } from '@/lib/public-market/korea-explorer-evidence.server';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/explore/',
  title: '서울 25개 구 전세 근거 | signedprice',
  description: '서울 25개 구의 전체 면적 매매·전세·월세 신고 계약 근거와 게시 제한을 확인하세요.',
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
  const model = buildPublicAreaExploreModel(
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
  );
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
          initialQuery={buildingQuery}
          initialSelection={restoredSelection}
        />
      </main>
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </div>
  );
}
