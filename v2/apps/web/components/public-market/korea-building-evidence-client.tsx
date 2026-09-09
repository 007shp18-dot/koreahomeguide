'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
import { createKoreaBuildingEvidenceRequestHref } from '../../lib/navigation/explorer-selection';
import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import { appendValidatedKoreaHydratedExploreState } from '../../lib/public-market/korea-proximity-url';
import { BuildingOfficialFacts } from './building-official-facts';
import { KoreaEvidenceBuildingDetail } from './observed-building-detail';

type Coordinate = Readonly<{ latitude: number; longitude: number }>;

function transactionBuildingFacts(
  model: KoreaExplorerBuildingDetailModel,
  coordinate: Coordinate | undefined,
) {
  const floors = model.recentTransactions.flatMap(({ floor }) => floor === null ? [] : [floor]);
  const years = [...new Set(model.recentTransactions.flatMap(
    ({ buildYear }) => buildYear === null ? [] : [buildYear],
  ))].sort();
  const areas = model.recentTransactions.map(({ areaSqm }) => areaSqm);
  const range = (values: readonly number[], suffix = '') => values.length === 0
    ? 'Not reported'
    : `${Math.min(...values).toLocaleString('en-US')}${values.length === 1 ? '' : `–${Math.max(...values).toLocaleString('en-US')}`}${suffix}`;
  return Object.freeze([
    Object.freeze({ label: 'Property type', value: model.building.housingType }),
    Object.freeze({ label: 'Observed build year', value: years.length === 0 ? 'Not reported' : years.join(', ') }),
    Object.freeze({ label: 'Observed floors', value: range(floors) }),
    Object.freeze({ label: 'Observed filed area', value: range(areas, '㎡') }),
    Object.freeze({ label: 'Map identity', value: coordinate === undefined ? 'Coordinate verification pending' : `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}` }),
  ]);
}

function isEvidenceEnvelope(
  value: unknown,
  district: string,
  buildingId: string,
): value is Readonly<{ schemaVersion: 1; model: KoreaExplorerBuildingDetailModel }> {
  if (typeof value !== 'object' || value === null) return false;
  const envelope = value as Readonly<Record<string, unknown>>;
  if (envelope.schemaVersion !== 1 || typeof envelope.model !== 'object' || envelope.model === null) {
    return false;
  }
  const model = envelope.model as Readonly<Record<string, unknown>>;
  const modelDistrict = model.district as Readonly<Record<string, unknown>> | undefined;
  const modelBuilding = model.building as Readonly<Record<string, unknown>> | undefined;
  return model.status === 'ready'
    && modelDistrict?.slug === district
    && modelBuilding?.buildingId === buildingId;
}

export function buildKoreaBuildingEvidenceBackHref(
  model: KoreaExplorerBuildingDetailModel,
  locale: ProductLocale,
  currentQuery: URLSearchParams,
): string {
  const query = new URLSearchParams({
    transaction: model.selection.transaction,
    area: model.selection.areaBand,
    propertyType: model.building.housingType,
    district: model.district.slug,
    neighborhood: model.building.neighborhoodId,
    buildingId: model.building.buildingId,
  });
  if (model.selection.contractGroup !== 'not-applicable') {
    query.set('contractType', model.selection.contractGroup);
  }
  const search = currentQuery.getAll('q');
  if (search.length === 1 && search[0]!.trim().length > 0) query.set('q', search[0]!.trim());
  const page = currentQuery.getAll('buildingPage');
  if (page.length === 1 && Number.isSafeInteger(Number(page[0])) && Number(page[0]) > 1) {
    query.set('buildingPage', String(Number(page[0])));
  }
  return appendValidatedKoreaHydratedExploreState(
    localizedSeoulHref(`/kr/seoul/explore/?${query.toString()}`, locale),
    currentQuery,
  );
}

const EXPLORE_NAVIGATION_KEYS = Object.freeze([
  'transaction', 'area', 'propertyType', 'district', 'neighborhood',
  'buildingId', 'contractType', 'view', 'q', 'buildingPage',
  'station', 'stationDistance', 'school', 'schoolDistance',
]);

export function resolveKoreaBuildingEvidenceBackHref(
  model: KoreaExplorerBuildingDetailModel,
  locale: ProductLocale,
  currentQuery: URLSearchParams,
  initialBackHref: string,
): string {
  return EXPLORE_NAVIGATION_KEYS.some((key) => currentQuery.has(key))
    ? buildKoreaBuildingEvidenceBackHref(model, locale, currentQuery)
    : initialBackHref;
}

export function KoreaBuildingEvidenceClient({
  initialModel,
  initialBackHref,
  coordinate,
  proximity,
  visual,
  locale = 'en',
}: Readonly<{
  initialModel: KoreaExplorerBuildingDetailModel;
  initialBackHref: string;
  coordinate?: Coordinate;
  proximity?: ObservedBuildingIdentityModel['proximity'];
  visual?: ReactNode;
  locale?: ProductLocale;
}>) {
  const searchParams = useSearchParams();
  const currentQuery = new URLSearchParams(searchParams.toString());
  const requestHref = createKoreaBuildingEvidenceRequestHref({
    district: initialModel.district.slug,
    buildingId: initialModel.building.buildingId,
    searchParams: currentQuery,
  });
  const [loaded, setLoaded] = useState<Readonly<{
    requestHref: string;
    model: KoreaExplorerBuildingDetailModel;
  }> | null>(null);
  const model = loaded?.requestHref === requestHref ? loaded.model : initialModel;

  useEffect(() => {
    if (requestHref === null) return undefined;
    const controller = new AbortController();
    void fetch(requestHref, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).then(async (response) => {
      if (!response.ok) throw new TypeError('Building evidence unavailable.');
      return response.json() as Promise<unknown>;
    }).then((envelope) => {
      if (isEvidenceEnvelope(
        envelope,
        initialModel.district.slug,
        initialModel.building.buildingId,
      )) setLoaded(Object.freeze({ requestHref, model: envelope.model }));
    }).catch(() => {
      // Keep the canonical, server-rendered evidence if a filter request fails.
    });
    return () => controller.abort();
  }, [initialModel, requestHref]);

  const backHref = resolveKoreaBuildingEvidenceBackHref(
    model,
    locale,
    currentQuery,
    initialBackHref,
  );
  return <KoreaEvidenceBuildingDetail
    model={model}
    backHref={backHref}
    locale={locale}
    visual={visual}
    facts={<BuildingOfficialFacts
      districtSlug={model.district.slug}
      buildingId={model.building.buildingId}
      observedFacts={transactionBuildingFacts(model, coordinate)}
      proximity={proximity}
      locale={locale}
    />}
  />;
}
