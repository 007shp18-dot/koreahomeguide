CREATE TABLE IF NOT EXISTS editorial_uploaded_images (
 id uuid PRIMARY KEY,
 content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
 image_bytes bytea NOT NULL CHECK (octet_length(image_bytes) BETWEEN 1 AND 1572864),
 operator_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
