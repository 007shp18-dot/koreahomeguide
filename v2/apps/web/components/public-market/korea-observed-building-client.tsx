'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
import {
  createSelectionHref,
  parseExplorerSelection,
} from '../../lib/navigation/explorer-selection';
import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import { appendValidatedKoreaHydratedExploreState } from '../../lib/public-market/korea-proximity-url';
import { ObservedBuildingDetail } from './observed-building-detail';

const evidenceAreas = Object.freeze([
  'all', 'under-40', '40-60', '60-85', '85-plus',
] as const);

function scalar(searchParams: URLSearchParams, key: string): string | undefined {
  const values = searchParams.getAll(key);
  return values.length === 1 ? values[0] : undefined;
}

export function buildKoreaObservedBuildingBackHref(
  model: ObservedBuildingIdentityModel,
  searchParams: URLSearchParams,
  initialBackHref: string,
  locale: ProductLocale = 'en',
): string {
  const hasExploreSelection = [
    'transaction', 'area', 'propertyType', 'district', 'neighborhood',
    'buildingId', 'contractType', 'view', 'q', 'buildingPage',
  ].some((key) => searchParams.has(key));
  if (!hasExploreSelection) return initialBackHref;

  const selection = parseExplorerSelection(
    searchParams,
    { market: 'kr', transaction: 'sale' },
    {
      areas: evidenceAreas,
      propertyTypes: [model.building.housingType],
      districts: [model.district.slug],
      neighborhoodsByDistrict: {
        [model.district.slug]: [model.building.neighborhoodId],
      },
      buildingIdsByNeighborhood: {
        [model.building.neighborhoodId]: [model.building.buildingId],
      },
    },
  );
  const href = localizedSeoulHref(createSelectionHref(
    '/kr/seoul/explore/',
    { ...selection, district: model.district.slug },
    { market: 'kr', transaction: 'sale' },
  ), locale);
  const target = new URL(href, 'https://signedprice.invalid');
  const query = scalar(searchParams, 'q')?.trim();
  if (query !== undefined && query.length > 0) target.searchParams.set('q', query);
  const page = Number(scalar(searchParams, 'buildingPage'));
  if (Number.isSafeInteger(page) && page > 1) target.searchParams.set('buildingPage', String(page));
  return appendValidatedKoreaHydratedExploreState(
    `${target.pathname}${target.search}`,
    searchParams,
  );
}

export function KoreaObservedBuildingClient({
  model,
  initialBackHref,
  visual,
  facts,
  locale = 'en',
}: Readonly<{
  model: ObservedBuildingIdentityModel;
  initialBackHref: string;
  visual?: ReactNode;
  facts?: ReactNode;
  locale?: ProductLocale;
}>) {
  const searchParams = useSearchParams();
  const backHref = buildKoreaObservedBuildingBackHref(
    model,
    new URLSearchParams(searchParams.toString()),
    initialBackHref,
    locale,
  );
  return <ObservedBuildingDetail
    model={model}
    backHref={backHref}
    visual={visual}
    facts={facts}
    locale={locale}
  />;
}
