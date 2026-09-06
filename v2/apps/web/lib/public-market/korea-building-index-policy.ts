import type {
  KoreaEvidenceTransaction,
  KoreaRentEvidenceBuildingRecord,
  KoreaSaleEvidenceBuildingRecord,
} from '@signedprice/korea-rent';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

export const KOREA_BUILDING_INDEX_MINIMUM = 5;
export const KOREA_BUILDING_PRERENDER_MINIMUM = 50;

export type KoreaBuildingRouteParam = Readonly<{
  district: SeoulDistrictSlug;
  buildingId: string;
}>;

export type KoreaBuildingCanonicalSelection = Readonly<{
  transaction: KoreaEvidenceTransaction | 'sale';
  area: 'all';
  contractType?: 'all';
}>;

export type KoreaBuildingEvidenceRecordPair = Readonly<{
  rent?: KoreaRentEvidenceBuildingRecord;
  sale?: KoreaSaleEvidenceBuildingRecord;
}>;

export type KoreaBuildingEvidenceRecords = Readonly<{
  rent: readonly KoreaRentEvidenceBuildingRecord[];
  sale: readonly KoreaSaleEvidenceBuildingRecord[];
}>;

export type KoreaBuildingDirectoryEntry = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  name: string;
  neighborhoodName: string;
  contracts: number;
  href: string;
}>;

type PublishedCandidate = Readonly<{
  transaction: KoreaEvidenceTransaction | 'sale';
  contracts: number;
}>;

type KoreaBuildingPublicationIndex = Readonly<{
  pairs: readonly KoreaBuildingEvidenceRecordPair[];
  derivedByMinimum: Map<number, Readonly<{
    routeParams: readonly KoreaBuildingRouteParam[];
    directoryByDistrict: ReadonlyMap<SeoulDistrictSlug, readonly KoreaBuildingDirectoryEntry[]>;
  }>>;
}>;

const publicationIndexCache = new WeakMap<
  readonly KoreaRentEvidenceBuildingRecord[],
  WeakMap<readonly KoreaSaleEvidenceBuildingRecord[], KoreaBuildingPublicationIndex>
>();
const EMPTY_BUILDING_DIRECTORY = Object.freeze([]) as readonly KoreaBuildingDirectoryEntry[];

function publishedCandidates(
  records: KoreaBuildingEvidenceRecordPair,
): readonly PublishedCandidate[] {
  const rent = records.rent?.cohorts.flatMap((cohort) => (
    cohort.areaBand === 'all'
    && cohort.contractGroup === 'all'
    && cohort.primary.published
      ? [Object.freeze({ transaction: cohort.transaction, contracts: cohort.primary.n })]
      : []
  )) ?? [];
  const sale = records.sale?.cohorts.flatMap((cohort) => (
    cohort.areaBand === 'all' && cohort.price.published
      ? [Object.freeze({ transaction: 'sale' as const, contracts: cohort.price.n })]
      : []
  )) ?? [];
  return Object.freeze([...rent, ...sale]);
}

export function koreaBuildingEvidenceDepth(
  records: KoreaBuildingEvidenceRecordPair,
): number {
  return publishedCandidates(records).reduce(
    (depth, candidate) => Math.max(depth, candidate.contracts),
    0,
  );
}

export function koreaBuildingCanonicalSelection(
  records: KoreaBuildingEvidenceRecordPair,
): KoreaBuildingCanonicalSelection | null {
  const candidate = [...publishedCandidates(records)].sort((left, right) => (
    right.contracts - left.contracts
    || left.transaction.localeCompare(right.transaction)
  ))[0];
  return candidate === undefined ? null : Object.freeze({
    transaction: candidate.transaction,
    area: 'all',
    ...(candidate.transaction === 'sale' ? {} : { contractType: 'all' as const }),
  });
}

export function isKoreaBuildingIndexable(
  records: KoreaBuildingEvidenceRecordPair,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): boolean {
  return koreaBuildingEvidenceDepth(records) >= minimum;
}

function buildingPublicationIndex(
  records: KoreaBuildingEvidenceRecords,
): KoreaBuildingPublicationIndex {
  const cached = publicationIndexCache.get(records.rent)?.get(records.sale);
  if (cached !== undefined) return cached;
  const pairs = new Map<string, {
    rent?: KoreaRentEvidenceBuildingRecord;
    sale?: KoreaSaleEvidenceBuildingRecord;
  }>();
  for (const rent of records.rent) {
    pairs.set(`${rent.districtSlug}/${rent.buildingId}`, { rent });
  }
  for (const sale of records.sale) {
    const key = `${sale.districtSlug}/${sale.buildingId}`;
    pairs.set(key, { ...pairs.get(key), sale });
  }
  const index = Object.freeze({
    pairs: Object.freeze([...pairs.values()].map((pair) => Object.freeze(pair))),
    derivedByMinimum: new Map(),
  });
  let bySale = publicationIndexCache.get(records.rent);
  if (bySale === undefined) {
    bySale = new WeakMap();
    publicationIndexCache.set(records.rent, bySale);
  }
  bySale.set(records.sale, index);
  return index;
}

function derivedBuildingPublication(
  records: KoreaBuildingEvidenceRecords,
  minimum: number,
) {
  const index = buildingPublicationIndex(records);
  const cached = index.derivedByMinimum.get(minimum);
  if (cached !== undefined) return cached;
  const routeParams: KoreaBuildingRouteParam[] = [];
  const directory = new Map<SeoulDistrictSlug, KoreaBuildingDirectoryEntry[]>();
  for (const pair of index.pairs) {
    if (!isKoreaBuildingIndexable(pair, minimum)) continue;
    const identity = pair.rent ?? pair.sale;
    if (identity === undefined) throw new TypeError('Building evidence identity is missing.');
    routeParams.push(Object.freeze({
      district: identity.districtSlug,
      buildingId: identity.buildingId,
    }));
    const entries = directory.get(identity.districtSlug) ?? [];
    entries.push(Object.freeze({
      buildingId: identity.buildingId,
      districtSlug: identity.districtSlug,
      name: identity.officialName,
      neighborhoodName: identity.neighborhoodName,
      contracts: koreaBuildingEvidenceDepth(pair),
      href: `/kr/seoul/explore/${identity.districtSlug}/${identity.buildingId}/`,
    }));
    directory.set(identity.districtSlug, entries);
  }
  routeParams.sort((left, right) => (
    left.district.localeCompare(right.district)
    || left.buildingId.localeCompare(right.buildingId)
  ));
  const directoryByDistrict = new Map([...directory].map(([district, entries]) => {
    entries.sort((left, right) => (
      right.contracts - left.contracts
      || left.name.localeCompare(right.name, 'ko-KR')
      || left.buildingId.localeCompare(right.buildingId)
    ));
    return [district, Object.freeze(entries)] as const;
  }));
  const derived = Object.freeze({
    routeParams: Object.freeze(routeParams),
    directoryByDistrict,
  });
  index.derivedByMinimum.set(minimum, derived);
  return derived;
}

export function listIndexableKoreaBuildingRouteParams(
  records: KoreaBuildingEvidenceRecords,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): readonly KoreaBuildingRouteParam[] {
  return derivedBuildingPublication(records, minimum).routeParams;
}

export function listPrerenderedKoreaBuildingRouteParams(
  records: KoreaBuildingEvidenceRecords,
): readonly KoreaBuildingRouteParam[] {
  return listIndexableKoreaBuildingRouteParams(records, KOREA_BUILDING_PRERENDER_MINIMUM);
}

export function listKoreaBuildingDirectory(
  records: KoreaBuildingEvidenceRecords,
  districtSlug: SeoulDistrictSlug,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): readonly KoreaBuildingDirectoryEntry[] {
  return derivedBuildingPublication(records, minimum).directoryByDistrict.get(districtSlug)
    ?? EMPTY_BUILDING_DIRECTORY;
}
