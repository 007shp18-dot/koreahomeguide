import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BuildingDetailPage } from '@/components/public-market/building-detail-page';
import { BuildingOfficialFacts } from '@/components/public-market/building-official-facts';
import { NaverBuildingStreetView } from '@/components/maps/naver-building-street-view';
import {
  KoreaEvidenceBuildingDetail,
  ObservedBuildingDetail,
  BuildingProximityDisclosure,
} from '@/components/public-market/observed-building-detail';
import { PropertyTypeDetailPage } from '@/components/public-market/property-type-detail-page';
import {
  createSelectionHref,
  parseExplorerSelection,
  type ExplorerSelection,
} from '@/lib/navigation/explorer-selection';
import { buildBuildingDecisionModel } from '@/lib/public-market/building-decision-model';
import { parseBuildingDecisionSelection } from '@/lib/public-market/building-decision-state';
import { buildBuildingVisualModel } from '@/lib/public-market/building-visual-model';
import { buildPublicBuildingModel } from '@/lib/public-market/building-route-model.server';
import { publicBuildingRepositoryFromEnvironment } from '@/lib/public-market/building-summary-repository.server';
import { buildObservedBuildingIdentityModel } from '@/lib/public-market/observed-building-route-model.server';
import {
  buildKoreaExplorerBuildingDetailModel,
  KOREA_EXPLORER_HOUSING_TYPES,
} from '@/lib/public-market/korea-explorer-evidence.server';
import {
  koreaEvidenceRepositoriesFromEnvironment,
  type KoreaEvidenceRepositories,
} from '@/lib/public-market/korea-evidence-repositories.server';
import {
  buildPublicPropertyTypeModel,
  listPublicPropertyTypeRouteParams,
} from '@/lib/public-market/property-type-route-model.server';
import {
  normalizeKoreaExploreProximitySelection,
} from '@/lib/public-market/area-route-model.server';
import type { KoreaProximityRepositoryState } from '@/lib/public-market/korea-proximity-repository.server';
import { koreaProximityRepositoryFromEnvironment } from '@/lib/public-market/korea-proximity-repository.server';
import { appendKoreaProximityPairs } from '@/lib/public-market/korea-proximity-url';
import { indexableMetadata } from '@/lib/public-metadata';
import { localizedSeoulHref, type ProductLocale } from '@/lib/locale/product-copy';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

type LocalizedBuildingPageProps = BuildingPageProps & Readonly<{ locale?: ProductLocale }>;

type DetailQuery = Readonly<Record<string, string | readonly string[] | undefined>>;

function scalarQuery(query: DetailQuery, key: 'q' | 'buildingPage'): string | undefined {
  const value = query[key];
  return typeof value === 'string' ? value : undefined;
}

/** Creates a locale-aware Explore return URL from validated generic and Korea-only state. */
export function createKoreaDetailBackHref(
  query: DetailQuery,
  selection: ExplorerSelection,
  proximityRepository: KoreaProximityRepositoryState,
  locale: ProductLocale = 'en',
): string {
  const href = localizedSeoulHref(createSelectionHref(
    '/kr/seoul/explore/',
    selection,
    { market: 'kr', transaction: 'jeonse' },
  ), locale);
  const target = new URL(href, 'https://signedprice.invalid');
  const searchQuery = scalarQuery(query, 'q')?.trim();
  if (searchQuery !== undefined && searchQuery.length > 0) target.searchParams.set('q', searchQuery);
  const page = Number(scalarQuery(query, 'buildingPage'));
  if (Number.isSafeInteger(page) && page > 1) target.searchParams.set('buildingPage', String(page));
  return appendKoreaProximityPairs(
    `${target.pathname}${target.search}`,
    normalizeKoreaExploreProximitySelection(query, proximityRepository),
  );
}

function naverStreetViewFor(input: Readonly<{
  name: string;
  latitude: number | null;
  longitude: number | null;
  mapHref: string;
}>) {
  if (input.latitude === null || input.longitude === null) return undefined;
  return (
    <NaverBuildingStreetView
      clientId={process.env.NAVER_MAP_CLIENT_ID?.trim() || null}
      buildingName={input.name}
      latitude={input.latitude}
      longitude={input.longitude}
      mapHref={input.mapHref}
    />
  );
}

export const dynamicParams = true;

const evidenceAreas = Object.freeze([
  'all', 'under-40', '40-60', '60-85', '85-plus',
] as const);

export function resolveKoreaEvidenceBuildingRoute(
  district: string,
  buildingId: string,
  query: Readonly<Record<string, string | readonly string[] | undefined>>,
  repositories: KoreaEvidenceRepositories,
  proximityRepository: KoreaProximityRepositoryState = Object.freeze({ state: 'missing' }),
  locale: ProductLocale = 'en',
) {
  const selection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'jeonse' },
    {
      areas: evidenceAreas,
      propertyTypes: KOREA_EXPLORER_HOUSING_TYPES,
    },
  );
  const model = buildKoreaExplorerBuildingDetailModel(
    repositories,
    district,
    buildingId,
    {
      transaction: selection.transaction,
      areaBand: selection.area ?? 'all',
      housingType: selection.propertyType ?? 'all',
      contractGroup: selection.contractType ?? 'all',
    },
  );
  if (model === null) return null;
  const backHref = createKoreaDetailBackHref(
    query,
    {
      ...selection,
      propertyType: model.building.housingType,
      district: model.district.slug,
      neighborhood: model.building.neighborhoodId,
      buildingId: model.building.buildingId,
    },
    proximityRepository,
    locale,
  );
  return Object.freeze({ model, backHref });
}

export function generateStaticParams() {
  const buildings = publicBuildingRepositoryFromEnvironment()?.listRouteParams() ?? [];
  const propertyTypes = listPublicPropertyTypeRouteParams().map(({ district, propertyType }) => ({
    district,
    buildingId: propertyType,
  }));
  return [...buildings, ...propertyTypes];
}

export async function generateMetadata({ params, searchParams }: BuildingPageProps): Promise<Metadata> {
  const { district, buildingId } = await params;
  const propertyTypeModel = buildPublicPropertyTypeModel(district, buildingId);
  if (propertyTypeModel !== null) {
    const buildingCount = propertyTypeModel.coverage.contributingBuildings;
    return indexableMetadata({
      path: `/kr/seoul/explore/${propertyTypeModel.district.slug}/${propertyTypeModel.propertyType.slug}/`,
      title: `${propertyTypeModel.district.nameEn} ${propertyTypeModel.propertyType.slug} jeonse evidence | signedprice`,
      description: `${propertyTypeModel.coverage.retainedContracts} retained recent contracts across ${buildingCount} published ${propertyTypeModel.district.nameEn} ${propertyTypeModel.propertyType.slug} building${buildingCount === 1 ? '' : 's'}, with MOLIT source and coverage limits shown.`,
    });
  }
  const exact = resolveKoreaEvidenceBuildingRoute(
    district,
    buildingId,
    await searchParams,
    koreaEvidenceRepositoriesFromEnvironment(),
  );
  if (exact !== null) {
    return {
      title: `${exact.model.building.officialName} ${exact.model.selection.transaction} evidence | signedprice`,
      description: `${exact.model.evidence.sampleLabel} for ${exact.model.building.officialName} in ${exact.model.period}, selected by transaction and filed area.`,
      robots: { index: false, follow: true },
    };
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) {
    const observed = buildObservedBuildingIdentityModel(district, buildingId);
    if (observed === null) notFound();
    return {
      title: `${observed.building.officialName} observed building | signedprice`,
      description: `${observed.observations.total} observed reported contract${observed.observations.total === 1 ? '' : 's'} for ${observed.building.officialName}; building-level price evidence is not published.`,
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `${model.building.name} reported contract evidence | signedprice`,
    description: `${model.display.sampleLabel} for ${model.building.name} in ${model.evidence.period}.`,
    robots: { index: false, follow: true },
  };
}

export type KoreaBuildingRouteCompositionDependencies = Readonly<{
  evidenceRepositories?: KoreaEvidenceRepositories;
  proximityRepository?: KoreaProximityRepositoryState;
  buildObservedIdentityModel?: typeof buildObservedBuildingIdentityModel;
}>;

/**
 * Composes one Detail branch after the App Router has resolved its promises.
 * The narrow dependencies keep the production route unchanged while allowing
 * branch-level server composition tests to provide verified repository states.
 */
export function composeKoreaBuildingRoute(input: Readonly<{
  district: string;
  buildingId: string;
  query: DetailQuery;
  locale?: ProductLocale;
  dependencies?: KoreaBuildingRouteCompositionDependencies;
}>) {
  const { district, buildingId, query, locale = 'en' } = input;
  const proximityRepository = input.dependencies?.proximityRepository
    ?? koreaProximityRepositoryFromEnvironment();
  const evidenceRepositories = input.dependencies?.evidenceRepositories
    ?? koreaEvidenceRepositoriesFromEnvironment();
  const observedIdentityModel = input.dependencies?.buildObservedIdentityModel
    ?? buildObservedBuildingIdentityModel;
  const propertyTypeModel = buildPublicPropertyTypeModel(district, buildingId);
  if (propertyTypeModel !== null) {
    const siblings = listPublicPropertyTypeRouteParams()
      .filter((route) => (
        route.district === propertyTypeModel.district.slug
        && route.propertyType !== propertyTypeModel.propertyType.slug
      ))
      .flatMap((route) => {
        const sibling = buildPublicPropertyTypeModel(route.district, route.propertyType);
        return sibling === null ? [] : [sibling.propertyType];
    });
    return <PropertyTypeDetailPage model={propertyTypeModel} siblings={siblings} />;
  }
  const exact = resolveKoreaEvidenceBuildingRoute(
    district,
    buildingId,
    query,
    evidenceRepositories,
    proximityRepository,
    locale,
  );
  if (exact !== null) {
    const identity = observedIdentityModel(district, buildingId, { proximityRepository });
    return <KoreaEvidenceBuildingDetail
      model={exact.model}
      backHref={exact.backHref}
      locale={locale}
      visual={naverStreetViewFor({
        name: exact.model.building.officialName,
        latitude: identity?.coordinate.status === 'ready' ? identity.coordinate.latitude : null,
        longitude: identity?.coordinate.status === 'ready' ? identity.coordinate.longitude : null,
        mapHref: exact.backHref,
      })}
      facts={<><BuildingOfficialFacts districtSlug={exact.model.district.slug} buildingId={exact.model.building.buildingId} /><BuildingProximityDisclosure proximity={identity?.proximity} locale={locale} /></>}
    />;
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) {
    const observed = observedIdentityModel(district, buildingId, { proximityRepository });
    if (observed === null) notFound();
    const selection = parseExplorerSelection(
      query,
      { market: 'kr', transaction: 'jeonse' },
      {
        districts: [observed.district.slug],
        neighborhoodsByDistrict: {
          [observed.district.slug]: [observed.building.neighborhoodId],
        },
        buildingIdsByNeighborhood: {
          [observed.building.neighborhoodId]: [observed.building.buildingId],
        },
      },
    );
    const backHref = createKoreaDetailBackHref(
      query,
      { ...selection, district: observed.district.slug },
      proximityRepository,
      locale,
    );
    return <ObservedBuildingDetail
      model={observed}
      backHref={backHref}
      visual={naverStreetViewFor({
        name: observed.building.officialName,
        latitude: observed.coordinate.status === 'ready' ? observed.coordinate.latitude : null,
        longitude: observed.coordinate.status === 'ready' ? observed.coordinate.longitude : null,
        mapHref: backHref,
      })}
      facts={<BuildingOfficialFacts
        districtSlug={observed.district.slug}
        buildingId={observed.building.buildingId}
      />}
      locale={locale}
    />;
  }
  const selection = parseBuildingDecisionSelection(
    query as Readonly<Record<string, string | string[] | undefined>>,
  );
  const observed = observedIdentityModel(district, buildingId, { proximityRepository });
  const decision = buildBuildingDecisionModel(model, selection);
  const explorerSelection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'jeonse' },
    {
      districts: [model.district.slug],
      neighborhoodsByDistrict: {
        [model.district.slug]: [model.building.neighborhoodId],
      },
      buildingIdsByNeighborhood: {
        [model.building.neighborhoodId]: [model.building.buildingId],
      },
    },
  );
  const backHref = createKoreaDetailBackHref(
    query,
    { ...explorerSelection, district: model.district.slug },
    proximityRepository,
    locale,
  );
  const base = `/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/`;
  const visual = buildBuildingVisualModel({
    buildingName: model.building.name,
    mapHref: backHref,
    photo: null,
  });
  const streetView = naverStreetViewFor({
    name: model.building.name,
    latitude: model.building.latitude,
    longitude: model.building.longitude,
    mapHref: backHref,
  });
  return (
    <BuildingDetailPage
      model={model}
      decision={decision}
      visual={visual}
      streetView={streetView}
      facts={<><BuildingOfficialFacts districtSlug={model.district.slug} buildingId={model.building.buildingId} /><BuildingProximityDisclosure proximity={observed?.proximity} locale={locale} /></>}
      base={base}
      backHref={backHref}
    />
  );
}

export default async function BuildingRoute({ params, searchParams, locale = 'en' }: LocalizedBuildingPageProps) {
  const { district, buildingId } = await params;
  return composeKoreaBuildingRoute({
    district,
    buildingId,
    query: await searchParams,
    locale,
  });
}
