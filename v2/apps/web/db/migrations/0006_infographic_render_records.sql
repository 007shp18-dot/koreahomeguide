CREATE TABLE IF NOT EXISTS infographic_specs (
  id text PRIMARY KEY,
  template text NOT NULL CHECK (template IN (
    'policy-before-after', 'policy-timeline', 'district-comparison', 'market-trend', 'cost-structure'
  )),
  locale text NOT NULL CHECK (locale IN ('en', 'ko', 'zh-CN')),
  title text NOT NULL,
  spec_hash char(64) NOT NULL CHECK (spec_hash ~ '^[a-f0-9]{64}$'),
  spec_json jsonb NOT NULL,
  evidence_release_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(evidence_release_ids) = 'array' AND jsonb_array_length(evidence_release_ids) > 0)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS infographic_renders (
  id text PRIMARY KEY,
  infographic_id text NOT NULL REFERENCES infographic_specs(id) ON UPDATE CASCADE ON DELETE CASCADE,
  renderer_version text NOT NULL,
  spec_hash char(64) NOT NULL CHECK (spec_hash ~ '^[a-f0-9]{64}$'),
  width integer NOT NULL CHECK (width >= 320),
  height integer NOT NULL CHECK (height >= 180),
  format text NOT NULL CHECK (format = 'png'),
  generated_at timestamptz NOT NULL,
  object_url text NOT NULL CHECK (object_url ~ '^https://'),
  ownership text NOT NULL CHECK (ownership = 'owned'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (infographic_id, spec_hash, width, height, format)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS infographic_render_evidence (
  render_id text NOT NULL REFERENCES infographic_renders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  evidence_release_id text NOT NULL REFERENCES evidence_releases(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (render_id, evidence_release_id)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_infographic_links (
  content_slug text NOT NULL REFERENCES content_articles(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  infographic_id text NOT NULL REFERENCES infographic_specs(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_slug, infographic_id)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS infographic_render_lookup
  ON infographic_renders (infographic_id, generated_at DESC);
