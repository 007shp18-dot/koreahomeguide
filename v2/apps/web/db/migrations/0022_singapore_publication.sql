CREATE TABLE IF NOT EXISTS singapore_publication_releases (
  id text PRIMARY KEY,
  source_as_of timestamptz NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  sale_count integer NOT NULL CHECK (sale_count > 0),
  rent_count integer NOT NULL CHECK (rent_count >= 0),
  payload_gzip_base64 text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$')
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS singapore_publication_active (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  release_id text NOT NULL REFERENCES singapore_publication_releases(id)
);

-- statement-breakpoint
ALTER TABLE singapore_publication_releases ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE singapore_publication_active ENABLE ROW LEVEL SECURITY;
