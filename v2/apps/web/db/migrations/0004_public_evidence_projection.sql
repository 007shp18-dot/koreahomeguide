ALTER TABLE evidence_releases
  ADD COLUMN IF NOT EXISTS generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS record_count integer,
  ADD COLUMN IF NOT EXISTS coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS publication_minimum integer,
  ADD COLUMN IF NOT EXISTS methodology_id text,
  ADD COLUMN IF NOT EXISTS rights_policy_id text REFERENCES rights_policies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS display_state text,
  ADD COLUMN IF NOT EXISTS index_state text,
  ADD COLUMN IF NOT EXISTS object_url text,
  ADD COLUMN IF NOT EXISTS sha256 char(64);

-- statement-breakpoint
UPDATE evidence_releases AS release
SET
  generated_at = coalesce(release.generated_at, release.released_at),
  record_count = coalesce(release.record_count, release.sample_size),
  rights_policy_id = coalesce(release.rights_policy_id, dataset.rights_policy_id),
  display_state = coalesce(
    release.display_state,
    CASE release.publication_state
      WHEN 'withheld' THEN 'withdrawn'
      WHEN 'superseded' THEN 'withdrawn'
      ELSE 'stale'
    END
  ),
  index_state = coalesce(
    release.index_state,
    CASE WHEN release.publication_state = 'released' AND release.rights_state = 'approved'
      THEN 'indexed' ELSE 'noindex' END
  )
FROM datasets AS dataset
WHERE dataset.id = release.dataset_id;

-- statement-breakpoint
ALTER TABLE evidence_releases
  ALTER COLUMN generated_at SET NOT NULL,
  ALTER COLUMN record_count SET NOT NULL,
  ALTER COLUMN display_state SET NOT NULL,
  ALTER COLUMN index_state SET NOT NULL;

-- statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evidence_release_publication_check'
  ) THEN
    ALTER TABLE evidence_releases
      ADD CONSTRAINT evidence_release_publication_check
      CHECK (
        record_count >= 0
        AND display_state IN ('published', 'stale', 'withdrawn')
        AND index_state IN ('indexed', 'noindex')
        AND (
          display_state <> 'published'
          OR (
            rights_policy_id IS NOT NULL
            AND sha256 ~ '^[a-f0-9]{64}$'
            AND object_url IS NOT NULL
          )
        )
      );
  END IF;
END $$;

-- statement-breakpoint
ALTER TABLE market_capabilities
  ADD COLUMN IF NOT EXISTS evidence_release_id text REFERENCES evidence_releases(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS public_entity_locations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  latitude double precision NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude double precision NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  precision text NOT NULL CHECK (precision IN ('rooftop', 'parcel', 'street', 'district-centroid')),
  provider text NOT NULL,
  provider_reference text,
  rights_policy_id text NOT NULL REFERENCES rights_policies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  verification_status text NOT NULL CHECK (verification_status IN ('verified', 'provisional', 'rejected')),
  verified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (verification_status <> 'verified' OR verified_at IS NOT NULL)
);

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS public_entity_locations_one_verified_location
  ON public_entity_locations (entity_id)
  WHERE verification_status = 'verified';

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS public_entity_media (
  entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  media_asset_id bigint NOT NULL REFERENCES media_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('hero', 'exterior', 'entrance', 'context')),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  display_url text,
  provider_reference text,
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  focal_x numeric(5, 4) CHECK (focal_x IS NULL OR (focal_x >= 0 AND focal_x <= 1)),
  focal_y numeric(5, 4) CHECK (focal_y IS NULL OR (focal_y >= 0 AND focal_y <= 1)),
  attribution_name text,
  attribution_url text,
  exact_subject boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL,
  last_checked_at timestamptz NOT NULL,
  CONSTRAINT public_entity_media_display_reference_check
    CHECK ((display_url IS NULL) <> (provider_reference IS NULL)),
  PRIMARY KEY (entity_id, media_asset_id, role)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS public_entity_media_display_order
  ON public_entity_media (entity_id, position, media_asset_id);

-- statement-breakpoint
INSERT INTO geographies (
  id, market_id, kind, official_name, provider_code, latitude, longitude
)
SELECT key, market_key, 'district', name, lawd_code, latitude, longitude
FROM districts
ON CONFLICT (id) DO NOTHING;

-- statement-breakpoint
INSERT INTO property_entities (
  id, market_id, geography_id, kind, canonical_name, normalized_name,
  address_text, latitude, longitude, identity_status, local_schema_version
)
SELECT
  building.key, building.market_key, building.district_key, 'building',
  building.official_name, building.normalized_name,
  coalesce(building.road_address, building.legal_address),
  building.latitude, building.longitude, building.identity_status, 'legacy-buildings-v1'
FROM buildings AS building
ON CONFLICT (id) DO NOTHING;

-- statement-breakpoint
INSERT INTO external_identifiers (entity_id, source_id, external_type, external_value, match_method)
SELECT key, 'legacy-buildings', 'building-external-id', external_id, 'legacy-backfill'
FROM buildings
ON CONFLICT (source_id, external_type, external_value) DO NOTHING;

-- statement-breakpoint
INSERT INTO rights_policies (
  id, can_fetch, can_store, can_cache, can_display, can_create_derived,
  can_use_commercially, can_index, attribution, checked_at
)
VALUES
  ('legacy-owned-media', true, true, true, true, true, true, true, '[]'::jsonb, now()),
  ('legacy-licensed-media', false, false, false, true, false, false, false, '[]'::jsonb, now()),
  ('legacy-provider-display', false, false, false, true, false, false, false, '[]'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS legacy_registry_key text;

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS media_assets_legacy_registry_key
  ON media_assets (legacy_registry_key);

-- statement-breakpoint
INSERT INTO media_assets (
  market_id, subject_entity_id, kind, subject_kind, provider, provider_place_id,
  object_reference, source_url, attribution_name, attribution_url,
  rights_policy_id, rights_state, review_state, position, checked_at,
  visual_reviewed_at, approved_at, approved_by, legacy_registry_key
)
SELECT
  building.market_key, photo.building_key, 'photograph', 'exact-property', photo.provider,
  photo.provider_place_id,
  CASE WHEN photo.provider = 'google-place' THEN NULL ELSE photo.asset_url END,
  photo.asset_url, photo.attribution_name, photo.attribution_url,
  CASE photo.provider
    WHEN 'owned-object' THEN 'legacy-owned-media'
    WHEN 'licensed-url' THEN 'legacy-licensed-media'
    ELSE 'legacy-provider-display'
  END,
  CASE photo.provider
    WHEN 'owned-object' THEN 'owned'
    WHEN 'licensed-url' THEN 'licensed'
    ELSE 'provider-display-only'
  END,
  'approved', photo.position, photo.checked_at,
  coalesce(photo.approved_at, photo.checked_at), photo.approved_at, photo.approved_by,
  photo.registry_key
FROM building_photos AS photo
INNER JOIN buildings AS building ON building.key = photo.building_key
WHERE photo.status = 'approved'
ON CONFLICT (legacy_registry_key) DO NOTHING;

-- statement-breakpoint
INSERT INTO public_entity_media (
  entity_id, media_asset_id, role, position, display_url, provider_reference,
  attribution_name, attribution_url, exact_subject, published_at, last_checked_at
)
SELECT
  asset.subject_entity_id, asset.id,
  CASE WHEN asset.position = 0 THEN 'hero' ELSE 'exterior' END,
  asset.position,
  CASE WHEN asset.provider = 'google-place' THEN NULL ELSE asset.object_reference END,
  CASE WHEN asset.provider = 'google-place' THEN asset.provider_place_id ELSE NULL END,
  asset.attribution_name, asset.attribution_url, true,
  asset.approved_at, asset.checked_at
FROM media_assets AS asset
INNER JOIN rights_policies AS rights ON rights.id = asset.rights_policy_id
WHERE asset.subject_entity_id IS NOT NULL
  AND asset.review_state = 'approved'
  AND rights.can_display = true
  AND asset.approved_at IS NOT NULL
  AND (
    (asset.provider = 'google-place' AND asset.provider_place_id IS NOT NULL)
    OR (asset.provider <> 'google-place' AND asset.object_reference IS NOT NULL)
  )
ON CONFLICT (entity_id, media_asset_id, role) DO NOTHING;
