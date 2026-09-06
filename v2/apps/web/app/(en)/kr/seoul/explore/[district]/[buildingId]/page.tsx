import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { BuildingDetailPage } from '@/components/public-market/building-detail-page';
import { BuildingOfficialFacts } from '@/components/public-market/building-official-facts';
import { KoreaBuildingEvidenceClient } from '@/components/public-market/korea-building-evidence-client';
import { KoreaBuildingDecisionClient } from '@/components/public-market/korea-building-decision-client';
import { KoreaObservedBuildingClient } from '@/components/public-market/korea-observed-building-client';
import { ProjectedEntityMedia } from '@/components/public-market/projected-entity-media';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import {
  listStoredPublicPhotoApprovals,
  type StoredPublicPhotoApproval,
} from '@/lib/photos/building-photo-store.server';
import {
  KoreaEvidenceBuildingDetail,
  ObservedBuildingDetail,
} from '@/components/public-market/observed-building-detail';
import { PropertyTypeDetailPage } from '@/components/public-market/property-type-detail-page';
import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';
import {
  createSelectionHref,
  parseExplorerSelection,
  type ExplorerSelection,
} from '@/lib/navigation/explorer-selection';
import { buildBuildingDecisionModel } from '@/lib/public-market/building-decision-model';
import { parseBuildingDecisionSelection } from '@/lib/public-market/building-decision-state';
import { buildBuildingVisualModel } from '@/lib/public-market/building-visual-model';
import { buildPublicBuildingModel } from '@/lib/public-market/building-route-model.server';
import { publicBuildingRepositoryFromEnvironment } from '@/lib/public-market/building-summary-repository.server';
import { buildObservedBuildingIdentityModel } from '@/lib/public-market/observed-building-route-model.server';
import {
  buildKoreaExplorerBuildingDetailModel,
  KOREA_EXPLORER_HOUSING_TYPES,
  type KoreaExplorerBuildingDetailModel,
} from '@/lib/public-market/korea-explorer-evidence.server';
import {
  koreaEvidenceRepositoriesFromEnvironment,
  type KoreaEvidenceRepositories,
} from '@/lib/public-market/korea-evidence-repositories.server';
import {
  buildPublicPropertyTypeModel,
  listPublicPropertyTypeRouteParams,
} from '@/lib/public-market/property-type-route-model.server';
import {
  normalizeKoreaExploreProximitySelection,
} from '@/lib/public-market/area-route-model.server';
import type { KoreaProximityRepositoryState } from '@/lib/public-market/korea-proximity-repository.server';
import { koreaProximityRepositoryFromEnvironment } from '@/lib/public-market/korea-proximity-repository.server';
import { appendKoreaProximityPairs } from '@/lib/public-market/korea-proximity-url';
import {
  isKoreaBuildingIndexable,
  koreaBuildingCanonicalSelection,
  koreaBuildingEvidenceDepth,
  listPrerenderedKoreaBuildingRouteParams,
  type KoreaBuildingEvidenceRecordPair,
} from '@/lib/public-market/korea-building-index-policy';
import {
  createKoreaBuildingEnrichmentLoader,
  type KoreaBuildingEnrichment,
} from '@/lib/public-market/korea-building-enrichment.server';
import { indexableMetadata } from '@/lib/public-metadata';
import { localizedSeoulHref, type ProductLocale } from '@/lib/locale/product-copy';
import {
  publicEntityProjectionReaderFromEnvironment,
  type PublicEntityProjection,
} from '@/lib/public-data/entity-location-projection.server';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

type LocalizedBuildingPageProps = BuildingPageProps & Readonly<{ locale?: ProductLocale }>;

type DetailQuery = Readonly<Record<string, string | readonly string[] | undefined>>;

function transactionBuildingFacts(model: KoreaExplorerBuildingDetailModel, coordinate?: Readonly<{ latitude: number; longitude: number }>) {
  const floors = model.recentTransactions.flatMap(({ floor }) => floor === null ? [] : [floor]);
  const years = [...new Set(model.recentTransactions.flatMap(({ buildYear }) => buildYear === null ? [] : [buildYear]))].sort();
  const areas = model.recentTransactions.map(({ areaSqm }) => areaSqm);
  const range = (values: readonly number[], suffix = '') => values.length === 0
    ? 'Not reported'
    : `${Math.min(...values).toLocaleString('en-US')}${values.length === 1 ? '' : `–${Math.max(...values).toLocaleString('en-US')}`}${suffix}`;
  return Object.freeze([
    Object.freeze({ label: 'Property type', value: model.building.housingType }),
    Object.freeze({ label: 'Observed build year', value: years.length === 0 ? 'Not reported' : years.join(', ') }),
    Object.freeze({ label: 'Observed floors', value: range(floors) }),
    Object.freeze({ label: 'Observed filed area', value: range(areas, '㎡') }),
    Object.freeze({ label: 'Evidence period', value: model.period }),
    Object.freeze({ label: 'Verified rows in view', value: model.recentTransactions.length.toLocaleString('en-US') }),
    Object.freeze({ label: 'Map identity', value: coordinate === undefined ? 'Coordinate verification pending' : `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}` }),
  ]);
}

function scalarQuery(query: DetailQuery, key: 'q' | 'buildingPage'): string | undefined {
  const value = query[key];
  return typeof value === 'string' ? value : undefined;
}

/** Creates a locale-aware Explore return URL from validated generic and Korea-only state. */
export function createKoreaDetailBackHref(
  query: DetailQuery,
  selection: ExplorerSelection,
  proximityRepository: KoreaProximityRepositoryState,
  locale: ProductLocale = 'en',
): string {
  const href = localizedSeoulHref(createSelectionHref(
    '/kr/seoul/explore/',
    selection,
    { market: 'kr', transaction: 'sale' },
  ), locale);
  const target = new URL(href, 'https://signedprice.invalid');
  const searchQuery = scalarQuery(query, 'q')?.trim();
  if (searchQuery !== undefined && searchQuery.length > 0) target.searchParams.set('q', searchQuery);
  const page = Number(scalarQuery(query, 'buildingPage'));
  if (Number.isSafeInteger(page) && page > 1) target.searchParams.set('buildingPage', String(page));
  return appendKoreaProximityPairs(
    `${target.pathname}${target.search}`,
    normalizeKoreaExploreProximitySelection(query, proximityRepository),
  );
}

function projectedBuildingMediaFor(
  name: string,
  projection: PublicEntityProjection | null | undefined,
  photoApproval: StoredPublicPhotoApproval | null | undefined,
  registryKey?: string,
) {
  const selected = projection?.media.find(({ displayUrl, providerReference, exactSubject }) =>
    exactSubject && (displayUrl !== null || providerReference !== null));
  const approvedFallback = selected === undefined && photoApproval !== null && photoApproval !== undefined
    ? {
        displayUrl: photoApproval.assetUrl,
        providerReference: photoApproval.placeId,
        width: null,
        height: null,
        focalX: null,
        focalY: null,
        attributionName: photoApproval.attributionName,
        attributionUrl: photoApproval.attributionUrl,
      }
    : null;
  const media = selected ?? approvedFallback;
  return <ProjectedEntityMedia
    buildingName={name}
    browserKey={googleMapsBrowserKeyFromEnvironment()}
    media={media}
    registryKey={registryKey}
  />;
}

export const dynamic = 'force-static';
export const revalidate = 3_600;
export const dynamicParams = true;

const evidenceAreas = Object.freeze([
  'all', 'under-40', '40-60', '60-85', '85-plus',
] as const);

export function resolveKoreaEvidenceBuildingRoute(
  district: string,
  buildingId: string,
  query: Readonly<Record<string, string | readonly string[] | undefined>>,
  repositories: KoreaEvidenceRepositories,
  proximityRepository: KoreaProximityRepositoryState = Object.freeze({ state: 'missing' }),
  locale: ProductLocale = 'en',
) {
  const selection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'sale' },
    {
      areas: evidenceAreas,
      propertyTypes: KOREA_EXPLORER_HOUSING_TYPES,
    },
  );
  const model = buildKoreaExplorerBuildingDetailModel(
    repositories,
    district,
    buildingId,
    {
      transaction: selection.transaction,
      areaBand: selection.area ?? 'all',
      housingType: selection.propertyType ?? 'all',
      contractGroup: selection.contractType ?? 'all',
    },
  );
  if (model === null) return null;
  const backHref = createKoreaDetailBackHref(
    query,
    {
      ...selection,
      propertyType: model.building.housingType,
      district: model.district.slug,
      neighborhood: model.building.neighborhoodId,
      buildingId: model.building.buildingId,
    },
    proximityRepository,
    locale,
  );
  return Object.freeze({ model, backHref });
}

export function listPrerenderedKoreaBuildingParams() {
  const legacy = publicBuildingRepositoryFromEnvironment()?.listRouteParams() ?? [];
  const evidence = koreaEvidenceRepositoriesFromEnvironment();
  const indexable = listPrerenderedKoreaBuildingRouteParams({
    rent: evidence.rent?.listBuildingRecords() ?? [],
    sale: evidence.sale?.listBuildingRecords() ?? [],
  });
  const seen = new Set<string>();
  const buildings = [...indexable, ...legacy].filter(({ district, buildingId }) => {
    const key = `${district}/${buildingId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return Object.freeze(buildings);
}

export function generateStaticParams() {
  const buildings = listPrerenderedKoreaBuildingParams();
  const propertyTypes = listPublicPropertyTypeRouteParams().map(({ district, propertyType }) => ({
    district,
    buildingId: propertyType,
  }));
  return [...buildings, ...propertyTypes];
}

function koreaBuildingEvidenceRecordsFor(
  district: string,
  buildingId: string,
  repositories: KoreaEvidenceRepositories,
): KoreaBuildingEvidenceRecordPair {
  const districtIdentity = getSeoulDistrictBySlug(district);
  if (districtIdentity === null) return Object.freeze({});
  let rent;
  let sale;
  try {
    rent = repositories.rent?.getBuilding(districtIdentity.slug, buildingId);
  } catch {
    rent = undefined;
  }
  try {
    sale = repositories.sale?.getBuilding(districtIdentity.slug, buildingId);
  } catch {
    sale = undefined;
  }
  return Object.freeze({ rent, sale });
}

function canonicalKoreaBuildingQuery(
  district: string,
  buildingId: string,
  repositories: KoreaEvidenceRepositories,
): DetailQuery {
  const records = koreaBuildingEvidenceRecordsFor(district, buildingId, repositories);
  return records.rent === undefined && records.sale === undefined
    ? Object.freeze({})
    : koreaBuildingCanonicalSelection(records) ?? Object.freeze({});
}

export function koreaBuildingRouteKind(
  district: string,
  buildingId: string,
  repositories: KoreaEvidenceRepositories = koreaEvidenceRepositoriesFromEnvironment(),
): 'property-type' | 'building' | 'not-found' {
  if (buildPublicPropertyTypeModel(district, buildingId) !== null) return 'property-type';
  const evidence = koreaBuildingEvidenceRecordsFor(district, buildingId, repositories);
  if (evidence.rent !== undefined || evidence.sale !== undefined) return 'building';
  if (buildPublicBuildingModel(district, buildingId) !== null) return 'building';
  return buildObservedBuildingIdentityModel(district, buildingId) === null
    ? 'not-found'
    : 'building';
}

function indexableKoreaBuildingMetadata(
  district: string,
  buildingId: string,
  repositories: KoreaEvidenceRepositories,
  locale: ProductLocale,
): Metadata | null {
  if (locale !== 'en') return null;
  const records = koreaBuildingEvidenceRecordsFor(district, buildingId, repositories);
  const identity = records.rent ?? records.sale;
  if (identity === undefined || !isKoreaBuildingIndexable(records)) return null;
  const selection = koreaBuildingCanonicalSelection(records);
  if (selection === null) return null;
  const canonical = resolveKoreaEvidenceBuildingRoute(
    district,
    buildingId,
    selection,
    repositories,
  );
  if (canonical === null) return null;
  const contracts = koreaBuildingEvidenceDepth(records);
  const evidenceLabel = selection.transaction === 'sale' ? 'sale prices' : 'rent evidence';
  return indexableMetadata({
    path: `/kr/seoul/explore/${canonical.model.district.slug}/${canonical.model.building.buildingId}/`,
    title: `${identity.officialName} reported ${evidenceLabel} | signedprice`,
    description: `${contracts} reported contracts for ${identity.officialName} in ${canonical.model.district.nameEn}, ${canonical.model.period}, shown by transaction, filed area and contract type with MOLIT source and coverage limits.`,
  });
}

export async function generateMetadata({
  params,
  locale = 'en',
}: LocalizedBuildingPageProps): Promise<Metadata> {
  const { district, buildingId } = await params;
  const propertyTypeModel = buildPublicPropertyTypeModel(district, buildingId);
  if (propertyTypeModel !== null) {
    const buildingCount = propertyTypeModel.coverage.contributingBuildings;
    return indexableMetadata({
      path: `/kr/seoul/explore/${propertyTypeModel.district.slug}/${propertyTypeModel.propertyType.slug}/`,
      title: `${propertyTypeModel.district.nameEn} ${propertyTypeModel.propertyType.slug} jeonse evidence | signedprice`,
      description: `${propertyTypeModel.coverage.retainedContracts} retained recent contracts across ${buildingCount} published ${propertyTypeModel.district.nameEn} ${propertyTypeModel.propertyType.slug} building${buildingCount === 1 ? '' : 's'}, with MOLIT source and coverage limits shown.`,
    });
  }
  const repositories = koreaEvidenceRepositoriesFromEnvironment();
  const indexable = indexableKoreaBuildingMetadata(
    district,
    buildingId,
    repositories,
    locale,
  );
  if (indexable !== null) return indexable;
  const exact = resolveKoreaEvidenceBuildingRoute(
    district,
    buildingId,
    canonicalKoreaBuildingQuery(district, buildingId, repositories),
    repositories,
  );
  if (exact !== null) {
    return {
      title: `${exact.model.building.officialName} ${exact.model.selection.transaction} evidence | signedprice`,
      description: `${exact.model.evidence.sampleLabel} for ${exact.model.building.officialName} in ${exact.model.period}, selected by transaction and filed area.`,
      robots: { index: false, follow: true },
    };
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) {
    const observed = buildObservedBuildingIdentityModel(district, buildingId);
    if (observed === null) notFound();
    return {
      title: `${observed.building.officialName} observed building | signedprice`,
      description: `${observed.observations.total} observed reported contract${observed.observations.total === 1 ? '' : 's'} for ${observed.building.officialName}; building-level price evidence is not published.`,
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `${model.building.name} reported contract evidence | signedprice`,
    description: `${model.display.sampleLabel} for ${model.building.name} in ${model.evidence.period}.`,
    robots: { index: false, follow: true },
  };
}

export type KoreaBuildingRouteCompositionDependencies = Readonly<{
  evidenceRepositories?: KoreaEvidenceRepositories;
  proximityRepository?: KoreaProximityRepositoryState;
  buildObservedIdentityModel?: typeof buildObservedBuildingIdentityModel;
  entityProjection?: PublicEntityProjection | null;
  photoApproval?: StoredPublicPhotoApproval | null;
  photoApprovalReadFailed?: boolean;
  hydrateEvidence?: boolean;
}>;

/**
 * Composes one Detail branch after the App Router has resolved its promises.
 * The narrow dependencies keep the production route unchanged while allowing
 * branch-level server composition tests to provide verified repository states.
 */
export function composeKoreaBuildingRoute(input: Readonly<{
  district: string;
  buildingId: string;
  query: DetailQuery;
  locale?: ProductLocale;
  dependencies?: KoreaBuildingRouteCompositionDependencies;
}>) {
  const { district, buildingId, query, locale = 'en' } = input;
  const proximityRepository = input.dependencies?.proximityRepository
    ?? koreaProximityRepositoryFromEnvironment();
  const evidenceRepositories = input.dependencies?.evidenceRepositories
    ?? koreaEvidenceRepositoriesFromEnvironment();
  const observedIdentityModel = input.dependencies?.buildObservedIdentityModel
    ?? buildObservedBuildingIdentityModel;
  const entityProjection = input.dependencies?.entityProjection;
  const photoApproval = input.dependencies?.photoApproval;
  const photoRegistryKey = input.dependencies?.photoApprovalReadFailed === true
    ? `kr-seoul:${buildingId}`
    : undefined;
  const propertyTypeModel = buildPublicPropertyTypeModel(district, buildingId);
  if (propertyTypeModel !== null) {
    const siblings = listPublicPropertyTypeRouteParams()
      .filter((route) => (
        route.district === propertyTypeModel.district.slug
        && route.propertyType !== propertyTypeModel.propertyType.slug
      ))
      .flatMap((route) => {
        const sibling = buildPublicPropertyTypeModel(route.district, route.propertyType);
        return sibling === null ? [] : [sibling.propertyType];
    });
    return <PropertyTypeDetailPage model={propertyTypeModel} siblings={siblings} />;
  }
  const exact = resolveKoreaEvidenceBuildingRoute(
    district,
    buildingId,
    query,
    evidenceRepositories,
    proximityRepository,
    locale,
  );
  if (exact !== null) {
    const identity = observedIdentityModel(district, buildingId, { proximityRepository });
    const coordinate = entityProjection?.location
      ?? (identity?.coordinate.status === 'ready' ? identity.coordinate : undefined);
    const visual = projectedBuildingMediaFor(
      exact.model.building.officialName,
      entityProjection,
      photoApproval,
      photoRegistryKey,
    );
    const proximity = entityProjection?.proximity ?? identity?.proximity;
    const fallback = <KoreaEvidenceBuildingDetail
      model={exact.model}
      backHref={exact.backHref}
      locale={locale}
      visual={visual}
      facts={<BuildingOfficialFacts districtSlug={exact.model.district.slug} buildingId={exact.model.building.buildingId} observedFacts={transactionBuildingFacts(exact.model, coordinate)} proximity={proximity} locale={locale} />}
    />;
    if (input.dependencies?.hydrateEvidence !== true) return fallback;
    return <Suspense fallback={fallback}>
      <KoreaBuildingEvidenceClient
        initialModel={exact.model}
        initialBackHref={exact.backHref}
        coordinate={coordinate}
        proximity={proximity}
        visual={visual}
        locale={locale}
      />
    </Suspense>;
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) {
    const observed = observedIdentityModel(district, buildingId, { proximityRepository });
    if (observed === null) notFound();
    const selection = parseExplorerSelection(
      query,
      { market: 'kr', transaction: 'sale' },
      {
        areas: evidenceAreas,
        propertyTypes: KOREA_EXPLORER_HOUSING_TYPES,
        districts: [observed.district.slug],
        neighborhoodsByDistrict: {
          [observed.district.slug]: [observed.building.neighborhoodId],
        },
        buildingIdsByNeighborhood: {
          [observed.building.neighborhoodId]: [observed.building.buildingId],
        },
      },
    );
    const backHref = createKoreaDetailBackHref(
      query,
      { ...selection, district: observed.district.slug },
      proximityRepository,
      locale,
    );
    const visual = projectedBuildingMediaFor(
      observed.building.officialName,
      entityProjection,
      photoApproval,
      photoRegistryKey,
    );
    const facts = <BuildingOfficialFacts
      districtSlug={observed.district.slug}
      buildingId={observed.building.buildingId}
      observedFacts={[
        { label: 'Official identity', value: observed.building.officialName },
        { label: 'Area', value: `${observed.building.neighborhoodName} · ${observed.district.nameEn}` },
        { label: 'Housing type', value: observed.building.housingType },
        { label: 'Evidence period', value: `${observed.observations.firstMonth}–${observed.observations.lastMonth}` },
        { label: 'Map identity', value: observed.coordinate.status === 'ready' ? `${observed.coordinate.latitude.toFixed(5)}, ${observed.coordinate.longitude.toFixed(5)}` : 'Coordinate verification pending' },
      ]}
      proximity={entityProjection?.proximity ?? observed.proximity}
      locale={locale}
    />;
    const fallback = <ObservedBuildingDetail
      model={observed}
      backHref={backHref}
      visual={visual}
      facts={facts}
      locale={locale}
    />;
    if (input.dependencies?.hydrateEvidence !== true) return fallback;
    return <Suspense fallback={fallback}>
      <KoreaObservedBuildingClient
        model={observed}
        initialBackHref={backHref}
        visual={visual}
        facts={facts}
        locale={locale}
      />
    </Suspense>;
  }
  const selection = parseBuildingDecisionSelection(
    query as Readonly<Record<string, string | string[] | undefined>>,
  );
  const observed = observedIdentityModel(district, buildingId, { proximityRepository });
  const decision = buildBuildingDecisionModel(model, selection);
  const explorerSelection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'sale' },
    {
      areas: evidenceAreas,
      propertyTypes: KOREA_EXPLORER_HOUSING_TYPES,
      districts: [model.district.slug],
      neighborhoodsByDistrict: {
        [model.district.slug]: [model.building.neighborhoodId],
      },
      buildingIdsByNeighborhood: {
        [model.building.neighborhoodId]: [model.building.buildingId],
      },
    },
  );
  const backHref = createKoreaDetailBackHref(
    query,
    { ...explorerSelection, district: model.district.slug },
    proximityRepository,
    locale,
  );
  const base = `/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/`;
  const visual = buildBuildingVisualModel({
    buildingName: model.building.name,
    mapHref: backHref,
    photo: null,
  });
  const propertyMedia = projectedBuildingMediaFor(model.building.name, entityProjection, photoApproval, photoRegistryKey);
  const publicCoordinate = entityProjection?.location ?? (
    model.building.latitude === null || model.building.longitude === null
      ? null
      : Object.freeze({ latitude: model.building.latitude, longitude: model.building.longitude })
  );
  const recentAreas = model.building.recentContracts.map(({ areaSqm }) => areaSqm);
  const observedFacts = [
    { label: 'Property type', value: model.building.housingType },
    ...(recentAreas.length === 0 ? [] : [{
      label: 'Observed filed area',
      value: `${Math.min(...recentAreas).toLocaleString('en-US')}–${Math.max(...recentAreas).toLocaleString('en-US')}㎡`,
    }]),
    { label: 'Evidence period', value: model.evidence.period },
    {
      label: 'Map identity',
      value: publicCoordinate === null
        ? 'Coordinate verification pending'
        : `${publicCoordinate.latitude.toFixed(5)}, ${publicCoordinate.longitude.toFixed(5)}`,
    },
  ];
  const facts = <BuildingOfficialFacts districtSlug={model.district.slug} buildingId={model.building.buildingId} observedFacts={observedFacts} proximity={entityProjection?.proximity ?? observed?.proximity} locale={locale} />;
  const fallback = <BuildingDetailPage
      model={model}
      decision={decision}
      visual={visual}
      propertyMedia={propertyMedia}
      facts={facts}
      base={base}
      backHref={backHref}
  />;
  if (input.dependencies?.hydrateEvidence !== true) return fallback;
  return <Suspense fallback={fallback}>
    <KoreaBuildingDecisionClient
      model={model}
      visual={visual}
      propertyMedia={propertyMedia}
      facts={facts}
      base={base}
      initialBackHref={backHref}
      locale={locale}
    />
  </Suspense>;
}

const loadKoreaBuildingEnrichment = createKoreaBuildingEnrichmentLoader({
  phase: () => process.env.NEXT_PHASE,
  listPrerenderedBuildingIds: () => listPrerenderedKoreaBuildingParams()
    .map(({ buildingId }) => buildingId),
  projectionReader: publicEntityProjectionReaderFromEnvironment,
  listPhotoApprovals: listStoredPublicPhotoApprovals,
});

export async function renderKoreaBuildingRoute(
  input: Readonly<{
    district: string;
    buildingId: string;
    locale?: ProductLocale;
  }>,
  dependencies: Readonly<{
    evidenceRepositories?: KoreaEvidenceRepositories;
    loadEnrichment?: (buildingId: string) => Promise<KoreaBuildingEnrichment>;
  }> = Object.freeze({}),
) {
  const { district, buildingId, locale = 'en' } = input;
  const evidenceRepositories = dependencies.evidenceRepositories
    ?? koreaEvidenceRepositoriesFromEnvironment();
  const routeKind = koreaBuildingRouteKind(district, buildingId, evidenceRepositories);
  if (routeKind === 'not-found') notFound();
  const query = canonicalKoreaBuildingQuery(district, buildingId, evidenceRepositories);
  if (routeKind === 'property-type') {
    return composeKoreaBuildingRoute({
      district,
      buildingId,
      query,
      locale,
      dependencies: { evidenceRepositories, hydrateEvidence: true },
    });
  }
  const { entityProjection, photoApproval, photoApprovalReadFailed } = await (
    dependencies.loadEnrichment ?? loadKoreaBuildingEnrichment
  )(buildingId);
  return composeKoreaBuildingRoute({
    district,
    buildingId,
    query,
    locale,
    dependencies: {
      evidenceRepositories,
      entityProjection,
      photoApproval,
      photoApprovalReadFailed,
      hydrateEvidence: true,
    },
  });
}

export default async function BuildingRoute({ params, locale = 'en' }: LocalizedBuildingPageProps) {
  const { district, buildingId } = await params;
  return renderKoreaBuildingRoute({ district, buildingId, locale });
}
