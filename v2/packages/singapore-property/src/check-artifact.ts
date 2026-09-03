import { createHash } from 'node:crypto';

import type { SingaporeSnapshot } from './artifact.ts';
import type { HdbSnapshot } from './hdb.ts';

export const SINGAPORE_CHECK_ARTIFACT_VERSION = 'signedprice-singapore-check-market-v1' as const;
export const SINGAPORE_CHECK_MARKETS = [
  'ura-private-sale',
  'hdb-resale',
  'hdb-rent',
] as const;

export type SingaporeCheckMarket = typeof SINGAPORE_CHECK_MARKETS[number];

type CheckRecordBase<TMarket extends SingaporeCheckMarket> = Readonly<{
  market: TMarket;
  month: string;
  amountSgd: number;
}>;

export type UraPrivateSaleCheckRecord = CheckRecordBase<'ura-private-sale'> & Readonly<{
  marketSegment: 'CCR' | 'RCR' | 'OCR';
  projectId: string;
  project: string;
  propertyType: string;
  district: string;
  floorAreaSqm: number;
  floorRange: string;
  tenure: string;
  saleType: string;
  psf: number;
}>;

export type HdbResaleCheckRecord = CheckRecordBase<'hdb-resale'> & Readonly<{
  town: string;
  blockId: string;
  block: string;
  street: string;
  flatType: string;
  storeyRange: string;
  floorAreaSqm: number;
  remainingLease: string;
  flatModel: string;
}>;

export type HdbRentCheckRecord = CheckRecordBase<'hdb-rent'> & Readonly<{
  town: string;
  blockId: string;
  block: string;
  street: string;
  flatType: string;
}>;

export type SingaporeCheckRecord =
  | UraPrivateSaleCheckRecord
  | HdbResaleCheckRecord
  | HdbRentCheckRecord;

export type SingaporeCheckArtifact<TMarket extends SingaporeCheckMarket = SingaporeCheckMarket> =
  Readonly<{
    version: typeof SINGAPORE_CHECK_ARTIFACT_VERSION;
    market: TMarket;
    sourceIdentifier: string;
    generatedAt: string;
    period: Readonly<{ from: string; to: string }>;
    recordCount: number;
    records: readonly Extract<SingaporeCheckRecord, { market: TMarket }>[];
    digest: string;
  }>;

const ARTIFACT_KEYS = [
  'version', 'market', 'sourceIdentifier', 'generatedAt', 'period', 'recordCount', 'records', 'digest',
] as const;
const PERIOD_KEYS = ['from', 'to'] as const;
const RECORD_KEYS = Object.freeze({
  'ura-private-sale': [
    'market', 'month', 'amountSgd', 'marketSegment', 'projectId', 'project', 'propertyType',
    'district', 'floorAreaSqm', 'floorRange', 'tenure', 'saleType', 'psf',
  ],
  'hdb-resale': [
    'market', 'month', 'amountSgd', 'town', 'blockId', 'block', 'street', 'flatType',
    'storeyRange', 'floorAreaSqm', 'remainingLease', 'flatModel',
  ],
  'hdb-rent': [
    'market', 'month', 'amountSgd', 'town', 'blockId', 'block', 'street', 'flatType',
  ],
} as const);

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function validMonth(value: unknown): value is string {
  return typeof value === 'string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(value);
}

function validText(value: unknown): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && !/[\u0000-\u001f\u007f]/.test(value);
}

function validAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function invalidRecord(): never {
  throw new Error('Singapore Check record is invalid.');
}

function normalizedRecord(value: unknown, market: SingaporeCheckMarket): SingaporeCheckRecord {
  if (!exactKeys(value, RECORD_KEYS[market])
    || value.market !== market
    || !validMonth(value.month)
    || !validAmount(value.amountSgd)) invalidRecord();

  if (market === 'ura-private-sale') {
    if (!['CCR', 'RCR', 'OCR'].includes(String(value.marketSegment))
      || !validText(value.projectId)
      || !validText(value.project)
      || !validText(value.propertyType)
      || !validText(value.district)
      || !validAmount(value.floorAreaSqm)
      || !validText(value.floorRange)
      || !validText(value.tenure)
      || !validText(value.saleType)
      || !validAmount(value.psf)) invalidRecord();
    return Object.freeze({
      market,
      month: value.month,
      amountSgd: value.amountSgd,
      marketSegment: value.marketSegment as UraPrivateSaleCheckRecord['marketSegment'],
      projectId: value.projectId,
      project: value.project,
      propertyType: value.propertyType,
      district: value.district,
      floorAreaSqm: value.floorAreaSqm,
      floorRange: value.floorRange,
      tenure: value.tenure,
      saleType: value.saleType,
      psf: value.psf,
    });
  }

  if (!validText(value.town)
    || !validText(value.blockId)
    || !validText(value.block)
    || !validText(value.street)
    || !validText(value.flatType)) invalidRecord();

  if (market === 'hdb-resale') {
    if (!validText(value.storeyRange)
      || !validAmount(value.floorAreaSqm)
      || !validText(value.remainingLease)
      || !validText(value.flatModel)) invalidRecord();
    return Object.freeze({
      market,
      month: value.month,
      amountSgd: value.amountSgd,
      town: value.town,
      blockId: value.blockId,
      block: value.block,
      street: value.street,
      flatType: value.flatType,
      storeyRange: value.storeyRange,
      floorAreaSqm: value.floorAreaSqm,
      remainingLease: value.remainingLease,
      flatModel: value.flatModel,
    });
  }

  return Object.freeze({
    market,
    month: value.month,
    amountSgd: value.amountSgd,
    town: value.town,
    blockId: value.blockId,
    block: value.block,
    street: value.street,
    flatType: value.flatType,
  });
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function validGeneratedAt(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

export function buildSingaporeCheckArtifact<TMarket extends SingaporeCheckMarket>(input: Readonly<{
  market: TMarket;
  sourceIdentifier: string;
  generatedAt: string;
  records: readonly Extract<SingaporeCheckRecord, { market: TMarket }>[];
}>): SingaporeCheckArtifact<TMarket> {
  if (!SINGAPORE_CHECK_MARKETS.includes(input.market)
    || !validText(input.sourceIdentifier)
    || !validGeneratedAt(input.generatedAt)
    || !Array.isArray(input.records)
    || input.records.length === 0) {
    throw new Error('Singapore Check artifact input is invalid.');
  }
  const records = input.records
    .map((record) => normalizedRecord(record, input.market) as Extract<
      SingaporeCheckRecord,
      { market: TMarket }
    >)
    .sort((left, right) => right.month.localeCompare(left.month)
      || left.amountSgd - right.amountSgd
      || canonicalJson(left).localeCompare(canonicalJson(right), 'en'));
  const months = records.map(({ month }) => month).sort();
  const unsigned = {
    version: SINGAPORE_CHECK_ARTIFACT_VERSION,
    market: input.market,
    sourceIdentifier: input.sourceIdentifier.trim(),
    generatedAt: input.generatedAt,
    period: Object.freeze({ from: months[0]!, to: months.at(-1)! }),
    recordCount: records.length,
    records: Object.freeze(records),
  } as const;
  return deepFreeze({ ...unsigned, digest: digest(unsigned) });
}

export function stringifySingaporeCheckArtifact(
  artifact: SingaporeCheckArtifact,
): string {
  return `${canonicalJson(artifact)}\n`;
}

export function parseSingaporeCheckArtifact<TMarket extends SingaporeCheckMarket>(
  serialized: string,
  expectedMarket: TMarket,
): SingaporeCheckArtifact<TMarket> {
  let value: unknown;
  try { value = JSON.parse(serialized); } catch {
    throw new Error('Singapore Check artifact is invalid.');
  }
  if (!exactKeys(value, ARTIFACT_KEYS) || typeof value.digest !== 'string') {
    throw new Error('Singapore Check artifact is invalid.');
  }
  const { digest: actualDigest, ...unsigned } = value;
  if (actualDigest !== digest(unsigned)) {
    throw new Error('Singapore Check artifact digest is invalid.');
  }
  if (value.market !== expectedMarket) {
    throw new Error('Singapore Check artifact market does not match.');
  }
  if (value.version !== SINGAPORE_CHECK_ARTIFACT_VERSION
    || !validText(value.sourceIdentifier)
    || !validGeneratedAt(value.generatedAt)
    || !exactKeys(value.period, PERIOD_KEYS)
    || !validMonth(value.period.from)
    || !validMonth(value.period.to)
    || !Number.isSafeInteger(value.recordCount)
    || !Array.isArray(value.records)
    || value.records.length === 0
    || value.recordCount !== value.records.length) {
    throw new Error('Singapore Check artifact is invalid.');
  }
  const records = value.records.map((record) => normalizedRecord(record, expectedMarket)) as unknown as readonly Extract<
    SingaporeCheckRecord,
    { market: TMarket }
  >[];
  const months = records.map(({ month }) => month).sort();
  if (value.period.from !== months[0] || value.period.to !== months.at(-1)) {
    throw new Error('Singapore Check artifact period is invalid.');
  }
  return deepFreeze(value as SingaporeCheckArtifact<TMarket>);
}

export function singaporeLatestCompletedMonth(generatedAt: string): string {
  if (!validGeneratedAt(generatedAt)) {
    throw new Error('Singapore Check generated time is invalid.');
  }
  const singaporeInstant = new Date(Date.parse(generatedAt) + 8 * 60 * 60 * 1_000);
  const currentMonth = singaporeInstant.getUTCFullYear() * 12 + singaporeInstant.getUTCMonth();
  const completedMonth = currentMonth - 1;
  const year = Math.floor(completedMonth / 12);
  const month = completedMonth % 12 + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function buildUraPrivateSaleCheckArtifact(
  snapshot: SingaporeSnapshot,
): SingaporeCheckArtifact<'ura-private-sale'> {
  const completedThrough = singaporeLatestCompletedMonth(snapshot.generatedAt);
  return buildSingaporeCheckArtifact({
    market: 'ura-private-sale',
    sourceIdentifier: 'URA private residential transactions',
    generatedAt: snapshot.generatedAt,
    records: snapshot.records.filter((record) => (
      record.contractMonth.slice(0, 7) <= completedThrough
    )).map((record) => ({
      market: 'ura-private-sale',
      month: record.contractMonth.slice(0, 7),
      amountSgd: record.priceSgd,
      marketSegment: record.marketSegment,
      projectId: record.projectId,
      project: record.project,
      propertyType: record.propertyType,
      district: record.district,
      floorAreaSqm: record.areaSqm,
      floorRange: record.floorRange,
      tenure: record.tenure,
      saleType: record.saleType,
      psf: record.psf,
    })),
  });
}

export function buildHdbResaleCheckArtifact(
  snapshot: HdbSnapshot,
): SingaporeCheckArtifact<'hdb-resale'> {
  const completedThrough = singaporeLatestCompletedMonth(snapshot.generatedAt);
  return buildSingaporeCheckArtifact({
    market: 'hdb-resale',
    sourceIdentifier: 'HDB resale transactions',
    generatedAt: snapshot.generatedAt,
    records: snapshot.resale.filter((record) => record.month <= completedThrough).map((record) => ({
      market: 'hdb-resale',
      month: record.month,
      amountSgd: record.resalePriceSgd,
      town: record.town,
      blockId: record.blockId,
      block: record.block,
      street: record.street,
      flatType: record.flatType,
      storeyRange: record.storeyRange,
      floorAreaSqm: record.floorAreaSqm,
      remainingLease: record.remainingLease,
      flatModel: record.flatModel,
    })),
  });
}

export function buildHdbRentCheckArtifact(
  snapshot: HdbSnapshot,
): SingaporeCheckArtifact<'hdb-rent'> {
  const completedThrough = singaporeLatestCompletedMonth(snapshot.generatedAt);
  return buildSingaporeCheckArtifact({
    market: 'hdb-rent',
    sourceIdentifier: 'HDB rental approvals',
    generatedAt: snapshot.generatedAt,
    records: snapshot.rental.filter((record) => (
      record.approvalMonth <= completedThrough
    )).map((record) => ({
      market: 'hdb-rent',
      month: record.approvalMonth,
      amountSgd: record.monthlyRentSgd,
      town: record.town,
      blockId: record.blockId,
      block: record.block,
      street: record.street,
      flatType: record.flatType,
    })),
  });
}
