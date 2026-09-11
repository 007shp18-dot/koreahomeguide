-- Allow Tokyo in the same reviewed publication path as the other markets.
ALTER TABLE content_articles DROP CONSTRAINT IF EXISTS content_articles_market_id_check;
-- statement-breakpoint
ALTER TABLE content_articles ADD CONSTRAINT content_articles_market_id_check CHECK (market_id IS NULL OR market_id IN ('kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo'));
