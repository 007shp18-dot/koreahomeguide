CREATE TABLE IF NOT EXISTS tool_research_submissions (
  id uuid PRIMARY KEY,
  owner_hash text NOT NULL CHECK (owner_hash ~ '^[0-9a-f]{64}$'),
  retry_id uuid NOT NULL,
  scenario_hash text NOT NULL CHECK (scenario_hash ~ '^[0-9a-f]{64}$'),
  schema_version smallint NOT NULL CHECK (schema_version = 1),
  source text NOT NULL CHECK (source = 'user_scenario'),
  purpose text NOT NULL CHECK (purpose = 'product_research'),
  consent_version text NOT NULL CHECK (consent_version = 'tool-research-consent-2026-09-09'),
  consent_granted_at timestamptz NOT NULL,
  tool text NOT NULL CHECK (tool IN (
    'passport', 'property-scenario', 'single-quote', 'offer-compare',
    'rent-check', 'singapore-check', 'dubai-check'
  )),
  market text NOT NULL CHECK (market IN ('global', 'kr-seoul', 'sg-singapore', 'ae-dubai')),
  currency text NOT NULL CHECK (currency IN ('KRW', 'SGD', 'AED', 'USD')),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  submission_date date NOT NULL,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT tool_research_retention_window CHECK (
    expires_at = created_at + interval '90 days'
  ),
  CONSTRAINT tool_research_owner_day_scenario UNIQUE (
    owner_hash, submission_date, scenario_hash
  ),
  CONSTRAINT tool_research_owner_retry UNIQUE (owner_hash, retry_id),
  CONSTRAINT tool_research_consent_time CHECK (consent_granted_at = created_at),
  CONSTRAINT tool_research_market_currency CHECK (
    (tool = 'passport' AND market = 'global' AND currency IN ('KRW', 'SGD', 'AED', 'USD'))
    OR (tool = 'property-scenario' AND (
      (market = 'kr-seoul' AND currency = 'KRW')
      OR (market = 'sg-singapore' AND currency = 'SGD')
      OR (market = 'ae-dubai' AND currency = 'AED')
    ))
    OR (tool IN ('single-quote', 'offer-compare', 'rent-check') AND market = 'kr-seoul' AND currency = 'KRW')
    OR (tool = 'singapore-check' AND market = 'sg-singapore' AND currency = 'SGD')
    OR (tool = 'dubai-check' AND market = 'ae-dubai' AND currency = 'AED')
  )
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS tool_research_submissions_expiry_idx
  ON tool_research_submissions (expires_at);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS tool_research_submissions_summary_idx
  ON tool_research_submissions (market, tool, expires_at);

-- statement-breakpoint
ALTER TABLE tool_research_submissions ENABLE ROW LEVEL SECURITY;
