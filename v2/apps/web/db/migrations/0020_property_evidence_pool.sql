CREATE TABLE IF NOT EXISTS property_pool_sources (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  url text NOT NULL UNIQUE CHECK (url LIKE 'https://%'),
  kind text NOT NULL CHECK (kind IN ('official', 'commercial', 'community', 'contributed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS property_pool_evidence (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES property_pool_sources(id),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  fingerprint text NOT NULL UNIQUE CHECK (length(fingerprint) = 64),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data->>'market' IN ('seoul', 'singapore', 'dubai')),
  CHECK (jsonb_typeof(data->'amount') = 'number')
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS property_pool_evidence_queue ON property_pool_evidence(status, created_at DESC, id);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS property_pool_evidence_market ON property_pool_evidence((data->>'market'), created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS property_pool_evidence_source ON property_pool_evidence(source_id);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS property_pool_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity text NOT NULL CHECK (entity IN ('source', 'evidence')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'corrected', 'approved', 'rejected', 'withdrawn')),
  actor text NOT NULL CHECK (length(actor) BETWEEN 1 AND 80),
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 240),
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS property_pool_events_history ON property_pool_events(entity, entity_id, id DESC);
