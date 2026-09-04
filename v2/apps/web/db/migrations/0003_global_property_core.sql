INSERT INTO markets (key, name, country_code)
VALUES
  ('kr-seoul', 'Seoul', 'KR'),
  ('sg-singapore', 'Singapore', 'SG'),
  ('ae-dubai', 'Dubai', 'AE')
ON CONFLICT (key) DO UPDATE SET
  name = excluded.name,
  country_code = excluded.country_code,
  updated_at = now();

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS geographies (
  id text PRIMARY KEY,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  parent_id text REFERENCES geographies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('city', 'region', 'district', 'planning-area', 'town', 'neighborhood', 'community')),
  official_name text NOT NULL,
  localized_names jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_code text,
  latitude double precision,
  longitude double precision,
  boundary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id),
  UNIQUE (market_id, kind, provider_code)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS property_entities (
  id text PRIMARY KEY,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  geography_id text REFERENCES geographies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  parent_id text REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('master-development', 'project', 'estate', 'building', 'block', 'unit', 'land-parcel')),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  address_text text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  housing_sector text CHECK (housing_sector IS NULL OR housing_sector IN ('hdb', 'private_residential')),
  property_class text,
  completion_date date,
  completion_precision text CHECK (completion_precision IS NULL OR completion_precision IN ('day', 'month', 'year')),
  identity_status text NOT NULL DEFAULT 'unverified' CHECK (identity_status IN ('unverified', 'verified', 'ambiguous', 'rejected')),
  local_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  local_schema_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS property_entities_market_geography
  ON property_entities (market_id, geography_id, kind);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS entity_aliases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  locale text,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, source_id, normalized_alias)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS external_identifiers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  source_id text NOT NULL,
  external_type text NOT NULL,
  external_value text NOT NULL,
  match_confidence numeric(5, 4) CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1)),
  match_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_type, external_value),
  UNIQUE (entity_id, source_id, external_type)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS rights_policies (
  id text PRIMARY KEY,
  can_fetch boolean NOT NULL DEFAULT false,
  can_store boolean NOT NULL DEFAULT false,
  can_cache boolean NOT NULL DEFAULT false,
  can_display boolean NOT NULL DEFAULT false,
  can_create_derived boolean NOT NULL DEFAULT false,
  can_use_commercially boolean NOT NULL DEFAULT false,
  can_index boolean NOT NULL DEFAULT false,
  attribution jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_url text,
  checked_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS datasets (
  id text PRIMARY KEY,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  provider text NOT NULL,
  official_name text NOT NULL,
  landing_url text NOT NULL,
  subject_scope text NOT NULL,
  refresh_cadence text,
  expected_lag text,
  schema_version text NOT NULL,
  parser_version text NOT NULL,
  rights_policy_id text NOT NULL REFERENCES rights_policies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS source_records (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_id text NOT NULL REFERENCES datasets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  business_key text NOT NULL,
  content_hash char(64) NOT NULL,
  object_reference text,
  observed_at timestamptz,
  raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_id, business_key, content_hash)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  subject_entity_id text NOT NULL REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  source_record_id bigint NOT NULL REFERENCES source_records(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('sale', 'rent', 'valuation', 'mortgage', 'gift', 'listing-ask')),
  stage text,
  observed_at date NOT NULL,
  registered_at date,
  period_start date,
  period_end date,
  amount_minor bigint,
  annual_amount_minor bigint,
  currency_code char(3) NOT NULL,
  deposit_minor bigint,
  recurring_amount_minor bigint,
  frequency text CHECK (frequency IS NULL OR frequency IN ('once', 'monthly', 'quarterly', 'annual')),
  property_area_sqm numeric(12, 3),
  transacted_area_sqm numeric(12, 3),
  area_basis text,
  floor_value integer,
  floor_range text,
  bedrooms numeric(4, 1),
  rooms numeric(4, 1),
  tenure_kind text,
  tenure_start date,
  tenure_end date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'corrected', 'superseded')),
  local_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  local_schema_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_record_id, subject_entity_id, kind)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS observations_entity_date
  ON observations (subject_entity_id, kind, observed_at DESC)
  WHERE status = 'active';

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS evidence_releases (
  id text PRIMARY KEY,
  dataset_id text NOT NULL REFERENCES datasets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  period_start date NOT NULL,
  period_end date NOT NULL,
  released_at timestamptz NOT NULL,
  sample_size integer NOT NULL CHECK (sample_size >= 0),
  rights_state text NOT NULL CHECK (rights_state IN ('approved', 'limited', 'rights_blocked')),
  publication_state text NOT NULL CHECK (publication_state IN ('draft', 'released', 'withheld', 'superseded')),
  methodology_url text,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  CHECK (publication_state <> 'released' OR rights_state <> 'rights_blocked')
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS metric_definitions (
  id text PRIMARY KEY,
  label text NOT NULL,
  unit text NOT NULL,
  formula text NOT NULL,
  frequency text NOT NULL,
  seasonally_adjusted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS metric_observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  metric_definition_id text NOT NULL REFERENCES metric_definitions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  evidence_release_id text NOT NULL REFERENCES evidence_releases(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  geography_id text REFERENCES geographies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  subject_entity_id text REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  value_numeric numeric,
  value_text text,
  sample_size integer CHECK (sample_size IS NULL OR sample_size >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((value_numeric IS NULL) <> (value_text IS NULL)),
  CHECK (period_end >= period_start)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS market_capabilities (
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('market_overview', 'explore', 'check', 'property_detail', 'transaction_detail', 'research')),
  housing_sector text NOT NULL DEFAULT 'all' CHECK (housing_sector IN ('all', 'hdb', 'private_residential')),
  state text NOT NULL CHECK (state IN ('available', 'limited', 'rights_blocked')),
  public_href text,
  label text NOT NULL,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (market_id, feature, housing_sector),
  CHECK (state <> 'rights_blocked' OR public_href IS NULL)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS media_assets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  subject_entity_id text REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photograph', 'streetview', 'map', 'floor-plan')),
  subject_kind text NOT NULL CHECK (subject_kind IN ('exact-property', 'parent-project', 'market-editorial', 'street-context', 'map-only')),
  provider text NOT NULL,
  provider_place_id text,
  object_reference text,
  source_url text,
  attribution_name text,
  attribution_url text,
  rights_policy_id text NOT NULL REFERENCES rights_policies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  rights_state text NOT NULL CHECK (rights_state IN ('owned', 'licensed', 'provider-display-only', 'review-required')),
  review_state text NOT NULL DEFAULT 'candidate' CHECK (review_state IN ('candidate', 'review_required', 'approved', 'rejected', 'broken')),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  checked_at timestamptz NOT NULL DEFAULT now(),
  visual_reviewed_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (review_state <> 'approved' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL AND visual_reviewed_at IS NOT NULL)),
  CHECK (subject_kind <> 'exact-property' OR subject_entity_id IS NOT NULL),
  CHECK (provider <> 'google-place' OR (provider_place_id IS NOT NULL AND object_reference IS NULL))
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS media_assets_public_lookup
  ON media_assets (market_id, subject_entity_id, subject_kind, position)
  WHERE review_state = 'approved';
