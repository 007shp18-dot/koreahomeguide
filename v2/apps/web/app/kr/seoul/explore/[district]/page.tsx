import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';

import { DistrictDetailPage } from '../../../../../components/public-market/district-detail-page';
import { buildPublicDistrictModel } from '../../../../../lib/public-market/area-route-model.server';
import { buildDistrictMetadata } from '../../../../../lib/public-market/district-metadata';

type NestedDistrictPageProps = Readonly<{
  params: Promise<Readonly<{ district: string }>>;
}>;

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

export default async function NestedDistrictPage({ params }: NestedDistrictPageProps) {
  const { district } = await params;
  const model = buildPublicDistrictModel(district);
  if (model === null) notFound();
  return <DistrictDetailPage model={model} />;
}
