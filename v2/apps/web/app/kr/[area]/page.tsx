import { notFound } from 'next/navigation';

import { PublicMarketPage } from '../../../components/public-market/public-market-page';
import {
  buildKoreaPublicPageMetadata,
  buildKoreaPublicRouteModel,
} from '../../../lib/public-market/route-model.server';
import { PublicSummaryUnavailableError } from '../../../lib/public-market/summary-repository.server';

type KoreaAreaPageProps = Readonly<{
  params: Promise<Readonly<{ area: string }>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ area: 'seoul' }];
}

export async function generateMetadata({ params }: KoreaAreaPageProps) {
  const { area } = await params;
  let model;
  try {
    model = buildKoreaPublicRouteModel(area);
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) notFound();
    throw error;
  }
  if (model === null) notFound();
  return buildKoreaPublicPageMetadata(model, '/kr/seoul/');
}

export default async function KoreaAreaPage({ params }: KoreaAreaPageProps) {
  const { area } = await params;
  let model;
  try {
    model = buildKoreaPublicRouteModel(area);
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) notFound();
    throw error;
  }
  if (model === null) notFound();
  return <PublicMarketPage mode="area" {...model} />;
}
