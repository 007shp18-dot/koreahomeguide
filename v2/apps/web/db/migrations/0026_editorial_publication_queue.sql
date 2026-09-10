CREATE TABLE IF NOT EXISTS editorial_publication_queue (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE,
 payload jsonb NOT NULL,
 version integer NOT NULL DEFAULT 1,
 state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','scheduled','publishing','refreshing','published','failed','cancelled')),
 scheduled_at timestamptz,
 lease_until timestamptz,
 attempts integer NOT NULL DEFAULT 0,
 error_code text,
 operator_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS editorial_publication_due ON editorial_publication_queue (scheduled_at) WHERE state IN ('scheduled','publishing','refreshing');
