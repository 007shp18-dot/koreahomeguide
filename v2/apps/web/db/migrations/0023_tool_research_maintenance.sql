-- Deliberately retains only job health, never historical user contribution counts.
CREATE TABLE IF NOT EXISTS tool_research_maintenance (
  id text PRIMARY KEY CHECK (id = 'daily'),
  last_aggregated_at timestamptz NOT NULL
);
-- statement-breakpoint
ALTER TABLE tool_research_maintenance ENABLE ROW LEVEL SECURITY;
