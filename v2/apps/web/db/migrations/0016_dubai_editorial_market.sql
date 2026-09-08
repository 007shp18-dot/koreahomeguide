-- Expand the existing editorial market constraint; preserve all rows and states.
ALTER TABLE content_articles DROP CONSTRAINT IF EXISTS content_articles_market_id_check;
-- statement-breakpoint
ALTER TABLE content_articles ADD CONSTRAINT content_articles_market_id_check
  CHECK (market_id IS NULL OR market_id IN ('kr-seoul', 'sg-singapore', 'ae-dubai'));
