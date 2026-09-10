CREATE TABLE IF NOT EXISTS building_enrichment_attempts (
  building_key text NOT NULL REFERENCES buildings(key) ON UPDATE CASCADE ON DELETE CASCADE,
  pipeline text NOT NULL CHECK (pipeline IN ('photo-wikimedia', 'photo-google', 'official-building-facts')),
  status text NOT NULL CHECK (status IN ('succeeded', 'no-candidate', 'provider-error', 'not-configured')),
  reason text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (building_key, pipeline)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS building_enrichment_attempts_retry
  ON building_enrichment_attempts (pipeline, next_retry_at, attempted_at);

-- statement-breakpoint
ALTER TABLE nearby_places
  ADD COLUMN IF NOT EXISTS lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_nearest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_sha256 char(64);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS nearby_places_building_distance
  ON nearby_places (building_key, kind, distance_meters, provider_id);
