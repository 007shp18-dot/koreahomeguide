-- Extend the existing discovery taxonomy; retain every current record and constraint.
ALTER TABLE external_news_items
  DROP CONSTRAINT external_news_items_market_id_check,
  ADD CONSTRAINT external_news_items_market_id_check
    CHECK (market_id IS NULL OR market_id IN ('kr-seoul', 'sg-singapore', 'ae-dubai'));
