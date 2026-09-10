ALTER TABLE news_articles
  DROP CONSTRAINT IF EXISTS news_articles_source_kind_check;

-- statement-breakpoint
ALTER TABLE news_articles
  ADD CONSTRAINT news_articles_source_kind_check
  CHECK (source_kind IN ('naver-search', 'google-news-rss', 'official-rss', 'signedprice-brief'));

-- statement-breakpoint
ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS subject_kind text NOT NULL DEFAULT 'building-exterior'
    CHECK (subject_kind IN ('building-exterior', 'building-front', 'site-aerial', 'map-only'));

-- statement-breakpoint
ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS rights_status text NOT NULL DEFAULT 'provider-display-only'
    CHECK (rights_status IN ('owned', 'licensed', 'provider-display-only', 'review-required'));

-- statement-breakpoint
ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS source_page_url text;

-- statement-breakpoint
ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS visual_reviewed_at timestamptz;
