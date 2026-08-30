import { notFound } from 'next/navigation';

import { PublicMarketPage } from '../../../../components/public-market/public-market-page';
import {
  buildKoreaPublicPageMetadata,
  buildKoreaPublicRouteModel,
} from '../../../../lib/public-market/route-model.server';
import { PublicSummaryUnavailableError } from '../../../../lib/public-market/summary-repository.server';

type KoreaCheckPageProps = Readonly<{
  params: Promise<Readonly<{ area: string }>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ area: 'seoul' }];
}

export async function generateMetadata({ params }: KoreaCheckPageProps) {
  const { area } = await params;
  let model;
  try {
    model = buildKoreaPublicRouteModel(area);
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) notFound();
    throw error;
  }
  if (model === null) notFound();
  return buildKoreaPublicPageMetadata(model, '/kr/check/seoul/');
}

export default async function KoreaCheckPage({ params }: KoreaCheckPageProps) {
  const { area } = await params;
  let model;
  try {
    model = buildKoreaPublicRouteModel(area);
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) notFound();
    throw error;
  }
  if (model === null) notFound();
  return <PublicMarketPage mode="check" {...model} />;
}
