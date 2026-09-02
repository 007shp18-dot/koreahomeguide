import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BuildingDetailPage } from '@/components/public-market/building-detail-page';
import { BuildingOfficialFacts } from '@/components/public-market/building-official-facts';
import { NaverBuildingStreetView } from '@/components/maps/naver-building-street-view';
import {
  KoreaEvidenceBuildingDetail,
  ObservedBuildingDetail,
} from '@/components/public-market/observed-building-detail';
import { PropertyTypeDetailPage } from '@/components/public-market/property-type-detail-page';
import {
  createSelectionHref,
  parseExplorerSelection,
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
import { indexableMetadata } from '@/lib/public-metadata';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

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
  const backHref = createSelectionHref(
    '/kr/seoul/explore/',
    {
      ...selection,
      propertyType: model.building.housingType,
      district: model.district.slug,
      neighborhood: model.building.neighborhoodId,
      buildingId: model.building.buildingId,
    },
    { market: 'kr', transaction: 'jeonse' },
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

export default async function BuildingRoute({ params, searchParams }: BuildingPageProps) {
  const { district, buildingId } = await params;
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
  const query = await searchParams;
  const exact = resolveKoreaEvidenceBuildingRoute(
    district,
    buildingId,
    query,
    koreaEvidenceRepositoriesFromEnvironment(),
  );
  if (exact !== null) {
    const identity = buildObservedBuildingIdentityModel(district, buildingId);
    return <KoreaEvidenceBuildingDetail
      model={exact.model}
      backHref={exact.backHref}
      visual={naverStreetViewFor({
        name: exact.model.building.officialName,
        latitude: identity?.coordinate.status === 'ready' ? identity.coordinate.latitude : null,
        longitude: identity?.coordinate.status === 'ready' ? identity.coordinate.longitude : null,
        mapHref: exact.backHref,
      })}
      facts={<BuildingOfficialFacts
        districtSlug={exact.model.district.slug}
        buildingId={exact.model.building.buildingId}
      />}
    />;
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) {
    const observed = buildObservedBuildingIdentityModel(district, buildingId);
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
    const backHref = createSelectionHref(
      '/kr/seoul/explore/',
      { ...selection, district: observed.district.slug },
      { market: 'kr', transaction: 'jeonse' },
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
    />;
  }
  const selection = parseBuildingDecisionSelection(query);
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
  const backHref = createSelectionHref(
    '/kr/seoul/explore/',
    { ...explorerSelection, district: model.district.slug },
    { market: 'kr', transaction: 'jeonse' },
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
      facts={<BuildingOfficialFacts
        districtSlug={model.district.slug}
        buildingId={model.building.buildingId}
      />}
      base={base}
      backHref={backHref}
    />
  );
}
