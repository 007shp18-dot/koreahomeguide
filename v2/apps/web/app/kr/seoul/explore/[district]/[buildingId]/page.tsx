import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BuildingDetailPage } from '../../../../../../components/public-market/building-detail-page';
import { PropertyTypeDetailPage } from '../../../../../../components/public-market/property-type-detail-page';
import { buildBuildingDecisionModel } from '../../../../../../lib/public-market/building-decision-model';
import { parseBuildingDecisionSelection } from '../../../../../../lib/public-market/building-decision-state';
import { buildBuildingVisualModel } from '../../../../../../lib/public-market/building-visual-model';
import { buildPublicBuildingModel } from '../../../../../../lib/public-market/building-route-model.server';
import { publicBuildingRepositoryFromEnvironment } from '../../../../../../lib/public-market/building-summary-repository.server';
import {
  buildPublicPropertyTypeModel,
  listPublicPropertyTypeRouteParams,
} from '../../../../../../lib/public-market/property-type-route-model.server';
import { publicCanonical } from '../../../../../../lib/public-metadata';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  const buildings = publicBuildingRepositoryFromEnvironment()?.listRouteParams() ?? [];
  const propertyTypes = listPublicPropertyTypeRouteParams().map(({ district, propertyType }) => ({
    district,
    buildingId: propertyType,
  }));
  return [...buildings, ...propertyTypes];
}

export async function generateMetadata({ params }: BuildingPageProps): Promise<Metadata> {
  const { district, buildingId } = await params;
  const propertyTypeModel = buildPublicPropertyTypeModel(district, buildingId);
  if (propertyTypeModel !== null) {
    const buildingCount = propertyTypeModel.coverage.contributingBuildings;
    return {
      title: `${propertyTypeModel.district.nameEn} ${propertyTypeModel.propertyType.slug} jeonse evidence | signedprice`,
      description: `${propertyTypeModel.coverage.retainedContracts} retained recent contracts across ${buildingCount} published ${propertyTypeModel.district.nameEn} ${propertyTypeModel.propertyType.slug} building${buildingCount === 1 ? '' : 's'}, with MOLIT source and coverage limits shown.`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: publicCanonical(
          `/kr/seoul/explore/${propertyTypeModel.district.slug}/${propertyTypeModel.propertyType.slug}/`,
        ),
      },
    };
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) notFound();
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
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) notFound();
  const selection = parseBuildingDecisionSelection(await searchParams);
  const decision = buildBuildingDecisionModel(model, selection);
  const base = `/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/`;
  const visual = buildBuildingVisualModel({
    buildingName: model.building.name,
    mapHref: `/kr/seoul/explore/?district=${model.district.slug}`,
    photo: null,
  });
  return (
    <BuildingDetailPage
      model={model}
      decision={decision}
      visual={visual}
      base={base}
    />
  );
}
