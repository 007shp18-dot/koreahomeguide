import 'server-only';

import { createHash } from 'node:crypto';

import type {
  NormalizedMarketBatch,
  NormalizedMarketRecord,
  NormalizedObservation,
  NormalizedPropertyEntity,
  RefreshDataset,
} from './refresh-types';
import {
  canonicalJson,
  normalizeEntityName,
  sha256,
} from './normalization.server';

const DLD_URL = 'https://dubailand.gov.ae/en/open-data/real-estate-data/';

const TRANSACTION_DATASET: RefreshDataset = Object.freeze({
  id: 'ae-dubai-transactions',
  marketId: 'ae-dubai',
  provider: 'Dubai Land Department',
  officialName: 'DLD Real Estate Transactions',
  landingUrl: DLD_URL,
  subjectScope: 'Dubai registered sales, mortgages and gifts',
  refreshCadence: 'daily',
  expectedLag: 'source publication lag',
  schemaVersion: 'dld-export-2026',
  parserVersion: 'dld-csv-v2',
  rightsPolicyId: 'ae-dubai-pulse-open-data-v1',
});

const RENT_DATASET: RefreshDataset = Object.freeze({
  id: 'ae-dubai-rents',
  marketId: 'ae-dubai',
  provider: 'Dubai Land Department',
  officialName: 'DLD Rental Contracts',
  landingUrl: DLD_URL,
  subjectScope: 'Dubai registered tenancy contracts',
  refreshCadence: 'daily',
  expectedLag: 'source publication lag',
  schemaVersion: 'dld-export-2026',
  parserVersion: 'dld-csv-v2',
  rightsPolicyId: 'ae-dubai-pulse-open-data-v1',
});

const TRANSACTION_COLUMNS = Object.freeze([
  'TRANSACTION_NUMBER', 'INSTANCE_DATE', 'GROUP_EN', 'PROCEDURE_EN',
  'IS_OFFPLAN_EN', 'IS_FREE_HOLD_EN', 'USAGE_EN', 'AREA_EN',
  'PROP_TYPE_EN', 'PROP_SB_TYPE_EN', 'TRANS_VALUE', 'PROCEDURE_AREA',
  'ACTUAL_AREA', 'ROOMS_EN', 'PROJECT_EN',
]);

const RENT_COLUMNS = Object.freeze([
  'REGISTRATION_DATE', 'START_DATE', 'END_DATE', 'VERSION_EN', 'AREA_EN',
  'CONTRACT_AMOUNT', 'ANNUAL_AMOUNT', 'IS_FREE_HOLD_EN', 'ACTUAL_AREA',
  'PROP_TYPE_EN', 'PROP_SUB_TYPE_EN', 'ROOMS', 'USAGE_EN', 'PROJECT_EN',
]);

type CsvRecord = Readonly<Record<string, string>>;
type DldCsvParseOptions = Readonly<{ monthKeys?: readonly string[] }>;

function parseCsvRows(
  source: string,
  include: (record: CsvRecord) => boolean = () => true,
): Readonly<{ columns: readonly string[]; rows: readonly CsvRecord[] }> {
  const text = source.startsWith('\uFEFF') ? source.slice(1) : source;
  let columns: readonly string[] | null = null;
  const records: CsvRecord[] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let quoteClosed = false;

  const pushField = () => {
    row.push(field);
    field = '';
    quoteClosed = false;
  };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value !== '')) {
      if (columns === null) {
        const names = row.map((value) => value.trim());
        if (new Set(names).size !== names.length || names.some((value) => value === '')) {
          throw new TypeError('DLD CSV header is invalid.');
        }
        columns = Object.freeze(names);
      } else {
        if (row.length !== columns.length) throw new TypeError('DLD CSV row width is invalid.');
        const record = Object.freeze(Object.fromEntries(
          columns.map((name, index) => [name, row[index]!.trim()]),
        ));
        if (include(record)) records.push(record);
      }
    }
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      if (field !== '' || quoteClosed) throw new TypeError('DLD CSV quoting is invalid.');
      quoted = true;
    } else if (character === ',') {
      pushField();
    } else if (character === '\n') {
      pushRow();
    } else if (character === '\r' && text[index + 1] === '\n') {
      // The following LF closes the row.
    } else {
      if (quoteClosed && character.trim() !== '') throw new TypeError('DLD CSV quoting is invalid.');
      field += character;
    }
  }
  if (quoted) throw new TypeError('DLD CSV quoting is invalid.');
  if (field !== '' || row.length > 0) pushRow();

  if (columns === null) throw new TypeError('DLD CSV header is unavailable.');
  return Object.freeze({ columns, rows: Object.freeze(records) });
}

function requireColumns(
  parsed: Readonly<{ columns: readonly string[]; rows: readonly CsvRecord[] }>,
  required: readonly string[],
): void {
  const available = new Set(parsed.columns);
  for (const column of required) {
    if (!available.has(column)) throw new TypeError(`DLD CSV required column is missing: ${column}`);
  }
  if (parsed.rows.length === 0) throw new TypeError('DLD CSV contains no data rows.');
}

function incrementalFilter(
  column: 'INSTANCE_DATE' | 'REGISTRATION_DATE',
  options: DldCsvParseOptions,
): (record: CsvRecord) => boolean {
  if (options.monthKeys === undefined) return () => true;
  if (options.monthKeys.length === 0 || options.monthKeys.some((key) => !/^\d{6}$/u.test(key))) {
    throw new TypeError('DLD refresh month keys are invalid.');
  }
  const allowed = new Set(options.monthKeys);
  return (record) => {
    const value = record[column]?.trim() ?? '';
    const match = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}(?:[ T]|$)/u.exec(value);
    if (match === null) throw new TypeError(`DLD ${column} is invalid.`);
    return allowed.has(`${match[1]}${match[2]}`);
  };
}

function requiredText(row: CsvRecord, column: string): string {
  const value = row[column]?.trim();
  if (value === undefined || value === '') throw new TypeError(`DLD ${column} is invalid.`);
  if (/[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`DLD ${column} is invalid.`);
  return value;
}

function optionalText(row: CsvRecord, column: string): string | null {
  const value = row[column]?.trim();
  if (value === undefined || value === '') return null;
  if (/[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`DLD ${column} is invalid.`);
  return value;
}

function decimal(row: CsvRecord, column: string, allowZero = false): number {
  const value = requiredText(row, column);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value)) throw new TypeError(`DLD ${column} is invalid.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (!allowZero && parsed <= 0)) throw new TypeError(`DLD ${column} is invalid.`);
  return parsed;
}

function minorAmount(row: CsvRecord, column: string): number {
  const value = requiredText(row, column);
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/u.exec(value);
  if (match === null) throw new TypeError(`DLD ${column} is invalid.`);
  const amount = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new TypeError(`DLD ${column} is invalid.`);
  return amount;
}

function dubaiInstant(row: CsvRecord, column: string): { date: string; instant: string } {
  const value = requiredText(row, column);
  const match = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?$/u.exec(value);
  if (match === null) throw new TypeError(`DLD ${column} is invalid.`);
  const instant = new Date(`${match[1]}T${match[2] ?? '00:00:00'}+04:00`);
  if (!Number.isFinite(instant.getTime())) throw new TypeError(`DLD ${column} is invalid.`);
  return { date: match[1]!, instant: instant.toISOString() };
}

function dateOnly(row: CsvRecord, column: string): string {
  return dubaiInstant(row, column).date;
}

function bedrooms(value: string | null): number | null {
  if (value === null || /^NA$/iu.test(value)) return null;
  if (/^studio$/iu.test(value)) return 0;
  const match = /^(\d+(?:\.\d+)?)\s*B\/R$/iu.exec(value);
  if (match === null) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function tenure(value: string): string {
  return /^free\s*hold$/iu.test(value) ? 'freehold' : 'non-freehold';
}

function stage(value: string): string {
  return /off[ -]?plan/iu.test(value) ? 'off-plan' : 'ready';
}

function dldIdentityText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US');
}

function dldLegacyId(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 16);
}

function observationKind(value: string): 'sale' | 'mortgage' | 'gift' {
  if (/mortgage/iu.test(value)) return 'mortgage';
  if (/gift/iu.test(value)) return 'gift';
  if (/sales?/iu.test(value)) return 'sale';
  throw new TypeError('DLD GROUP_EN is unsupported.');
}

function projectEntity(row: CsvRecord, propertyClass: string): NormalizedPropertyEntity | null {
  const project = optionalText(row, 'PROJECT_EN');
  if (project === null) return null;
  const area = requiredText(row, 'AREA_EN');
  const projectIdentity = dldIdentityText(project);
  const areaIdentity = dldIdentityText(area);
  const geographyId = `ae-dubai-area-${dldLegacyId(areaIdentity)}`;
  return Object.freeze({
    id: `ae-dubai-project-${dldLegacyId(`${projectIdentity}\u0000${areaIdentity}`)}`,
    marketId: 'ae-dubai',
    geography: Object.freeze({
      id: geographyId,
      marketId: 'ae-dubai',
      kind: 'community',
      officialName: area,
      localizedNames: Object.freeze({ en: area }),
      providerCode: areaIdentity,
    }),
    kind: 'project',
    canonicalName: project,
    normalizedName: normalizeEntityName(project),
    addressText: `${project}, ${area}, Dubai`,
    housingSector: null,
    propertyClass,
    identityStatus: 'verified',
    localAttributes: Object.freeze({ areaName: area, source: 'dld' }),
    localSchemaVersion: 'ae-dubai-project@1',
  });
}

function sourceAsOf(records: readonly NormalizedMarketRecord[], fallback: Date): string {
  if (!Number.isFinite(fallback.getTime())) throw new TypeError('DLD reference instant is invalid.');
  return records.reduce((latest, record) => (
    record.sourceObservedAt > latest ? record.sourceObservedAt : latest
  ), records[0]?.sourceObservedAt ?? fallback.toISOString());
}

function assignOccurrences(
  candidates: readonly Readonly<{ baseKey: string; record: Omit<NormalizedMarketRecord, 'businessKey'> }>[]
): readonly NormalizedMarketRecord[] {
  const totals = new Map<string, number>();
  for (const candidate of candidates) totals.set(candidate.baseKey, (totals.get(candidate.baseKey) ?? 0) + 1);
  const seen = new Map<string, number>();
  return Object.freeze([...candidates]
    .sort((left, right) => left.baseKey.localeCompare(right.baseKey)
      || left.record.contentHash.localeCompare(right.record.contentHash)
      || left.record.sourceObservedAt.localeCompare(right.record.sourceObservedAt))
    .map(({ baseKey, record }) => {
      const occurrence = (seen.get(baseKey) ?? 0) + 1;
      seen.set(baseKey, occurrence);
      const businessKey = totals.get(baseKey) === 1 ? baseKey : `${baseKey}:${occurrence}`;
      return Object.freeze({ businessKey, ...record });
    }));
}

export function parseDldTransactionsCsv(
  source: string,
  reference: Date,
  options: DldCsvParseOptions = Object.freeze({}),
): NormalizedMarketBatch {
  const parsed = parseCsvRows(source, incrementalFilter('INSTANCE_DATE', options));
  requireColumns(parsed, TRANSACTION_COLUMNS);
  const rows = parsed.rows;
  const candidates = rows.map((row) => {
    const transactionNumber = requiredText(row, 'TRANSACTION_NUMBER');
    const registered = dubaiInstant(row, 'INSTANCE_DATE');
    const propertyType = requiredText(row, 'PROP_TYPE_EN');
    const propertySubType = optionalText(row, 'PROP_SB_TYPE_EN');
    const usage = optionalText(row, 'USAGE_EN');
    const entity = projectEntity(row, propertySubType ?? propertyType);
    const procedure = requiredText(row, 'PROCEDURE_EN');
    const rawMetadata = Object.freeze({
      transactionNumber,
      procedure,
      group: requiredText(row, 'GROUP_EN'),
      areaName: requiredText(row, 'AREA_EN'),
      propertyType,
      propertySubType,
      usage,
    });
    const observation: NormalizedObservation | null = entity === null ? null : Object.freeze({
      kind: observationKind(requiredText(row, 'GROUP_EN')),
      stage: stage(requiredText(row, 'IS_OFFPLAN_EN')),
      observedAt: registered.date,
      registeredAt: registered.date,
      periodStart: null,
      periodEnd: null,
      amountMinor: minorAmount(row, 'TRANS_VALUE'),
      annualAmountMinor: null,
      currencyCode: 'AED',
      depositMinor: null,
      recurringAmountMinor: null,
      frequency: 'once',
      propertyAreaSqm: decimal(row, 'ACTUAL_AREA'),
      transactedAreaSqm: decimal(row, 'PROCEDURE_AREA'),
      areaBasis: 'dld-actual-area',
      floorValue: null,
      floorRange: null,
      bedrooms: bedrooms(optionalText(row, 'ROOMS_EN')),
      tenureKind: tenure(requiredText(row, 'IS_FREE_HOLD_EN')),
      status: /cancel/iu.test(procedure) ? 'cancelled' : 'active',
      localAttributes: Object.freeze({ procedure, usage }),
      localSchemaVersion: 'dld-transaction@2',
    });
    const content = Object.freeze({ rawMetadata, observation });
    return Object.freeze({
      baseKey: transactionNumber,
      record: Object.freeze({
        contentHash: sha256(content),
        sourceObservedAt: registered.instant,
        rawMetadata,
        entity,
        observation,
      }),
    });
  });
  const records = assignOccurrences(candidates);
  return Object.freeze({
    job: 'ae-dubai-transaction',
    dataset: TRANSACTION_DATASET,
    sourceAsOf: sourceAsOf(records, reference),
    records,
  });
}

export function parseDldRentsCsv(
  source: string,
  reference: Date,
  options: DldCsvParseOptions = Object.freeze({}),
): NormalizedMarketBatch {
  const parsed = parseCsvRows(source, incrementalFilter('REGISTRATION_DATE', options));
  requireColumns(parsed, RENT_COLUMNS);
  const rows = parsed.rows;
  const candidates = rows.map((row) => {
    const registered = dubaiInstant(row, 'REGISTRATION_DATE');
    const propertyType = requiredText(row, 'PROP_TYPE_EN');
    const propertySubType = optionalText(row, 'PROP_SUB_TYPE_EN');
    const usage = optionalText(row, 'USAGE_EN');
    const entity = projectEntity(row, propertySubType ?? propertyType);
    const version = requiredText(row, 'VERSION_EN');
    const identity = Object.freeze({
      registeredAt: registered.instant,
      startDate: dateOnly(row, 'START_DATE'),
      endDate: dateOnly(row, 'END_DATE'),
      areaName: requiredText(row, 'AREA_EN'),
      propertyType,
      propertySubType,
      areaSqm: decimal(row, 'ACTUAL_AREA'),
      project: optionalText(row, 'PROJECT_EN'),
      version,
    });
    const baseKey = `rent:${sha256(canonicalJson(identity)).slice(0, 32)}`;
    const rawMetadata = Object.freeze({
      registrationDate: registered.instant,
      areaName: identity.areaName,
      propertyType: identity.propertyType,
      propertySubType: identity.propertySubType,
      version,
      usage,
    });
    const observation: NormalizedObservation | null = entity === null ? null : Object.freeze({
      kind: 'rent',
      stage: version.toLocaleLowerCase('en-US'),
      observedAt: registered.date,
      registeredAt: registered.date,
      periodStart: identity.startDate,
      periodEnd: identity.endDate,
      amountMinor: minorAmount(row, 'CONTRACT_AMOUNT'),
      annualAmountMinor: minorAmount(row, 'ANNUAL_AMOUNT'),
      currencyCode: 'AED',
      depositMinor: null,
      recurringAmountMinor: null,
      frequency: 'annual',
      propertyAreaSqm: identity.areaSqm,
      transactedAreaSqm: null,
      areaBasis: 'dld-actual-area',
      floorValue: null,
      floorRange: null,
      bedrooms: bedrooms(optionalText(row, 'ROOMS')),
      tenureKind: tenure(requiredText(row, 'IS_FREE_HOLD_EN')),
      status: /cancel/iu.test(version) ? 'cancelled' : 'active',
      localAttributes: Object.freeze({ version, usage }),
      localSchemaVersion: 'dld-rent@2',
    });
    const content = Object.freeze({ rawMetadata, observation });
    return Object.freeze({
      baseKey,
      record: Object.freeze({
        contentHash: sha256(content),
        sourceObservedAt: registered.instant,
        rawMetadata,
        entity,
        observation,
      }),
    });
  });
  const records = assignOccurrences(candidates);
  return Object.freeze({
    job: 'ae-dubai-rent',
    dataset: RENT_DATASET,
    sourceAsOf: sourceAsOf(records, reference),
    records,
  });
}
