import 'server-only';

import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type KoreaConversionCurveProjection,
} from '@signedprice/korea-rent';
import {
  evaluateSingleQuoteCheck,
  type CheckTransaction,
  type SingleQuoteCheckInput,
  type SingleQuoteCheckResult,
  type SingleQuoteComparable,
} from '@signedprice/market-core';

import type { KoreaEvidenceRepositories } from '../public-market/korea-evidence-repositories.server';

const TRANSACTIONS = new Set<CheckTransaction>(['sale', 'jeonse', 'monthly']);
const HOUSING_TYPES = new Set<SingleQuoteCheckInput['housingType']>([
  'apartment', 'officetel', 'villa_multifamily', 'detached',
]);

export type SingleQuoteCheckRouteModel = Readonly<{
  availability: Readonly<{ sale: boolean; jeonse: boolean; monthly: boolean }>;
  districts: readonly Readonly<{ slug: string; nameEn: string; nameKo: string }>[];
  selection: SingleQuoteCheckInput;
  submitted: boolean;
  result: SingleQuoteCheckResult | null;
  buildingName: string | null;
}>;

function selectedBuildingIdentity(
  repositories: KoreaEvidenceRepositories,
  districtSlug: string,
  buildingId: string | null,
): Readonly<{ officialName: string; neighborhoodId: string }> | null {
  if (buildingId === null) return null;
  for (const repository of [repositories.sale, repositories.rent]) {
    try {
      const building = repository?.getBuilding(
        districtSlug as Parameters<NonNullable<typeof repository>['getBuilding']>[0],
        buildingId,
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

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function strictMoney(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,14}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function strictArea(value: string | undefined, submitted: boolean): number | null {
  if (value === undefined) return submitted ? null : 84;
  if (!/^\d{1,4}(?:\.\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && parsed <= 2_000 ? parsed : null;
}

function recordsFromRepositories(
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

function unavailableEvidence(period: string): SingleQuoteCheckResult {
  return Object.freeze({
    status: 'unavailable',
    reason: 'evidence-unavailable',
    message: 'Verified transaction evidence is unavailable.',
    period,
  });
}

export function buildSingleQuoteCheckRouteModel(
  repositories: KoreaEvidenceRepositories,
  query: Record<string, string | string[] | undefined>,
  curves: readonly KoreaConversionCurveProjection[] = Object.freeze([]),
): SingleQuoteCheckRouteModel {
  const submitted = one(query.check) === '1';
  const requestedTransaction = one(query.transaction);
  const defaultTransaction: CheckTransaction = repositories.sale !== null ? 'sale' : 'jeonse';
  const transaction = TRANSACTIONS.has(requestedTransaction as CheckTransaction)
    ? requestedTransaction as CheckTransaction
    : defaultTransaction;
  const requestedHousing = one(query.housing);
  const housingType = HOUSING_TYPES.has(requestedHousing as SingleQuoteCheckInput['housingType'])
    ? requestedHousing as SingleQuoteCheckInput['housingType']
    : 'apartment';
  const requestedDistrict = one(query.district);
  const district = SEOUL_RENT_CHECK_DISTRICTS.find(({ slug }) => slug === requestedDistrict)
    ?? SEOUL_RENT_CHECK_DISTRICTS[0]!;
  const requestedBuilding = one(query.building)?.trim();
  const buildingId = requestedBuilding !== undefined && requestedBuilding.length <= 200
    ? requestedBuilding || null
    : null;
  const buildingIdentity = selectedBuildingIdentity(repositories, district.slug, buildingId);
  const selection: SingleQuoteCheckInput = Object.freeze({
    transaction,
    districtSlug: district.slug,
    buildingId,
    neighborhoodId: buildingIdentity?.neighborhoodId ?? null,
    housingType,
    areaSqm: strictArea(one(query.area), submitted),
    salePriceWon: transaction === 'sale' ? strictMoney(one(query.price)) : null,
    depositWon: transaction === 'jeonse' || transaction === 'monthly'
      ? strictMoney(one(query.deposit))
      : null,
    monthlyRentWon: transaction === 'monthly'
      ? strictMoney(one(query['monthly-rent']))
      : null,
  });
  const repository = transaction === 'sale' ? repositories.sale : repositories.rent;
  const curve = curves.find((candidate) => candidate.housingType === housingType);
  let result: SingleQuoteCheckResult | null = null;
  const buildingName = buildingIdentity?.officialName ?? null;
  if (submitted) {
    result = repository === null
      ? unavailableEvidence('Unavailable')
      : evaluateSingleQuoteCheck({
          input: selection,
          records: recordsFromRepositories(repositories, transaction),
          period: repository.getArtifact().period,
          ...(curve === undefined ? {} : { conversionCurve: curve }),
        });
  }
  return Object.freeze({
    availability: Object.freeze({
      sale: repositories.sale !== null,
      jeonse: repositories.rent !== null,
      monthly: repositories.rent !== null && curve !== undefined,
    }),
    districts: Object.freeze(SEOUL_RENT_CHECK_DISTRICTS.map(({ slug, nameEn, nameKo }) => (
      Object.freeze({ slug, nameEn, nameKo })
    ))),
    selection,
    submitted,
    result,
    buildingName,
  });
}
