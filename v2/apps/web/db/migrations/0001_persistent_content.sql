CREATE TABLE IF NOT EXISTS signedprice_schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS markets (
  key text PRIMARY KEY,
  name text NOT NULL,
  country_code char(2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS districts (
  key text PRIMARY KEY,
  market_key text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  name text NOT NULL,
  lawd_code text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_key, name)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS buildings (
  key text PRIMARY KEY,
  market_key text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  district_key text REFERENCES districts(key) ON UPDATE CASCADE ON DELETE SET NULL,
  external_id text NOT NULL,
  official_name text NOT NULL,
  normalized_name text NOT NULL,
  legal_address text,
  road_address text,
  latitude double precision,
  longitude double precision,
  identity_status text NOT NULL DEFAULT 'unverified'
    CHECK (identity_status IN ('unverified', 'verified', 'ambiguous', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_key, external_id)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS building_aliases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  building_key text NOT NULL REFERENCES buildings(key) ON UPDATE CASCADE ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_key, normalized_alias)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS building_photos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  building_key text NOT NULL REFERENCES buildings(key) ON UPDATE CASCADE ON DELETE CASCADE,
  registry_key text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('google-place', 'licensed-url', 'owned-object')),
  provider_place_id text,
  asset_url text,
  attribution_name text,
  attribution_url text,
  status text NOT NULL DEFAULT 'review_required'
    CHECK (status IN ('candidate', 'review_required', 'approved', 'rejected', 'broken', 'map_only')),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  approved_at timestamptz,
  approved_by text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (provider = 'google-place' AND provider_place_id IS NOT NULL AND asset_url IS NULL)
    OR (provider IN ('licensed-url', 'owned-object') AND asset_url IS NOT NULL)
  ),
  CHECK (status <> 'approved' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL))
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS building_photos_approved_lookup
  ON building_photos (registry_key, position)
  WHERE status = 'approved';

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS building_facts (
  building_key text PRIMARY KEY REFERENCES buildings(key) ON UPDATE CASCADE ON DELETE CASCADE,
  apartment_source text NOT NULL,
  register_source text NOT NULL,
  kapt_code text NOT NULL,
  bjd_code text NOT NULL,
  payload jsonb NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  building_key text NOT NULL REFERENCES buildings(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  provider_record_id text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('sale', 'jeonse', 'monthly-rent')),
  contract_date date NOT NULL,
  price_krw bigint,
  deposit_krw bigint,
  monthly_rent_krw bigint,
  area_sqm numeric(10, 2) NOT NULL,
  floor integer,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_key, provider_record_id)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS transactions_building_date
  ON transactions (building_key, contract_type, contract_date DESC);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS nearby_places (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  building_key text NOT NULL REFERENCES buildings(key) ON UPDATE CASCADE ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('station', 'school', 'development')),
  provider_id text NOT NULL,
  name text NOT NULL,
  distance_meters integer CHECK (distance_meters IS NULL OR distance_meters >= 0),
  walking_minutes integer CHECK (walking_minutes IS NULL OR walking_minutes >= 0),
  latitude double precision,
  longitude double precision,
  source text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_key, kind, provider_id)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS news_articles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market_key text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  canonical_url text NOT NULL UNIQUE,
  title_hash char(64) NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  publisher text NOT NULL,
  published_at timestamptz NOT NULL,
  category text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('naver-search', 'official-rss', 'signedprice-brief')),
  evidence_status text NOT NULL DEFAULT 'checking'
    CHECK (evidence_status IN ('matched', 'no-change', 'checking', 'insufficient')),
  evidence_line text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS news_articles_market_published
  ON news_articles (market_key, published_at DESC)
  WHERE is_active = true;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS news_articles_title_hash
  ON news_articles (title_hash, published_at DESC);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS news_entity_links (
  article_id bigint NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('market', 'district', 'building', 'project')),
  entity_key text NOT NULL,
  confidence numeric(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, entity_type, entity_key)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_articles (
  slug text PRIMARY KEY,
  market_key text REFERENCES markets(key) ON UPDATE CASCADE ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  body_markdown text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pipeline text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  fetched_count integer NOT NULL DEFAULT 0 CHECK (fetched_count >= 0),
  stored_count integer NOT NULL DEFAULT 0 CHECK (stored_count >= 0),
  diagnostic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

