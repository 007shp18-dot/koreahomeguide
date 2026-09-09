-- Discovery identities are separate from the stable key requested by public pages.
ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS publication_registry_key text,
  ADD COLUMN IF NOT EXISTS candidate_source text,
  ADD COLUMN IF NOT EXISTS candidate_title text,
  ADD COLUMN IF NOT EXISTS candidate_width integer,
  ADD COLUMN IF NOT EXISTS candidate_height integer;

-- statement-breakpoint
UPDATE building_photos SET
  publication_registry_key = registry_key,
  candidate_source = CASE
    WHEN match_policy_version = 'naver-image-candidate-v1' THEN 'naver-search'
    WHEN provider = 'google-place' THEN 'google'
    WHEN source_page_url LIKE 'https://commons.wikimedia.org/%' THEN 'wikimedia'
    ELSE 'manual' END
WHERE publication_registry_key IS NULL;

-- statement-breakpoint
-- Existing approved keys and media references remain valid. Private candidates
-- are keyed by canonical building identity, so another provider can coexist.
UPDATE building_photos SET
  registry_key = 'candidate:' || candidate_source || ':' || building_key
WHERE status IN ('candidate', 'review_required', 'rejected', 'broken', 'map_only')
  AND registry_key NOT LIKE 'candidate:%';

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS building_photos_one_public_approval
  ON building_photos (publication_registry_key) WHERE status = 'approved';

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS building_photos_review_queue
  ON building_photos (candidate_source, status, id);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS building_photos_asset_candidates
  ON building_photos (asset_url) WHERE asset_url IS NOT NULL;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS building_photo_review_events (
  id bigserial PRIMARY KEY,
  photo_id bigint NOT NULL REFERENCES building_photos(id),
  decision text NOT NULL CHECK (decision IN ('approve', 'reject', 'broken')),
  actor text NOT NULL,
  note text NOT NULL,
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
ALTER TABLE building_photo_review_events ENABLE ROW LEVEL SECURITY;
