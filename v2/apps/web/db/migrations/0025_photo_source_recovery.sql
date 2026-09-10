CREATE TABLE IF NOT EXISTS photo_source_recovery (
 asset_url text PRIMARY KEY,
 source_host text NOT NULL,
 candidate_count integer NOT NULL,
 building_count integer NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','recovered','source-unresolved','retry')),
 source_page_url text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 attempted_at timestamptz,
 next_retry_at timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
