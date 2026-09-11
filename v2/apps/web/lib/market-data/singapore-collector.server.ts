import 'server-only';

import {
  buildSingaporeProjectId,
  parseUraPrivateSaleEnvelope,
  type UraPrivateSaleTransaction,
} from '@signedprice/singapore-property';

import { fetchUra } from '../ura';
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
  areaMidpoint: number | null;
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
    parserVersion: 'ura-private-sale-v2', rightsPolicyId: 'sg-ura-private-sale-v1',
  }),
  'sg-private-rent': Object.freeze({
    id: 'sg-private-rent', marketId: 'sg-singapore', provider: 'URA',
    officialName: 'Private residential rental contracts',
    landingUrl: 'https://eservice.ura.gov.sg/property-market-information/pmiResidentialRentalSearch',
    subjectScope: 'Singapore private residential rent', refreshCadence: 'monthly',
    expectedLag: 'provider release', schemaVersion: 'signedprice-singapore-private-rent-live-v1',
    parserVersion: 'ura-private-rent-v2', rightsPolicyId: 'sg-ura-private-rent-v1',
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
  const source = typeof value === 'number' && Number.isFinite(value) ? String(value) : text(value);
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

function areaRange(value: unknown): Readonly<{ raw: string; midpoint: number | null }> {
  const raw = text(value);
  if (/^(?:>|<=)\s*[1-9]\d*(?:\.\d+)?$/u.test(raw)) return Object.freeze({ raw, midpoint: null });
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
  // An explicit provider failure is not evidence of a changed rental schema.
  if (envelope.Status === 'Failure') throw new Error('URA provider request failed.');
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
        'district', 'propertyType', 'leaseDate', 'areaSqm', 'areaSqft', 'noOfBedRoom', 'rent',
      ]);
      if (Object.keys(rental).some((key) => !allowedRentalKeys.has(key))) rentalInvalid();
      const area = areaRange(rental.areaSqm);
      const bedroomText = rental.noOfBedRoom === undefined ? '' : text(rental.noOfBedRoom, true);
      const bedrooms = bedroomText === '' || bedroomText === 'NA' ? null : positive(bedroomText);
      if (bedrooms !== null && !Number.isSafeInteger(bedrooms)) rentalInvalid();
      const leaseMonth = rentalMonth(rental.leaseDate);
      const expectedQuarter = `${leaseMonth.slice(2, 4)}q${Math.ceil(Number(leaseMonth.slice(5, 7)) / 3)}`;
      if (expectedQuarter !== quarter) rentalInvalid();
      const district = text(rental.district);
      if (!/^(?:0[1-9]|1\d|2[0-8])$/u.test(district)) rentalInvalid();
      const rentSgd = positive(rental.rent);
      if (!Number.isSafeInteger(rentSgd * 100)) rentalInvalid();
      output.push(Object.freeze({
        project: projectName,
        street,
        district,
        propertyType: text(rental.propertyType),
        leaseMonth,
        areaRange: area.raw,
        areaMidpoint: area.midpoint,
        bedrooms,
        rentSgd,
        sourceOrder: Object.freeze({ quarter, project: projectIndex, rental: rentalIndex }),
      }));
    });
  });
  if (output.length === 0) rentalInvalid();
  return Object.freeze(output);
}

export async function requestUraJson(url: string, headers: Readonly<Record<string, string>>): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { ...headers, 'User-Agent': 'signedprice/1.0 (+https://signedprice.com)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      });
    } catch (error) {
      const transient = error instanceof TypeError || (error instanceof Error
        && (error.name === 'AbortError' || error.name === 'TimeoutError'));
      if (attempt === 0 && transient) continue;
      throw new Error('URA provider request failed.');
    }
    if (!response.ok) {
      if (attempt === 0 && response.status >= 500 && response.status <= 599) continue;
      throw new Error('URA provider request failed.');
    }
    // Invalid successful JSON/schema and explicit provider/auth failures are
    // deliberately not retried. Neither source payloads nor credentials are logged.
    return response.json();
  }
  throw new Error('URA provider request failed.');
}

async function defaultRentalEnvelopes(
  accessKey: string,
  quarters: readonly string[],
): Promise<readonly unknown[]> {
  const output: unknown[] = [];
  for (const quarter of quarters) {
    const { result } = await fetchUra(accessKey, 'PMI_Resi_Rental', quarter);
    // Normalize only after the shared client has checked the provider Status.
    // Optional envelope messages are not part of the transaction schema.
    output.push({ Status: 'Success', Message: '', Result: result });
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
  const seen = new Map<string, number>();
  return Object.freeze(sorted.map(({ baseKey, row }) => {
    const ordinal = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, ordinal);
    return Object.freeze({
      businessKey: `${baseKey}:${ordinal}`,
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
    const { sourceOrder: _sourceOrder, ...identity } = transaction;
    void _sourceOrder;
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
        contentHash: sha256(identity), sourceObservedAt, rawMetadata, entity, observation,
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
    const { sourceOrder: _sourceOrder, ...identity } = rental;
    void _sourceOrder;
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
      propertyAreaSqm: null, transactedAreaSqm: null,
      areaBasis: 'ura-reported-range', floorValue: null, floorRange: null,
      bedrooms: rental.bedrooms, tenureKind: null, status: 'active',
      localAttributes: Object.freeze({ areaRange: rental.areaRange, areaMidpointEstimate: rental.areaMidpoint }),
      localSchemaVersion: 'sg-private-rent-live@1',
    });
    return Object.freeze({
      baseKey: `rent:${sha256(canonicalJson(identity)).slice(0, 32)}`,
      row: Object.freeze({
        contentHash: sha256(identity), sourceObservedAt, rawMetadata, entity, observation,
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
    const envelopes = await (input.fetchSaleEnvelopes ?? (async () => {
      const batches: unknown[] = [];
      for (const batch of [1, 2, 3, 4]) {
        const { result } = await fetchUra(input.accessKey, 'PMI_Resi_Transaction', String(batch));
        batches.push({ Status: 'Success', Message: '', Result: result });
      }
      return batches;
    }))();
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
      reconciliationMonths: [...refreshMonths].map((month) => `${month.slice(0, 4)}-${month.slice(4)}-01`),
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
    reconciliationMonths: quarters.flatMap((quarter) => Array.from({ length: 3 }, (_, index) => (
      `20${quarter.slice(0, 2)}-${String((Number(quarter.at(-1)) - 1) * 3 + index + 1).padStart(2, '0')}-01`
    ))),
  });
}
