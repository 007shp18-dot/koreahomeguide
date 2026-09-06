import 'server-only';

import {
  URA_DATA_URL,
  URA_TOKEN_URL,
  buildSingaporeProjectId,
  createUraClient,
  parseUraPrivateSaleEnvelope,
  type UraPrivateSaleTransaction,
} from '@signedprice/singapore-property';

import { canonicalJson, normalizeEntityName, sha256, stableId } from './normalization.server';
import type {
  MarketRefreshJob,
  NormalizedMarketBatch,
  NormalizedMarketRecord,
  NormalizedObservation,
  NormalizedPropertyEntity,
  RefreshDataset,
} from './refresh-types';
import { refreshMonthKeys, refreshQuarterKeys } from './refresh-window';

type SingaporeRefreshJob = Extract<MarketRefreshJob, 'sg-private-sale' | 'sg-private-rent'>;

type RentalRecord = Readonly<{
  project: string;
  street: string;
  district: string;
  propertyType: string;
  leaseMonth: string;
  areaRange: string;
  areaMidpoint: number;
  bedrooms: number | null;
  rentSgd: number;
  sourceOrder: Readonly<{ quarter: string; project: number; rental: number }>;
}>;

const datasets = Object.freeze({
  'sg-private-sale': Object.freeze({
    id: 'sg-private-sale', marketId: 'sg-singapore', provider: 'URA',
    officialName: 'Private residential property transactions',
    landingUrl: 'https://eservice.ura.gov.sg/property-market-information/pmiResidentialTransactionSearch',
    subjectScope: 'Singapore private residential sale', refreshCadence: 'Tuesday and Friday',
    expectedLag: 'provider release', schemaVersion: 'signedprice-singapore-private-sale-live-v1',
    parserVersion: 'ura-private-sale-v1', rightsPolicyId: 'sg-ura-private-sale-v1',
  }),
  'sg-private-rent': Object.freeze({
    id: 'sg-private-rent', marketId: 'sg-singapore', provider: 'URA',
    officialName: 'Private residential rental contracts',
    landingUrl: 'https://eservice.ura.gov.sg/property-market-information/pmiResidentialRentalSearch',
    subjectScope: 'Singapore private residential rent', refreshCadence: 'monthly',
    expectedLag: 'provider release', schemaVersion: 'signedprice-singapore-private-rent-live-v1',
    parserVersion: 'ura-private-rent-v1', rightsPolicyId: 'sg-ura-private-rent-v1',
  }),
}) satisfies Readonly<Record<SingaporeRefreshJob, RefreshDataset>>;

function record(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) rentalInvalid();
  return value as Readonly<Record<string, unknown>>;
}

function rentalInvalid(): never {
  throw new TypeError('URA private rental schema is invalid.');
}

function text(value: unknown, allowEmpty = false): string {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/u.test(value)) rentalInvalid();
  const result = value.trim();
  if (!allowEmpty && result === '') rentalInvalid();
  return result;
}

function positive(value: unknown): number {
  const source = text(value);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(source)) rentalInvalid();
  const result = Number(source);
  if (!Number.isFinite(result) || result <= 0) rentalInvalid();
  return result;
}

function rentalMonth(value: unknown): string {
  const match = /^(0[1-9]|1[0-2])(\d{2})$/u.exec(text(value));
  if (match === null) rentalInvalid();
  return `20${match[2]}-${match[1]}-01`;
}

function areaRange(value: unknown): Readonly<{ raw: string; midpoint: number }> {
  const raw = text(value);
  const match = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/u.exec(raw);
  if (match === null) rentalInvalid();
  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high < low) rentalInvalid();
  return Object.freeze({ raw, midpoint: (low + high) / 2 });
}

export function parseUraPrivateRentalEnvelope(value: unknown, quarter: string): readonly RentalRecord[] {
  if (!/^\d{2}q[1-4]$/u.test(quarter)) rentalInvalid();
  const envelope = record(value);
  const envelopeKeys = Object.keys(envelope).sort();
  if (envelopeKeys.join('|') !== 'Message|Result|Status'
    || text(envelope.Status) !== 'Success') rentalInvalid();
  text(envelope.Message, true);
  if (!Array.isArray(envelope.Result) || envelope.Result.length === 0) rentalInvalid();
  const output: RentalRecord[] = [];
  envelope.Result.forEach((projectValue, projectIndex) => {
    const project = record(projectValue);
    const allowedProjectKeys = new Set(['project', 'street', 'rental', 'x', 'y']);
    if (Object.keys(project).some((key) => !allowedProjectKeys.has(key))) rentalInvalid();
    const projectName = text(project.project);
    const street = text(project.street);
    if (!Array.isArray(project.rental) || project.rental.length === 0) rentalInvalid();
    project.rental.forEach((rentalValue, rentalIndex) => {
      const rental = record(rentalValue);
      const allowedRentalKeys = new Set([
        'district', 'propertyType', 'leaseDate', 'areaSqm', 'noOfBedRoom', 'rent',
      ]);
      if (Object.keys(rental).some((key) => !allowedRentalKeys.has(key))) rentalInvalid();
      const area = areaRange(rental.areaSqm);
      const bedroomText = rental.noOfBedRoom === undefined ? '' : text(rental.noOfBedRoom, true);
      const bedrooms = bedroomText === '' ? null : positive(bedroomText);
      output.push(Object.freeze({
        project: projectName,
        street,
        district: text(rental.district),
        propertyType: text(rental.propertyType),
        leaseMonth: rentalMonth(rental.leaseDate),
        areaRange: area.raw,
        areaMidpoint: area.midpoint,
        bedrooms,
        rentSgd: positive(rental.rent),
        sourceOrder: Object.freeze({ quarter, project: projectIndex, rental: rentalIndex }),
      }));
    });
  });
  if (output.length === 0) rentalInvalid();
  return Object.freeze(output);
}

async function requestUraJson(url: string, headers: Readonly<Record<string, string>>): Promise<unknown> {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error('URA provider request failed.');
  return response.json();
}

async function defaultRentalEnvelopes(
  accessKey: string,
  quarters: readonly string[],
): Promise<readonly unknown[]> {
  const tokenEnvelope = record(await requestUraJson(URA_TOKEN_URL, { AccessKey: accessKey }));
  if (tokenEnvelope.Status !== 'Success' || typeof tokenEnvelope.Result !== 'string'
    || tokenEnvelope.Result.trim() === '') throw new Error('URA provider request failed.');
  const token = tokenEnvelope.Result.trim();
  const output: unknown[] = [];
  for (const quarter of quarters) {
    const url = new URL(URA_DATA_URL);
    url.searchParams.set('service', 'PMI_Resi_Rental');
    url.searchParams.set('refPeriod', quarter);
    output.push(await requestUraJson(url.toString(), { AccessKey: accessKey, Token: token }));
  }
  return Object.freeze(output);
}

function saleEntity(transaction: UraPrivateSaleTransaction): NormalizedPropertyEntity {
  const projectId = buildSingaporeProjectId(transaction);
  return Object.freeze({
    id: `sg-singapore:project:${projectId}`,
    marketId: 'sg-singapore',
    geography: Object.freeze({
      id: `sg-singapore:district:${transaction.district}`,
      marketId: 'sg-singapore', kind: 'district', officialName: transaction.district,
      localizedNames: Object.freeze({ en: transaction.district }),
      providerCode: transaction.district,
    }),
    kind: 'project', canonicalName: transaction.project,
    normalizedName: normalizeEntityName(transaction.project),
    addressText: `${transaction.project}, ${transaction.street}, Singapore`,
    housingSector: 'private_residential', propertyClass: transaction.propertyType,
    identityStatus: 'verified',
    localAttributes: Object.freeze({
      district: transaction.district,
      marketSegment: transaction.marketSegment,
      street: transaction.street,
    }),
    localSchemaVersion: 'sg-private-project@1',
  });
}

function rentalEntity(rental: RentalRecord): NormalizedPropertyEntity {
  const identity = canonicalJson({
    project: normalizeEntityName(rental.project),
    street: normalizeEntityName(rental.street),
    district: rental.district,
  });
  return Object.freeze({
    id: `sg-singapore:rent-project:${stableId(identity)}`,
    marketId: 'sg-singapore',
    geography: Object.freeze({
      id: `sg-singapore:district:${rental.district}`,
      marketId: 'sg-singapore', kind: 'district', officialName: rental.district,
      localizedNames: Object.freeze({ en: rental.district }), providerCode: rental.district,
    }),
    kind: 'project', canonicalName: rental.project,
    normalizedName: normalizeEntityName(rental.project),
    addressText: `${rental.project}, ${rental.street}, Singapore`,
    housingSector: 'private_residential', propertyClass: rental.propertyType,
    identityStatus: 'verified',
    localAttributes: Object.freeze({ district: rental.district, street: rental.street }),
    localSchemaVersion: 'sg-private-rent-project@1',
  });
}

function withOccurrenceKeys(
  candidates: readonly Readonly<{ baseKey: string; row: Omit<NormalizedMarketRecord, 'businessKey'> }>[],
): readonly NormalizedMarketRecord[] {
  const sorted = [...candidates].sort((left, right) => left.baseKey.localeCompare(right.baseKey)
    || left.row.contentHash.localeCompare(right.row.contentHash));
  const totals = new Map<string, number>();
  for (const candidate of sorted) totals.set(candidate.baseKey, (totals.get(candidate.baseKey) ?? 0) + 1);
  const seen = new Map<string, number>();
  return Object.freeze(sorted.map(({ baseKey, row }) => {
    const ordinal = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, ordinal);
    return Object.freeze({
      businessKey: totals.get(baseKey) === 1 ? baseKey : `${baseKey}:${ordinal}`,
      ...row,
    });
  }));
}

function normalizeSales(
  transactions: readonly UraPrivateSaleTransaction[],
  sourceObservedAt: string,
): readonly NormalizedMarketRecord[] {
  return withOccurrenceKeys(transactions.map((transaction) => {
    const entity = saleEntity(transaction);
    const identity = {
      project: transaction.project, street: transaction.street, district: transaction.district,
      propertyType: transaction.propertyType, contractMonth: transaction.contractMonth,
      areaSqm: transaction.areaSqm, floorRange: transaction.floorRange,
      saleType: transaction.saleType, units: transaction.units,
    };
    const rawMetadata = Object.freeze({
      contractDate: transaction.contractDate,
      district: transaction.district,
      propertyType: transaction.propertyType,
      sourceOrder: transaction.sourceOrder,
    });
    const observation: NormalizedObservation = Object.freeze({
      kind: 'sale', stage: transaction.saleType, observedAt: transaction.contractMonth,
      registeredAt: null, periodStart: transaction.contractMonth,
      periodEnd: transaction.contractMonth, amountMinor: transaction.priceSgd * 100,
      annualAmountMinor: null, currencyCode: 'SGD', depositMinor: null,
      recurringAmountMinor: null, frequency: 'once', propertyAreaSqm: transaction.areaSqm,
      transactedAreaSqm: transaction.areaSqm, areaBasis: transaction.areaBasis,
      floorValue: null, floorRange: transaction.floorRange, bedrooms: null,
      tenureKind: transaction.tenure, status: 'active',
      localAttributes: Object.freeze({ netPriceSgd: transaction.netPriceSgd, units: transaction.units }),
      localSchemaVersion: 'sg-private-sale-live@1',
    });
    return Object.freeze({
      baseKey: `sale:${sha256(canonicalJson(identity)).slice(0, 32)}`,
      row: Object.freeze({
        contentHash: sha256({ transaction }), sourceObservedAt, rawMetadata, entity, observation,
      }),
    });
  }));
}

function normalizeRentals(
  rentals: readonly RentalRecord[],
  sourceObservedAt: string,
): readonly NormalizedMarketRecord[] {
  return withOccurrenceKeys(rentals.map((rental) => {
    const entity = rentalEntity(rental);
    const identity = {
      project: rental.project, street: rental.street, district: rental.district,
      propertyType: rental.propertyType, leaseMonth: rental.leaseMonth,
      areaRange: rental.areaRange, bedrooms: rental.bedrooms,
    };
    const rawMetadata = Object.freeze({
      areaRange: rental.areaRange,
      district: rental.district,
      propertyType: rental.propertyType,
      sourceOrder: rental.sourceOrder,
    });
    const monthlyMinor = rental.rentSgd * 100;
    const observation: NormalizedObservation = Object.freeze({
      kind: 'rent', stage: null, observedAt: rental.leaseMonth, registeredAt: null,
      periodStart: rental.leaseMonth, periodEnd: rental.leaseMonth,
      amountMinor: null, annualAmountMinor: monthlyMinor * 12, currencyCode: 'SGD',
      depositMinor: null, recurringAmountMinor: monthlyMinor, frequency: 'monthly',
      propertyAreaSqm: rental.areaMidpoint, transactedAreaSqm: null,
      areaBasis: 'ura-reported-range-midpoint', floorValue: null, floorRange: null,
      bedrooms: rental.bedrooms, tenureKind: null, status: 'active',
      localAttributes: Object.freeze({ areaRange: rental.areaRange }),
      localSchemaVersion: 'sg-private-rent-live@1',
    });
    return Object.freeze({
      baseKey: `rent:${sha256(canonicalJson(identity)).slice(0, 32)}`,
      row: Object.freeze({
        contentHash: sha256({ rental }), sourceObservedAt, rawMetadata, entity, observation,
      }),
    });
  }));
}

export async function collectSingaporeEvidence(input: Readonly<{
  job: SingaporeRefreshJob;
  accessKey: string;
  reference: Date;
  fetchSaleEnvelopes?: () => Promise<readonly unknown[]>;
  fetchRentalEnvelope?: (quarter: string) => Promise<unknown>;
}>): Promise<NormalizedMarketBatch> {
  if (input.accessKey.trim() === '') throw new TypeError('URA access is not configured.');
  if (!Number.isFinite(input.reference.getTime())) throw new TypeError('URA reference instant is invalid.');
  const sourceAsOf = input.reference.toISOString();
  if (input.job === 'sg-private-sale') {
    const envelopes = await (input.fetchSaleEnvelopes ?? (() => createUraClient({
      accessKey: input.accessKey,
    }).fetchPrivateResidentialTransactions()))();
    if (envelopes.length !== 4) throw new TypeError('URA private sale refresh is incomplete.');
    const refreshMonths = new Set(refreshMonthKeys(input.reference));
    const transactions = envelopes.flatMap((envelope, index) => (
      parseUraPrivateSaleEnvelope(envelope, index + 1)
    )).filter((transaction) => refreshMonths.has(
      transaction.contractMonth.slice(0, 7).replace('-', ''),
    ));
    if (transactions.length === 0) throw new TypeError('URA private sale refresh returned no records.');
    return Object.freeze({
      job: input.job, dataset: datasets[input.job], sourceAsOf,
      records: normalizeSales(transactions, sourceAsOf),
    });
  }

  const quarters = refreshQuarterKeys(input.reference);
  const envelopes = input.fetchRentalEnvelope === undefined
    ? await defaultRentalEnvelopes(input.accessKey, quarters)
    : await Promise.all(quarters.map((quarter) => input.fetchRentalEnvelope!(quarter)));
  const rentals = envelopes.flatMap((envelope, index) => (
    parseUraPrivateRentalEnvelope(envelope, quarters[index]!)
  ));
  if (rentals.length === 0) throw new TypeError('URA private rental refresh returned no records.');
  return Object.freeze({
    job: input.job, dataset: datasets[input.job], sourceAsOf,
    records: normalizeRentals(rentals, sourceAsOf),
  });
}
