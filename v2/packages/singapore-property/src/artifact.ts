import { createHash } from 'node:crypto';

import { SINGAPORE_MARKET_SEGMENTS, type SingaporeMarketSegment } from './browser.ts';
import {
  SG_URA_PRIVATE_SALE_RIGHTS,
  type UraRightsDecision,
} from './rights.ts';
import type { UraPrivateSaleTransaction } from './ura-transaction.ts';

export const SINGAPORE_SNAPSHOT_VERSION = 'signedprice-singapore-private-sale-v1' as const;
export const SINGAPORE_PUBLICATION_MINIMUM = 5 as const;

export type SingaporePublicationRights = Readonly<{
  operations: Readonly<{
    aggregate: UraRightsDecision;
    display: UraRightsDecision;
  }>;
}>;

export type SingaporeSnapshotRecord = UraPrivateSaleTransaction & Readonly<{
  projectId: string;
  psf: number;
}>;

export type SingaporePublishedSummary =
  | Readonly<{
      n: number;
      published: true;
      reason: null;
      medianPriceSgd: number;
      p25PriceSgd: number;
      p75PriceSgd: number;
      medianPsf: number;
      p25Psf: number;
      p75Psf: number;
    }>
  | Readonly<{
      n: number;
      published: false;
      reason: 'minimum_sample_not_met';
      medianPriceSgd: null;
      p25PriceSgd: null;
      p75PriceSgd: null;
      medianPsf: null;
      p25Psf: null;
      p75Psf: null;
    }>;

export type SingaporeSegmentSummary = SingaporePublishedSummary & Readonly<{
  segment: SingaporeMarketSegment;
  projects: number;
}>;

export type SingaporeProjectSummary = SingaporePublishedSummary & Readonly<{
  id: string;
  project: string;
  street: string;
  district: string;
  marketSegment: SingaporeMarketSegment;
  propertyTypes: readonly SingaporeSnapshotRecord['propertyType'][];
  saleTypes: readonly SingaporeSnapshotRecord['saleType'][];
  tenures: readonly string[];
}>;

export type SingaporeSnapshot = Readonly<{
  version: typeof SINGAPORE_SNAPSHOT_VERSION;
  generatedAt: string;
  period: Readonly<{ from: string; to: string }>;
  publicationMinimum: typeof SINGAPORE_PUBLICATION_MINIMUM;
  sourceBatches: readonly [1, 2, 3, 4];
  totals: Readonly<{ projects: number; transactions: number; excluded: number }>;
  segments: readonly SingaporeSegmentSummary[];
  projects: readonly SingaporeProjectSummary[];
  records: readonly SingaporeSnapshotRecord[];
  digest: string;
}>;

type BuildSnapshotOptions = Readonly<{
  records: readonly UraPrivateSaleTransaction[];
  generatedAt: string;
  rights?: SingaporePublicationRights;
}>;

export function assertSingaporePublicationRights(rights: SingaporePublicationRights): void {
  if (rights.operations.aggregate !== 'allowed' || rights.operations.display !== 'allowed') {
    throw new Error('Singapore snapshot publication rights are not confirmed.');
  }
}

export function toSquareFeet(areaSqm: number): number {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) throw new Error('Singapore area is invalid.');
  return areaSqm * 10.763910416709722;
}

export function calculatePsf(priceSgd: number, areaSqm: number): number {
  if (!Number.isSafeInteger(priceSgd) || priceSgd <= 0) throw new Error('Singapore price is invalid.');
  return Math.round(priceSgd / toSquareFeet(areaSqm));
}

function canonicalText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-SG');
}

export function buildSingaporeProjectId(record: Pick<
  UraPrivateSaleTransaction,
  'marketSegment' | 'district' | 'project' | 'street'
>): string {
  const identity = [record.marketSegment, record.district, record.project, record.street]
    .map(canonicalText)
    .join('|');
  return createHash('sha256').update(identity).digest('hex');
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`;
}

function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) throw new Error('Singapore percentile requires observations.');
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = sorted[lower]!;
  const upperValue = sorted[upper]!;
  return lowerValue + (upperValue - lowerValue) * (position - lower);
}

function summary(records: readonly SingaporeSnapshotRecord[]): SingaporePublishedSummary {
  const published = records.length >= SINGAPORE_PUBLICATION_MINIMUM;
  if (!published) return Object.freeze({
    n: records.length,
    published: false,
    reason: 'minimum_sample_not_met',
    medianPriceSgd: null,
    p25PriceSgd: null,
    p75PriceSgd: null,
    medianPsf: null,
    p25Psf: null,
    p75Psf: null,
  });
  const prices = records.map(({ priceSgd }) => priceSgd);
  const psf = records.map((record) => record.psf);
  return Object.freeze({
    n: records.length,
    published: true,
    reason: null,
    medianPriceSgd: percentile(prices, 0.5),
    p25PriceSgd: percentile(prices, 0.25),
    p75PriceSgd: percentile(prices, 0.75),
    medianPsf: percentile(psf, 0.5),
    p25Psf: percentile(psf, 0.25),
    p75Psf: percentile(psf, 0.75),
  });
}

function compareRecords(left: SingaporeSnapshotRecord, right: SingaporeSnapshotRecord): number {
  return right.contractMonth.localeCompare(left.contractMonth)
    || SINGAPORE_MARKET_SEGMENTS.indexOf(left.marketSegment)
      - SINGAPORE_MARKET_SEGMENTS.indexOf(right.marketSegment)
    || left.district.localeCompare(right.district, 'en', { numeric: true })
    || canonicalText(left.project).localeCompare(canonicalText(right.project), 'en')
    || canonicalText(left.street).localeCompare(canonicalText(right.street), 'en')
    || left.areaSqm - right.areaSqm
    || left.priceSgd - right.priceSgd
    || left.saleType.localeCompare(right.saleType, 'en')
    || left.sourceOrder.batch - right.sourceOrder.batch
    || left.sourceOrder.project - right.sourceOrder.project
    || left.sourceOrder.transaction - right.sourceOrder.transaction;
}

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right, 'en')));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}

export function buildSingaporeSnapshot(options: BuildSnapshotOptions): SingaporeSnapshot {
  const rights = options.rights ?? SG_URA_PRIVATE_SALE_RIGHTS;
  assertSingaporePublicationRights(rights);
  if (!Number.isFinite(Date.parse(options.generatedAt)) || options.records.length === 0) {
    throw new Error('Singapore snapshot input is invalid.');
  }
  const batches = new Set(options.records.map(({ sourceOrder }) => sourceOrder.batch));
  if ([1, 2, 3, 4].some((batch) => !batches.has(batch))) {
    throw new Error('Singapore snapshot requires four complete batches.');
  }

  const records = Object.freeze(options.records.map((record) => Object.freeze({
    ...record,
    sourceOrder: Object.freeze({ ...record.sourceOrder }),
    projectId: buildSingaporeProjectId(record),
    psf: calculatePsf(record.priceSgd, record.areaSqm),
  })).sort(compareRecords));
  const projectGroups = new Map<string, SingaporeSnapshotRecord[]>();
  for (const record of records) {
    const group = projectGroups.get(record.projectId) ?? [];
    group.push(record);
    projectGroups.set(record.projectId, group);
  }
  const projects = Object.freeze([...projectGroups.entries()].map(([id, group]) => {
    const first = group[0]!;
    return Object.freeze({
      id,
      project: first.project,
      street: first.street,
      district: first.district,
      marketSegment: first.marketSegment,
      ...summary(group),
      propertyTypes: uniqueSorted(group.map(({ propertyType }) => propertyType)),
      saleTypes: uniqueSorted(group.map(({ saleType }) => saleType)),
      tenures: uniqueSorted(group.map(({ tenure }) => tenure)),
    });
  }).sort((left, right) => SINGAPORE_MARKET_SEGMENTS.indexOf(left.marketSegment)
    - SINGAPORE_MARKET_SEGMENTS.indexOf(right.marketSegment)
    || canonicalText(left.project).localeCompare(canonicalText(right.project), 'en')
    || left.id.localeCompare(right.id, 'en')));
  const segments = Object.freeze(SINGAPORE_MARKET_SEGMENTS.map((segment) => {
    const group = records.filter((record) => record.marketSegment === segment);
    return Object.freeze({
      segment,
      projects: new Set(group.map(({ projectId }) => projectId)).size,
      ...summary(group),
    });
  }));
  const months = records.map(({ contractMonth }) => contractMonth.slice(0, 7)).sort();
  const unsigned = {
    version: SINGAPORE_SNAPSHOT_VERSION,
    generatedAt: new Date(options.generatedAt).toISOString(),
    period: Object.freeze({ from: months[0]!, to: months.at(-1)! }),
    publicationMinimum: SINGAPORE_PUBLICATION_MINIMUM,
    sourceBatches: Object.freeze([1, 2, 3, 4] as const),
    totals: Object.freeze({ projects: projects.length, transactions: records.length, excluded: 0 }),
    segments,
    projects,
    records,
  } as const;
  return deepFreeze({
    ...unsigned,
    digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  });
}

export function stringifySingaporeSnapshot(snapshot: SingaporeSnapshot): string {
  return `${canonicalJson(snapshot)}\n`;
}

function snapshotObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Singapore snapshot is invalid.');
  }
  return value as Record<string, unknown>;
}

export function parseSingaporeSnapshot(payload: string): SingaporeSnapshot {
  let value: unknown;
  try { value = JSON.parse(payload); } catch { throw new Error('Singapore snapshot is invalid.'); }
  const object = snapshotObject(value);
  const digest = object.digest;
  if (typeof digest !== 'string') throw new Error('Singapore snapshot is invalid.');
  const { digest: _digest, ...unsigned } = object;
  const expected = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');
  if (digest !== expected) throw new Error('Singapore snapshot digest is invalid.');
  if (object.version !== SINGAPORE_SNAPSHOT_VERSION
    || !Array.isArray(object.records)
    || !Array.isArray(object.projects)
    || !Array.isArray(object.segments)
    || canonicalJson(object.sourceBatches) !== '[1,2,3,4]') {
    throw new Error('Singapore snapshot is invalid.');
  }
  return deepFreeze(value as SingaporeSnapshot);
}
