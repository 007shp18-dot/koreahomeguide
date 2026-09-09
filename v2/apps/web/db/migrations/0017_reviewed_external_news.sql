-- Discovery is never public by itself. This separate editorial snapshot lets
-- editors publish a checked external original without inventing an internal story.
ALTER TABLE external_news_items DROP CONSTRAINT IF EXISTS external_news_items_market_id_check;
-- statement-breakpoint
ALTER TABLE external_news_items ADD CONSTRAINT external_news_items_market_id_check
  CHECK (market_id IS NULL OR market_id IN ('kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo'));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS external_news_publications (
  canonical_url text PRIMARY KEY CHECK (canonical_url LIKE 'https://%'),
  market_id text NOT NULL CHECK (market_id IN ('kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo')),
  title text NOT NULL CHECK (btrim(title) <> ''),
  summary text NOT NULL CHECK (btrim(summary) <> ''),
  publisher text NOT NULL CHECK (btrim(publisher) <> ''),
  source_published_at timestamptz NOT NULL,
  source_checked_at timestamptz NOT NULL,
  reviewed_at timestamptz NOT NULL,
  reviewed_by text NOT NULL CHECK (btrim(reviewed_by) <> ''),
  publication_state text NOT NULL DEFAULT 'published' CHECK (publication_state IN ('published', 'withdrawn')),
  title_ko text,
  summary_ko text,
  buyer_note text,
  buyer_note_ko text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
