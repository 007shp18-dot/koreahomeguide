import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';

import { DistrictDetailPage } from '@/components/public-market/district-detail-page';
import { buildPublicAreaExploreModel, buildPublicDistrictModel } from '@/lib/public-market/area-route-model.server';
import { buildDistrictMetadata } from '@/lib/public-market/district-metadata';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { listKoreaBuildingDirectory } from '@/lib/public-market/korea-building-index-policy';
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
  const model = buildPublicDistrictModel(
    district,
    undefined,
    singleValue(query.contractType) ?? singleValue(query.contract),
  );
  if (model === null) notFound();
  const directory = listKoreaBuildingDirectory(
    koreaEvidenceRepositoriesFromEnvironment().rent?.listBuildingRecords() ?? [],
    model.identity.slug,
  );
  const propertyTypes = listPublicPropertyTypeRouteParams()
    .filter(({ district: routeDistrict }) => routeDistrict === model.identity.slug)
    .flatMap(({ district: routeDistrict, propertyType }) => {
      const propertyModel = buildPublicPropertyTypeModel(routeDistrict, propertyType);
      return propertyModel === null ? [] : [propertyModel.propertyType];
    });
  const explore = buildPublicAreaExploreModel(model.identity.slug);
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
  return <DistrictDetailPage
    model={model}
    propertyTypes={propertyTypes}
    directory={directory}
    mapDistricts={mapDistricts}
    mapPoint={selected === undefined ? undefined : { latitude: selected.latitude, longitude: selected.longitude }}
    naverMapClientId={process.env.NAVER_MAP_CLIENT_ID?.trim() || null}
  />;
}
