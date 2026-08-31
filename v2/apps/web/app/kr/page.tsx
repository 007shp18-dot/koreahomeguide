import { notFound } from 'next/navigation';

import { PublicMarketPage } from '../../components/public-market/public-market-page';
import {
  buildKoreaPublicPageMetadata,
  buildKoreaPublicRouteModel,
} from '../../lib/public-market/route-model.server';
import { PublicSummaryUnavailableError } from '../../lib/public-market/summary-repository.server';

export function generateMetadata() {
  let model;
  try {
    model = buildKoreaPublicRouteModel('seoul');
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) notFound();
    throw error;
  }
  if (model === null) notFound();
  return buildKoreaPublicPageMetadata('/kr/');
}

export default function KoreaHomePage() {
  let model;
  try {
    model = buildKoreaPublicRouteModel('seoul');
  } catch (error) {
    if (error instanceof PublicSummaryUnavailableError) notFound();
    throw error;
  }
  if (model === null) notFound();
  return <PublicMarketPage mode="home" {...model} />;
}
