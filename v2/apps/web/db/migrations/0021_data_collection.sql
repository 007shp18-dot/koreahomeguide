CREATE TABLE IF NOT EXISTS data_collection_state (
 source_id text PRIMARY KEY, next_due_at timestamptz NOT NULL DEFAULT now(),
 lease_token uuid, lease_until timestamptz, last_attempt_at timestamptz, last_success_at timestamptz,
 last_hash text, last_bytes integer, consecutive_failures integer NOT NULL DEFAULT 0,
 last_error text, anomaly text, new_count integer NOT NULL DEFAULT 0, changed_count integer NOT NULL DEFAULT 0
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS data_collection_snapshots (
 id uuid PRIMARY KEY, source_id text NOT NULL REFERENCES data_collection_state(source_id),
 source_url text NOT NULL CHECK(source_url LIKE 'https://%'), content_hash text NOT NULL, content text NOT NULL, content_type text NOT NULL, byte_count integer NOT NULL,
 fetched_at timestamptz NOT NULL DEFAULT now(), previous_snapshot_id uuid REFERENCES data_collection_snapshots(id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','rejected')),
 reviewed_at timestamptz, reviewer text, review_reason text,
 CHECK(byte_count BETWEEN 1 AND 2000000)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS data_collection_snapshots_source ON data_collection_snapshots(source_id,fetched_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS data_collection_runs (
 id uuid PRIMARY KEY, source_id text NOT NULL REFERENCES data_collection_state(source_id),
 started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 status text NOT NULL CHECK(status IN ('running','new','changed','unchanged','failed')),
 error_code text, byte_count integer, anomaly text
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS data_collection_runs_source ON data_collection_runs(source_id,started_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS data_collection_probes (
 source_id text PRIMARY KEY, result jsonb NOT NULL, checked_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS data_collection_tariff_links (
 provider_key text PRIMARY KEY, evidence_id uuid NOT NULL REFERENCES property_pool_evidence(id),
 snapshot_id uuid NOT NULL REFERENCES data_collection_snapshots(id), updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
ALTER TABLE data_collection_state ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE data_collection_snapshots ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE data_collection_runs ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE data_collection_probes ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE data_collection_tariff_links ENABLE ROW LEVEL SECURITY;
