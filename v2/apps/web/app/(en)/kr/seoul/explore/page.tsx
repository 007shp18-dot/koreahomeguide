import type { Metadata } from 'next';
import { KOREA_EVIDENCE_AREA_BANDS } from '@signedprice/korea-rent';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { AreaExplorer } from '@/components/public-market/area-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { buildPublicAreaExploreModel } from '@/lib/public-market/area-route-model.server';
import { parseExplorerSelection } from '@/lib/navigation/explorer-selection';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '@/lib/site-copy';
import { indexableMetadata } from '@/lib/public-metadata';
import { KOREA_EXPLORER_HOUSING_TYPES } from '@/lib/public-market/korea-explorer-evidence.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';

type ExplorerPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/explore/',
  title: 'Seoul sale, jeonse and monthly-rent evidence | signedprice',
  description: 'Compare verified all-area sale, jeonse and monthly-rent evidence across Seoul districts.',
  languageAlternates: {
    en: '/kr/seoul/explore/',
    ko: '/ko/kr/seoul/explore/',
  },
});

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul evidence navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  languageSwitch: {
    label: 'KO',
    href: '/ko/kr/seoul/explore/',
    hrefLang: 'ko',
  },
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District evidence', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse-deposit evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Compare markets', href: '/compare/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function ExplorerPage({ searchParams }: ExplorerPageProps) {
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
  const requestedBuildingId = singleValue(query.buildingId);
  const model = buildPublicAreaExploreModel(
    selection.district,
    undefined,
    selection.contractType ?? singleValue(query.contract),
    singleValue(query.q),
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
  const naverMapClientId = process.env.NAVER_MAP_CLIENT_ID?.trim() || null;
  const googleMapsBrowserKey = googleMapsBrowserKeyFromEnvironment();

  return (
    <div id="top" className="explorer-page">
      <SiteHeader copy={header} />
      <main>
        <AreaExplorer
          model={model}
          naverMapClientId={naverMapClientId}
          googleMapsBrowserKey={googleMapsBrowserKey}
          initialQuery={singleValue(query.q)}
          initialSelection={restoredSelection}
        />
      </main>
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Explore', path: '/kr/seoul/explore/' },
      ]} />
      <SiteFooter copy={footer} />
    </div>
  );
}
