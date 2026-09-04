-- External headlines are an internal discovery queue. They never own a public route.
CREATE TABLE IF NOT EXISTS external_news_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market_id text CHECK (market_id IS NULL OR market_id IN ('kr-seoul', 'sg-singapore')),
  canonical_url text NOT NULL UNIQUE,
  title_hash char(64) NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  publisher text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('naver-search', 'google-news-rss', 'official-rss')),
  source_published_at timestamptz NOT NULL,
  category_hint text,
  review_state text NOT NULL DEFAULT 'new'
    CHECK (review_state IN ('new', 'triaged', 'linked', 'rejected')),
  linked_content_slug text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS external_news_items_review_queue
  ON external_news_items (review_state, source_published_at DESC)
  WHERE is_active = true;

-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en'
  CHECK (locale IN ('en', 'ko', 'zh-CN'));
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'data-story'
  CHECK (content_type IN ('news-brief', 'policy-update', 'market-brief', 'data-story', 'guide'));
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS market_id text
  CHECK (market_id IS NULL OR market_id IN ('kr-seoul', 'sg-singapore'));
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS editorial_status text NOT NULL DEFAULT 'draft'
  CHECK (editorial_status IN ('draft', 'fact-check', 'review', 'scheduled', 'published', 'archived'));
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS evidence_state text NOT NULL DEFAULT 'partial'
  CHECK (evidence_state IN ('verified', 'partial', 'not-applicable', 'withdrawn'));
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS author_name text NOT NULL DEFAULT 'SignedPrice Data Desk';
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS reviewed_by text;
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS related_href text;
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS revision_note text;
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
-- statement-breakpoint
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS translation_group_id text;

-- statement-breakpoint
UPDATE content_articles
SET editorial_status = CASE status
  WHEN 'published' THEN 'published'
  WHEN 'review' THEN 'review'
  WHEN 'archived' THEN 'archived'
  ELSE 'draft'
END,
market_id = CASE market_key
  WHEN 'seoul' THEN 'kr-seoul'
  WHEN 'singapore' THEN 'sg-singapore'
  ELSE NULL
END
WHERE editorial_status = 'draft';

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_sources (
  id text PRIMARY KEY,
  source_kind text NOT NULL CHECK (source_kind IN ('primary', 'secondary')),
  publisher text NOT NULL,
  title text NOT NULL,
  canonical_url text NOT NULL,
  published_at timestamptz,
  checked_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_url, title)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_source_links (
  content_slug text NOT NULL REFERENCES content_articles(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES content_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  claim_scope text NOT NULL DEFAULT 'article',
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_slug, source_id, claim_scope)
);

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS content_source_links_primary_source
  ON content_source_links (content_slug, position)
  WHERE claim_scope = 'primary';

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_entity_links (
  content_slug text NOT NULL REFERENCES content_articles(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('market', 'district', 'building', 'project', 'policy')),
  entity_id text NOT NULL,
  related_href text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_slug, entity_type, entity_id)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_slug text NOT NULL REFERENCES content_articles(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  title text NOT NULL,
  summary text NOT NULL,
  body_markdown text NOT NULL,
  revision_note text NOT NULL,
  reviewed_at timestamptz NOT NULL,
  reviewed_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_slug, revision_number)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS content_articles_public_lookup
  ON content_articles (locale, content_type, market_id, published_at DESC)
  WHERE editorial_status = 'published'
    AND evidence_state <> 'withdrawn'
    AND reviewed_at IS NOT NULL
    AND reviewed_by IS NOT NULL;

-- statement-breakpoint
INSERT INTO external_news_items (
  market_id, canonical_url, title_hash, title, summary, publisher, source_kind,
  source_published_at, category_hint, review_state, first_seen_at, last_seen_at,
  is_active, created_at, updated_at
)
SELECT
  CASE market_key WHEN 'seoul' THEN 'kr-seoul' WHEN 'singapore' THEN 'sg-singapore' ELSE NULL END,
  canonical_url, title_hash, title, summary, publisher,
  CASE source_kind WHEN 'signedprice-brief' THEN 'official-rss' ELSE source_kind END,
  published_at, category, 'new', first_seen_at, last_seen_at, is_active, created_at, updated_at
FROM news_articles
WHERE source_kind IN ('naver-search', 'google-news-rss', 'official-rss', 'signedprice-brief')
ON CONFLICT (canonical_url) DO NOTHING;
