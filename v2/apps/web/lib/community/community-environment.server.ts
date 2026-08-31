import 'server-only';

import { createCommunityService, type CommunityService } from './community-service.server';
import { createCommunityRepository } from './community-repository.server';
import type { CommunityRateLimitPort } from './community-rate-limit.server';
import type { CommunitySqlPort } from './community-sql-port.server';
import type { PublicAreaSummaryRepository } from '../public-market/area-summary-repository.server';
import { createPublicAreaSummaryRepository } from '../public-market/area-summary-repository.server';
import type { PublicBuildingRepository } from '../public-market/building-summary-repository.server';
import { publicBuildingRepositoryFromEnvironment } from '../public-market/building-summary-repository.server';
import { SIGNEDPRICE_ORIGIN } from '../public-metadata';

export type CommunityConfigurationCode =
  | 'storage_not_configured'
  | 'identity_not_configured'
  | 'rate_limit_not_configured';

export type CommunityEnvironment =
  | Readonly<{ state: 'unavailable'; code: CommunityConfigurationCode }>
  | Readonly<{ state: 'ready'; service: CommunityService }>;

export type CommunityEnvironmentDependencies = Readonly<{
  sqlPort?: CommunitySqlPort;
  rateLimit?: CommunityRateLimitPort;
  areaRepository?: PublicAreaSummaryRepository | null;
  buildingRepository?: PublicBuildingRepository | null;
  identitySecret?: string;
  networkSecret?: string;
  allowedOrigin?: string;
}>;

function areaRepositoryFromEnvironment(): PublicAreaSummaryRepository | null {
  const serialized = process.env.SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT;
  const period = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '';
  try {
    return createPublicAreaSummaryRepository({
      source: serialized === undefined ? undefined : JSON.parse(serialized),
      expected: { marketId: 'kr-seoul', period },
    });
  } catch {
    return null;
  }
}

export function createCommunityEnvironment(
  dependencies: CommunityEnvironmentDependencies = {},
): CommunityEnvironment {
  if (dependencies.sqlPort === undefined) {
    return Object.freeze({ state: 'unavailable', code: 'storage_not_configured' });
  }
  const identitySecret = dependencies.identitySecret ??
    process.env.SIGNEDPRICE_COMMUNITY_IDENTITY_SECRET;
  const networkSecret = dependencies.networkSecret ??
    process.env.SIGNEDPRICE_COMMUNITY_NETWORK_SECRET;
  if (
    identitySecret === undefined || identitySecret.length < 32 ||
    networkSecret === undefined || networkSecret.length < 32
  ) {
    return Object.freeze({ state: 'unavailable', code: 'identity_not_configured' });
  }
  if (dependencies.rateLimit === undefined) {
    return Object.freeze({ state: 'unavailable', code: 'rate_limit_not_configured' });
  }
  const area = dependencies.areaRepository === undefined
    ? areaRepositoryFromEnvironment()
    : dependencies.areaRepository;
  const building = dependencies.buildingRepository === undefined
    ? publicBuildingRepositoryFromEnvironment()
    : dependencies.buildingRepository;
  return Object.freeze({
    state: 'ready',
    service: createCommunityService({
      repository: createCommunityRepository(dependencies.sqlPort),
      rateLimit: dependencies.rateLimit,
      evidenceRepositories: Object.freeze({ area, building }),
      allowedOrigin: dependencies.allowedOrigin ?? SIGNEDPRICE_ORIGIN,
      identitySecret,
      networkSecret,
    }),
  });
}
