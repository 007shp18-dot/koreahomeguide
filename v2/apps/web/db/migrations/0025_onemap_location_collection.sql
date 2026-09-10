INSERT INTO rights_policies (
  id, can_fetch, can_store, can_cache, can_display, can_create_derived,
  can_use_commercially, can_index, attribution, policy_url, checked_at, updated_at
)
VALUES (
  'sg-onemap-search-v1', true, true, true, true, true, true, true,
  '["Contains information from OneMap Singapore, licensed under the Singapore Open Data Licence v1.0."]'::jsonb,
  'https://www.onemap.gov.sg/legal/opendatalicence.html',
  '2026-09-09T00:00:00Z'::timestamptz,
  '2026-09-09T00:00:00Z'::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
  can_fetch = excluded.can_fetch,
  can_store = excluded.can_store,
  can_cache = excluded.can_cache,
  can_display = excluded.can_display,
  can_create_derived = excluded.can_create_derived,
  can_use_commercially = excluded.can_use_commercially,
  can_index = excluded.can_index,
  attribution = excluded.attribution,
  policy_url = excluded.policy_url,
  checked_at = excluded.checked_at,
  updated_at = excluded.updated_at;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS onemap_location_candidates (
  id uuid PRIMARY KEY,
  provider_key text NOT NULL CHECK (
    octet_length(provider_key) BETWEEN 1 AND 512
  ),
  content_hash char(64) NOT NULL CHECK (
    content_hash ~ '^[a-f0-9]{64}$'
  ),
  entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  block text NOT NULL CHECK (octet_length(btrim(block)) BETWEEN 1 AND 64),
  street text NOT NULL CHECK (octet_length(btrim(street)) BETWEEN 1 AND 256),
  address_text text NOT NULL CHECK (octet_length(btrim(address_text)) BETWEEN 1 AND 512),
  postal_code text CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{6}$'),
  latitude double precision NOT NULL CHECK (latitude BETWEEN 1.15 AND 1.50),
  longitude double precision NOT NULL CHECK (longitude BETWEEN 103.55 AND 104.10),
  raw_result jsonb NOT NULL CHECK (
    jsonb_typeof(raw_result) = 'object'
    AND octet_length(raw_result::text) BETWEEN 2 AND 32768
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_key, content_hash)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS onemap_location_current (
  provider_key text PRIMARY KEY CHECK (
    octet_length(provider_key) BETWEEN 1 AND 512
  ),
  content_hash char(64) NOT NULL CHECK (
    content_hash ~ '^[a-f0-9]{64}$'
  ),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (provider_key, content_hash)
    REFERENCES onemap_location_candidates(provider_key, content_hash)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS onemap_location_attempts (
  provider_key text PRIMARY KEY CHECK (
    octet_length(provider_key) BETWEEN 1 AND 512
  ),
  entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  last_attempt_at timestamptz NOT NULL,
  next_due_at timestamptz NOT NULL,
  status text NOT NULL CHECK (
    status IN ('exact', 'no_result', 'ambiguous', 'error')
  ),
  result_count integer NOT NULL DEFAULT 0 CHECK (result_count BETWEEN 0 AND 100),
  last_error text CHECK (
    last_error IS NULL OR octet_length(last_error) BETWEEN 1 AND 512
  ),
  CHECK (next_due_at >= last_attempt_at),
  CHECK ((status = 'error') OR last_error IS NULL)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS onemap_location_review_audit (
  id uuid PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES onemap_location_candidates(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  previous_version integer NOT NULL CHECK (previous_version >= 1),
  next_version integer NOT NULL CHECK (next_version = previous_version + 1),
  previous_status text NOT NULL CHECK (
    previous_status IN ('pending', 'approved', 'rejected')
  ),
  next_status text NOT NULL CHECK (
    next_status IN ('approved', 'rejected')
  ),
  reason text NOT NULL CHECK (octet_length(btrim(reason)) BETWEEN 3 AND 2000),
  actor text NOT NULL CHECK (octet_length(btrim(actor)) BETWEEN 1 AND 320),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS onemap_location_candidates_review
  ON onemap_location_candidates (status, fetched_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS onemap_location_candidates_entity
  ON onemap_location_candidates (entity_id, fetched_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS onemap_location_current_seen
  ON onemap_location_current (last_seen_at);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS onemap_location_attempts_due
  ON onemap_location_attempts (next_due_at, status);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS onemap_location_review_audit_candidate
  ON onemap_location_review_audit (candidate_id, reviewed_at DESC);

-- statement-breakpoint
ALTER TABLE onemap_location_candidates ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE onemap_location_current ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE onemap_location_attempts ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE onemap_location_review_audit ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE
  onemap_location_candidates,
  onemap_location_current,
  onemap_location_attempts,
  onemap_location_review_audit
FROM PUBLIC;
