import 'server-only';

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';

import type { KoreaEvidenceRepositories } from '../public-market/korea-evidence-repositories.server';
import {
  evaluateSingleQuote,
  type SingleQuoteComparable,
  type SingleQuoteHousingType,
  type SingleQuoteInput,
  type SingleQuoteResult,
  type SingleQuoteTransaction,
} from './calculation';

const TRANSACTIONS = new Set<SingleQuoteTransaction>(['sale', 'jeonse', 'monthly']);
const HOUSING_TYPES = new Set<SingleQuoteHousingType>([
  'apartment', 'officetel', 'villa_multifamily', 'detached',
]);

export type SingleQuoteCheckRouteModel = Readonly<{
  availability: Readonly<{ sale: boolean; jeonse: boolean; monthly: boolean }>;
  districts: readonly Readonly<{ slug: string; nameEn: string; nameKo: string }>[];
  selection: SingleQuoteInput;
  submitted: boolean;
  result: SingleQuoteResult | null;
  buildingName: string | null;
}>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeMoney(value: string | undefined, fallback: number): number {
  if (value === undefined || !/^\d{1,14}$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

function safeArea(value: string | undefined): number {
  if (value === undefined || !/^\d{1,4}(?:\.\d{1,2})?$/.test(value)) return 84;
  const parsed = Number(value);
  return parsed > 0 && parsed <= 2_000 ? parsed : 84;
}

function recordsFromRepositories(
  repositories: KoreaEvidenceRepositories,
  input: SingleQuoteInput,
): readonly SingleQuoteComparable[] {
  const { transaction } = input;
  if (transaction === 'sale') {
    return Object.freeze((repositories.sale?.listBuildingRecords() ?? [])
      .filter((building) => building.districtSlug === input.districtSlug
        && building.housingType === input.housingType)
      .flatMap((building) => (
      building.recentSales.map((record) => Object.freeze({
        transaction: 'sale' as const,
        districtSlug: building.districtSlug,
        neighborhoodId: building.neighborhoodId,
        buildingId: building.buildingId,
        housingType: building.housingType,
        areaSqm: record.areaSqm,
        filedMonth: record.filedMonth,
        depositWon: null,
        valueWon: record.priceWon,
      }))
    )));
  }
  return Object.freeze((repositories.rent?.listBuildingRecords() ?? [])
    .filter((building) => building.districtSlug === input.districtSlug
      && building.housingType === input.housingType)
    .flatMap((building) => (
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
        depositWon: record.depositWon,
        valueWon: transaction === 'monthly' ? record.monthlyRentWon : record.depositWon,
      }))
  )));
}

export function buildSingleQuoteCheckRouteModel(
  repositories: KoreaEvidenceRepositories,
  query: Record<string, string | string[] | undefined>,
): SingleQuoteCheckRouteModel {
  const requestedTransaction = one(query.transaction);
  const transaction = TRANSACTIONS.has(requestedTransaction as SingleQuoteTransaction)
    ? requestedTransaction as SingleQuoteTransaction
    : 'jeonse';
  const requestedHousing = one(query.housing);
  const housingType = HOUSING_TYPES.has(requestedHousing as SingleQuoteHousingType)
    ? requestedHousing as SingleQuoteHousingType
    : 'apartment';
  const requestedDistrict = one(query.district);
  const district = SEOUL_RENT_CHECK_DISTRICTS.find(({ slug }) => slug === requestedDistrict)
    ?? SEOUL_RENT_CHECK_DISTRICTS[0]!;
  const requestedBuilding = one(query.building)?.trim();
  const buildingId = requestedBuilding !== undefined && requestedBuilding.length <= 200
    ? requestedBuilding || null
    : null;
  const selection: SingleQuoteInput = Object.freeze({
    transaction,
    districtSlug: district.slug,
    buildingId,
    housingType,
    areaSqm: safeArea(one(query.area)),
    depositWon: transaction === 'monthly' ? safeMoney(one(query.deposit), 100_000_000) : null,
    quoteWon: safeMoney(one(query.price), transaction === 'monthly' ? 1_500_000 : 500_000_000),
  });
  const submitted = one(query.check) === '1';
  const repository = transaction === 'sale' ? repositories.sale : repositories.rent;
  let result: SingleQuoteResult | null = null;
  let buildingName: string | null = null;
  if (repository !== null) {
    if (buildingId !== null) {
      try {
        const source = transaction === 'sale'
          ? repositories.sale?.getBuilding(district.slug, buildingId)
          : repositories.rent?.getBuilding(district.slug, buildingId);
        buildingName = source?.officialName ?? null;
      } catch {
        buildingName = null;
      }
    }
    if (submitted) {
      const artifact = repository.getArtifact();
      const records = recordsFromRepositories(repositories, selection);
      result = evaluateSingleQuote(selection, records, artifact.period);
    }
  }
  return Object.freeze({
    availability: Object.freeze({
      sale: repositories.sale !== null,
      jeonse: repositories.rent !== null,
      monthly: repositories.rent !== null,
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
