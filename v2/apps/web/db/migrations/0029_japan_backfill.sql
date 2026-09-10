-- Operator/cron progress only. Provider absence is scoped and expires; it is
-- never a public zero-transaction publication or proof an entire quarter is absent.
CREATE TABLE IF NOT EXISTS japan_backfill_attempts (
  city text NOT NULL CHECK (city ~ '^131(0[1-9]|1[0-9]|2[0-3])$'),
  year integer NOT NULL CHECK (year >= 2024),
  quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  state text NOT NULL CHECK (state IN ('running','ready','no_data','failed','busy')),
  checked_at timestamptz NOT NULL DEFAULT now(),
  retry_after timestamptz NOT NULL,
  error_code text,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  PRIMARY KEY (city, year, quarter)
);
-- statement-breakpoint
ALTER TABLE japan_backfill_attempts ENABLE ROW LEVEL SECURITY;
