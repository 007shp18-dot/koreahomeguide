import 'server-only';

import {
  KR_MOLIT_RENT_RIGHTS,
  SEOUL_RENT_CHECK_DISTRICTS,
  type KoreaConversionCurveProjection,
  type MolitRightsLookup,
} from '@signedprice/korea-rent';
import {
  compareContractOffers,
  completedMonthWindow,
  evaluateSingleQuoteCheck,
  SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM,
  type CheckTransaction,
  type CompletedMonthWindow,
  type ContractOfferComparison,
  type SingleQuoteCheckInput,
  type SingleQuoteCheckResult,
  type SingleQuoteComparable,
} from '@signedprice/market-core';

import { createConversionRepository } from './conversion-repository.server';
import {
  koreaEvidenceRepositoriesFromEnvironment,
  type KoreaEvidenceRepositories,
} from '../public-market/korea-evidence-repositories.server';
import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  checkedInSnapshotsAreEnabled,
  type InstalledSnapshotRepository,
} from '../snapshots/installed-snapshot-repository.server';

export type ContractCheckNavigationItem = Readonly<{
  label: 'Check' | 'Explore' | 'News' | 'Guide';
  href: string | null;
  available: boolean;
}>;

export type ContractCheckUnavailableRouteModel = Readonly<{
  status: 'unavailable';
  message: 'Verified transaction evidence is unavailable.';
  navigation: readonly ContractCheckNavigationItem[];
}>;

export type ContractCheckOfferSelection = Readonly<{
  transaction: CheckTransaction;
  salePriceWon: number | null;
  depositWon: number | null;
  monthlyRentWon: number | null;
}>;

export type ContractCheckSelection = Readonly<{
  districtSlug: string;
  buildingId: string | null;
  housingType: 'apartment' | 'officetel' | 'villa_multifamily' | 'detached';
  areaSqm: number | null;
  offers: Readonly<Record<'a' | 'b', ContractCheckOfferSelection>>;
}>;

export type ContractCheckReadyRouteModel = Readonly<{
  status: 'ready';
  curves: readonly KoreaConversionCurveProjection[];
  availability: Readonly<{
    sale: boolean;
    jeonse: boolean;
    monthly: boolean;
    conversion: boolean;
  }>;
  districts: readonly Readonly<{ slug: string; nameEn: string; nameKo: string }>[];
  selection: ContractCheckSelection;
  submitted: boolean;
  offerChecks: Readonly<Record<'a' | 'b', SingleQuoteCheckResult>> | null;
  comparison: ContractOfferComparison | null;
  buildingName: string | null;
  disclosure: Readonly<{
    source: string;
    basis: string;
    periods: Readonly<{
      sale: CompletedMonthWindow | null;
      rent: CompletedMonthWindow | null;
      conversion: string | null;
    }>;
    boundary: string;
  }>;
  secondaryCheckHref: '/kr/seoul/tools/rent-check/';
  navigation: readonly ContractCheckNavigationItem[];
}>;

export type ContractCheckRouteModel =
  | ContractCheckReadyRouteModel
  | ContractCheckUnavailableRouteModel;

export type ContractCheckRouteDependencies = Readonly<{
  source: unknown;
  period: string;
  sha256: string;
  referenceInstant: string;
  installedRepository?: InstalledSnapshotRepository;
  evidenceRepositories?: KoreaEvidenceRepositories;
  query?: Record<string, string | string[] | undefined>;
}>;

export type ConversionEnvironmentDiagnosticCode =
  | 'artifact_missing'
  | 'period_missing'
  | 'sha_missing'
  | 'artifact_json_invalid'
  | 'artifact_contract_invalid'
  | 'curve_missing'
  | 'ready';

const navigation = Object.freeze([
  Object.freeze({ label: 'Check', href: '/kr/seoul/check/', available: true }),
  Object.freeze({ label: 'Explore', href: '/kr/seoul/explore/', available: true }),
  Object.freeze({ label: 'News', href: '/kr/seoul/news/', available: true }),
  Object.freeze({ label: 'Guide', href: '/kr/seoul/guide/', available: true }),
] as const satisfies readonly ContractCheckNavigationItem[]);

const rightsLookup: MolitRightsLookup = (policyId) =>
  policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined;

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function installedConversionDependencies(
  dependencies: ContractCheckRouteDependencies,
): ContractCheckRouteDependencies | null {
  if (dependencies.installedRepository === undefined) return null;
  try {
    const installed = dependencies.installedRepository.get('kr-seoul', 'kr-conversion');
    if (!isObject(installed.payload) || !isObject(installed.payload.provenance)) return null;
    const { period, sha256 } = installed.payload.provenance;
    if (typeof period !== 'string' || typeof sha256 !== 'string') return null;
    return Object.freeze({
      source: installed.payload,
      period,
      sha256,
      referenceInstant: dependencies.referenceInstant,
    });
  } catch {
    return null;
  }
}

function conversionRepositoryFor(dependencies: ContractCheckRouteDependencies) {
  return createConversionRepository({
    source: dependencies.source,
    expected: {
      marketId: 'kr-seoul',
      period: dependencies.period,
      sha256: dependencies.sha256,
      rightsLookup,
    },
    referenceInstant: dependencies.referenceInstant,
  });
}

function validatedRepositoryFor(dependencies: ContractCheckRouteDependencies) {
  const repository = conversionRepositoryFor(dependencies);
  repository.getCurve('apartment');
  repository.getCurve('officetel');
  return repository;
}

function repositoryFor(dependencies: ContractCheckRouteDependencies) {
  const installed = installedConversionDependencies(dependencies);
  if (installed !== null) {
    try {
      return validatedRepositoryFor(installed);
    } catch {
      // Retry the compatibility environment source below.
    }
  }
  return validatedRepositoryFor(dependencies);
}

function curvesFor(
  dependencies: ContractCheckRouteDependencies,
): readonly KoreaConversionCurveProjection[] {
  try {
    const repository = repositoryFor(dependencies);
    return Object.freeze([
      repository.getCurve('apartment'),
      repository.getCurve('officetel'),
    ]);
  } catch {
    return Object.freeze([]);
  }
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsedMoney(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,14}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parsedArea(value: string | undefined, submitted: boolean): number | null {
  if (value === undefined) return submitted ? null : 84;
  if (!/^\d{1,4}(?:\.\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && parsed <= 2_000 ? parsed : null;
}

const TRANSACTIONS = new Set<CheckTransaction>(['sale', 'jeonse', 'monthly']);
const HOUSING_TYPES = new Set<ContractCheckSelection['housingType']>([
  'apartment', 'officetel', 'villa_multifamily', 'detached',
]);

function offerSelection(
  id: 'a' | 'b',
  query: Record<string, string | string[] | undefined>,
  fallback: CheckTransaction,
): ContractCheckOfferSelection {
  const requested = one(query[`${id}-transaction`]);
  const transaction = TRANSACTIONS.has(requested as CheckTransaction)
    ? requested as CheckTransaction
    : fallback;
  return Object.freeze({
    transaction,
    salePriceWon: transaction === 'sale' ? parsedMoney(one(query[`${id}-price`])) : null,
    depositWon: transaction === 'sale' ? null : parsedMoney(one(query[`${id}-deposit`])),
    monthlyRentWon: transaction === 'monthly'
      ? parsedMoney(one(query[`${id}-monthly-rent`]))
      : null,
  });
}

function routeSelection(
  query: Record<string, string | string[] | undefined>,
  submitted: boolean,
  fallback: CheckTransaction,
): ContractCheckSelection {
  const requestedDistrict = one(query.district);
  const district = SEOUL_RENT_CHECK_DISTRICTS.find(({ slug }) => slug === requestedDistrict)
    ?? SEOUL_RENT_CHECK_DISTRICTS[0]!;
  const requestedHousing = one(query.housing);
  const housingType = HOUSING_TYPES.has(requestedHousing as ContractCheckSelection['housingType'])
    ? requestedHousing as ContractCheckSelection['housingType']
    : 'apartment';
  const requestedBuilding = one(query.building)?.trim();
  const buildingId = requestedBuilding !== undefined && requestedBuilding.length <= 200
    ? requestedBuilding || null
    : null;
  return Object.freeze({
    districtSlug: district.slug,
    buildingId,
    housingType,
    areaSqm: parsedArea(one(query.area), submitted),
    offers: Object.freeze({
      a: offerSelection('a', query, fallback),
      b: offerSelection('b', query, fallback),
    }),
  });
}

function comparableRecords(
  repositories: KoreaEvidenceRepositories,
  transaction: CheckTransaction,
): readonly SingleQuoteComparable[] {
  if (transaction === 'sale') {
    return Object.freeze((repositories.sale?.listBuildingRecords() ?? []).flatMap((building) => (
      building.recentSales.map((record) => Object.freeze({
        transaction: 'sale' as const,
        districtSlug: building.districtSlug,
        neighborhoodId: building.neighborhoodId,
        buildingId: building.buildingId,
        housingType: building.housingType,
        areaSqm: record.areaSqm,
        filedMonth: record.filedMonth,
        salePriceWon: record.priceWon,
        depositWon: null,
        monthlyRentWon: null,
      }))
    )));
  }
  return Object.freeze((repositories.rent?.listBuildingRecords() ?? []).flatMap((building) => (
    building.recentTransactions
      .filter((record) => record.transaction === transaction)
      .map((record) => Object.freeze({
        transaction,
        districtSlug: building.districtSlug,
        neighborhoodId: building.neighborhoodId,
        buildingId: building.buildingId,
        housingType: building.housingType,
        areaSqm: record.areaSqm,
        filedMonth: record.filedMonth,
        salePriceWon: null,
        depositWon: record.depositWon,
        monthlyRentWon: transaction === 'monthly' ? record.monthlyRentWon : null,
      }))
  )));
}

function usableEvidence(
  repositories: KoreaEvidenceRepositories,
  curves: readonly KoreaConversionCurveProjection[],
): Readonly<{
  sale: boolean;
  jeonse: boolean;
  monthlyHousingTypes: ReadonlySet<string>;
}> {
  try {
    const saleWindow = repositories.sale === null
      ? null
      : completedMonthWindow(repositories.sale.getArtifact().period);
    const rentWindow = repositories.rent === null
      ? null
      : completedMonthWindow(repositories.rent.getArtifact().period);
    const saleCount = repositories.sale?.listBuildingRecords().reduce(
      (count, building) => count + building.recentSales.filter((record) => (
        saleWindow !== null
        && record.filedMonth >= saleWindow.startMonth
        && record.filedMonth <= saleWindow.endMonth
      )).length,
      0,
    ) ?? 0;
    let jeonseCount = 0;
    const monthlyCounts = new Map<string, number>();
    for (const building of repositories.rent?.listBuildingRecords() ?? []) {
      for (const record of building.recentTransactions) {
        if (
          rentWindow === null
          || record.filedMonth < rentWindow.startMonth
          || record.filedMonth > rentWindow.endMonth
        ) continue;
        if (record.transaction === 'jeonse') jeonseCount += 1;
        if (record.transaction === 'monthly') {
          monthlyCounts.set(
            building.housingType,
            (monthlyCounts.get(building.housingType) ?? 0) + 1,
          );
        }
      }
    }
    const curveHousingTypes: ReadonlySet<string> = new Set(
      curves.map(({ housingType }) => housingType),
    );
    const monthlyHousingTypes = new Set(
      [...monthlyCounts].flatMap(([housingType, count]) => (
        count >= SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM && curveHousingTypes.has(housingType)
          ? [housingType]
          : []
      )),
    );
    return Object.freeze({
      sale: saleCount >= SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM,
      jeonse: jeonseCount >= SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM,
      monthlyHousingTypes,
    });
  } catch {
    return Object.freeze({
      sale: false,
      jeonse: false,
      monthlyHousingTypes: new Set<string>(),
    });
  }
}

function checkInputFor(
  selection: ContractCheckSelection,
  id: 'a' | 'b',
  neighborhoodId: string | null,
): SingleQuoteCheckInput {
  return Object.freeze({
    ...selection.offers[id],
    districtSlug: selection.districtSlug,
    buildingId: selection.buildingId,
    neighborhoodId,
    housingType: selection.housingType,
    areaSqm: selection.areaSqm,
  });
}

function unavailableEvidence(period: string): SingleQuoteCheckResult {
  return Object.freeze({
    status: 'unavailable',
    reason: 'evidence-unavailable',
    message: 'Verified transaction evidence is unavailable.',
    period,
  });
}

function checkOffer(
  repositories: KoreaEvidenceRepositories,
  curves: readonly KoreaConversionCurveProjection[],
  selection: ContractCheckSelection,
  id: 'a' | 'b',
  neighborhoodId: string | null,
): SingleQuoteCheckResult {
  const offer = selection.offers[id];
  const repository = offer.transaction === 'sale' ? repositories.sale : repositories.rent;
  if (repository === null) return unavailableEvidence('Unavailable');
  const curve = curves.find(({ housingType }) => housingType === selection.housingType);
  return evaluateSingleQuoteCheck({
    input: checkInputFor(selection, id, neighborhoodId),
    records: comparableRecords(repositories, offer.transaction),
    period: repository.getArtifact().period,
    ...(curve === undefined ? {} : { conversionCurve: curve }),
  });
}

function selectedBuildingIdentity(
  repositories: KoreaEvidenceRepositories,
  selection: ContractCheckSelection,
): Readonly<{ officialName: string; neighborhoodId: string }> | null {
  if (selection.buildingId === null) return null;
  for (const repository of [repositories.sale, repositories.rent]) {
    try {
      const building = repository?.getBuilding(
        selection.districtSlug as Parameters<NonNullable<typeof repository>['getBuilding']>[0],
        selection.buildingId,
      );
      if (building !== undefined) {
        return Object.freeze({
          officialName: building.officialName,
          neighborhoodId: building.neighborhoodId,
        });
      }
    } catch {
      // Try the independently installed repository.
    }
  }
  return null;
}

export function diagnoseConversionEnvironment(input: Readonly<{
  serialized: string | undefined;
  period: string | undefined;
  sha256: string | undefined;
  referenceInstant: string;
}>): Readonly<{ code: ConversionEnvironmentDiagnosticCode }> {
  if (input.serialized === undefined) return Object.freeze({ code: 'artifact_missing' });
  if (input.period === undefined || input.period === '') {
    return Object.freeze({ code: 'period_missing' });
  }
  if (input.sha256 === undefined || input.sha256 === '') {
    return Object.freeze({ code: 'sha_missing' });
  }
  let source: unknown;
  try {
    source = JSON.parse(input.serialized);
  } catch {
    return Object.freeze({ code: 'artifact_json_invalid' });
  }
  try {
    const repository = conversionRepositoryFor({
      source,
      period: input.period,
      sha256: input.sha256,
      referenceInstant: input.referenceInstant,
    });
    try {
      repository.getCurve('apartment');
      repository.getCurve('officetel');
    } catch {
      return Object.freeze({ code: 'curve_missing' });
    }
    return Object.freeze({ code: 'ready' });
  } catch {
    return Object.freeze({ code: 'artifact_contract_invalid' });
  }
}

function environmentDependencies(): ContractCheckRouteDependencies {
  const serialized = process.env.SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT;
  const period = process.env.SIGNEDPRICE_CONVERSION_CURVE_PERIOD;
  const sha256 = process.env.SIGNEDPRICE_CONVERSION_CURVE_SHA256;
  const referenceInstant = new Date().toISOString();
  const diagnostic = diagnoseConversionEnvironment({
    serialized,
    period,
    sha256,
    referenceInstant,
  });
  if (process.env.VERCEL_ENV === 'preview' && diagnostic.code !== 'ready') {
    console.warn(`[signedprice:conversion-curve] ${diagnostic.code}`);
  }
  let source: unknown;
  try {
    source = serialized === undefined ? undefined : JSON.parse(serialized);
  } catch {
    source = undefined;
  }
  return Object.freeze({
    source,
    period: period ?? '',
    sha256: sha256 ?? '',
    referenceInstant,
    installedRepository: checkedInSnapshotsAreEnabled()
      ? createInstalledSnapshotRepository({
          registrySource: resolveInstalledSnapshotRegistry(),
          resolveObject: resolveInstalledSnapshotObject,
        })
      : undefined,
    evidenceRepositories: koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: checkedInSnapshotsAreEnabled(),
      retainLastVerified: false,
    }),
  });
}

export function contractCheckCurvesFromEnvironment(): readonly KoreaConversionCurveProjection[] {
  return curvesFor(environmentDependencies());
}

export function buildContractCheckRouteModel(
  dependencies: ContractCheckRouteDependencies = environmentDependencies(),
  queryOverride?: Record<string, string | string[] | undefined>,
): ContractCheckRouteModel {
  const curves = curvesFor(dependencies);
  const repositories = dependencies.evidenceRepositories
    ?? Object.freeze({ rent: null, sale: null });
  const usable = usableEvidence(repositories, curves);
  if (usable.sale || usable.jeonse || usable.monthlyHousingTypes.size > 0) {
    const query: Record<string, string | string[] | undefined> = queryOverride
      ?? dependencies.query
      ?? {};
    const submitted = one(query.compare) === '1';
    const defaultTransaction: CheckTransaction = usable.sale
      ? 'sale'
      : usable.jeonse ? 'jeonse' : 'monthly';
    const selection = routeSelection(query, submitted, defaultTransaction);
    const buildingIdentity = selectedBuildingIdentity(repositories, selection);
    const offerChecks = submitted ? Object.freeze({
      a: checkOffer(repositories, curves, selection, 'a', buildingIdentity?.neighborhoodId ?? null),
      b: checkOffer(repositories, curves, selection, 'b', buildingIdentity?.neighborhoodId ?? null),
    }) : null;
    const selectedCurve = curves.find(({ housingType }) => housingType === selection.housingType);
    const comparison = offerChecks === null ? null : compareContractOffers({
      offers: [
        { id: 'a', check: offerChecks.a },
        { id: 'b', check: offerChecks.b },
      ],
      ...(selectedCurve === undefined ? {} : { conversionCurve: selectedCurve }),
    });
    const selectedTransactions = new Set([
      selection.offers.a.transaction,
      selection.offers.b.transaction,
    ]);
    const usesSale = selectedTransactions.has('sale');
    const usesRent = selectedTransactions.has('jeonse') || selectedTransactions.has('monthly');
    const source = usesSale && usesRent
      ? 'MOLIT reported sale and rental contracts'
      : usesSale ? 'MOLIT reported sale contracts' : 'MOLIT reported rental contracts';
    return Object.freeze({
      status: 'ready',
      curves,
      availability: Object.freeze({
        sale: usable.sale,
        jeonse: usable.jeonse,
        monthly: usable.monthlyHousingTypes.has(selection.housingType),
        conversion: selectedCurve !== undefined,
      }),
      districts: Object.freeze(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug, nameEn, nameKo }) => (
        Object.freeze({ slug, nameEn, nameKo })
      ))),
      selection,
      submitted,
      offerChecks,
      comparison,
      buildingName: buildingIdentity?.officialName ?? null,
      disclosure: Object.freeze({
        source,
        basis: 'Transaction-specific contracts matched by building, neighborhood, or district and filed area',
        periods: Object.freeze({
          sale: repositories.sale === null
            ? null
            : completedMonthWindow(repositories.sale.getArtifact().period),
          rent: repositories.rent === null
            ? null
            : completedMonthWindow(repositories.rent.getArtifact().period),
          conversion: selectedCurve?.period ?? null,
        }),
        boundary:
          'Between verified anchors rates are interpolated. Deposits outside the observed range are not compared.',
      }),
      secondaryCheckHref: '/kr/seoul/tools/rent-check/',
      navigation,
    });
  }
  return Object.freeze({
    status: 'unavailable',
    message: 'Verified transaction evidence is unavailable.',
    navigation,
  });
}
