CREATE TABLE IF NOT EXISTS morning_briefs (
  report_date date PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('running', 'completed', 'failed')),
  lease_token uuid NOT NULL,
  lease_until timestamptz NOT NULL,
  report jsonb,
  email_state text NOT NULL DEFAULT 'not-configured' CHECK (email_state IN ('not-configured', 'pending', 'accepted', 'failed')),
  email_provider_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (state <> 'completed' OR report IS NOT NULL)
);
ALTER TABLE morning_briefs ENABLE ROW LEVEL SECURITY;
