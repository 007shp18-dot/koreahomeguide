import 'server-only';

import { publicContentDatabase } from '../db/postgres.server';
import {
  selectPublicEntityMedia,
  type PublicEntityMedia,
  type PublicEntityMediaCandidate,
} from './entity-media-projection.server';
import {
  PUBLIC_LOCATION_PRECISIONS,
  PUBLIC_LOCATION_VERIFICATION_STATES,
  type PublicEntityLocation,
} from './public-evidence-types';

export type PublicEntityProjection = Readonly<{
  entityId: string;
  location: PublicEntityLocation | null;
  media: readonly PublicEntityMedia[];
  evidenceReleaseId: string | null;
  state: 'ready' | 'location-unverified' | 'rights-blocked' | 'unavailable';
}>;

type SqlRow = Readonly<Record<string, unknown>>;

export type PublicEntityProjectionReadPort = Readonly<{
  query(statement: string, parameters: readonly unknown[]): Promise<readonly SqlRow[]>;
}>;

const LOCATIONS_SQL = `
  /* public-entity-projection:locations */
  SELECT location.entity_id, location.market_id, location.latitude, location.longitude,
    location.precision, location.provider, location.provider_reference,
    location.rights_policy_id, location.verification_status,
    location.verified_at, location.updated_at, rights.can_display
  FROM public_entity_locations AS location
  INNER JOIN rights_policies AS rights ON rights.id = location.rights_policy_id
  WHERE location.entity_id = ANY($1::text[])
  ORDER BY location.entity_id,
    CASE location.verification_status WHEN 'verified' THEN 0 WHEN 'provisional' THEN 1 ELSE 2 END,
    location.updated_at DESC
`;

const MEDIA_SQL = `
  /* public-entity-projection:media */
  SELECT public.entity_id, public.media_asset_id, public.role, public.position,
    public.display_url, public.provider_reference, public.width, public.height,
    public.focal_x, public.focal_y, public.attribution_name, public.attribution_url,
    public.exact_subject, public.published_at, public.last_checked_at,
    media.review_state, rights.can_display
  FROM public_entity_media AS public
  INNER JOIN media_assets AS media ON media.id = public.media_asset_id
  INNER JOIN rights_policies AS rights ON rights.id = media.rights_policy_id
  WHERE public.entity_id = ANY($1::text[])
  ORDER BY public.entity_id, public.position, public.media_asset_id
`;

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed !== null && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function unitNumber(value: unknown): number | null {
  if (value === null) return null;
  const parsed = finiteNumber(value);
  return parsed !== null && parsed >= 0 && parsed <= 1 ? parsed : null;
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function stringOrNull(value: unknown): string | null | undefined {
  return value === null ? null : typeof value === 'string' ? value : undefined;
}

function locationFromRow(row: SqlRow): PublicEntityLocation | null {
  const latitude = finiteNumber(row.latitude);
  const longitude = finiteNumber(row.longitude);
  const verifiedAt = isoDate(row.verified_at);
  const updatedAt = isoDate(row.updated_at);
  if (
    typeof row.entity_id !== 'string' || row.market_id !== 'kr-seoul' ||
    latitude === null || latitude < -90 || latitude > 90 ||
    longitude === null || longitude < -180 || longitude > 180 ||
    !includes(PUBLIC_LOCATION_PRECISIONS, row.precision) || typeof row.provider !== 'string' ||
    stringOrNull(row.provider_reference) === undefined || typeof row.rights_policy_id !== 'string' ||
    !includes(PUBLIC_LOCATION_VERIFICATION_STATES, row.verification_status) ||
    row.verification_status !== 'verified' || row.can_display !== true ||
    verifiedAt === null || updatedAt === null
  ) return null;
  return Object.freeze({
    entityId: row.entity_id,
    marketId: row.market_id,
    latitude,
    longitude,
    precision: row.precision,
    provider: row.provider,
    providerReference: row.provider_reference as string | null,
    rightsPolicyId: row.rights_policy_id,
    verificationStatus: row.verification_status,
    verifiedAt,
    updatedAt,
  });
}

function mediaCandidateFromRow(row: SqlRow): PublicEntityMediaCandidate | null {
  const publishedAt = isoDate(row.published_at);
  const lastCheckedAt = isoDate(row.last_checked_at);
  const displayUrl = stringOrNull(row.display_url);
  const providerReference = stringOrNull(row.provider_reference);
  const mediaAssetId = typeof row.media_asset_id === 'string' || typeof row.media_asset_id === 'number'
    ? String(row.media_asset_id)
    : null;
  if (
    typeof row.entity_id !== 'string' || mediaAssetId === null ||
    !['hero', 'exterior', 'entrance', 'context'].includes(String(row.role)) ||
    !Number.isSafeInteger(row.position) || Number(row.position) < 0 ||
    displayUrl === undefined || providerReference === undefined ||
    !['candidate', 'review_required', 'approved', 'rejected', 'broken'].includes(String(row.review_state)) ||
    typeof row.can_display !== 'boolean' || typeof row.exact_subject !== 'boolean' ||
    publishedAt === null || lastCheckedAt === null
  ) return null;
  return Object.freeze({
    entityId: row.entity_id,
    mediaAssetId,
    role: row.role as PublicEntityMediaCandidate['role'],
    position: Number(row.position),
    displayUrl,
    providerReference,
    width: row.width === null ? null : positiveInteger(row.width),
    height: row.height === null ? null : positiveInteger(row.height),
    focalX: unitNumber(row.focal_x),
    focalY: unitNumber(row.focal_y),
    attributionName: stringOrNull(row.attribution_name) ?? null,
    attributionUrl: stringOrNull(row.attribution_url) ?? null,
    exactSubject: row.exact_subject,
    publishedAt,
    lastCheckedAt,
    reviewState: row.review_state as PublicEntityMediaCandidate['reviewState'],
    canDisplay: row.can_display,
  });
}

export function buildPublicEntityProjection(input: Readonly<{
  entityId: string;
  entityKind: 'building' | 'district';
  location: PublicEntityLocation | null;
  media: readonly PublicEntityMedia[];
  evidenceReleaseId: string | null;
  locationFailure?: 'location-unverified' | 'rights-blocked' | 'unavailable';
}>): PublicEntityProjection {
  const location = input.location !== null
    && input.location.entityId === input.entityId
    && input.location.verificationStatus === 'verified'
    && !(input.entityKind === 'building' && input.location.precision === 'district-centroid')
    ? input.location
    : null;
  const state = location !== null
    ? 'ready'
    : input.locationFailure === 'rights-blocked'
      ? 'rights-blocked'
      : input.locationFailure === 'location-unverified'
        ? 'location-unverified'
      : input.location !== null
        ? 'location-unverified'
        : 'unavailable';
  return Object.freeze({
    entityId: input.entityId,
    location,
    media: Object.freeze([...input.media]),
    evidenceReleaseId: input.evidenceReleaseId,
    state,
  });
}

export function createPublicEntityProjectionReader(
  port: PublicEntityProjectionReadPort,
): Readonly<{
  listBuildings(entityIds: readonly string[]): Promise<ReadonlyMap<string, PublicEntityProjection> | null>;
}> {
  return Object.freeze({
    async listBuildings(entityIds) {
      const ids = Object.freeze([...new Set(entityIds.filter((id) => id.trim() !== ''))].slice(0, 2_500));
      if (ids.length === 0) return new Map();
      try {
        const [locationRows, mediaRows] = await Promise.all([
          port.query(LOCATIONS_SQL, [ids]),
          port.query(MEDIA_SQL, [ids]),
        ]);
        const locationByEntity = new Map<string, SqlRow>();
        for (const row of locationRows) {
          if (typeof row.entity_id === 'string' && !locationByEntity.has(row.entity_id)) {
            locationByEntity.set(row.entity_id, row);
          }
        }
        const mediaByEntity = new Map<string, PublicEntityMediaCandidate[]>();
        for (const row of mediaRows) {
          const candidate = mediaCandidateFromRow(row);
          if (candidate === null) continue;
          const values = mediaByEntity.get(candidate.entityId) ?? [];
          values.push(candidate);
          mediaByEntity.set(candidate.entityId, values);
        }
        return new Map(ids.map((entityId) => {
          const row = locationByEntity.get(entityId);
          const location = row === undefined ? null : locationFromRow(row);
          const locationFailure = row?.verification_status === 'verified' && row.can_display === false
            ? 'rights-blocked'
            : row !== undefined ? 'location-unverified' : 'unavailable';
          return [entityId, buildPublicEntityProjection({
            entityId,
            entityKind: 'building',
            location,
            media: selectPublicEntityMedia(mediaByEntity.get(entityId) ?? []),
            evidenceReleaseId: null,
            locationFailure,
          })] as const;
        }));
      } catch {
        return null;
      }
    },
  });
}

export function publicEntityProjectionReaderFromEnvironment(): ReturnType<typeof createPublicEntityProjectionReader> | null {
  const sql = publicContentDatabase();
  if (sql === null) return null;
  return createPublicEntityProjectionReader({
    query: (statement, parameters) => sql.query(statement, [...parameters]),
  });
}
