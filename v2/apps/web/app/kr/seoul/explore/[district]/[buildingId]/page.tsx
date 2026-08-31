import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BuildingDetailPage } from '../../../../../../components/public-market/building-detail-page';
import { buildPublicBuildingModel } from '../../../../../../lib/public-market/building-route-model.server';
import { publicBuildingRepositoryFromEnvironment } from '../../../../../../lib/public-market/building-summary-repository.server';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [...(publicBuildingRepositoryFromEnvironment()?.listRouteParams() ?? [])];
}

export async function generateMetadata({ params }: BuildingPageProps): Promise<Metadata> {
  const { district, buildingId } = await params;
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) notFound();
  return {
    title: `${model.building.name} reported contract evidence | signedprice`,
    description: `${model.display.sampleLabel} for ${model.building.name} in ${model.evidence.period}.`,
    robots: { index: false, follow: true },
  };
}

export default async function BuildingRoute({ params }: BuildingPageProps) {
  const { district, buildingId } = await params;
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) notFound();
  return <BuildingDetailPage model={model} />;
}
