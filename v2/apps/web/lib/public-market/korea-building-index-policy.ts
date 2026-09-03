import type { KoreaRentEvidenceBuildingRecord } from '@signedprice/korea-rent';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

/**
 * Which Seoul building pages are offered to search engines.
 *
 * Every observed building already renders; this decides which ones carry
 * `index` and appear in the sitemap. The gate is evidence depth, because a
 * building page is only worth a search result when it can say something no
 * other page can - and that is exactly what a deep published cohort is.
 *
 * The minimum is a publication wave control, not a correctness threshold.
 * Measured against the installed artifact (2026-02/2026-08):
 *
 *     n >=  50    804 buildings   median 16 published cohorts per page
 *     n >=  30  1,407
 *     n >=  20  2,097 buildings   median 12 published cohorts per page
 *     n >=  10  4,018 buildings   median  7 published cohorts per page
 *     n >=   5  7,687
 *
 * Lowering it opens the next wave. Do that one step at a time and only after
 * the previous wave holds its indexed share, so a drop can be attributed.
 */
export const KOREA_BUILDING_INDEX_MINIMUM = 50;

export type KoreaBuildingRouteParam = Readonly<{
  district: SeoulDistrictSlug;
  buildingId: string;
}>;

/**
 * Contracts behind the building's widest published cohort.
 *
 * Cohorts are split by transaction, so a building can be deep in monthly rent
 * and shallow in jeonse. The widest published one is taken rather than a sum:
 * summing would double-count the same contracts across overlapping cohorts and
 * overstate how much the page can actually show.
 */
export function koreaBuildingEvidenceDepth(
  record: KoreaRentEvidenceBuildingRecord,
): number {
  let depth = 0;
  for (const cohort of record.cohorts) {
    if (cohort.areaBand !== 'all' || cohort.contractGroup !== 'all') continue;
    if (!cohort.primary.published) continue;
    if (cohort.primary.n > depth) depth = cohort.primary.n;
  }
  return depth;
}

export function isKoreaBuildingIndexable(
  record: KoreaRentEvidenceBuildingRecord,
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): boolean {
  return koreaBuildingEvidenceDepth(record) >= minimum;
}

/**
 * Route parameters for every building that passes the gate, in a stable order
 * so the sitemap and the prerender list do not churn between builds.
 */
export function listIndexableKoreaBuildingRouteParams(
  records: readonly KoreaRentEvidenceBuildingRecord[],
  minimum: number = KOREA_BUILDING_INDEX_MINIMUM,
): readonly KoreaBuildingRouteParam[] {
  return Object.freeze(records
    .filter((record) => isKoreaBuildingIndexable(record, minimum))
    .map((record) => Object.freeze({
      district: record.districtSlug,
      buildingId: record.buildingId,
    }))
    .sort((left, right) => (
      left.district.localeCompare(right.district)
      || left.buildingId.localeCompare(right.buildingId)
    )));
}
