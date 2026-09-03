import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { KOREA_EVIDENCE_AREA_BANDS } from '@signedprice/korea-rent';

import { DistrictDetailPage } from '@/components/public-market/district-detail-page';
import { buildPublicAreaExploreModel, buildPublicDistrictModel } from '@/lib/public-market/area-route-model.server';
import { buildDistrictMetadata } from '@/lib/public-market/district-metadata';
import { parseExplorerSelection } from '@/lib/navigation/explorer-selection';
import { KOREA_EXPLORER_HOUSING_TYPES } from '@/lib/public-market/korea-explorer-evidence.server';
import {
  buildPublicPropertyTypeModel,
  listPublicPropertyTypeRouteParams,
} from '@/lib/public-market/property-type-route-model.server';

type NestedDistrictPageProps = Readonly<{
  params: Promise<Readonly<{ district: string }>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({ district: slug }));
}

export async function generateMetadata({ params }: NestedDistrictPageProps): Promise<Metadata> {
  const { district } = await params;
  const model = buildPublicDistrictModel(district);
  if (model === null) notFound();
  return buildDistrictMetadata(model, { indexPublished: true });
}

export default async function NestedDistrictPage({
  params,
  searchParams,
}: NestedDistrictPageProps) {
  const { district } = await params;
  const query = searchParams === undefined ? {} : await searchParams;
  const selection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'sale' },
    {
      areas: KOREA_EVIDENCE_AREA_BANDS,
      propertyTypes: KOREA_EXPLORER_HOUSING_TYPES.filter((value) => value !== 'all'),
      districts: SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    },
  );
  const model = buildPublicDistrictModel(
    district,
    undefined,
    singleValue(query.contractType) ?? singleValue(query.contract),
  );
  if (model === null) notFound();
  const propertyTypes = listPublicPropertyTypeRouteParams()
    .filter(({ district: routeDistrict }) => routeDistrict === model.identity.slug)
    .flatMap(({ district: routeDistrict, propertyType }) => {
      const propertyModel = buildPublicPropertyTypeModel(routeDistrict, propertyType);
      return propertyModel === null ? [] : [propertyModel.propertyType];
    });
  const explore = buildPublicAreaExploreModel(
    model.identity.slug,
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
    singleValue(query.buildingId),
    query,
  );
  const mapDistricts = explore.status === 'ready' ? explore.districts.map((item) => ({
    slug: item.slug,
    nameEn: item.nameEn,
    href: item.href,
    latitude: item.latitude,
    longitude: item.longitude,
  })) : [];
  const selected = explore.status === 'ready'
    ? explore.districts.find((item) => item.slug === model.identity.slug)
    : undefined;
  const districtBuildings = explore.status === 'ready'
    ? (explore.buildingAvailability.status === 'ready'
      ? explore.buildingAvailability.buildings
      : explore.buildingAvailability.fallbackBuildings)
      .filter((building) => building.districtSlug === model.identity.slug)
    : [];
  return <DistrictDetailPage
    model={model}
    propertyTypes={propertyTypes}
    mapDistricts={mapDistricts}
    mapPoint={selected === undefined ? undefined : { latitude: selected.latitude, longitude: selected.longitude }}
    currentDistrict={selected}
    comparisonDistricts={explore.status === 'ready' ? explore.districts : []}
    exploreBuildings={districtBuildings}
    exactSource={explore.status === 'ready' ? explore.source : undefined}
    naverMapClientId={process.env.NAVER_MAP_CLIENT_ID?.trim() || null}
  />;
}
