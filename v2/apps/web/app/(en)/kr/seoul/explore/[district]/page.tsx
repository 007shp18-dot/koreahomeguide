import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { buildPublicDistrictModel } from '@/lib/public-market/area-route-model.server';
import { buildDistrictMetadata } from '@/lib/public-market/district-metadata';
import { renderSeoulDistrictPage } from '@/lib/public-market/district-detail-route.server';
type NestedDistrictPageProps = Readonly<{
  params: Promise<Readonly<{ district: string }>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({ district: slug }));
}

export async function generateMetadata({ params }: NestedDistrictPageProps): Promise<Metadata> {
  const { district } = await params;
  const model = buildPublicDistrictModel(district);
  if (model === null) notFound();
  return buildDistrictMetadata(model, { indexPublished: true, evidence: 'sale' });
}

export default async function NestedDistrictPage(props: NestedDistrictPageProps) {
  return renderSeoulDistrictPage(props);
}
