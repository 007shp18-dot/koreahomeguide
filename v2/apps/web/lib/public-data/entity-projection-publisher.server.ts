import 'server-only';

type SqlRow = Readonly<Record<string, unknown>>;

export type PublicEntityProjectionSqlPort = Readonly<{
  query(statement: string, parameters?: readonly unknown[]): Promise<readonly SqlRow[]>;
}>;

export type PublicEntityProjectionPublishResult = Readonly<{
  published: number;
  provisional: number;
  rejected: number;
  rightsBlocked: number;
  mediaPublished: number;
}>;

const REFRESH_LOCATIONS_SQL = `
  /* public-entity-projection:refresh-locations */
  INSERT INTO public_entity_locations (
    entity_id, market_id, latitude, longitude, precision, provider,
    provider_reference, rights_policy_id, verification_status, verified_at, updated_at
  )
  SELECT
    entity.id, entity.market_id, entity.latitude, entity.longitude,
    entity.local_attributes ->> 'locationPrecision',
    entity.local_attributes ->> 'locationProvider',
    nullif(entity.local_attributes ->> 'locationProviderReference', ''),
    entity.local_attributes ->> 'locationRightsPolicyId',
    'verified', entity.updated_at, now()
  FROM property_entities AS entity
  INNER JOIN rights_policies AS rights
    ON rights.id = entity.local_attributes ->> 'locationRightsPolicyId'
  WHERE entity.market_id = 'kr-seoul'
    AND entity.kind = 'building'
    AND entity.identity_status = 'verified'
    AND entity.latitude IS NOT NULL
    AND entity.longitude IS NOT NULL
    AND entity.local_attributes ->> 'locationVerificationStatus' = 'verified'
    AND entity.local_attributes ->> 'locationPrecision' IN ('rooftop', 'parcel', 'street')
    AND nullif(entity.local_attributes ->> 'locationProvider', '') IS NOT NULL
  ON CONFLICT (entity_id) WHERE verification_status = 'verified'
  DO UPDATE SET
    market_id = excluded.market_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    precision = excluded.precision,
    provider = excluded.provider,
    provider_reference = excluded.provider_reference,
    rights_policy_id = excluded.rights_policy_id,
    verified_at = excluded.verified_at,
    updated_at = now()
`;

const REFRESH_MEDIA_SQL = `
  /* public-entity-projection:refresh-media */
  INSERT INTO public_entity_media (
    entity_id, media_asset_id, role, position, display_url, provider_reference,
    attribution_name, attribution_url, exact_subject, published_at, last_checked_at
  )
  SELECT
    media.subject_entity_id,
    media.id,
    CASE WHEN media.position = 0 THEN 'hero' ELSE 'exterior' END,
    media.position,
    CASE WHEN media.provider = 'google-place' THEN NULL ELSE media.object_reference END,
    CASE WHEN media.provider = 'google-place' THEN media.provider_place_id ELSE NULL END,
    media.attribution_name,
    media.attribution_url,
    media.subject_kind = 'exact-property',
    media.approved_at,
    media.checked_at
  FROM media_assets AS media
  INNER JOIN rights_policies AS rights ON rights.id = media.rights_policy_id
  WHERE media.market_id = 'kr-seoul'
    AND media.subject_entity_id IS NOT NULL
    AND media.review_state = 'approved'
    AND rights.can_display = true
    AND media.approved_at IS NOT NULL
    AND (
      (media.provider = 'google-place' AND media.provider_place_id IS NOT NULL)
      OR (media.provider <> 'google-place' AND media.object_reference IS NOT NULL)
    )
  ON CONFLICT (entity_id, media_asset_id, role)
  DO UPDATE SET
    position = excluded.position,
    display_url = excluded.display_url,
    provider_reference = excluded.provider_reference,
    attribution_name = excluded.attribution_name,
    attribution_url = excluded.attribution_url,
    exact_subject = excluded.exact_subject,
    published_at = excluded.published_at,
    last_checked_at = excluded.last_checked_at
`;

const COUNTS_SQL = `
  /* public-entity-projection:counts */
  SELECT
    count(*) FILTER (
      WHERE location.verification_status = 'verified' AND rights.can_display = true
    )::text AS published,
    count(*) FILTER (WHERE location.verification_status = 'provisional')::text AS provisional,
    count(*) FILTER (WHERE location.verification_status = 'rejected')::text AS rejected,
    count(*) FILTER (
      WHERE location.verification_status = 'verified' AND rights.can_display = false
    )::text AS rights_blocked,
    (
      SELECT count(*)::text FROM public_entity_media AS media
      INNER JOIN property_entities AS entity ON entity.id = media.entity_id
      WHERE entity.market_id = 'kr-seoul'
    ) AS media_published
  FROM public_entity_locations AS location
  INNER JOIN rights_policies AS rights ON rights.id = location.rights_policy_id
  WHERE location.market_id = 'kr-seoul'
`;

function count(value: unknown): number {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)$/u.test(value)) {
    throw new TypeError('Invalid public entity projection count.');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new TypeError('Invalid public entity projection count.');
  return parsed;
}

export function createPublicEntityProjectionPublisher(
  port: PublicEntityProjectionSqlPort,
): Readonly<{ publishSeoul(): Promise<PublicEntityProjectionPublishResult> }> {
  return Object.freeze({
    async publishSeoul() {
      await port.query(REFRESH_LOCATIONS_SQL);
      await port.query(REFRESH_MEDIA_SQL);
      const [row] = await port.query(COUNTS_SQL);
      if (row === undefined) throw new TypeError('Public entity projection counts unavailable.');
      return Object.freeze({
        published: count(row.published),
        provisional: count(row.provisional),
        rejected: count(row.rejected),
        rightsBlocked: count(row.rights_blocked),
        mediaPublished: count(row.media_published),
      });
    },
  });
}
