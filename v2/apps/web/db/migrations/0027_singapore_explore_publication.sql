-- The public Explore summary is derived and verified before the release is activated.
-- Text preserves canonical bytes for the integrity digest.
ALTER TABLE singapore_publication_releases ADD COLUMN IF NOT EXISTS explore_json text;
-- statement-breakpoint
ALTER TABLE singapore_publication_releases ADD COLUMN IF NOT EXISTS explore_sha256 text CHECK (explore_sha256 IS NULL OR explore_sha256 ~ '^[a-f0-9]{64}$');
