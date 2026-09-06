import { createHash } from 'node:crypto';

export const DUBAI_AREA_EVIDENCE_VERSION = 'signedprice-dubai-area-evidence-v1' as const;
export const DUBAI_AREA_SLUG_REGISTRY_VERSION = 'signedprice-dubai-area-slugs-v1' as const;
export const DUBAI_AREA_PUBLICATION_MINIMUM = 30 as const;

export type DubaiHousingSegment = 'apartment' | 'villa';
export type DubaiSaleStage = 'ready' | 'off-plan';

export type DubaiEvidenceDateRange = Readonly<{ from: string; to: string }>;

export type DubaiEvidenceRights = Readonly<{
  state: 'pending' | 'approved';
  canStore: boolean;
  canCreateDerived: boolean;
  canUseCommercially: boolean;
  canDisplay: boolean;
  canIndex: boolean;
  policyId: string;
  sourceUrl: string;
  licenseUrl: string | null;
  attribution: string;
  checkedAt: string;
  reviewedBy: string | null;
}>;

export type DubaiEvidencePublication = Readonly<{
  displayState: 'draft' | 'published' | 'stale' | 'withdrawn';
  indexState: 'noindex' | 'index';
}>;

export type DubaiUnitVerification = Readonly<{
  state: 'pending' | 'verified';
  currency: 'AED';
  currencyFields: readonly ['TRANS_VALUE', 'ANNUAL_AMOUNT'];
  area: 'sqm';
  areaField: 'ACTUAL_AREA';
  evidenceUrl: string | null;
  checkedAt: string | null;
  reviewedBy: string | null;
}>;

export type DubaiSaleDistribution = Readonly<{
  n: number;
  medianPriceAed: number;
  priceP25Aed: number;
  priceP75Aed: number;
  medianPricePerSqmAed: number;
  pricePerSqmP25Aed: number;
  pricePerSqmP75Aed: number;
}>;

export type DubaiRentDistribution = Readonly<{
  newN: number;
  renewedN: number;
  totalN: number;
  medianAnnualRentAed: number;
  medianAnnualRentPerSqmAed: number;
  newShare: number;
  renewedShare: number;
}>;

export type DubaiAreaSegmentEvidence = Readonly<{
  housing: DubaiHousingSegment;
  sales: Readonly<{
    ready: DubaiSaleDistribution | null;
    offPlan: DubaiSaleDistribution | null;
  }>;
  rent: DubaiRentDistribution;
  readyGrossYieldPct: number | null;
  comparableAreaIds: Readonly<{
    ready: readonly string[];
    offPlan: readonly string[];
  }>;
}>;

export type DubaiAreaEvidence = Readonly<{
  id: string;
  slug: string;
  name: string;
  searchAliases: readonly string[];
  segments: readonly DubaiAreaSegmentEvidence[];
}>;

export type DubaiAreaEvidenceSnapshot = Readonly<{
  version: typeof DUBAI_AREA_EVIDENCE_VERSION;
  slugRegistryVersion: typeof DUBAI_AREA_SLUG_REGISTRY_VERSION;
  marketId: 'ae-dubai';
  generatedAt: string;
  asOfDate: string;
  comparisonPeriod: DubaiEvidenceDateRange;
  sourcePeriods: Readonly<{
    transactions: DubaiEvidenceDateRange;
    rents: DubaiEvidenceDateRange;
  }>;
  units: Readonly<{
    currency: 'AED';
    currencyBasis: 'inferred-dld-reporting' | 'verified-source-schema';
    area: 'sqm';
    rentPeriod: 'year';
  }>;
  unitVerification: DubaiUnitVerification;
  rights: DubaiEvidenceRights;
  publication: DubaiEvidencePublication;
  publicationMinimum: typeof DUBAI_AREA_PUBLICATION_MINIMUM;
  sources: Readonly<{
    transactions: Readonly<{ sha256: string; rows: number }>;
    rents: Readonly<{ sha256: string; rows: number }>;
    lands: Readonly<{ sha256: string; rows: number }>;
  }>;
  totals: Readonly<{
    qualifyingSaleRows: number;
    mappedSaleRows: number;
    excludedSaleRows: number;
    unmappedSaleRows: number;
    qualifyingRentRows: number;
    excludedRentRows: number;
    unmappedRentRows: number;
    verifiedAliases: number;
    publishedAreas: number;
    publishedSegments: number;
  }>;
  areas: readonly DubaiAreaEvidence[];
  dataDigest: string;
}>;

const DATE = /^\d{4}-\d{2}-\d{2}$/u;
const DIGEST = /^[a-f0-9]{64}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function unavailable(): never {
  throw new Error('Dubai area evidence unavailable');
}

function record(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) unavailable();
  return value as Readonly<Record<string, unknown>>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') unavailable();
  return value;
}

function integer(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) unavailable();
  return value;
}

function number(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) unavailable();
  return value;
}

function date(value: unknown): string {
  if (typeof value !== 'string' || !DATE.test(value)) unavailable();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) unavailable();
  return value;
}

function instant(value: unknown): string {
  if (typeof value !== 'string') unavailable();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) unavailable();
  return value;
}

function httpsUrl(value: unknown): string {
  const candidate = text(value);
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') unavailable();
  } catch {
    unavailable();
  }
  return candidate;
}

function range(value: unknown): DubaiEvidenceDateRange {
  const candidate = record(value);
  const from = date(candidate.from);
  const to = date(candidate.to);
  if (from > to) unavailable();
  return Object.freeze({ from, to });
}

function source(value: unknown) {
  const candidate = record(value);
  if (typeof candidate.sha256 !== 'string' || !DIGEST.test(candidate.sha256)) unavailable();
  return Object.freeze({ sha256: candidate.sha256, rows: integer(candidate.rows) });
}

function rights(value: unknown): DubaiEvidenceRights {
  const candidate = record(value);
  if (candidate.state !== 'pending' && candidate.state !== 'approved') unavailable();
  const licenseUrl = candidate.licenseUrl === null ? null : httpsUrl(candidate.licenseUrl);
  const reviewedBy = candidate.reviewedBy === null ? null : text(candidate.reviewedBy);
  if (candidate.state === 'approved' && (licenseUrl === null || reviewedBy === null)) unavailable();
  if (candidate.state === 'pending' && reviewedBy !== null) unavailable();
  return Object.freeze({
    state: candidate.state,
    canStore: candidate.canStore === true,
    canCreateDerived: candidate.canCreateDerived === true,
    canUseCommercially: candidate.canUseCommercially === true,
    canDisplay: candidate.canDisplay === true,
    canIndex: candidate.canIndex === true,
    policyId: text(candidate.policyId),
    sourceUrl: httpsUrl(candidate.sourceUrl),
    licenseUrl,
    attribution: text(candidate.attribution),
    checkedAt: instant(candidate.checkedAt),
    reviewedBy,
  });
}

function unitVerification(value: unknown): DubaiUnitVerification {
  const candidate = record(value);
  if (candidate.state !== 'pending' && candidate.state !== 'verified') unavailable();
  if (candidate.currency !== 'AED' || candidate.area !== 'sqm'
    || candidate.areaField !== 'ACTUAL_AREA'
    || !Array.isArray(candidate.currencyFields)
    || candidate.currencyFields.length !== 2
    || candidate.currencyFields[0] !== 'TRANS_VALUE'
    || candidate.currencyFields[1] !== 'ANNUAL_AMOUNT') unavailable();
  if (candidate.state === 'pending') {
    if (candidate.evidenceUrl !== null || candidate.checkedAt !== null
      || candidate.reviewedBy !== null) unavailable();
    return Object.freeze({
      state: 'pending',
      currency: 'AED',
      currencyFields: Object.freeze(['TRANS_VALUE', 'ANNUAL_AMOUNT'] as const),
      area: 'sqm',
      areaField: 'ACTUAL_AREA',
      evidenceUrl: null,
      checkedAt: null,
      reviewedBy: null,
    });
  }
  return Object.freeze({
    state: 'verified',
    currency: 'AED',
    currencyFields: Object.freeze(['TRANS_VALUE', 'ANNUAL_AMOUNT'] as const),
    area: 'sqm',
    areaField: 'ACTUAL_AREA',
    evidenceUrl: httpsUrl(candidate.evidenceUrl),
    checkedAt: instant(candidate.checkedAt),
    reviewedBy: text(candidate.reviewedBy),
  });
}

function saleDistribution(value: unknown, minimum: number): DubaiSaleDistribution | null {
  if (value === null) return null;
  const candidate = record(value);
  const result = Object.freeze({
    n: integer(candidate.n, minimum),
    medianPriceAed: number(candidate.medianPriceAed, 1),
    priceP25Aed: number(candidate.priceP25Aed, 1),
    priceP75Aed: number(candidate.priceP75Aed, 1),
    medianPricePerSqmAed: number(candidate.medianPricePerSqmAed, 1),
    pricePerSqmP25Aed: number(candidate.pricePerSqmP25Aed, 1),
    pricePerSqmP75Aed: number(candidate.pricePerSqmP75Aed, 1),
  });
  if (result.priceP25Aed > result.medianPriceAed || result.medianPriceAed > result.priceP75Aed
    || result.pricePerSqmP25Aed > result.medianPricePerSqmAed
    || result.medianPricePerSqmAed > result.pricePerSqmP75Aed) unavailable();
  return result;
}

function rentDistribution(value: unknown, minimum: number): DubaiRentDistribution {
  const candidate = record(value);
  const newN = integer(candidate.newN, minimum);
  const renewedN = integer(candidate.renewedN);
  const totalN = integer(candidate.totalN, minimum);
  const newShare = number(candidate.newShare);
  const renewedShare = number(candidate.renewedShare);
  if (totalN !== newN + renewedN || newShare > 1 || renewedShare > 1
    || Math.abs(newShare + renewedShare - 1) > 0.000_001
    || Math.abs(newShare - newN / totalN) > 0.000_001) unavailable();
  return Object.freeze({
    newN,
    renewedN,
    totalN,
    medianAnnualRentAed: number(candidate.medianAnnualRentAed, 1),
    medianAnnualRentPerSqmAed: number(candidate.medianAnnualRentPerSqmAed, 1),
    newShare,
    renewedShare,
  });
}

function segment(value: unknown, minimum: number): DubaiAreaSegmentEvidence {
  const candidate = record(value);
  if (candidate.housing !== 'apartment' && candidate.housing !== 'villa') unavailable();
  const sales = record(candidate.sales);
  const ready = saleDistribution(sales.ready, minimum);
  const offPlan = saleDistribution(sales.offPlan, minimum);
  if (ready === null && offPlan === null) unavailable();
  const readyGrossYieldPct = candidate.readyGrossYieldPct === null
    ? null
    : number(candidate.readyGrossYieldPct, 0.01);
  if ((ready === null) !== (readyGrossYieldPct === null)) unavailable();
  const comparableValue = record(candidate.comparableAreaIds);
  const comparableAreaIds = Object.freeze({
    ready: comparableIds(comparableValue.ready, ready !== null),
    offPlan: comparableIds(comparableValue.offPlan, offPlan !== null),
  });
  return Object.freeze({
    housing: candidate.housing,
    sales: Object.freeze({ ready, offPlan }),
    rent: rentDistribution(candidate.rent, minimum),
    readyGrossYieldPct,
    comparableAreaIds,
  });
}

function comparableIds(value: unknown, stageAvailable: boolean): readonly string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) unavailable();
  if (new Set(value).size !== value.length || value.length > 3
    || (!stageAvailable && value.length !== 0)) unavailable();
  return Object.freeze([...value]);
}

function area(value: unknown, minimum: number): DubaiAreaEvidence {
  const candidate = record(value);
  const slug = text(candidate.slug);
  if (!SLUG.test(slug) || candidate.id !== `ae-dubai:area:${slug}`) unavailable();
  if (!Array.isArray(candidate.searchAliases) || candidate.searchAliases.length === 0
    || !candidate.searchAliases.every((item) => typeof item === 'string' && item.trim() !== '')) unavailable();
  const normalizedAliases = candidate.searchAliases.map((item) => item.trim().toLocaleLowerCase('en'));
  if (new Set(normalizedAliases).size !== normalizedAliases.length) unavailable();
  const name = text(candidate.name);
  if (!normalizedAliases.includes(name.trim().toLocaleLowerCase('en'))) unavailable();
  if (!Array.isArray(candidate.segments) || candidate.segments.length === 0) unavailable();
  const segments = candidate.segments.map((item) => segment(item, minimum));
  if (new Set(segments.map(({ housing }) => housing)).size !== segments.length) unavailable();
  return Object.freeze({
    id: candidate.id as string,
    slug,
    name,
    searchAliases: Object.freeze([...candidate.searchAliases]),
    segments: Object.freeze(segments),
  });
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) unavailable();
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const candidate = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(candidate).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(candidate[key])}`
  )).join(',')}}`;
}

export function calculateDubaiAreaEvidenceDataDigest(value: Pick<
  DubaiAreaEvidenceSnapshot,
  'slugRegistryVersion' | 'asOfDate' | 'comparisonPeriod' | 'sourcePeriods' | 'sources' | 'totals' | 'areas'
>): string {
  return createHash('sha256').update(canonicalJson({
    slugRegistryVersion: value.slugRegistryVersion,
    asOfDate: value.asOfDate,
    comparisonPeriod: value.comparisonPeriod,
    sourcePeriods: value.sourcePeriods,
    sources: value.sources,
    totals: value.totals,
    areas: value.areas,
  })).digest('hex');
}

export function parseDubaiAreaEvidence(value: unknown): DubaiAreaEvidenceSnapshot {
  try {
    const candidate = record(value);
    if (candidate.version !== DUBAI_AREA_EVIDENCE_VERSION || candidate.marketId !== 'ae-dubai'
      || candidate.slugRegistryVersion !== DUBAI_AREA_SLUG_REGISTRY_VERSION
      || candidate.publicationMinimum !== DUBAI_AREA_PUBLICATION_MINIMUM) unavailable();
    const generatedAt = instant(candidate.generatedAt);
    const asOfDate = date(candidate.asOfDate);
    const comparisonPeriod = range(candidate.comparisonPeriod);
    const sourcePeriodsValue = record(candidate.sourcePeriods);
    const sourcePeriods = Object.freeze({
      transactions: range(sourcePeriodsValue.transactions),
      rents: range(sourcePeriodsValue.rents),
    });
    if (comparisonPeriod.to !== asOfDate
      || comparisonPeriod.from < sourcePeriods.transactions.from
      || comparisonPeriod.from < sourcePeriods.rents.from
      || comparisonPeriod.to > sourcePeriods.transactions.to
      || comparisonPeriod.to > sourcePeriods.rents.to) unavailable();
    const comparisonDays = Math.round((Date.parse(`${comparisonPeriod.to}T00:00:00.000Z`)
      - Date.parse(`${comparisonPeriod.from}T00:00:00.000Z`)) / 86_400_000) + 1;
    if (comparisonDays !== 90) unavailable();
    const unitsValue = record(candidate.units);
    if (unitsValue.currency !== 'AED'
      || (unitsValue.currencyBasis !== 'inferred-dld-reporting'
        && unitsValue.currencyBasis !== 'verified-source-schema')
      || unitsValue.area !== 'sqm' || unitsValue.rentPeriod !== 'year') unavailable();
    const parsedUnitVerification = unitVerification(candidate.unitVerification);
    if ((parsedUnitVerification.state === 'pending'
      && unitsValue.currencyBasis !== 'inferred-dld-reporting')
      || (parsedUnitVerification.state === 'verified'
        && unitsValue.currencyBasis !== 'verified-source-schema')) unavailable();
    const parsedRights = rights(candidate.rights);
    const publicationValue = record(candidate.publication);
    if (!['draft', 'published', 'stale', 'withdrawn'].includes(String(publicationValue.displayState))
      || (publicationValue.indexState !== 'noindex' && publicationValue.indexState !== 'index')) unavailable();
    if (parsedRights.state === 'pending'
      && (parsedRights.canStore || parsedRights.canCreateDerived
        || parsedRights.canUseCommercially || parsedRights.canDisplay || parsedRights.canIndex
        || publicationValue.displayState !== 'draft'
        || publicationValue.indexState !== 'noindex')) unavailable();
    if (parsedUnitVerification.state === 'pending'
      && (publicationValue.displayState !== 'draft'
        || publicationValue.indexState !== 'noindex')) unavailable();
    if ((publicationValue.displayState === 'published' || publicationValue.displayState === 'stale')
      && (parsedRights.state !== 'approved' || parsedUnitVerification.state !== 'verified'
        || !parsedRights.canStore || !parsedRights.canCreateDerived
        || !parsedRights.canUseCommercially || !parsedRights.canDisplay)) unavailable();
    if (publicationValue.indexState === 'index'
      && (publicationValue.displayState !== 'published' || !parsedRights.canIndex)) unavailable();
    const publication = Object.freeze({
      displayState: publicationValue.displayState as DubaiEvidencePublication['displayState'],
      indexState: publicationValue.indexState,
    }) as DubaiEvidencePublication;
    const sourcesValue = record(candidate.sources);
    const sources = Object.freeze({
      transactions: source(sourcesValue.transactions),
      rents: source(sourcesValue.rents),
      lands: source(sourcesValue.lands),
    });
    const totalsValue = record(candidate.totals);
    const totals = Object.freeze({
      qualifyingSaleRows: integer(totalsValue.qualifyingSaleRows),
      mappedSaleRows: integer(totalsValue.mappedSaleRows),
      excludedSaleRows: integer(totalsValue.excludedSaleRows),
      unmappedSaleRows: integer(totalsValue.unmappedSaleRows),
      qualifyingRentRows: integer(totalsValue.qualifyingRentRows),
      excludedRentRows: integer(totalsValue.excludedRentRows),
      unmappedRentRows: integer(totalsValue.unmappedRentRows),
      verifiedAliases: integer(totalsValue.verifiedAliases),
      publishedAreas: integer(totalsValue.publishedAreas),
      publishedSegments: integer(totalsValue.publishedSegments),
    });
    if (totals.mappedSaleRows > totals.qualifyingSaleRows
      || totals.qualifyingSaleRows > sources.transactions.rows
      || totals.qualifyingRentRows > sources.rents.rows
      || totals.excludedSaleRows !== sources.transactions.rows - totals.qualifyingSaleRows
      || totals.unmappedSaleRows !== totals.qualifyingSaleRows - totals.mappedSaleRows
      || totals.excludedRentRows !== sources.rents.rows - totals.qualifyingRentRows
      || totals.unmappedRentRows > totals.qualifyingRentRows) unavailable();
    if (!Array.isArray(candidate.areas)) unavailable();
    const areas = candidate.areas.map((item) => area(item, DUBAI_AREA_PUBLICATION_MINIMUM));
    if (new Set(areas.map(({ id }) => id)).size !== areas.length
      || new Set(areas.map(({ slug }) => slug)).size !== areas.length
      || totals.publishedAreas !== areas.length
      || totals.publishedSegments !== areas.reduce((sum, item) => sum + item.segments.length, 0)) unavailable();
    const publishedSaleRows = areas.reduce((areaSum, item) => areaSum + item.segments.reduce(
      (segmentSum, itemSegment) => segmentSum
        + (itemSegment.sales.ready?.n ?? 0)
        + (itemSegment.sales.offPlan?.n ?? 0),
      0,
    ), 0);
    const publishedRentRows = areas.reduce((areaSum, item) => areaSum + item.segments.reduce(
      (segmentSum, itemSegment) => segmentSum + itemSegment.rent.totalN,
      0,
    ), 0);
    if (publishedSaleRows > totals.mappedSaleRows
      || publishedRentRows > totals.qualifyingRentRows - totals.unmappedRentRows) unavailable();
    const areasById = new Map(areas.map((item) => [item.id, item] as const));
    for (const item of areas) {
      for (const itemSegment of item.segments) {
        if (itemSegment.sales.ready !== null) {
          const expectedYield = itemSegment.rent.medianAnnualRentAed
            / itemSegment.sales.ready.medianPriceAed * 100;
          if (itemSegment.readyGrossYieldPct === null
            || Math.abs(itemSegment.readyGrossYieldPct - expectedYield) > 0.011) unavailable();
        }
        for (const comparableStage of ['ready', 'offPlan'] as const) {
          for (const comparableId of itemSegment.comparableAreaIds[comparableStage]) {
            const comparable = areasById.get(comparableId);
            if (comparable === undefined || comparableId === item.id
              || !comparable.segments.some(({ housing, sales }) => (
                housing === itemSegment.housing && sales[comparableStage] !== null
              ))) unavailable();
          }
        }
      }
    }
    if (typeof candidate.dataDigest !== 'string' || !DIGEST.test(candidate.dataDigest)) unavailable();
    const parsed = {
      version: DUBAI_AREA_EVIDENCE_VERSION,
      slugRegistryVersion: DUBAI_AREA_SLUG_REGISTRY_VERSION,
      marketId: 'ae-dubai',
      generatedAt,
      asOfDate,
      comparisonPeriod,
      sourcePeriods,
      units: Object.freeze({
        currency: 'AED',
        currencyBasis: unitsValue.currencyBasis,
        area: 'sqm',
        rentPeriod: 'year',
      }),
      unitVerification: parsedUnitVerification,
      rights: parsedRights,
      publication,
      publicationMinimum: DUBAI_AREA_PUBLICATION_MINIMUM,
      sources,
      totals,
      areas: Object.freeze(areas),
      dataDigest: candidate.dataDigest,
    } satisfies DubaiAreaEvidenceSnapshot;
    if (candidate.dataDigest !== calculateDubaiAreaEvidenceDataDigest(parsed)) unavailable();
    return deepFreeze(parsed);
  } catch (error) {
    if (error instanceof Error && error.message === 'Dubai area evidence unavailable') throw error;
    return unavailable();
  }
}
