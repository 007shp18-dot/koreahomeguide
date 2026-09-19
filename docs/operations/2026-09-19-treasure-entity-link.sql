-- APPLIED AND VERIFIED by parent on 2026-09-19.
-- Isolated branch br-floral-paper-b3ldpq9c: first run inserted 2; rerun inserted 0.
-- Production br-super-butterfly-b31hhh93: exactly 2 rows inserted.
-- Exact rollback set (no rollback performed):
-- created_at: 2026-09-19T14:46:23.893Z for both rows.
-- content_slug: treasure-at-tampines-63-to-96sqm-resale-cost-2026
-- content_slug: treasure-at-tampines-63-to-96sqm-resale-cost-2026-ko
-- entity_type: project for both.
-- entity_id: sg-singapore:project:75399f9b26e04660cdd1f9451976c82ebdfd856d6aa87c7bc9e969f57c1df9d4 for both.
-- Review on an isolated database branch before applying this bounded patch.
-- Inserts only explicit relationships for two existing reviewed articles.
-- Does not approve media, alter publication dates, rewrite article bodies, or collect data.
-- Production baseline: no content_entity_links rows at audit.
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM content_articles WHERE
    (slug = 'treasure-at-tampines-63-to-96sqm-resale-cost-2026'
      AND locale = 'en' AND md5(body_markdown) = 'cc60a7f7a79a051a37b84356f5615729')
    OR (slug = 'treasure-at-tampines-63-to-96sqm-resale-cost-2026-ko'
      AND locale = 'ko' AND md5(body_markdown) = '10334b56fcdf179f9f866e3a2e4b594f')) <> 2 THEN
    RAISE EXCEPTION 'Article baseline changed; inspect before linking';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM property_entities WHERE
    id = 'sg-singapore:project:75399f9b26e04660cdd1f9451976c82ebdfd856d6aa87c7bc9e969f57c1df9d4'
    AND market_id = 'sg-singapore' AND canonical_name = 'TREASURE AT TAMPINES'
    AND identity_status = 'verified'
    AND local_attributes->>'legacyBuildingKey' = 'singapore:project:75399f9b26e04660cdd1f9451976c82ebdfd856d6aa87c7bc9e969f57c1df9d4') THEN
    RAISE EXCEPTION 'Property identity changed; inspect before linking';
  END IF;
END $$;
INSERT INTO content_entity_links(content_slug,entity_type,entity_id,related_href)
SELECT slug,'project','sg-singapore:project:75399f9b26e04660cdd1f9451976c82ebdfd856d6aa87c7bc9e969f57c1df9d4',related_href
FROM content_articles
WHERE slug IN ('treasure-at-tampines-63-to-96sqm-resale-cost-2026','treasure-at-tampines-63-to-96sqm-resale-cost-2026-ko')
  AND editorial_status='published' AND market_id='sg-singapore'
  AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL
ON CONFLICT (content_slug,entity_type,entity_id) DO NOTHING
RETURNING content_slug,entity_type,entity_id,created_at;
COMMIT;
-- RETURNING rows were verified against the exact rollback set recorded above.
-- Treasure currently has no approved/public direct image: this relationship does
-- not make unreviewed candidate 208 or Google candidate 42308 publishable.
