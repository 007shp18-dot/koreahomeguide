import { neon } from '@neondatabase/serverless';

await import('./seed-property-core.mjs');

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) process.exit(0);

const sql = neon(connectionString);
const districtNameSql = `CASE entity.local_attributes ->> 'districtSlug'
  WHEN 'jongno-gu' THEN '종로구'
  WHEN 'jung-gu' THEN '중구'
  WHEN 'yongsan-gu' THEN '용산구'
  WHEN 'seongdong-gu' THEN '성동구'
  WHEN 'gwangjin-gu' THEN '광진구'
  WHEN 'dongdaemun-gu' THEN '동대문구'
  WHEN 'jungnang-gu' THEN '중랑구'
  WHEN 'seongbuk-gu' THEN '성북구'
  WHEN 'gangbuk-gu' THEN '강북구'
  WHEN 'dobong-gu' THEN '도봉구'
  WHEN 'nowon-gu' THEN '노원구'
  WHEN 'eunpyeong-gu' THEN '은평구'
  WHEN 'seodaemun-gu' THEN '서대문구'
  WHEN 'mapo-gu' THEN '마포구'
  WHEN 'yangcheon-gu' THEN '양천구'
  WHEN 'gangseo-gu' THEN '강서구'
  WHEN 'guro-gu' THEN '구로구'
  WHEN 'geumcheon-gu' THEN '금천구'
  WHEN 'yeongdeungpo-gu' THEN '영등포구'
  WHEN 'dongjak-gu' THEN '동작구'
  WHEN 'gwanak-gu' THEN '관악구'
  WHEN 'seocho-gu' THEN '서초구'
  WHEN 'gangnam-gu' THEN '강남구'
  WHEN 'songpa-gu' THEN '송파구'
  WHEN 'gangdong-gu' THEN '강동구'
END`;

await sql.query(`
  WITH candidates AS (
    SELECT building.key,
      concat_ws(' ',
        '서울특별시',
        ${districtNameSql},
        geography.official_name,
        CASE
          WHEN building.official_name ~ '^\\((산?[0-9]+(?:-[0-9]+)?)\\)$'
            THEN regexp_replace(building.official_name, '^\\((산?[0-9]+(?:-[0-9]+)?)\\)$', '\\1')
          ELSE building.official_name
        END
      ) AS address
    FROM buildings AS building
    INNER JOIN property_entities AS entity
      ON entity.id = 'kr-seoul:estate:' || building.external_id
    INNER JOIN geographies AS geography ON geography.id = entity.geography_id
    WHERE building.market_key = 'seoul'
      AND building.identity_status = 'verified'
      AND entity.market_id = 'kr-seoul'
      AND ${districtNameSql} IS NOT NULL
  )
  UPDATE buildings AS building
  SET legal_address = candidates.address,
      updated_at = now()
  FROM candidates
  WHERE building.key = candidates.key
    AND building.legal_address IS DISTINCT FROM candidates.address
`);

await sql.query(`
  UPDATE property_entities AS entity
  SET address_text = building.legal_address,
      updated_at = now()
  FROM buildings AS building
  WHERE entity.id = 'kr-seoul:estate:' || building.external_id
    AND building.market_key = 'seoul'
    AND building.legal_address IS NOT NULL
    AND entity.address_text IS DISTINCT FROM building.legal_address
`);

const [counts] = await sql.query(`
  SELECT
    count(*) FILTER (WHERE market_key = 'seoul')::int AS seoul,
    count(*) FILTER (WHERE market_key = 'seoul' AND legal_address IS NOT NULL)::int AS seoul_with_address,
    count(*) FILTER (WHERE market_key = 'singapore')::int AS singapore
  FROM buildings
`);

process.stdout.write(`${JSON.stringify({ state: 'seed-postprocessed', ...counts })}\n`);
