import 'server-only';

import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';
import installedBuildingArtifact from '../../data/public-building-summary.json';

import {
  parsePublicBuildingSummaryArtifact,
  type PublicBuildingArtifactExpectation,
  type PublicBuildingRecord,
} from './building-summary-schema';

export type PublicBuildingRouteParam = Readonly<{
  district: SeoulDistrictSlug;
  buildingId: string;
}>;

export type PublicBuildingArtifactContext = Readonly<{
  generatedAt: string;
  provider: 'MOLIT';
  dataset: 'reported rent contracts';
  period: string;
  rightsPolicyId: 'kr-molit-rent-v1';
  exclusions: readonly string[];
}>;

export type PublicBuildingRepository = Readonly<{
  listByDistrict(slug: SeoulDistrictSlug): readonly PublicBuildingRecord[];
  getById(districtSlug: SeoulDistrictSlug, buildingId: string): PublicBuildingRecord;
  listRouteParams(): readonly PublicBuildingRouteParam[];
  getContext(): PublicBuildingArtifactContext;
}>;

export class PublicBuildingSummaryUnavailableError extends Error {
  readonly code = 'public_building_summary_unavailable' as const;

  constructor() {
    super('Verified public building summary is unavailable.');
    this.name = 'PublicBuildingSummaryUnavailableError';
  }
}

export function createPublicBuildingRepository(input: Readonly<{
  source: unknown;
  expected: PublicBuildingArtifactExpectation;
}>): PublicBuildingRepository {
  try {
    const artifact = parsePublicBuildingSummaryArtifact(input.source, input.expected);
    const published = Object.freeze(artifact.records.filter(({ overall }) => overall.published));
    const byIdentity = new Map(published.map((record) => [
      `${record.districtSlug}/${record.buildingId}`,
      record,
    ] as const));
    const routeParams = Object.freeze(published.map(({ districtSlug, buildingId }) => Object.freeze({
      district: districtSlug,
      buildingId,
    })));
    const context = Object.freeze({
      generatedAt: artifact.generatedAt,
      provider: artifact.provider,
      dataset: artifact.dataset,
      period: artifact.period,
      rightsPolicyId: artifact.rightsPolicyId,
      exclusions: artifact.exclusions,
    });
    return Object.freeze({
      listByDistrict(slug: SeoulDistrictSlug): readonly PublicBuildingRecord[] {
        return Object.freeze(published.filter(({ districtSlug }) => districtSlug === slug));
      },
      getById(districtSlug: SeoulDistrictSlug, buildingId: string): PublicBuildingRecord {
        const record = byIdentity.get(`${districtSlug}/${buildingId}`);
        if (record === undefined) throw new PublicBuildingSummaryUnavailableError();
        return record;
      },
      listRouteParams(): readonly PublicBuildingRouteParam[] {
        return routeParams;
      },
      getContext(): PublicBuildingArtifactContext {
        return context;
      },
    });
  } catch (error) {
    if (error instanceof PublicBuildingSummaryUnavailableError) throw error;
    throw new PublicBuildingSummaryUnavailableError();
  }
}

let cachedEnvironment: Readonly<{
  serialized: string | undefined;
  period: string;
  repository: PublicBuildingRepository | null;
}> | null = null;

export function publicBuildingRepositoryFromEnvironment(): PublicBuildingRepository | null {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT;
  const period = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '';
  const cached = cachedEnvironment;
  if (cached !== null && cached.serialized === serialized && cached.period === period) {
    return cached.repository;
  }
  let repository: PublicBuildingRepository | null = null;
  try {
    let source = serialized === undefined ? undefined : JSON.parse(serialized);
    if (
      process.env.NODE_ENV !== 'test'
      && (
        typeof source !== 'object' || source === null
        || (source as { artifactVersion?: unknown }).artifactVersion
          !== 'signedprice-public-building-summary-v2'
      )
    ) source = installedBuildingArtifact;
    repository = createPublicBuildingRepository({
      source,
      expected: { marketId: 'kr-seoul', period },
    });
  } catch {
    repository = null;
  }
  cachedEnvironment = Object.freeze({ serialized, period, repository });
  return repository;
}
