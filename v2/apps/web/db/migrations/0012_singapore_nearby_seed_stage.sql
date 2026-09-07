CREATE TABLE IF NOT EXISTS nearby_place_seed_stage (
  generation_sha256 char(64) NOT NULL,
  building_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('station', 'school')),
  provider_id text NOT NULL,
  name text NOT NULL,
  distance_meters integer CHECK (distance_meters IS NULL OR distance_meters >= 0),
  walking_minutes integer CHECK (walking_minutes IS NULL OR walking_minutes >= 0),
  latitude double precision,
  longitude double precision,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_nearest boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  evidence_sha256 char(64) NOT NULL,
  checked_at timestamptz NOT NULL,
  staged_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (generation_sha256, building_key, kind, provider_id)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS nearby_place_seed_stage_generation
  ON nearby_place_seed_stage (generation_sha256, building_key, kind, provider_id);
