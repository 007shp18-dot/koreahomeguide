CREATE TABLE IF NOT EXISTS hdb_building_candidates (
 id uuid PRIMARY KEY, provider_key text NOT NULL, content_hash text NOT NULL,
 snapshot_id uuid NOT NULL REFERENCES data_collection_snapshots(id),
 entity_id text REFERENCES property_entities(id), block text NOT NULL, street text NOT NULL,
 year_completed integer, max_floor_level integer, dwelling_units integer,
 residential boolean NOT NULL, town text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','rejected')),
 fetched_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider_key,content_hash)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS hdb_building_current (
 provider_key text PRIMARY KEY, content_hash text NOT NULL,
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(provider_key,content_hash) REFERENCES hdb_building_candidates(provider_key,content_hash)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS hdb_building_candidates_review ON hdb_building_candidates(status,fetched_at);
-- statement-breakpoint
ALTER TABLE hdb_building_candidates ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
-- statement-breakpoint
ALTER TABLE hdb_building_candidates DROP CONSTRAINT IF EXISTS hdb_building_candidates_status_check;
-- statement-breakpoint
ALTER TABLE hdb_building_candidates ADD CONSTRAINT hdb_building_candidates_status_check CHECK(status IN ('pending','approved','rejected'));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS hdb_building_review_audit (
 id uuid PRIMARY KEY, candidate_id uuid NOT NULL REFERENCES hdb_building_candidates(id),
 previous_version integer NOT NULL, next_version integer NOT NULL,
 previous_status text NOT NULL, next_status text NOT NULL,
 reason text NOT NULL, actor text NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS hdb_building_public (
 entity_id text PRIMARY KEY REFERENCES property_entities(id),
 candidate_id uuid NOT NULL REFERENCES hdb_building_candidates(id), published_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
ALTER TABLE hdb_building_candidates ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE hdb_building_current ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE hdb_building_review_audit ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE hdb_building_public ENABLE ROW LEVEL SECURITY;
