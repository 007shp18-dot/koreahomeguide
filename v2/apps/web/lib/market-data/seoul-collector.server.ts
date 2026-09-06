import 'server-only';

import {
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  SEOUL_RENT_CHECK_DISTRICTS,
  buildKoreaBuildingIdentity,
  fetchMolitRentalMonth,
  fetchMolitSaleMonth,
  type KoreaRentRecord,
  type KoreaSaleRecord,
  type SourceHousingType,
} from '@signedprice/korea-rent';

import { canonicalJson, normalizeEntityName, sha256 } from './normalization.server';
import type {
  MarketRefreshJob,
  NormalizedMarketBatch,
  NormalizedMarketRecord,
  NormalizedObservation,
  NormalizedPropertyEntity,
  RefreshDataset,
} from './refresh-types';
import { refreshMonthKeys } from './refresh-window';

const HOUSING_TYPES = Object.freeze([
  'apartment', 'officetel', 'villa', 'detached',
] as const satisfies readonly SourceHousingType[]);

type SeoulRefreshJob = Extract<MarketRefreshJob, 'kr-seoul-sale' | 'kr-seoul-rent'>;
type SeoulRefreshSourceRecord = KoreaRentRecord | KoreaSaleRecord;

export type SeoulMonthFetcher = (input: Readonly<{
  job: SeoulRefreshJob;
  serviceKey: string;
  lawdCd: string;
  districtSlug: string;
  sourceHousingType: SourceHousingType;
  dealYmd: string;
}>) => Promise<Readonly<{
  retrievedAt: string;
  records: readonly SeoulRefreshSourceRecord[];
}>>;

const datasets = Object.freeze({
  'kr-seoul-sale': Object.freeze({
    id: 'kr-sale', marketId: 'kr-seoul', provider: 'MOLIT',
    officialName: 'Reported Seoul sale contracts', landingUrl: 'https://rt.molit.go.kr/',
    subjectScope: 'Seoul residential sale', refreshCadence: 'daily',
    expectedLag: 'filing dependent', schemaVersion: 'signedprice-korea-sale-live-v1',
    parserVersion: MOLIT_SALE_PARSER_VERSION, rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID,
  }),
  'kr-seoul-rent': Object.freeze({
    id: 'kr-rent', marketId: 'kr-seoul', provider: 'MOLIT',
    officialName: 'Reported Seoul rental contracts', landingUrl: 'https://rt.molit.go.kr/',
    subjectScope: 'Seoul residential rent', refreshCadence: 'daily',
    expectedLag: 'filing dependent', schemaVersion: 'signedprice-korea-rent-live-v1',
    parserVersion: MOLIT_PARSER_VERSION, rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
  }),
}) satisfies Readonly<Record<SeoulRefreshJob, RefreshDataset>>;

function validInstant(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new TypeError('MOLIT retrieval instant is invalid.');
  return parsed.toISOString();
}

async function mapConcurrent<T, R>(
  input: readonly T[],
  concurrency: number,
  operation: (value: T) => Promise<R>,
): Promise<readonly R[]> {
  const output = new Array<R>(input.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, input.length) }, async () => {
    while (cursor < input.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await operation(input[index]!);
    }
  });
  await Promise.all(workers);
  return Object.freeze(output);
}

function createDefaultFetcher(reference: Date): SeoulMonthFetcher {
  const deadlineSignal = AbortSignal.timeout(280_000);
  let remainingCalls = 2_500;
  const budget = Object.freeze({
    consume() {
      remainingCalls -= 1;
      if (remainingCalls < 0) throw new Error('MOLIT request budget exhausted.');
    },
  });
  const dependencies = Object.freeze({
    fetch: (input: string | URL, init?: RequestInit) => fetch(input, init),
    budget,
    deadlineSignal,
    now: () => new Date(reference),
  });
  return async (input) => input.job === 'kr-seoul-sale'
    ? fetchMolitSaleMonth({
        serviceKey: input.serviceKey,
        sourceHousingType: input.sourceHousingType,
        lawdCd: input.lawdCd,
        dealYmd: input.dealYmd,
        pageSize: 1_000,
      }, dependencies)
    : fetchMolitRentalMonth({
        serviceKey: input.serviceKey,
        sourceHousingType: input.sourceHousingType,
        lawdCd: input.lawdCd,
        dealYmd: input.dealYmd,
        pageSize: 1_000,
      }, dependencies);
}

function entityFor(
  record: SeoulRefreshSourceRecord,
  district: (typeof SEOUL_RENT_CHECK_DISTRICTS)[number],
): NormalizedPropertyEntity | null {
  const identity = buildKoreaBuildingIdentity({
    districtSlug: district.slug,
    sourceHousingType: record.sourceHousingType,
    ...(record.legalDong === undefined ? {} : { legalDong: record.legalDong }),
    ...(record.buildingLabel === undefined ? {} : { buildingLabel: record.buildingLabel }),
  });
  if (identity === null) return null;
  const address = `서울특별시 ${district.nameKo} ${identity.neighborhoodName} ${identity.buildingName}`;
  return Object.freeze({
    id: `kr-seoul:estate:${identity.buildingId}`,
    marketId: 'kr-seoul',
    geography: Object.freeze({
      id: `kr-seoul:neighborhood:${identity.neighborhoodId}`,
      marketId: 'kr-seoul',
      kind: 'neighborhood',
      officialName: identity.neighborhoodName,
      localizedNames: Object.freeze({ ko: identity.neighborhoodName }),
      providerCode: identity.neighborhoodId,
    }),
    kind: 'estate',
    canonicalName: identity.buildingName,
    normalizedName: normalizeEntityName(identity.buildingName),
    addressText: address,
    housingSector: null,
    propertyClass: identity.housingType,
    identityStatus: 'verified',
    localAttributes: Object.freeze({
      housingType: identity.housingType,
      districtSlug: identity.districtSlug,
      neighborhoodName: identity.neighborhoodName,
    }),
    localSchemaVersion: 'kr-property@1',
  });
}

function isSale(record: SeoulRefreshSourceRecord): record is KoreaSaleRecord {
  return 'priceWon' in record;
}

function observationFor(
  record: SeoulRefreshSourceRecord,
  entity: NormalizedPropertyEntity | null,
): NormalizedObservation | null {
  if (entity === null) return null;
  if (isSale(record)) {
    return Object.freeze({
      kind: 'sale', stage: null, observedAt: record.contractDate, registeredAt: null,
      periodStart: null, periodEnd: null, amountMinor: record.priceWon,
      annualAmountMinor: null, currencyCode: 'KRW', depositMinor: null,
      recurringAmountMinor: null, frequency: 'once', propertyAreaSqm: record.areaSqm,
      transactedAreaSqm: null, areaBasis: 'reported-exclusive-area',
      floorValue: record.floor ?? null, floorRange: null, bedrooms: null,
      tenureKind: null, status: record.recordStatus === 'cancelled' ? 'cancelled' : 'active',
      localAttributes: Object.freeze({ buildYear: record.buildYear ?? null }),
      localSchemaVersion: 'kr-sale-live@1',
    });
  }
  return Object.freeze({
    kind: 'rent', stage: record.contractType, observedAt: record.contractDate, registeredAt: null,
    periodStart: null, periodEnd: null, amountMinor: null, annualAmountMinor: null,
    currencyCode: 'KRW', depositMinor: record.depositWon,
    recurringAmountMinor: record.monthlyRentWon,
    frequency: record.monthlyRentWon > 0 ? 'monthly' : 'once', propertyAreaSqm: record.areaSqm,
    transactedAreaSqm: null, areaBasis: 'reported-exclusive-area', floorValue: null,
    floorRange: null, bedrooms: null, tenureKind: null,
    status: record.recordStatus === 'cancelled' ? 'cancelled' : 'active',
    localAttributes: Object.freeze({ contractType: record.contractType }),
    localSchemaVersion: 'kr-rent-live@1',
  });
}

function identityBase(
  record: SeoulRefreshSourceRecord,
  lawdCd: string,
): string {
  if (record.sourceRecordId !== undefined) {
    return `${record.sourceHousingType}:${lawdCd}:${record.sourceRecordId}`;
  }
  const identity = {
    sourceHousingType: record.sourceHousingType,
    lawdCd,
    contractDate: record.contractDate,
    legalDong: record.legalDong ?? null,
    buildingLabel: record.buildingLabel ?? null,
    areaSqm: record.areaSqm,
    floor: isSale(record) ? record.floor ?? null : null,
    contractType: isSale(record) ? null : record.contractType,
  };
  return `${record.sourceHousingType}:${lawdCd}:derived:${sha256(canonicalJson(identity)).slice(0, 32)}`;
}

function normalizeRecords(input: readonly Readonly<{
  lawdCd: string;
  district: (typeof SEOUL_RENT_CHECK_DISTRICTS)[number];
  record: SeoulRefreshSourceRecord;
  retrievedAt: string;
}>[]): readonly NormalizedMarketRecord[] {
  const candidates = input.map(({ lawdCd, district, record, retrievedAt }) => {
    const entity = entityFor(record, district);
    const observation = observationFor(record, entity);
    const rawMetadata = Object.freeze({
      lawdCd,
      sourceHousingType: record.sourceHousingType,
      sourceRecordId: record.sourceRecordId ?? null,
    });
    return {
      baseKey: identityBase(record, lawdCd),
      contentHash: sha256({ record }),
      sourceObservedAt: retrievedAt,
      rawMetadata,
      entity,
      observation,
    };
  }).sort((left, right) => left.baseKey.localeCompare(right.baseKey)
    || left.contentHash.localeCompare(right.contentHash));
  const totals = new Map<string, number>();
  for (const row of candidates) totals.set(row.baseKey, (totals.get(row.baseKey) ?? 0) + 1);
  const seen = new Map<string, number>();
  return Object.freeze(candidates.map(({ baseKey, ...row }) => {
    const ordinal = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, ordinal);
    return Object.freeze({
      businessKey: totals.get(baseKey) === 1 ? baseKey : `${baseKey}:${ordinal}`,
      ...row,
    });
  }));
}

export async function collectSeoulEvidence(input: Readonly<{
  job: SeoulRefreshJob;
  serviceKey: string;
  reference: Date;
  fetchMonth?: SeoulMonthFetcher;
  concurrency?: number;
}>): Promise<NormalizedMarketBatch> {
  if (input.serviceKey.trim() === '') throw new TypeError('MOLIT access is not configured.');
  const concurrency = input.concurrency ?? 5;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new TypeError('MOLIT concurrency is invalid.');
  }
  const months = refreshMonthKeys(input.reference);
  const coordinates = SEOUL_RENT_CHECK_DISTRICTS.flatMap((district) =>
    months.flatMap((dealYmd) => HOUSING_TYPES.map((sourceHousingType) => Object.freeze({
      job: input.job,
      serviceKey: input.serviceKey,
      lawdCd: district.lawdCd,
      districtSlug: district.slug,
      sourceHousingType,
      dealYmd,
      district,
    }))));
  const fetchMonth = input.fetchMonth ?? createDefaultFetcher(input.reference);
  const results = await mapConcurrent(coordinates, concurrency, async ({ district, ...coordinate }) => {
    const result = await fetchMonth(coordinate);
    const retrievedAt = validInstant(result.retrievedAt);
    return result.records.map((record) => ({
      lawdCd: coordinate.lawdCd,
      district,
      record,
      retrievedAt,
    }));
  });
  const sourceRows = results.flat();
  if (sourceRows.length === 0) throw new TypeError('MOLIT refresh returned no records.');
  const records = normalizeRecords(sourceRows);
  const sourceAsOf = sourceRows.reduce((latest, row) => (
    row.retrievedAt > latest ? row.retrievedAt : latest
  ), sourceRows[0]!.retrievedAt);
  return Object.freeze({
    job: input.job,
    dataset: datasets[input.job],
    sourceAsOf,
    records,
  });
}
