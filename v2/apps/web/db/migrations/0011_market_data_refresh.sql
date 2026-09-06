INSERT INTO rights_policies (
  id, can_fetch, can_store, can_cache, can_display, can_create_derived,
  can_use_commercially, can_index, attribution, policy_url, checked_at
)
VALUES
  (
    'sg-ura-private-rent-v1', true, true, true, true, true, true, true,
    '["Urban Redevelopment Authority"]'::jsonb,
    'https://www.ura.gov.sg/Corporate/Terms-of-Use', now()
  ),
  (
    'ae-dubai-pulse-open-data-v1', true, true, true, false, true, true, false,
    '["Dubai Land Department", "Dubai Pulse"]'::jsonb,
    'https://www.dubaipulse.gov.ae/data-policy', now()
  )
ON CONFLICT (id) DO NOTHING;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS market_data_refresh_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job text NOT NULL CHECK (job IN (
    'kr-seoul-sale', 'kr-seoul-rent', 'sg-private-sale',
    'sg-private-rent', 'ae-dubai-transaction', 'ae-dubai-rent'
  )),
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  dataset_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('running', 'succeeded', 'failed', 'skipped')),
  lease_token text NOT NULL,
  source_as_of timestamptz,
  received integer NOT NULL DEFAULT 0 CHECK (received >= 0),
  inserted integer NOT NULL DEFAULT 0 CHECK (inserted >= 0),
  updated integer NOT NULL DEFAULT 0 CHECK (updated >= 0),
  unchanged integer NOT NULL DEFAULT 0 CHECK (unchanged >= 0),
  unlinked integer NOT NULL DEFAULT 0 CHECK (unlinked >= 0),
  error_code text CHECK (
    error_code IS NULL OR error_code ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK ((state = 'running') = (completed_at IS NULL))
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS market_data_refresh_runs_job_started
  ON market_data_refresh_runs (job, started_at DESC);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS market_data_refresh_leases (
  job text PRIMARY KEY CHECK (job IN (
    'kr-seoul-sale', 'kr-seoul-rent', 'sg-private-sale',
    'sg-private-rent', 'ae-dubai-transaction', 'ae-dubai-rent'
  )),
  lease_token text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
