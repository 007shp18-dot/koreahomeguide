import type {
  KoreaEvidenceTransaction,
  KoreaRentEvidenceBuildingRecord,
  KoreaSaleEvidenceBuildingRecord,
} from '@signedprice/korea-rent';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

export const KOREA_BUILDING_INDEX_MINIMUM = 3;
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

export type KoreaNeighborhoodRouteParam = Readonly<{
  district: SeoulDistrictSlug;
  neighborhoodId: string;
}>;

export type KoreaNeighborhoodDirectoryEntry = Readonly<{
  neighborhoodId: string;
  name: string;
  buildings: number;
  href: string;
}>;

export type KoreaNeighborhoodBuildingDirectory = Readonly<{
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  name: string;
  entries: readonly KoreaBuildingDirectoryEntry[];
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
    neighborhoodRouteParams: readonly KoreaNeighborhoodRouteParam[];
    neighborhoodDirectoryByDistrict: ReadonlyMap<SeoulDistrictSlug, readonly KoreaNeighborhoodDirectoryEntry[]>;
    buildingDirectoryByNeighborhood: ReadonlyMap<string, KoreaNeighborhoodBuildingDirectory>;
  }>>;
}>;

const publicationIndexCache = new WeakMap<
  readonly KoreaRentEvidenceBuildingRecord[],
  WeakMap<readonly KoreaSaleEvidenceBuildingRecord[], KoreaBuildingPublicationIndex>
>();
const EMPTY_BUILDING_DIRECTORY = Object.freeze([]) as readonly KoreaBuildingDirectoryEntry[];
const EMPTY_NEIGHBORHOOD_DIRECTORY = Object.freeze([]) as readonly KoreaNeighborhoodDirectoryEntry[];

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

// Search eligibility is based on usable transaction history, independently of
// the five-contract minimum used to publish statistical price summaries.
function historyCandidates(records: KoreaBuildingEvidenceRecordPair): readonly PublishedCandidate[] {
  return [
    { transaction: 'sale', contracts: records.sale?.recentSales.length ?? 0 },
    ...(['jeonse', 'monthly'] as const).map((transaction) => ({
      transaction,
      contracts: records.rent?.recentTransactions.filter((row) => row.transaction === transaction).length ?? 0,
    })),
  ];
}

export function koreaBuildingSearchDepth(records: KoreaBuildingEvidenceRecordPair): number {
  return Math.max(koreaBuildingEvidenceDepth(records), ...historyCandidates(records).map(({ contracts }) => contracts));
}

export function koreaBuildingCanonicalSelection(
  records: KoreaBuildingEvidenceRecordPair,
): KoreaBuildingCanonicalSelection | null {
  const published = publishedCandidates(records);
  const candidate = [...(published.length > 0 ? published : historyCandidates(records).filter(({ contracts }) => contracts > 0))].sort((left, right) => (
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
  const identity = records.rent ?? records.sale;
  return identity !== undefined
    && identity.officialName.trim().length > 0
    && identity.neighborhoodName.trim().length > 0
    && koreaBuildingSearchDepth(records) >= minimum;
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
  const neighborhoods = new Map<string, {
    districtSlug: SeoulDistrictSlug;
    neighborhoodId: string;
    name: string;
    entries: KoreaBuildingDirectoryEntry[];
  }>();
  for (const pair of index.pairs) {
    if (!isKoreaBuildingIndexable(pair, minimum)) continue;
    const identity = pair.rent ?? pair.sale;
    if (identity === undefined) throw new TypeError('Building evidence identity is missing.');
    routeParams.push(Object.freeze({
      district: identity.districtSlug,
      buildingId: identity.buildingId,
    }));
    const entries = directory.get(identity.districtSlug) ?? [];
    const entry = Object.freeze({
      buildingId: identity.buildingId,
      districtSlug: identity.districtSlug,
      name: identity.officialName,
      neighborhoodName: identity.neighborhoodName,
      contracts: koreaBuildingSearchDepth(pair),
      href: `/kr/seoul/explore/${identity.districtSlug}/${identity.buildingId}/`,
    });
    entries.push(entry);
    directory.set(identity.districtSlug, entries);
    const neighborhoodKey = `${identity.districtSlug}/${identity.neighborhoodId}`;
    const neighborhood = neighborhoods.get(neighborhoodKey) ?? {
      districtSlug: identity.districtSlug,
      neighborhoodId: identity.neighborhoodId,
      name: identity.neighborhoodName,
      entries: [],
    };
    neighborhood.entries.push(entry);
    neighborhoods.set(neighborhoodKey, neighborhood);
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
  const neighborhoodRouteParams: KoreaNeighborhoodRouteParam[] = [];
  const neighborhoodDirectory = new Map<SeoulDistrictSlug, KoreaNeighborhoodDirectoryEntry[]>();
  const buildingDirectoryByNeighborhood = new Map<string, KoreaNeighborhoodBuildingDirectory>();
  for (const [key, neighborhood] of neighborhoods) {
    neighborhood.entries.sort((left, right) => (
      right.contracts - left.contracts
      || left.name.localeCompare(right.name, 'ko-KR')
      || left.buildingId.localeCompare(right.buildingId)
    ));
    neighborhoodRouteParams.push(Object.freeze({
      district: neighborhood.districtSlug,
      neighborhoodId: neighborhood.neighborhoodId,
    }));
    const districtNeighborhoods = neighborhoodDirectory.get(neighborhood.districtSlug) ?? [];
    districtNeighborhoods.push(Object.freeze({
      neighborhoodId: neighborhood.neighborhoodId,
      name: neighborhood.name,
      buildings: neighborhood.entries.length,
      href: `/kr/seoul/explore/${neighborhood.districtSlug}/neighborhood/${neighborhood.neighborhoodId}/`,
    }));
    neighborhoodDirectory.set(neighborhood.districtSlug, districtNeighborhoods);
    buildingDirectoryByNeighborhood.set(key, Object.freeze({
      districtSlug: neighborhood.districtSlug,
      neighborhoodId: neighborhood.neighborhoodId,
      name: neighborhood.name,
      entries: Object.freeze(neighborhood.entries),
    }));
  }
  neighborhoodRouteParams.sort((left, right) => (
    left.district.localeCompare(right.district)
    || left.neighborhoodId.localeCompare(right.neighborhoodId)
  ));
  const neighborhoodDirectoryByDistrict = new Map([...neighborhoodDirectory].map(([district, entries]) => {
    entries.sort((left, right) => (
      left.name.localeCompare(right.name, 'ko-KR')
      || left.neighborhoodId.localeCompare(right.neighborhoodId)
    ));
    return [district, Object.freeze(entries)] as const;
  }));
  const derived = Object.freeze({
    routeParams: Object.freeze(routeParams),
    directoryByDistrict,
    neighborhoodRouteParams: Object.freeze(neighborhoodRouteParams),
    neighborhoodDirectoryByDistrict,
    buildingDirectoryByNeighborhood,
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

export function listIndexableKoreaNeighborhoodRouteParams(
  records: KoreaBuildingEvidenceRecords,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): readonly KoreaNeighborhoodRouteParam[] {
  return derivedBuildingPublication(records, minimum).neighborhoodRouteParams;
}

export function listKoreaNeighborhoodDirectory(
  records: KoreaBuildingEvidenceRecords,
  districtSlug: SeoulDistrictSlug,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): readonly KoreaNeighborhoodDirectoryEntry[] {
  return derivedBuildingPublication(records, minimum).neighborhoodDirectoryByDistrict.get(districtSlug)
    ?? EMPTY_NEIGHBORHOOD_DIRECTORY;
}

export function getKoreaNeighborhoodBuildingDirectory(
  records: KoreaBuildingEvidenceRecords,
  districtSlug: SeoulDistrictSlug,
  neighborhoodId: string,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): KoreaNeighborhoodBuildingDirectory | null {
  return derivedBuildingPublication(records, minimum).buildingDirectoryByNeighborhood.get(
    `${districtSlug}/${neighborhoodId}`,
  ) ?? null;
}
