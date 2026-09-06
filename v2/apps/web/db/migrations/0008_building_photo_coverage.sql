CREATE TABLE IF NOT EXISTS building_photo_coverage (
  entity_id text PRIMARY KEY REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  state text NOT NULL
    CHECK (state IN ('exact-photo', 'provider-photo', 'parent-photo', 'street-view', 'unavailable')),
  building_photo_id bigint REFERENCES building_photos(id) ON UPDATE CASCADE ON DELETE SET NULL,
  parent_entity_id text REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE SET NULL,
  provider text,
  reason text,
  policy_version text NOT NULL,
  checked_at timestamptz NOT NULL,
  next_retry_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (entity_id <> coalesce(parent_entity_id, ''))
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS building_photo_coverage_retry
  ON building_photo_coverage (market_id, next_retry_at, entity_id);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS photo_provider_health (
  provider text PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('ready', 'paused', 'not-configured')),
  reason text,
  paused_until timestamptz,
  checked_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS photo_provider_daily_usage (
  provider text NOT NULL,
  usage_date date NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  estimated_cost_microusd bigint NOT NULL DEFAULT 0 CHECK (estimated_cost_microusd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, usage_date)
);

-- statement-breakpoint
ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS match_policy_version text,
  ADD COLUMN IF NOT EXISTS match_confidence numeric(5, 4),
  ADD COLUMN IF NOT EXISTS match_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provider_source_uri text,
  ADD COLUMN IF NOT EXISTS provider_checked_at timestamptz;

-- statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'building_photos_match_confidence_check'
  ) THEN
    ALTER TABLE building_photos ADD CONSTRAINT building_photos_match_confidence_check
      CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1));
  END IF;
END $$;

-- statement-breakpoint
ALTER TABLE building_enrichment_attempts
  DROP CONSTRAINT IF EXISTS building_enrichment_attempts_pipeline_check;

-- statement-breakpoint
ALTER TABLE building_enrichment_attempts
  ADD CONSTRAINT building_enrichment_attempts_pipeline_check
  CHECK (pipeline IN (
    'photo-wikimedia',
    'photo-google',
    'photo-naver-search',
    'photo-naver-panorama',
    'photo-google-street-view',
    'photo-coverage',
    'official-building-facts'
  ));
