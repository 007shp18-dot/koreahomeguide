'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
import {
  createSelectionHref,
  parseExplorerSelection,
} from '../../lib/navigation/explorer-selection';
import { buildBuildingDecisionModel } from '../../lib/public-market/building-decision-model';
import { parseBuildingDecisionSelection } from '../../lib/public-market/building-decision-state';
import type { BuildingVisualModel } from '../../lib/public-market/building-visual-model';
import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import { appendValidatedKoreaHydratedExploreState } from '../../lib/public-market/korea-proximity-url';
import { BuildingDetailPage } from './building-detail-page';

const evidenceAreas = Object.freeze([
  'all', 'under-40', '40-60', '60-85', '85-plus',
] as const);

function scalar(searchParams: URLSearchParams, key: string): string | undefined {
  const values = searchParams.getAll(key);
  return values.length === 1 ? values[0] : undefined;
}

export function buildKoreaBuildingDecisionClientState(
  model: PublicBuildingModel,
  searchParams: URLSearchParams,
  initialBackHref: string,
  locale: ProductLocale = 'en',
) {
  const decision = buildBuildingDecisionModel(model, parseBuildingDecisionSelection({
    mode: scalar(searchParams, 'mode'),
    contract: scalar(searchParams, 'contract'),
  }));
  const hasExploreSelection = [
    'transaction', 'area', 'propertyType', 'district', 'neighborhood',
    'buildingId', 'contractType', 'view', 'q', 'buildingPage',
  ].some((key) => searchParams.has(key));
  if (!hasExploreSelection) return Object.freeze({ decision, backHref: initialBackHref });

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
    {
      ...selection,
      propertyType: model.building.housingType,
      district: model.district.slug,
      neighborhood: model.building.neighborhoodId,
      buildingId: model.building.buildingId,
    },
    { market: 'kr', transaction: 'sale' },
  ), locale);
  const target = new URL(href, 'https://signedprice.invalid');
  const query = scalar(searchParams, 'q')?.trim();
  if (query !== undefined && query.length > 0) target.searchParams.set('q', query);
  const page = Number(scalar(searchParams, 'buildingPage'));
  if (Number.isSafeInteger(page) && page > 1) target.searchParams.set('buildingPage', String(page));
  return Object.freeze({
    decision,
    backHref: appendValidatedKoreaHydratedExploreState(
      `${target.pathname}${target.search}`,
      searchParams,
    ),
  });
}

export function KoreaBuildingDecisionClient({
  model,
  visual,
  propertyMedia,
  facts,
  base,
  initialBackHref,
  locale = 'en',
}: Readonly<{
  model: PublicBuildingModel;
  visual: BuildingVisualModel;
  propertyMedia?: ReactNode;
  facts?: ReactNode;
  base: string;
  initialBackHref: string;
  locale?: ProductLocale;
}>) {
  const searchParams = useSearchParams();
  const state = buildKoreaBuildingDecisionClientState(
    model,
    new URLSearchParams(searchParams.toString()),
    initialBackHref,
    locale,
  );
  return <BuildingDetailPage
    locale={locale}
    model={model}
    decision={state.decision}
    visual={visual}
    propertyMedia={propertyMedia}
    facts={facts}
    base={base}
    backHref={state.backHref}
  />;
}
