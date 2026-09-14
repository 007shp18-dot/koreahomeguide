CREATE TABLE IF NOT EXISTS sp_qa_users (
 id uuid PRIMARY KEY, username text NOT NULL UNIQUE, nickname text NOT NULL,
 password_hash text NOT NULL, recovery_hash text NOT NULL,
 blocked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (username ~ '^[a-z0-9_]{4,24}$'), CHECK (char_length(nickname) BETWEEN 2 AND 30)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS sp_qa_sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES sp_qa_users(id),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_sessions_user ON sp_qa_sessions(user_id);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS sp_qa_posts (
 id uuid PRIMARY KEY, parent_id uuid REFERENCES sp_qa_posts(id),
 user_id uuid REFERENCES sp_qa_users(id), operator_id text,
 market text NOT NULL CHECK (market IN ('seoul','singapore','dubai','tokyo')),
 place_path text NOT NULL DEFAULT '', place_name text NOT NULL DEFAULT '',
 title text NOT NULL DEFAULT '', body text NOT NULL,
 status text NOT NULL CHECK (status IN ('published','pending','hidden','deleted')),
 review_reason text NOT NULL DEFAULT '', fingerprint text NOT NULL,
 locale text NOT NULL CHECK (locale IN ('en','ko','zh-CN')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((user_id IS NOT NULL)::integer + (operator_id IS NOT NULL)::integer = 1),
 CHECK (char_length(body) BETWEEN 5 AND 4000),
 CHECK (parent_id IS NOT NULL OR char_length(title) BETWEEN 5 AND 160)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_feed ON sp_qa_posts(market,created_at DESC,id) WHERE parent_id IS NULL AND status='published';
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_place ON sp_qa_posts(place_path,created_at DESC) WHERE parent_id IS NULL;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_replies ON sp_qa_posts(parent_id,created_at,id);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_author ON sp_qa_posts(user_id,created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_review ON sp_qa_posts(status,created_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS sp_qa_reports (
 id uuid PRIMARY KEY, post_id uuid NOT NULL REFERENCES sp_qa_posts(id),
 user_id uuid NOT NULL REFERENCES sp_qa_users(id), reason text NOT NULL,
 resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(post_id,user_id), CHECK (char_length(reason) BETWEEN 5 AND 500)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS sp_qa_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 post_id uuid REFERENCES sp_qa_posts(id), user_id uuid REFERENCES sp_qa_users(id),
 actor text NOT NULL, action text NOT NULL, reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS sp_qa_events_post ON sp_qa_events(post_id,created_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS sp_qa_rate_limits (
 key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
