CREATE TABLE signedprice_evidence_responses (
  market_id text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('district', 'building')),
  scope_id text NOT NULL,
  evidence_id text NOT NULL,
  respondent_key text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('HIGHER', 'SIMILAR', 'LOWER')),
  reason text NULL CHECK (
    reason IS NULL OR reason IN ('LINE', 'ASPECT', 'FLOOR', 'REMODEL', 'VIEW', 'NOISE', 'OTHER')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (market_id, scope_type, scope_id, evidence_id, respondent_key)
);

CREATE INDEX signedprice_evidence_responses_scope_idx
  ON signedprice_evidence_responses (market_id, scope_type, scope_id, evidence_id);
