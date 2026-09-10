-- The unique source-record identity index already covers this left-prefix lookup.
-- Removing the duplicate keeps the bounded Singapore evidence publish below the
-- database storage ceiling without changing source records or observations.
DROP INDEX IF EXISTS source_records_dataset_business_key;

-- statement-breakpoint
-- The staging primary key has the same columns in the same order.
DROP INDEX IF EXISTS nearby_place_seed_stage_generation;
