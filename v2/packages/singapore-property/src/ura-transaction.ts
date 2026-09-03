import type {
  SingaporeAreaBasis,
  SingaporeMarketSegment,
  SingaporePropertyType,
  SingaporeSaleType,
} from './browser.ts';

const ENVELOPE_KEYS = ['Message', 'Result', 'Status'] as const;
const PROJECT_KEYS = ['marketSegment', 'project', 'street', 'transaction', 'x', 'y'] as const;
const PROJECT_KEYS_WITHOUT_COORDINATES = ['marketSegment', 'project', 'street', 'transaction'] as const;
const TRANSACTION_KEYS = [
  'area',
  'contractDate',
  'district',
  'floorRange',
  'noOfUnits',
  'price',
  'propertyType',
  'tenure',
  'typeOfArea',
  'typeOfSale',
] as const;
const TRANSACTION_KEYS_WITH_NETT_PRICE = [...TRANSACTION_KEYS, 'nettPrice'] as const;

const SEGMENTS: Readonly<Record<string, SingaporeMarketSegment>> = Object.freeze({
  CCR: 'CCR', RCR: 'RCR', OCR: 'OCR',
});
const SALE_TYPES: Readonly<Record<string, SingaporeSaleType>> = Object.freeze({
  '1': 'new_sale', '2': 'sub_sale', '3': 'resale',
});
const PROPERTY_TYPES: Readonly<Record<string, SingaporePropertyType>> = Object.freeze({
  Apartment: 'apartment',
  Condominium: 'condominium',
  'Executive Condominium': 'executive_condominium',
  Detached: 'detached',
  'Semi-detached': 'semi_detached',
  Terrace: 'terrace',
  'Strata Detached': 'strata_detached',
  'Strata Semi-detached': 'strata_semi_detached',
  'Strata Terrace': 'strata_terrace',
});
const AREA_BASES: Readonly<Record<string, SingaporeAreaBasis>> = Object.freeze({
  Strata: 'strata', Land: 'land',
});

export type UraSourceOrder = Readonly<{
  batch: number;
  project: number;
  transaction: number;
}>;

export type UraPrivateSaleTransaction = Readonly<{
  project: string;
  street: string;
  x: number | null;
  y: number | null;
  marketSegment: SingaporeMarketSegment;
  areaSqm: number;
  floorRange: string;
  units: number;
  contractDate: string;
  contractMonth: string;
  saleType: SingaporeSaleType;
  priceSgd: number;
  netPriceSgd: number | null;
  propertyType: SingaporePropertyType;
  district: string;
  areaBasis: SingaporeAreaBasis;
  tenure: string;
  sourceOrder: UraSourceOrder;
}>;

function invalid(): never {
  throw new Error('URA transaction schema is invalid.');
}

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid();
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) invalid();
  return record;
}

function exactObjectVariant(value: unknown, variants: readonly (readonly string[])[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid();
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const matches = variants.some((keys) => {
    const expected = [...keys].sort();
    return actual.length === expected.length
      && actual.every((key, index) => key === expected[index]);
  });
  if (!matches) invalid();
  return record;
}

function text(value: unknown, allowEmpty = false): string {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) invalid();
  const trimmed = value.trim();
  if (!allowEmpty && trimmed.length === 0) invalid();
  return trimmed;
}

function positiveDecimal(value: unknown): number {
  const source = text(value);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(source)) invalid();
  const parsed = Number(source);
  if (!Number.isFinite(parsed) || parsed <= 0) invalid();
  return parsed;
}

function finiteDecimal(value: unknown): number {
  const source = text(value);
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(source)) invalid();
  const parsed = Number(source);
  if (!Number.isFinite(parsed)) invalid();
  return parsed;
}

function positiveInteger(value: unknown): number {
  const source = text(value);
  if (!/^[1-9]\d*$/.test(source)) invalid();
  const parsed = Number(source);
  if (!Number.isSafeInteger(parsed)) invalid();
  return parsed;
}

function enumValue<T extends string>(value: unknown, values: Readonly<Record<string, T>>): T {
  const mapped = values[text(value)];
  if (mapped === undefined) invalid();
  return mapped;
}

function contractMonth(value: unknown): { source: string; iso: string } {
  const source = text(value);
  const match = /^(0[1-9]|1[0-2])(\d{2})$/.exec(source);
  if (!match) invalid();
  return { source, iso: `20${match[2]}-${match[1]}-01` };
}

export function parseUraPrivateSaleEnvelope(
  value: unknown,
  batch: number,
): readonly UraPrivateSaleTransaction[] {
  if (!Number.isInteger(batch) || batch < 1 || batch > 4) invalid();
  const envelope = exactObject(value, ENVELOPE_KEYS);
  if (text(envelope.Status) !== 'Success') invalid();
  text(envelope.Message, true);
  if (!Array.isArray(envelope.Result) || envelope.Result.length === 0) invalid();

  const output: UraPrivateSaleTransaction[] = [];
  envelope.Result.forEach((projectValue, projectIndex) => {
    const project = exactObjectVariant(projectValue, [
      PROJECT_KEYS,
      PROJECT_KEYS_WITHOUT_COORDINATES,
    ]);
    const projectName = text(project.project);
    const street = text(project.street);
    const hasCoordinates = 'x' in project && 'y' in project;
    const x = hasCoordinates ? finiteDecimal(project.x) : null;
    const y = hasCoordinates ? finiteDecimal(project.y) : null;
    const marketSegment = enumValue(project.marketSegment, SEGMENTS);
    if (!Array.isArray(project.transaction) || project.transaction.length === 0) invalid();

    project.transaction.forEach((transactionValue, transactionIndex) => {
      const transaction = exactObjectVariant(transactionValue, [
        TRANSACTION_KEYS,
        TRANSACTION_KEYS_WITH_NETT_PRICE,
      ]);
      const month = contractMonth(transaction.contractDate);
      output.push(Object.freeze({
        project: projectName,
        street,
        x,
        y,
        marketSegment,
        areaSqm: positiveDecimal(transaction.area),
        floorRange: text(transaction.floorRange),
        units: positiveInteger(transaction.noOfUnits),
        contractDate: month.source,
        contractMonth: month.iso,
        saleType: enumValue(transaction.typeOfSale, SALE_TYPES),
        priceSgd: positiveInteger(transaction.price),
        netPriceSgd: 'nettPrice' in transaction
          ? positiveInteger(transaction.nettPrice)
          : null,
        propertyType: enumValue(transaction.propertyType, PROPERTY_TYPES),
        district: text(transaction.district),
        areaBasis: enumValue(transaction.typeOfArea, AREA_BASES),
        tenure: text(transaction.tenure),
        sourceOrder: Object.freeze({ batch, project: projectIndex, transaction: transactionIndex }),
      }));
    });
  });
  return Object.freeze(output);
}
