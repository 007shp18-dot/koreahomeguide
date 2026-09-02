import { createHash } from 'node:crypto';

export const HDB_SNAPSHOT_VERSION = 'signedprice-singapore-hdb-v1' as const;
export const HDB_PUBLICATION_MINIMUM = 5 as const;
export const HDB_SOURCE_DATASETS = Object.freeze({
  resale: 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc',
  rental: 'd_c9f57187485a850908655db0e8cfe651',
  property: 'd_17f5382f26140b1fdae0ba2ef6239d2f',
} as const);

const RESALE_HEADER = [
  'month', 'town', 'flat_type', 'block', 'street_name', 'storey_range',
  'floor_area_sqm', 'flat_model', 'lease_commence_date', 'remaining_lease',
  'resale_price',
] as const;
const RENTAL_HEADER = [
  'rent_approval_date', 'town', 'block', 'street_name', 'flat_type', 'monthly_rent',
] as const;
const PROPERTY_HEADER = [
  'blk_no', 'street', 'max_floor_lvl', 'year_completed', 'residential', 'commercial',
  'market_hawker', 'miscellaneous', 'multistorey_carpark', 'precinct_pavilion',
  'bldg_contract_town', 'total_dwelling_units', '1room_sold', '2room_sold',
  '3room_sold', '4room_sold', '5room_sold', 'exec_sold', 'multigen_sold',
  'studio_apartment_sold', '1room_rental', '2room_rental', '3room_rental',
  'other_room_rental',
] as const;

export type HdbResaleRecord = Readonly<{
  month: string;
  town: string;
  flatType: string;
  block: string;
  street: string;
  storeyRange: string;
  floorAreaSqm: number;
  flatModel: string;
  leaseCommenceYear: number;
  remainingLease: string;
  resalePriceSgd: number;
  sourceRow: number;
}>;

export type HdbRentalRecord = Readonly<{
  approvalMonth: string;
  town: string;
  block: string;
  street: string;
  flatType: string;
  monthlyRentSgd: number;
  sourceRow: number;
}>;

export type HdbPropertyRecord = Readonly<{
  block: string;
  street: string;
  maxFloorLevel: number;
  yearCompleted: number;
  residential: boolean;
  commercial: boolean;
  marketHawker: boolean;
  miscellaneous: boolean;
  multistoreyCarpark: boolean;
  precinctPavilion: boolean;
  townCode: string;
  totalDwellingUnits: number;
  oneRoomSold: number;
  twoRoomSold: number;
  threeRoomSold: number;
  fourRoomSold: number;
  fiveRoomSold: number;
  executiveSold: number;
  multigenSold: number;
  studioApartmentSold: number;
  oneRoomRental: number;
  twoRoomRental: number;
  threeRoomRental: number;
  otherRoomRental: number;
  sourceRow: number;
}>;

type WithBlockId<T> = T & Readonly<{ blockId: string }>;

export type HdbSnapshot = Readonly<{
  version: typeof HDB_SNAPSHOT_VERSION;
  generatedAt: string;
  publicationMinimum: typeof HDB_PUBLICATION_MINIMUM;
  sourceDatasets: typeof HDB_SOURCE_DATASETS;
  periods: Readonly<{ resale: string; rental: string; propertyThrough: '2025-12' }>;
  totals: Readonly<{ resale: number; rental: number; properties: number; sourceRows: number }>;
  resale: readonly WithBlockId<HdbResaleRecord>[];
  rental: readonly WithBlockId<HdbRentalRecord>[];
  properties: readonly WithBlockId<HdbPropertyRecord>[];
  digest: string;
}>;

export const HDB_PUBLISHED_SNAPSHOT_VERSION = 'signedprice-singapore-hdb-published-v1' as const;
export type HdbPublishedDistribution = Readonly<{ n: number; medianSgd: number | null }>;
export type HdbPublishedTown = Readonly<{
  town: string;
  resale: HdbPublishedDistribution;
  rental: HdbPublishedDistribution;
}>;
export type HdbPublishedBlock = Readonly<{
  blockId: string;
  town: string;
  block: string;
  street: string;
  resale: HdbPublishedDistribution;
  rental: HdbPublishedDistribution;
  property: WithBlockId<HdbPropertyRecord> | null;
}>;
export type HdbPublishedSnapshot = Readonly<{
  version: typeof HDB_PUBLISHED_SNAPSHOT_VERSION;
  generatedAt: string;
  publicationMinimum: typeof HDB_PUBLICATION_MINIMUM;
  sourceDatasets: typeof HDB_SOURCE_DATASETS;
  periods: HdbSnapshot['periods'];
  totals: HdbSnapshot['totals'];
  towns: readonly HdbPublishedTown[];
  blocks: readonly HdbPublishedBlock[];
  digest: string;
}>;

function invalid(): never {
  throw new Error('HDB source schema is invalid.');
}

function csvRows(input: string): readonly (readonly string[])[] {
  if (input.startsWith('\ufeff')) input = input.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      if (field !== '') invalid();
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) invalid();
  if (field !== '' || row.length > 0) {
    row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
    rows.push(row);
  }
  if (rows.length < 2) invalid();
  return rows;
}

function records(input: string, header: readonly string[]): readonly (readonly string[])[] {
  const rows = csvRows(input);
  if (rows[0]?.length !== header.length
    || rows[0]?.some((value, index) => value !== header[index])) invalid();
  const values = rows.slice(1);
  while (values.at(-1)?.length === 1 && values.at(-1)?.[0] === '') values.pop();
  if (values.length === 0 || values.some((row) => row.length !== header.length)) invalid();
  return values;
}

function text(value: string): string {
  if (/[\u0000-\u001f\u007f]/.test(value)) invalid();
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized === '') invalid();
  return normalized;
}

function month(value: string): string {
  const normalized = text(value);
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(normalized)) invalid();
  return normalized;
}

function integer(value: string, minimum: number): number {
  const normalized = text(value);
  if (!/^\d+$/.test(normalized)) invalid();
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) invalid();
  return parsed;
}

function decimal(value: string): number {
  const normalized = text(value);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)) invalid();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) invalid();
  return parsed;
}

function flag(value: string): boolean {
  if (value === 'Y') return true;
  if (value === 'N') return false;
  invalid();
}

export function parseHdbResaleCsv(input: string): readonly HdbResaleRecord[] {
  return Object.freeze(records(input, RESALE_HEADER).map((row, index) => Object.freeze({
    month: month(row[0]!),
    town: text(row[1]!),
    flatType: text(row[2]!),
    block: text(row[3]!),
    street: text(row[4]!),
    storeyRange: text(row[5]!),
    floorAreaSqm: decimal(row[6]!),
    flatModel: text(row[7]!),
    leaseCommenceYear: integer(row[8]!, 1900),
    remainingLease: text(row[9]!),
    resalePriceSgd: decimal(row[10]!),
    sourceRow: index + 2,
  })));
}

export function parseHdbRentalCsv(input: string): readonly HdbRentalRecord[] {
  return Object.freeze(records(input, RENTAL_HEADER).map((row, index) => Object.freeze({
    approvalMonth: month(row[0]!),
    town: text(row[1]!),
    block: text(row[2]!),
    street: text(row[3]!),
    flatType: text(row[4]!),
    monthlyRentSgd: integer(row[5]!, 1),
    sourceRow: index + 2,
  })));
}

export function parseHdbPropertyCsv(input: string): readonly HdbPropertyRecord[] {
  return Object.freeze(records(input, PROPERTY_HEADER).map((row, index) => Object.freeze({
    block: text(row[0]!),
    street: text(row[1]!),
    maxFloorLevel: integer(row[2]!, 0),
    yearCompleted: integer(row[3]!, 1900),
    residential: flag(row[4]!),
    commercial: flag(row[5]!),
    marketHawker: flag(row[6]!),
    miscellaneous: flag(row[7]!),
    multistoreyCarpark: flag(row[8]!),
    precinctPavilion: flag(row[9]!),
    townCode: text(row[10]!),
    totalDwellingUnits: integer(row[11]!, 0),
    oneRoomSold: integer(row[12]!, 0),
    twoRoomSold: integer(row[13]!, 0),
    threeRoomSold: integer(row[14]!, 0),
    fourRoomSold: integer(row[15]!, 0),
    fiveRoomSold: integer(row[16]!, 0),
    executiveSold: integer(row[17]!, 0),
    multigenSold: integer(row[18]!, 0),
    studioApartmentSold: integer(row[19]!, 0),
    oneRoomRental: integer(row[20]!, 0),
    twoRoomRental: integer(row[21]!, 0),
    threeRoomRental: integer(row[22]!, 0),
    otherRoomRental: integer(row[23]!, 0),
    sourceRow: index + 2,
  })));
}

function canonicalText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('en-SG');
}

export function buildHdbBlockId(block: string, street: string): string {
  return createHash('sha256').update(`HDB|${canonicalText(block)}|${canonicalText(street)}`).digest('hex');
}

function period(values: readonly string[]): string {
  if (values.length === 0) throw new Error('HDB snapshot input is invalid.');
  const sorted = [...values].sort();
  return `${sorted[0]}/${sorted.at(-1)}`;
}

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

export function buildHdbSnapshot(input: Readonly<{
  resale: readonly HdbResaleRecord[];
  rental: readonly HdbRentalRecord[];
  properties: readonly HdbPropertyRecord[];
  generatedAt: string;
}>): HdbSnapshot {
  if (!Number.isFinite(Date.parse(input.generatedAt))
    || input.resale.length === 0
    || input.rental.length === 0
    || input.properties.length === 0) throw new Error('HDB snapshot input is invalid.');
  const withId = <T extends { block: string; street: string }>(value: T): WithBlockId<T> => ({
    ...value,
    blockId: buildHdbBlockId(value.block, value.street),
  });
  const resale = input.resale.map(withId).sort((left, right) => (
    right.month.localeCompare(left.month) || left.blockId.localeCompare(right.blockId)
      || left.sourceRow - right.sourceRow
  ));
  const rental = input.rental.map(withId).sort((left, right) => (
    right.approvalMonth.localeCompare(left.approvalMonth) || left.blockId.localeCompare(right.blockId)
      || left.sourceRow - right.sourceRow
  ));
  const properties = input.properties.map(withId).sort((left, right) => (
    left.blockId.localeCompare(right.blockId) || left.sourceRow - right.sourceRow
  ));
  const totals = {
    resale: resale.length,
    rental: rental.length,
    properties: properties.length,
    sourceRows: resale.length + rental.length + properties.length,
  };
  const unsigned = {
    version: HDB_SNAPSHOT_VERSION,
    generatedAt: new Date(input.generatedAt).toISOString(),
    publicationMinimum: HDB_PUBLICATION_MINIMUM,
    sourceDatasets: HDB_SOURCE_DATASETS,
    periods: {
      resale: period(resale.map(({ month: value }) => value)),
      rental: period(rental.map(({ approvalMonth }) => approvalMonth)),
      propertyThrough: '2025-12' as const,
    },
    totals,
    resale,
    rental,
    properties,
  } as const;
  return deepFreeze({
    ...unsigned,
    digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  });
}

export function stringifyHdbSnapshot(snapshot: HdbSnapshot): string {
  return `${canonicalJson(snapshot)}\n`;
}

export function parseHdbSnapshot(input: string): HdbSnapshot {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new Error('HDB snapshot is invalid.');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('HDB snapshot is invalid.');
  }
  const snapshot = value as Partial<HdbSnapshot>;
  const digest = snapshot.digest;
  if (typeof digest !== 'string') throw new Error('HDB snapshot is invalid.');
  const { digest: _digest, ...unsigned } = snapshot;
  const expected = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');
  if (digest !== expected) throw new Error('HDB snapshot digest is invalid.');
  if (snapshot.version !== HDB_SNAPSHOT_VERSION
    || snapshot.publicationMinimum !== HDB_PUBLICATION_MINIMUM
    || !Array.isArray(snapshot.resale)
    || !Array.isArray(snapshot.rental)
    || !Array.isArray(snapshot.properties)
    || snapshot.totals?.resale !== snapshot.resale.length
    || snapshot.totals?.rental !== snapshot.rental.length
    || snapshot.totals?.properties !== snapshot.properties.length
    || snapshot.totals?.sourceRows !== snapshot.resale.length
      + snapshot.rental.length + snapshot.properties.length) {
    throw new Error('HDB snapshot is invalid.');
  }
  return deepFreeze(value as HdbSnapshot);
}

function publishedDistribution(values: readonly number[]): HdbPublishedDistribution {
  if (values.length < HDB_PUBLICATION_MINIMUM) return Object.freeze({ n: values.length, medianSgd: null });
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const medianSgd = sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
  return Object.freeze({ n: values.length, medianSgd });
}

export function buildHdbPublishedSnapshot(snapshot: HdbSnapshot): HdbPublishedSnapshot {
  type Accumulator = { town: string; block: string; street: string; resale: number[]; rental: number[] };
  const towns = new Map<string, { resale: number[]; rental: number[] }>();
  const blocks = new Map<string, Accumulator>();
  const town = (name: string) => {
    const current = towns.get(name);
    if (current !== undefined) return current;
    const next = { resale: [], rental: [] };
    towns.set(name, next);
    return next;
  };
  const block = (record: { blockId: string; town: string; block: string; street: string }) => {
    const current = blocks.get(record.blockId);
    if (current !== undefined) return current;
    const next = { town: record.town, block: record.block, street: record.street, resale: [], rental: [] };
    blocks.set(record.blockId, next);
    return next;
  };
  for (const record of snapshot.resale) {
    town(record.town).resale.push(record.resalePriceSgd);
    block(record).resale.push(record.resalePriceSgd);
  }
  for (const record of snapshot.rental) {
    town(record.town).rental.push(record.monthlyRentSgd);
    block(record).rental.push(record.monthlyRentSgd);
  }
  const properties = new Map(snapshot.properties.map((record) => [record.blockId, record]));
  const unsigned = {
    version: HDB_PUBLISHED_SNAPSHOT_VERSION,
    generatedAt: snapshot.generatedAt,
    publicationMinimum: snapshot.publicationMinimum,
    sourceDatasets: snapshot.sourceDatasets,
    periods: snapshot.periods,
    totals: snapshot.totals,
    towns: [...towns.entries()].map(([name, values]) => ({
      town: name, resale: publishedDistribution(values.resale), rental: publishedDistribution(values.rental),
    })).sort((left, right) => left.town.localeCompare(right.town)),
    blocks: [...blocks.entries()].map(([blockId, values]) => ({
      blockId, town: values.town, block: values.block, street: values.street,
      resale: publishedDistribution(values.resale), rental: publishedDistribution(values.rental),
      property: properties.get(blockId) ?? null,
    })).sort((left, right) => left.town.localeCompare(right.town)
      || left.street.localeCompare(right.street) || left.block.localeCompare(right.block)),
  } as const;
  return deepFreeze({
    ...unsigned,
    digest: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  });
}

export function stringifyHdbPublishedSnapshot(snapshot: HdbPublishedSnapshot): string {
  return `${canonicalJson(snapshot)}\n`;
}

export function parseHdbPublishedSnapshot(input: string): HdbPublishedSnapshot {
  const value = JSON.parse(input) as Partial<HdbPublishedSnapshot>;
  const { digest, ...unsigned } = value;
  if (value.version !== HDB_PUBLISHED_SNAPSHOT_VERSION
    || typeof digest !== 'string'
    || !Array.isArray(value.towns)
    || !Array.isArray(value.blocks)
    || digest !== createHash('sha256').update(canonicalJson(unsigned)).digest('hex')) {
    throw new Error('HDB published snapshot is invalid.');
  }
  return deepFreeze(value as HdbPublishedSnapshot);
}
