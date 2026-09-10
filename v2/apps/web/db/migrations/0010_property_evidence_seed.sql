CREATE UNIQUE INDEX IF NOT EXISTS metric_observations_seed_identity
  ON metric_observations (
    metric_definition_id,
    evidence_release_id,
    subject_entity_id,
    period_start,
    period_end
  )
  WHERE subject_entity_id IS NOT NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS observations_market_entity_date
  ON observations (market_id, subject_entity_id, observed_at DESC)
  WHERE status = 'active';

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS source_records_dataset_business_key
  ON source_records (dataset_id, business_key);
