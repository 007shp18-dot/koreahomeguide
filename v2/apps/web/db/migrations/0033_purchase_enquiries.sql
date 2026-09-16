CREATE TABLE IF NOT EXISTS purchase_enquiries (
  id uuid PRIMARY KEY,
  payload_hash text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'done')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS purchase_enquiries_inbox_idx ON purchase_enquiries (status, created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS purchase_enquiries_expiry_idx ON purchase_enquiries (expires_at);
-- statement-breakpoint
ALTER TABLE purchase_enquiries ENABLE ROW LEVEL SECURITY;
