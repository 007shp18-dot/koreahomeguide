-- Aggregate counts only: no raw events, exact inputs, browser IDs or consent records.
CREATE TABLE IF NOT EXISTS tool_usage_daily (
  day date NOT NULL,
  tool text NOT NULL CHECK (tool IN ('passport', 'property-scenario', 'single-quote', 'offer-compare', 'rent-check', 'singapore-check', 'dubai-check')),
  market text NOT NULL CHECK (market IN ('global', 'kr-seoul', 'sg-singapore', 'ae-dubai')),
  completions bigint NOT NULL CHECK (completions >= 0 AND completions <= 10000000),
  PRIMARY KEY (day, tool, market)
);
-- statement-breakpoint
ALTER TABLE tool_usage_daily ENABLE ROW LEVEL SECURITY;
