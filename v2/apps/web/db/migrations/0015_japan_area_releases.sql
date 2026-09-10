-- Japan regional evidence: no synthetic property_entities or contract dates.
INSERT INTO markets (key, name, country_code) VALUES ('jp-tokyo', 'Tokyo', 'JP')
ON CONFLICT (key) DO NOTHING;
-- statement-breakpoint
INSERT INTO rights_policies (id, can_fetch, can_store, can_cache, can_display,
  can_create_derived, can_use_commercially, can_index, attribution, policy_url, checked_at)
VALUES ('jp-mlit-xit001-pdl1-v1', true, true, true, true, true, true, true,
  '["Ministry of Land, Infrastructure, Transport and Tourism, Japan", "Edited by SignedPrice"]',
  'https://www.reinfolib.mlit.go.jp/help/termsOfUse/', '2026-09-08T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
-- statement-breakpoint
INSERT INTO datasets (id, market_id, provider, official_name, landing_url, subject_scope,
  refresh_cadence, expected_lag, schema_version, parser_version, rights_policy_id)
VALUES ('jp-mlit-transactions', 'jp-tokyo', 'MLIT Japan', 'Real Estate Information Library XIT001',
  'https://www.reinfolib.mlit.go.jp/', 'Anonymous regional transactions; classification 01 only',
  'quarterly with weekly rechecks', 'Provider publication lag; quarters may be revised',
  'xit001@1', 'xit001-area-snapshot@1', 'jp-mlit-xit001-pdl1-v1')
ON CONFLICT (id) DO NOTHING;
-- statement-breakpoint
ALTER TABLE market_data_refresh_runs DROP CONSTRAINT IF EXISTS market_data_refresh_runs_job_check;
-- statement-breakpoint
ALTER TABLE market_data_refresh_runs ADD CONSTRAINT market_data_refresh_runs_job_check CHECK
  (job IN ('kr-seoul-sale','kr-seoul-rent','sg-private-sale','sg-private-rent','ae-dubai-transaction','ae-dubai-rent','jp-tokyo-sale'));
-- statement-breakpoint
ALTER TABLE market_data_refresh_leases DROP CONSTRAINT IF EXISTS market_data_refresh_leases_job_check;
-- statement-breakpoint
ALTER TABLE market_data_refresh_leases ADD CONSTRAINT market_data_refresh_leases_job_check CHECK
  (job IN ('kr-seoul-sale','kr-seoul-rent','sg-private-sale','sg-private-rent','ae-dubai-transaction','ae-dubai-rent','jp-tokyo-sale'));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS japan_area_releases (
  id text PRIMARY KEY,
  run_id bigint NOT NULL REFERENCES market_data_refresh_runs(id),
  source_record_id bigint NOT NULL REFERENCES source_records(id),
  geography_id text NOT NULL REFERENCES geographies(id),
  city text NOT NULL CHECK (city ~ '^131(0[1-9]|1[0-9]|2[0-3])$'),
  year integer NOT NULL CHECK (year >= 2024),
  quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  period_precision text NOT NULL DEFAULT 'quarter' CHECK (period_precision = 'quarter'),
  currency_code text NOT NULL DEFAULT 'JPY' CHECK (currency_code = 'JPY'),
  expected_count integer NOT NULL CHECK (expected_count BETWEEN 0 AND 10000),
  snapshot_hash char(64) NOT NULL CHECK (snapshot_hash ~ '^[a-f0-9]{64}$'),
  raw_hash char(64) NOT NULL CHECK (raw_hash ~ '^[a-f0-9]{64}$'),
  raw_payload text NOT NULL CHECK (octet_length(raw_payload) <= 8388608),
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL,
  parser_version text NOT NULL,
  state text NOT NULL DEFAULT 'staged' CHECK (state IN ('staged','published','superseded','failed')),
  evidence_release_id text REFERENCES evidence_releases(id),
  previous_release_id text REFERENCES japan_area_releases(id),
  added_count integer,
  removed_count integer,
  retained_count integer,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, city, year, quarter)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS japan_area_records (
  release_id text NOT NULL REFERENCES japan_area_releases(id),
  record_reference text NOT NULL,
  record jsonb NOT NULL CHECK (record->>'currency' = 'JPY'
    AND record->>'periodPrecision' = 'quarter'
    AND record->>'identityPrecision' = 'anonymized_transaction'
    AND NOT record ? 'buildingId' AND NOT record ? 'observedAt'),
  PRIMARY KEY (release_id, record_reference)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS japan_area_publications (
  city text NOT NULL,
  year integer NOT NULL,
  quarter integer NOT NULL,
  release_id text NOT NULL,
  PRIMARY KEY (city, year, quarter),
  FOREIGN KEY (release_id, city, year, quarter) REFERENCES japan_area_releases(id, city, year, quarter)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS japan_area_releases_scope ON japan_area_releases(city, year, quarter, created_at DESC);
-- statement-breakpoint
-- One statement/transaction validates the complete candidate, fences stale workers,
-- publishes evidence + pointer, finishes run, releases lease. An exception rolls all back.
CREATE OR REPLACE FUNCTION activate_japan_area_release(candidate_id text, token text, allow_large_reduction boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE candidate japan_area_releases%ROWTYPE;
DECLARE prior japan_area_releases%ROWTYPE;
DECLARE retained integer;
DECLARE lease_expiry timestamptz;
BEGIN
  SELECT expires_at INTO lease_expiry FROM market_data_refresh_leases
    WHERE job = 'jp-tokyo-sale' AND lease_token = token FOR UPDATE;
  IF lease_expiry IS NULL OR lease_expiry <= clock_timestamp() THEN RAISE EXCEPTION 'lease_expired'; END IF;
  SELECT * INTO candidate FROM japan_area_releases WHERE id = candidate_id FOR UPDATE;
  IF candidate.id IS NULL OR candidate.state <> 'staged' THEN RAISE EXCEPTION 'candidate_invalid'; END IF;
  PERFORM 1 FROM market_data_refresh_runs WHERE id = candidate.run_id AND lease_token = token AND state = 'running' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'run_invalid'; END IF;
  IF (SELECT count(*) FROM japan_area_records WHERE release_id = candidate.id) <> candidate.expected_count
    OR jsonb_array_length(candidate.raw_payload::jsonb->'data') <> candidate.expected_count
    OR candidate.raw_payload::jsonb->>'status' <> 'OK'
    OR encode(sha256(convert_to(candidate.raw_payload, 'UTF8')), 'hex') <> candidate.raw_hash
    OR (SELECT encode(sha256(convert_to(COALESCE(string_agg(record_reference, E'\n' ORDER BY record_reference COLLATE "C"), ''), 'UTF8')), 'hex')
      FROM japan_area_records WHERE release_id = candidate.id) <> candidate.snapshot_hash
    THEN RAISE EXCEPTION 'candidate_incomplete'; END IF;
  SELECT r.* INTO prior FROM japan_area_publications p JOIN japan_area_releases r ON r.id = p.release_id
    WHERE p.city = candidate.city AND p.year = candidate.year AND p.quarter = candidate.quarter;
  IF prior.id IS NOT NULL AND candidate.expected_count < prior.expected_count * 0.5 AND NOT allow_large_reduction
    THEN RAISE EXCEPTION 'source_count_reduction'; END IF;
  SELECT count(*) INTO retained FROM japan_area_records n JOIN japan_area_records o
    ON n.record_reference = o.record_reference AND o.release_id = prior.id WHERE n.release_id = candidate.id;
  INSERT INTO evidence_releases (id, dataset_id, market_id, period_start, period_end,
    released_at, sample_size, rights_state, publication_state, methodology_url, limitations,
    generated_at, record_count, coverage, rights_policy_id, display_state, index_state, object_url, sha256)
  VALUES (candidate.id, 'jp-mlit-transactions', 'jp-tokyo', make_date(candidate.year, (candidate.quarter-1)*3+1, 1),
    (make_date(candidate.year, (candidate.quarter-1)*3+1, 1) + interval '3 months - 1 day')::date,
    now(), candidate.expected_count, 'approved', 'released', 'https://www.reinfolib.mlit.go.jp/',
    '["Anonymous area records, not buildings or listings", "Quarter precision; disclosed area precision", "Snapshot replacement cannot link individual corrections or cancellations"]',
    now(), candidate.expected_count, jsonb_build_object('city',candidate.city,'year',candidate.year,'quarter',candidate.quarter,'unit','area_transaction'),
    'jp-mlit-xit001-pdl1-v1', 'published', 'noindex', '/api/japan/transactions/?city=' || candidate.city || '&year=' || candidate.year || '&quarter=' || candidate.quarter || '&release=' || candidate.id, candidate.snapshot_hash);
  UPDATE japan_area_releases SET state = 'superseded' WHERE id = prior.id;
  UPDATE evidence_releases SET publication_state = 'superseded', display_state = 'withdrawn' WHERE id = prior.id;
  UPDATE japan_area_releases SET state = 'published', evidence_release_id = candidate.id,
    previous_release_id = prior.id, published_at = now(), added_count = candidate.expected_count - retained,
    removed_count = COALESCE(prior.expected_count, 0) - retained, retained_count = retained WHERE id = candidate.id;
  IF lease_expiry <= clock_timestamp() THEN RAISE EXCEPTION 'lease_expired'; END IF;
  INSERT INTO japan_area_publications VALUES (candidate.city, candidate.year, candidate.quarter, candidate.id)
    ON CONFLICT (city, year, quarter) DO UPDATE SET release_id = excluded.release_id;
  UPDATE market_data_refresh_runs SET state = 'succeeded', source_as_of = candidate.retrieved_at,
    received = candidate.expected_count, inserted = candidate.expected_count - retained,
    updated = 0, unchanged = retained, unlinked = 0, completed_at = now() WHERE id = candidate.run_id;
  -- 'updated' stays zero: the source supplies no ID to pair an old and new transaction.
  DELETE FROM market_data_refresh_leases WHERE job = 'jp-tokyo-sale' AND lease_token = token;
  RETURN candidate.id;
END $$;
