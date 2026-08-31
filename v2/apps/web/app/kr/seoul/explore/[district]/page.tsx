import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';

import { DistrictDetailPage } from '../../../../../components/public-market/district-detail-page';
import { buildPublicDistrictModel } from '../../../../../lib/public-market/area-route-model.server';
import { buildDistrictMetadata } from '../../../../../lib/public-market/district-metadata';

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
    singleValue(query.contract),
  );
  if (model === null) notFound();
  return <DistrictDetailPage model={model} />;
}
