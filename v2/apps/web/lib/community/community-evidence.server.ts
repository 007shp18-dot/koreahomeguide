import 'server-only';

import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';

import type {
  PublicAreaSummaryRepository,
  PublicContractGroup,
} from '../public-market/area-summary-repository.server';
import type { PublicBuildingRepository } from '../public-market/building-summary-repository.server';
import type { CommunityEvidenceScope } from './community-repository.server';

export type CommunityEvidenceRepositories = Readonly<{
  area: PublicAreaSummaryRepository | null;
  building: PublicBuildingRepository | null;
}>;

export class CommunityEvidenceScopeUnavailableError extends Error {
  readonly code = 'community_evidence_scope_unavailable' as const;

  constructor() {
    super('Community evidence scope is unavailable.');
    this.name = 'CommunityEvidenceScopeUnavailableError';
  }
}

const ROOT_KEYS = ['marketId', 'scopeType', 'scopeId', 'evidenceId'] as const;
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_EVIDENCE_ID = /^kr-seoul:[a-z0-9./:-]+$/;

function unavailable(): never {
  throw new CommunityEvidenceScopeUnavailableError();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequest(value: unknown): CommunityEvidenceScope {
  if (!isRecord(value)) unavailable();
  const keys = Object.keys(value);
  if (
    keys.length !== ROOT_KEYS.length ||
    !keys.every((key) => ROOT_KEYS.includes(key as (typeof ROOT_KEYS)[number])) ||
    value.marketId !== 'kr-seoul' ||
    (value.scopeType !== 'district' && value.scopeType !== 'building') ||
    typeof value.scopeId !== 'string' ||
    !SAFE_ID.test(value.scopeId) ||
    value.scopeId.length > 120 ||
    typeof value.evidenceId !== 'string' ||
    !SAFE_EVIDENCE_ID.test(value.evidenceId) ||
    value.evidenceId.length > 200
  ) {
    unavailable();
  }
  return Object.freeze({
    marketId: 'kr-seoul',
    scopeType: value.scopeType,
    scopeId: value.scopeId,
    evidenceId: value.evidenceId,
  });
}

function districtScope(
  request: CommunityEvidenceScope,
  repository: PublicAreaSummaryRepository | null,
): CommunityEvidenceScope {
  if (repository === null) unavailable();
  const district = getSeoulDistrictBySlug(request.scopeId);
  if (district === null) unavailable();
  const version = repository.getArtifactVersion();
  const groups: readonly PublicContractGroup[] = version === 'v2'
    ? ['all', 'new', 'renewal']
    : ['all'];
  const period = repository.getEvidenceDescriptor().period;
  const group = groups.find((candidate) => (
    request.evidenceId === `kr-seoul:${period}:area:${version}:${candidate}`
  ));
  if (group === undefined) unavailable();
  repository.getDistrictSummary(district.slug, group);
  return request;
}

function buildingScope(
  request: CommunityEvidenceScope,
  repository: PublicBuildingRepository | null,
): CommunityEvidenceScope {
  if (repository === null) unavailable();
  const route = repository.listRouteParams().find(({ buildingId }) => (
    buildingId === request.scopeId
  ));
  if (route === undefined) unavailable();
  const context = repository.getContext();
  if (
    request.evidenceId !== `kr-seoul:${context.period}:building:v1:all`
  ) {
    unavailable();
  }
  repository.getById(route.district, route.buildingId);
  return request;
}

export function resolveCommunityEvidenceScope(
  value: unknown,
  repositories: CommunityEvidenceRepositories,
): CommunityEvidenceScope {
  try {
    const request = parseRequest(value);
    return request.scopeType === 'district'
      ? districtScope(request, repositories.area)
      : buildingScope(request, repositories.building);
  } catch {
    unavailable();
  }
}
